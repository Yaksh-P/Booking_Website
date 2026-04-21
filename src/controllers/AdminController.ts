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

export function createAdminController(adminService: AdminService) {
  const listBookings = (req: AuthenticatedRequest, res: Response) => {
    const result = adminService.listBookings(parseListBookingsQuery(req.query));

    res.status(200).json({
      success: true,
      data: result,
    });
  };

  const getAnalytics = (_req: AuthenticatedRequest, res: Response) => {
    res.status(200).json({
      success: true,
      data: adminService.getAnalytics(),
    });
  };

  const updateBookingStatus = (
    req: AuthenticatedRequest & ValidatedRequest,
    res: Response,
  ) => {
    const currentUser = req.currentUser;
    const payload = req.validated as ReturnType<typeof parseUpdateBookingStatusRequest>;

    const booking = adminService.updateBookingStatus(
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

  const editBooking = (req: AuthenticatedRequest & ValidatedRequest, res: Response) => {
    const payload = req.validated as ReturnType<typeof parseEditBookingRequest>;

    const booking = adminService.editBooking(String(req.params.id ?? ""), payload);

    res.status(200).json({
      success: true,
      message: "Booking updated successfully.",
      data: booking,
    });
  };

  const createTimeSlot = (req: AuthenticatedRequest & ValidatedRequest, res: Response) => {
    const timeSlot = adminService.createTimeSlot(
      req.validated as ReturnType<typeof parseCreateTimeSlotRequest>,
    );

    res.status(201).json({
      success: true,
      message: "Time slot created successfully.",
      data: timeSlot,
    });
  };

  return {
    listBookings,
    getAnalytics,
    updateBookingStatus,
    editBooking,
    createTimeSlot,
  };
}

export type AdminController = ReturnType<typeof createAdminController>;
