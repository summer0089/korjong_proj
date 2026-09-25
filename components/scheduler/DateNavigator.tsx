"use client";

import React from "react";
import { ChevronLeft, ChevronRight, CalendarDays, RotateCcw } from "lucide-react";
import { DatePicker } from "@/components/form_controls/DatePicker";

export interface DateNavigatorProps {
  currentDate: Date;
  onDateChange: (date: Date) => void;
  className?: string;
}

const THAI_DAYS_FULL = [
  "วันอาทิตย์",
  "วันจันทร์",
  "วันอังคาร",
  "วันพุธ",
  "วันพฤหัสบดี",
  "วันศุกร์",
  "วันเสาร์"
];

const THAI_MONTHS_FULL = [
  "มกราคม", "กุมภาพันธ์", "มีนาคม", "เมษายน", "พฤษภาคม", "มิถุนายน",
  "กรกฎาคม", "สิงหาคม", "กันยายน", "ตุลาคม", "พฤศจิกายน", "ธันวาคม"
];

export const DateNavigator: React.FC<DateNavigatorProps> = ({
  currentDate,
  onDateChange,
  className = "",
}) => {
  const isToday = (d: Date): boolean => {
    const today = new Date();
    return (
      d.getFullYear() === today.getFullYear() &&
      d.getMonth() === today.getMonth() &&
      d.getDate() === today.getDate()
    );
  };

  const handlePrevDay = () => {
    const prev = new Date(currentDate);
    prev.setDate(prev.getDate() - 1);
    onDateChange(prev);
  };

  const handleNextDay = () => {
    const next = new Date(currentDate);
    next.setDate(next.getDate() + 1);
    onDateChange(next);
  };

  const handleToday = () => {
    onDateChange(new Date());
  };

  const dayName = THAI_DAYS_FULL[currentDate.getDay()];
  const dayNumber = currentDate.getDate();
  const monthName = THAI_MONTHS_FULL[currentDate.getMonth()];
  const thaiYear = currentDate.getFullYear() + 543;

  return (
    <div className={`flex flex-wrap items-center gap-2 ${className}`}>
      {/* Navigation arrows & Today button */}
      <div className="flex items-center gap-1 bg-surface border border-border rounded-lg p-1 shadow-xs">
        <button
          type="button"
          onClick={handlePrevDay}
          className="p-1.5 rounded-md text-text-secondary hover:text-text hover:bg-surface-sunken transition-colors"
          title="วันก่อนหน้า"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>

        <button
          type="button"
          onClick={handleToday}
          className={`px-2.5 py-1 text-xs font-semibold rounded-md transition-colors flex items-center gap-1.5 ${
            isToday(currentDate)
              ? "bg-primary-50 text-primary-700 font-bold"
              : "text-text-secondary hover:text-text hover:bg-surface-sunken"
          }`}
          title="ไปที่วันปัจจุบัน"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span>วันนี้</span>
        </button>

        <button
          type="button"
          onClick={handleNextDay}
          className="p-1.5 rounded-md text-text-secondary hover:text-text hover:bg-surface-sunken transition-colors"
          title="วันถัดไป"
        >
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>

      {/* DatePicker Component (Separated Component) */}
      <div className="w-44 sm:w-48">
        <DatePicker
          value={currentDate}
          onChange={(date) => onDateChange(date)}
          className="py-1.5 text-xs font-medium"
        />
      </div>

      {/* Full readable Thai date badge */}
      <div className="hidden lg:flex items-center gap-1.5 px-3 py-1.5 bg-surface-raised border border-border/80 rounded-lg text-xs font-medium text-text-secondary">
        <CalendarDays className="w-3.5 h-3.5 text-primary-600" />
        <span>
          {dayName}ที่ {dayNumber} {monthName} พ.ศ. {thaiYear}
        </span>
      </div>
    </div>
  );
};

export default DateNavigator;
