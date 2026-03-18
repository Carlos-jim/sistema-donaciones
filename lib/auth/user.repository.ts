// Repositorio de usuarios - Single Responsibility: solo operaciones de BD
import prisma from "@/lib/prisma";
import type { IUserRepository, UserEntity, CreateUserData } from "./types";

export class UserRepository implements IUserRepository {
  async findByEmail(email: string): Promise<UserEntity | null> {
    return prisma.usuarioComun.findUnique({
      where: { email },
    });
  }

  async findById(id: string): Promise<UserEntity | null> {
    return prisma.usuarioComun.findUnique({
      where: { id },
    });
  }

  async create(data: CreateUserData): Promise<UserEntity> {
    return prisma.usuarioComun.create({
      data: {
        nombre: data.nombre,
        email: data.email,
        password: data.password,
        telefono: data.telefono,
        direccion: data.direccion,
      },
    });
  }
}

// Singleton para uso directo
export const userRepository = new UserRepository();
