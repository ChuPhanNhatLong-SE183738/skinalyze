"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { AdminLayout } from "@/components/layout/AdminLayout";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { shippingService } from "@/services/shippingService";
import { authService } from "@/services/authService";
import type { ShippingLog } from "@/types/shipping";
import {
  Search,
  Truck,
  Package,
  CheckCircle,
  XCircle,
  Clock,
  MapPin,
  User,
  Calendar,
  DollarSign,
} from "lucide-react";

export default function ShippingLogsPage() {
  const router = useRouter();
  const [shippingLogs, setShippingLogs] = useState<ShippingLog[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [selectedLog, setSelectedLog] = useState<ShippingLog | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);

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

      if (response.user.role !== "admin" && response.user.role !== "staff") {
        router.push("/");
        return;
      }

      await fetchShippingLogs();
    } catch (error) {
      console.error("Authentication error:", error);
      router.push("/admin/login");
    }
  };

  const fetchShippingLogs = async () => {
    try {
      setIsLoading(true);
      const data = await shippingService.getAllShippingLogs();
      setShippingLogs(data);
    } catch (error) {
      console.error("Failed to fetch shipping logs:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const filteredLogs = shippingLogs.filter((log) => {
    const query = searchQuery.toLowerCase();
    return (
      log.orderId.toLowerCase().includes(query) ||
      log.shippingStaff?.fullName.toLowerCase().includes(query) ||
      log.carrierName?.toLowerCase().includes(query) ||
      log.status.toLowerCase().includes(query)
    );
  });

  const getStatusBadge = (status: string) => {
    const configs: Record<string, { color: string; icon: any }> = {
      PENDING: {
        color: "bg-yellow-50 text-yellow-600 border-yellow-200",
        icon: Clock,
      },
      PICKED_UP: {
        color: "bg-blue-50 text-blue-600 border-blue-200",
        icon: Package,
      },
      IN_TRANSIT: {
        color: "bg-purple-50 text-purple-600 border-purple-200",
        icon: Truck,
      },
      DELIVERED: {
        color: "bg-green-50 text-green-600 border-green-200",
        icon: CheckCircle,
      },
      RETURNED: {
        color: "bg-orange-50 text-orange-600 border-orange-200",
        icon: XCircle,
      },
      CANCELLED: {
        color: "bg-red-50 text-red-600 border-red-200",
        icon: XCircle,
      },
    };

    const config = configs[status] || configs.PENDING;
    const Icon = config.icon;

    return (
      <span
        className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium border ${config.color}`}
      >
        <Icon className="h-3 w-3" />
        {status}
      </span>
    );
  };

  const formatCurrency = (amount: string) => {
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
    }).format(parseFloat(amount));
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return "-";
    return new Date(dateString).toLocaleDateString("vi-VN", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  // Stats calculations
  const totalLogs = shippingLogs.length;
  const deliveredCount = shippingLogs.filter(
    (log) => log.status === "DELIVERED"
  ).length;
  const inTransitCount = shippingLogs.filter(
    (log) => log.status === "IN_TRANSIT"
  ).length;
  const pendingCount = shippingLogs.filter(
    (log) => log.status === "PENDING"
  ).length;

  return (
    <AdminLayout>
      <div className="p-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-slate-900">Shipping Logs</h1>
          <p className="text-slate-600 mt-1">
            Manage and track all shipping deliveries
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-600">
                  Total Orders
                </p>
                <p className="text-2xl font-bold text-slate-900 mt-1">
                  {totalLogs}
                </p>
              </div>
              <div className="p-3 bg-gradient-to-r from-green-400 to-emerald-500 rounded-lg">
                <Package className="h-6 w-6 text-white" />
              </div>
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-600">Delivered</p>
                <p className="text-2xl font-bold text-green-600 mt-1">
                  {deliveredCount}
                </p>
              </div>
              <div className="p-3 bg-gradient-to-r from-green-400 to-green-500 rounded-lg">
                <CheckCircle className="h-6 w-6 text-white" />
              </div>
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-600">In Transit</p>
                <p className="text-2xl font-bold text-purple-600 mt-1">
                  {inTransitCount}
                </p>
              </div>
              <div className="p-3 bg-gradient-to-r from-purple-400 to-purple-500 rounded-lg">
                <Truck className="h-6 w-6 text-white" />
              </div>
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-600">Pending</p>
                <p className="text-2xl font-bold text-yellow-600 mt-1">
                  {pendingCount}
                </p>
              </div>
              <div className="p-3 bg-gradient-to-r from-yellow-400 to-yellow-500 rounded-lg">
                <Clock className="h-6 w-6 text-white" />
              </div>
            </div>
          </Card>
        </div>

        {/* Search */}
        <div className="mb-6">
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
            <Input
              type="text"
              placeholder="Search by Order ID, staff, carrier..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        {/* Shipping Logs Table */}
        <Card className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  <th className="text-left py-4 px-6 text-sm font-semibold text-slate-900">
                    Order ID
                  </th>
                  <th className="text-left py-4 px-6 text-sm font-semibold text-slate-900">
                    Shipping Staff
                  </th>
                  <th className="text-left py-4 px-6 text-sm font-semibold text-slate-900">
                    Carrier
                  </th>
                  <th className="text-left py-4 px-6 text-sm font-semibold text-slate-900">
                    Status
                  </th>
                  <th className="text-left py-4 px-6 text-sm font-semibold text-slate-900">
                    Total Amount
                  </th>
                  <th className="text-left py-4 px-6 text-sm font-semibold text-slate-900">
                    Estimated Delivery
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
                      Loading data...
                    </td>
                  </tr>
                ) : filteredLogs.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-8 text-center text-slate-500">
                      No shipping logs found
                    </td>
                  </tr>
                ) : (
                  filteredLogs.map((log) => (
                    <tr key={log.shippingLogId} className="hover:bg-slate-50">
                      <td className="py-4 px-6">
                        <span className="text-sm font-mono text-slate-900">
                          {log.orderId.slice(0, 13)}...
                        </span>
                      </td>
                      <td className="py-4 px-6">
                        {log.shippingStaff ? (
                          <div>
                            <p className="text-sm font-medium text-slate-900">
                              {log.shippingStaff.fullName}
                            </p>
                            <p className="text-xs text-slate-500">
                              {log.shippingStaff.phone}
                            </p>
                          </div>
                        ) : (
                          <span className="text-sm text-slate-400">-</span>
                        )}
                      </td>
                      <td className="py-4 px-6">
                        <span className="text-sm text-slate-900">
                          {log.carrierName || "-"}
                        </span>
                      </td>
                      <td className="py-4 px-6">
                        {getStatusBadge(log.status)}
                      </td>
                      <td className="py-4 px-6">
                        <span className="text-sm font-semibold text-slate-900">
                          {formatCurrency(log.totalAmount)}
                        </span>
                      </td>
                      <td className="py-4 px-6">
                        <span className="text-sm text-slate-600">
                          {formatDate(log.estimatedDeliveryDate)}
                        </span>
                      </td>
                      <td className="py-4 px-6">
                        <Button
                          size="sm"
                          className="bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700"
                          onClick={() => {
                            setSelectedLog(log);
                            setShowDetailModal(true);
                          }}
                        >
                          Details
                        </Button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </Card>

        {/* Detail Modal */}
        {showDetailModal && selectedLog && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6 border-b border-slate-200">
                <div className="flex items-center justify-between">
                  <h2 className="text-2xl font-bold text-slate-900">
                    Shipping Details
                  </h2>
                  <button
                    onClick={() => setShowDetailModal(false)}
                    className="text-slate-400 hover:text-slate-600"
                  >
                    <XCircle className="h-6 w-6" />
                  </button>
                </div>
              </div>

              <div className="p-6 space-y-6">
                {/* Status and Basic Info */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-slate-500">Status</p>
                    <div className="mt-1">
                      {getStatusBadge(selectedLog.status)}
                    </div>
                  </div>
                  <div>
                    <p className="text-sm text-slate-500">Total Amount</p>
                    <p className="text-lg font-bold text-slate-900 mt-1">
                      {formatCurrency(selectedLog.totalAmount)}
                    </p>
                  </div>
                </div>

                {/* Shipping Staff */}
                {selectedLog.shippingStaff && (
                  <div className="bg-blue-50 p-4 rounded-lg">
                    <div className="flex items-center gap-3">
                      <User className="h-5 w-5 text-blue-600" />
                      <div>
                        <p className="font-semibold text-slate-900">
                          {selectedLog.shippingStaff.fullName}
                        </p>
                        <p className="text-sm text-slate-600">
                          {selectedLog.shippingStaff.email}
                        </p>
                        <p className="text-sm text-slate-600">
                          {selectedLog.shippingStaff.phone}
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Dates */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-slate-500">Created Date</p>
                    <p className="text-sm text-slate-900">
                      {formatDate(selectedLog.createdAt)}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-slate-500">Estimated Delivery</p>
                    <p className="text-sm text-slate-900">
                      {formatDate(selectedLog.estimatedDeliveryDate)}
                    </p>
                  </div>
                  {selectedLog.deliveredDate && (
                    <div>
                      <p className="text-sm text-slate-500">Actual Delivery</p>
                      <p className="text-sm text-green-600">
                        {formatDate(selectedLog.deliveredDate)}
                      </p>
                    </div>
                  )}
                </div>

                {/* Notes */}
                {selectedLog.note && (
                  <div>
                    <p className="text-sm font-medium text-slate-700">Notes</p>
                    <p className="text-sm text-slate-600 mt-1">
                      {selectedLog.note}
                    </p>
                  </div>
                )}

                {/* COD Information */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-slate-500">COD Collected</p>
                    <p className="text-sm font-medium text-slate-900">
                      {selectedLog.isCodCollected ? "✓ Yes" : "✗ No"}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-slate-500">COD Transferred</p>
                    <p className="text-sm font-medium text-slate-900">
                      {selectedLog.isCodTransferred ? "✓ Yes" : "✗ No"}
                    </p>
                  </div>
                </div>

                {/* Finished Pictures */}
                {selectedLog.finishedPictures &&
                  selectedLog.finishedPictures.length > 0 && (
                    <div>
                      <p className="text-sm font-medium text-slate-700 mb-3">
                        Delivery Photos
                      </p>
                      <div className="grid grid-cols-4 gap-2">
                        {selectedLog.finishedPictures.map((pic, index) => (
                          <img
                            key={index}
                            src={pic}
                            alt={`Finished ${index + 1}`}
                            className="w-full h-32 object-cover rounded-lg"
                          />
                        ))}
                      </div>
                    </div>
                  )}
              </div>

              <div className="p-6 border-t border-slate-200">
                <Button
                  onClick={() => setShowDetailModal(false)}
                  variant="outline"
                  className="w-full"
                >
                  Close
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
