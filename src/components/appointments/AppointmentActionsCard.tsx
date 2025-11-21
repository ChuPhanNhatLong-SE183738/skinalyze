"use client";

import type { ComponentType, ReactNode } from "react";
import type { Appointment } from "@/types/appointment";
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
  Video,
  Briefcase,
  CalendarClock,
  Coins,
  ClipboardList,
  CheckCircle2,
  Check,
  XCircle,
} from "lucide-react";
import { Badge, BadgeProps } from "@/components/ui/badge";

const statusLabels: Record<AppointmentStatus, string> = {
  [AppointmentStatus.SCHEDULED]: "Scheduled",
  [AppointmentStatus.IN_PROGRESS]: "In Progress",
  [AppointmentStatus.COMPLETED]: "Completed",
  [AppointmentStatus.CANCELLED]: "Cancelled",
  [AppointmentStatus.NO_SHOW]: "No-show",
  [AppointmentStatus.INTERRUPTED]: "Interrupted",
  [AppointmentStatus.PENDING_PAYMENT]: "Pending Payment",
};

// --- SỬA: Cập nhật logic màu sắc ---
const getStatusBadgeVariant = (
  status: AppointmentStatus
): BadgeProps["variant"] => {
  switch (status) {
    case AppointmentStatus.SCHEDULED:
      return "warning";
    case AppointmentStatus.IN_PROGRESS:
      return "info";
    case AppointmentStatus.COMPLETED:
      return "success";
    case AppointmentStatus.CANCELLED:
      return "destructive";
    case AppointmentStatus.NO_SHOW:
    case AppointmentStatus.INTERRUPTED:
      return "signal";
    case AppointmentStatus.PENDING_PAYMENT:
      return "secondary";
    default:
      return "outline";
  }
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
      <span className="text-sm font-medium text-muted-foreground">{label}</span>
      <p className="font-semibold">{value ?? "Not provided"}</p>
    </div>
  </div>
);

interface AppointmentActionsCardProps {
  appointment: Appointment;
  isJoining: boolean;
  isCompletable: boolean;
  isCancellable: boolean;
  canJoinMeet: boolean;
  routineButton: ReactNode;
  onJoinMeet: () => void;
  onCompleteClick: () => void;
  onCancelClick: () => void;
}

export function AppointmentActionsCard({
  appointment,
  isJoining,
  isCompletable,
  isCancellable,
  canJoinMeet,
  routineButton,
  onJoinMeet,
  onCompleteClick,
  onCancelClick,
}: AppointmentActionsCardProps) {
  return (
    <Card className="shadow-lg">
      <CardHeader>
        <CardTitle className="text-xl">Appointment Details</CardTitle>
        <CardDescription>ID: {appointment.appointmentId}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Join Meeting */}
        {canJoinMeet && (
          <Button
            size="lg"
            className="w-full bg-green-600 hover:bg-green-700"
            onClick={onJoinMeet}
            disabled={isJoining}
          >
            {isJoining ? (
              <Loader2 className="mr-2 h-5 w-5 animate-spin" />
            ) : (
              <Video className="mr-2 h-5 w-5" />
            )}
            {appointment.dermatologistJoinedAt
              ? "Re-join Meeting"
              : "Join Meeting & Check-in"}
          </Button>
        )}

        {routineButton}

        {/* Complete Button */}
        {isCompletable && (
          <Button
            size="lg"
            className="w-full"
            variant="default"
            onClick={onCompleteClick}
          >
            <Check className="mr-2 h-5 w-5" />
            Mark as Completed
          </Button>
        )}

        {/* Appointment Information */}
        <div className="space-y-4 pt-4 border-t">
          <InfoRow
            icon={CheckCircle2}
            label="Status"
            value={
              <Badge
                // Nếu Badge của bạn chưa có variant 'success',
                // bạn có thể thêm className="bg-green-500 hover:bg-green-600" vào đây
                variant={getStatusBadgeVariant(appointment.appointmentStatus)}
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
            value={`${Number(appointment.price).toLocaleString("en-US")} VND`}
          />
        </div>
      </CardContent>

      {/* Cancel Button */}
      {isCancellable && (
        <CardFooter>
          <Button
            variant="destructive"
            className="w-full"
            onClick={onCancelClick}
          >
            <XCircle className="mr-2 h-5 w-5" />
            Cancel Appointment
          </Button>
        </CardFooter>
      )}
    </Card>
  );
}
