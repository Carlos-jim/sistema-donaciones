import type { Prisma } from "@prisma/client";

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

export type AuthRole = "COMUN" | "SUPERVISOR" | "FARMACIA" | "ADMIN";

export type TokenTipo =
  | "COMUN"
  | "ENTE_SALUD"
  | "SUPERVISOR"
  | "FARMACIA"
  | "ADMIN";

export interface TokenPayload {
  userId: string;
  email: string;
  tipo: TokenTipo;
  role?: AuthRole;
  nombre?: string;
  farmaciaId?: string;
  adminRole?: string;
}

export interface UserEntity {
  id: string;
  nombre: string;
  email: string;
  password: string;
  telefono: string | null;
  direccion: Prisma.JsonValue | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateUserData {
  nombre: string;
  email: string;
  password: string;
  telefono?: string;
  direccion?: Prisma.InputJsonValue;
}

export interface RegisterData {
  nombre: string;
  email: string;
  password: string;
  telefono?: string;
  direccion?: Prisma.InputJsonValue;
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

export type SafeUser = Omit<UserEntity, "password">;
