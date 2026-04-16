import { Router } from "express";

import { AuthController } from "../controllers/AuthController";
import { parseLoginRequest, parseRegisterRequest } from "../dtos/auth.dto";
import { authenticate } from "../middleware/authenticate";
import { validate } from "../middleware/validate";

export function buildAuthRoutes(controller: AuthController) {
  const router = Router();

  router.post("/register", validate(parseRegisterRequest), controller.register);
  router.post("/login", validate(parseLoginRequest), controller.login);
  router.get("/me", authenticate, controller.me);

  return router;
}
