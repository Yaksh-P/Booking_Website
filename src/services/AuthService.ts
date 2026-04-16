import { signToken } from "../config/jwt";
import { SafeUser } from "../entities/User";
import { UserRepository } from "../repositories/UserRepository";
import { AppError } from "../utils/AppError";
import { hashPassword, verifyPassword } from "../utils/password";

export class AuthService {
  constructor(private readonly userRepository: UserRepository) {}

  register(payload: { name: string; email: string; password: string }) {
    if (this.userRepository.findByEmail(payload.email)) {
      throw new AppError("An account with this email already exists.", 409);
    }

    const user = this.userRepository.create({
      name: payload.name,
      email: payload.email.toLowerCase(),
      passwordHash: hashPassword(payload.password),
      role: "CUSTOMER",
    });

    return {
      user: this.sanitizeUser(user),
      token: this.issueToken(user),
    };
  }

  login(payload: { email: string; password: string }) {
    const user = this.userRepository.findByEmail(payload.email);

    if (!user || !verifyPassword(payload.password, user.passwordHash)) {
      throw new AppError("The supplied email or password is incorrect.", 401);
    }

    return {
      user: this.sanitizeUser(user),
      token: this.issueToken(user),
    };
  }

  getProfile(userId: string) {
    const user = this.userRepository.findById(userId);

    if (!user) {
      throw new AppError("User profile not found.", 404);
    }

    return this.sanitizeUser(user);
  }

  private sanitizeUser(user: {
    id: string;
    name: string;
    email: string;
    role: string;
    createdAt: string;
  }): SafeUser {
    return {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role as SafeUser["role"],
      createdAt: user.createdAt,
    };
  }

  private issueToken(user: { id: string; email: string; name: string; role: string }) {
    return signToken({
      sub: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
    });
  }
}
