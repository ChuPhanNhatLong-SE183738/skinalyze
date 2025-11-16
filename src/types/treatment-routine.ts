import { RoutineDetail } from "./routine-detail";

export enum RoutineStatus {
  ACTIVE = "ACTIVE",
  COMPLETED = "COMPLETED",
  CANCELLED = "CANCELLED",
}

export interface CreateTreatmentRoutineDto {
  routineName: string;
  dermatologistId: string;
  customerId: string;
  originalAnalysisId?: string;
  createdFromAppointmentId?: string;
  status: RoutineStatus;
}

export type UpdateTreatmentRoutineDto = Partial<CreateTreatmentRoutineDto>;

export interface TreatmentRoutine {
  routineId: string;
  routineName: string;
  status: RoutineStatus;
  dermatologistId: string;
  routineDetails: RoutineDetail[];
  customerId: string;
  createdFromAppointmentId: string | null;
  createdAt: string;
  updatedAt: string;
}
