"use client";

import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { orderService } from "@/services/orderService";
import { authService } from "@/services/authService";
import {
  Package,
  User,
  MapPin,
  CreditCard,
  Calendar,
  CheckCircle,
  XCircle,
  AlertCircle,
} from "lucide-react";

interface Order {
  orderId: string;
  customer: {
    customerId: string;
    userId: string;
  };
  customerId: string;
  transaction: {
    transactionId: string;
    status: string;
    totalAmount: string;
    createdAt: string;
    updatedAt: string;
  };
  transactionId: string;
  status: string;
  shippingAddress: string;
  notes: string | null;
  rejectionReason: string | null;
  processedBy: string | null;
  orderItems: Array<{
    orderItemId: string;
    orderId: string;
    product: {
      productId: string;
      productName: string;
      productDescription: string;
      brand: string;
      sellingPrice: number;
      productImages: string[];
    };
    productId: string;
    priceAtTime: string;
    quantity: number;
  }>;
  shippingLogs: any[];
  createdAt: string;
  updatedAt: string;
}

interface OrderDetailModalProps {
  orderId: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onOrderUpdated: () => void;
}

export function OrderDetailModal({
  orderId,
  open,
  onOpenChange,
  onOrderUpdated,
}: OrderDetailModalProps) {
  const [order, setOrder] = useState<Order | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [showCancelDialog, setShowCancelDialog] = useState(false);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [cancelReason, setCancelReason] = useState("");
  const [customReason, setCustomReason] = useState("");
  const [confirmNote, setConfirmNote] = useState("");
  const [error, setError] = useState("");

  // Load order details when modal opens
  useEffect(() => {
    if (open && orderId) {
      loadOrderDetails();
    }
  }, [open, orderId]);

  const loadOrderDetails = async () => {
    if (!orderId) return;

    try {
      setIsLoading(true);
      setError("");
      const response = await orderService.getOrderById(orderId);
      setOrder(response.data);
    } catch (err: any) {
      setError(err.message || "Failed to load order details");
    } finally {
      setIsLoading(false);
    }
  };

  const handleConfirm = async () => {
    if (!orderId) return;

    try {
      setIsProcessing(true);
      const user = authService.getUserFromCookie();
      if (!user) {
        setError("User not authenticated");
        return;
      }
      
      await orderService.confirmOrder(orderId, user.userId, confirmNote || undefined);
      onOrderUpdated();
      onOpenChange(false);
      setShowConfirmDialog(false);
      setConfirmNote("");
    } catch (err: any) {
      setError(err.message || "Failed to confirm order");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleCancel = async () => {
    if (!orderId) return;

    const finalReason = cancelReason === "custom" ? customReason : cancelReason;
    
    if (!finalReason.trim()) {
      setError("Please provide a reason for cancellation");
      return;
    }

    try {
      setIsProcessing(true);
      const user = authService.getUserFromCookie();
      
      await orderService.cancelOrder(orderId, finalReason, user?.userId);
      onOrderUpdated();
      onOpenChange(false);
      setShowCancelDialog(false);
      setCancelReason("");
      setCustomReason("");
    } catch (err: any) {
      setError(err.message || "Failed to cancel order");
    } finally {
      setIsProcessing(false);
    }
  };

  const formatCurrency = (amount: string | number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(typeof amount === "string" ? parseFloat(amount) : amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  // Show cancel confirmation dialog
  if (showCancelDialog) {
    return (
      <Dialog open={showCancelDialog} onOpenChange={setShowCancelDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>❌ Cancel Order</DialogTitle>
            <DialogDescription>
              Please provide a reason for cancelling this order. This will be
              shared with the customer.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {error && (
              <div className="flex items-center gap-2 rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-600 dark:border-red-900 dark:bg-red-950/30">
                <AlertCircle className="h-4 w-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="reason-select">Select Reason *</Label>
              <select
                id="reason-select"
                className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm focus:border-slate-500 focus:outline-none dark:border-slate-700 dark:bg-slate-950"
                value={cancelReason}
                onChange={(e) => {
                  setCancelReason(e.target.value);
                  if (e.target.value !== "custom") {
                    setCustomReason("");
                  }
                }}
                disabled={isProcessing}
              >
                <option value="">-- Select a reason --</option>
                <option value="Sản phẩm tạm hết hàng">Sản phẩm tạm hết hàng</option>
                <option value="Khách hàng yêu cầu hủy">Khách hàng yêu cầu hủy</option>
                <option value="Địa chỉ giao hàng không hợp lệ">Địa chỉ giao hàng không hợp lệ</option>
                <option value="Không thể xác nhận thanh toán">Không thể xác nhận thanh toán</option>
                <option value="custom">Other reason...</option>
              </select>
            </div>

            {cancelReason === "custom" && (
              <div className="space-y-2">
                <Label htmlFor="custom-reason">Custom Reason *</Label>
                <Textarea
                  id="custom-reason"
                  placeholder="Enter your reason..."
                  value={customReason}
                  onChange={(e) => setCustomReason(e.target.value)}
                  rows={4}
                  disabled={isProcessing}
                />
              </div>
            )}
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setShowCancelDialog(false);
                setCancelReason("");
                setCustomReason("");
                setError("");
              }}
              disabled={isProcessing}
            >
              Back
            </Button>
            <Button
              variant="destructive"
              onClick={handleCancel}
              disabled={isProcessing || !cancelReason || (cancelReason === "custom" && !customReason.trim())}
            >
              {isProcessing ? "Cancelling..." : "Cancel Order"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    );
  }

  // Show confirm dialog
  if (showConfirmDialog) {
    return (
      <Dialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>✅ Confirm Order</DialogTitle>
            <DialogDescription>
              {orderId && `Confirm order #${orderId.slice(0, 8)}...`}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {error && (
              <div className="flex items-center gap-2 rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-600 dark:border-red-900 dark:bg-red-950/30">
                <AlertCircle className="h-4 w-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="confirm-note">Note (Optional)</Label>
              <Textarea
                id="confirm-note"
                placeholder="e.g., Đã kiểm tra hàng, sẵn sàng giao..."
                value={confirmNote}
                onChange={(e) => setConfirmNote(e.target.value)}
                rows={4}
                disabled={isProcessing}
              />
              <p className="text-xs text-slate-500">
                Add any notes about the order confirmation
              </p>
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setShowConfirmDialog(false);
                setConfirmNote("");
                setError("");
              }}
              disabled={isProcessing}
            >
              Back
            </Button>
            <Button
              onClick={handleConfirm}
              disabled={isProcessing}
              className="bg-green-600 hover:bg-green-700"
            >
              <CheckCircle className="mr-2 h-4 w-4" />
              {isProcessing ? "Confirming..." : "Confirm Order"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Order Details</DialogTitle>
          <DialogDescription>
            {orderId && `Order ID: ${orderId.slice(0, 8)}...`}
          </DialogDescription>
        </DialogHeader>

        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-slate-300 border-t-slate-900" />
          </div>
        ) : error && !order ? (
          <div className="flex items-center gap-2 rounded-md border border-red-200 bg-red-50 p-4 text-sm text-red-600">
            <AlertCircle className="h-5 w-5 shrink-0" />
            <span>{error}</span>
          </div>
        ) : order ? (
          <div className="space-y-6 py-4">
            {error && (
              <div className="flex items-center gap-2 rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-600">
                <AlertCircle className="h-4 w-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {/* Order Status */}
            <div className="rounded-lg border border-slate-200 p-4 dark:border-slate-800">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold text-slate-900 dark:text-slate-100">
                  Order Status
                </h3>
                <span
                  className={`rounded-full px-3 py-1 text-xs font-medium ${
                    order.status === "PENDING"
                      ? "bg-yellow-50 text-yellow-600"
                      : order.status === "CONFIRMED"
                      ? "bg-blue-50 text-blue-600"
                      : order.status === "DELIVERED"
                      ? "bg-green-50 text-green-600"
                      : "bg-gray-50 text-gray-600"
                  }`}
                >
                  {order.status}
                </span>
              </div>
            </div>

            {/* Customer Info */}
            <div className="rounded-lg border border-slate-200 p-4 dark:border-slate-800">
              <div className="mb-3 flex items-center gap-2">
                <User className="h-5 w-5 text-slate-500" />
                <h3 className="font-semibold text-slate-900 dark:text-slate-100">
                  Customer Information
                </h3>
              </div>
              <div className="space-y-2 text-sm">
                <div>
                  <span className="text-slate-500">Customer ID:</span>{" "}
                  <span className="font-mono text-slate-900 dark:text-slate-100">
                    {order.customerId.slice(0, 12)}...
                  </span>
                </div>
              </div>
            </div>

            {/* Shipping Address */}
            <div className="rounded-lg border border-slate-200 p-4 dark:border-slate-800">
              <div className="mb-3 flex items-center gap-2">
                <MapPin className="h-5 w-5 text-slate-500" />
                <h3 className="font-semibold text-slate-900 dark:text-slate-100">
                  Shipping Address
                </h3>
              </div>
              <p className="text-sm text-slate-600 dark:text-slate-400">
                {order.shippingAddress}
              </p>
              {order.notes && (
                <div className="mt-2">
                  <span className="text-sm font-medium text-slate-500">
                    Notes:
                  </span>
                  <p className="text-sm text-slate-600 dark:text-slate-400">
                    {order.notes}
                  </p>
                </div>
              )}
            </div>

            {/* Order Items */}
            <div className="rounded-lg border border-slate-200 p-4 dark:border-slate-800">
              <div className="mb-3 flex items-center gap-2">
                <Package className="h-5 w-5 text-slate-500" />
                <h3 className="font-semibold text-slate-900 dark:text-slate-100">
                  Order Items ({order.orderItems.length})
                </h3>
              </div>
              <div className="space-y-3">
                {order.orderItems.map((item) => (
                  <div
                    key={item.orderItemId}
                    className="flex gap-4 rounded-lg border border-slate-100 p-3 dark:border-slate-800"
                  >
                    {item.product.productImages[0] && (
                      <img
                        src={item.product.productImages[0]}
                        alt={item.product.productName}
                        className="h-16 w-16 rounded-md object-cover"
                      />
                    )}
                    <div className="flex-1">
                      <h4 className="font-medium text-slate-900 dark:text-slate-100">
                        {item.product.productName}
                      </h4>
                      <p className="text-sm text-slate-500">
                        {item.product.brand}
                      </p>
                      <div className="mt-1 flex items-center gap-4 text-sm">
                        <span className="text-slate-600">
                          Qty: {item.quantity}
                        </span>
                        <span className="text-slate-600">
                          {formatCurrency(item.priceAtTime)} each
                        </span>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-slate-900 dark:text-slate-100">
                        {formatCurrency(
                          parseFloat(item.priceAtTime) * item.quantity
                        )}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Transaction Info */}
            <div className="rounded-lg border border-slate-200 p-4 dark:border-slate-800">
              <div className="mb-3 flex items-center gap-2">
                <CreditCard className="h-5 w-5 text-slate-500" />
                <h3 className="font-semibold text-slate-900 dark:text-slate-100">
                  Transaction
                </h3>
              </div>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-slate-500">Transaction ID:</span>
                  <span className="font-mono text-slate-900 dark:text-slate-100">
                    {order.transactionId.slice(0, 12)}...
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Status:</span>
                  <span className="font-medium text-slate-900 dark:text-slate-100">
                    {order.transaction.status}
                  </span>
                </div>
                <div className="flex justify-between border-t border-slate-200 pt-2 dark:border-slate-800">
                  <span className="font-semibold text-slate-900 dark:text-slate-100">
                    Total Amount:
                  </span>
                  <span className="text-lg font-bold text-slate-900 dark:text-slate-100">
                    {formatCurrency(order.transaction.totalAmount)}
                  </span>
                </div>
              </div>
            </div>

            {/* Dates */}
            <div className="rounded-lg border border-slate-200 p-4 dark:border-slate-800">
              <div className="mb-3 flex items-center gap-2">
                <Calendar className="h-5 w-5 text-slate-500" />
                <h3 className="font-semibold text-slate-900 dark:text-slate-100">
                  Timeline
                </h3>
              </div>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-slate-500">Created:</span>
                  <span className="text-slate-900 dark:text-slate-100">
                    {formatDate(order.createdAt)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Last Updated:</span>
                  <span className="text-slate-900 dark:text-slate-100">
                    {formatDate(order.updatedAt)}
                  </span>
                </div>
              </div>
            </div>
          </div>
        ) : null}

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Close
          </Button>
          {order && order.status === "PENDING" && (
            <>
              <Button
                variant="destructive"
                onClick={() => {
                  setShowCancelDialog(true);
                  setError("");
                }}
                disabled={isProcessing}
              >
                <XCircle className="mr-2 h-4 w-4" />
                Cancel Order
              </Button>
              <Button
                onClick={() => {
                  setShowConfirmDialog(true);
                  setError("");
                }}
                disabled={isProcessing}
                className="bg-green-600 hover:bg-green-700"
              >
                <CheckCircle className="mr-2 h-4 w-4" />
                Confirm Order
              </Button>
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
