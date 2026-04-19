import { BookingRepository } from "../repositories/BookingRepository";
import { ServiceRepository } from "../repositories/ServiceRepository";
import { UserRepository } from "../repositories/UserRepository";
import { AppError } from "../utils/AppError";

interface CurrentUserLike {
  sub: string;
  email: string;
  name: string;
}

export class BookingService {
  constructor(
    private readonly bookingRepository: BookingRepository,
    private readonly serviceRepository: ServiceRepository,
    private readonly userRepository: UserRepository,
  ) {}

  listServices() {
    return this.serviceRepository.listActiveServices();
  }

  getAvailability(query: { serviceId?: string; date?: string }) {
    const services = query.serviceId
      ? [this.serviceRepository.findById(query.serviceId)].filter(Boolean)
      : this.serviceRepository.listActiveServices();

    if (services.length === 0) {
      throw new AppError("Service not found.", 404);
    }

    return services.map((service) => ({
      service,
      slots: this.serviceRepository
        .listTimeSlots({
          serviceId: service?.id,
          date: query.date,
        })
        .map((timeSlot) => {
          const reservedSpots = this.bookingRepository.countActiveByTimeSlot(timeSlot.id);
          return {
            ...timeSlot,
            reservedSpots,
            remainingCapacity: timeSlot.capacity - reservedSpots,
          };
        }),
    }));
  }

  createBooking(
    payload: {
      serviceId: string;
      timeSlotId: string;
      guestName?: string;
      guestEmail?: string;
      guestPhone?: string;
      notes?: string;
    },
    currentUser?: CurrentUserLike,
  ) {
    const service = this.serviceRepository.findById(payload.serviceId);
    const timeSlot = this.serviceRepository.findTimeSlotById(payload.timeSlotId);

    if (!service) {
      throw new AppError("The requested service does not exist.", 404);
    }

    if (!timeSlot || timeSlot.serviceId !== payload.serviceId) {
      throw new AppError("The selected time slot is invalid for this service.", 400);
    }

    if (this.bookingRepository.countActiveByTimeSlot(timeSlot.id) >= timeSlot.capacity) {
      throw new AppError("The selected time slot is fully booked.", 409);
    }

    const registeredUser = currentUser ? this.userRepository.findById(currentUser.sub) : undefined;

    if (currentUser && !registeredUser) {
      throw new AppError("Authenticated user account no longer exists.", 401);
    }

    const guestName = registeredUser?.name ?? payload.guestName;
    const guestEmail = registeredUser?.email ?? payload.guestEmail?.toLowerCase();

    if (!guestName || !guestEmail) {
      throw new AppError(
        "guestName and guestEmail are required when submitting a guest booking.",
        400,
      );
    }

    return this.bookingRepository.create({
      serviceId: payload.serviceId,
      timeSlotId: payload.timeSlotId,
      status: "PENDING",
      customerType: registeredUser ? "REGISTERED" : "GUEST",
      userId: registeredUser?.id,
      guestName,
      guestEmail,
      guestPhone: payload.guestPhone,
      notes: payload.notes,
      reference: `BK-${Math.random().toString(36).slice(2, 8).toUpperCase()}`,
    });
  }

  listBookingsForUser(userId: string) {
    if (!this.userRepository.findById(userId)) {
      throw new AppError("User not found.", 404);
    }

    return this.bookingRepository.listByUserId(userId).map((booking) => ({
      ...booking,
      service: this.serviceRepository.findById(booking.serviceId),
      timeSlot: this.serviceRepository.findTimeSlotById(booking.timeSlotId),
    }));
  }

  lookupGuestBooking(reference: string, email: string) {
    if (!email) {
      throw new AppError("email is required to look up a guest booking.", 400);
    }

    const booking = this.bookingRepository.findByReference(reference);

    if (!booking || booking.guestEmail !== email.toLowerCase()) {
      throw new AppError("Booking lookup details are invalid.", 404);
    }

    return {
      ...booking,
      service: this.serviceRepository.findById(booking.serviceId),
      timeSlot: this.serviceRepository.findTimeSlotById(booking.timeSlotId),
    };
  }

  cancelBooking(bookingId: string, actor: { userId?: string; guestEmail?: string }) {
    const booking = this.bookingRepository.findById(bookingId);

    if (!booking) {
      throw new AppError("Booking not found.", 404);
    }

    if (actor.userId) {
      if (booking.userId !== actor.userId) {
        throw new AppError("You may only cancel your own booking.", 403);
      }
    } else if (actor.guestEmail) {
      if (booking.guestEmail !== actor.guestEmail.toLowerCase()) {
        throw new AppError("Guest email does not match the booking record.", 403);
      }
    } else {
      throw new AppError("Authentication or guestEmail is required to cancel a booking.", 401);
    }

    if (booking.status === "CANCELLED") {
      throw new AppError("Booking is already cancelled.", 400);
    }

    const updatedBooking = this.bookingRepository.update(bookingId, { status: "CANCELLED" });

    if (!updatedBooking) {
      throw new AppError("Booking could not be cancelled.", 500);
    }

    return updatedBooking;
  }
}
