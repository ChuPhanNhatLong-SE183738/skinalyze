"use client";

import { useState, useEffect, useCallback, Suspense } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useToast } from "@/hooks/use-toast";

import { treatmentRoutineService } from "@/services/treamentRoutineService";
import { routineDetailService } from "@/services/routineDetailService";
import type {
  CreateTreatmentRoutineDto,
  UpdateTreatmentRoutineDto,
} from "@/types/treatment-routine";
import { RoutineStatus } from "@/types/treatment-routine";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import {
  Loader2,
  ArrowLeft,
  Save,
  PlusCircle,
  Edit,
  Trash2,
} from "lucide-react";

import { CreateDetailModal } from "@/components/routine-details/CreateDetailModal";
import { DeleteDetailDialog } from "@/components/routine-details/DeleteDetailDialog";
import { RoutineDetail } from "@/types/routine-detail";

const routineFormSchema = z.object({
  routineName: z.string().min(3, "Routine name must be at least 3 characters."),
  status: z.enum(["ACTIVE", "COMPLETED", "CANCELLED"] as const, {
    error: "Please select a status.",
  }),
});

type RoutineFormValues = z.infer<typeof routineFormSchema>;

function TreatmentRoutineForm() {
  const router = useRouter();
  const params = useParams();
  const searchParams = useSearchParams();
  const { toast } = useToast();

  const [isFormLoading, setIsFormLoading] = useState(false);
  const [isDetailsLoading, setIsDetailsLoading] = useState(false);

  const [details, setDetails] = useState<RoutineDetail[]>([]);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [detailToEdit, setDetailToEdit] = useState<RoutineDetail | null>(null);
  const [detailToDelete, setDetailToDelete] = useState<RoutineDetail | null>(
    null
  );

  const routineId = params.id as string;
  const isCreateMode = routineId === "create";

  const form = useForm<RoutineFormValues>({
    resolver: zodResolver(routineFormSchema),
    defaultValues: {
      routineName: "",
      status: RoutineStatus.ACTIVE,
    },
  });

  const fetchDetailsOnly = useCallback(
    async (id: string) => {
      setIsDetailsLoading(true);
      try {
        const detailData = await routineDetailService.findByRoutineId(id);
        setDetails(detailData);
      } catch (error: any) {
        toast({
          title: "Error",
          description: error.message || "Failed to load routine details.",
          variant: "error",
        });
      } finally {
        setIsDetailsLoading(false);
      }
    },
    [toast]
  );

  const fetchRoutine = useCallback(
    async (id: string) => {
      setIsFormLoading(true);
      setIsDetailsLoading(true);
      try {
        const routineData = await treatmentRoutineService.getById(id);
        form.reset({
          routineName: routineData.routineName,
          status: routineData.status,
        });

        const detailData = await routineDetailService.findByRoutineId(id);
        setDetails(detailData);
      } catch (error: any) {
        toast({
          title: "Error",
          description: error.message || "Failed to load routine.",
          variant: "error",
        });
        router.back();
      } finally {
        setIsFormLoading(false);
        setIsDetailsLoading(false);
      }
    },
    [form, router, toast]
  );

  useEffect(() => {
    if (isCreateMode) {
      const appointmentId = searchParams.get("appointmentId");
      form.reset({
        routineName: appointmentId
          ? `Routine for Appt ${appointmentId.substring(0, 4)}...`
          : "New Treatment Routine",
        status: RoutineStatus.ACTIVE,
      });
    } else {
      fetchRoutine(routineId);
    }
  }, [isCreateMode, routineId, fetchRoutine, form, searchParams]);

  const onSubmit = async (values: RoutineFormValues) => {
    setIsFormLoading(true);
    try {
      if (isCreateMode) {
        const dermatologistId = searchParams.get("dermatologistId");
        const customerId = searchParams.get("customerId");
        const createdFromAppointmentId = searchParams.get("appointmentId");

        if (!dermatologistId || !customerId) {
          throw new Error("Missing Dermatologist or Customer ID.");
        }

        const dto: CreateTreatmentRoutineDto = {
          ...values,
          dermatologistId,
          customerId,
          createdFromAppointmentId: createdFromAppointmentId || undefined,
        };

        const newRoutine = await treatmentRoutineService.create(dto);
        toast({
          title: "Success",
          description: "Routine created successfully.",
          variant: "success",
        });
        router.replace(`/dermatologist/routines/${newRoutine.routineId}`);
      } else {
        const dto: UpdateTreatmentRoutineDto = values;
        await treatmentRoutineService.update(routineId, dto);
        toast({
          title: "Success",
          description: "Routine updated successfully.",
          variant: "success",
        });
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Operation failed.",
        variant: "error",
      });
    } finally {
      setIsFormLoading(false);
    }
  };

  const onDetailSaved = () => {
    if (!isCreateMode) {
      fetchDetailsOnly(routineId);
    }
  };

  if (isFormLoading && !isCreateMode) {
    return (
      <div className="flex h-full items-center justify-center p-8">
        <Loader2 className="h-10 w-10 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4 md:p-8 max-w-4xl">
      <Button variant="ghost" onClick={() => router.back()} className="mb-4">
        <ArrowLeft className="mr-2 h-4 w-4" />
        Back
      </Button>

      <Card className="shadow-lg">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)}>
            <CardHeader>
              <CardTitle className="text-2xl">
                {isCreateMode
                  ? "Create New Routine"
                  : "Update Treatment Routine"}
              </CardTitle>
              <CardDescription>
                {isCreateMode
                  ? "Create a new treatment routine for the customer."
                  : `Editing routine: ${routineId.substring(0, 8)}...`}
              </CardDescription>
            </CardHeader>

            <CardContent className="space-y-6">
              {/* Routine Name */}
              <FormField
                control={form.control}
                name="routineName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Routine Name</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="E.g., Acne Treatment (3 Months)"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Status */}
              <FormField
                control={form.control}
                name="status"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Status</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select a status..." />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value={RoutineStatus.ACTIVE}>
                          Active
                        </SelectItem>
                        <SelectItem value={RoutineStatus.COMPLETED}>
                          Completed
                        </SelectItem>
                        <SelectItem value={RoutineStatus.CANCELLED}>
                          Cancelled
                        </SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>

            <CardFooter>
              <Button type="submit" disabled={isFormLoading} className="w-full">
                {isFormLoading ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Save className="mr-2 h-4 w-4" />
                )}
                {isCreateMode ? "Create Routine" : "Save Changes"}
              </Button>
            </CardFooter>
          </form>
        </Form>
      </Card>

      {/* --- Routine Details --- */}
      {!isCreateMode && (
        <Card className="shadow-lg mt-8">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-2xl">Routine Details</CardTitle>
              <CardDescription>
                Steps and phases of this treatment routine.
              </CardDescription>
            </div>
            {/* Disable button while loading */}
            <Button
              onClick={() => {
                setDetailToEdit(null);
                setIsModalOpen(true);
              }}
              disabled={isFormLoading || isDetailsLoading}
            >
              <PlusCircle className="mr-2 h-4 w-4" />
              Add Detail
            </Button>
          </CardHeader>
          <CardContent className="space-y-4">
            {isDetailsLoading ? (
              <div className="text-center py-4">
                <Loader2 className="h-6 w-6 animate-spin mx-auto" />
              </div>
            ) : details.length === 0 ? (
              <p className="text-muted-foreground text-center py-4">
                No details added yet.
              </p>
            ) : (
              details.map((detail) => (
                <div
                  key={detail.routineDetailId}
                  className="border-b pb-4 last:border-b-0"
                >
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <h4 className="font-semibold text-lg">
                        {detail.description}
                      </h4>
                      <p className="text-muted-foreground mt-2 whitespace-pre-wrap">
                        {detail.content}
                      </p>
                    </div>
                    <div className="flex gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => {
                          setDetailToEdit(detail);
                          setIsModalOpen(true);
                        }}
                        disabled={isFormLoading || isDetailsLoading}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="text-red-500 hover:text-red-600"
                        onClick={() => setDetailToDelete(detail)}
                        disabled={isFormLoading || isDetailsLoading}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      )}

      {/* --- Modals  --- */}
      <CreateDetailModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onDetailSaved={onDetailSaved}
        routineId={routineId}
        initialData={detailToEdit}
      />

      <DeleteDetailDialog
        detail={detailToDelete}
        onClose={() => setDetailToDelete(null)}
        onDetailDeleted={onDetailSaved}
      />
    </div>
  );
}

/**
 * Bọc component bằng <Suspense>
 */
export default function TreatmentRoutinePageWrapper() {
  return (
    <Suspense
      fallback={
        <div className="flex h-full items-center justify-center p-8">
          <Loader2 className="h-10 w-10 animate-spin text-blue-600" />
        </div>
      }
    >
      <TreatmentRoutineForm />
    </Suspense>
  );
}
