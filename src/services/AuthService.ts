import { signToken } from "../config/jwt";
import { SafeUser } from "../entities/User";
import { UserRepository } from "../repositories/UserRepository";
import { createAppError } from "../utils/AppError";
import { hashPassword, verifyPassword } from "../utils/password";

function sanitizeUser(user: {
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

function issueToken(user: { id: string; email: string; name: string; role: string }) {
  return signToken({
    sub: user.id,
    email: user.email,
    name: user.name,
    role: user.role,
  });
}

export function createAuthService(userRepository: UserRepository) {
  const register = (payload: { name: string; email: string; password: string }) => {
    if (userRepository.findByEmail(payload.email)) {
      throw createAppError("An account with this email already exists.", 409);
    }

    const user = userRepository.create({
      name: payload.name,
      email: payload.email.toLowerCase(),
      passwordHash: hashPassword(payload.password),
      role: "CUSTOMER",
    });

    return {
      user: sanitizeUser(user),
      token: issueToken(user),
    };
  };

  const login = (payload: { email: string; password: string }) => {
    const user = userRepository.findByEmail(payload.email);

    if (!user || !verifyPassword(payload.password, user.passwordHash)) {
      throw createAppError("The supplied email or password is incorrect.", 401);
    }

    return {
      user: sanitizeUser(user),
      token: issueToken(user),
    };
  };

  const getProfile = (userId: string) => {
    const user = userRepository.findById(userId);

    if (!user) {
      throw createAppError("User profile not found.", 404);
    }

    return sanitizeUser(user);
  };

  return {
    register,
    login,
    getProfile,
  };
}

export type AuthService = ReturnType<typeof createAuthService>;
