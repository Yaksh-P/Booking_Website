import { Router } from "express";

import { BookingController } from "../controllers/BookingController";
import {
  parseCancelBookingRequest,
  parseCreateBookingRequest,
} from "../dtos/booking.dto";
import { authenticate, authenticateOptional } from "../middleware/authenticate";
import { validate } from "../middleware/validate";

export function buildBookingRoutes(controller: BookingController) {
  const router = Router();

  router.get("/services", controller.listServices);
  router.get("/availability", controller.getAvailability);
  router.post("/", authenticateOptional, validate(parseCreateBookingRequest), controller.createBooking);
  router.get("/me", authenticate, controller.listMyBookings);
  router.get("/lookup/:reference", controller.lookupGuestBooking);
  router.patch("/:id/cancel", authenticateOptional, validate(parseCancelBookingRequest), controller.cancelBooking);

  return router;
}
