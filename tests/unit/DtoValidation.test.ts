import assert from "assert/strict";
import test from "node:test";

import {
  parseCreateTimeSlotRequest,
  parseEditBookingRequest,
  parseListBookingsQuery,
  parseUpdateBookingStatusRequest,
} from "../../src/dtos/admin.dto";
import { parseLoginRequest, parseRegisterRequest } from "../../src/dtos/auth.dto";
import {
  parseAvailabilityQuery,
  parseCancelBookingRequest,
  parseCreateBookingRequest,
} from "../../src/dtos/booking.dto";

test("DTO parsers accept valid payloads across auth, booking, and admin flows", () => {
  const registerPayload = parseRegisterRequest({
    name: "Valid User",
    email: "valid@example.com",
    password: "Password123",
  });
  const loginPayload = parseLoginRequest({
    email: "valid@example.com",
    password: "Password123",
  });
  const bookingPayload = parseCreateBookingRequest({
    serviceId: "svc-hair-styling",
    timeSlotId: "slot-100",
    guestName: "Guest",
    guestEmail: "guest@example.com",
  });
  const availabilityQuery = parseAvailabilityQuery({
    serviceId: "svc-hair-styling",
    date: "2026-04-10",
  });
  const cancelPayload = parseCancelBookingRequest({
    guestEmail: "guest@example.com",
  });
  const listQuery = parseListBookingsQuery({
    page: "2",
    pageSize: "5",
    status: "PENDING",
  });
  const statusPayload = parseUpdateBookingStatusRequest({
    status: "confirmed",
    adminNotes: "Approved",
  });
  const editPayload = parseEditBookingRequest({
    notes: "Updated",
  });
  const timeSlotPayload = parseCreateTimeSlotRequest({
    serviceId: "svc-hair-styling",
    date: "2026-04-12",
    startTime: "09:00",
    endTime: "10:00",
    capacity: 2,
  });

  assert.equal(registerPayload.email, "valid@example.com");
  assert.equal(loginPayload.email, "valid@example.com");
  assert.equal(bookingPayload.guestEmail, "guest@example.com");
  assert.equal(availabilityQuery.date, "2026-04-10");
  assert.equal(cancelPayload.guestEmail, "guest@example.com");
  assert.equal(listQuery.page, 2);
  assert.equal(statusPayload.status, "CONFIRMED");
  assert.equal(editPayload.notes, "Updated");
  assert.equal(timeSlotPayload.capacity, 2);
});

test("DTO parsers reject invalid payload branches", () => {
  assert.throws(
    () =>
      parseRegisterRequest({
        name: "",
        email: "bad",
        password: "short",
      }),
    /name is required/i,
  );

  assert.throws(
    () =>
      parseLoginRequest({
        email: "bad",
        password: "short",
      }),
    /email must be a valid email/i,
  );

  assert.throws(
    () =>
      parseAvailabilityQuery({
        date: "04-10-2026",
      }),
    /YYYY-MM-DD/i,
  );

  assert.throws(
    () =>
      parseCreateBookingRequest({
        serviceId: "svc-hair-styling",
        timeSlotId: "",
      }),
    /timeSlotId is required/i,
  );

  assert.throws(
    () =>
      parseCancelBookingRequest({
        guestEmail: "not-an-email",
      }),
    /guestEmail must be a valid email/i,
  );

  assert.throws(
    () =>
      parseListBookingsQuery({
        page: 0,
        pageSize: 0,
      }),
    /page must be a positive integer/i,
  );

  assert.throws(
    () =>
      parseUpdateBookingStatusRequest({
        status: "approved",
      }),
    /status must be one of/i,
  );

  assert.throws(
    () => parseEditBookingRequest({}),
    /At least one editable booking field/i,
  );

  assert.throws(
    () =>
      parseCreateTimeSlotRequest({
        serviceId: "svc-hair-styling",
        date: "2026-04-12",
        startTime: "10:00",
        endTime: "09:00",
        capacity: 2,
      }),
    /endTime must be later/i,
  );
});
