import assert from "assert/strict";
import test from "node:test";

import { BookingRepository } from "../../src/repositories/BookingRepository";
import { ServiceRepository } from "../../src/repositories/ServiceRepository";
import { UserRepository } from "../../src/repositories/UserRepository";
import { BookingService } from "../../src/services/BookingService";
import { setupTestEnvironment } from "../helpers/testUtils";

function createBookingService() {
  return new BookingService(
    new BookingRepository(),
    new ServiceRepository(),
    new UserRepository(),
  );
}

test("BookingService returns availability and decreases remaining capacity after booking", () => {
  const testEnvironment = setupTestEnvironment();

  try {
    const bookingService = createBookingService();

    const beforeBooking = bookingService.getAvailability({ serviceId: "svc-hair-styling" });
    const slotBefore = beforeBooking[0]?.slots.find((slot) => slot.id === "slot-100");

    assert.equal(slotBefore?.remainingCapacity, 2);

    bookingService.createBooking({
      serviceId: "svc-hair-styling",
      timeSlotId: "slot-100",
      guestName: "Guest Booker",
      guestEmail: "guest@example.com",
    });

    const afterBooking = bookingService.getAvailability({ serviceId: "svc-hair-styling" });
    const slotAfter = afterBooking[0]?.slots.find((slot) => slot.id === "slot-100");

    assert.equal(slotAfter?.remainingCapacity, 1);
  } finally {
    testEnvironment.cleanup();
  }
});

test("BookingService prevents overbooking when a time slot is full", () => {
  const testEnvironment = setupTestEnvironment();

  try {
    const bookingService = createBookingService();

    bookingService.createBooking({
      serviceId: "svc-relax-massage",
      timeSlotId: "slot-200",
      guestName: "First Guest",
      guestEmail: "first@example.com",
    });

    assert.throws(
      () =>
        bookingService.createBooking({
          serviceId: "svc-relax-massage",
          timeSlotId: "slot-200",
          guestName: "Second Guest",
          guestEmail: "second@example.com",
        }),
      /fully booked/i,
    );
  } finally {
    testEnvironment.cleanup();
  }
});

test("BookingService lets a registered user list and cancel their own booking", () => {
  const testEnvironment = setupTestEnvironment();

  try {
    const bookingService = createBookingService();

    const booking = bookingService.createBooking(
      {
        serviceId: "svc-hair-styling",
        timeSlotId: "slot-101",
      },
      {
        sub: "user-customer-1",
        email: "jane@example.com",
        name: "Jane Customer",
      },
    );

    const myBookings = bookingService.listBookingsForUser("user-customer-1");

    assert.equal(myBookings.length, 1);
    assert.equal(myBookings[0]?.id, booking.id);

    const cancelledBooking = bookingService.cancelBooking(booking.id, {
      userId: "user-customer-1",
    });

    assert.equal(cancelledBooking.status, "CANCELLED");
  } finally {
    testEnvironment.cleanup();
  }
});

test("BookingService validates guest details and guest lookup input", () => {
  const testEnvironment = setupTestEnvironment();

  try {
    const bookingService = createBookingService();

    assert.throws(
      () =>
        bookingService.createBooking({
          serviceId: "svc-hair-styling",
          timeSlotId: "slot-100",
        }),
      /guestName and guestEmail/i,
    );

    assert.throws(
      () => bookingService.lookupGuestBooking("BK-UNKNOWN", ""),
      /email is required/i,
    );
  } finally {
    testEnvironment.cleanup();
  }
});

test("BookingService handles invalid service selections and unauthorized cancellation attempts", () => {
  const testEnvironment = setupTestEnvironment();

  try {
    const bookingService = createBookingService();

    assert.throws(
      () =>
        bookingService.createBooking({
          serviceId: "missing-service",
          timeSlotId: "slot-100",
          guestName: "Guest",
          guestEmail: "guest@example.com",
        }),
      /does not exist/i,
    );

    assert.throws(
      () =>
        bookingService.createBooking({
          serviceId: "svc-hair-styling",
          timeSlotId: "slot-200",
          guestName: "Guest",
          guestEmail: "guest@example.com",
        }),
      /invalid for this service/i,
    );

    const booking = bookingService.createBooking({
      serviceId: "svc-hair-styling",
      timeSlotId: "slot-100",
      guestName: "Guest",
      guestEmail: "guest@example.com",
    });

    assert.throws(
      () =>
        bookingService.lookupGuestBooking(booking.reference, "wrong@example.com"),
      /lookup details are invalid/i,
    );

    assert.throws(
      () =>
        bookingService.cancelBooking(booking.id, {
          guestEmail: "wrong@example.com",
        }),
      /does not match/i,
    );

    bookingService.cancelBooking(booking.id, {
      guestEmail: "guest@example.com",
    });

    assert.throws(
      () =>
        bookingService.cancelBooking(booking.id, {
          guestEmail: "guest@example.com",
        }),
      /already cancelled/i,
    );
  } finally {
    testEnvironment.cleanup();
  }
});
