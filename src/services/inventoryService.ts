import type { 
  Inventory, 
  StockAdjustmentRequest, 
  StockAdjustmentResponse,
  PendingAdjustment,
  AdjustmentApprovalRequest,
  DirectStockAdjustment
} from "@/types/inventory";

export class InventoryService {
  /**
   * Get all inventory items
   */
  async getInventory(): Promise<Inventory[]> {
    try {
      const response = await fetch("/api/inventory", {
        method: "GET",
        credentials: "include",
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Failed to fetch inventory");
      }

      const result = await response.json();
      
      // Handle if backend returns array directly
      if (Array.isArray(result)) {
        return result;
      }
      
      // Handle backend response format { data: [...] }
      if (result.data && Array.isArray(result.data)) {
        return result.data;
      }
      
      return [];
    } catch (error: any) {
      throw new Error(error.message || "Failed to fetch inventory");
    }
  }

  /**
   * Get inventory for a specific product
   */
  async getInventoryByProduct(productId: string): Promise<Inventory> {
    try {
      const response = await fetch(`/api/inventory/${productId}`, {
        method: "GET",
        credentials: "include",
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Failed to fetch inventory");
      }

      const result = await response.json();
      return result.data;
    } catch (error: any) {
      throw new Error(error.message || "Failed to fetch inventory");
    }
  }

  /**
   * Create a stock adjustment request
   */
  async createStockAdjustment(request: StockAdjustmentRequest): Promise<StockAdjustmentResponse> {
    try {
      const response = await fetch("/api/inventory/adjustment", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify(request),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Failed to create stock adjustment request");
      }

      const result: StockAdjustmentResponse = await response.json();
      return result;
    } catch (error: any) {
      throw new Error(error.message || "Failed to create stock adjustment request");
    }
  }

  /**
   * Get pending adjustment requests (Admin only)
   */
  async getPendingAdjustments(): Promise<PendingAdjustment[]> {
    try {
      const response = await fetch("/api/inventory/adjustments/pending", {
        method: "GET",
        credentials: "include",
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Failed to fetch pending adjustments");
      }

      const result = await response.json();
      
      // Handle if backend returns array directly
      if (Array.isArray(result)) {
        return result;
      }
      
      // Handle backend response format { data: [...] }
      if (result.data && Array.isArray(result.data)) {
        return result.data;
      }
      
      return [];
    } catch (error: any) {
      throw new Error(error.message || "Failed to fetch pending adjustments");
    }
  }

  /**
   * Approve or reject adjustment request (Admin only)
   */
  async reviewAdjustment(request: AdjustmentApprovalRequest): Promise<any> {
    try {
      const response = await fetch("/api/inventory/adjustments/review", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify(request),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Failed to review adjustment");
      }

      const result = await response.json();
      return result;
    } catch (error: any) {
      throw new Error(error.message || "Failed to review adjustment");
    }
  }

  /**
   * Direct stock adjustment (Admin only)
   */
  async adjustStockDirect(request: DirectStockAdjustment): Promise<any> {
    try {
      const response = await fetch("/api/inventory/adjust", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify(request),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Failed to adjust stock");
      }

      const result = await response.json();
      return result;
    } catch (error: any) {
      throw new Error(error.message || "Failed to adjust stock");
    }
  }
}

export const inventoryService = new InventoryService();
