import { BookingRepository } from "../repositories/BookingRepository";
import { ServiceRepository } from "../repositories/ServiceRepository";
import { UserRepository } from "../repositories/UserRepository";
import { createAppError } from "../utils/AppError";

interface CurrentUserLike {
  sub: string;
  email: string;
  name: string;
}

export function createBookingService(
  bookingRepository: BookingRepository,
  serviceRepository: ServiceRepository,
  userRepository: UserRepository,
) {
  const listServices = () => serviceRepository.listActiveServices();

  const getAvailability = (query: { serviceId?: string; date?: string }) => {
    const services = query.serviceId
      ? [serviceRepository.findById(query.serviceId)].filter(Boolean)
      : serviceRepository.listActiveServices();

    if (services.length === 0) {
      throw createAppError("Service not found.", 404);
    }

    return services.map((service) => ({
      service,
      slots: serviceRepository
        .listTimeSlots({
          serviceId: service?.id,
          date: query.date,
        })
        .map((timeSlot) => {
          const reservedSpots = bookingRepository.countActiveByTimeSlot(timeSlot.id);
          return {
            ...timeSlot,
            reservedSpots,
            remainingCapacity: timeSlot.capacity - reservedSpots,
          };
        }),
    }));
  };

  const createBooking = (
    payload: {
      serviceId: string;
      timeSlotId: string;
      guestName?: string;
      guestEmail?: string;
      guestPhone?: string;
      notes?: string;
    },
    currentUser?: CurrentUserLike,
  ) => {
    const service = serviceRepository.findById(payload.serviceId);
    const timeSlot = serviceRepository.findTimeSlotById(payload.timeSlotId);

    if (!service) {
      throw createAppError("The requested service does not exist.", 404);
    }

    if (!timeSlot || timeSlot.serviceId !== payload.serviceId) {
      throw createAppError("The selected time slot is invalid for this service.", 400);
    }

    if (bookingRepository.countActiveByTimeSlot(timeSlot.id) >= timeSlot.capacity) {
      throw createAppError("The selected time slot is fully booked.", 409);
    }

    const registeredUser = currentUser ? userRepository.findById(currentUser.sub) : undefined;

    if (currentUser && !registeredUser) {
      throw createAppError("Authenticated user account no longer exists.", 401);
    }

    const guestName = registeredUser?.name ?? payload.guestName;
    const guestEmail = registeredUser?.email ?? payload.guestEmail?.toLowerCase();

    if (!guestName || !guestEmail) {
      throw createAppError(
        "guestName and guestEmail are required when submitting a guest booking.",
        400,
      );
    }

    return bookingRepository.create({
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
  };

  const listBookingsForUser = (userId: string) => {
    if (!userRepository.findById(userId)) {
      throw createAppError("User not found.", 404);
    }

    return bookingRepository.listByUserId(userId).map((booking) => ({
      ...booking,
      service: serviceRepository.findById(booking.serviceId),
      timeSlot: serviceRepository.findTimeSlotById(booking.timeSlotId),
    }));
  };

  const lookupGuestBooking = (reference: string, email: string) => {
    if (!email) {
      throw createAppError("email is required to look up a guest booking.", 400);
    }

    const booking = bookingRepository.findByReference(reference);

    if (!booking || booking.guestEmail !== email.toLowerCase()) {
      throw createAppError("Booking lookup details are invalid.", 404);
    }

    return {
      ...booking,
      service: serviceRepository.findById(booking.serviceId),
      timeSlot: serviceRepository.findTimeSlotById(booking.timeSlotId),
    };
  };

  const cancelBooking = (bookingId: string, actor: { userId?: string; guestEmail?: string }) => {
    const booking = bookingRepository.findById(bookingId);

    if (!booking) {
      throw createAppError("Booking not found.", 404);
    }

    if (actor.userId) {
      if (booking.userId !== actor.userId) {
        throw createAppError("You may only cancel your own booking.", 403);
      }
    } else if (actor.guestEmail) {
      if (booking.guestEmail !== actor.guestEmail.toLowerCase()) {
        throw createAppError("Guest email does not match the booking record.", 403);
      }
    } else {
      throw createAppError("Authentication or guestEmail is required to cancel a booking.", 401);
    }

    if (booking.status === "CANCELLED") {
      throw createAppError("Booking is already cancelled.", 400);
    }

    const updatedBooking = bookingRepository.update(bookingId, { status: "CANCELLED" });

    if (!updatedBooking) {
      throw createAppError("Booking could not be cancelled.", 500);
    }

    return updatedBooking;
  };

  return {
    listServices,
    getAvailability,
    createBooking,
    listBookingsForUser,
    lookupGuestBooking,
    cancelBooking,
  };
}

export type BookingService = ReturnType<typeof createBookingService>;
