export type BookingStatus = "PENDING" | "CONFIRMED" | "DECLINED" | "CANCELLED";
export type BookingCustomerType = "GUEST" | "REGISTERED";

export interface Booking {
  id: string;
  reference: string;
  serviceId: string;
  timeSlotId: string;
  status: BookingStatus;
  customerType: BookingCustomerType;
  userId?: string;
  guestName: string;
  guestEmail: string;
  guestPhone?: string;
  notes?: string;
  adminNotes?: string;
  createdAt: string;
  updatedAt: string;
}
