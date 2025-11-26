import { User } from "./user";

export interface Dermatologist {
  dermatologistId: string;
  userId: string;
  yearsOfExperience: number;
  defaultSlotPrice: number;
  createdAt: string;
  updatedAt: string;
  user?: User;
}

export interface GetMyPatientsDto {
  search?: string;
  page?: number;
  limit?: number;
}

export interface PatientListItemDto {
  customerId: string;
  userId: string;
  fullName: string;
  photoUrl: string | null;
  phone: string;
  age: number | null;
  gender: boolean | null; // true: Male, false: Female

  // Appointment information
  lastAppointment: {
    appointmentId: string;
    date: Date;
    status: string;
    type: string;
  } | null;

  nextAppointment: {
    appointmentId: string;
    date: Date;
    status: string;
    isToday: boolean;
  } | null;
}

export interface PatientsResponse {
  data: PatientListItemDto[];
  total: number;
  page: number;
  limit: number;
}
