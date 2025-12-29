// Servicio de contraseñas - Single Responsibility: solo maneja hashing
import bcrypt from "bcryptjs";
import type { IPasswordService } from "./types";

const SALT_ROUNDS = 12;

export class PasswordService implements IPasswordService {
  async hash(password: string): Promise<string> {
    return bcrypt.hash(password, SALT_ROUNDS);
  }

  async verify(password: string, hashedPassword: string): Promise<boolean> {
    return bcrypt.compare(password, hashedPassword);
  }
}

// Singleton para uso directo
export const passwordService = new PasswordService();
