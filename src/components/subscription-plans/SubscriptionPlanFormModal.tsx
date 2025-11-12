"use client";

import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { useEffect, useState } from "react";
import { useToast } from "@/hooks/use-toast";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { subscriptionService } from "@/services/subscriptionService";
import type {
  SubscriptionPlan,
  CreateSubscriptionPlanDto,
} from "@/types/subscription-plan";

const formSchema = z.object({
  planName: z.string().min(3, "Tên gói phải có ít nhất 3 ký tự."),
  planDescription: z.string().optional(),
  basePrice: z.coerce.number().min(0, "Giá phải lớn hơn 0."),
  totalSessions: z.coerce.number().int().min(1, "Số buổi ít nhất là 1."),
  durationInDays: z.coerce.number().int().min(1, "Thời hạn ít nhất là 1 ngày."),
  isActive: z.boolean().default(true),
});

type FormValues = z.infer<typeof formSchema>;

interface SubscriptionPlanFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onPlanSaved: () => void;
  initialData: SubscriptionPlan | null; // null = Create new, !null = Edit
}

export function SubscriptionPlanFormModal({
  isOpen,
  onClose,
  onPlanSaved,
  initialData,
}: SubscriptionPlanFormModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();
  const isEditMode = !!initialData;

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      planName: "",
      planDescription: "",
      basePrice: 1000000,
      totalSessions: 5,
      durationInDays: 90,
      isActive: true,
    },
  });

  // 3. Reset form when 'initialData' changes (when opening modal)
  useEffect(() => {
    if (isOpen) {
      if (initialData) {
        // Edit mode: Load data
        form.reset({
          planName: initialData.planName,
          planDescription: initialData.planDescription || "",
          basePrice: initialData.basePrice,
          totalSessions: initialData.totalSessions,
          durationInDays: initialData.durationInDays,
          isActive: initialData.isActive,
        });
      } else {
        // Create mode: Reset default values
        form.reset({
          planName: "",
          planDescription: "",
          basePrice: 1000000,
          totalSessions: 5,
          durationInDays: 90,
          isActive: true,
        });
      }
    }
  }, [isOpen, initialData, form]);

  // 4. Logic Submit
  const onSubmit = async (values: FormValues) => {
    setIsSubmitting(true);
    try {
      const dto: CreateSubscriptionPlanDto = values;

      if (isEditMode) {
        await subscriptionService.updatePlan(initialData!.planId, dto);
        toast({
          title: "Thành công",
          description: "Đã cập nhật gói đăng ký.",
          variant: "success",
        });
      } else {
        await subscriptionService.createPlan(dto);
        toast({
          title: "Thành công",
          description: "Đã tạo gói đăng ký mới.",
          variant: "success",
        });
      }
      onPlanSaved(); // Notify parent component to refresh list
      onClose();
    } catch (error: any) {
      toast({
        title: "Lỗi",
        description: error.message || "Thao tác thất bại.",
        variant: "error",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-xl max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>
            {isEditMode ? "Chỉnh Sửa Gói" : "Tạo Gói Đăng Ký Mới"}
          </DialogTitle>
          <DialogDescription>
            {isEditMode
              ? "Chỉnh sửa thông tin cho gói đăng ký."
              : "Điền thông tin để tạo một gói đăng ký mới."}
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto pr-6 pl-1 -mr-6 -ml-1">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              {/* Plan Name */}
              <FormField
                control={form.control}
                name="planName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Tên Gói</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Ví dụ: Gói Chăm Sóc Mụn Cao Cấp"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Description */}
              <FormField
                control={form.control}
                name="planDescription"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Mô Tả (Tùy chọn)</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Mô tả lợi ích của gói..."
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Price */}
                <FormField
                  control={form.control}
                  name="basePrice"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Giá (VND)</FormLabel>
                      <FormControl>
                        <Input type="number" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                {/* Sessions */}
                <FormField
                  control={form.control}
                  name="totalSessions"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Tổng Số Buổi</FormLabel>
                      <FormControl>
                        <Input type="number" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* Duration */}
              <FormField
                control={form.control}
                name="durationInDays"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Thời Hạn (Số ngày)</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        placeholder="Ví dụ: 90 (cho 3 tháng)"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Active */}
              <FormField
                control={form.control}
                name="isActive"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center space-x-3 space-y-0 rounded-md border p-4">
                    <FormControl>
                      <Checkbox
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                    <div className="space-y-1 leading-none">
                      <FormLabel>Kích hoạt</FormLabel>
                      <FormDescription>
                        Cho phép khách hàng thấy và mua gói này.
                      </FormDescription>
                    </div>
                  </FormItem>
                )}
              />
            </form>
          </Form>
        </div>

        <DialogFooter className="pt-4 border-t">
          <Button type="button" variant="ghost" onClick={onClose}>
            Hủy
          </Button>
          <Button
            type="submit"
            disabled={isSubmitting}
            onClick={form.handleSubmit(onSubmit)}
          >
            {isSubmitting ? "Đang lưu..." : "Lưu Gói"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
