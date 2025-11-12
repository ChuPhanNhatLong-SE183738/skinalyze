"use client";

import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Edit, Trash2 } from "lucide-react";
import type { SubscriptionPlan } from "@/types/subscription-plan";

interface SubscriptionPlanListProps {
  plans: SubscriptionPlan[];
  isLoading: boolean;
  onEdit: (plan: SubscriptionPlan) => void;
  onDelete: (plan: SubscriptionPlan) => void;
}

export function SubscriptionPlanList({
  plans,
  isLoading,
  onEdit,
  onDelete,
}: SubscriptionPlanListProps) {
  if (isLoading) {
    return <div className="text-center p-8">Đang tải dữ liệu...</div>;
  }

  if (plans.length === 0) {
    return (
      <div className="text-center p-8 text-muted-foreground">
        Không tìm thấy gói nào (hoặc bạn chưa tạo gói nào).
      </div>
    );
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Tên Gói</TableHead>
          <TableHead>Giá (VND)</TableHead>
          <TableHead>Số Buổi</TableHead>
          <TableHead>Thời Hạn (Ngày)</TableHead>
          <TableHead>Trạng Thái</TableHead>
          <TableHead className="text-right">Hành Động</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {plans.map((plan) => (
          <TableRow key={plan.planId}>
            <TableCell className="font-medium">{plan.planName}</TableCell>
            <TableCell>{plan.basePrice.toLocaleString("vi-VN")}</TableCell>
            <TableCell>{plan.totalSessions}</TableCell>
            <TableCell>{plan.durationInDays}</TableCell>
            <TableCell>
              {plan.isActive ? (
                <Badge className="bg-green-400 text-black">Kích hoạt</Badge>
              ) : (
                <Badge variant="secondary">Ẩn</Badge>
              )}
            </TableCell>
            <TableCell className="text-right space-x-2">
              <Button variant="ghost" size="sm" onClick={() => onEdit(plan)}>
                <Edit className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="text-red-500"
                onClick={() => onDelete(plan)}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
