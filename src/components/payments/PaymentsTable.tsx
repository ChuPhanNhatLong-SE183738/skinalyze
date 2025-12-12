"use client";

import React, { useState, useEffect } from "react";
import { Payment, PaymentStatus, PaymentType } from "@/types/payment";
import { paymentService } from "@/services/paymentService";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight } from "lucide-react";

const statusColors: Record<PaymentStatus, string> = {
  pending: "bg-yellow-100 text-yellow-800",
  completed: "bg-green-100 text-green-800",
  failed: "bg-red-100 text-red-800",
  expired: "bg-gray-100 text-gray-800",
  refunded: "bg-blue-100 text-blue-800",
};

const paymentTypeColors: Record<PaymentType, string> = {
  order: "bg-purple-100 text-purple-800",
  topup: "bg-blue-100 text-blue-800",
  withdraw: "bg-orange-100 text-orange-800",
  booking: "bg-cyan-100 text-cyan-800",
  subscription: "bg-pink-100 text-pink-800",
};

export default function PaymentsTable() {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [statusFilter, setStatusFilter] = useState<PaymentStatus | "all">(
    "all"
  );
  const [typeFilter, setTypeFilter] = useState<PaymentType | "all">("all");
  const limit = 50;

  const fetchPayments = async () => {
    try {
      setLoading(true);
      const params: any = { page, limit };
      if (statusFilter !== "all") params.status = statusFilter;
      if (typeFilter !== "all") params.paymentType = typeFilter;

      const response = await paymentService.getAllPayments(params);
      setPayments(response.data);
      setTotal(response.total);
      setTotalPages(response.totalPages);
    } catch (error) {
      console.error("Failed to fetch payments:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPayments();
  }, [page, statusFilter, typeFilter]);

  const formatAmount = (amount: string) => {
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
    }).format(parseFloat(amount));
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return "-";
    return new Date(dateString).toLocaleString("vi-VN");
  };

  const getPaymentTypeDetails = (payment: Payment) => {
    switch (payment.paymentType) {
      case "withdraw":
        // Extract withdrawal request ID from transfer content if available
        const withdrawalMatch = payment.transferContent?.match(/#([a-f0-9-]+)/);
        const withdrawalId = withdrawalMatch ? withdrawalMatch[1].substring(0, 8) : payment.withdrawalRequestId?.substring(0, 8);
        return {
          label: "Withdrawal",
          details: withdrawalId
            ? `Request #${withdrawalId}...`
            : payment.transferContent || "Withdrawal request",
          icon: "💸",
          badgeColor: "bg-orange-100 text-orange-800",
        };
      case "topup":
        const topupStatus = payment.status === "completed" ? "✓ Credited" : "Pending credit";
        return {
          label: "Top-up",
          details: `${topupStatus} - Wallet recharge`,
          icon: "💰",
          badgeColor: "bg-blue-100 text-blue-800",
        };
      case "order":
        const orderRef = payment.orderId
          ? `Order #${payment.orderId}`
          : payment.orderNotes || `Code: ${payment.paymentCode}`;
        return {
          label: "Order",
          details: orderRef,
          icon: "🛍️",
          badgeColor: "bg-purple-100 text-purple-800",
        };
      case "booking":
        return {
          label: "Booking",
          details: "Appointment booking",
          icon: "📅",
          badgeColor: "bg-cyan-100 text-cyan-800",
        };
      case "subscription":
        return {
          label: "Subscription",
          details: "Plan subscription",
          icon: "⭐",
          badgeColor: "bg-pink-100 text-pink-800",
        };
      default:
        return {
          label: payment.paymentType,
          details: "",
          icon: "📄",
          badgeColor: "bg-gray-100 text-gray-800",
        };
    }
  };

  // Calculate statistics
  const stats = {
    totalAmount: payments.reduce((sum, p) => sum + parseFloat(p.amount), 0),
    withdrawals: payments.filter((p) => p.paymentType === "withdraw").length,
    topups: payments.filter((p) => p.paymentType === "topup").length,
    orders: payments.filter((p) => p.paymentType === "order").length,
    pending: payments.filter((p) => p.status === "pending").length,
    completed: payments.filter((p) => p.status === "completed").length,
  };

  return (
    <div className="space-y-6">
      {/* Quick Stats */}
      {!loading && payments.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
          <div className="bg-gradient-to-br from-orange-50 to-orange-100 rounded-lg border border-orange-200 p-4">
            <div className="text-sm font-medium text-orange-700">Withdrawals</div>
            <div className="text-2xl font-bold text-orange-900 mt-1">{stats.withdrawals}</div>
          </div>
          <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg border border-blue-200 p-4">
            <div className="text-sm font-medium text-blue-700">Top-ups</div>
            <div className="text-2xl font-bold text-blue-900 mt-1">{stats.topups}</div>
          </div>
          <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-lg border border-purple-200 p-4">
            <div className="text-sm font-medium text-purple-700">Orders</div>
            <div className="text-2xl font-bold text-purple-900 mt-1">{stats.orders}</div>
          </div>
          <div className="bg-gradient-to-br from-yellow-50 to-yellow-100 rounded-lg border border-yellow-200 p-4">
            <div className="text-sm font-medium text-yellow-700">Pending</div>
            <div className="text-2xl font-bold text-yellow-900 mt-1">{stats.pending}</div>
          </div>
          <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-lg border border-green-200 p-4">
            <div className="text-sm font-medium text-green-700">Completed</div>
            <div className="text-2xl font-bold text-green-900 mt-1">{stats.completed}</div>
          </div>
          <div className="bg-gradient-to-br from-slate-50 to-slate-100 rounded-lg border border-slate-200 p-4">
            <div className="text-sm font-medium text-slate-700">Total Value</div>
            <div className="text-xl font-bold text-slate-900 mt-1">
              {new Intl.NumberFormat("vi-VN", {
                style: "currency",
                currency: "VND",
                notation: "compact",
                maximumFractionDigits: 1,
              }).format(stats.totalAmount)}
            </div>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="bg-white rounded-lg border border-slate-200 p-4">
        <div className="flex gap-4 flex-wrap">
          <div className="flex items-center gap-2">
            <label className="text-sm font-medium text-slate-700">Status:</label>
            <Select
              value={statusFilter}
              onValueChange={(value) => {
                setStatusFilter(value as PaymentStatus | "all");
                setPage(1);
              }}
            >
              <SelectTrigger className="w-[180px] border-slate-300">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
                <SelectItem value="failed">Failed</SelectItem>
                <SelectItem value="expired">Expired</SelectItem>
                <SelectItem value="refunded">Refunded</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center gap-2">
            <label className="text-sm font-medium text-slate-700">Type:</label>
            <Select
              value={typeFilter}
              onValueChange={(value) => {
                setTypeFilter(value as PaymentType | "all");
                setPage(1);
              }}
            >
              <SelectTrigger className="w-[180px] border-slate-300">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="order">Order</SelectItem>
                <SelectItem value="topup">Top-up</SelectItem>
                <SelectItem value="withdraw">Withdraw</SelectItem>
                <SelectItem value="booking">Booking</SelectItem>
                <SelectItem value="subscription">Subscription</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-lg border border-slate-200 overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-slate-50 border-b border-slate-200">
              <TableHead className="text-slate-900 font-semibold">Payment Code</TableHead>
              <TableHead className="text-slate-900 font-semibold">Type & Details</TableHead>
              <TableHead className="text-slate-900 font-semibold">User</TableHead>
              <TableHead className="text-slate-900 font-semibold">Amount</TableHead>
              <TableHead className="text-slate-900 font-semibold">Method</TableHead>
              <TableHead className="text-slate-900 font-semibold">Status</TableHead>
              <TableHead className="text-slate-900 font-semibold">Date</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-8 text-slate-600">
                  Loading...
                </TableCell>
              </TableRow>
            ) : payments.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-8 text-slate-600">
                  No payments found
                </TableCell>
              </TableRow>
            ) : (
              payments.map((payment) => {
                const typeDetails = getPaymentTypeDetails(payment);
                return (
                  <TableRow key={payment.paymentId} className="hover:bg-slate-50">
                    <TableCell className="font-mono text-sm text-slate-900">
                      {payment.paymentCode}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-start gap-2">
                        <span className="text-lg mt-0.5">{typeDetails.icon}</span>
                        <div className="flex flex-col gap-1">
                          <Badge className={typeDetails.badgeColor}>
                            {typeDetails.label}
                          </Badge>
                          <span className="text-xs text-slate-600 max-w-xs truncate font-medium">
                            {typeDetails.details}
                          </span>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col">
                        <span className="font-medium text-slate-900">
                          {payment.user.fullName}
                        </span>
                        <span className="text-sm text-slate-500">
                          {payment.user.email}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col">
                        <span className="font-semibold text-slate-900">
                          {formatAmount(payment.amount)}
                        </span>
                        {payment.paidAmount !== "0.00" && payment.paidAmount !== payment.amount && (
                          <span className="text-xs text-slate-500">
                            Paid: {formatAmount(payment.paidAmount)}
                          </span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className="capitalize text-slate-900 text-sm">
                        {payment.paymentMethod}
                      </span>
                    </TableCell>
                    <TableCell>
                      <Badge className={statusColors[payment.status]}>
                        {payment.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col text-xs">
                        <span className="text-slate-600">
                          {formatDate(payment.createdAt)}
                        </span>
                        {payment.paidAt && (
                          <span className="text-green-600 mt-1">
                            ✓ {formatDate(payment.paidAt)}
                          </span>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      <div className="flex items-center justify-between bg-white rounded-lg border border-slate-200 p-4">
        <div className="text-sm text-slate-600">
          Showing {payments.length > 0 ? (page - 1) * limit + 1 : 0} to{" "}
          {Math.min(page * limit, total)} of {total} payments
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1}
            className="border-slate-300"
          >
            <ChevronLeft className="h-4 w-4" />
            Previous
          </Button>
          <div className="text-sm text-slate-900">
            Page {page} of {totalPages}
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page === totalPages}
            className="border-slate-300"
          >
            Next
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
