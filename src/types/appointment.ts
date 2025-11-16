import { Customer } from "./customer";
import type { Dermatologist } from "./dermatologist";

// (Giả định type 'Payment' đơn giản)
export interface Payment {
  paymentId: string;
  amount: number;
  paymentStatus: string;
}

export enum AppointmentStatus {
  PENDING_PAYMENT = "PENDING_PAYMENT",
  SCHEDULED = "SCHEDULED",
  IN_PROGRESS = "IN_PROGRESS",
  COMPLETED = "COMPLETED",
  CANCELLED = "CANCELLED",
  NO_SHOW = "NO_SHOW",
  INTERRUPTED = "INTERRUPTED",
}

export enum AppointmentType {
  NEW_PROBLEM = "NEW_PROBLEM",
  FOLLOW_UP = "FOLLOW_UP",
}

export enum TerminationReason {
  CUSTOMER_CANCELLED_EARLY = "CUSTOMER_CANCELLED_EARLY",
  CUSTOMER_CANCELLED_LATE = "CUSTOMER_CANCELLED_LATE",
  DOCTOR_CANCELLED = "DOCTOR_CANCELLED",
  PAYMENT_TIMEOUT = "PAYMENT_TIMEOUT",
  SYSTEM_CANCELLED = "SYSTEM_CANCELLED",
  CUSTOMER_NO_SHOW = "CUSTOMER_NO_SHOW",
  DOCTOR_NO_SHOW = "DOCTOR_NO_SHOW",
  CUSTOMER_ISSUE = "CUSTOMER_ISSUE",
  DOCTOR_ISSUE = "DOCTOR_ISSUE",
  PLATFORM_ISSUE = "PLATFORM_ISSUE",
}

export interface Appointment {
  appointmentId: string;
  startTime: string;
  endTime: string;
  price: number;
  note: string | null;
  meetingUrl: string | null;
  appointmentType: AppointmentType;
  appointmentStatus: AppointmentStatus;
  terminatedReason: TerminationReason | null;
  terminationNote?: string | null;
  createdAt: string;

  customer: Customer;
  dermatologist: Dermatologist;
  payment: Payment | null;
}
