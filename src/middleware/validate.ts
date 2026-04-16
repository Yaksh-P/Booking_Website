import { NextFunction, Request, Response } from "express";

export interface ValidatedRequest<T = unknown> extends Request {
  validated?: T;
}

export function validate<T>(
  parser: (input: unknown) => T,
  source: "body" | "query" | "params" = "body",
) {
  return (request: ValidatedRequest<T>, _response: Response, next: NextFunction) => {
    try {
      request.validated = parser(request[source]);
      next();
    } catch (error) {
      next(error);
    }
  };
}
