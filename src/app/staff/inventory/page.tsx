"use client";

import { useState, useEffect } from "react";
import { StaffLayout } from "@/components/layout/StaffLayout";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { StockAdjustmentModal } from "@/components/inventory/StockAdjustmentModal";
import { inventoryService } from "@/services/inventoryService";
import { authService } from "@/services/authService";
import type { Inventory, StockAdjustmentRequest } from "@/types/inventory";
import { Search, Package, AlertTriangle, TrendingDown, RefreshCw } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function StaffInventoryPage() {
  const [inventory, setInventory] = useState<Inventory[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedInventory, setSelectedInventory] = useState<Inventory | null>(null);
  const [userId, setUserId] = useState<string>("");
  const { toast } = useToast();

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const { user } = await authService.checkAuth();
        if (user) {
          setUserId(user.userId);
        }
      } catch (error) {
        console.error("Error fetching user data:", error);
      }
    };
    fetchUserData();
  }, []);

  const fetchInventory = async () => {
    try {
      setLoading(true);
      const data = await inventoryService.getInventory();
      console.log("Fetched inventory data:", data);
      setInventory(data);
    } catch (error) {
      console.error("Error fetching inventory:", error);
      toast({
        variant: "error",
        title: "Error",
        description: "Failed to load inventory. Please try again.",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInventory();
  }, []);

  const handleStockAdjustment = (item: Inventory) => {
    setSelectedInventory(item);
    setIsModalOpen(true);
  };

  const handleSubmitStockAdjustment = async (request: StockAdjustmentRequest) => {
    try {
      await inventoryService.createStockAdjustment(request);
      toast({
        variant: "success",
        title: "Success",
        description: "Stock adjustment request submitted successfully.",
      });
      fetchInventory();
    } catch (error) {
      console.error("Error submitting stock adjustment:", error);
      toast({
        variant: "error",
        title: "Error",
        description: "Failed to submit stock adjustment request. Please try again.",
      });
      throw error;
    }
  };

  const filteredInventory = (inventory || []).filter(
    (item) =>
      item.product.productName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.product.brand.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const stats = {
    totalProducts: inventory.length,
    lowStock: inventory.filter((item) => {
      const available = item.currentStock - item.reservedStock;
      return available > 0 && available < 10;
    }).length,
    outOfStock: inventory.filter((item) => (item.currentStock - item.reservedStock) <= 0).length,
    totalValue: inventory.reduce((sum, item) => sum + (item.originalPrice * item.currentStock), 0),
  };

  const getStockStatus = (item: Inventory) => {
    const available = item.currentStock - item.reservedStock;
    if (available <= 0) {
      return { label: "Out of Stock", color: "bg-red-100 text-red-700 border border-red-200" };
    } else if (available < 10 && available > 0) {
      return { label: "Low Stock", color: "bg-yellow-100 text-yellow-700 border border-yellow-200" };
    } else if (available < 50) {
      return { label: "Medium Stock", color: "bg-blue-100 text-blue-700 border border-blue-200" };
    } else {
      return { label: "In Stock", color: "bg-green-100 text-green-700 border border-green-200" };
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
    }).format(amount);
  };

  return (
    <StaffLayout>
      <div className="p-8">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-3xl font-bold text-slate-900">Inventory Management</h1>
            <p className="text-slate-600 mt-1">Monitor stock levels and submit adjustment requests</p>
          </div>
          <Button
            onClick={fetchInventory}
            variant="outline"
            className="border-slate-300 text-slate-700 hover:bg-slate-50"
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh
          </Button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <Card className="p-4 bg-white border-slate-200">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-gradient-to-r from-green-500 to-emerald-500 rounded-lg">
                <Package className="w-5 h-5 text-white" />
              </div>
              <div>
                <p className="text-sm text-slate-600">Total Products</p>
                <p className="text-2xl font-bold text-slate-900">{stats.totalProducts}</p>
              </div>
            </div>
          </Card>

          <Card className="p-4 bg-white border-slate-200">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-yellow-100 rounded-lg">
                <AlertTriangle className="w-5 h-5 text-yellow-600" />
              </div>
              <div>
                <p className="text-sm text-slate-600">Low Stock</p>
                <p className="text-2xl font-bold text-slate-900">{stats.lowStock}</p>
              </div>
            </div>
          </Card>

          <Card className="p-4 bg-white border-slate-200">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-red-100 rounded-lg">
                <TrendingDown className="w-5 h-5 text-red-600" />
              </div>
              <div>
                <p className="text-sm text-slate-600">Out of Stock</p>
                <p className="text-2xl font-bold text-slate-900">{stats.outOfStock}</p>
              </div>
            </div>
          </Card>

          <Card className="p-4 bg-white border-slate-200">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Package className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-slate-600">Total Value</p>
                <p className="text-2xl font-bold text-slate-900">{formatCurrency(stats.totalValue)}</p>
              </div>
            </div>
          </Card>
        </div>

        {/* Search Bar */}
        <Card className="p-4 mb-6 bg-white border-slate-200">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-5 h-5" />
            <Input
              type="text"
              placeholder="Search by product name or brand..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 bg-white border-slate-300 text-slate-900 focus:border-green-500"
            />
          </div>
        </Card>

        {/* Inventory Table */}
        <Card className="bg-white border-slate-200">
          {loading ? (
            <div className="flex justify-center items-center h-64">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-500"></div>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-slate-50 border-b border-slate-200">
                  <tr>
                    <th className="px-6 py-4 text-left text-xs font-medium text-slate-600 uppercase tracking-wider">
                      Product
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-slate-600 uppercase tracking-wider">
                      Brand
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-slate-600 uppercase tracking-wider">
                      Current Stock
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-slate-600 uppercase tracking-wider">
                      Reserved
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-slate-600 uppercase tracking-wider">
                      Available
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-slate-600 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-slate-600 uppercase tracking-wider">
                      Price
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-slate-600 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {filteredInventory.map((item) => {
                    const availableStock = item.currentStock - item.reservedStock;
                    const status = getStockStatus(item);
                    
                    return (
                      <tr key={item.inventoryId} className="hover:bg-slate-50 transition-colors">
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            {item.product.productImages[0] && (
                              <img
                                src={item.product.productImages[0]}
                                alt={item.product.productName}
                                className="w-12 h-12 object-cover rounded-lg"
                              />
                            )}
                            <div>
                              <div className="text-sm font-medium text-slate-900 max-w-xs">
                                {item.product.productName}
                              </div>
                              {item.product.salePercentage > 0 && (
                                <span className="inline-block mt-1 px-2 py-0.5 text-xs font-medium bg-red-100 text-red-700 rounded">
                                  {item.product.salePercentage}% OFF
                                </span>
                              )}
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-sm text-slate-600">{item.product.brand}</div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-sm font-medium text-slate-900">
                            {item.currentStock}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-sm text-slate-600">{item.reservedStock}</div>
                        </td>
                        <td className="px-6 py-4">
                          <div className={`text-sm font-medium ${
                            availableStock < 10 ? "text-red-600" : "text-green-600"
                          }`}>
                            {availableStock}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <span className={`px-3 py-1 rounded-full text-xs font-medium ${status.color}`}>
                            {status.label}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-sm text-slate-900">
                            {formatCurrency(item.originalPrice)}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <Button
                            onClick={() => handleStockAdjustment(item)}
                            size="sm"
                            className="bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600"
                          >
                            Stock Adjustment
                          </Button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>

              {filteredInventory.length === 0 && (
                <div className="text-center py-12">
                  <Package className="mx-auto h-12 w-12 text-slate-400" />
                  <h3 className="mt-2 text-sm font-medium text-slate-900">No inventory found</h3>
                  <p className="mt-1 text-sm text-slate-500">
                    {searchTerm
                      ? "Try adjusting your search"
                      : "No products in inventory"}
                  </p>
                </div>
              )}
            </div>
          )}
        </Card>

        {/* Stock Adjustment Modal */}
        <StockAdjustmentModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          onSubmit={handleSubmitStockAdjustment}
          inventory={selectedInventory}
          userId={userId}
        />
      </div>
    </StaffLayout>
  );
}
