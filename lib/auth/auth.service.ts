// Servicio de autenticación - Orquesta los demás servicios
// Dependency Inversion: depende de abstracciones (interfaces)
import type {
  IAuthService,
  IPasswordService,
  ITokenService,
  IUserRepository,
  RegisterData,
  LoginData,
  AuthResult,
  SafeUser,
} from "./types";

export class AuthService implements IAuthService {
  constructor(
    private passwordService: IPasswordService,
    private tokenService: ITokenService,
    private userRepository: IUserRepository
  ) {}

  async register(data: RegisterData): Promise<AuthResult> {
    // Verificar si el usuario ya existe
    const existingUser = await this.userRepository.findByEmail(data.email);
    if (existingUser) {
      return {
        success: false,
        error: "El correo electrónico ya está registrado",
      };
    }

    // Validar contraseña
    if (data.password.length < 8) {
      return {
        success: false,
        error: "La contraseña debe tener al menos 8 caracteres",
      };
    }

    // Hash de contraseña
    const hashedPassword = await this.passwordService.hash(data.password);

    // Crear usuario
    const user = await this.userRepository.create({
      ...data,
      password: hashedPassword,
    });

    // Generar token
    const token = await this.tokenService.generate({
      userId: user.id,
      email: user.email,
      tipo: "COMUN",
    });

    // Retornar usuario sin password
    const safeUser: SafeUser = {
      id: user.id,
      nombre: user.nombre,
      email: user.email,
      telefono: user.telefono,
      direccion: user.direccion,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    };

    return {
      success: true,
      user: safeUser,
      token,
    };
  }

  async login(data: LoginData): Promise<AuthResult> {
    // Buscar usuario
    const user = await this.userRepository.findByEmail(data.email);
    if (!user) {
      return {
        success: false,
        error: "Credenciales inválidas",
      };
    }

    // Verificar contraseña
    const isValidPassword = await this.passwordService.verify(
      data.password,
      user.password
    );
    if (!isValidPassword) {
      return {
        success: false,
        error: "Credenciales inválidas",
      };
    }

    // Generar token
    const token = await this.tokenService.generate({
      userId: user.id,
      email: user.email,
      tipo: "COMUN",
    });

    // Retornar usuario sin password
    const safeUser: SafeUser = {
      id: user.id,
      nombre: user.nombre,
      email: user.email,
      telefono: user.telefono,
      direccion: user.direccion,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    };

    return {
      success: true,
      user: safeUser,
      token,
    };
  }
}
