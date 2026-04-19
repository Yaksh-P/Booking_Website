import { Router } from "express";

import { AdminController } from "../controllers/AdminController";
import {
  parseCreateTimeSlotRequest,
  parseEditBookingRequest,
  parseUpdateBookingStatusRequest,
} from "../dtos/admin.dto";
import { authenticate } from "../middleware/authenticate";
import { authorize } from "../middleware/authorize";
import { validate } from "../middleware/validate";

export function buildAdminRoutes(controller: AdminController) {
  const router = Router();

  router.use(authenticate, authorize("ADMIN"));

  router.get("/bookings", controller.listBookings);
  router.get("/analytics", controller.getAnalytics);
  router.patch(
    "/bookings/:id/status",
    validate(parseUpdateBookingStatusRequest),
    controller.updateBookingStatus,
  );
  router.patch("/bookings/:id", validate(parseEditBookingRequest), controller.editBooking);
  router.post("/slots", validate(parseCreateTimeSlotRequest), controller.createTimeSlot);

  return router;
}
