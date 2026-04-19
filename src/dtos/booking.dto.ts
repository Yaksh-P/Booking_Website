import { AppError } from "../utils/AppError";

function ensureString(value: unknown, fieldName: string) {
  if (typeof value !== "string" || value.trim().length === 0) {
    throw new AppError(`${fieldName} is required.`, 400);
  }

  return value.trim();
}

function ensureOptionalString(value: unknown) {
  if (value === undefined) {
    return undefined;
  }

  if (typeof value !== "string") {
    throw new AppError("Optional fields must be strings when provided.", 400);
  }

  return value.trim();
}

function ensureEmail(value: unknown, fieldName: string) {
  const email = ensureString(value, fieldName).toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    throw new AppError(`${fieldName} must be a valid email address.`, 400);
  }
  return email;
}

function ensureDate(value: unknown, fieldName: string) {
  const date = ensureString(value, fieldName);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    throw new AppError(`${fieldName} must be in YYYY-MM-DD format.`, 400);
  }
  return date;
}

export function parseAvailabilityQuery(query: unknown) {
  const input = (query ?? {}) as Record<string, unknown>;

  return {
    serviceId:
      input.serviceId === undefined ? undefined : ensureString(input.serviceId, "serviceId"),
    date: input.date === undefined ? undefined : ensureDate(input.date, "date"),
  };
}

export function parseCreateBookingRequest(payload: unknown) {
  const input = (payload ?? {}) as Record<string, unknown>;

  return {
    serviceId: ensureString(input.serviceId, "serviceId"),
    timeSlotId: ensureString(input.timeSlotId, "timeSlotId"),
    guestName: ensureOptionalString(input.guestName),
    guestEmail:
      input.guestEmail === undefined ? undefined : ensureEmail(input.guestEmail, "guestEmail"),
    guestPhone: ensureOptionalString(input.guestPhone),
    notes: ensureOptionalString(input.notes),
  };
}

export function parseCancelBookingRequest(payload: unknown) {
  const input = (payload ?? {}) as Record<string, unknown>;

  return {
    guestEmail:
      input.guestEmail === undefined ? undefined : ensureEmail(input.guestEmail, "guestEmail"),
  };
}
