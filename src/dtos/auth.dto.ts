import { AppError } from "../utils/AppError";

function ensureString(value: unknown, fieldName: string) {
  if (typeof value !== "string" || value.trim().length === 0) {
    throw new AppError(`${fieldName} is required.`, 400);
  }

  return value.trim();
}

function ensureEmail(value: unknown) {
  const email = ensureString(value, "email").toLowerCase();

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    throw new AppError("email must be a valid email address.", 400);
  }

  return email;
}

function ensurePassword(value: unknown) {
  const password = ensureString(value, "password");

  if (password.length < 8) {
    throw new AppError("password must contain at least 8 characters.", 400);
  }

  return password;
}

export function parseRegisterRequest(payload: unknown) {
  const input = (payload ?? {}) as Record<string, unknown>;

  return {
    name: ensureString(input.name, "name"),
    email: ensureEmail(input.email),
    password: ensurePassword(input.password),
  };
}

export function parseLoginRequest(payload: unknown) {
  const input = (payload ?? {}) as Record<string, unknown>;

  return {
    email: ensureEmail(input.email),
    password: ensurePassword(input.password),
  };
}
