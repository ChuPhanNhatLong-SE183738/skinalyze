"use client";

import { useState } from "react";
import { format } from "date-fns";
import { Loader2 } from "lucide-react"; 
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { availabilityService } from "@/services/availabilityService";
import { useToast } from "@/hooks/use-toast";
import type { AvailabilitySlot } from "@/types/availability-slot";

interface DeleteSlotDialogProps {
  slot: AvailabilitySlot | null;
  onClose: () => void;
  onSlotDeleted: () => void;
}

export function DeleteSlotDialog({
  slot,
  onClose,
  onSlotDeleted,
}: DeleteSlotDialogProps) {
  const [isDeleting, setIsDeleting] = useState(false);
  const { toast } = useToast();

  const handleDelete = async () => {
    if (!slot) return;

    setIsDeleting(true);
    try {
      await availabilityService.deleteSlot(slot.slotId);
      toast({
        title: "Thành công",
        description: "Đã xóa slot thành công.",
        variant: "success",
      });
      onSlotDeleted(); // Notify parent about successful deletion
    } catch (error: any) {
      toast({
        title: "Lỗi",
        description: error.message || "Xóa slot thất bại.",
        variant: "error",
      });
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <AlertDialog open={!!slot} onOpenChange={onClose}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Bạn có chắc chắn?</AlertDialogTitle>
          <AlertDialogDescription>
            Bạn có muốn xóa slot: <br />
            <span className="font-medium">
              {slot
                ? format(new Date(slot.startTime), "HH:mm dd/MM/yyyy")
                : "..."}
            </span>
            ?
            <br />
            Hành động này không thể hoàn tác.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Hủy</AlertDialogCancel>
          <AlertDialogAction
            className="bg-red-600 hover:bg-red-700 focus:ring-red-600"
            onClick={handleDelete}
            disabled={isDeleting}
          >
            {isDeleting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Đang xóa...
              </>
            ) : (
              "Tiếp Tục Xóa"
            )}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
