import { randomUUID } from "crypto";

import { readCollection, writeCollection } from "../config/database";
import { Booking, BookingStatus } from "../entities/Booking";

export class BookingRepository {
  list() {
    return readCollection<Booking>("bookings").sort((left, right) =>
      right.createdAt.localeCompare(left.createdAt),
    );
  }

  findById(id: string) {
    return this.list().find((booking) => booking.id === id);
  }

  findByReference(reference: string) {
    return this.list().find((booking) => booking.reference === reference);
  }

  listByUserId(userId: string) {
    return this.list().filter((booking) => booking.userId === userId);
  }

  listByGuestEmail(email: string) {
    return this.list().filter((booking) => booking.guestEmail === email.toLowerCase());
  }

  countActiveByTimeSlot(timeSlotId: string, excludeBookingId?: string) {
    return this.list().filter(
      (booking) =>
        booking.timeSlotId === timeSlotId &&
        booking.id !== excludeBookingId &&
        booking.status !== "DECLINED" &&
        booking.status !== "CANCELLED",
    ).length;
  }

  create(
    booking: Omit<Booking, "id" | "createdAt" | "updatedAt" | "reference"> & {
      reference: string;
    },
  ) {
    const bookings = this.list();
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
  }

  update(id: string, changes: Partial<Omit<Booking, "id" | "createdAt">>) {
    const bookings = this.list();
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
  }

  listByStatus(status?: BookingStatus) {
    if (!status) {
      return this.list();
    }

    return this.list().filter((booking) => booking.status === status);
  }
}
