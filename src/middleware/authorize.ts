import { NextFunction, Response } from "express";

import { AppError } from "../utils/AppError";
import { AuthenticatedRequest } from "./authenticate";

export function authorize(...roles: string[]) {
  return (request: AuthenticatedRequest, _response: Response, next: NextFunction) => {
    if (!request.currentUser) {
      next(new AppError("Authentication is required for this endpoint.", 401));
      return;
    }

    if (!roles.includes(request.currentUser.role)) {
      next(new AppError("You do not have permission to access this resource.", 403));
      return;
    }

    next();
  };
}
