"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { AdminLayout } from "@/components/layout/AdminLayout";
import { Button } from "@/components/ui/button";
import { withdrawalService } from "@/services/withdrawalService";
import { authService } from "@/services/authService";
import type { WithdrawalRequest } from "@/types/withdrawal";
import { WithdrawalStatus } from "@/types/withdrawal";
import {
  Wallet,
  CheckCircle,
  XCircle,
  Clock,
  Search,
  RefreshCw,
  Eye,
  Filter,
} from "lucide-react";
import WithdrawalDetailModal from "@/components/withdrawals/WithdrawalDetailModal";
import { useToast } from "@/hooks/use-toast";

export default function WithdrawalsPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [withdrawals, setWithdrawals] = useState<WithdrawalRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [selectedWithdrawal, setSelectedWithdrawal] =
    useState<WithdrawalRequest | null>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [currentAdmin, setCurrentAdmin] = useState<{
    userId: string;
    role: string;
  } | null>(null);

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      const result = await authService.checkAuth();
      if (
        !result.authenticated ||
        !result.user ||
        result.user.role !== "admin"
      ) {
        router.push("/admin/login");
        return;
      }
      setCurrentAdmin(result.user);
      fetchWithdrawals();
    } catch (error) {
      console.error("Auth check failed:", error);
      router.push("/admin/login");
    }
  };

  const fetchWithdrawals = async () => {
    try {
      setLoading(true);
      const response = await withdrawalService.getWithdrawals();
      setWithdrawals(response.data || []);
    } catch (error: unknown) {
      console.error("Error fetching withdrawals:", error);
      toast({
        title: "Error",
        description:
          (error instanceof Error ? error.message : String(error)) ||
          "Failed to fetch withdrawal requests",
        variant: "error",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleViewDetails = (withdrawal: WithdrawalRequest) => {
    setSelectedWithdrawal(withdrawal);
    setIsDetailModalOpen(true);
  };

  const handleApprove = async (requestId: string, note?: string) => {
    if (!currentAdmin) return;

    try {
      await withdrawalService.updateWithdrawalStatus(requestId, {
        status: WithdrawalStatus.APPROVED,
        note,
      });
      toast({
        title: "Success",
        description: "Withdrawal request approved successfully",
        variant: "success",
      });
      setIsDetailModalOpen(false);
      fetchWithdrawals();
    } catch (error: unknown) {
      toast({
        title: "Error",
        description:
          (error instanceof Error ? error.message : String(error)) ||
          "Failed to approve withdrawal",
        variant: "error",
      });
    }
  };

  const handleReject = async (requestId: string, reason: string) => {
    if (!currentAdmin) return;

    try {
      await withdrawalService.updateWithdrawalStatus(requestId, {
        status: WithdrawalStatus.REJECTED,
        rejectionReason: reason,
      });
      toast({
        title: "Success",
        description: "Withdrawal request rejected",
        variant: "success",
      });
      setIsDetailModalOpen(false);
      fetchWithdrawals();
    } catch (error: unknown) {
      toast({
        title: "Error",
        description:
          (error instanceof Error ? error.message : String(error)) ||
          "Failed to reject withdrawal",
        variant: "error",
      });
    }
  };

  const handleSetProcessing = async (requestId: string, note?: string) => {
    if (!currentAdmin) return;

    try {
      await withdrawalService.updateWithdrawalStatus(requestId, {
        status: WithdrawalStatus.VERIFIED,
        note,
      });
      toast({
        title: "Success",
        description: "Withdrawal request marked as verified",
        variant: "success",
      });
      setIsDetailModalOpen(false);
      fetchWithdrawals();
    } catch (error: unknown) {
      toast({
        title: "Error",
        description:
          (error instanceof Error ? error.message : String(error)) ||
          "Failed to update withdrawal status",
        variant: "error",
      });
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString("vi-VN", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getStatusBadge = (status: WithdrawalStatus) => {
    const statusConfig = {
      [WithdrawalStatus.PENDING]: {
        bg: "bg-yellow-100 dark:bg-yellow-900/30",
        text: "text-yellow-800 dark:text-yellow-300",
        icon: Clock,
      },
      [WithdrawalStatus.VERIFIED]: {
        bg: "bg-blue-100 dark:bg-blue-900/30",
        text: "text-blue-800 dark:text-blue-300",
        icon: Clock,
      },
      [WithdrawalStatus.APPROVED]: {
        bg: "bg-purple-100 dark:bg-purple-900/30",
        text: "text-purple-800 dark:text-purple-300",
        icon: CheckCircle,
      },
      [WithdrawalStatus.REJECTED]: {
        bg: "bg-red-100 dark:bg-red-900/30",
        text: "text-red-800 dark:text-red-300",
        icon: XCircle,
      },
      [WithdrawalStatus.COMPLETED]: {
        bg: "bg-green-100 dark:bg-green-900/30",
        text: "text-green-800 dark:text-green-300",
        icon: CheckCircle,
      },
      [WithdrawalStatus.CANCELLED]: {
        bg: "bg-slate-100 dark:bg-slate-900/30",
        text: "text-slate-800 dark:text-slate-300",
        icon: XCircle,
      },
    };

    const config = statusConfig[status];
    if (!config) return null;

    const Icon = config.icon;

    return (
      <span
        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${config.bg} ${config.text}`}
      >
        <Icon className="h-3.5 w-3.5" />
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </span>
    );
  };

  const filteredWithdrawals = withdrawals.filter((withdrawal) => {
    const matchesSearch =
      withdrawal.fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      withdrawal.bankName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      withdrawal.accountNumber.includes(searchQuery) ||
      withdrawal.requestId.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesStatus =
      statusFilter === "all" || withdrawal.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  const stats = {
    total: withdrawals.length,
    pending: withdrawals.filter((w) => w.status === WithdrawalStatus.PENDING)
      .length,
    verified: withdrawals.filter((w) => w.status === WithdrawalStatus.VERIFIED)
      .length,
    approved: withdrawals.filter((w) => w.status === WithdrawalStatus.APPROVED)
      .length,
    completed: withdrawals.filter(
      (w) => w.status === WithdrawalStatus.COMPLETED
    ).length,
    rejected: withdrawals.filter((w) => w.status === WithdrawalStatus.REJECTED)
      .length,
  };

  return (
    <AdminLayout>
      <div className="p-8">
        <div className="space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-slate-900 dark:text-slate-100 flex items-center gap-3">
                <Wallet className="h-8 w-8 text-blue-600" />
                Withdrawal Requests
              </h1>
              <p className="text-slate-600 dark:text-slate-400 mt-1">
                Manage and process customer withdrawal requests
              </p>
            </div>
            <Button
              onClick={fetchWithdrawals}
              variant="outline"
              disabled={loading}
              className="border-green-300 text-green-600 hover:bg-green-50 hover:text-green-700 bg-white"
            >
              <RefreshCw
                className={`h-4 w-4 mr-2 ${loading ? "animate-spin" : ""}`}
              />
              Refresh
            </Button>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
            <div className="bg-white dark:bg-slate-800 rounded-lg shadow p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-600 dark:text-slate-400">
                    Total
                  </p>
                  <p className="text-2xl font-bold text-slate-900 dark:text-slate-100">
                    {stats.total}
                  </p>
                </div>
                <Wallet className="h-8 w-8 text-slate-400" />
              </div>
            </div>

            <div className="bg-white dark:bg-slate-800 rounded-lg shadow p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-600 dark:text-slate-400">
                    Pending
                  </p>
                  <p className="text-2xl font-bold text-yellow-600">
                    {stats.pending}
                  </p>
                </div>
                <Clock className="h-8 w-8 text-yellow-400" />
              </div>
            </div>

            <div className="bg-white dark:bg-slate-800 rounded-lg shadow p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-600 dark:text-slate-400">
                    Verified
                  </p>
                  <p className="text-2xl font-bold text-blue-600">
                    {stats.verified}
                  </p>
                </div>
                <Clock className="h-8 w-8 text-blue-400" />
              </div>
            </div>

            <div className="bg-white dark:bg-slate-800 rounded-lg shadow p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-600 dark:text-slate-400">
                    Approved
                  </p>
                  <p className="text-2xl font-bold text-purple-600">
                    {stats.approved}
                  </p>
                </div>
                <CheckCircle className="h-8 w-8 text-purple-400" />
              </div>
            </div>

            <div className="bg-white dark:bg-slate-800 rounded-lg shadow p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-600 dark:text-slate-400">
                    Completed
                  </p>
                  <p className="text-2xl font-bold text-green-600">
                    {stats.completed}
                  </p>
                </div>
                <CheckCircle className="h-8 w-8 text-green-400" />
              </div>
            </div>

            <div className="bg-white dark:bg-slate-800 rounded-lg shadow p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-600 dark:text-slate-400">
                    Rejected
                  </p>
                  <p className="text-2xl font-bold text-red-600">
                    {stats.rejected}
                  </p>
                </div>
                <XCircle className="h-8 w-8 text-red-400" />
              </div>
            </div>
          </div>

          {/* Filters */}
          <div className="bg-white dark:bg-slate-800 rounded-lg shadow p-4">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search by name, bank, account number, or request ID..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent bg-white text-slate-900 placeholder:text-slate-500"
                />
              </div>
              <div className="flex items-center gap-2">
                <Filter className="h-5 w-5 text-slate-400" />
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent bg-white"
                >
                  <option value="all">All Status</option>
                  <option value={WithdrawalStatus.PENDING}>Pending</option>
                  <option value={WithdrawalStatus.VERIFIED}>Verified</option>
                  <option value={WithdrawalStatus.APPROVED}>Approved</option>
                  <option value={WithdrawalStatus.COMPLETED}>Completed</option>
                  <option value={WithdrawalStatus.REJECTED}>Rejected</option>
                  <option value={WithdrawalStatus.CANCELLED}>Cancelled</option>
                </select>
              </div>
            </div>
          </div>

          {/* Withdrawals Table */}
          <div className="bg-white dark:bg-slate-800 rounded-lg shadow overflow-hidden">
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <RefreshCw className="h-8 w-8 animate-spin text-blue-600" />
              </div>
            ) : filteredWithdrawals.length === 0 ? (
              <div className="text-center py-12">
                <Wallet className="h-12 w-12 text-slate-400 mx-auto mb-4" />
                <p className="text-slate-600 dark:text-slate-400">
                  {searchQuery || statusFilter !== "all"
                    ? "No withdrawal requests found matching your filters"
                    : "No withdrawal requests yet"}
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-slate-200 dark:divide-slate-700">
                  <thead className="bg-slate-50 dark:bg-slate-900">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                        Request ID
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                        Customer
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                        Bank Info
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                        Amount
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                        Created At
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white dark:bg-slate-800 divide-y divide-slate-200 dark:divide-slate-700">
                    {filteredWithdrawals.map((withdrawal) => (
                      <tr
                        key={withdrawal.requestId}
                        className="hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
                      >
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="text-sm font-mono text-slate-900 dark:text-slate-100">
                            {withdrawal.requestId.slice(0, 8)}...
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-sm">
                            <div className="font-medium text-slate-900 dark:text-slate-100">
                              {withdrawal.fullName}
                            </div>
                            <div className="text-slate-500 text-xs">
                              OTP: {withdrawal.otpCode}
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-sm">
                            <div className="font-medium text-slate-900 dark:text-slate-100">
                              {withdrawal.bankName}
                            </div>
                            <div className="text-slate-500 text-xs font-mono">
                              {withdrawal.accountNumber}
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                            {formatCurrency(withdrawal.amount)}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {getStatusBadge(withdrawal.status)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="text-sm text-slate-600 dark:text-slate-400">
                            {formatDate(withdrawal.createdAt)}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <Button
                            onClick={() => handleViewDetails(withdrawal)}
                            variant="ghost"
                            size="sm"
                            className="text-green-600 hover:text-green-700 hover:bg-green-50 bg-white"
                          >
                            <Eye className="h-4 w-4 mr-1" />
                            View
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Detail Modal */}
      <WithdrawalDetailModal
        withdrawal={selectedWithdrawal}
        isOpen={isDetailModalOpen}
        onClose={() => setIsDetailModalOpen(false)}
        onApprove={handleApprove}
        onReject={handleReject}
        onSetProcessing={handleSetProcessing}
      />
    </AdminLayout>
  );
}
