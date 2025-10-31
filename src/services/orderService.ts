import { apiClient } from "@/lib/api";
import type { OrdersResponse } from "@/types/order";

export class OrderService {
  /**
   * Get all orders (staff only)
   * @param customerId - Optional customer ID to filter orders
   */
  async getOrders(customerId?: string): Promise<OrdersResponse> {
    try {
      const endpoint = customerId
        ? `/orders?customerId=${customerId}`
        : "/orders";

      // This will be called through our API route that includes the auth token
      const response = await fetch(
        `/api/orders${customerId ? `?customerId=${customerId}` : ""}`,
        {
          method: "GET",
          credentials: "include",
        }
      );

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to fetch orders");
      }

      return await response.json();
    } catch (error: any) {
      throw new Error(error.message || "Failed to fetch orders");
    }
  }

  /**
   * Update order status
   */
  async updateOrderStatus(
    orderId: string,
    status: string,
    rejectionReason?: string
  ): Promise<any> {
    try {
      const response = await fetch(`/api/orders/${orderId}/status`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({ status, rejectionReason }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to update order status");
      }

      return await response.json();
    } catch (error: any) {
      throw new Error(error.message || "Failed to update order status");
    }
  }

  /**
   * Get order details by ID
   */
  async getOrderById(orderId: string): Promise<any> {
    try {
      const response = await fetch(`/api/orders/${orderId}`, {
        method: "GET",
        credentials: "include",
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to fetch order details");
      }

      return await response.json();
    } catch (error: any) {
      throw new Error(error.message || "Failed to fetch order details");
    }
  }

  /**
   * Confirm order
   */
  async confirmOrder(orderId: string, processedBy: string, note?: string): Promise<any> {
    try {
      const response = await fetch(`/api/orders/${orderId}/confirm`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({ processedBy, note }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to confirm order");
      }

      return await response.json();
    } catch (error: any) {
      throw new Error(error.message || "Failed to confirm order");
    }
  }

  /**
   * Cancel order
   */
  async cancelOrder(orderId: string, reason: string, cancelledBy?: string): Promise<any> {
    try {
      const response = await fetch(`/api/orders/${orderId}/cancel`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({ reason, cancelledBy }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to cancel order");
      }

      return await response.json();
    } catch (error: any) {
      throw new Error(error.message || "Failed to cancel order");
    }
  }
}

export const orderService = new OrderService();
