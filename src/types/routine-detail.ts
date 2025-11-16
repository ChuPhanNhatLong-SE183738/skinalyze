import { TreatmentRoutine } from "./treatment-routine";

export interface RoutineDetail {
  routineDetailId: string;
  productIds: string[];
  description: string;
  content: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  treatmentRoutine: TreatmentRoutine;
}

export interface CreateRoutineDetailDto {
  routineId: string;
  description: string;
  content: string;
  productIds: string[];
}

export type UpdateRoutineDetailDto = Partial<
  Pick<CreateRoutineDetailDto, "description" | "content" | "productIds">
>;
