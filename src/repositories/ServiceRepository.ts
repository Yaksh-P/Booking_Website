import { randomUUID } from "crypto";

import { readCollection, writeCollection } from "../config/database";
import { Service } from "../entities/Service";
import { TimeSlot } from "../entities/TimeSlot";

interface TimeSlotFilters {
  serviceId?: string;
  date?: string;
}

export class ServiceRepository {
  listServices() {
    return readCollection<Service>("services").sort((left, right) =>
      left.name.localeCompare(right.name),
    );
  }

  listActiveServices() {
    return this.listServices().filter((service) => service.isActive);
  }

  findById(id: string) {
    return this.listServices().find((service) => service.id === id);
  }

  listTimeSlots(filters?: TimeSlotFilters) {
    return readCollection<TimeSlot>("timeSlots")
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
  }

  findTimeSlotById(id: string) {
    return this.listTimeSlots().find((timeSlot) => timeSlot.id === id);
  }

  createTimeSlot(timeSlot: Omit<TimeSlot, "id" | "createdAt">) {
    const timeSlots = this.listTimeSlots();

    const createdTimeSlot: TimeSlot = {
      ...timeSlot,
      id: randomUUID(),
      createdAt: new Date().toISOString(),
    };

    timeSlots.push(createdTimeSlot);
    writeCollection("timeSlots", timeSlots);

    return createdTimeSlot;
  }
}
