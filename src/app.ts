import express from "express";

import { initializeDatabase } from "./config/database";
import { AdminController } from "./controllers/AdminController";
import { AuthController } from "./controllers/AuthController";
import { BookingController } from "./controllers/BookingController";
import { errorHandler } from "./middleware/errorHandler";
import { requestLogger } from "./middleware/requestLogger";
import { BookingRepository } from "./repositories/BookingRepository";
import { ServiceRepository } from "./repositories/ServiceRepository";
import { UserRepository } from "./repositories/UserRepository";
import { buildAdminRoutes } from "./routes/admin.routes";
import { buildAuthRoutes } from "./routes/auth.routes";
import { buildBookingRoutes } from "./routes/booking.routes";
import { AdminService } from "./services/AdminService";
import { AuthService } from "./services/AuthService";
import { BookingService } from "./services/BookingService";

export function createApp() {
  initializeDatabase();

  const userRepository = new UserRepository();
  const serviceRepository = new ServiceRepository();
  const bookingRepository = new BookingRepository();

  const authService = new AuthService(userRepository);
  const bookingService = new BookingService(
    bookingRepository,
    serviceRepository,
    userRepository,
  );
  const adminService = new AdminService(
    bookingRepository,
    serviceRepository,
    userRepository,
  );

  const authController = new AuthController(authService);
  const bookingController = new BookingController(bookingService);
  const adminController = new AdminController(adminService);

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
