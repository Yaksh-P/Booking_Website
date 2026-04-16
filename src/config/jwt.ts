import { createHmac, timingSafeEqual } from "crypto";

import { AppError } from "../utils/AppError";

export interface AuthTokenPayload {
  sub: string;
  email: string;
  name: string;
  role: string;
  iat: number;
  exp: number;
}

function toBase64Url(value: string | Buffer) {
  return Buffer.from(value)
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/g, "");
}

function fromBase64Url(value: string) {
  const normalized = value.replace(/-/g, "+").replace(/_/g, "/");
  const padding = normalized.length % 4;
  const padded =
    padding === 0 ? normalized : `${normalized}${"=".repeat(4 - padding)}`;
  return Buffer.from(padded, "base64");
}

function getTokenSecret() {
  return process.env.TOKEN_SECRET ?? "development-secret";
}

function signSegment(input: string) {
  return toBase64Url(
    createHmac("sha256", getTokenSecret()).update(input).digest(),
  );
}

export function signToken(
  payload: Omit<AuthTokenPayload, "iat" | "exp">,
  expiresInSeconds = 60 * 60 * 8,
) {
  const nowInSeconds = Math.floor(Date.now() / 1000);
  const header = toBase64Url(JSON.stringify({ alg: "HS256", typ: "JWT" }));
  const body = toBase64Url(
    JSON.stringify({
      ...payload,
      iat: nowInSeconds,
      exp: nowInSeconds + expiresInSeconds,
    }),
  );
  const signature = signSegment(`${header}.${body}`);
  return `${header}.${body}.${signature}`;
}

export function verifyToken(token: string) {
  const segments = token.split(".");
  if (segments.length !== 3) {
    throw new AppError("Authentication token format is invalid.", 401);
  }

  const header = segments[0]!;
  const body = segments[1]!;
  const signature = segments[2]!;
  const expectedSignature = signSegment(`${header}.${body}`);

  const expectedBuffer = Buffer.from(expectedSignature, "utf-8");
  const actualBuffer = Buffer.from(signature, "utf-8");

  if (
    expectedBuffer.length !== actualBuffer.length ||
    !timingSafeEqual(expectedBuffer, actualBuffer)
  ) {
    throw new AppError("Authentication token is invalid.", 401);
  }

  const payload = JSON.parse(
    fromBase64Url(body).toString("utf-8"),
  ) as AuthTokenPayload;

  if (payload.exp <= Math.floor(Date.now() / 1000)) {
    throw new AppError("Authentication token has expired.", 401);
  }

  return payload;
}
