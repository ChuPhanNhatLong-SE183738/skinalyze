"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { AdminLayout } from "@/components/layout/AdminLayout";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import ApprovalModal from "@/components/inventory/ApprovalModal";
import DirectAdjustmentModal from "@/components/inventory/DirectAdjustmentModal";
import { inventoryService } from "@/services/inventoryService";
import { authService } from "@/services/authService";
import { Inventory, PendingAdjustment, AdjustmentApprovalRequest, DirectStockAdjustment } from "@/types/inventory";
import {
  Search,
  Package,
  DollarSign,
  AlertTriangle,
  Archive,
  Edit,
  CheckCircle,
  XCircle,
  Clock,
} from "lucide-react";

export default function AdminInventoryPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<"inventory" | "requests">("inventory");
  const [inventory, setInventory] = useState<Inventory[]>([]);
  const [pendingAdjustments, setPendingAdjustments] = useState<PendingAdjustment[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [adminId, setAdminId] = useState<string>("");
  
  // Modals
  const [selectedInventory, setSelectedInventory] = useState<Inventory | null>(null);
  const [selectedAdjustment, setSelectedAdjustment] = useState<PendingAdjustment | null>(null);
  const [showDirectModal, setShowDirectModal] = useState(false);
  const [showApprovalModal, setShowApprovalModal] = useState(false);

  useEffect(() => {
    checkAuthAndFetchData();
  }, []);

  const checkAuthAndFetchData = async () => {
    try {
      const response = await authService.checkAuth();
      
      if (!response || !response.user) {
        router.push("/admin/login");
        return;
      }

      if (response.user.role !== "admin") {
        router.push("/");
        return;
      }

      setAdminId(response.user.userId);
      await Promise.all([fetchInventory(), fetchPendingAdjustments()]);
    } catch (error) {
      console.error("Authentication error:", error);
      router.push("/admin/login");
    }
  };

  const fetchInventory = async () => {
    try {
      setIsLoading(true);
      const data = await inventoryService.getInventory();
      setInventory(data);
    } catch (error) {
      console.error("Failed to fetch inventory:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchPendingAdjustments = async () => {
    try {
      const data = await inventoryService.getPendingAdjustments();
      setPendingAdjustments(data);
    } catch (error) {
      console.error("Failed to fetch pending adjustments:", error);
    }
  };

  const handleDirectAdjustment = async (adjustment: DirectStockAdjustment) => {
    try {
      await inventoryService.adjustStockDirect(adjustment);
      await fetchInventory();
      setShowDirectModal(false);
      setSelectedInventory(null);
    } catch (error: unknown) {
      throw new Error((error instanceof Error ? error.message : String(error)) || "Failed to adjust stock");
    }
  };

  const handleApprove = async (adjustmentId: string, reviewedBy: string, rejectionReason?: string) => {
    try {
      const request: AdjustmentApprovalRequest = {
        adjustmentId,
        status: "APPROVED",
        reviewedBy,
        rejectionReason,
      };
      await inventoryService.reviewAdjustment(request);
      await Promise.all([fetchInventory(), fetchPendingAdjustments()]);
    } catch (error: unknown) {
      throw new Error((error instanceof Error ? error.message : String(error)) || "Failed to approve adjustment");
    }
  };

  const handleReject = async (adjustmentId: string, reviewedBy: string, rejectionReason?: string) => {
    try {
      const request: AdjustmentApprovalRequest = {
        adjustmentId,
        status: "REJECTED",
        reviewedBy,
        rejectionReason,
      };
      await inventoryService.reviewAdjustment(request);
      await fetchPendingAdjustments();
    } catch (error: unknown) {
      throw new Error((error instanceof Error ? error.message : String(error)) || "Failed to reject adjustment");
    }
  };

  const filteredInventory = inventory.filter((item) => {
    const productName = item.product.productName.toLowerCase();
    const brand = item.product.brand.toLowerCase();
    const query = searchQuery.toLowerCase();
    return productName.includes(query) || brand.includes(query);
  });

  const filteredAdjustments = pendingAdjustments.filter((adj) => {
    if (!adj.product) return false;
    const productName = adj.product.productName.toLowerCase();
    const brand = adj.product.brand.toLowerCase();
    const requesterName = adj.requestedByUser?.fullName.toLowerCase() || "";
    const query = searchQuery.toLowerCase();
    return productName.includes(query) || brand.includes(query) || requesterName.includes(query);
  });

  // Stats calculations
  const totalProducts = inventory.length;
  const totalValue = inventory.reduce(
    (sum, item) => sum + item.originalPrice * item.currentStock,
    0
  );
  const lowStockCount = inventory.filter((item) => {
    const availableStock = item.currentStock - item.reservedStock;
    return availableStock > 0 && availableStock < 10;
  }).length;
  const outOfStockCount = inventory.filter((item) => {
    const availableStock = item.currentStock - item.reservedStock;
    return availableStock <= 0;
  }).length;
  const pendingCount = pendingAdjustments.length;

  const getStockStatus = (currentStock: number, reservedStock: number) => {
    const availableStock = currentStock - reservedStock;
    if (availableStock <= 0) {
      return { label: "Out of Stock", color: "text-red-600 bg-red-50" };
    } else if (availableStock < 10) {
      return { label: "Low Stock", color: "text-yellow-600 bg-yellow-50" };
    } else if (availableStock < 50) {
      return { label: "Medium", color: "text-blue-600 bg-blue-50" };
    } else {
      return { label: "In Stock", color: "text-green-600 bg-green-50" };
    }
  };

  return (
    <AdminLayout>
      <div className="p-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-slate-900">Inventory Management</h1>
          <p className="text-slate-600 mt-1">
            Manage product stock levels and review adjustment requests
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-6 mb-8">
          <Card className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-600">Total Products</p>
                <p className="text-2xl font-bold text-slate-900 mt-1">{totalProducts}</p>
              </div>
              <div className="p-3 bg-gradient-to-r from-green-400 to-emerald-500 rounded-lg">
                <Package className="h-6 w-6 text-white" />
              </div>
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-600">Total Value</p>
                <p className="text-2xl font-bold text-slate-900 mt-1">
                  ₫{(totalValue / 1000000).toFixed(1)}M
                </p>
              </div>
              <div className="p-3 bg-gradient-to-r from-blue-400 to-blue-500 rounded-lg">
                <DollarSign className="h-6 w-6 text-white" />
              </div>
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-600">Low Stock</p>
                <p className="text-2xl font-bold text-yellow-600 mt-1">{lowStockCount}</p>
              </div>
              <div className="p-3 bg-gradient-to-r from-yellow-400 to-yellow-500 rounded-lg">
                <AlertTriangle className="h-6 w-6 text-white" />
              </div>
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-600">Out of Stock</p>
                <p className="text-2xl font-bold text-red-600 mt-1">{outOfStockCount}</p>
              </div>
              <div className="p-3 bg-gradient-to-r from-red-400 to-red-500 rounded-lg">
                <Archive className="h-6 w-6 text-white" />
              </div>
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-600">Pending Requests</p>
                <p className="text-2xl font-bold text-purple-600 mt-1">{pendingCount}</p>
              </div>
              <div className="p-3 bg-gradient-to-r from-purple-400 to-purple-500 rounded-lg">
                <Clock className="h-6 w-6 text-white" />
              </div>
            </div>
          </Card>
        </div>

        {/* Tabs */}
        <div className="flex gap-4 mb-6 border-b border-slate-200">
          <button
            onClick={() => setActiveTab("inventory")}
            className={`pb-3 px-1 font-medium transition-colors ${
              activeTab === "inventory"
                ? "text-green-600 border-b-2 border-green-600"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            Current Inventory
          </button>
          <button
            onClick={() => setActiveTab("requests")}
            className={`pb-3 px-1 font-medium transition-colors relative ${
              activeTab === "requests"
                ? "text-green-600 border-b-2 border-green-600"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            Pending Requests
            {pendingCount > 0 && (
              <span className="absolute -top-1 -right-6 bg-purple-600 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                {pendingCount}
              </span>
            )}
          </button>
        </div>

        {/* Search */}
        <div className="mb-6">
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
            <Input
              type="text"
              placeholder={
                activeTab === "inventory"
                  ? "Search products by name or brand..."
                  : "Search by product or requester..."
              }
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        {/* Content */}
        {activeTab === "inventory" ? (
          <Card className="overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-slate-50 border-b border-slate-200">
                  <tr>
                    <th className="text-left py-4 px-6 text-sm font-semibold text-slate-900">
                      Product
                    </th>
                    <th className="text-left py-4 px-6 text-sm font-semibold text-slate-900">
                      Current Stock
                    </th>
                    <th className="text-left py-4 px-6 text-sm font-semibold text-slate-900">
                      Reserved
                    </th>
                    <th className="text-left py-4 px-6 text-sm font-semibold text-slate-900">
                      Available
                    </th>
                    <th className="text-left py-4 px-6 text-sm font-semibold text-slate-900">
                      Status
                    </th>
                    <th className="text-left py-4 px-6 text-sm font-semibold text-slate-900">
                      Price
                    </th>
                    <th className="text-left py-4 px-6 text-sm font-semibold text-slate-900">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {isLoading ? (
                    <tr>
                      <td colSpan={7} className="py-8 text-center text-slate-500">
                        Loading inventory...
                      </td>
                    </tr>
                  ) : filteredInventory.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-8 text-center text-slate-500">
                        No products found
                      </td>
                    </tr>
                  ) : (
                    filteredInventory.map((item) => {
                      const availableStock = item.currentStock - item.reservedStock;
                      const status = getStockStatus(item.currentStock, item.reservedStock);
                      return (
                        <tr key={item.inventoryId} className="hover:bg-slate-50">
                          <td className="py-4 px-6">
                            <div>
                              <p className="font-medium text-slate-900">
                                {item.product.productName}
                              </p>
                              <p className="text-sm text-slate-500">{item.product.brand}</p>
                            </div>
                          </td>
                          <td className="py-4 px-6 text-slate-900">{item.currentStock}</td>
                          <td className="py-4 px-6 text-slate-900">{item.reservedStock}</td>
                          <td className="py-4 px-6 font-semibold text-slate-900">
                            {availableStock}
                          </td>
                          <td className="py-4 px-6">
                            <span className={`px-3 py-1 rounded-full text-xs font-medium ${status.color}`}>
                              {status.label}
                            </span>
                          </td>
                          <td className="py-4 px-6 text-slate-900">
                            ₫{item.originalPrice.toLocaleString()}
                          </td>
                          <td className="py-4 px-6">
                            <Button
                              size="sm"
                              className="bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700"
                              onClick={() => {
                                setSelectedInventory(item);
                                setShowDirectModal(true);
                              }}
                            >
                              <Edit className="h-4 w-4 mr-1" />
                              Adjust
                            </Button>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </Card>
        ) : (
          <Card className="overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-slate-50 border-b border-slate-200">
                  <tr>
                    <th className="text-left py-4 px-6 text-sm font-semibold text-slate-900">
                      Product
                    </th>
                    <th className="text-left py-4 px-6 text-sm font-semibold text-slate-900">
                      Type
                    </th>
                    <th className="text-left py-4 px-6 text-sm font-semibold text-slate-900">
                      Quantity
                    </th>
                    <th className="text-left py-4 px-6 text-sm font-semibold text-slate-900">
                      Requested By
                    </th>
                    <th className="text-left py-4 px-6 text-sm font-semibold text-slate-900">
                      Date
                    </th>
                    <th className="text-left py-4 px-6 text-sm font-semibold text-slate-900">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {filteredAdjustments.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-8 text-center text-slate-500">
                        No pending requests
                      </td>
                    </tr>
                  ) : (
                    filteredAdjustments.map((adjustment) => (
                      <tr key={adjustment.adjustmentId} className="hover:bg-slate-50">
                        <td className="py-4 px-6">
                          <div>
                            <p className="font-medium text-slate-900">
                              {adjustment.product?.productName || "Unknown"}
                            </p>
                            <p className="text-sm text-slate-500">
                              {adjustment.product?.brand || ""}
                            </p>
                          </div>
                        </td>
                        <td className="py-4 px-6">
                          <span
                            className={`px-3 py-1 rounded-full text-xs font-medium ${
                              adjustment.adjustmentType === "INCREASE"
                                ? "text-green-600 bg-green-50"
                                : "text-red-600 bg-red-50"
                            }`}
                          >
                            {adjustment.adjustmentType}
                          </span>
                        </td>
                        <td className="py-4 px-6 font-semibold text-slate-900">
                          {adjustment.adjustmentType === "INCREASE" ? "+" : "-"}
                          {adjustment.quantity}
                        </td>
                        <td className="py-4 px-6">
                          <div>
                            <p className="font-medium text-slate-900">
                              {adjustment.requestedByUser?.fullName || "Unknown"}
                            </p>
                            <p className="text-xs text-slate-500">
                              {adjustment.requestedByUser?.email || ""}
                            </p>
                          </div>
                        </td>
                        <td className="py-4 px-6 text-sm text-slate-600">
                          {new Date(adjustment.createdAt).toLocaleDateString()}
                        </td>
                        <td className="py-4 px-6">
                          <Button
                            size="sm"
                            className="bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700"
                            onClick={() => {
                              setSelectedAdjustment(adjustment);
                              setShowApprovalModal(true);
                            }}
                          >
                            Review
                          </Button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </Card>
        )}
      </div>

      {/* Modals */}
      <DirectAdjustmentModal
        isOpen={showDirectModal}
        onClose={() => {
          setShowDirectModal(false);
          setSelectedInventory(null);
        }}
        inventory={selectedInventory}
        onSubmit={handleDirectAdjustment}
      />

      <ApprovalModal
        isOpen={showApprovalModal}
        onClose={() => {
          setShowApprovalModal(false);
          setSelectedAdjustment(null);
        }}
        adjustment={selectedAdjustment}
        onApprove={handleApprove}
        onReject={handleReject}
        reviewerId={adminId}
      />
    </AdminLayout>
  );
}
