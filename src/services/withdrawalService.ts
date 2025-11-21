import type {
  WithdrawalsResponse,
  UpdateWithdrawalStatusRequest,
} from "@/types/withdrawal";

export class WithdrawalService {
  /**
   * Get all withdrawal requests (admin only)
   */
  async getWithdrawals(params?: {
    page?: number;
    limit?: number;
    status?: string;
  }): Promise<WithdrawalsResponse> {
    try {
      const queryParams = new URLSearchParams();
      if (params?.page) queryParams.append("page", params.page.toString());
      if (params?.limit) queryParams.append("limit", params.limit.toString());
      if (params?.status) queryParams.append("status", params.status);

      const response = await fetch(
        `/api/withdrawals${
          queryParams.toString() ? `?${queryParams.toString()}` : ""
        }`,
        {
          method: "GET",
          credentials: "include",
        }
      );

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to fetch withdrawal requests");
      }

      return await response.json();
    } catch (error: any) {
      throw new Error(error.message || "Failed to fetch withdrawal requests");
    }
  }

  /**
   * Get withdrawal request by ID
   */
  async getWithdrawalById(requestId: string): Promise<any> {
    try {
      const response = await fetch(`/api/withdrawals/${requestId}`, {
        method: "GET",
        credentials: "include",
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to fetch withdrawal request");
      }

      return await response.json();
    } catch (error: any) {
      throw new Error(error.message || "Failed to fetch withdrawal request");
    }
  }

  /**
   * Update withdrawal request status
   */
  async updateWithdrawalStatus(
    requestId: string,
    data: UpdateWithdrawalStatusRequest
  ): Promise<any> {
    try {
      const response = await fetch(`/api/withdrawals/${requestId}/status`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to update withdrawal status");
      }

      return await response.json();
    } catch (error: any) {
      throw new Error(error.message || "Failed to update withdrawal status");
    }
  }
}

export const withdrawalService = new WithdrawalService();
