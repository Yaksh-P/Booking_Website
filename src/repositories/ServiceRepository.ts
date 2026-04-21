import { randomUUID } from "crypto";

import { readCollection, writeCollection } from "../config/database";
import { Service } from "../entities/Service";
import { TimeSlot } from "../entities/TimeSlot";

interface TimeSlotFilters {
  serviceId?: string;
  date?: string;
}

export function createServiceRepository() {
  const listServices = () =>
    readCollection<Service>("services").sort((left, right) =>
      left.name.localeCompare(right.name),
    );

  const listActiveServices = () => listServices().filter((service) => service.isActive);

  const findById = (id: string) => listServices().find((service) => service.id === id);

  const listTimeSlots = (filters?: TimeSlotFilters) =>
    readCollection<TimeSlot>("timeSlots")
      .filter((timeSlot) => {
        if (filters?.serviceId && timeSlot.serviceId !== filters.serviceId) {
          return false;
        }

        if (filters?.date && timeSlot.date !== filters.date) {
          return false;
        }

        return true;
      })
      .sort((left, right) =>
        `${left.date}-${left.startTime}`.localeCompare(`${right.date}-${right.startTime}`),
      );

  const findTimeSlotById = (id: string) =>
    listTimeSlots().find((timeSlot) => timeSlot.id === id);

  const createTimeSlot = (timeSlot: Omit<TimeSlot, "id" | "createdAt">) => {
    const timeSlots = listTimeSlots();

    const createdTimeSlot: TimeSlot = {
      ...timeSlot,
      id: randomUUID(),
      createdAt: new Date().toISOString(),
    };

    timeSlots.push(createdTimeSlot);
    writeCollection("timeSlots", timeSlots);

    return createdTimeSlot;
  };

  return {
    listServices,
    listActiveServices,
    findById,
    listTimeSlots,
    findTimeSlotById,
    createTimeSlot,
  };
}

export type ServiceRepository = ReturnType<typeof createServiceRepository>;
