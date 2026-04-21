import { createAppError } from "../utils/AppError";

function ensureString(value: unknown, fieldName: string) {
  if (typeof value !== "string" || value.trim().length === 0) {
    throw createAppError(`${fieldName} is required.`, 400);
  }

  return value.trim();
}

function ensureOptionalString(value: unknown) {
  if (value === undefined) {
    return undefined;
  }

  if (typeof value !== "string") {
    throw createAppError("Optional fields must be strings when provided.", 400);
  }

  return value.trim();
}

function ensurePositiveInteger(value: unknown, fieldName: string) {
  const numeric = Number(value);
  if (!Number.isInteger(numeric) || numeric <= 0) {
    throw createAppError(`${fieldName} must be a positive integer.`, 400);
  }

  return numeric;
}

function ensureDate(value: unknown, fieldName: string) {
  const date = ensureString(value, fieldName);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    throw createAppError(`${fieldName} must be in YYYY-MM-DD format.`, 400);
  }
  return date;
}

function ensureTime(value: unknown, fieldName: string) {
  const time = ensureString(value, fieldName);
  if (!/^\d{2}:\d{2}$/.test(time)) {
    throw createAppError(`${fieldName} must be in HH:mm format.`, 400);
  }
  return time;
}

export interface ListBookingsQuery {
  page: number;
  pageSize: number;
  status?: string;
}

export function parseListBookingsQuery(query: unknown): ListBookingsQuery {
  const input = (query ?? {}) as Record<string, unknown>;

  return {
    page: input.page === undefined ? 1 : ensurePositiveInteger(input.page, "page"),
    pageSize:
      input.pageSize === undefined ? 10 : ensurePositiveInteger(input.pageSize, "pageSize"),
    status: input.status === undefined ? undefined : ensureString(input.status, "status"),
  };
}

export function parseUpdateBookingStatusRequest(payload: unknown) {
  const input = (payload ?? {}) as Record<string, unknown>;
  const status = ensureString(input.status, "status").toUpperCase();

  if (!["PENDING", "CONFIRMED", "DECLINED", "CANCELLED"].includes(status)) {
    throw createAppError("status must be one of PENDING, CONFIRMED, DECLINED or CANCELLED.", 400);
  }

  return {
    status,
    adminNotes: ensureOptionalString(input.adminNotes),
  };
}

export function parseEditBookingRequest(payload: unknown) {
  const input = (payload ?? {}) as Record<string, unknown>;

  const result = {
    serviceId: input.serviceId === undefined ? undefined : ensureString(input.serviceId, "serviceId"),
    timeSlotId: input.timeSlotId === undefined ? undefined : ensureString(input.timeSlotId, "timeSlotId"),
    guestName: ensureOptionalString(input.guestName),
    guestEmail: ensureOptionalString(input.guestEmail),
    guestPhone: ensureOptionalString(input.guestPhone),
    notes: ensureOptionalString(input.notes),
    adminNotes: ensureOptionalString(input.adminNotes),
  };

  if (Object.values(result).every((value) => value === undefined)) {
    throw createAppError("At least one editable booking field must be supplied.", 400);
  }

  return result;
}

export function parseCreateTimeSlotRequest(payload: unknown) {
  const input = (payload ?? {}) as Record<string, unknown>;
  const startTime = ensureTime(input.startTime, "startTime");
  const endTime = ensureTime(input.endTime, "endTime");

  if (startTime >= endTime) {
    throw createAppError("endTime must be later than startTime.", 400);
  }

  return {
    serviceId: ensureString(input.serviceId, "serviceId"),
    date: ensureDate(input.date, "date"),
    startTime,
    endTime,
    capacity: ensurePositiveInteger(input.capacity, "capacity"),
  };
}
