"use client";

import React, { useState, useEffect, useCallback } from "react";
import { CheckCircle, Clock3, RotateCcw, ShieldCheck, AlertCircle } from "lucide-react";
import ItemList from "@/components/form_controls/ItemList";
import BookingDetail from "@/components/scheduler/BookingDetail";
import { MeetingBooking } from "@/components/scheduler/types";

export default function ApproveListPage() {
  const [bookings, setBookings] = useState<MeetingBooking[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Detail Modal State
  const [selectedBooking, setSelectedBooking] = useState<MeetingBooking | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);

  // Fetch pending bookings from API
  const fetchPendingBookings = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await fetch("/api/booking/get/status?status=PENDING");
      if (!res.ok) {
        throw new Error("ไม่สามารถดึงข้อมูลคำขอจองห้องประชุมได้");
      }
      const json = await res.json();
      if (json.success && Array.isArray(json.data)) {
        setBookings(json.data);
      } else {
        setBookings([]);
      }
    } catch (err: any) {
      console.error("fetchPendingBookings error:", err);
      setError(err?.message || "เกิดข้อผิดพลาดในการโหลดข้อมูล");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPendingBookings();
  }, [fetchPendingBookings]);

  // Handler for Approving
  const handleApprove = async (item: MeetingBooking) => {
    try {
      const res = await fetch("/api/booking/status/approve", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: item.id }),
      });
      const json = await res.json();
      if (!json.success) {
        alert(json.message || "เกิดข้อผิดพลาดในการอนุมัติ");
        return;
      }
      // Remove from pending list
      setBookings((prev) => prev.filter((b) => b.id !== item.id));
    } catch (e: any) {
      alert(e?.message || "เกิดข้อผิดพลาดในการเชื่อมต่อ");
    }
  };

  // Handler for Rejecting
  const handleReject = async (item: MeetingBooking, reason?: string) => {
    try {
      const res = await fetch("/api/booking/status/reject", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: item.id, reason }),
      });
      const json = await res.json();
      if (!json.success) {
        alert(json.message || "เกิดข้อผิดพลาดในการปฏิเสธคำขอ");
        return;
      }
      // Remove from pending list
      setBookings((prev) => prev.filter((b) => b.id !== item.id));
    } catch (e: any) {
      alert(e?.message || "เกิดข้อผิดพลาดในการเชื่อมต่อ");
    }
  };

  const handleOpenDetail = (item: MeetingBooking) => {
    setSelectedBooking(item);
    setIsDetailOpen(true);
  };

  const handleCloseDetail = () => {
    setSelectedBooking(null);
    setIsDetailOpen(false);
  };

  return (
    <main className="min-h-screen bg-surface-raised py-6 sm:py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Page Top Stat Banner */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-surface p-4 sm:p-5 rounded-2xl border border-border shadow-xs flex items-center gap-3.5">
            <div className="p-3 rounded-xl bg-pending-100 text-pending-700">
              <Clock3 className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs font-semibold text-text-muted">คำขอรอการอนุมัติ</p>
              <h2 className="text-2xl font-bold text-text mt-0.5">{bookings.length} รายการ</h2>
            </div>
          </div>

          <div className="bg-surface p-4 sm:p-5 rounded-2xl border border-border shadow-xs flex items-center gap-3.5">
            <div className="p-3 rounded-xl bg-primary-100 text-primary-700">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs font-semibold text-text-muted">สิทธิ์ผู้อนุมัติ</p>
              <p className="text-sm font-bold text-text mt-0.5">Admin / Approver</p>
            </div>
          </div>

          <div className="bg-surface p-4 sm:p-5 rounded-2xl border border-border shadow-xs flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-text-muted">รีเฟรชข้อมูล</p>
              <p className="text-xs text-text-secondary mt-0.5">ดึงประวัติล่าสุด</p>
            </div>
            <button
              type="button"
              onClick={fetchPendingBookings}
              disabled={loading}
              className="p-2.5 rounded-xl border border-border hover:bg-surface-sunken text-text-secondary hover:text-text transition-colors"
              title="รีเฟรชข้อมูล"
            >
              <RotateCcw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
            </button>
          </div>
        </div>

        {/* Error Alert if any */}
        {error && (
          <div className="p-4 rounded-xl bg-unavailable-50 border border-unavailable-200 text-unavailable-900 flex items-center gap-2.5">
            <AlertCircle className="w-5 h-5 text-unavailable-600 shrink-0" />
            <span className="text-sm">{error}</span>
          </div>
        )}

        {/* ItemList for Approval */}
        <ItemList
          items={bookings}
          loading={loading}
          title="รายการคำขอจองห้องประชุมที่รอการอนุมัติ"
          subtitle="ตรวจสอบและดำเนินการอนุมัติหรือไม่อนุมัติคำขอจองห้องประชุมจากพนักงาน"
          searchPlaceholder="ค้นหาหัวข้อการประชุม, ผู้ขอจอง, หรือห้องประชุม..."
          statusFilterable={false}
          emptyTitle="ไม่มีคำขอจองที่รอการอนุมัติ"
          emptyDescription="ทุกคำขอจองได้รับการพิจารณาเรียบร้อยแล้ว หรือยังไม่มีคำขอใหม่เข้ามา"
          onApprove={handleApprove}
          onReject={handleReject}
          onViewDetails={handleOpenDetail}
        />

        {/* Booking Detail Modal */}
        <BookingDetail
          booking={selectedBooking}
          isOpen={isDetailOpen}
          onClose={handleCloseDetail}
          onApprove={async (id) => {
            const item = bookings.find((b) => b.id === id);
            if (item) await handleApprove(item);
            handleCloseDetail();
          }}
          onReject={async (id, reason) => {
            const item = bookings.find((b) => b.id === id);
            if (item) await handleReject(item, reason);
            handleCloseDetail();
          }}
          currentUserRole="APPROVER"
        />
      </div>
    </main>
  );
}