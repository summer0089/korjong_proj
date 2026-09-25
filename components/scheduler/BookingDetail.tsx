"use client";

import React, { useState } from "react";
import {
  X,
  Calendar,
  Clock,
  DoorClosed,
  Users,
  User,
  Mail,
  Phone,
  FileText,
  CheckCircle2,
  Clock3,
  XCircle,
  AlertCircle,
  Edit,
  Trash2,
  Sparkles,
  ShieldAlert,
  Check,
  Ban,
} from "lucide-react";
import { MeetingBooking, MeetingStatus } from "./types";

export interface BookingDetailProps {
  booking: MeetingBooking | null;
  isOpen: boolean;
  onClose: () => void;
  onEdit?: (booking: MeetingBooking) => void;
  onCancel?: (bookingId: string) => Promise<boolean | void> | void;
  onDelete?: (bookingId: string) => Promise<boolean | void> | void;
  onApprove?: (bookingId: string) => Promise<boolean | void> | void;
  onReject?: (bookingId: string, reason?: string) => Promise<boolean | void> | void;
  currentUserId?: string | null;
  currentUserRole?: string | null;
  readOnly?: boolean;
}

const THAI_MONTHS_FULL = [
  "มกราคม", "กุมภาพันธ์", "มีนาคม", "เมษายน", "พฤษภาคม", "มิถุนายน",
  "กรกฎาคม", "สิงหาคม", "กันยายน", "ตุลาคม", "พฤศจิกายน", "ธันวาคม"
];

export const BookingDetail: React.FC<BookingDetailProps> = ({
  booking,
  isOpen,
  onClose,
  onEdit,
  onCancel,
  onDelete,
  onApprove,
  onReject,
  currentUserId,
  currentUserRole,
  readOnly = false,
}) => {
  const [isConfirmingCancel, setIsConfirmingCancel] = useState(false);
  const [isCanceling, setIsCanceling] = useState(false);

  const [isConfirmingDelete, setIsConfirmingDelete] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const [isConfirmingReject, setIsConfirmingReject] = useState(false);
  const [rejectReason, setRejectReason] = useState("");
  const [isRejecting, setIsRejecting] = useState(false);

  const [isApproving, setIsApproving] = useState(false);

  if (!isOpen || !booking) return null;

  const isOwner = Boolean(
    currentUserId && booking.employeeId && booking.employeeId === currentUserId
  );

  const isApproverOrAdmin = Boolean(
    currentUserRole && (currentUserRole === "ADMIN" || currentUserRole === "APPROVER")
  );

  const startDate = new Date(booking.startTime);
  const endDate = new Date(booking.endTime);

  const formatThaiDateFull = (d: Date) => {
    const day = d.getDate();
    const month = THAI_MONTHS_FULL[d.getMonth()];
    const thaiYear = d.getFullYear() + 543;
    return `${day} ${month} พ.ศ. ${thaiYear}`;
  };

  const formatTime = (d: Date) =>
    d.toLocaleTimeString("th-TH", { hour: "2-digit", minute: "2-digit" });

  // Calculate duration in hours and minutes
  const durationMs = endDate.getTime() - startDate.getTime();
  const totalMinutes = Math.floor(durationMs / (1000 * 60));
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  let durationStr = "";
  if (hours > 0) durationStr += `${hours} ชม. `;
  if (minutes > 0 || hours === 0) durationStr += `${minutes} นาที`;

  const getStatusBadge = (status: MeetingStatus) => {
    switch (status) {
      case "APPROVED":
        return {
          bg: "bg-available-50 text-available-800 border-available-300",
          icon: <CheckCircle2 className="w-4 h-4 text-available-600" />,
          label: "อนุมัติแล้ว",
        };
      case "PENDING":
        return {
          bg: "bg-pending-50 text-pending-800 border-pending-300",
          icon: <Clock3 className="w-4 h-4 text-pending-600" />,
          label: "รอการอนุมัติ",
        };
      case "REJECTED":
        return {
          bg: "bg-unavailable-50 text-unavailable-800 border-unavailable-300",
          icon: <AlertCircle className="w-4 h-4 text-unavailable-600" />,
          label: "ไม่อนุมัติ",
        };
      case "CANCELED":
      default:
        return {
          bg: "bg-secondary-100 text-secondary-700 border-secondary-300",
          icon: <XCircle className="w-4 h-4 text-secondary-500" />,
          label: "ยกเลิกแล้ว",
        };
    }
  };

  const statusBadge = getStatusBadge(booking.status);

  // Handlers
  const handleCancelConfirm = async () => {
    if (!onCancel) return;
    try {
      setIsCanceling(true);
      await onCancel(booking.id);
      setIsConfirmingCancel(false);
      onClose();
    } finally {
      setIsCanceling(false);
    }
  };

  const handleDeleteConfirm = async () => {
    if (!onDelete) return;
    try {
      setIsDeleting(true);
      await onDelete(booking.id);
      setIsConfirmingDelete(false);
      onClose();
    } finally {
      setIsDeleting(false);
    }
  };

  const handleApproveClick = async () => {
    if (!onApprove) return;
    try {
      setIsApproving(true);
      await onApprove(booking.id);
      onClose();
    } finally {
      setIsApproving(false);
    }
  };

  const handleRejectConfirm = async () => {
    if (!onReject) return;
    try {
      setIsRejecting(true);
      await onReject(booking.id, rejectReason.trim());
      setIsConfirmingReject(false);
      onClose();
    } finally {
      setIsRejecting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-fade-in">
      {/* Modal Dialog Card */}
      <div
        className="w-full max-w-lg bg-surface rounded-2xl shadow-2xl border border-border overflow-hidden flex flex-col max-h-[90vh] animate-scale-up"
        role="dialog"
        aria-modal="true"
      >
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-border/80 flex items-start justify-between gap-3 bg-surface-raised">
          <div className="space-y-1">
            <div className="flex flex-wrap items-center gap-2">
              <span
                className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full border text-xs font-semibold ${statusBadge.bg}`}
              >
                {statusBadge.icon}
                <span>{statusBadge.label}</span>
              </span>

              {isOwner && (
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-primary-100 text-primary-800 border border-primary-200 text-xs font-bold shadow-2xs">
                  <Sparkles className="w-3 h-3 text-primary-600" />
                  <span>การจองของคุณ</span>
                </span>
              )}
            </div>

            <h2 className="text-base sm:text-lg font-bold text-text leading-snug">
              {booking.topic}
            </h2>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-text-muted hover:text-text hover:bg-surface-sunken transition-colors"
            title="ปิดหน้าต่าง"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-4 sm:p-5 overflow-y-auto space-y-4 text-xs sm:text-sm">
          {/* Room & Time Details */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3.5 rounded-xl bg-surface-sunken/60 border border-border/60">
            {/* Room */}
            <div className="flex items-start gap-2.5">
              <div className="p-2 rounded-lg bg-primary-50 text-primary-600 shrink-0">
                <DoorClosed className="w-4 h-4" />
              </div>
              <div>
                <p className="text-[11px] font-medium text-text-muted">ห้องประชุม</p>
                <p className="font-semibold text-text">
                  {booking.room?.name || "ไม่ระบุห้อง"}
                </p>
                {booking.room?.capacity && (
                  <p className="text-[11px] text-text-secondary">
                    รองรับได้ {booking.room.capacity} ท่าน
                  </p>
                )}
              </div>
            </div>

            {/* Date & Time */}
            <div className="flex items-start gap-2.5">
              <div className="p-2 rounded-lg bg-primary-50 text-primary-600 shrink-0">
                <Calendar className="w-4 h-4" />
              </div>
              <div>
                <p className="text-[11px] font-medium text-text-muted">วันที่และเวลา</p>
                <p className="font-semibold text-text">
                  {formatThaiDateFull(startDate)}
                </p>
                <div className="flex items-center gap-1.5 text-[11px] text-text-secondary mt-0.5">
                  <Clock className="w-3 h-3 text-text-muted" />
                  <span>
                    {formatTime(startDate)} - {formatTime(endDate)} น. ({durationStr})
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Booker Information */}
          <div className="p-3.5 rounded-xl border border-border/80 space-y-2">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-text-muted flex items-center gap-1.5">
              <User className="w-3.5 h-3.5 text-primary-600" />
              <span>ข้อมูลผู้จอง</span>
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
              <div>
                <span className="text-text-muted">ชื่อ-นามสกุล: </span>
                <span className="font-medium text-text">
                  {booking.employee
                    ? `${booking.employee.firstname} ${booking.employee.lastname}`
                    : "ไม่ระบุ"}
                </span>
              </div>

              {booking.employee?.department && (
                <div>
                  <span className="text-text-muted">แผนก: </span>
                  <span className="font-medium text-text">
                    {booking.employee.department}
                  </span>
                </div>
              )}

              {booking.employee?.email && (
                <div className="flex items-center gap-1 text-text-secondary">
                  <Mail className="w-3 h-3 text-text-muted shrink-0" />
                  <span className="truncate">{booking.employee.email}</span>
                </div>
              )}

              {booking.employee?.phoneNumber && (
                <div className="flex items-center gap-1 text-text-secondary">
                  <Phone className="w-3 h-3 text-text-muted shrink-0" />
                  <span>{booking.employee.phoneNumber}</span>
                </div>
              )}
            </div>
          </div>

          {/* Participant count */}
          <div className="flex items-center justify-between p-3 rounded-xl border border-border/80 text-xs">
            <span className="text-text-secondary flex items-center gap-1.5 font-medium">
              <Users className="w-4 h-4 text-text-muted" />
              จำนวนผู้เข้าร่วมประชุม
            </span>
            <span className="font-bold text-text text-sm">
              {booking.participant} ท่าน
            </span>
          </div>

          {/* Note / Equipment / Agenda */}
          {booking.note && (
            <div className="p-3.5 rounded-xl border border-border/80 space-y-1.5">
              <p className="text-[11px] font-semibold uppercase tracking-wider text-text-muted flex items-center gap-1.5">
                <FileText className="w-3.5 h-3.5 text-primary-600" />
                <span>หมายเหตุ / ความต้องการเพิ่มเติม</span>
              </p>
              <p className="text-text-secondary text-xs leading-relaxed whitespace-pre-wrap">
                {booking.note}
              </p>
            </div>
          )}

          {/* Notice if viewing someone else's booking */}
          {!isOwner && !isApproverOrAdmin && !readOnly && (
            <div className="p-2.5 rounded-lg bg-surface-sunken border border-border text-[11px] text-text-muted flex items-center gap-2">
              <ShieldAlert className="w-4 h-4 text-text-muted shrink-0" />
              <span>
                คุณกำลังดูการจองของผู้อื่น การแก้ไขหรือยกเลิกสามารถทำได้เฉพาะผู้จองเท่านั้น
              </span>
            </div>
          )}

          {/* Confirm Cancel Warning Box */}
          {isConfirmingCancel && (
            <div className="p-3.5 rounded-xl bg-unavailable-50 border border-unavailable-200 text-unavailable-900 space-y-2 animate-fade-in">
              <p className="font-bold text-xs flex items-center gap-1.5 text-unavailable-700">
                <AlertCircle className="w-4 h-4 text-unavailable-600" />
                คุณแน่ใจหรือไม่ว่าต้องการยกเลิกการจองนี้?
              </p>
              <p className="text-[11px] text-unavailable-700">
                เมื่อยกเลิกแล้ว ช่วงเวลานี้จะว่างเพื่อให้ผู้อื่นสามารถจองห้องต่อได้
              </p>
              <div className="flex justify-end gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setIsConfirmingCancel(false)}
                  disabled={isCanceling}
                  className="px-3 py-1 rounded-lg bg-white border border-border text-xs font-medium text-text hover:bg-surface-sunken"
                >
                  ไม่ยกเลิก
                </button>
                <button
                  type="button"
                  onClick={handleCancelConfirm}
                  disabled={isCanceling}
                  className="px-3 py-1 rounded-lg bg-unavailable-600 hover:bg-unavailable-700 text-xs font-bold text-white shadow-xs"
                >
                  {isCanceling ? "กำลังยกเลิก..." : "ยืนยันยกเลิกการจอง"}
                </button>
              </div>
            </div>
          )}

          {/* Confirm Delete Warning Box */}
          {isConfirmingDelete && (
            <div className="p-3.5 rounded-xl bg-unavailable-50 border border-unavailable-200 text-unavailable-900 space-y-2 animate-fade-in">
              <p className="font-bold text-xs flex items-center gap-1.5 text-unavailable-700">
                <AlertCircle className="w-4 h-4 text-unavailable-600" />
                คุณแน่ใจหรือไม่ว่าต้องการลบรายการจองนี้ออกจากระบบ?
              </p>
              <p className="text-[11px] text-unavailable-700">
                ข้อมูลการจองจะถูกลบออกจากฐานข้อมูลอย่างถาวรและไม่สามารถกู้คืนได้
              </p>
              <div className="flex justify-end gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setIsConfirmingDelete(false)}
                  disabled={isDeleting}
                  className="px-3 py-1 rounded-lg bg-white border border-border text-xs font-medium text-text hover:bg-surface-sunken"
                >
                  ไม่ลบ
                </button>
                <button
                  type="button"
                  onClick={handleDeleteConfirm}
                  disabled={isDeleting}
                  className="px-3 py-1 rounded-lg bg-unavailable-600 hover:bg-unavailable-700 text-xs font-bold text-white shadow-xs"
                >
                  {isDeleting ? "กำลังลบ..." : "ยืนยันลบข้อมูล"}
                </button>
              </div>
            </div>
          )}

          {/* Confirm Reject Warning Box */}
          {isConfirmingReject && (
            <div className="p-3.5 rounded-xl bg-unavailable-50 border border-unavailable-200 text-unavailable-900 space-y-2 animate-fade-in">
              <p className="font-bold text-xs flex items-center gap-1.5 text-unavailable-700">
                <Ban className="w-4 h-4 text-unavailable-600" />
                ระบุเหตุผลที่ไม่อนุมัติ (ถ้ามี)
              </p>
              <input
                type="text"
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                placeholder="เช่น ห้องปิดปรับปรุง หรือ ชนกับการประชุมผู้บริหาร"
                className="w-full bg-white border border-border rounded-lg p-2 text-xs text-text focus:outline-none focus:ring-1 focus:ring-unavailable-500"
              />
              <div className="flex justify-end gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setIsConfirmingReject(false)}
                  disabled={isRejecting}
                  className="px-3 py-1 rounded-lg bg-white border border-border text-xs font-medium text-text hover:bg-surface-sunken"
                >
                  ยกเลิก
                </button>
                <button
                  type="button"
                  onClick={handleRejectConfirm}
                  disabled={isRejecting}
                  className="px-3 py-1 rounded-lg bg-unavailable-600 hover:bg-unavailable-700 text-xs font-bold text-white shadow-xs"
                >
                  {isRejecting ? "กำลังบันทึก..." : "ยืนยันไม่อนุมัติ"}
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="p-4 sm:p-5 border-t border-border/80 flex flex-wrap items-center justify-between gap-2 bg-surface-raised">
          <div className="flex flex-wrap items-center gap-2">
            {/* Approver / Admin Actions for PENDING bookings */}
            {isApproverOrAdmin && !readOnly && booking.status === "PENDING" && (
              <>
                <button
                  type="button"
                  onClick={handleApproveClick}
                  disabled={isApproving}
                  className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-available-600 hover:bg-available-700 text-white text-xs font-semibold shadow-xs transition-colors"
                >
                  <Check className="w-3.5 h-3.5" />
                  <span>{isApproving ? "กำลังอนุมัติ..." : "อนุมัติ"}</span>
                </button>

                <button
                  type="button"
                  onClick={() => setIsConfirmingReject(true)}
                  className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg border border-unavailable-400 text-unavailable-700 hover:bg-unavailable-50 text-xs font-medium transition-colors"
                >
                  <Ban className="w-3.5 h-3.5" />
                  <span>ไม่อนุมัติ</span>
                </button>
              </>
            )}

            {/* Owner Actions (Edit / Cancel) */}
            {isOwner && !readOnly && booking.status !== "CANCELED" && (
              <>
                <button
                  type="button"
                  onClick={() => setIsConfirmingCancel(true)}
                  className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg border border-unavailable-300 text-unavailable-700 hover:bg-unavailable-50 text-xs font-medium transition-colors"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>ยกเลิกการจอง</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    onEdit?.(booking);
                  }}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-primary-600 hover:bg-primary-700 text-white text-xs font-semibold shadow-xs transition-colors"
                >
                  <Edit className="w-3.5 h-3.5" />
                  <span>แก้ไขการจอง</span>
                </button>
              </>
            )}

            {/* Delete button (If booking is CANCELED or REJECTED, owner or admin can permanently delete it) */}
            {(isOwner || isApproverOrAdmin) && !readOnly && (booking.status === "CANCELED" || booking.status === "REJECTED") && onDelete && (
              <button
                type="button"
                onClick={() => setIsConfirmingDelete(true)}
                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg border border-border hover:border-unavailable-300 text-text-muted hover:text-unavailable-600 hover:bg-unavailable-50 text-xs font-medium transition-colors"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>ลบรายการจอง</span>
              </button>
            )}
          </div>

          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-lg bg-surface border border-border hover:bg-surface-sunken text-text text-xs sm:text-sm font-medium transition-colors"
          >
            ปิด
          </button>
        </div>
      </div>
    </div>
  );
};

export default BookingDetail;
