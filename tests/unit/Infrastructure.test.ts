import assert from "assert/strict";
import fs from "fs";
import path from "path";
import test from "node:test";

import { errorHandler } from "../../src/middleware/errorHandler";
import { authenticate, authenticateOptional } from "../../src/middleware/authenticate";
import { authorize } from "../../src/middleware/authorize";
import { logger } from "../../src/config/logger";
import { signToken, verifyToken } from "../../src/config/jwt";
import { setupTestEnvironment } from "../helpers/testUtils";

test("JWT helpers, middleware, logger, and error handling cover infrastructure branches", () => {
  const testEnvironment = setupTestEnvironment();

  try {
    const validToken = signToken({
      sub: "user-1",
      email: "user@example.com",
      name: "Token User",
      role: "CUSTOMER",
    });

    assert.equal(verifyToken(validToken).sub, "user-1");
    assert.throws(() => verifyToken("bad-token"), /format is invalid/i);
    assert.throws(
      () => verifyToken(`${validToken.split(".").slice(0, 2).join(".")}.tampered`),
      /invalid/i,
    );
    assert.throws(
      () =>
        verifyToken(
          signToken(
            {
              sub: "user-1",
              email: "user@example.com",
              name: "Token User",
              role: "CUSTOMER",
            },
            -1,
          ),
        ),
      /expired/i,
    );

    let nextArgument: unknown;
    const authenticatedRequest = {
      headers: {
        authorization: `Bearer ${validToken}`,
      },
    } as any;
    authenticate(authenticatedRequest, {} as never, (error?: unknown) => {
      nextArgument = error;
    });
    assert.equal(nextArgument, undefined);
    assert.equal(authenticatedRequest.currentUser.sub, "user-1");

    authenticateOptional({ headers: {} } as any, {} as never, (error?: unknown) => {
      nextArgument = error;
    });
    assert.equal(nextArgument, undefined);

    authenticate(
      {
        headers: {
          authorization: "Token invalid",
        },
      } as any,
      {} as never,
      (error?: unknown) => {
        nextArgument = error;
      },
    );
    assert.match(String(nextArgument), /Bearer scheme/i);

    const requireAdmin = authorize("ADMIN");
    requireAdmin({} as any, {} as never, (error?: unknown) => {
      nextArgument = error;
    });
    assert.match(String(nextArgument), /Authentication is required/i);

    requireAdmin(
      {
        currentUser: {
          role: "CUSTOMER",
        },
      } as any,
      {} as never,
      (error?: unknown) => {
        nextArgument = error;
      },
    );
    assert.match(String(nextArgument), /do not have permission/i);

    process.env.NODE_ENV = "development";
    const originalConsole = {
      info: console.info,
      warn: console.warn,
      error: console.error,
    };
    console.info = () => undefined;
    console.warn = () => undefined;
    console.error = () => undefined;

    logger.info("Info log branch");
    logger.warn("Warn log branch");
    logger.error("Error log branch");

    console.info = originalConsole.info;
    console.warn = originalConsole.warn;
    console.error = originalConsole.error;

    const logDirectory = process.env.LOG_DIRECTORY ?? "";
    assert.equal(fs.existsSync(path.join(logDirectory, "application.log")), true);
    assert.equal(fs.existsSync(path.join(logDirectory, "errors.log")), true);

    const response = {
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

    errorHandler(
      new Error("Unexpected failure"),
      {
        originalUrl: "/test",
        method: "GET",
      } as any,
      response as any,
      (() => undefined) as never,
    );

    assert.equal(response.statusCode, 500);
  } finally {
    testEnvironment.cleanup();
  }
});
