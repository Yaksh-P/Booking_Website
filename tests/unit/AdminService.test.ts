import assert from "assert/strict";
import test from "node:test";

import { BookingRepository } from "../../src/repositories/BookingRepository";
import { ServiceRepository } from "../../src/repositories/ServiceRepository";
import { UserRepository } from "../../src/repositories/UserRepository";
import { AdminService } from "../../src/services/AdminService";
import { BookingService } from "../../src/services/BookingService";
import { setupTestEnvironment } from "../helpers/testUtils";

function createServices() {
  const bookingRepository = new BookingRepository();
  const serviceRepository = new ServiceRepository();
  const userRepository = new UserRepository();

  return {
    adminService: new AdminService(bookingRepository, serviceRepository, userRepository),
    bookingService: new BookingService(bookingRepository, serviceRepository, userRepository),
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
