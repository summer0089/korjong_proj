"use client";

import React, { useEffect, useState } from "react";
import { Clock } from "lucide-react";
import { TimeSlot } from "./types";

export interface SchedulerTimeColumnProps {
  timeSlots: TimeSlot[];
  slotHeight: number;
  startHour: number;
  endHour: number;
  isToday: boolean;
  className?: string;
}

export const SchedulerTimeColumn: React.FC<SchedulerTimeColumnProps> = ({
  timeSlots,
  slotHeight,
  startHour,
  endHour,
  isToday,
  className = "",
}) => {
  // Current time marker calculation
  const [currentMinutes, setCurrentMinutes] = useState<number | null>(null);

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setCurrentMinutes(now.getHours() * 60 + now.getMinutes());
    };

    updateTime();
    const interval = setInterval(updateTime, 60000);
    return () => clearInterval(interval);
  }, []);

  const startMinutes = startHour * 60;
  const endMinutes = endHour * 60;

  const showCurrentTimeLine =
    isToday &&
    currentMinutes !== null &&
    currentMinutes >= startMinutes &&
    currentMinutes <= endMinutes;

  const currentTop =
    showCurrentTimeLine && currentMinutes !== null
      ? ((currentMinutes - startMinutes) / 30) * slotHeight
      : null;

  return (
    <div
      className={`relative select-none border-r border-border bg-surface shrink-0 z-20 ${className}`}
    >
      {/* Header spacer to align with RoomHeader */}
      <div className="h-14 sm:h-16 border-b border-border flex items-center justify-center bg-surface-raised px-2">
        <Clock className="w-4 h-4 text-text-muted" />
      </div>

      {/* Time slots column */}
      <div className="relative">
        {timeSlots.map((slot) => {
          const isFullHour = slot.minute === 0;

          return (
            <div
              key={slot.totalMinutes}
              style={{ height: `${slotHeight}px` }}
              className={`relative flex items-start justify-end pr-2 text-right border-b border-border/40 ${isFullHour ? "border-b-border/80" : ""
                }`}
            >
              {isFullHour ? (
                <span className="-mt-2.5 text-[11px] sm:text-xs font-semibold text-text-secondary bg-surface px-1 rounded">
                  {slot.label}
                </span>
              ) : (
                <span className="-mt-2 text-2xs text-text-muted hidden sm:inline-block">
                  {slot.minute}
                </span>
              )}
            </div>
          );
        })}

        {/* Current Time Indicator on the time column */}
        {showCurrentTimeLine && currentTop !== null && (
          <div
            style={{ top: `${currentTop}px` }}
            className="absolute right-0 z-30 flex items-center -translate-y-1/2 pointer-events-none"
          >
            <div className="px-1 py-0.5 rounded bg-unavailable-500 text-[9px] font-bold text-white shadow-xs">
              {new Date().toLocaleTimeString("th-TH", {
                hour: "2-digit",
                minute: "2-digit",
              })}
            </div>
            <div className="w-2 h-2 rounded-full bg-unavailable-500 ring-2 ring-white" />
          </div>
        )}
      </div>
    </div>
  );
};

export default SchedulerTimeColumn;
