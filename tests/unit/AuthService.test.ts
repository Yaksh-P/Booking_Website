import assert from "assert/strict";
import test from "node:test";

import { UserRepository } from "../../src/repositories/UserRepository";
import { AuthService } from "../../src/services/AuthService";
import { setupTestEnvironment } from "../helpers/testUtils";

test("AuthService registers a new customer and stores a hashed password", () => {
  const testEnvironment = setupTestEnvironment();

  try {
    const userRepository = new UserRepository();
    const authService = new AuthService(userRepository);

    const result = authService.register({
      name: "Maria Student",
      email: "maria@example.com",
      password: "Password123",
    });

    const storedUser = userRepository.findByEmail("maria@example.com");

    assert.ok(storedUser);
    assert.notEqual(storedUser.passwordHash, "Password123");
    assert.equal(result.user.email, "maria@example.com");
    assert.match(result.token, /^[^.]+\.[^.]+\.[^.]+$/);
  } finally {
    testEnvironment.cleanup();
  }
});

test("AuthService rejects an invalid login password", () => {
  const testEnvironment = setupTestEnvironment();

  try {
    const authService = new AuthService(new UserRepository());

    assert.throws(
      () =>
        authService.login({
          email: "admin@booking.local",
          password: "WrongPassword123",
        }),
      /incorrect/i,
    );
  } finally {
    testEnvironment.cleanup();
  }
});
