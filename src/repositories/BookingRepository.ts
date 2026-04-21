import { randomUUID } from "crypto";

import { readCollection, writeCollection } from "../config/database";
import { Booking, BookingStatus } from "../entities/Booking";

export function createBookingRepository() {
  const list = () =>
    readCollection<Booking>("bookings").sort((left, right) =>
      right.createdAt.localeCompare(left.createdAt),
    );

  const findById = (id: string) => list().find((booking) => booking.id === id);

  const findByReference = (reference: string) =>
    list().find((booking) => booking.reference === reference);

  const listByUserId = (userId: string) =>
    list().filter((booking) => booking.userId === userId);

  const listByGuestEmail = (email: string) =>
    list().filter((booking) => booking.guestEmail === email.toLowerCase());

  const countActiveByTimeSlot = (timeSlotId: string, excludeBookingId?: string) =>
    list().filter(
      (booking) =>
        booking.timeSlotId === timeSlotId &&
        booking.id !== excludeBookingId &&
        booking.status !== "DECLINED" &&
        booking.status !== "CANCELLED",
    ).length;

  const create = (
    booking: Omit<Booking, "id" | "createdAt" | "updatedAt" | "reference"> & {
      reference: string;
    },
  ) => {
    const bookings = list();
    const timestamp = new Date().toISOString();

    const createdBooking: Booking = {
      ...booking,
      id: randomUUID(),
      createdAt: timestamp,
      updatedAt: timestamp,
    };

    bookings.push(createdBooking);
    writeCollection("bookings", bookings);

    return createdBooking;
  };

  const update = (id: string, changes: Partial<Omit<Booking, "id" | "createdAt">>) => {
    const bookings = list();
    const index = bookings.findIndex((booking) => booking.id === id);

    if (index === -1) {
      return undefined;
    }

    const existingBooking = bookings[index];
    if (!existingBooking) {
      return undefined;
    }

    const updatedBooking: Booking = {
      ...existingBooking,
      ...changes,
      updatedAt: new Date().toISOString(),
    };

    bookings[index] = updatedBooking;
    writeCollection("bookings", bookings);

    return updatedBooking;
  };

  const listByStatus = (status?: BookingStatus) => {
    if (!status) {
      return list();
    }

    return list().filter((booking) => booking.status === status);
  };

  return {
    list,
    findById,
    findByReference,
    listByUserId,
    listByGuestEmail,
    countActiveByTimeSlot,
    create,
    update,
    listByStatus,
  };
}

export type BookingRepository = ReturnType<typeof createBookingRepository>;
