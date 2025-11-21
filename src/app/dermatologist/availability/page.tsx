"use client";

import { useState, useEffect, useCallback, useRef, useMemo } from "react";
import { format, getDay, parse, startOfWeek, addDays } from "date-fns";
import { enUS } from "date-fns/locale";
import {
  Calendar as BigCalendar,
  dateFnsLocalizer,
  Views,
  View,
} from "react-big-calendar";
import "react-big-calendar/lib/css/react-big-calendar.css";

import { availabilityService } from "@/services/availabilityService";
import type { AvailabilitySlot, SlotStatus } from "@/types/availability-slot";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { PlusCircle, X, AlertTriangle } from "lucide-react";

import { CreateSlotModal } from "@/components/availability-slots/CreateSlotModal";
import { DeleteSlotDialog } from "@/components/availability-slots/DeleteSlotDialog";
import { useRouter } from "next/navigation";

export interface CalendarEvent {
  title: string;
  start: Date;
  end: Date;
  resource: AvailabilitySlot;
}

export default function AvailabilityPage() {
  const [slots, setSlots] = useState<AvailabilitySlot[]>([]);
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [isLoadingSlots, setIsLoadingSlots] = useState(true);
  const { toast } = useToast();
  const router = useRouter();
  const detailCardRef = useRef<HTMLDivElement | null>(null);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedDates, setSelectedDates] = useState<Date[]>([]);

  const [selectedSlot, setSelectedSlot] = useState<AvailabilitySlot | null>(
    null
  );
  const [slotToDelete, setSlotToDelete] = useState<AvailabilitySlot | null>(
    null
  );

  const [currentView, setCurrentView] = useState<View>(Views.WEEK);

  const [currentDate, setCurrentDate] = useState(new Date());

  const localizer = useMemo(
    () =>
      dateFnsLocalizer({
        format,
        parse,
        startOfWeek: () => startOfWeek(new Date(), { locale: enUS }),
        getDay,
        locales: { "en-US": enUS },
      }),
    []
  );

  const fetchSlots = useCallback(async () => {
    setIsLoadingSlots(true);
    try {
      const data = await availabilityService.getMySlots({
        startDate: addDays(new Date(), -30).toISOString(),
        endDate: addDays(new Date(), 90).toISOString(),
      });
      setSlots(data);
    } catch (error: unknown) {
      const message =
        error instanceof Error ? error.message : "Unable to load availability.";
      toast({
        title: "Error",
        description: message || "Unable to load slots.",
        variant: "error",
      });
    } finally {
      setIsLoadingSlots(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchSlots();
  }, [fetchSlots]);

  useEffect(() => {
    const calendarEvents = slots.map((slot) => ({
      title:
        currentView === Views.MONTH
          ? format(new Date(slot.startTime), "HH:mm") +
            " - " +
            format(new Date(slot.endTime), "HH:mm")
          : "",
      start: new Date(slot.startTime),
      end: new Date(slot.endTime),
      resource: slot,
    }));
    setEvents(calendarEvents);
  }, [slots, currentView]);

  const handleSelectEvent = useCallback((event: CalendarEvent) => {
    const slot = event.resource;
    setSelectedSlot(slot);
    setSlotToDelete(null);

    setTimeout(() => {
      detailCardRef.current?.scrollIntoView({
        behavior: "smooth",
        block: "nearest",
      });
    }, 100);
  }, []);
  // Handle select range to create slots (onSelectSlot by calendar)
  const handleSelectRange = useCallback(
    (slotInfo: { start: Date; end: Date }) => {
      const start = slotInfo.start;
      const end = slotInfo.end;
      if (end.getHours() === 0 && end.getMinutes() === 0 && end > start) {
        end.setDate(end.getDate() - 1);
      }
      const dates: Date[] = [];
      const current = new Date(start);
      const today = new Date(new Date().setHours(0, 0, 0, 0));

      while (current <= end) {
        if (current >= today) {
          dates.push(new Date(current));
        }
        current.setDate(current.getDate() + 1);
      }

      if (dates.length > 0) {
        setSelectedDates(dates);
        setIsModalOpen(true);
      } else if (start >= today) {
        setSelectedDates([new Date(start)]);
        setIsModalOpen(true);
      }
    },
    []
  );

  const onSlotDeleted = () => {
    setSlotToDelete(null);
    setSelectedSlot(null);
    fetchSlots();
  };

  const onSlotsCreated = () => {
    setIsModalOpen(false);
    fetchSlots();
  };

  const eventPropGetter = useCallback(
    (event: CalendarEvent) => {
      const isBooked = event.resource.status === "BOOKED";
      const isPast = event.end < new Date();
      const isSelected = selectedSlot?.slotId === event.resource.slotId;

      // Styles slot in calendar (override default CSS of react-big-calendar)
      const style = {
        backgroundColor: isBooked ? "#fecaca" : "#dcfce7",
        color: isBooked ? "#991b1b" : "#166534",
        border: isBooked ? "2px solid #f87171" : "1px solid #4ade80",
        borderRadius: "4px",
        opacity: isPast ? 0.6 : 1,
      };
      // Style for month view to show border when selected
      const className = cn(
        "p-1 text-xs cursor-pointer",
        isSelected && "outline outline-2 outline-offset-1 outline-blue-500"
      );

      return {
        className: className,
        style: style,
      };
    },
    [selectedSlot]
  );

  const dayPropGetter = useCallback((date: Date) => {
    const isPast = date < new Date(new Date().setHours(0, 0, 0, 0));
    return {
      className: cn(isPast && "bg-gray-300 text-muted-foreground opacity-70"),
    };
  }, []);

  const getStatusColor = (status: SlotStatus) => {
    switch (status) {
      case "AVAILABLE":
        return "text-green-600";
      case "BOOKED":
        return "text-red-600";
      default:
        return "text-gray-500";
    }
  };

  const handleNavigate = useCallback((newDate: Date) => {
    setCurrentDate(newDate);
  }, []);

  return (
    <div className="container mx-auto p-4 md:p-8">
      <div className="mb-6 flex flex-col items-start justify-between gap-4 md:flex-row md:items-center">
        <div>
          <h1 className="text-3xl font-bold">Manage Availability</h1>
          <p className="mt-2 text-muted-foreground">
            Review your calendar, delete existing slots, or drag to create new
            availability.
          </p>
        </div>
        <Button
          onClick={() => {
            setSelectedDates([]);
            setIsModalOpen(true);
          }}
          className="mt-2 md:mt-0"
        >
          <PlusCircle className="mr-2 h-4 w-4" /> Create Availability (Advanced)
        </Button>
      </div>

      <div className="h-[75vh] rounded-lg border bg-white p-4 shadow-sm">
        {isLoadingSlots && (
          <div className="text-center">Loading availability...</div>
        )}

        <BigCalendar
          localizer={localizer}
          events={events}
          startAccessor="start"
          endAccessor="end"
          defaultView={Views.WEEK}
          views={[Views.WEEK, Views.MONTH, Views.DAY]}
          culture="en-US"
          selectable
          onSelectEvent={handleSelectEvent}
          onSelectSlot={handleSelectRange}
          eventPropGetter={eventPropGetter}
          dayPropGetter={dayPropGetter}
          view={currentView}
          onView={setCurrentView}
          date={currentDate}
          onNavigate={handleNavigate}
          messages={{
            next: "Next",
            previous: "Previous",
            today: "Today",
            month: "Month",
            week: "Week",
            day: "Day",
            agenda: "Agenda",
            date: "Date",
            time: "Time",
            event: "Slot",
            noEventsInRange: "No availability in this range.",
          }}
        />
      </div>

      {selectedSlot && (
        <Card
          ref={detailCardRef}
          className="relative mt-6 border-2 border-yellow-400 shadow-md"
        >
          <Button
            variant="ghost"
            size="sm"
            className="absolute right-3 top-3 text-muted-foreground"
            onClick={() => setSelectedSlot(null)}
          >
            <X className="h-4 w-4" />
          </Button>
          <CardHeader>
            <CardTitle>Slot Details</CardTitle>
            <CardDescription>
              {format(new Date(selectedSlot.startTime), "HH:mm, dd/MM/yyyy")}
            </CardDescription>
          </CardHeader>
          <CardContent className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div>
              <span className="text-sm font-medium text-muted-foreground">
                Time
              </span>
              <p className="font-semibold">
                {format(new Date(selectedSlot.startTime), "HH:mm")} -{" "}
                {format(new Date(selectedSlot.endTime), "HH:mm")}
              </p>
            </div>
            <div>
              <span className="text-sm font-medium text-muted-foreground">
                Price
              </span>
              <p className="font-semibold">
                {selectedSlot.price?.toLocaleString("en-US") || "Default"} VND
              </p>
            </div>
            <div>
              <span className="text-sm font-medium text-muted-foreground">
                Status
              </span>
              <p
                className={cn(
                  "font-semibold",
                  getStatusColor(selectedSlot.status)
                )}
              >
                {selectedSlot.status === "AVAILABLE" ? "Available" : "Booked"}
              </p>
            </div>
          </CardContent>
          <CardFooter className="flex justify-end">
            {selectedSlot.status === "AVAILABLE" ? (
              <Button
                variant="destructive"
                onClick={() => setSlotToDelete(selectedSlot)}
              >
                Delete Slot
              </Button>
            ) : (
              <>
                <p className="mr-2 flex items-center rounded-md border border-red-300 bg-red-50 px-3 py-2 text-sm text-muted-foreground">
                  <AlertTriangle className="mr-2 h-4 w-4 text-red-500" />
                  Cannot delete a booked slot.
                </p>
                <Button
                  variant="default"
                  onClick={() =>
                    router.push(
                      `/dermatologist/appointment/${selectedSlot.appointmentId}`
                    )
                  }
                  disabled={!selectedSlot.appointmentId}
                >
                  View Appointment Details
                </Button>
              </>
            )}
          </CardFooter>
        </Card>
      )}

      <CreateSlotModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        selectedDates={selectedDates}
        onSlotsCreated={onSlotsCreated}
      />

      <DeleteSlotDialog
        slot={slotToDelete}
        onClose={() => setSlotToDelete(null)}
        onSlotDeleted={onSlotDeleted}
      />
    </div>
  );
}
