import assert from "assert/strict";
import test from "node:test";

import { requestJson, setupTestEnvironment, startTestServer } from "../helpers/testUtils";

test("Auth endpoints support register, login, and profile lookup", async () => {
  const testEnvironment = setupTestEnvironment();
  const server = await startTestServer();

  try {
    const registerResponse = await requestJson(server.baseUrl, "/api/auth/register", {
      method: "POST",
      body: {
        name: "Integration User",
        email: "integration@example.com",
        password: "Password123",
      },
    });

    assert.equal(registerResponse.status, 201);

    const loginResponse = await requestJson(server.baseUrl, "/api/auth/login", {
      method: "POST",
      body: {
        email: "integration@example.com",
        password: "Password123",
      },
    });

    assert.equal(loginResponse.status, 200);

    const token = String((loginResponse.body?.data as { token: string }).token);

    const profileResponse = await requestJson(server.baseUrl, "/api/auth/me", {
      token,
    });

    assert.equal(profileResponse.status, 200);
    assert.equal(
      (profileResponse.body?.data as { email: string }).email,
      "integration@example.com",
    );
  } finally {
    await server.close();
    testEnvironment.cleanup();
  }
});

test("Auth validation returns a 400 response for invalid registration payloads", async () => {
  const testEnvironment = setupTestEnvironment();
  const server = await startTestServer();

  try {
    const response = await requestJson(server.baseUrl, "/api/auth/register", {
      method: "POST",
      body: {
        name: "",
        email: "not-an-email",
        password: "123",
      },
    });

    assert.equal(response.status, 400);
    assert.equal((response.body?.success as boolean) ?? true, false);
  } finally {
    await server.close();
    testEnvironment.cleanup();
  }
});

test("Health endpoint reports API status", async () => {
  const testEnvironment = setupTestEnvironment();
  const server = await startTestServer();

  try {
    const response = await requestJson(server.baseUrl, "/health");

    assert.equal(response.status, 200);
    assert.equal(
      (response.body?.data as { service: string }).service,
      "booking-web-application-api",
    );
  } finally {
    await server.close();
    testEnvironment.cleanup();
  }
});
