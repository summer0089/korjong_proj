"use client";

import React, { useState, useEffect, useMemo } from "react";
import {
  MeetingRoom,
  MeetingBooking,
  CurrentUser,
  MeetingRoomSchedulerProps,
} from "./types";
import { SchedulerToolbar } from "./SchedulerToolbar";
import { SchedulerGrid } from "./SchedulerGrid";
import { BookingDetail } from "./BookingDetail";
import { BookingForm } from "./BookingForm";
import { BookingLegend } from "./BookingLegend";

// Default Fallback Rooms if none provided
const DEFAULT_ROOMS: MeetingRoom[] = [
  {
    id: "room-1",
    name: "ห้องประชุมใหญ่ (Boardroom)",
    capacity: 20,
    location: "ชั้น 4 โซน A",
    facilities: ["Smart TV 75\"", "ระบบ Video Conference", "ไมค์รอบทิศทาง"],
  },
  {
    id: "room-2",
    name: "ห้องประชุม 1 (Innovation)",
    capacity: 10,
    location: "ชั้น 4 โซน B",
    facilities: ["Projector", "Whiteboard", "สาย HDMI / Type-C"],
  },
  {
    id: "room-3",
    name: "ห้องประชุม 2 (Creativity)",
    capacity: 8,
    location: "ชั้น 3 โซน C",
    facilities: ["TV 55\"", "Whiteboard"],
  },
  {
    id: "room-4",
    name: "ห้องประชุมย่อย (Focus Room)",
    capacity: 4,
    location: "ชั้น 3 โซน A",
    facilities: ["TV 43\"", "กระดานกระจก"],
  },
];

// Helper to create sample bookings for a given date
const createSampleBookings = (baseDate: Date, userId: string): MeetingBooking[] => {
  const y = baseDate.getFullYear();
  const m = baseDate.getMonth();
  const d = baseDate.getDate();

  return [
    {
      id: "booking-sample-1",
      topic: "Weekly Tech Sprint Planning",
      participant: 8,
      note: "เตรียมเอกสาร Roadmap Q4 และ Project Backlog",
      status: "APPROVED",
      startTime: new Date(y, m, d, 9, 0, 0).toISOString(),
      endTime: new Date(y, m, d, 10, 30, 0).toISOString(),
      roomId: "room-2",
      employeeId: userId,
      employee: {
        id: userId,
        firstname: "คุณ",
        lastname: "(บัญชีของฉัน)",
        department: "IT & Development",
        email: "user@example.com",
        phoneNumber: "081-234-5678",
      },
    },
    {
      id: "booking-sample-2",
      topic: "ประชุมคณะกรรมการบริหาร (Executive Meeting)",
      participant: 15,
      note: "ต้องการระบบ Zoom Conference และอาหารว่างช่วงเบรก",
      status: "APPROVED",
      startTime: new Date(y, m, d, 10, 0, 0).toISOString(),
      endTime: new Date(y, m, d, 12, 0, 0).toISOString(),
      roomId: "room-1",
      employeeId: "emp-other-1",
      employee: {
        id: "emp-other-1",
        firstname: "วิภา",
        lastname: "เจริญสุข",
        department: "Management",
        email: "wipha@example.com",
        phoneNumber: "089-111-2233",
      },
    },
    {
      id: "booking-sample-3",
      topic: "Marketing Strategy 2027",
      participant: 6,
      note: "เปิดตัวแคมเปญใหม่สำหรับไตรมาสถัดไป",
      status: "PENDING",
      startTime: new Date(y, m, d, 13, 30, 0).toISOString(),
      endTime: new Date(y, m, d, 15, 0, 0).toISOString(),
      roomId: "room-3",
      employeeId: "emp-other-2",
      employee: {
        id: "emp-other-2",
        firstname: "อานนท์",
        lastname: "วงศ์สว่าง",
        department: "Marketing",
        email: "arnon@example.com",
        phoneNumber: "086-555-6677",
      },
    },
    {
      id: "booking-sample-4",
      topic: "1-on-1 Performance Check-in",
      participant: 2,
      note: "การประเมินผลงานรอบครึ่งปี",
      status: "APPROVED",
      startTime: new Date(y, m, d, 15, 0, 0).toISOString(),
      endTime: new Date(y, m, d, 16, 0, 0).toISOString(),
      roomId: "room-4",
      employeeId: userId,
      employee: {
        id: userId,
        firstname: "คุณ",
        lastname: "(บัญชีของฉัน)",
        department: "IT & Development",
        email: "user@example.com",
        phoneNumber: "081-234-5678",
      },
    },
    {
      id: "booking-sample-5",
      topic: "Customer Demo & Onboarding",
      participant: 5,
      note: "เตรียมสาธิตระบบผ่าน Projector",
      status: "CANCELED",
      startTime: new Date(y, m, d, 16, 30, 0).toISOString(),
      endTime: new Date(y, m, d, 17, 30, 0).toISOString(),
      roomId: "room-2",
      employeeId: "emp-other-3",
      employee: {
        id: "emp-other-3",
        firstname: "ณัฐพงษ์",
        lastname: "พิทักษ์",
        department: "Sales",
        email: "nattapong@example.com",
        phoneNumber: "084-999-8877",
      },
    },
  ];
};

export const MeetingRoomScheduler: React.FC<MeetingRoomSchedulerProps> = ({
  rooms: propRooms,
  bookings: propBookings,
  currentUser: propCurrentUser,
  initialDate,
  startHour = 8,
  endHour = 18,
  slotIntervalMinutes = 30,
  readOnly = false,
  onAddBooking,
  onUpdateBooking,
  onCancelBooking,
  className = "",
}) => {
  // Session / User State
  const [currentUser, setCurrentUser] = useState<CurrentUser | null>(
    propCurrentUser || null
  );

  // Auto-fetch session if currentUser was not provided
  useEffect(() => {
    if (propCurrentUser !== undefined) {
      setCurrentUser(propCurrentUser);
      return;
    }

    const fetchSession = async () => {
      try {
        const res = await fetch("/api/auth/session");
        if (res.ok) {
          const json = await res.json();
          if (json.isLoggedIn && json.user) {
            setCurrentUser({
              id: json.user.id,
              firstname: json.user.firstname,
              lastname: json.user.lastname,
              email: json.user.email,
              department: json.user.department,
              role: json.user.role,
            });
          }
        }
      } catch {
        // Ignore fallback
      }
    };

    fetchSession();
  }, [propCurrentUser]);

  // Current selected date
  const [currentDate, setCurrentDate] = useState<Date>(() => {
    if (!initialDate) return new Date();
    return initialDate instanceof Date ? initialDate : new Date(initialDate);
  });

  // Rooms State
  const [rooms, setRooms] = useState<MeetingRoom[]>(propRooms || DEFAULT_ROOMS);

  // If propRooms changes or was not passed, load from API if empty
  useEffect(() => {
    if (propRooms && propRooms.length > 0) {
      setRooms(propRooms);
      return;
    }

    const loadRoomsFromApi = async () => {
      try {
        const res = await fetch("/api/meeting-room/get");
        if (res.ok) {
          const json = await res.json();
          if (json.success && Array.isArray(json.data) && json.data.length > 0) {
            setRooms(json.data);
          }
        }
      } catch {
        // Keep DEFAULT_ROOMS
      }
    };

    loadRoomsFromApi();
  }, [propRooms]);

  // Bookings State (self-managed fallback with demo data)
  const [internalBookings, setInternalBookings] = useState<MeetingBooking[]>(() => {
    if (propBookings) return propBookings;
    const defaultUserId = currentUser?.id || "my-user-id";
    return createSampleBookings(new Date(), defaultUserId);
  });

  // Fetch real bookings from database
  const loadBookingsFromApi = async () => {
    if (propBookings) return;
    try {
      const res = await fetch("/api/booking/get");
      if (res.ok) {
        const json = await res.json();
        if (json.success && Array.isArray(json.data) && json.data.length > 0) {
          setInternalBookings(json.data);
        }
      }
    } catch (e) {
      console.error("Error loading bookings from API:", e);
    }
  };

  // Sync propBookings or load from DB
  useEffect(() => {
    if (propBookings) {
      setInternalBookings(propBookings);
    } else {
      loadBookingsFromApi();
    }
  }, [propBookings]);

  // Active bookings pool
  const allBookings = propBookings || internalBookings;

  // Filter States
  const [search, setSearch] = useState("");
  const [selectedRoomId, setSelectedRoomId] = useState("ALL");
  const [selectedStatus, setSelectedStatus] = useState("APPROVED_PENDING");

  // Filtered Rooms
  const filteredRooms = useMemo(() => {
    if (selectedRoomId === "ALL") return rooms;
    return rooms.filter((r) => r.id === selectedRoomId);
  }, [rooms, selectedRoomId]);

  // Filtered Bookings
  const filteredBookings = useMemo(() => {
    return allBookings.filter((booking) => {
      // Room filter
      if (selectedRoomId !== "ALL" && booking.roomId !== selectedRoomId) {
        return false;
      }

      // Status filter: by default show APPROVED and PENDING to avoid cluttering with canceled/rejected
      if (selectedStatus === "APPROVED_PENDING") {
        if (booking.status !== "APPROVED" && booking.status !== "PENDING") {
          return false;
        }
      } else if (selectedStatus !== "ALL" && booking.status !== selectedStatus) {
        return false;
      }

      // Search query (topic, note, booker name, department)
      if (search.trim()) {
        const q = search.toLowerCase();
        const topicMatch = booking.topic.toLowerCase().includes(q);
        const noteMatch = (booking.note || "").toLowerCase().includes(q);
        const bookerMatch = booking.employee
          ? `${booking.employee.firstname} ${booking.employee.lastname}`
              .toLowerCase()
              .includes(q)
          : false;
        const deptMatch = booking.employee?.department
          ? booking.employee.department.toLowerCase().includes(q)
          : false;

        if (!topicMatch && !noteMatch && !bookerMatch && !deptMatch) {
          return false;
        }
      }

      return true;
    });
  }, [allBookings, selectedRoomId, selectedStatus, search]);

  // Modal States
  const [selectedBooking, setSelectedBooking] = useState<MeetingBooking | null>(
    null
  );
  const [isDetailOpen, setIsDetailOpen] = useState(false);

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingBooking, setEditingBooking] = useState<MeetingBooking | null>(null);
  const [initialSelection, setInitialSelection] = useState<{
    roomId: string;
    startTime: Date;
    endTime: Date;
  } | null>(null);

  // Handlers for Detail Modal
  const handleOpenDetail = (booking: MeetingBooking) => {
    // Populate with room object if missing
    const enrichedBooking = {
      ...booking,
      room: booking.room || rooms.find((r) => r.id === booking.roomId),
    };
    setSelectedBooking(enrichedBooking);
    setIsDetailOpen(true);
  };

  const handleCloseDetail = () => {
    setIsDetailOpen(false);
    setSelectedBooking(null);
  };

  // Handler for adding a new booking button
  const handleOpenAddForm = () => {
    if (readOnly) return;
    setEditingBooking(null);
    setInitialSelection(null);
    setIsFormOpen(true);
  };

  // Handler for drag-to-select range or slot click
  const handleSelectTimeRange = (selection: {
    roomId: string;
    startTime: Date;
    endTime: Date;
  }) => {
    if (readOnly) return;
    setEditingBooking(null);
    setInitialSelection(selection);
    setIsFormOpen(true);
  };

  // Handler for editing an existing booking
  const handleOpenEditForm = (booking: MeetingBooking) => {
    if (readOnly) return;
    setEditingBooking(booking);
    setInitialSelection(null);
    setIsFormOpen(true);
  };

  // Handler for Submitting Booking Form (Create / Edit)
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

    const targetRoom = rooms.find((r) => r.id === formData.roomId);

    if (editingBooking) {
      // Edit mode: Call PUT /api/booking/update
      let updatedBookingData: MeetingBooking;
      try {
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
        updatedBookingData = result.data;
      } catch (err: any) {
        if (onUpdateBooking) {
          await onUpdateBooking(editingBooking.id, {
            topic: formData.topic,
            roomId: formData.roomId,
            room: targetRoom,
            startTime: start.toISOString(),
            endTime: end.toISOString(),
            participant: formData.participant,
            note: formData.note,
          });
        }
        throw err;
      }

      setInternalBookings((prev) =>
        prev.map((b) => (b.id === editingBooking.id ? updatedBookingData : b))
      );
    } else {
      // Create mode: Call POST /api/booking/new
      let newBookingData: MeetingBooking;
      try {
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
        newBookingData = result.data;
      } catch (err: any) {
        if (onAddBooking) {
          await onAddBooking({
            topic: formData.topic,
            roomId: formData.roomId,
            room: targetRoom,
            startTime: start.toISOString(),
            endTime: end.toISOString(),
            participant: formData.participant,
            note: formData.note,
            status: "PENDING",
            employeeId: currentUser?.id || "my-user-id",
          });
        }
        throw err;
      }

      setInternalBookings((prev) => [...prev, newBookingData]);
    }

    // Switch currentDate to the booked/edited date so user sees their booking immediately
    setCurrentDate(new Date(formData.date));
  };

  // Handler for Canceling a booking
  const handleCancelBooking = async (bookingId: string) => {
    try {
      const res = await fetch("/api/booking/cancel", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: bookingId }),
      });
      const result = await res.json();
      if (result.success && result.data) {
        setInternalBookings((prev) =>
          prev.map((b) => (b.id === bookingId ? result.data : b))
        );
        return;
      }
    } catch {
      // fallback
    }

    if (onCancelBooking) {
      await onCancelBooking(bookingId);
    }

    setInternalBookings((prev) =>
      prev.map((b) =>
        b.id === bookingId
          ? { ...b, status: "CANCELED", updatedAt: new Date().toISOString() }
          : b
      )
    );
  };

  // Handler for Deleting a booking permanently
  const handleDeleteBooking = async (bookingId: string) => {
    try {
      const res = await fetch(`/api/booking/delete?id=${bookingId}`, {
        method: "DELETE",
      });
      const result = await res.json();
      if (result.success) {
        setInternalBookings((prev) => prev.filter((b) => b.id !== bookingId));
        return;
      }
    } catch {
      // fallback
    }
    setInternalBookings((prev) => prev.filter((b) => b.id !== bookingId));
  };

  // Handler for Approving a booking
  const handleApproveBooking = async (bookingId: string) => {
    try {
      const res = await fetch("/api/booking/status/approve", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: bookingId }),
      });
      const result = await res.json();
      if (result.success && result.data) {
        setInternalBookings((prev) =>
          prev.map((b) => (b.id === bookingId ? result.data : b))
        );
      }
    } catch (e) {
      console.error("Approve booking error:", e);
    }
  };

  // Handler for Rejecting a booking
  const handleRejectBooking = async (bookingId: string, reason?: string) => {
    try {
      const res = await fetch("/api/booking/status/reject", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: bookingId, reason }),
      });
      const result = await res.json();
      if (result.success && result.data) {
        setInternalBookings((prev) =>
          prev.map((b) => (b.id === bookingId ? result.data : b))
        );
      }
    } catch (e) {
      console.error("Reject booking error:", e);
    }
  };

  return (
    <div className={`w-full space-y-3.5 select-none ${className}`}>
      {/* 1. Scheduler Toolbar */}
      <SchedulerToolbar
        currentDate={currentDate}
        onDateChange={setCurrentDate}
        search={search}
        onSearchChange={setSearch}
        rooms={rooms}
        selectedRoomId={selectedRoomId}
        onRoomChange={setSelectedRoomId}
        selectedStatus={selectedStatus}
        onStatusChange={setSelectedStatus}
        onOpenAddModal={handleOpenAddForm}
        readOnly={readOnly}
      />

      {/* 2. Scheduler Grid (Y = Time, X = Rooms) */}
      <SchedulerGrid
        currentDate={currentDate}
        rooms={filteredRooms}
        bookings={filteredBookings}
        currentUserId={currentUser?.id || "my-user-id"}
        startHour={startHour}
        endHour={endHour}
        slotIntervalMinutes={slotIntervalMinutes}
        readOnly={readOnly}
        onSelectBooking={handleOpenDetail}
        onSelectTimeRange={handleSelectTimeRange}
      />

      {/* 3. Booking Legend */}
      <BookingLegend readOnly={readOnly} />

      {/* 4. Booking Detail Modal */}
      <BookingDetail
        booking={selectedBooking}
        isOpen={isDetailOpen}
        onClose={handleCloseDetail}
        onEdit={handleOpenEditForm}
        onCancel={handleCancelBooking}
        onDelete={handleDeleteBooking}
        onApprove={handleApproveBooking}
        onReject={handleRejectBooking}
        currentUserId={currentUser?.id || "my-user-id"}
        currentUserRole={currentUser?.role}
        readOnly={readOnly}
      />

      {/* 5. Booking Form Modal (Add & Edit) */}
      <BookingForm
        isOpen={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        onSubmit={handleFormSubmit}
        rooms={rooms}
        existingBookings={allBookings}
        initialBooking={editingBooking}
        initialSelection={initialSelection}
        defaultDate={(() => {
          const today = new Date();
          today.setHours(0, 0, 0, 0);
          const cur = new Date(currentDate);
          cur.setHours(0, 0, 0, 0);
          return cur < today ? new Date() : currentDate;
        })()}
      />
    </div>
  );
};

export default MeetingRoomScheduler;
