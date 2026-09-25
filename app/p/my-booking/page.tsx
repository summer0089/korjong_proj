"use client";

import { useState, useEffect, useCallback } from "react";
import { Calendar, Clock, CheckCircle2, RotateCcw, AlertCircle, PlusCircle } from "lucide-react";
import ItemList from "@/components/form_controls/ItemList";
import BookingDetail from "@/components/scheduler/BookingDetail";
import BookingForm from "@/components/scheduler/BookingForm";
import { MeetingBooking, MeetingRoom, CurrentUser } from "@/components/scheduler/types";

export default function MyBookingPage() {
  const [bookings, setBookings] = useState<MeetingBooking[]>([]);
  const [rooms, setRooms] = useState<MeetingRoom[]>([]);
  const [currentUser, setCurrentUser] = useState<CurrentUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Modal States
  const [selectedBooking, setSelectedBooking] = useState<MeetingBooking | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingBooking, setEditingBooking] = useState<MeetingBooking | null>(null);

  // 1. Fetch Session
  useEffect(() => {
    const fetchSession = async () => {
      try {
        const res = await fetch("/api/auth/session");
        if (res.ok) {
          const json = await res.json();
          if (json.isLoggedIn && json.user) {
            setCurrentUser(json.user);
          }
        }
      } catch {
        // ignore
      }
    };
    fetchSession();
  }, []);

  // 2. Fetch Rooms
  useEffect(() => {
    const fetchRooms = async () => {
      try {
        const res = await fetch("/api/meeting-room/get");
        if (res.ok) {
          const json = await res.json();
          if (json.success && Array.isArray(json.data)) {
            setRooms(json.data);
          }
        }
      } catch {
        // ignore
      }
    };
    fetchRooms();
  }, []);

  // 3. Fetch My Bookings from API /api/booking/get/by-user-id
  const fetchMyBookings = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await fetch("/api/booking/get/by-user-id");
      if (!res.ok) {
        throw new Error("ไม่สามารถดึงข้อมูลประวัติการจองได้");
      }
      const json = await res.json();
      if (json.success && Array.isArray(json.data)) {
        setBookings(json.data);
      } else {
        setBookings([]);
      }
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (err: any) {
      console.error("fetchMyBookings error:", err);
      setError(err?.message || "เกิดข้อผิดพลาดในการโหลดข้อมูล");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchMyBookings();
  }, [fetchMyBookings]);

  // Handler for adding/editing booking
  const handleFormSubmit = async (formData: {
    topic: string;
    roomId: string;
    date: Date;
    startTime: string;
    endTime: string;
    participant: number;
    note: string;
  }) => {
    const [sh, sm] = formData.startTime.split(":").map(Number);
    const [eh, em] = formData.endTime.split(":").map(Number);

    const start = new Date(formData.date);
    start.setHours(sh, sm, 0, 0);

    const end = new Date(formData.date);
    end.setHours(eh, em, 0, 0);

    if (editingBooking) {
      // Edit mode: Call PUT /api/booking/update
      const res = await fetch("/api/booking/update", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: editingBooking.id,
          topic: formData.topic,
          roomId: formData.roomId,
          startTime: start.toISOString(),
          endTime: end.toISOString(),
          participant: formData.participant,
          note: formData.note,
        }),
      });
      const result = await res.json();
      if (!result.success) {
        throw new Error(result.message || "ไม่สามารถแก้ไขการจองได้");
      }
      if (result.data) {
        setBookings((prev) =>
          prev.map((b) => (b.id === editingBooking.id ? result.data : b))
        );
      }
    } else {
      // Create mode: Call POST /api/booking/new
      const res = await fetch("/api/booking/new", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          topic: formData.topic,
          roomId: formData.roomId,
          startTime: start.toISOString(),
          endTime: end.toISOString(),
          participant: formData.participant,
          note: formData.note,
          employeeId: currentUser?.id,
        }),
      });
      const result = await res.json();
      if (!result.success) {
        throw new Error(result.message || "ไม่สามารถจองห้องประชุมได้");
      }
      if (result.data) {
        setBookings((prev) => [result.data, ...prev]);
      }
    }
  };

  // Handler for Canceling
  const handleCancel = async (item: MeetingBooking, reason?: string) => {
    try {
      const res = await fetch("/api/booking/cancel", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: item.id, reason }),
      });
      const json = await res.json();
      if (!json.success) {
        alert(json.message || "เกิดข้อผิดพลาดในการยกเลิก");
        return;
      }
      if (json.data) {
        setBookings((prev) =>
          prev.map((b) => (b.id === item.id ? json.data : b))
        );
      } else {
        setBookings((prev) =>
          prev.map((b) => (b.id === item.id ? { ...b, status: "CANCELED" } : b))
        );
      }
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (e: any) {
      alert(e?.message || "เกิดข้อผิดพลาดในการเชื่อมต่อ");
    }
  };

  // Handler for Deleting
  const handleDelete = async (item: MeetingBooking) => {
    try {
      const res = await fetch(`/api/booking/delete?id=${item.id}`, {
        method: "DELETE",
      });
      const json = await res.json();
      if (!json.success) {
        alert(json.message || "เกิดข้อผิดพลาดในการลบรายการ");
        return;
      }
      setBookings((prev) => prev.filter((b) => b.id !== item.id));
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (e: any) {
      alert(e?.message || "เกิดข้อผิดพลาดในการเชื่อมต่อ");
    }
  };

  // Open Edit Form
  const handleOpenEdit = (item: MeetingBooking) => {
    setEditingBooking(item);
    setIsFormOpen(true);
  };

  // Open Add Form
  const handleOpenAdd = () => {
    setEditingBooking(null);
    setIsFormOpen(true);
  };

  // Open Detail Modal
  const handleOpenDetail = (item: MeetingBooking) => {
    setSelectedBooking(item);
    setIsDetailOpen(true);
  };

  // Counts for Stats
  const totalCount = bookings.length;
  const pendingCount = bookings.filter((b) => b.status === "PENDING").length;
  const approvedCount = bookings.filter((b) => b.status === "APPROVED").length;

  return (
    <main className="min-h-screen bg-surface-raised py-6 sm:py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Top Summary Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
          <div className="bg-surface p-4 sm:p-5 rounded-2xl border border-border shadow-xs flex items-center gap-3.5">
            <div className="p-3 rounded-xl bg-primary-100 text-primary-700">
              <Calendar className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs font-semibold text-text-muted">การจองทั้งหมด</p>
              <h3 className="text-xl font-bold text-text mt-0.5">{totalCount} รายการ</h3>
            </div>
          </div>

          <div className="bg-surface p-4 sm:p-5 rounded-2xl border border-border shadow-xs flex items-center gap-3.5">
            <div className="p-3 rounded-xl bg-pending-100 text-pending-700">
              <Clock className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs font-semibold text-text-muted">รอการอนุมัติ</p>
              <h3 className="text-xl font-bold text-text mt-0.5">{pendingCount} รายการ</h3>
            </div>
          </div>

          <div className="bg-surface p-4 sm:p-5 rounded-2xl border border-border shadow-xs flex items-center gap-3.5">
            <div className="p-3 rounded-xl bg-available-100 text-available-700">
              <CheckCircle2 className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs font-semibold text-text-muted">อนุมัติแล้ว</p>
              <h3 className="text-xl font-bold text-text mt-0.5">{approvedCount} รายการ</h3>
            </div>
          </div>

          <div className="bg-surface p-4 sm:p-5 rounded-2xl border border-border shadow-xs flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-text-muted">รีเฟรชข้อมูล</p>
              <p className="text-xs text-text-secondary mt-0.5">ดึงประวัติล่าสุด</p>
            </div>
            <button
              type="button"
              onClick={fetchMyBookings}
              disabled={loading}
              className="p-2.5 rounded-xl border border-border hover:bg-surface-sunken text-text-secondary hover:text-text transition-colors cursor-pointer"
              title="รีเฟรชประวัติ"
            >
              <RotateCcw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
            </button>
          </div>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="p-4 rounded-xl bg-unavailable-50 border border-unavailable-200 text-unavailable-900 flex items-center gap-2.5">
            <AlertCircle className="w-5 h-5 text-unavailable-600 shrink-0" />
            <span className="text-sm">{error}</span>
          </div>
        )}

        {/* ItemList with Add / Edit / Cancel / Delete Support */}
        <ItemList
          items={bookings}
          loading={loading}
          title="รายการคำร้องและการจองห้องประชุมของฉัน"
          subtitle="ตรวจสอบสถานะการอนุมัติ จัดการแก้ไข หรือยกเลิกการจองห้องประชุมของคุณ"
          searchPlaceholder="ค้นหาหัวข้อ, ชื่อห้องประชุม, หมายเหตุ..."
          statusFilterable={true}
          emptyTitle="ยังไม่มีประวัติการจองห้องประชุม"
          emptyDescription="คุณยังไม่เคยทำการจองห้องประชุมในระบบ คลิกปุ่มด้านล่างเพื่อเริ่มจองห้องประชุมใหม่ได้ทันที"
          currentUserId={currentUser?.id}
          headerActions={
            <button
              type="button"
              onClick={handleOpenAdd}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-primary-600 hover:bg-primary-700 text-white font-semibold text-xs sm:text-sm shadow-sm transition-all focus:outline-none focus:ring-2 focus:ring-primary-500 cursor-pointer"
            >
              <PlusCircle className="w-4 h-4" />
              <span>+ จองห้องประชุมใหม่</span>
            </button>
          }
          onEdit={handleOpenEdit}
          onCancel={handleCancel}
          onDelete={handleDelete}
          onViewDetails={handleOpenDetail}
        />

        {/* Booking Detail Modal */}
        <BookingDetail
          booking={selectedBooking}
          isOpen={isDetailOpen}
          onClose={() => {
            setSelectedBooking(null);
            setIsDetailOpen(false);
          }}
          onEdit={(item) => {
            setSelectedBooking(null);
            setIsDetailOpen(false);
            handleOpenEdit(item);
          }}
          onCancel={async (id) => {
            const item = bookings.find((b) => b.id === id);
            if (item) await handleCancel(item);
            setSelectedBooking(null);
            setIsDetailOpen(false);
          }}
          onDelete={async (id) => {
            const item = bookings.find((b) => b.id === id);
            if (item) await handleDelete(item);
            setSelectedBooking(null);
            setIsDetailOpen(false);
          }}
          currentUserId={currentUser?.id}
          currentUserRole={currentUser?.role}
        />

        {/* Booking Form Modal for Add / Edit */}
        <BookingForm
          isOpen={isFormOpen}
          onClose={() => {
            setIsFormOpen(false);
            setEditingBooking(null);
          }}
          onSubmit={handleFormSubmit}
          rooms={rooms}
          existingBookings={bookings}
          initialBooking={editingBooking}
          defaultDate={new Date()}
        />
      </div>
    </main>
  );
}
