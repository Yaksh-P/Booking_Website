import assert from "assert/strict";
import test from "node:test";

import { requestJson, setupTestEnvironment, startTestServer } from "../helpers/testUtils";

test("Guest users can create, look up, and cancel a booking", async () => {
  const testEnvironment = setupTestEnvironment();
  const server = await startTestServer();

  try {
    const createResponse = await requestJson(server.baseUrl, "/api/bookings", {
      method: "POST",
      body: {
        serviceId: "svc-hair-styling",
        timeSlotId: "slot-100",
        guestName: "Guest Flow",
        guestEmail: "guestflow@example.com",
      },
    });

    assert.equal(createResponse.status, 201);

    const booking = createResponse.body?.data as { id: string; reference: string };

    const lookupResponse = await requestJson(
      server.baseUrl,
      `/api/bookings/lookup/${booking.reference}?email=guestflow@example.com`,
    );

    assert.equal(lookupResponse.status, 200);

    const cancelResponse = await requestJson(
      server.baseUrl,
      `/api/bookings/${booking.id}/cancel`,
      {
        method: "PATCH",
        body: {
          guestEmail: "guestflow@example.com",
        },
      },
    );

    assert.equal(cancelResponse.status, 200);
    assert.equal(
      (cancelResponse.body?.data as { status: string }).status,
      "CANCELLED",
    );
  } finally {
    await server.close();
    testEnvironment.cleanup();
  }
});

test("Registered users can book, admins can review requests, and analytics are protected", async () => {
  const testEnvironment = setupTestEnvironment();
  const server = await startTestServer();

  try {
    const customerLogin = await requestJson(server.baseUrl, "/api/auth/login", {
      method: "POST",
      body: {
        email: "jane@example.com",
        password: "User123!",
      },
    });

    const customerToken = String((customerLogin.body?.data as { token: string }).token);

    const createResponse = await requestJson(server.baseUrl, "/api/bookings", {
      method: "POST",
      token: customerToken,
      body: {
        serviceId: "svc-hair-styling",
        timeSlotId: "slot-101",
      },
    });

    assert.equal(createResponse.status, 201);

    const myBookingsResponse = await requestJson(server.baseUrl, "/api/bookings/me", {
      token: customerToken,
    });

    assert.equal(myBookingsResponse.status, 200);
    assert.equal(((myBookingsResponse.body?.data as unknown[]) ?? []).length, 1);

    const unauthorizedAnalyticsResponse = await requestJson(
      server.baseUrl,
      "/api/admin/analytics",
      { token: customerToken },
    );

    assert.equal(unauthorizedAnalyticsResponse.status, 403);

    const adminLogin = await requestJson(server.baseUrl, "/api/auth/login", {
      method: "POST",
      body: {
        email: "admin@booking.local",
        password: "Admin123!",
      },
    });

    const adminToken = String((adminLogin.body?.data as { token: string }).token);
    const bookingId = String((createResponse.body?.data as { id: string }).id);

    const updateStatusResponse = await requestJson(
      server.baseUrl,
      `/api/admin/bookings/${bookingId}/status`,
      {
        method: "PATCH",
        token: adminToken,
        body: {
          status: "CONFIRMED",
          adminNotes: "Approved in integration test",
        },
      },
    );

    assert.equal(updateStatusResponse.status, 200);

    const analyticsResponse = await requestJson(server.baseUrl, "/api/admin/analytics", {
      token: adminToken,
    });

    assert.equal(analyticsResponse.status, 200);
    assert.equal(
      (analyticsResponse.body?.data as { confirmedBookings: number }).confirmedBookings,
      1,
    );
  } finally {
    await server.close();
    testEnvironment.cleanup();
  }
});

test("Service listing, availability, admin booking pagination, editing, and slot creation all work", async () => {
  const testEnvironment = setupTestEnvironment();
  const server = await startTestServer();

  try {
    const servicesResponse = await requestJson(server.baseUrl, "/api/bookings/services");
    assert.equal(servicesResponse.status, 200);
    assert.equal(((servicesResponse.body?.data as unknown[]) ?? []).length >= 2, true);

    const availabilityResponse = await requestJson(
      server.baseUrl,
      "/api/bookings/availability?serviceId=svc-hair-styling&date=2026-04-10",
    );
    assert.equal(availabilityResponse.status, 200);

    const createResponse = await requestJson(server.baseUrl, "/api/bookings", {
      method: "POST",
      body: {
        serviceId: "svc-hair-styling",
        timeSlotId: "slot-100",
        guestName: "Pagination Guest",
        guestEmail: "pagination@example.com",
      },
    });
    assert.equal(createResponse.status, 201);

    const adminLogin = await requestJson(server.baseUrl, "/api/auth/login", {
      method: "POST",
      body: {
        email: "admin@booking.local",
        password: "Admin123!",
      },
    });
    const adminToken = String((adminLogin.body?.data as { token: string }).token);
    const bookingId = String((createResponse.body?.data as { id: string }).id);

    const listBookingsResponse = await requestJson(
      server.baseUrl,
      "/api/admin/bookings?page=1&pageSize=1&status=PENDING",
      { token: adminToken },
    );
    assert.equal(listBookingsResponse.status, 200);
    assert.equal(
      ((listBookingsResponse.body?.data as { pagination: { total: number } }).pagination).total,
      1,
    );

    const editBookingResponse = await requestJson(
      server.baseUrl,
      `/api/admin/bookings/${bookingId}`,
      {
        method: "PATCH",
        token: adminToken,
        body: {
          timeSlotId: "slot-101",
          notes: "Edited by admin",
        },
      },
    );
    assert.equal(editBookingResponse.status, 200);

    const createSlotResponse = await requestJson(server.baseUrl, "/api/admin/slots", {
      method: "POST",
      token: adminToken,
      body: {
        serviceId: "svc-relax-massage",
        date: "2026-04-12",
        startTime: "09:00",
        endTime: "10:00",
        capacity: 2,
      },
    });
    assert.equal(createSlotResponse.status, 201);
  } finally {
    await server.close();
    testEnvironment.cleanup();
  }
});
