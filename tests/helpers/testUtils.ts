import { mkdtempSync, rmSync } from "fs";
import { tmpdir } from "os";
import path from "path";
import { once } from "events";

import { createApp } from "../../src/app";
import { getDefaultSeedData, resetDatabase } from "../../src/config/database";

type SeedOverrides = Parameters<typeof resetDatabase>[0];

export function setupTestEnvironment(overrides?: SeedOverrides) {
  const originalEnvironment = {
    DATA_DIRECTORY: process.env.DATA_DIRECTORY,
    LOG_DIRECTORY: process.env.LOG_DIRECTORY,
    TOKEN_SECRET: process.env.TOKEN_SECRET,
    NODE_ENV: process.env.NODE_ENV,
  };

  const dataDirectory = mkdtempSync(path.join(tmpdir(), "booking-api-tests-"));

  process.env.DATA_DIRECTORY = dataDirectory;
  process.env.LOG_DIRECTORY = path.join(dataDirectory, "logs");
  process.env.TOKEN_SECRET = "test-secret";
  process.env.NODE_ENV = "test";

  resetDatabase(overrides);

  return {
    dataDirectory,
    defaultSeed: getDefaultSeedData(),
    cleanup() {
      process.env.DATA_DIRECTORY = originalEnvironment.DATA_DIRECTORY;
      process.env.LOG_DIRECTORY = originalEnvironment.LOG_DIRECTORY;
      process.env.TOKEN_SECRET = originalEnvironment.TOKEN_SECRET;
      process.env.NODE_ENV = originalEnvironment.NODE_ENV;

      rmSync(dataDirectory, { recursive: true, force: true });
    },
  };
}

export async function startTestServer() {
  const app = createApp();
  const server = app.listen(0);

  await once(server, "listening");

  const address = server.address();
  if (!address || typeof address === "string") {
    throw new Error("Could not determine test server address.");
  }

  return {
    baseUrl: `http://127.0.0.1:${address.port}`,
    async close() {
      await new Promise<void>((resolve, reject) => {
        server.close((error) => {
          if (error) {
            reject(error);
            return;
          }

          resolve();
        });
      });
    },
  };
}

export async function requestJson(
  baseUrl: string,
  route: string,
  options?: {
    method?: string;
    token?: string;
    body?: unknown;
  },
) {
  const headers: Record<string, string> = {};

  if (options?.body !== undefined) {
    headers["Content-Type"] = "application/json";
  }

  if (options?.token) {
    headers.Authorization = `Bearer ${options.token}`;
  }

  const response = await fetch(`${baseUrl}${route}`, {
    method: options?.method ?? "GET",
    headers,
    body: options?.body === undefined ? undefined : JSON.stringify(options.body),
  });

  const rawBody = await response.text();

  return {
    status: response.status,
    body: rawBody ? (JSON.parse(rawBody) as Record<string, unknown>) : undefined,
  };
}
