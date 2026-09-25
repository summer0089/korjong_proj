"use client";

import React from "react";
import { Sparkles, MousePointerClick } from "lucide-react";

export interface BookingLegendProps {
  className?: string;
  readOnly?: boolean;
}

export const BookingLegend: React.FC<BookingLegendProps> = ({
  className = "",
  readOnly = false,
}) => {
  return (
    <div
      className={`bg-surface border border-border rounded-xl p-3 sm:p-4 shadow-xs flex flex-wrap items-center justify-between gap-3 text-xs ${className}`}
    >
      {/* Legend Items */}
      <div className="flex flex-wrap items-center gap-3 sm:gap-4">
        <span className="font-semibold text-text-secondary">สถานะการจอง:</span>

        {/* Approved */}
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-available-500 ring-2 ring-available-200" />
          <span className="text-text font-medium">อนุมัติแล้ว</span>
        </div>

        {/* Pending */}
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-pending-500 ring-2 ring-pending-200" />
          <span className="text-text font-medium">รอการอนุมัติ</span>
        </div>

        {/* Rejected */}
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-unavailable-500 ring-2 ring-unavailable-200" />
          <span className="text-text font-medium">ไม่อนุมัติ</span>
        </div>

        {/* Canceled */}
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-secondary-400 ring-2 ring-secondary-200" />
          <span className="text-text-muted font-medium">ยกเลิกแล้ว</span>
        </div>

        {/* My Booking Indicator */}
        <div className="flex items-center gap-1.5 pl-2 sm:pl-3 border-l border-border/80">
          <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-primary-600 text-white text-2xs font-bold shadow-2xs">
            <Sparkles className="w-2.5 h-2.5" />
            <span>ของฉัน</span>
          </span>
          <span className="text-text font-semibold">การจองของฉัน</span>
        </div>
      </div>

      {/* Helpful Hint */}
      {!readOnly && (
        <div className="hidden md:flex items-center gap-1.5 text-text-muted text-[11px]">
          <MousePointerClick className="w-3.5 h-3.5 text-primary-600" />
          <span>ลากเมาส์เพื่อเลือกเวลา หรือคลิกการ์ดเพื่อดูรายละเอียด</span>
        </div>
      )}
    </div>
  );
};

export default BookingLegend;
