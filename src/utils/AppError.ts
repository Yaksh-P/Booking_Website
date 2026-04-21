export interface AppError extends Error {
  statusCode: number;
  isOperational: true;
}

export function createAppError(message: string, statusCode: number): AppError {
  const error = new Error(message) as AppError;
  error.name = "AppError";
  error.statusCode = statusCode;
  error.isOperational = true;
  return error;
}

export function isAppError(error: unknown): error is AppError {
  return (
    error instanceof Error &&
    "statusCode" in error &&
    "isOperational" in error &&
    (error as { isOperational?: unknown }).isOperational === true
  );
}
