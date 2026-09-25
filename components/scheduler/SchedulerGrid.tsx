"use client";

import React, { useState, useEffect, useRef, useMemo } from "react";
import { History } from "lucide-react";
import { MeetingRoom, MeetingBooking, TimeSlot, DragSelection } from "./types";
import { SchedulerTimeColumn } from "./SchedulerTimeColumn";
import { SchedulerRoomHeader } from "./SchedulerRoomHeader";
import { SchedulerTimeCell } from "./SchedulerTimeCell";
import { SchedulerBooking } from "./SchedulerBooking";

export interface SchedulerGridProps {
  currentDate: Date;
  rooms: MeetingRoom[];
  bookings: MeetingBooking[];
  currentUserId?: string | null;
  startHour?: number;
  endHour?: number;
  slotIntervalMinutes?: number;
  readOnly?: boolean;
  onSelectBooking: (booking: MeetingBooking) => void;
  onSelectTimeRange: (selection: {
    roomId: string;
    startTime: Date;
    endTime: Date;
  }) => void;
  className?: string;
}

export const SchedulerGrid: React.FC<SchedulerGridProps> = ({
  currentDate,
  rooms,
  bookings,
  currentUserId,
  startHour = 8,
  endHour = 18,
  slotIntervalMinutes = 30,
  readOnly = false,
  onSelectBooking,
  onSelectTimeRange,
  className = "",
}) => {
  const containerRef = useRef<HTMLDivElement>(null);

  // Responsive state: check if screen is mobile (< 768px)
  const [isMobile, setIsMobile] = useState(false);
  const [activeMobileRoomId, setActiveMobileRoomId] = useState<string>(
    rooms[0]?.id || ""
  );

  useEffect(() => {
    const checkMobile = () => {
      const mobile = window.innerWidth < 768;
      setIsMobile(mobile);
    };

    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  // Sync active mobile room if rooms list changes
  useEffect(() => {
    if (rooms.length > 0 && (!activeMobileRoomId || !rooms.some((r) => r.id === activeMobileRoomId))) {
      setActiveMobileRoomId(rooms[0].id);
    }
  }, [rooms, activeMobileRoomId]);

  // Generate Time Slots based on startHour and endHour
  const timeSlots: TimeSlot[] = useMemo(() => {
    const slots: TimeSlot[] = [];
    const totalMinutesStart = startHour * 60;
    const totalMinutesEnd = endHour * 60;

    for (let m = totalMinutesStart; m < totalMinutesEnd; m += slotIntervalMinutes) {
      const hour = Math.floor(m / 60);
      const minute = m % 60;
      const label = `${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}`;
      slots.push({ hour, minute, label, totalMinutes: m });
    }
    return slots;
  }, [startHour, endHour, slotIntervalMinutes]);

  const SLOT_HEIGHT = 44; // height of each 30-min slot in pixels
  const COLUMN_WIDTH = 220; // width of each room column in desktop view

  // Drag to select state
  const [dragState, setDragState] = useState<DragSelection>({
    roomId: "",
    startMinutes: 0,
    endMinutes: 0,
    isDragging: false,
  });

  const isToday = useMemo(() => {
    const today = new Date();
    return (
      currentDate.getFullYear() === today.getFullYear() &&
      currentDate.getMonth() === today.getMonth() &&
      currentDate.getDate() === today.getDate()
    );
  }, [currentDate]);

  // Check if viewing a past date
  const isPastDate = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const target = new Date(currentDate);
    target.setHours(0, 0, 0, 0);
    return target < today;
  }, [currentDate]);

  // Mouse up handler to complete drag selection
  useEffect(() => {
    const handleMouseUp = () => {
      if (dragState.isDragging && !readOnly && !isPastDate) {
        const minM = Math.min(dragState.startMinutes, dragState.endMinutes);
        const maxM = Math.max(dragState.startMinutes, dragState.endMinutes);

        // Ensure minimum duration of slotIntervalMinutes
        const finalEndMinutes = maxM === minM ? minM + slotIntervalMinutes : maxM;

        const startYear = currentDate.getFullYear();
        const startMonth = currentDate.getMonth();
        const startDay = currentDate.getDate();

        const startTime = new Date(startYear, startMonth, startDay, Math.floor(minM / 60), minM % 60, 0);
        const endTime = new Date(startYear, startMonth, startDay, Math.floor(finalEndMinutes / 60), finalEndMinutes % 60, 0);

        onSelectTimeRange({
          roomId: dragState.roomId,
          startTime,
          endTime,
        });

        setDragState({
          roomId: "",
          startMinutes: 0,
          endMinutes: 0,
          isDragging: false,
        });
      }
    };

    if (dragState.isDragging) {
      window.addEventListener("mouseup", handleMouseUp);
    }
    return () => {
      window.removeEventListener("mouseup", handleMouseUp);
    };
  }, [dragState, currentDate, readOnly, isPastDate, slotIntervalMinutes, onSelectTimeRange]);

  const handleCellMouseDown = (roomId: string, slot: TimeSlot) => {
    if (readOnly || isPastDate) return;
    setDragState({
      roomId,
      startMinutes: slot.totalMinutes,
      endMinutes: slot.totalMinutes + slotIntervalMinutes,
      isDragging: true,
    });
  };

  const handleCellMouseEnter = (roomId: string, slot: TimeSlot) => {
    if (!dragState.isDragging || dragState.roomId !== roomId || readOnly || isPastDate) return;
    setDragState((prev) => ({
      ...prev,
      endMinutes:
        slot.totalMinutes >= prev.startMinutes
          ? slot.totalMinutes + slotIntervalMinutes
          : slot.totalMinutes,
    }));
  };

  const handleCellClick = (roomId: string, slot: TimeSlot) => {
    if (readOnly || isPastDate) return;
    const startYear = currentDate.getFullYear();
    const startMonth = currentDate.getMonth();
    const startDay = currentDate.getDate();

    const startTime = new Date(startYear, startMonth, startDay, slot.hour, slot.minute, 0);
    // default 1 hour meeting
    const endTime = new Date(startYear, startMonth, startDay, slot.hour + 1, slot.minute, 0);

    onSelectTimeRange({
      roomId,
      startTime,
      endTime,
    });
  };

  // Rooms to display: either 1 room (on mobile) or all (on desktop)
  const displayRooms = isMobile
    ? rooms.filter((r) => r.id === activeMobileRoomId)
    : rooms;

  // Filter bookings that match the current date
  const dateBookings = useMemo(() => {
    return bookings.filter((b) => {
      const bDate = new Date(b.startTime);
      return (
        bDate.getFullYear() === currentDate.getFullYear() &&
        bDate.getMonth() === currentDate.getMonth() &&
        bDate.getDate() === currentDate.getDate()
      );
    });
  }, [bookings, currentDate]);

  return (
    <div
      ref={containerRef}
      className={`bg-surface border border-border rounded-xl shadow-xs overflow-hidden flex flex-col ${className}`}
    >
      {/* Past Date Notice */}
      {isPastDate && (
        <div className="bg-surface-sunken/80 border-b border-border/80 px-4 py-2 flex items-center gap-2 text-xs text-text-secondary select-none">
          <History className="w-4 h-4 text-text-muted shrink-0" />
          <span>คุณกำลังดูประวัติการจองย้อนหลัง (ไม่สามารถเพิ่มการจองในวันที่ผ่านมาแล้วได้)</span>
        </div>
      )}

      {/* Scrollable Grid Container */}
      <div className="overflow-x-auto overflow-y-auto max-h-180 relative scroll-smooth">
        <div className="flex min-w-full w-max">
          {/* Sticky Left: Time Column */}
          <SchedulerTimeColumn
            timeSlots={timeSlots}
            slotHeight={SLOT_HEIGHT}
            startHour={startHour}
            endHour={endHour}
            isToday={isToday}
            className="sticky left-0 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.05)]"
          />

          {/* Right Main Columns: Rooms & Bookings */}
          <div className="flex-1 flex flex-col">
            {/* Sticky Top: Room Headers */}
            <SchedulerRoomHeader
              rooms={rooms}
              isMobile={isMobile}
              activeMobileRoomId={activeMobileRoomId}
              onMobileRoomChange={(id) => setActiveMobileRoomId(id)}
              columnWidth={isMobile ? 320 : COLUMN_WIDTH}
            />

            {/* Room Columns Grid */}
            <div className="flex">
              {displayRooms.map((room) => {
                const roomBookings = dateBookings.filter((b) => b.roomId === room.id);

                // Is dragging currently happening in this room?
                const isDraggingInThisRoom =
                  dragState.isDragging && dragState.roomId === room.id;

                const dragMinM = Math.min(dragState.startMinutes, dragState.endMinutes);
                const dragMaxM = Math.max(dragState.startMinutes, dragState.endMinutes);
                const dragTop = ((dragMinM - startHour * 60) / slotIntervalMinutes) * SLOT_HEIGHT;
                const dragHeight =
                  Math.max(1, (dragMaxM - dragMinM) / slotIntervalMinutes) * SLOT_HEIGHT;

                const dragStartTimeLabel = `${String(Math.floor(dragMinM / 60)).padStart(2, "0")}:${String(dragMinM % 60).padStart(2, "0")}`;
                const dragEndTimeLabel = `${String(Math.floor(dragMaxM / 60)).padStart(2, "0")}:${String(dragMaxM % 60).padStart(2, "0")}`;

                return (
                  <div
                    key={room.id}
                    style={{
                      width: isMobile ? "100%" : `${COLUMN_WIDTH}px`,
                      minWidth: isMobile ? "300px" : `${COLUMN_WIDTH}px`,
                    }}
                    className="relative border-r border-border bg-surface shrink-0 select-none"
                  >
                    {/* Time Slot Cells */}
                    {timeSlots.map((slot) => {
                      const isFullHour = slot.minute === 0;
                      const isSlotInDragRange =
                        isDraggingInThisRoom &&
                        slot.totalMinutes >= dragMinM &&
                        slot.totalMinutes < dragMaxM;

                      return (
                        <SchedulerTimeCell
                          key={slot.totalMinutes}
                          roomId={room.id}
                          slot={slot}
                          slotHeight={SLOT_HEIGHT}
                          isFullHour={isFullHour}
                          isSelected={isSlotInDragRange}
                          readOnly={readOnly || isPastDate}
                          onMouseDown={handleCellMouseDown}
                          onMouseEnter={handleCellMouseEnter}
                          onClick={handleCellClick}
                        />
                      );
                    })}

                    {/* Drag Selection Overlay with Time Badge */}
                    {isDraggingInThisRoom && (
                      <div
                        style={{
                          top: `${dragTop}px`,
                          height: `${dragHeight}px`,
                        }}
                        className="absolute inset-x-1 z-20 pointer-events-none rounded-lg border-2 border-primary-500 border-dashed bg-primary-100/50 flex items-center justify-center animate-fade-in shadow-xs"
                      >
                        <div className="bg-primary-600 text-white font-bold text-2xs sm:text-xs px-2 py-0.5 rounded shadow">
                          {dragStartTimeLabel} - {dragEndTimeLabel}
                        </div>
                      </div>
                    )}

                    {/* Bookings placed on the column */}
                    {roomBookings.map((booking) => (
                      <SchedulerBooking
                        key={booking.id}
                        booking={booking}
                        slotHeight={SLOT_HEIGHT}
                        startHour={startHour}
                        currentUserId={currentUserId}
                        onSelect={onSelectBooking}
                      />
                    ))}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SchedulerGrid;
