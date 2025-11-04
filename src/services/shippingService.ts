import type { ShippingLog, ShippingLogsResponse } from "@/types/shipping";

export class ShippingService {
  /**
   * Get all shipping logs
   */
  async getAllShippingLogs(): Promise<ShippingLog[]> {
    try {
      const response = await fetch("/api/shipping-logs", {
        method: "GET",
        credentials: "include",
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Failed to fetch shipping logs");
      }

      const result: ShippingLogsResponse = await response.json();
      return result.data || [];
    } catch (error: any) {
      throw new Error(error.message || "Failed to fetch shipping logs");
    }
  }

  /**
   * Get shipping logs for a specific order
   */
  async getShippingLogsByOrder(orderId: string): Promise<ShippingLog[]> {
    try {
      const response = await fetch(`/api/shipping-logs/order/${orderId}`, {
        method: "GET",
        credentials: "include",
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Failed to fetch shipping logs");
      }

      const result: ShippingLogsResponse = await response.json();
      return result.data || [];
    } catch (error: any) {
      throw new Error(error.message || "Failed to fetch shipping logs");
    }
  }
}

export const shippingService = new ShippingService();
