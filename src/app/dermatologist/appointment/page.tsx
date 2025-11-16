"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Loader2, CalendarSearch } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { enUS } from "date-fns/locale";

import { appointmentService } from "@/services/appointmentService";
import type { Appointment, FindAppointmentsDto } from "@/types/appointment";
import { AppointmentStatus } from "@/types/appointment";
import { useDermatologist } from "@/contexts/DermatologistContext";

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

const statusLabels: Record<AppointmentStatus, string> = {
  [AppointmentStatus.SCHEDULED]: "Scheduled",
  [AppointmentStatus.IN_PROGRESS]: "In Progress",
  [AppointmentStatus.COMPLETED]: "Completed",
  [AppointmentStatus.CANCELLED]: "Cancelled",
  [AppointmentStatus.NO_SHOW]: "No-show",
  [AppointmentStatus.INTERRUPTED]: "Interrupted",
  [AppointmentStatus.PENDING_PAYMENT]: "Pending Payment",
};

export default function MyAppointmentsPage() {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();
  const router = useRouter();

  const { dermatologistId, isLoading: isDermLoading } = useDermatologist();

  const [statusFilter, setStatusFilter] = useState<AppointmentStatus | "ALL">(
    "ALL"
  );

  const fetchAppointments = useCallback(
    async (filters: FindAppointmentsDto) => {
      setIsLoading(true);
      try {
        const data = await appointmentService.getAppointments(filters);
        data.sort(
          (a, b) =>
            new Date(b.startTime).getTime() - new Date(a.startTime).getTime()
        );
        setAppointments(data);
      } catch (error: unknown) {
        const message =
          error instanceof Error
            ? error.message
            : "Unable to load appointments.";
        toast({
          title: "Error",
          description: message,
          variant: "error",
        });
      } finally {
        setIsLoading(false);
      }
    },
    [toast]
  );

  useEffect(() => {
    if (isDermLoading) {
      setIsLoading(true);
      return;
    }

    if (dermatologistId) {
      const filters: FindAppointmentsDto = {
        dermatologistId: dermatologistId,
        status: statusFilter === "ALL" ? undefined : statusFilter,
      };
      fetchAppointments(filters);
    } else {
      toast({
        title: "Error",
        description: "Unable to determine dermatologist profile.",
        variant: "error",
      });
      setIsLoading(false);
    }
  }, [isDermLoading, dermatologistId, statusFilter, fetchAppointments, toast]);

  const handleRowClick = (appointmentId: string) => {
    router.push(`/dermatologist/appointment/${appointmentId}`);
  };

  return (
    <div className="container mx-auto p-4 md:p-8">
      <div className="mb-6 flex flex-col items-start justify-between gap-4 md:flex-row md:items-center">
        <div>
          <h1 className="text-3xl font-bold">My Appointments</h1>
          <p className="mt-2 text-muted-foreground">
            Review and manage every appointment in one place.
          </p>
        </div>
        <div className="mt-2 flex items-center gap-2 md:mt-0">
          <CalendarSearch className="h-5 w-5 text-muted-foreground" />
          <Select
            value={statusFilter}
            onValueChange={(value: AppointmentStatus | "ALL") =>
              setStatusFilter(value)
            }
          >
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">All statuses</SelectItem>
              <SelectItem value={AppointmentStatus.SCHEDULED}>
                Scheduled
              </SelectItem>
              <SelectItem value={AppointmentStatus.IN_PROGRESS}>
                In Progress
              </SelectItem>
              <SelectItem value={AppointmentStatus.COMPLETED}>
                Completed
              </SelectItem>
              <SelectItem value={AppointmentStatus.CANCELLED}>
                Cancelled
              </SelectItem>
              <SelectItem value={AppointmentStatus.NO_SHOW}>No-show</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="rounded-lg border bg-white p-4 shadow-sm">
        {isLoading || isDermLoading ? (
          <div className="p-8 text-center">
            <Loader2 className="h-8 w-8 animate-spin mx-auto text-blue-600" />
            <p className="mt-2 text-muted-foreground">
              Loading appointments...
            </p>
          </div>
        ) : appointments.length === 0 ? (
          <div className="p-8 text-center text-muted-foreground">
            No appointments found.
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Customer</TableHead>
                <TableHead>Schedule</TableHead>
                <TableHead>Appointment Type</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {appointments.map((appt) => (
                <TableRow
                  key={appt.appointmentId}
                  onClick={() => handleRowClick(appt.appointmentId)}
                  className="cursor-pointer hover:bg-gray-50"
                >
                  <TableCell className="font-medium">
                    {appt.customer.user.fullName}
                  </TableCell>
                  <TableCell>
                    {format(new Date(appt.startTime), "HH:mm, MMMM d, yyyy", {
                      locale: enUS,
                    })}
                  </TableCell>
                  <TableCell>
                    {appt.appointmentType === "NEW_PROBLEM"
                      ? "New Problem"
                      : "Follow-up"}
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant={getStatusBadgeVariant(appt.appointmentStatus)}
                    >
                      {statusLabels[appt.appointmentStatus] ||
                        appt.appointmentStatus}
                    </Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </div>
    </div>
  );
}
