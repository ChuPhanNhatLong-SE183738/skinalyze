"use client";

import { useState, useEffect, useCallback } from "react";
import type { ComponentType, ReactNode } from "react";
import { useParams, useRouter } from "next/navigation";
import { useToast } from "@/hooks/use-toast";
import { appointmentService } from "@/services/appointmentService";
import type { Appointment, CompleteAppointmentDto } from "@/types/appointment";
import { AppointmentStatus } from "@/types/appointment";
import { format } from "date-fns";
import { enUS } from "date-fns/locale";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from "@/components/ui/card";
import {
  Loader2,
  ArrowLeft,
  Video,
  Briefcase,
  Phone,
  Cake,
  CalendarClock,
  Coins,
  ClipboardList,
  ClipboardCheck,
  CheckCircle2,
  Check,
  XCircle,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import Image from "next/image";
import { Label } from "@/components/ui/label";
import Link from "next/link";
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
import { Textarea } from "@/components/ui/textarea";
import { SkinAnalysisCard } from "@/components/skin-analysis/SkinAnalysisCard";

const statusLabels: Record<AppointmentStatus, string> = {
  [AppointmentStatus.SCHEDULED]: "Scheduled",
  [AppointmentStatus.IN_PROGRESS]: "In Progress",
  [AppointmentStatus.COMPLETED]: "Completed",
  [AppointmentStatus.CANCELLED]: "Cancelled",
  [AppointmentStatus.NO_SHOW]: "No-show",
  [AppointmentStatus.INTERRUPTED]: "Interrupted",
  [AppointmentStatus.PENDING_PAYMENT]: "Pending Payment",
};

const getStatusBadgeVariant = (
  status: AppointmentStatus
): "default" | "destructive" | "secondary" | "outline" => {
  switch (status) {
    case AppointmentStatus.SCHEDULED:
      return "default";
    case AppointmentStatus.IN_PROGRESS:
      return "secondary";
    case AppointmentStatus.COMPLETED:
      return "secondary";
    case AppointmentStatus.CANCELLED:
    case AppointmentStatus.NO_SHOW:
    case AppointmentStatus.INTERRUPTED:
      return "destructive";
    case AppointmentStatus.PENDING_PAYMENT:
      return "outline";
    default:
      return "secondary";
  }
};

export default function AppointmentDetailPage() {
  const [appointment, setAppointment] = useState<Appointment | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const [isJoining, setIsJoining] = useState(false);
  const [isCompleting, setIsCompleting] = useState(false);
  const [isCancelling, setIsCancelling] = useState(false);

  const [dialogOpen, setDialogOpen] = useState<"complete" | "cancel" | null>(
    null
  );
  const [terminationNote, setTerminationNote] = useState("");

  const router = useRouter();
  const params = useParams();
  const { toast } = useToast();

  const appointmentId = params.id as string;

  const fetchAppointment = useCallback(async () => {
    if (!appointmentId) return;
    setIsLoading(true);
    try {
      const data = await appointmentService.getAppointmentById(appointmentId);
      setAppointment(data);
    } catch (error: unknown) {
      const message =
        error instanceof Error ? error.message : "Unable to load appointment.";
      toast({
        title: "Error",
        description: message || "Unable to load appointment details.",
        variant: "error",
      });
      router.back();
    } finally {
      setIsLoading(false);
    }
  }, [appointmentId, router, toast]);

  useEffect(() => {
    fetchAppointment();
  }, [fetchAppointment]);

  const handleJoinMeet = async () => {
    if (!appointment) return;

    setIsJoining(true);
    let meetLink = appointment.meetingUrl;

    try {
      if (!meetLink) {
        toast({
          title: "Creating meeting link...",
          description: "Please wait a moment.",
          variant: "default",
        });

        const response = await appointmentService.generateManualMeetLink(
          appointment.appointmentId
        );

        meetLink = response.meetLink;

        if (!meetLink) {
          throw new Error("Unable to create meeting link.");
        }
      }

      await appointmentService.checkInDermatologist(appointment.appointmentId);
      toast({
        title: "Checked In!",
        description: "Your check-in has been recorded.",
        variant: "success",
      });

      // Open link
      window.open(meetLink, "_blank");

      await fetchAppointment();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to join meeting.",
        variant: "error",
      });
    } finally {
      setIsJoining(false);
    }
  };

  const handleComplete = async () => {
    if (!appointment) return;

    setIsCompleting(true);
    const dto: CompleteAppointmentDto = {
      note: terminationNote || undefined,
    };

    try {
      const updatedAppointment = await appointmentService.completeAppointment(
        appointment.appointmentId,
        dto
      );
      setAppointment(updatedAppointment);
      toast({
        title: "Success",
        description: "Appointment marked as COMPLETED.",
        variant: "success",
      });
      setDialogOpen(null);
      setTerminationNote(""); // Reset note
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to complete appointment.",
        variant: "error",
      });
    } finally {
      setIsCompleting(false);
    }
  };

  const handleCancel = async () => {
    if (!appointment) return;

    if (!appointment) return;

    setIsCancelling(true);
    try {
      await appointmentService.cancelByDermatologist(appointment.appointmentId);

      toast({
        title: "Success",
        description: "Appointment has been cancelled.",
        variant: "success",
      });
      setDialogOpen(null);

      await fetchAppointment();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to cancel appointment.",
        variant: "error",
      });
    } finally {
      setIsCancelling(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex h-full items-center justify-center p-8">
        <Loader2 className="h-10 w-10 animate-spin text-blue-600" />
      </div>
    );
  }

  if (!appointment) {
    return (
      <div className="flex h-full items-center justify-center p-8">
        <p className="text-red-600">Appointment not found.</p>
      </div>
    );
  }

  const canJoinMeet =
    appointment.appointmentStatus === AppointmentStatus.SCHEDULED ||
    appointment.appointmentStatus === AppointmentStatus.IN_PROGRESS;

  const renderList = (title: string, items: string[] | null) => {
    return (
      <div className="space-y-2">
        <Label className="text-sm font-medium text-muted-foreground">
          {title}
        </Label>
        {items && items.length > 0 ? (
          <div className="flex flex-wrap gap-2">
            {items.map((item, index) => (
              <Badge key={index} variant="destructive">
                {item}
              </Badge>
            ))}
          </div>
        ) : (
          <p className="text-sm text-gray-500 italic">None</p>
        )}
      </div>
    );
  };

  const InfoRow = ({
    icon: Icon,
    label,
    value,
  }: {
    icon: ComponentType<{ className?: string }>;
    label: string;
    value: ReactNode;
  }) => (
    <div className="flex items-center gap-3">
      <Icon className="h-5 w-5 text-muted-foreground" />
      <div className="flex-1">
        <span className="text-sm font-medium text-muted-foreground">
          {label}
        </span>
        <p className="font-semibold">{value ?? "Not provided"}</p>
      </div>
    </div>
  );

  const createdRoutineId = appointment.createdRoutine?.routineId;
  const trackingRoutineId = appointment.trackingRoutine?.routineId;
  const targetRoutineId = createdRoutineId || trackingRoutineId;

  const routineButton = (
    <Button asChild size="lg" className="w-full" variant="outline">
      {targetRoutineId ? (
        <Link href={`/dermatologist/routine/${targetRoutineId}`}>
          <ClipboardCheck className="mr-2 h-5 w-5" />
          View / Update Treatment Routine
        </Link>
      ) : (
        <Link
          href={{
            pathname: "/dermatologist/routines/create",
            query: {
              appointmentId: appointment.appointmentId,
              customerId: appointment.customer.customerId,
              dermatologistId: appointment.dermatologist.dermatologistId,
            },
          }}
        >
          <ClipboardCheck className="mr-2 h-5 w-5" />
          Create New Treatment Routine
        </Link>
      )}
    </Button>
  );

  const isCancellable =
    appointment.appointmentStatus === AppointmentStatus.SCHEDULED;
  const isCompletable =
    appointment.appointmentStatus === AppointmentStatus.SCHEDULED ||
    appointment.appointmentStatus === AppointmentStatus.IN_PROGRESS;

  return (
    <div className="container mx-auto p-4 md:p-8 max-w-6xl">
      <Button variant="ghost" onClick={() => router.back()} className="mb-4">
        <ArrowLeft className="mr-2 h-4 w-4" />
        Back to Appointments
      </Button>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Customer Information */}
        <div className="lg:col-span-2 space-y-6">
          <Card className="shadow-lg">
            <CardHeader className="flex flex-row items-center gap-4">
              <Image
                src={
                  appointment.customer.user.photoUrl ||
                  "https://placehold.co/80x80/e0e0e0/333?text=User"
                }
                alt="Avatar"
                className="h-20 w-20 rounded-full border"
                width={80}
                height={80}
              />
              <div className="flex-1">
                <CardTitle className="text-2xl">
                  {appointment.customer.user.fullName}
                </CardTitle>
                <CardDescription>
                  {appointment.customer.user.email}
                </CardDescription>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              <Separator />
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <InfoRow
                  icon={Phone}
                  label="Phone"
                  value={appointment.customer.user.phone}
                />
                <InfoRow
                  icon={Cake}
                  label="Date of Birth"
                  value={format(
                    new Date(appointment.customer.user.dob!),
                    "MMMM d, yyyy",
                    { locale: enUS }
                  )}
                />
              </div>
              <Separator />
              {renderList("Allergies", appointment.customer.allergicTo)}
              {renderList(
                "Dermatological History",
                appointment.customer.pastDermatologicalHistory
              )}
            </CardContent>
          </Card>
          {appointment.skinAnalysis && (
            <SkinAnalysisCard analysis={appointment.skinAnalysis} />
          )}
        </div>

        {/* Right Column: Appointment Details */}
        <div className="lg:col-span-1 space-y-6">
          <Card className="shadow-lg">
            <CardHeader>
              <CardTitle className="text-xl">Appointment Details</CardTitle>
              <CardDescription>ID: {appointment.appointmentId}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Main action buttons */}
              {canJoinMeet && (
                <Button
                  size="lg"
                  className="w-full bg-green-600 hover:bg-green-700"
                  onClick={handleJoinMeet}
                  disabled={isJoining}
                >
                  {isJoining ? (
                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  ) : (
                    <Video className="mr-2 h-5 w-5" />
                  )}
                  {appointment.appointmentStatus ===
                  AppointmentStatus.IN_PROGRESS
                    ? "Re-join Meeting"
                    : "Join Meeting & Check-in"}
                </Button>
              )}

              {/* Routine Button */}
              {(appointment.appointmentStatus ===
                AppointmentStatus.IN_PROGRESS ||
                appointment.appointmentStatus === AppointmentStatus.COMPLETED ||
                appointment.appointmentStatus ===
                  AppointmentStatus.SCHEDULED) &&
                routineButton}

              {/* Complete Button */}
              {isCompletable && (
                <Button
                  size="lg"
                  className="w-full"
                  variant="default"
                  onClick={() => setDialogOpen("complete")}
                >
                  <Check className="mr-2 h-5 w-5" />
                  Mark as Completed
                </Button>
              )}

              {/* Appointment information  */}
              <div className="space-y-4 pt-4 border-t">
                <InfoRow
                  icon={CheckCircle2}
                  label="Status"
                  value={
                    <Badge
                      variant={getStatusBadgeVariant(
                        appointment.appointmentStatus
                      )}
                    >
                      {statusLabels[appointment.appointmentStatus] ||
                        appointment.appointmentStatus}
                    </Badge>
                  }
                />
                <InfoRow
                  icon={Briefcase}
                  label="Dermatologist"
                  value={appointment?.dermatologist?.user?.fullName}
                />
                <InfoRow
                  icon={ClipboardList}
                  label="Appointment Type"
                  value={
                    appointment.appointmentType === "NEW_PROBLEM"
                      ? "New concern"
                      : "Follow-up"
                  }
                />
                <InfoRow
                  icon={CalendarClock}
                  label="Schedule"
                  value={format(
                    new Date(appointment.startTime),
                    "HH:mm, MMMM d, yyyy",
                    { locale: enUS }
                  )}
                />
                <InfoRow
                  icon={Coins}
                  label="Price"
                  value={`${Number(appointment.price).toLocaleString(
                    "en-US"
                  )} VND`}
                />
              </div>
            </CardContent>

            {isCancellable && (
              <CardFooter>
                <Button
                  variant="destructive"
                  className="w-full"
                  onClick={() => setDialogOpen("cancel")}
                >
                  <XCircle className="mr-2 h-5 w-5" />
                  Cancel Appointment
                </Button>
              </CardFooter>
            )}
          </Card>
        </div>
      </div>

      {/* --- Cancel Confirmation Dialog --- */}
      <AlertDialog
        open={dialogOpen === "cancel"}
        onOpenChange={(open) => !open && setDialogOpen(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will cancel the appointment. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Close</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleCancel}
              disabled={isCancelling}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isCancelling && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              Confirm Cancel
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* --- Complete Confirmation Dialog --- */}
      <AlertDialog
        open={dialogOpen === "complete"}
        onOpenChange={(open) => !open && setDialogOpen(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Complete Appointment?</AlertDialogTitle>
            <AlertDialogDescription>
              This will mark the appointment as COMPLETED. You can add an
              optional note.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="py-4">
            <Label htmlFor="terminationNote" className="text-left">
              Note (Optional)
            </Label>
            <Textarea
              id="terminationNote"
              placeholder="E.g., Patient completed the session..."
              value={terminationNote}
              onChange={(e) => setTerminationNote(e.target.value)}
              className="mt-2"
            />
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel>Close</AlertDialogCancel>
            <AlertDialogAction onClick={handleComplete} disabled={isCompleting}>
              {isCompleting && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              Confirm Complete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
