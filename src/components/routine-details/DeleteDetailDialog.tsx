"use client";

import { useState } from "react";
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
import { useToast } from "@/hooks/use-toast";
import { routineDetailService } from "@/services/routineDetailService";
import { RoutineDetail } from "@/types/routine-detail";

interface DeleteDetailDialogProps {
  detail: RoutineDetail | null;
  onClose: () => void;
  onDetailDeleted: () => void;
}

export function DeleteDetailDialog({
  detail,
  onClose,
  onDetailDeleted,
}: DeleteDetailDialogProps) {
  const [isDeleting, setIsDeleting] = useState(false);
  const { toast } = useToast();

  const handleDelete = async () => {
    if (!detail) return;
    setIsDeleting(true);
    try {
      await routineDetailService.remove(detail.routineDetailId);
      toast({
        title: "Deleted",
        description: "Routine detail has been deleted.",
        variant: "success",
      });
      onDetailDeleted();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to delete detail.",
        variant: "error",
      });
    } finally {
      setIsDeleting(false);
      onClose();
    }
  };

  return (
    <AlertDialog open={!!detail} onOpenChange={onClose}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Are you sure?</AlertDialogTitle>
          <AlertDialogDescription>
            Do you want to delete this detail:{" "}
            <span className="font-bold">{detail?.description}</span>?
            <br />
            This action cannot be undone.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction onClick={handleDelete} disabled={isDeleting}>
            {isDeleting ? "Deleting..." : "Continue"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
