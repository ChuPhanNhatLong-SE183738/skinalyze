import type { User } from "./user";

export interface Customer {
  customerId: string;
  user: User;
  allergicTo: string[] | null;
  pastDermatologicalHistory: string[] | null;
  aiUsageAmount: number;
}
