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
