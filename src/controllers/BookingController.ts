import { Response } from "express";

import {
  parseAvailabilityQuery,
  parseCancelBookingRequest,
  parseCreateBookingRequest,
} from "../dtos/booking.dto";
import { AuthenticatedRequest } from "../middleware/authenticate";
import { ValidatedRequest } from "../middleware/validate";
import { BookingService } from "../services/BookingService";

export function createBookingController(bookingService: BookingService) {
  const listServices = (_req: AuthenticatedRequest, res: Response) => {
    res.status(200).json({
      success: true,
      data: bookingService.listServices(),
    });
  };

  const getAvailability = (req: AuthenticatedRequest, res: Response) => {
    const query = parseAvailabilityQuery(req.query);

    res.status(200).json({
      success: true,
      data: bookingService.getAvailability(query),
    });
  };

  const createBooking = (req: AuthenticatedRequest & ValidatedRequest, res: Response) => {
    const payload = req.validated as ReturnType<typeof parseCreateBookingRequest>;

    const booking = bookingService.createBooking(payload, req.currentUser);

    res.status(201).json({
      success: true,
      message: "Booking request submitted successfully.",
      data: booking,
    });
  };

  const listMyBookings = (req: AuthenticatedRequest, res: Response) => {
    const bookings = bookingService.listBookingsForUser(req.currentUser?.sub ?? "");

    res.status(200).json({
      success: true,
      data: bookings,
    });
  };

  const lookupGuestBooking = (req: AuthenticatedRequest, res: Response) => {
    const booking = bookingService.lookupGuestBooking(
      String(req.params.reference ?? ""),
      String(req.query.email ?? ""),
    );

    res.status(200).json({
      success: true,
      data: booking,
    });
  };

  const cancelBooking = (req: AuthenticatedRequest & ValidatedRequest, res: Response) => {
    const payload = req.validated as ReturnType<typeof parseCancelBookingRequest>;
    const booking = bookingService.cancelBooking(String(req.params.id ?? ""), {
      userId: req.currentUser?.sub,
      guestEmail: payload.guestEmail,
    });

    res.status(200).json({
      success: true,
      message: "Booking cancelled successfully.",
      data: booking,
    });
  };

  return {
    listServices,
    getAvailability,
    createBooking,
    listMyBookings,
    lookupGuestBooking,
    cancelBooking,
  };
}

export type BookingController = ReturnType<typeof createBookingController>;
