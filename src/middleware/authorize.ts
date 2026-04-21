import { NextFunction, Response } from "express";

import { createAppError } from "../utils/AppError";
import { AuthenticatedRequest } from "./authenticate";

export function authorize(...roles: string[]) {
  return (request: AuthenticatedRequest, _response: Response, next: NextFunction) => {
    if (!request.currentUser) {
      next(createAppError("Authentication is required for this endpoint.", 401));
      return;
    }

    if (!roles.includes(request.currentUser.role)) {
      next(createAppError("You do not have permission to access this resource.", 403));
      return;
    }

    next();
  };
}
