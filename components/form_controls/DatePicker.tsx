"use client";

import React, { useState, useRef, useEffect, forwardRef } from "react";
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight, X, AlertCircle } from "lucide-react";

export interface DatePickerProps {
  label?: string;
  value?: Date | string | null;
  onChange?: (date: Date) => void;
  error?: string;
  helperText?: string;
  placeholder?: string;
  disabled?: boolean;
  readOnly?: boolean;
  minDate?: Date;
  maxDate?: Date;
  className?: string;
  containerClassName?: string;
  id?: string;
  name?: string;
}

const THAI_MONTHS_FULL = [
  "มกราคม", "กุมภาพันธ์", "มีนาคม", "เมษายน", "พฤษภาคม", "มิถุนายน",
  "กรกฎาคม", "สิงหาคม", "กันยายน", "ตุลาคม", "พฤศจิกายน", "ธันวาคม"
];

const THAI_MONTHS_SHORT = [
  "ม.ค.", "ก.พ.", "มี.ค.", "เม.ย.", "พ.ค.", "มิ.ย.",
  "ก.ค.", "ส.ค.", "ก.ย.", "ต.ค.", "พ.ย.", "ธ.ค."
];

const THAI_DAYS_SHORT = ["อา", "จ", "อ", "พ", "พฤ", "ศ", "ส"];

export const DatePicker = forwardRef<HTMLInputElement, DatePickerProps>(
  (
    {
      label,
      value,
      onChange,
      error,
      helperText,
      placeholder = "เลือกวันที่...",
      disabled = false,
      readOnly = false,
      minDate,
      maxDate,
      className = "",
      containerClassName = "",
      id,
      name,
    },
    ref
  ) => {
    // Parse initial value to Date object or default to null
    const parseDate = (d: Date | string | null | undefined): Date | null => {
      if (!d) return null;
      if (d instanceof Date) return isNaN(d.getTime()) ? null : d;
      const parsed = new Date(d);
      return isNaN(parsed.getTime()) ? null : parsed;
    };

    const selectedDate = parseDate(value);

    // State for popup visibility and the view month/year
    const [isOpen, setIsOpen] = useState(false);
    const [viewDate, setViewDate] = useState<Date>(selectedDate || new Date());
    const dropdownRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement | null>(null);

    // Sync viewDate when selectedDate changes
    useEffect(() => {
      if (selectedDate) {
        setViewDate(selectedDate);
      }
    }, [value, selectedDate]);

    // Handle outside clicks
    useEffect(() => {
      const handleClickOutside = (event: MouseEvent) => {
        if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
          setIsOpen(false);
        }
      };

      if (isOpen) {
        document.addEventListener("mousedown", handleClickOutside);
      }
      return () => {
        document.removeEventListener("mousedown", handleClickOutside);
      };
    }, [isOpen]);

    // Format for display
    const formatDisplay = (date: Date | null): string => {
      if (!date) return "";
      const day = date.getDate();
      const month = THAI_MONTHS_SHORT[date.getMonth()];
      const thaiYear = date.getFullYear() + 543;
      return `${day} ${month} ${thaiYear}`;
    };

    // Calendar Calculations
    const year = viewDate.getFullYear();
    const month = viewDate.getMonth();

    const firstDayOfMonth = new Date(year, month, 1).getDay(); // 0 is Sun
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const daysInPrevMonth = new Date(year, month, 0).getDate();

    const prevMonthDays = Array.from({ length: firstDayOfMonth }, (_, i) => {
      return daysInPrevMonth - firstDayOfMonth + i + 1;
    });

    const currentMonthDays = Array.from({ length: daysInMonth }, (_, i) => i + 1);

    const remainingDays = 42 - (prevMonthDays.length + currentMonthDays.length);
    const nextMonthDays = Array.from({ length: remainingDays }, (_, i) => i + 1);

    const prevMonth = (e: React.MouseEvent) => {
      e.stopPropagation();
      setViewDate(new Date(year, month - 1, 1));
    };

    const nextMonth = (e: React.MouseEvent) => {
      e.stopPropagation();
      setViewDate(new Date(year, month + 1, 1));
    };

    const selectDateHandler = (day: number) => {
      if (isDateDisabled(day)) return;
      const newDate = new Date(year, month, day, 12, 0, 0); // noon to avoid timezone shift
      onChange?.(newDate);
      setIsOpen(false);
    };

    const selectToday = (e: React.MouseEvent) => {
      e.stopPropagation();
      const today = new Date();
      setViewDate(today);
      onChange?.(today);
      setIsOpen(false);
    };

    const isSameDay = (d1: Date | null, d2: Date): boolean => {
      if (!d1) return false;
      return (
        d1.getFullYear() === d2.getFullYear() &&
        d1.getMonth() === d2.getMonth() &&
        d1.getDate() === d2.getDate()
      );
    };

    const isToday = (day: number): boolean => {
      const today = new Date();
      return (
        today.getFullYear() === year &&
        today.getMonth() === month &&
        today.getDate() === day
      );
    };

    const isSelected = (day: number): boolean => {
      if (!selectedDate) return false;
      return (
        selectedDate.getFullYear() === year &&
        selectedDate.getMonth() === month &&
        selectedDate.getDate() === day
      );
    };

    const isDateDisabled = (day: number): boolean => {
      const target = new Date(year, month, day);
      if (minDate && target < new Date(minDate.getFullYear(), minDate.getMonth(), minDate.getDate())) {
        return true;
      }
      if (maxDate && target > new Date(maxDate.getFullYear(), maxDate.getMonth(), maxDate.getDate())) {
        return true;
      }
      return false;
    };

    return (
      <div className={`relative w-full ${containerClassName}`} ref={dropdownRef}>
        {label && (
          <label
            htmlFor={id || name}
            className="block text-sm font-medium text-text-secondary mb-1.5"
          >
            {label}
          </label>
        )}

        <div className="relative">
          <input
            ref={(node) => {
              inputRef.current = node;
              if (typeof ref === "function") ref(node);
              else if (ref) ref.current = node;
            }}
            id={id || name}
            name={name}
            type="text"
            readOnly
            disabled={disabled}
            value={formatDisplay(selectedDate)}
            placeholder={placeholder}
            onClick={() => {
              if (!disabled && !readOnly) setIsOpen(!isOpen);
            }}
            aria-invalid={!!error}
            className={`input-field cursor-pointer py-2.5 px-3.5 pl-10 pr-9 rounded-lg text-sm transition-all select-none ${error
                ? "border-unavailable-500 focus:ring-1 focus:ring-unavailable-500"
                : "border-border hover:border-border-strong focus:ring-1 focus:ring-primary-500"
              } ${disabled ? "bg-surface-sunken text-text-muted cursor-not-allowed opacity-60" : "bg-surface text-text"} ${className}`}
          />

          <div className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-primary-600">
            <CalendarIcon className="w-4 h-4" />
          </div>

          {selectedDate && !disabled && !readOnly && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onChange?.(new Date());
              }}
              title="รีเซ็ตเป็นวันนี้"
              className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted hover:text-text p-0.5 rounded transition-colors"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {error && (
          <p
            id={id ? `${id}-error` : undefined}
            role="alert"
            className="mt-1.5 text-xs text-unavailable-600 flex items-center gap-1 font-medium animate-fade-in"
          >
            <AlertCircle className="w-3.5 h-3.5 shrink-0" />
            <span>{error}</span>
          </p>
        )}

        {!error && helperText && (
          <p className="mt-1.5 text-xs text-text-muted">{helperText}</p>
        )}

        {/* Calendar Popover */}
        {isOpen && !disabled && !readOnly && (
          <div className="absolute z-50 mt-1.5 w-72 sm:w-80 p-3.5 bg-surface rounded-xl shadow-xl border border-border animate-fade-in select-none">
            {/* Calendar Header */}
            <div className="flex items-center justify-between pb-3 border-b border-border/60">
              <button
                type="button"
                onClick={prevMonth}
                className="p-1.5 rounded-lg text-text-secondary hover:bg-surface-sunken hover:text-text transition-colors"
                title="เดือนก่อนหน้า"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>

              <div className="text-sm font-semibold text-text">
                {THAI_MONTHS_FULL[month]} {year + 543}
              </div>

              <button
                type="button"
                onClick={nextMonth}
                className="p-1.5 rounded-lg text-text-secondary hover:bg-surface-sunken hover:text-text transition-colors"
                title="เดือนถัดไป"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>

            {/* Days of Week Header */}
            <div className="grid grid-cols-7 gap-1 mt-2 text-center text-xs font-semibold text-text-muted">
              {THAI_DAYS_SHORT.map((d, index) => (
                <div
                  key={d}
                  className={`py-1.5 ${index === 0 ? "text-unavailable-500" : ""}`}
                >
                  {d}
                </div>
              ))}
            </div>

            {/* Days Grid */}
            <div className="grid grid-cols-7 gap-1 mt-1 text-center text-xs">
              {/* Previous month days */}
              {prevMonthDays.map((d) => (
                <div
                  key={`prev-${d}`}
                  className="py-2 text-text-muted/40 cursor-default"
                >
                  {d}
                </div>
              ))}

              {/* Current month days */}
              {currentMonthDays.map((d) => {
                const selected = isSelected(d);
                const today = isToday(d);
                const disabledDate = isDateDisabled(d);

                return (
                  <button
                    key={`curr-${d}`}
                    type="button"
                    disabled={disabledDate}
                    onClick={() => selectDateHandler(d)}
                    className={`py-2 rounded-lg font-medium transition-all text-center relative ${selected
                        ? "bg-primary-600 text-white font-bold shadow-sm"
                        : today
                          ? "bg-primary-50 text-primary-700 font-semibold border border-primary-300 hover:bg-primary-100"
                          : "text-text hover:bg-surface-sunken"
                      } ${disabledDate ? "opacity-30 cursor-not-allowed hover:bg-transparent" : "cursor-pointer"}`}
                  >
                    {d}
                    {today && !selected && (
                      <span className="absolute bottom-0.5 left-1/2 -translate-x-1/2 w-1 h-1 bg-primary-600 rounded-full" />
                    )}
                  </button>
                );
              })}

              {/* Next month days */}
              {nextMonthDays.map((d) => (
                <div
                  key={`next-${d}`}
                  className="py-2 text-text-muted/40 cursor-default"
                >
                  {d}
                </div>
              ))}
            </div>

            {/* Popover Footer: Quick Today action */}
            <div className="flex items-center justify-between pt-2.5 mt-2.5 border-t border-border/60">
              <span className="text-[11px] text-text-muted">
                วันนี้: {new Date().getDate()} {THAI_MONTHS_SHORT[new Date().getMonth()]} {new Date().getFullYear() + 543}
              </span>
              <button
                type="button"
                onClick={selectToday}
                className="text-xs font-semibold text-primary-600 hover:text-primary-700 px-2 py-1 rounded hover:bg-primary-50 transition-colors"
              >
                เลือกวันนี้
              </button>
            </div>
          </div>
        )}
      </div>
    );
  }
);

DatePicker.displayName = "DatePicker";

export default DatePicker;
