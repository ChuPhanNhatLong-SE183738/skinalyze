"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { format, getDay, parse, startOfWeek, addDays } from "date-fns";
import { vi } from "date-fns/locale";
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

  const detailCardRef = useRef<HTMLDivElement | null>(null);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedDates, setSelectedDates] = useState<Date[]>([]);

  const [selectedSlot, setSelectedSlot] = useState<AvailabilitySlot | null>(
    null
  );
  const [slotToDelete, setSlotToDelete] = useState<AvailabilitySlot | null>(
    null
  );

  // State for current calendar view(week, month, day)
  const [currentView, setCurrentView] = useState<View>(Views.WEEK);

  const fetchSlots = useCallback(async () => {
    setIsLoadingSlots(true);
    try {
      const data = await availabilityService.getMySlots({
        startDate: addDays(new Date(), -30).toISOString(),
        endDate: addDays(new Date(), 90).toISOString(),
      });
      setSlots(data);
    } catch (error: any) {
      toast({
        title: "Lỗi",
        description: error.message || "Không thể tải danh sách slot.",
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

  // Scroll to detail card slot
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
        backgroundColor: isBooked ? "#fecaca" : "#dcfce7", // red-200 : green-200
        color: isBooked ? "#991b1b" : "#166534", // red-800 : green-800
        border: isBooked ? "2px solid #f87171" : "1px solid #4ade80", // red-400 : green-400
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

  // Adjust parent day cell style (for past days)
  const dayPropGetter = useCallback((date: Date) => {
    const isPast = date < new Date(new Date().setHours(0, 0, 0, 0));
    return {
      className: cn(isPast && "bg-gray-300 text-muted-foreground opacity-70"),
    };
  }, []);

  // Set up slot localizer
  const localizer = dateFnsLocalizer({
    format,
    parse,
    startOfWeek: () => startOfWeek(new Date(), { locale: vi }),
    getDay,
    locales: { vi },
  });

  // Color for slot status in detail card
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

  return (
    <div className="container mx-auto p-4 md:p-8">
      {/* 1. Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold">Quản Lý Lịch Rảnh</h1>
          <p className="text-muted-foreground mt-2">
            Xem lịch, xóa slot hoặc kéo chuột trên lịch để tạo lịch rảnh mới.
          </p>
        </div>
        <Button
          onClick={() => {
            setSelectedDates([]);
            setIsModalOpen(true);
          }}
          className="mt-4 md:mt-0"
        >
          <PlusCircle className="mr-2 h-4 w-4" /> Tạo Lịch (Nâng Cao)
        </Button>
      </div>

      {/* 2. Calendar */}
      <div className="h-[75vh] bg-white p-4 rounded-lg shadow-sm border">
        {isLoadingSlots && <div className="text-center">Đang tải lịch...</div>}
        <BigCalendar
          localizer={localizer}
          events={events}
          startAccessor="start"
          endAccessor="end"
          defaultView={Views.WEEK}
          views={[Views.WEEK, Views.MONTH, Views.DAY]}
          culture="vi"
          selectable
          onSelectEvent={handleSelectEvent}
          onSelectSlot={handleSelectRange}
          eventPropGetter={eventPropGetter}
          dayPropGetter={dayPropGetter}
          view={currentView}
          onView={setCurrentView}
          messages={{
            next: "Sau",
            previous: "Trước",
            today: "Hôm nay",
            month: "Tháng",
            week: "Tuần",
            day: "Ngày",
            agenda: "Lịch trình",
            noEventsInRange: "Không có lịch rảnh trong khung giờ này.",
          }}
        />
      </div>

      {/* 3. Slot Detail Card */}
      {selectedSlot && (
        <Card
          ref={detailCardRef}
          className="mt-6 shadow-md relative  border-yellow-400 border-2"
        >
          <Button
            variant="ghost"
            size="sm"
            className="absolute top-3 right-3 text-muted-foreground"
            onClick={() => setSelectedSlot(null)}
          >
            <X className="h-4 w-4" />
          </Button>
          <CardHeader>
            <CardTitle>Chi Tiết Slot</CardTitle>
            <CardDescription>
              {format(new Date(selectedSlot.startTime), "HH:mm, dd/MM/yyyy")}
            </CardDescription>
          </CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <span className="text-sm font-medium text-muted-foreground">
                Thời gian:
              </span>
              <p className="font-semibold">
                {format(new Date(selectedSlot.startTime), "HH:mm")} -{" "}
                {format(new Date(selectedSlot.endTime), "HH:mm")}
              </p>
            </div>
            <div>
              <span className="text-sm font-medium text-muted-foreground">
                Giá:
              </span>
              <p className="font-semibold">
                {selectedSlot.price?.toLocaleString("vi-VN") || "Mặc định"} VND
              </p>
            </div>
            <div>
              <span className="text-sm font-medium text-muted-foreground">
                Trạng thái:
              </span>
              <p
                className={cn(
                  "font-semibold",
                  getStatusColor(selectedSlot.status)
                )}
              >
                {selectedSlot.status === "AVAILABLE"
                  ? "Còn Trống"
                  : "Đã Được Đặt"}
              </p>
            </div>

            <div>
              <span className="text-sm font-medium text-muted-foreground">
                Mã cuộc hẹn:
              </span>
              <p className="font-semibold">
                {selectedSlot.appointmentId || "Chưa có"}
              </p>
            </div>
          </CardContent>
          <CardFooter className="flex justify-end">
            {selectedSlot.status === "AVAILABLE" ? (
              <Button
                variant="destructive"
                onClick={() => setSlotToDelete(selectedSlot)}
              >
                Xóa Slot Này
              </Button>
            ) : (
              <p className="text-sm text-muted-foreground flex items-center border border-red-300 bg-red-50 rounded-md px-3 py-2  ">
                <AlertTriangle className="h-4 w-4 mr-2 text-red-500 " />
                Không thể xóa slot đã được đặt.
              </p>
            )}
          </CardFooter>
        </Card>
      )}

      {/* 4. Modal create slot */}
      <CreateSlotModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        selectedDates={selectedDates}
        onSlotsCreated={onSlotsCreated}
      />

      {/* 5. Delete slot Dialog */}
      <DeleteSlotDialog
        slot={slotToDelete}
        onClose={() => setSlotToDelete(null)}
        onSlotDeleted={onSlotDeleted}
      />
    </div>
  );
}
