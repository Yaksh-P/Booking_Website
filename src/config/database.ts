import fs from "fs";
import path from "path";

import { hashPassword } from "../utils/password";

type CollectionName = "users" | "services" | "timeSlots" | "bookings";

type SeedData = Record<CollectionName, unknown[]>;

const DEFAULT_SEED_DATA: SeedData = {
  users: [
    {
      id: "user-admin-1",
      name: "System Admin",
      email: "admin@booking.local",
      passwordHash: hashPassword("Admin123!", "seed-admin-salt"),
      role: "ADMIN",
      createdAt: "2026-04-01T09:00:00.000Z",
    },
    {
      id: "user-customer-1",
      name: "Jane Customer",
      email: "jane@example.com",
      passwordHash: hashPassword("User123!", "seed-customer-salt"),
      role: "CUSTOMER",
      createdAt: "2026-04-01T09:10:00.000Z",
    },
  ],
  services: [
    {
      id: "svc-hair-styling",
      name: "Hair Styling Session",
      description: "A 60 minute salon appointment.",
      durationMinutes: 60,
      price: 65,
      isActive: true,
      createdAt: "2026-04-01T10:00:00.000Z",
    },
    {
      id: "svc-relax-massage",
      name: "Relaxation Massage",
      description: "A 60 minute massage service.",
      durationMinutes: 60,
      price: 90,
      isActive: true,
      createdAt: "2026-04-01T10:05:00.000Z",
    },
  ],
  timeSlots: [
    {
      id: "slot-100",
      serviceId: "svc-hair-styling",
      date: "2026-04-10",
      startTime: "09:00",
      endTime: "10:00",
      capacity: 2,
      createdAt: "2026-04-01T11:00:00.000Z",
    },
    {
      id: "slot-101",
      serviceId: "svc-hair-styling",
      date: "2026-04-10",
      startTime: "10:00",
      endTime: "11:00",
      capacity: 2,
      createdAt: "2026-04-01T11:05:00.000Z",
    },
    {
      id: "slot-200",
      serviceId: "svc-relax-massage",
      date: "2026-04-11",
      startTime: "13:00",
      endTime: "14:00",
      capacity: 1,
      createdAt: "2026-04-01T11:10:00.000Z",
    },
    {
      id: "slot-201",
      serviceId: "svc-relax-massage",
      date: "2026-04-11",
      startTime: "15:00",
      endTime: "16:00",
      capacity: 1,
      createdAt: "2026-04-01T11:15:00.000Z",
    },
  ],
  bookings: [],
};

const FILE_NAMES: Record<CollectionName, string> = {
  users: "users.json",
  services: "services.json",
  timeSlots: "timeSlots.json",
  bookings: "bookings.json",
};

function cloneSeedData(seedData: SeedData) {
  return JSON.parse(JSON.stringify(seedData)) as SeedData;
}

export function getDefaultSeedData() {
  return cloneSeedData(DEFAULT_SEED_DATA);
}

export function getDataDirectory() {
  return path.resolve(process.env.DATA_DIRECTORY ?? path.join("database", "data"));
}

export function initializeDatabase() {
  const dataDirectory = getDataDirectory();
  fs.mkdirSync(dataDirectory, { recursive: true });

  const seedData = getDefaultSeedData();

  (Object.keys(FILE_NAMES) as CollectionName[]).forEach((collectionName) => {
    const filePath = path.join(dataDirectory, FILE_NAMES[collectionName]);
    if (!fs.existsSync(filePath)) {
      fs.writeFileSync(
        filePath,
        JSON.stringify(seedData[collectionName], null, 2),
        "utf-8",
      );
    }
  });
}

export function resetDatabase(overrides?: Partial<SeedData>) {
  const dataDirectory = getDataDirectory();
  fs.mkdirSync(dataDirectory, { recursive: true });

  const nextSeedData = {
    ...getDefaultSeedData(),
    ...overrides,
  };

  (Object.keys(FILE_NAMES) as CollectionName[]).forEach((collectionName) => {
    const filePath = path.join(dataDirectory, FILE_NAMES[collectionName]);
    fs.writeFileSync(
      filePath,
      JSON.stringify(nextSeedData[collectionName], null, 2),
      "utf-8",
    );
  });
}

export function readCollection<T>(collectionName: CollectionName): T[] {
  initializeDatabase();
  const filePath = path.join(getDataDirectory(), FILE_NAMES[collectionName]);
  const raw = fs.readFileSync(filePath, "utf-8");
  return JSON.parse(raw) as T[];
}

export function writeCollection<T>(collectionName: CollectionName, data: T[]) {
  initializeDatabase();
  const filePath = path.join(getDataDirectory(), FILE_NAMES[collectionName]);
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2), "utf-8");
}
