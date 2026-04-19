import { NextFunction, Request, Response } from "express";

import { logger } from "../config/logger";
import { AppError } from "../utils/AppError";

export function errorHandler(
  error: Error,
  request: Request,
  response: Response,
  _next: NextFunction,
) {
  const isOperationalError = error instanceof AppError;
  const statusCode = isOperationalError ? error.statusCode : 500;

  logger.error(error.message, {
    path: request.originalUrl,
    method: request.method,
    statusCode,
    stack: error.stack,
  });

  response.status(statusCode).json({
    success: false,
    error: {
      message: isOperationalError
        ? error.message
        : "An unexpected server error occurred. Please try again later.",
      statusCode,
    },
  });
}
