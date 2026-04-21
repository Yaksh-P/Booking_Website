import { BookingStatus } from "../entities/Booking";
import { BookingRepository } from "../repositories/BookingRepository";
import { ServiceRepository } from "../repositories/ServiceRepository";
import { UserRepository } from "../repositories/UserRepository";
import { createAppError } from "../utils/AppError";
import { paginate } from "../utils/pagination";

export function createAdminService(
  bookingRepository: BookingRepository,
  serviceRepository: ServiceRepository,
  userRepository: UserRepository,
) {
  const listBookings = (query: { page: number; pageSize: number; status?: string }) => {
    const status = query.status as BookingStatus | undefined;
    const bookings = bookingRepository.listByStatus(status).map((booking) => ({
      ...booking,
      service: serviceRepository.findById(booking.serviceId),
      timeSlot: serviceRepository.findTimeSlotById(booking.timeSlotId),
    }));

    const offset = (query.page - 1) * query.pageSize;
    const pagedBookings = bookings.slice(offset, offset + query.pageSize);

    return paginate(pagedBookings, bookings.length, {
      page: query.page,
      limit: query.pageSize,
    });
  };

  const updateBookingStatus = (
    bookingId: string,
    payload: { status: string; adminNotes?: string },
    updatedBy: string,
  ) => {
    const booking = bookingRepository.findById(bookingId);

    if (!booking) {
      throw createAppError("Booking not found.", 404);
    }

    const updatedBooking = bookingRepository.update(bookingId, {
      status: payload.status as BookingStatus,
      adminNotes: payload.adminNotes
        ? `${payload.adminNotes} (updated by ${updatedBy})`
        : booking.adminNotes,
    });

    if (!updatedBooking) {
      throw createAppError("Booking could not be updated.", 500);
    }

    return updatedBooking;
  };

  const editBooking = (
    bookingId: string,
    payload: {
      serviceId?: string;
      timeSlotId?: string;
      guestName?: string;
      guestEmail?: string;
      guestPhone?: string;
      notes?: string;
      adminNotes?: string;
    },
  ) => {
    const booking = bookingRepository.findById(bookingId);

    if (!booking) {
      throw createAppError("Booking not found.", 404);
    }

    const nextServiceId = payload.serviceId ?? booking.serviceId;
    const nextTimeSlotId = payload.timeSlotId ?? booking.timeSlotId;

    if (payload.serviceId && !payload.timeSlotId) {
      throw createAppError("timeSlotId must also be supplied when serviceId changes.", 400);
    }

    const service = serviceRepository.findById(nextServiceId);
    const timeSlot = serviceRepository.findTimeSlotById(nextTimeSlotId);

    if (!service || !timeSlot || timeSlot.serviceId !== nextServiceId) {
      throw createAppError("The supplied service and time slot combination is invalid.", 400);
    }

    if (bookingRepository.countActiveByTimeSlot(nextTimeSlotId, booking.id) >= timeSlot.capacity) {
      throw createAppError("The selected time slot does not have remaining capacity.", 409);
    }

    const updatedBooking = bookingRepository.update(bookingId, {
      serviceId: nextServiceId,
      timeSlotId: nextTimeSlotId,
      guestName: payload.guestName ?? booking.guestName,
      guestEmail: payload.guestEmail?.toLowerCase() ?? booking.guestEmail,
      guestPhone: payload.guestPhone ?? booking.guestPhone,
      notes: payload.notes ?? booking.notes,
      adminNotes: payload.adminNotes ?? booking.adminNotes,
    });

    if (!updatedBooking) {
      throw createAppError("Booking could not be updated.", 500);
    }

    return updatedBooking;
  };

  const createTimeSlot = (payload: {
    serviceId: string;
    date: string;
    startTime: string;
    endTime: string;
    capacity: number;
  }) => {
    const service = serviceRepository.findById(payload.serviceId);

    if (!service) {
      throw createAppError("Service not found.", 404);
    }

    return serviceRepository.createTimeSlot(payload);
  };

  const getAnalytics = () => {
    const users = userRepository.list();
    const bookings = bookingRepository.list();
    const services = serviceRepository.listServices();

    return {
      totalUsers: users.length,
      totalCustomers: users.filter((user) => user.role === "CUSTOMER").length,
      totalAdmins: users.filter((user) => user.role === "ADMIN").length,
      totalBookings: bookings.length,
      pendingBookings: bookings.filter((booking) => booking.status === "PENDING").length,
      confirmedBookings: bookings.filter((booking) => booking.status === "CONFIRMED").length,
      declinedBookings: bookings.filter((booking) => booking.status === "DECLINED").length,
      cancelledBookings: bookings.filter((booking) => booking.status === "CANCELLED").length,
      guestBookings: bookings.filter((booking) => booking.customerType === "GUEST").length,
      registeredBookings: bookings.filter((booking) => booking.customerType === "REGISTERED").length,
      bookingsPerService: services.map((service) => ({
        serviceId: service.id,
        serviceName: service.name,
        totalBookings: bookings.filter((booking) => booking.serviceId === service.id).length,
      })),
    };
  };

  return {
    listBookings,
    updateBookingStatus,
    editBooking,
    createTimeSlot,
    getAnalytics,
  };
}

export type AdminService = ReturnType<typeof createAdminService>;
