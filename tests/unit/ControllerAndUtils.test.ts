import assert from "assert/strict";
import test from "node:test";

import { createAdminController } from "../../src/controllers/AdminController";
import { createBookingController } from "../../src/controllers/BookingController";
import {
  parseCreateTimeSlotRequest,
  parseEditBookingRequest,
  parseListBookingsQuery,
} from "../../src/dtos/admin.dto";
import {
  parseLoginRequest,
  parseRegisterRequest,
} from "../../src/dtos/auth.dto";
import {
  parseAvailabilityQuery,
  parseCreateBookingRequest,
} from "../../src/dtos/booking.dto";
import { paginate, parsePagination } from "../../src/utils/pagination";
import { hashPassword, verifyPassword } from "../../src/utils/password";

function createResponseRecorder() {
  return {
    statusCode: 0,
    payload: undefined as unknown,
    status(code: number) {
      this.statusCode = code;
      return this;
    },
    json(payload: unknown) {
      this.payload = payload;
      return this;
    },
  };
}

test("BookingController supports fallback request branches and direct handlers", () => {
  const bookingService = {
    listServices: () => [{ id: "svc-1" }],
    getAvailability: (query: unknown) => [{ query }],
    createBooking: (payload: unknown, currentUser?: unknown) => ({
      payload,
      currentUser,
    }),
    listBookingsForUser: (userId: string) => [{ userId }],
    lookupGuestBooking: (reference: string, email: string) => ({
      reference,
      email,
    }),
    cancelBooking: (bookingId: string, actor: unknown) => ({
      bookingId,
      actor,
    }),
  } as any;

  const controller = createBookingController(bookingService);

  const listServicesResponse = createResponseRecorder();
  controller.listServices({} as any, listServicesResponse as any);
  assert.equal(listServicesResponse.statusCode, 200);

  const availabilityResponse = createResponseRecorder();
  controller.getAvailability(
    { query: { date: "2026-04-10" } } as any,
    availabilityResponse as any,
  );
  assert.equal(availabilityResponse.statusCode, 200);

  const createResponse = createResponseRecorder();
  controller.createBooking(
    {
      validated: { serviceId: "svc-1", timeSlotId: "slot-1" },
    } as any,
    createResponse as any,
  );
  assert.equal(createResponse.statusCode, 201);

  const listMyBookingsResponse = createResponseRecorder();
  controller.listMyBookings({} as any, listMyBookingsResponse as any);
  assert.deepEqual((listMyBookingsResponse.payload as any).data, [
    { userId: "" },
  ]);

  const lookupResponse = createResponseRecorder();
  controller.lookupGuestBooking(
    { params: {}, query: {} } as any,
    lookupResponse as any,
  );
  assert.deepEqual((lookupResponse.payload as any).data, {
    reference: "",
    email: "",
  });

  const cancelResponse = createResponseRecorder();
  controller.cancelBooking(
    {
      params: {},
      validated: {},
    } as any,
    cancelResponse as any,
  );
  assert.deepEqual((cancelResponse.payload as any).data, {
    bookingId: "",
    actor: {
      userId: undefined,
      guestEmail: undefined,
    },
  });
});

test("AdminController supports fallback admin branches and direct handlers", () => {
  const adminService = {
    listBookings: (query: unknown) => ({ query }),
    getAnalytics: () => ({ totalBookings: 1 }),
    updateBookingStatus: (
      bookingId: string,
      payload: unknown,
      updatedBy: string,
    ) => ({
      bookingId,
      payload,
      updatedBy,
    }),
    editBooking: (bookingId: string, payload: unknown) => ({
      bookingId,
      payload,
    }),
    createTimeSlot: (payload: unknown) => ({ payload }),
  } as any;

  const controller = createAdminController(adminService);

  const listResponse = createResponseRecorder();
  controller.listBookings({ query: {} } as any, listResponse as any);
  assert.equal((listResponse.payload as any).data.query.page, 1);

  const analyticsResponse = createResponseRecorder();
  controller.getAnalytics({} as any, analyticsResponse as any);
  assert.equal((analyticsResponse.payload as any).data.totalBookings, 1);

  const statusResponse = createResponseRecorder();
  controller.updateBookingStatus(
    {
      params: {},
      validated: { status: "CONFIRMED" },
    } as any,
    statusResponse as any,
  );
  assert.deepEqual((statusResponse.payload as any).data, {
    bookingId: "",
    payload: { status: "CONFIRMED" },
    updatedBy: "unknown-admin",
  });

  const editResponse = createResponseRecorder();
  controller.editBooking(
    {
      params: {},
      validated: { notes: "Edited" },
    } as any,
    editResponse as any,
  );
  assert.deepEqual((editResponse.payload as any).data, {
    bookingId: "",
    payload: { notes: "Edited" },
  });

  const slotResponse = createResponseRecorder();
  controller.createTimeSlot(
    {
      validated: { serviceId: "svc-1", date: "2026-04-12" },
    } as any,
    slotResponse as any,
  );
  assert.equal(slotResponse.statusCode, 201);
});

test("DTO helpers cover default and optional validation branches", () => {
  assert.deepEqual(parseListBookingsQuery({}), {
    page: 1,
    pageSize: 10,
    status: undefined,
  });

  assert.throws(
    () =>
      parseEditBookingRequest({
        guestPhone: 123,
      }),
    /Optional fields must be strings/i,
  );

  assert.throws(
    () =>
      parseCreateTimeSlotRequest({
        serviceId: "svc-hair-styling",
        date: "2026-04-12",
        startTime: "9am",
        endTime: "10:00",
        capacity: 2,
      }),
    /startTime must be in HH:mm format/i,
  );

  assert.throws(
    () =>
      parseRegisterRequest({
        name: "Valid User",
        email: "valid@example.com",
        password: "",
      }),
    /password is required/i,
  );

  assert.throws(
    () =>
      parseLoginRequest({
        email: "valid@example.com",
        password: "short",
      }),
    /at least 8 characters/i,
  );

  const bookingPayload = parseCreateBookingRequest({
    serviceId: "svc-hair-styling",
    timeSlotId: "slot-100",
    guestPhone: undefined,
    notes: "  Trim me  ",
  });
  assert.equal(bookingPayload.notes, "Trim me");

  const availabilityQuery = parseAvailabilityQuery({});
  assert.deepEqual(availabilityQuery, {
    serviceId: undefined,
    date: undefined,
  });
});

test("pagination and password utilities cover edge cases", () => {
  const paginated = paginate(["a", "b"], 5, {
    page: 2,
    limit: 2,
  });
  assert.equal(paginated.pagination.totalPages, 3);

  assert.deepEqual(parsePagination({}), { page: 1, limit: 10 });
  assert.deepEqual(parsePagination({ page: "0", limit: "999" }), {
    page: 1,
    limit: 100,
  });
  assert.deepEqual(parsePagination({ page: "3", limit: "-5" }), {
    page: 3,
    limit: 1,
  });

  const hashed = hashPassword("Password123", "fixed-salt");
  assert.equal(verifyPassword("Password123", hashed), true);
  assert.equal(verifyPassword("Password123", "invalid-hash-format"), false);
});
