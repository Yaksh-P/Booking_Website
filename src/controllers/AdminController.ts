import { Response } from "express";

import {
  parseCreateTimeSlotRequest,
  parseEditBookingRequest,
  parseListBookingsQuery,
  parseUpdateBookingStatusRequest,
} from "../dtos/admin.dto";
import { AuthenticatedRequest } from "../middleware/authenticate";
import { ValidatedRequest } from "../middleware/validate";
import { AdminService } from "../services/AdminService";

export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  listBookings = (req: AuthenticatedRequest, res: Response) => {
    const result = this.adminService.listBookings(parseListBookingsQuery(req.query));

    res.status(200).json({
      success: true,
      data: result,
    });
  };

  getAnalytics = (_req: AuthenticatedRequest, res: Response) => {
    res.status(200).json({
      success: true,
      data: this.adminService.getAnalytics(),
    });
  };

  updateBookingStatus = (
    req: AuthenticatedRequest & ValidatedRequest,
    res: Response,
  ) => {
    const currentUser = req.currentUser;
    const payload = req.validated as ReturnType<typeof parseUpdateBookingStatusRequest>;

    const booking = this.adminService.updateBookingStatus(
      String(req.params.id ?? ""),
      payload,
      currentUser?.sub ?? "unknown-admin",
    );

    res.status(200).json({
      success: true,
      message: "Booking status updated successfully.",
      data: booking,
    });
  };

  editBooking = (req: AuthenticatedRequest & ValidatedRequest, res: Response) => {
    const payload = req.validated as ReturnType<typeof parseEditBookingRequest>;

    const booking = this.adminService.editBooking(String(req.params.id ?? ""), payload);

    res.status(200).json({
      success: true,
      message: "Booking updated successfully.",
      data: booking,
    });
  };

  createTimeSlot = (req: AuthenticatedRequest & ValidatedRequest, res: Response) => {
    const timeSlot = this.adminService.createTimeSlot(
      req.validated as ReturnType<typeof parseCreateTimeSlotRequest>,
    );

    res.status(201).json({
      success: true,
      message: "Time slot created successfully.",
      data: timeSlot,
    });
  };
}
