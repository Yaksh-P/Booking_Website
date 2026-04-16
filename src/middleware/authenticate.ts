import { NextFunction, Request, Response } from "express";

import { AuthTokenPayload, verifyToken } from "../config/jwt";
import { AppError } from "../utils/AppError";

export interface AuthenticatedRequest extends Request {
  currentUser?: AuthTokenPayload;
}

function extractBearerToken(request: Request) {
  const authorizationHeader = request.headers.authorization;
  if (!authorizationHeader) {
    return undefined;
  }

  const [scheme, token] = authorizationHeader.split(" ");
  if (scheme !== "Bearer" || !token) {
    throw new AppError("Authorization header must use the Bearer scheme.", 401);
  }

  return token;
}

function attachUser(request: AuthenticatedRequest) {
  const token = extractBearerToken(request);
  if (!token) {
    throw new AppError("Authentication is required for this endpoint.", 401);
  }

  request.currentUser = verifyToken(token);
}

export function authenticate(
  request: AuthenticatedRequest,
  _response: Response,
  next: NextFunction,
) {
  try {
    attachUser(request);
    next();
  } catch (error) {
    next(error);
  }
}

export function authenticateOptional(
  request: AuthenticatedRequest,
  _response: Response,
  next: NextFunction,
) {
  try {
    const token = extractBearerToken(request);
    if (token) {
      request.currentUser = verifyToken(token);
    }
    next();
  } catch (error) {
    next(error);
  }
}
