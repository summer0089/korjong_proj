"use client";

import React, { useState, useEffect } from "react";
import {
  X,
  DoorClosed,
  Users,
  AlertTriangle,
  Check,
  AlertCircle,
} from "lucide-react";
import { MeetingBooking, MeetingRoom } from "./types";
import { DatePicker } from "@/components/form_controls/DatePicker";

export interface BookingFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (bookingData: {
    topic: string;
    roomId: string;
    date: Date;
    startTime: string; // "HH:mm"
    endTime: string;   // "HH:mm"
    participant: number;
    note: string;
  }) => Promise<boolean | void> | void;
  rooms: MeetingRoom[];
  existingBookings?: MeetingBooking[];
  initialBooking?: MeetingBooking | null;
  initialSelection?: {
    roomId: string;
    startTime: Date;
    endTime: Date;
  } | null;
  defaultDate?: Date;
}

export const BookingForm: React.FC<BookingFormProps> = ({
  isOpen,
  onClose,
  onSubmit,
  rooms,
  existingBookings = [],
  initialBooking,
  initialSelection,
  defaultDate = new Date(),
}) => {
  const isEditing = Boolean(initialBooking);

  // Form states
  const [topic, setTopic] = useState("");
  const [roomId, setRoomId] = useState(rooms[0]?.id || "");
  const [date, setDate] = useState<Date>(defaultDate);
  const [startTime, setStartTime] = useState("09:00");
  const [endTime, setEndTime] = useState("10:00");
  const [participant, setParticipant] = useState<number>(1);
  const [note, setNote] = useState("");

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Helper to format Date to "HH:mm"
  const dateToTimeString = (d: Date) => {
    const h = String(d.getHours()).padStart(2, "0");
    const m = String(d.getMinutes()).padStart(2, "0");
    return `${h}:${m}`;
  };

  // Helper to ensure date is not in the past for new bookings
  const getValidDate = (target: Date) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const d = new Date(target);
    d.setHours(0, 0, 0, 0);
    return d < today ? new Date() : target;
  };

  // Sync initial values when opened
  useEffect(() => {
    if (!isOpen) return;

    if (initialBooking) {
      // Edit mode
      setTopic(initialBooking.topic);
      setRoomId(initialBooking.roomId);
      const s = new Date(initialBooking.startTime);
      const e = new Date(initialBooking.endTime);
      setDate(s);
      setStartTime(dateToTimeString(s));
      setEndTime(dateToTimeString(e));
      setParticipant(initialBooking.participant || 1);
      setNote(initialBooking.note || "");
    } else if (initialSelection) {
      // Pre-filled from drag or slot click
      setTopic("");
      setRoomId(initialSelection.roomId || rooms[0]?.id || "");
      setDate(getValidDate(initialSelection.startTime));
      setStartTime(dateToTimeString(initialSelection.startTime));
      setEndTime(dateToTimeString(initialSelection.endTime));
      setParticipant(1);
      setNote("");
    } else {
      // Default new booking
      setTopic("");
      setRoomId(rooms[0]?.id || "");
      setDate(getValidDate(defaultDate));
      setStartTime("09:00");
      setEndTime("10:00");
      setParticipant(1);
      setNote("");
    }

    setErrors({});
  }, [isOpen, initialBooking, initialSelection, defaultDate, rooms]);

  if (!isOpen) return null;

  const selectedRoom = rooms.find((r) => r.id === roomId);

  // Generate available half-hour time options from 07:00 to 21:00
  const timeOptions: string[] = [];
  for (let h = 7; h <= 21; h++) {
    for (let m = 0; m < 60; m += 30) {
      timeOptions.push(`${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`);
    }
  }

  // Conflict checking with other existing bookings
  const checkConflict = () => {
    const [startH, startM] = startTime.split(":").map(Number);
    const [endH, endM] = endTime.split(":").map(Number);

    const slotStart = new Date(date);
    slotStart.setHours(startH, startM, 0, 0);

    const slotEnd = new Date(date);
    slotEnd.setHours(endH, endM, 0, 0);

    return existingBookings.some((b) => {
      // Skip current booking if editing
      if (initialBooking && b.id === initialBooking.id) return false;
      // Must be same room
      if (b.roomId !== roomId) return false;
      // Skip canceled or rejected bookings
      if (b.status === "CANCELED" || b.status === "REJECTED") return false;

      const bStart = new Date(b.startTime);
      const bEnd = new Date(b.endTime);

      // Same day check
      if (
        bStart.getFullYear() !== date.getFullYear() ||
        bStart.getMonth() !== date.getMonth() ||
        bStart.getDate() !== date.getDate()
      ) {
        return false;
      }

      // Overlap: slotStart < bEnd && slotEnd > bStart
      return slotStart < bEnd && slotEnd > bStart;
    });
  };

  const hasConflict = checkConflict();
  const capacityExceeded = selectedRoom ? participant > selectedRoom.capacity : false;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const newErrors: Record<string, string> = {};

    if (!topic.trim()) {
      newErrors.topic = "กรุณากรอกหัวข้อการประชุม";
    }

    if (!roomId) {
      newErrors.roomId = "กรุณาเลือกห้องประชุม";
    }

    const [sh, sm] = startTime.split(":").map(Number);
    const [eh, em] = endTime.split(":").map(Number);
    const startMins = sh * 60 + sm;
    const endMins = eh * 60 + em;

    if (endMins <= startMins) {
      newErrors.endTime = "เวลาสิ้นสุดต้องมากกว่าเวลาเริ่มต้น";
    }

    // Validate that the date is not in the past
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const selectedDay = new Date(date);
    selectedDay.setHours(0, 0, 0, 0);

    if (selectedDay < today) {
      newErrors.date = "ไม่สามารถจองห้องประชุมในวันที่ย้อนหลังได้";
    } else if (selectedDay.getTime() === today.getTime() && !isEditing) {
      const now = new Date();
      const currentMinutes = now.getHours() * 60 + now.getMinutes();
      if (startMins <= currentMinutes) {
        newErrors.startTime = "เวลาเริ่มต้นต้องเป็นเวลาปัจจุบันหรือล่วงหน้าเท่านั้น";
      }
    }

    if (participant < 1) {
      newErrors.participant = "จำนวนผู้เข้าร่วมต้องมากกว่า 0";
    }

    if (hasConflict) {
      newErrors.timeConflict = "ช่วงเวลานี้มีการจองห้องประชุมนี้แล้ว";
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    try {
      setIsSubmitting(true);
      await onSubmit({
        topic: topic.trim(),
        roomId,
        date,
        startTime,
        endTime,
        participant: Number(participant),
        note: note.trim(),
      });
      onClose();
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (err: any) {
      setErrors((prev) => ({
        ...prev,
        submit: err?.message || "เกิดข้อผิดพลาดในการบันทึกข้อมูล",
      }));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-fade-in">
      <div
        className="w-full max-w-lg bg-surface rounded-2xl shadow-2xl border border-border overflow-hidden flex flex-col max-h-[92vh] animate-scale-up"
        role="dialog"
        aria-modal="true"
      >
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-border/80 flex items-center justify-between gap-3 bg-surface-raised">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-primary-100 text-primary-700">
              <DoorClosed className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-text">
                {isEditing ? "แก้ไขการจองห้องประชุม" : "จองห้องประชุมใหม่"}
              </h2>
              <p className="text-xs text-text-muted">
                กรอกรายละเอียดการประชุมเพื่อส่งคำขอจองห้อง
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-text-muted hover:text-text hover:bg-surface-sunken transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4 text-xs sm:text-sm">
          {/* Submission Error Banner */}
          {errors.submit && (
            <div className="p-3 rounded-xl bg-unavailable-50 border border-unavailable-200 text-unavailable-900 flex items-start gap-2.5 animate-shake">
              <AlertCircle className="w-5 h-5 text-unavailable-600 shrink-0 mt-0.5" />
              <div className="space-y-0.5 text-xs">
                <p className="font-bold text-unavailable-800">ไม่สามารถบันทึกข้อมูลได้</p>
                <p className="text-unavailable-700">{errors.submit}</p>
              </div>
            </div>
          )}

          {/* Conflict Banner Warning */}
          {hasConflict && (
            <div className="p-3 rounded-xl bg-unavailable-50 border border-unavailable-200 text-unavailable-900 flex items-start gap-2.5 animate-shake">
              <AlertTriangle className="w-5 h-5 text-unavailable-600 shrink-0 mt-0.5" />
              <div className="space-y-0.5 text-xs">
                <p className="font-bold text-unavailable-800">ช่วงเวลานี้ถูกจองแล้ว</p>
                <p className="text-unavailable-700">
                  ห้องประชุมนี้มีผู้จองแล้วในช่วงเวลาดังกล่าว กรุณาเลือกช่วงเวลาหรือห้องประชุมอื่น
                </p>
              </div>
            </div>
          )}

          {/* Meeting Room Selection */}
          <div>
            <label className="block text-xs font-semibold text-text-secondary mb-1.5">
              เลือกห้องประชุม <span className="text-unavailable-500">*</span>
            </label>
            <div className="relative">
              <select
                value={roomId}
                onChange={(e) => setRoomId(e.target.value)}
                className="w-full bg-surface border border-border rounded-lg py-2.5 px-3.5 text-sm text-text focus:outline-none focus:ring-1 focus:ring-primary-500"
              >
                {rooms.map((r) => (
                  <option key={r.id} value={r.id}>
                    {r.name} (รองรับ {r.capacity} ท่าน)
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Meeting Topic */}
          <div>
            <label className="block text-xs font-semibold text-text-secondary mb-1.5">
              หัวข้อการประชุม <span className="text-unavailable-500">*</span>
            </label>
            <input
              type="text"
              value={topic}
              onChange={(e) => {
                setTopic(e.target.value);
                if (errors.topic) setErrors((prev) => ({ ...prev, topic: "" }));
              }}
              placeholder="เช่น ประชุมวางแผนประจำสัปดาห์, Review Sprint"
              className={`w-full bg-surface border rounded-lg py-2.5 px-3.5 text-sm text-text focus:outline-none focus:ring-1 ${errors.topic
                  ? "border-unavailable-500 focus:ring-unavailable-500"
                  : "border-border focus:ring-primary-500"
                }`}
            />
            {errors.topic && (
              <p className="mt-1 text-xs text-unavailable-600 flex items-center gap-1 font-medium">
                <AlertCircle className="w-3 h-3" />
                <span>{errors.topic}</span>
              </p>
            )}
          </div>

          {/* Date Picker Component */}
          <div>
            <DatePicker
              label="วันที่ประชุม"
              value={date}
              minDate={new Date()}
              error={errors.date}
              onChange={(newDate) => {
                setDate(newDate);
                if (errors.date) setErrors((prev) => ({ ...prev, date: "" }));
              }}
              className="text-sm font-medium"
            />
          </div>

          {/* Time Selection: Start Time & End Time */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-text-secondary mb-1.5">
                เวลาเริ่มต้น <span className="text-unavailable-500">*</span>
              </label>
              <div className="relative">
                <select
                  value={startTime}
                  onChange={(e) => {
                    setStartTime(e.target.value);
                    if (errors.startTime) setErrors((prev) => ({ ...prev, startTime: "" }));
                  }}
                  className={`w-full bg-surface border rounded-lg py-2.5 px-3.5 text-sm text-text focus:outline-none focus:ring-1 ${errors.startTime
                      ? "border-unavailable-500 focus:ring-unavailable-500"
                      : "border-border focus:ring-primary-500"
                    }`}
                >
                  {timeOptions.map((t) => (
                    <option key={`start-${t}`} value={t}>
                      {t} น.
                    </option>
                  ))}
                </select>
              </div>
              {errors.startTime && (
                <p className="mt-1 text-xs text-unavailable-600 flex items-center gap-1 font-medium">
                  <AlertCircle className="w-3 h-3" />
                  <span>{errors.startTime}</span>
                </p>
              )}
            </div>

            <div>
              <label className="block text-xs font-semibold text-text-secondary mb-1.5">
                เวลาสิ้นสุด <span className="text-unavailable-500">*</span>
              </label>
              <div className="relative">
                <select
                  value={endTime}
                  onChange={(e) => {
                    setEndTime(e.target.value);
                    if (errors.endTime) setErrors((prev) => ({ ...prev, endTime: "" }));
                  }}
                  className={`w-full bg-surface border rounded-lg py-2.5 px-3.5 text-sm text-text focus:outline-none focus:ring-1 ${errors.endTime
                      ? "border-unavailable-500 focus:ring-unavailable-500"
                      : "border-border focus:ring-primary-500"
                    }`}
                >
                  {timeOptions.map((t) => (
                    <option key={`end-${t}`} value={t}>
                      {t} น.
                    </option>
                  ))}
                </select>
              </div>
              {errors.endTime && (
                <p className="mt-1 text-xs text-unavailable-600 flex items-center gap-1 font-medium">
                  <AlertCircle className="w-3 h-3" />
                  <span>{errors.endTime}</span>
                </p>
              )}
            </div>
          </div>

          {/* Participant count with room capacity check */}
          <div>
            <label className="block text-xs font-semibold text-text-secondary mb-1.5">
              จำนวนผู้เข้าร่วมประชุม (ท่าน) <span className="text-unavailable-500">*</span>
            </label>
            <div className="relative">
              <input
                type="number"
                min={1}
                max={500}
                value={participant}
                onChange={(e) => setParticipant(Math.max(1, parseInt(e.target.value) || 1))}
                className="w-full bg-surface border border-border rounded-lg py-2.5 px-3.5 text-sm text-text focus:outline-none focus:ring-1 focus:ring-primary-500"
              />
              <div className="pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 text-text-muted">
                <Users className="w-4 h-4" />
              </div>
            </div>

            {capacityExceeded && selectedRoom && (
              <p className="mt-1 text-xs text-amber-600 flex items-center gap-1 font-medium">
                <AlertTriangle className="w-3 h-3" />
                <span>จำนวนผู้เข้าร่วมเกินความจุห้อง (ห้องนี้รองรับได้ {selectedRoom.capacity} ท่าน)</span>
              </p>
            )}
          </div>

          {/* Note & Objectives */}
          <div>
            <label className="block text-xs font-semibold text-text-secondary mb-1.5">
              หมายเหตุ / อุปกรณ์ที่ต้องการเพิ่มเติม
            </label>
            <textarea
              rows={3}
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="เช่น ต้องการไมโครโฟนไร้สาย 2 ตัว, จอโปรเจกเตอร์, หรือเครื่องดื่มรับรอง"
              className="w-full bg-surface border border-border rounded-lg p-3 text-sm text-text focus:outline-none focus:ring-1 focus:ring-primary-500"
            />
          </div>

          {/* Form Actions */}
          <div className="pt-2 flex items-center justify-end gap-2.5 border-t border-border/80">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-4 py-2 rounded-lg bg-surface border border-border hover:bg-surface-sunken text-text text-xs sm:text-sm font-medium transition-colors cursor-pointer"
            >
              ยกเลิก
            </button>

            <button
              type="submit"
              disabled={isSubmitting || hasConflict}
              className="inline-flex items-center gap-1.5 px-5 py-2 rounded-lg bg-primary-600 hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed text-white text-xs sm:text-sm font-semibold shadow-sm transition-all"
            >
              {isSubmitting ? (
                <span>กำลังบันทึก...</span>
              ) : (
                <>
                  <Check className="w-4 h-4" />
                  <span>{isEditing ? "บันทึกการแก้ไข" : "ยืนยันการจอง"}</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default BookingForm;
