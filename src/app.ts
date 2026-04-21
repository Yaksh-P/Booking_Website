import express from "express";

import { initializeDatabase } from "./config/database";
import { createAdminController } from "./controllers/AdminController";
import { createAuthController } from "./controllers/AuthController";
import { createBookingController } from "./controllers/BookingController";
import { errorHandler } from "./middleware/errorHandler";
import { requestLogger } from "./middleware/requestLogger";
import { createBookingRepository } from "./repositories/BookingRepository";
import { createServiceRepository } from "./repositories/ServiceRepository";
import { createUserRepository } from "./repositories/UserRepository";
import { buildAdminRoutes } from "./routes/admin.routes";
import { buildAuthRoutes } from "./routes/auth.routes";
import { buildBookingRoutes } from "./routes/booking.routes";
import { createAdminService } from "./services/AdminService";
import { createAuthService } from "./services/AuthService";
import { createBookingService } from "./services/BookingService";

export function createApp() {
  initializeDatabase();

  const userRepository = createUserRepository();
  const serviceRepository = createServiceRepository();
  const bookingRepository = createBookingRepository();

  const authService = createAuthService(userRepository);
  const bookingService = createBookingService(
    bookingRepository,
    serviceRepository,
    userRepository,
  );
  const adminService = createAdminService(
    bookingRepository,
    serviceRepository,
    userRepository,
  );

  const authController = createAuthController(authService);
  const bookingController = createBookingController(bookingService);
  const adminController = createAdminController(adminService);

  const app = express();

  app.use(express.json());
  app.use(requestLogger);

  app.get("/health", (_req, res) => {
    res.status(200).json({
      success: true,
      data: {
        status: "ok",
        service: "booking-web-application-api",
        timestamp: new Date().toISOString(),
      },
    });
  });

  app.use("/api/auth", buildAuthRoutes(authController));
  app.use("/api/bookings", buildBookingRoutes(bookingController));
  app.use("/api/admin", buildAdminRoutes(adminController));

  app.use(errorHandler);

  return app;
}
