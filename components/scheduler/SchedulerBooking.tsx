"use client";

import React from "react";
import { User, Users, Clock, CheckCircle2, Clock3, XCircle, AlertCircle, Sparkles } from "lucide-react";
import { MeetingBooking, MeetingStatus } from "./types";

export interface SchedulerBookingProps {
  booking: MeetingBooking;
  slotHeight: number;
  startHour: number;
  columnWidth?: number;
  currentUserId?: string | null;
  onSelect: (booking: MeetingBooking) => void;
  className?: string;
}

export const SchedulerBooking: React.FC<SchedulerBookingProps> = ({
  booking,
  slotHeight,
  startHour,
  currentUserId,
  onSelect,
  className = "",
}) => {
  const startDate = new Date(booking.startTime);
  const endDate = new Date(booking.endTime);

  const startMinutes = startDate.getHours() * 60 + startDate.getMinutes();
  const endMinutes = endDate.getHours() * 60 + endDate.getMinutes();
  const durationMinutes = Math.max(30, endMinutes - startMinutes);

  const gridStartMinutes = startHour * 60;
  const top = ((startMinutes - gridStartMinutes) / 30) * slotHeight;
  const height = (durationMinutes / 30) * slotHeight - 3; // 3px gap for visual separation

  const isMyBooking = Boolean(
    currentUserId && booking.employeeId && booking.employeeId === currentUserId
  );

  // Status visual variants
  const getStatusStyles = (status: MeetingStatus) => {
    switch (status) {
      case "APPROVED":
        return {
          wrapper:
            "bg-available-50/95 border-available-300 border-l-available-600 text-available-900 hover:bg-available-100 hover:border-available-400",
          pill: "bg-available-100 text-available-800 border border-available-200",
          label: "อนุมัติ",
          icon: <CheckCircle2 className="w-3 h-3 text-available-600 shrink-0" />,
        };
      case "PENDING":
        return {
          wrapper:
            "bg-pending-50/95 border-pending-300 border-l-pending-600 text-pending-900 hover:bg-pending-100 hover:border-pending-400",
          pill: "bg-pending-100 text-pending-800 border border-pending-200",
          label: "รออนุมัติ",
          icon: <Clock3 className="w-3 h-3 text-pending-600 shrink-0" />,
        };
      case "REJECTED":
        return {
          wrapper:
            "bg-unavailable-50/95 border-unavailable-300 border-l-unavailable-600 text-unavailable-900 hover:bg-unavailable-100 hover:border-unavailable-400",
          pill: "bg-unavailable-100 text-unavailable-800 border border-unavailable-200",
          label: "ไม่อนุมัติ",
          icon: <AlertCircle className="w-3 h-3 text-unavailable-600 shrink-0" />,
        };
      case "CANCELED":
      default:
        return {
          wrapper:
            "bg-secondary-100/90 border-secondary-300 border-l-secondary-400 text-secondary-600 line-through opacity-75 hover:bg-secondary-200",
          pill: "bg-secondary-200 text-secondary-700 border border-secondary-300",
          label: "ยกเลิก",
          icon: <XCircle className="w-3 h-3 text-secondary-500 shrink-0" />,
        };
    }
  };

  const statusStyle = getStatusStyles(booking.status);

  // Format time strings (HH:mm)
  const formatTime = (d: Date) =>
    d.toLocaleTimeString("th-TH", { hour: "2-digit", minute: "2-digit" });

  const timeRange = `${formatTime(startDate)} - ${formatTime(endDate)}`;

  // Booker name
  const bookerName = booking.employee
    ? `${booking.employee.firstname} ${booking.employee.lastname}`
    : "ผู้ใช้งาน";

  const isShortCard = height < 55; // 30 minutes slot

  return (
    <div
      onClick={(e) => {
        e.stopPropagation();
        onSelect(booking);
      }}
      style={{
        top: `${top}px`,
        height: `${Math.max(28, height)}px`,
      }}
      className={`absolute inset-x-1 z-10 p-1.5 sm:p-2 rounded-lg border-l-4 border-t border-r border-b text-xs cursor-pointer shadow-xs transition-all duration-150 hover:shadow-md hover:z-20 overflow-hidden select-none flex flex-col justify-between ${statusStyle.wrapper
        } ${isMyBooking
          ? "ring-2 ring-primary-500/70 shadow-sm"
          : ""
        } ${className}`}
      title={`${booking.topic} (${timeRange}) - คลิกดูรายละเอียด`}
    >
      {/* Header: Topic & Badges */}
      <div>
        <div className="flex items-start justify-between gap-1 leading-tight">
          <span className="font-bold truncate text-[11px] sm:text-xs">
            {booking.topic}
          </span>

          <div className="flex items-center gap-1 shrink-0">
            {/* My Booking Icon Badge */}
            {isMyBooking && (
              <span
                className="inline-flex items-center gap-0.5 px-1 py-0.2 rounded bg-primary-600 text-white text-[9px] font-bold shadow-2xs"
                title="การจองของฉัน (My Booking)"
              >
                <Sparkles className="w-2.5 h-2.5" />
                <span className="hidden sm:inline">ของฉัน</span>
              </span>
            )}

            {/* Status indicator */}
            {!isShortCard && (
              <span
                className={`hidden sm:inline-flex items-center gap-0.5 px-1 py-0.2 rounded text-[9px] font-semibold ${statusStyle.pill}`}
              >
                {statusStyle.icon}
                <span>{statusStyle.label}</span>
              </span>
            )}
          </div>
        </div>

        {/* Time Range */}
        <div className="flex items-center gap-1 text-2xs opacity-85 mt-0.5 font-medium">
          <Clock className="w-3 h-3 shrink-0" />
          <span>{timeRange}</span>
        </div>
      </div>

      {/* Footer info (Shown only if card is tall enough) */}
      {!isShortCard && (
        <div className="flex items-center justify-between text-2xs opacity-90 mt-1 pt-1 border-t border-black/5">
          <div className="flex items-center gap-1 truncate mr-1">
            <User className="w-3 h-3 shrink-0 opacity-70" />
            <span className="truncate">{bookerName}</span>
          </div>

          {booking.participant > 0 && (
            <div className="flex items-center gap-0.5 shrink-0 opacity-75">
              <Users className="w-3 h-3" />
              <span>{booking.participant}</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default SchedulerBooking;
