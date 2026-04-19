import { Response } from "express";

import {
  parseAvailabilityQuery,
  parseCancelBookingRequest,
  parseCreateBookingRequest,
} from "../dtos/booking.dto";
import { AuthenticatedRequest } from "../middleware/authenticate";
import { ValidatedRequest } from "../middleware/validate";
import { BookingService } from "../services/BookingService";

export class BookingController {
  constructor(private readonly bookingService: BookingService) {}

  listServices = (_req: AuthenticatedRequest, res: Response) => {
    res.status(200).json({
      success: true,
      data: this.bookingService.listServices(),
    });
  };

  getAvailability = (req: AuthenticatedRequest, res: Response) => {
    const query = parseAvailabilityQuery(req.query);

    res.status(200).json({
      success: true,
      data: this.bookingService.getAvailability(query),
    });
  };

  createBooking = (req: AuthenticatedRequest & ValidatedRequest, res: Response) => {
    const payload = req.validated as ReturnType<typeof parseCreateBookingRequest>;

    const booking = this.bookingService.createBooking(payload, req.currentUser);

    res.status(201).json({
      success: true,
      message: "Booking request submitted successfully.",
      data: booking,
    });
  };

  listMyBookings = (req: AuthenticatedRequest, res: Response) => {
    const bookings = this.bookingService.listBookingsForUser(req.currentUser?.sub ?? "");

    res.status(200).json({
      success: true,
      data: bookings,
    });
  };

  lookupGuestBooking = (req: AuthenticatedRequest, res: Response) => {
    const booking = this.bookingService.lookupGuestBooking(
      String(req.params.reference ?? ""),
      String(req.query.email ?? ""),
    );

    res.status(200).json({
      success: true,
      data: booking,
    });
  };

  cancelBooking = (req: AuthenticatedRequest & ValidatedRequest, res: Response) => {
    const payload = req.validated as ReturnType<typeof parseCancelBookingRequest>;
    const booking = this.bookingService.cancelBooking(String(req.params.id ?? ""), {
      userId: req.currentUser?.sub,
      guestEmail: payload.guestEmail,
    });

    res.status(200).json({
      success: true,
      message: "Booking cancelled successfully.",
      data: booking,
    });
  };
}
