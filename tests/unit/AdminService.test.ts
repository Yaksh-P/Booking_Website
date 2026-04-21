import assert from "assert/strict";
import test from "node:test";

import { createBookingRepository } from "../../src/repositories/BookingRepository";
import { createServiceRepository } from "../../src/repositories/ServiceRepository";
import { createUserRepository } from "../../src/repositories/UserRepository";
import { createAdminService } from "../../src/services/AdminService";
import { createBookingService } from "../../src/services/BookingService";
import { setupTestEnvironment } from "../helpers/testUtils";

function createServices() {
  const bookingRepository = createBookingRepository();
  const serviceRepository = createServiceRepository();
  const userRepository = createUserRepository();

  return {
    adminService: createAdminService(bookingRepository, serviceRepository, userRepository),
    bookingService: createBookingService(bookingRepository, serviceRepository, userRepository),
  };
}

test("AdminService updates booking status and reports analytics", () => {
  const testEnvironment = setupTestEnvironment();

  try {
    const { adminService, bookingService } = createServices();

    const booking = bookingService.createBooking({
      serviceId: "svc-hair-styling",
      timeSlotId: "slot-100",
      guestName: "Analytics Guest",
      guestEmail: "analytics@example.com",
    });

    const confirmedBooking = adminService.updateBookingStatus(
      booking.id,
      { status: "CONFIRMED", adminNotes: "Approved for analytics test" },
      "user-admin-1",
    );

    const paginatedBookings = adminService.listBookings({
      page: 1,
      pageSize: 1,
      status: "CONFIRMED",
    });

    const analytics = adminService.getAnalytics();

    assert.equal(confirmedBooking.status, "CONFIRMED");
    assert.equal(paginatedBookings.pagination.total, 1);
    assert.equal(analytics.confirmedBookings, 1);
    assert.equal(analytics.totalBookings, 1);
  } finally {
    testEnvironment.cleanup();
  }
});

test("AdminService edits a booking and can create a new time slot", () => {
  const testEnvironment = setupTestEnvironment();

  try {
    const { adminService, bookingService } = createServices();

    const booking = bookingService.createBooking({
      serviceId: "svc-hair-styling",
      timeSlotId: "slot-100",
      guestName: "Move Guest",
      guestEmail: "move@example.com",
    });

    const updatedBooking = adminService.editBooking(booking.id, {
      timeSlotId: "slot-101",
      notes: "Moved by admin",
    });

    const createdTimeSlot = adminService.createTimeSlot({
      serviceId: "svc-relax-massage",
      date: "2026-04-12",
      startTime: "09:00",
      endTime: "10:00",
      capacity: 2,
    });

    assert.equal(updatedBooking.timeSlotId, "slot-101");
    assert.equal(createdTimeSlot.serviceId, "svc-relax-massage");
  } finally {
    testEnvironment.cleanup();
  }
});

test("AdminService rejects incomplete service changes and unknown services for slots", () => {
  const testEnvironment = setupTestEnvironment();

  try {
    const { adminService, bookingService } = createServices();

    const booking = bookingService.createBooking({
      serviceId: "svc-hair-styling",
      timeSlotId: "slot-100",
      guestName: "Rule Guest",
      guestEmail: "rules@example.com",
    });

    assert.throws(
      () =>
        adminService.editBooking(booking.id, {
          serviceId: "svc-relax-massage",
        }),
      /timeSlotId must also be supplied/i,
    );

    assert.throws(
      () =>
        adminService.createTimeSlot({
          serviceId: "missing-service",
          date: "2026-04-13",
          startTime: "09:00",
          endTime: "10:00",
          capacity: 1,
        }),
      /Service not found/i,
    );
  } finally {
    testEnvironment.cleanup();
  }
});

test("AdminService covers missing bookings, invalid slot combinations, and capacity conflicts", () => {
  const testEnvironment = setupTestEnvironment();

  try {
    const { adminService, bookingService } = createServices();

    assert.throws(
      () =>
        adminService.updateBookingStatus(
          "missing-booking",
          { status: "CONFIRMED" },
          "user-admin-1",
        ),
      /Booking not found/i,
    );

    assert.throws(
      () => adminService.editBooking("missing-booking", { notes: "No booking here" }),
      /Booking not found/i,
    );

    bookingService.createBooking({
      serviceId: "svc-hair-styling",
      timeSlotId: "slot-101",
      guestName: "First Capacity Guest",
      guestEmail: "capacity-1@example.com",
    });

    bookingService.createBooking({
      serviceId: "svc-hair-styling",
      timeSlotId: "slot-101",
      guestName: "Second Capacity Guest",
      guestEmail: "capacity-2@example.com",
    });

    const movableBooking = bookingService.createBooking({
      serviceId: "svc-hair-styling",
      timeSlotId: "slot-100",
      guestName: "Third Capacity Guest",
      guestEmail: "capacity-3@example.com",
    });

    assert.throws(
      () =>
        adminService.editBooking(movableBooking.id, {
          serviceId: "svc-relax-massage",
          timeSlotId: "slot-101",
        }),
      /invalid/i,
    );

    assert.throws(
      () =>
        adminService.editBooking(movableBooking.id, {
          timeSlotId: "slot-101",
        }),
      /remaining capacity/i,
    );
  } finally {
    testEnvironment.cleanup();
  }
});
