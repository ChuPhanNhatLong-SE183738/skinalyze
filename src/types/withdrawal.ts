export enum WithdrawalType {
  WITHDRAW = "withdraw",
  REFUND = "refund",
}

export enum WithdrawalStatus {
  PENDING = "pending",
  VERIFIED = "verified",
  APPROVED = "approved",
  REJECTED = "rejected",
  COMPLETED = "completed",
  CANCELLED = "cancelled",
}

export interface WithdrawalRequest {
  requestId: string;
  userId: string;
  otpCode: string;
  fullName: string;
  amount: number;
  type: WithdrawalType;
  bankName: string;
  accountNumber: string;
  notes?: string;
  status: WithdrawalStatus;
  processedBy?: string;
  processedAt?: string;
  rejectionReason?: string;
  createdAt: string;
  updatedAt: string;
}

export interface WithdrawalsResponse {
  data: WithdrawalRequest[];
  total: number;
  page: number;
  limit: number;
}

export interface UpdateWithdrawalStatusRequest {
  status: WithdrawalStatus;
  rejectionReason?: string;
  note?: string;
}
