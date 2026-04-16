import { Response } from "express";

import { parseLoginRequest, parseRegisterRequest } from "../dtos/auth.dto";
import { AuthenticatedRequest } from "../middleware/authenticate";
import { ValidatedRequest } from "../middleware/validate";
import { AuthService } from "../services/AuthService";

export class AuthController {
  constructor(private readonly authService: AuthService) {}

  register = (req: ValidatedRequest, res: Response) => {
    const payload = req.validated as ReturnType<typeof parseRegisterRequest>;
    const result = this.authService.register(payload);

    res.status(201).json({
      success: true,
      message: "Registration successful.",
      data: result,
    });
  };

  login = (req: ValidatedRequest, res: Response) => {
    const payload = req.validated as ReturnType<typeof parseLoginRequest>;
    const result = this.authService.login(payload);

    res.status(200).json({
      success: true,
      message: "Login successful.",
      data: result,
    });
  };

  me = (req: AuthenticatedRequest, res: Response) => {
    const user = this.authService.getProfile(req.currentUser?.sub ?? "");

    res.status(200).json({
      success: true,
      data: user,
    });
  };
}
