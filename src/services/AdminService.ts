import { BookingStatus } from "../entities/Booking";
import { BookingRepository } from "../repositories/BookingRepository";
import { ServiceRepository } from "../repositories/ServiceRepository";
import { UserRepository } from "../repositories/UserRepository";
import { AppError } from "../utils/AppError";
import { paginate } from "../utils/pagination";

export class AdminService {
  constructor(
    private readonly bookingRepository: BookingRepository,
    private readonly serviceRepository: ServiceRepository,
    private readonly userRepository: UserRepository,
  ) {}

  listBookings(query: { page: number; pageSize: number; status?: string }) {
    const status = query.status as BookingStatus | undefined;
    const bookings = this.bookingRepository.listByStatus(status).map((booking) => ({
      ...booking,
      service: this.serviceRepository.findById(booking.serviceId),
      timeSlot: this.serviceRepository.findTimeSlotById(booking.timeSlotId),
    }));

    const offset = (query.page - 1) * query.pageSize;
    const pagedBookings = bookings.slice(offset, offset + query.pageSize);

    return paginate(pagedBookings, bookings.length, {
      page: query.page,
      limit: query.pageSize,
    });
  }

  updateBookingStatus(
    bookingId: string,
    payload: { status: string; adminNotes?: string },
    updatedBy: string,
  ) {
    const booking = this.bookingRepository.findById(bookingId);

    if (!booking) {
      throw new AppError("Booking not found.", 404);
    }

    const updatedBooking = this.bookingRepository.update(bookingId, {
      status: payload.status as BookingStatus,
      adminNotes: payload.adminNotes
        ? `${payload.adminNotes} (updated by ${updatedBy})`
        : booking.adminNotes,
    });

    if (!updatedBooking) {
      throw new AppError("Booking could not be updated.", 500);
    }

    return updatedBooking;
  }

  editBooking(
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
  ) {
    const booking = this.bookingRepository.findById(bookingId);

    if (!booking) {
      throw new AppError("Booking not found.", 404);
    }

    const nextServiceId = payload.serviceId ?? booking.serviceId;
    const nextTimeSlotId = payload.timeSlotId ?? booking.timeSlotId;

    if (payload.serviceId && !payload.timeSlotId) {
      throw new AppError("timeSlotId must also be supplied when serviceId changes.", 400);
    }

    const service = this.serviceRepository.findById(nextServiceId);
    const timeSlot = this.serviceRepository.findTimeSlotById(nextTimeSlotId);

    if (!service || !timeSlot || timeSlot.serviceId !== nextServiceId) {
      throw new AppError("The supplied service and time slot combination is invalid.", 400);
    }

    if (
      this.bookingRepository.countActiveByTimeSlot(nextTimeSlotId, booking.id) >= timeSlot.capacity
    ) {
      throw new AppError("The selected time slot does not have remaining capacity.", 409);
    }

    const updatedBooking = this.bookingRepository.update(bookingId, {
      serviceId: nextServiceId,
      timeSlotId: nextTimeSlotId,
      guestName: payload.guestName ?? booking.guestName,
      guestEmail: payload.guestEmail?.toLowerCase() ?? booking.guestEmail,
      guestPhone: payload.guestPhone ?? booking.guestPhone,
      notes: payload.notes ?? booking.notes,
      adminNotes: payload.adminNotes ?? booking.adminNotes,
    });

    if (!updatedBooking) {
      throw new AppError("Booking could not be updated.", 500);
    }

    return updatedBooking;
  }

  createTimeSlot(payload: {
    serviceId: string;
    date: string;
    startTime: string;
    endTime: string;
    capacity: number;
  }) {
    const service = this.serviceRepository.findById(payload.serviceId);

    if (!service) {
      throw new AppError("Service not found.", 404);
    }

    return this.serviceRepository.createTimeSlot(payload);
  }

  getAnalytics() {
    const users = this.userRepository.list();
    const bookings = this.bookingRepository.list();
    const services = this.serviceRepository.listServices();

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
  }
}
