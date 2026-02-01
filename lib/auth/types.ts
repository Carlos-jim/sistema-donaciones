// Tipos e interfaces para el sistema de autenticación
// Siguiendo el principio de Interface Segregation (I de SOLID)

export interface IPasswordService {
  hash(password: string): Promise<string>;
  verify(password: string, hashedPassword: string): Promise<boolean>;
}

export interface ITokenService {
  generate(payload: TokenPayload): Promise<string>;
  verify(token: string): Promise<TokenPayload | null>;
}

export interface IUserRepository {
  findByEmail(email: string): Promise<UserEntity | null>;
  create(data: CreateUserData): Promise<UserEntity>;
  findById(id: string): Promise<UserEntity | null>;
}

export interface IAuthService {
  register(data: RegisterData): Promise<AuthResult>;
  login(data: LoginData): Promise<AuthResult>;
}

// DTOs y entidades
export interface TokenPayload {
  userId: string;
  email: string;
  tipo: "COMUN" | "ENTE_SALUD";
  nombre?: string; // Optional: include name in token for easy access
}

export interface UserEntity {
  id: string;
  nombre: string;
  email: string;
  password: string;
  telefono: string | null;
  direccion: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateUserData {
  nombre: string;
  email: string;
  password: string;
  telefono?: string;
  direccion?: string;
}

export interface RegisterData {
  nombre: string;
  email: string;
  password: string;
  telefono?: string;
  direccion?: string;
}

export interface LoginData {
  email: string;
  password: string;
}

export interface AuthResult {
  success: boolean;
  user?: Omit<UserEntity, "password">;
  token?: string;
  error?: string;
}

// Tipo para usuario sin password (para respuestas)
export type SafeUser = Omit<UserEntity, "password">;
