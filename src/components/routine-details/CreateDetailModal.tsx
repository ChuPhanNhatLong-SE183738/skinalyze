"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
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
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Loader2 } from "lucide-react";

import { routineDetailService } from "@/services/routineDetailService";
import {
  CreateRoutineDetailDto,
  RoutineDetail,
  UpdateRoutineDetailDto,
} from "@/types/routine-detail";

const detailFormSchema = z.object({
  description: z.string().min(3, "Description is required."),
  content: z.string().min(3, "Content is required."),
});

type DetailFormValues = z.infer<typeof detailFormSchema>;

interface CreateDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  onDetailSaved: () => void;
  routineId: string;
  initialData: RoutineDetail | null;
}

export function CreateDetailModal({
  isOpen,
  onClose,
  onDetailSaved,
  routineId,
  initialData,
}: CreateDetailModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();
  const isEditMode = !!initialData; // (Check mode)

  const form = useForm<DetailFormValues>({
    resolver: zodResolver(detailFormSchema),
    defaultValues: {
      description: "",
      content: "",
    },
  });

  useEffect(() => {
    if (isOpen) {
      if (initialData) {
        // Edit: Apply initial data to form
        form.reset({
          description: initialData.description,
          content: initialData.content,
        });
      } else {
        //  Create: Reset form
        form.reset({
          description: "",
          content: "",
        });
      }
    }
  }, [isOpen, initialData, form]);

  const onSubmit = async (values: DetailFormValues) => {
    setIsSubmitting(true);
    try {
      if (isEditMode) {
        const dto: UpdateRoutineDetailDto = {
          ...values,
          productIds: initialData.productIds,
        };
        await routineDetailService.update(initialData.routineDetailId, dto);
        toast({
          title: "Success",
          description: "Routine detail has been updated.",
          variant: "success",
        });
      } else {
        // --- Logic CREATE ---
        const dto: CreateRoutineDetailDto = {
          ...values,
          routineId: routineId,
          productIds: [],
        };
        await routineDetailService.create(dto);
        toast({
          title: "Success",
          description: "New routine detail has been created.",
          variant: "success",
        });
      }
      onDetailSaved();
      onClose();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Operation failed.",
        variant: "error",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-xl">
        <DialogHeader>
          {/* Dynamic title */}
          <DialogTitle>
            {isEditMode ? "Edit Routine Detail" : "Add New Routine Detail"}
          </DialogTitle>
          <DialogDescription>
            {isEditMode
              ? "Make changes to this routine step."
              : "Add a new step or phase to this treatment routine."}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="E.g., Phase 1: Cleansing & Hydration"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="content"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Content (Instructions)</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Detailed instructions for the customer..."
                      {...field}
                      rows={5}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter>
              <Button type="button" variant="ghost" onClick={onClose}>
                Cancel
              </Button>
              {/* Dynamic button text */}
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : null}
                {isEditMode ? "Save Changes" : "Create Detail"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
