// Barrel export y factory para crear instancias con DI
export * from "./types";
export { PasswordService, passwordService } from "./password.service";
export { TokenService, tokenService } from "./token.service";
export { UserRepository, userRepository } from "./user.repository";
export { AuthService } from "./auth.service";

// Factory para crear AuthService con dependencias predeterminadas
import { AuthService } from "./auth.service";
import { passwordService } from "./password.service";
import { tokenService } from "./token.service";
import { userRepository } from "./user.repository";

export const authService = new AuthService(
  passwordService,
  tokenService,
  userRepository
);
