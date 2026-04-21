import { Response } from "express";

import { parseLoginRequest, parseRegisterRequest } from "../dtos/auth.dto";
import { AuthenticatedRequest } from "../middleware/authenticate";
import { ValidatedRequest } from "../middleware/validate";
import { AuthService } from "../services/AuthService";

export function createAuthController(authService: AuthService) {
  const register = (req: ValidatedRequest, res: Response) => {
    const payload = req.validated as ReturnType<typeof parseRegisterRequest>;
    const result = authService.register(payload);

    res.status(201).json({
      success: true,
      message: "Registration successful.",
      data: result,
    });
  };

  const login = (req: ValidatedRequest, res: Response) => {
    const payload = req.validated as ReturnType<typeof parseLoginRequest>;
    const result = authService.login(payload);

    res.status(200).json({
      success: true,
      message: "Login successful.",
      data: result,
    });
  };

  const me = (req: AuthenticatedRequest, res: Response) => {
    const user = authService.getProfile(req.currentUser?.sub ?? "");

    res.status(200).json({
      success: true,
      data: user,
    });
  };

  return {
    register,
    login,
    me,
  };
}

export type AuthController = ReturnType<typeof createAuthController>;
