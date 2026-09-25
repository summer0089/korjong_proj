"use client";

import React, { useState, useEffect, useMemo, useCallback } from "react";
import Link from "next/link";
import {
  BarChart3,
  Calendar,
  Clock,
  Users,
  Building2,
  TrendingUp,
  DoorClosed,
  Clock3,
  FileSpreadsheet,
  RefreshCw,
  Trophy,
  Activity,
  Layers,
  Sparkles,
  ArrowRight,
  Filter,
} from "lucide-react";

interface MeetingRoom {
  id: string;
  name: string;
  capacity: number;
}

interface Department {
  id: string;
  name: string;
}

interface BookingRecord {
  id: string;
  topic: string;
  participant: number;
  note?: string;
  status: "PENDING" | "APPROVED" | "CANCELED" | "REJECTED";
  startTime: string;
  endTime: string;
  createdAt: string;
  employeeId: string;
  roomId: string;
  room?: {
    id: string;
    name: string;
    capacity: number;
  };
  employee?: {
    id: string;
    firstname: string;
    lastname: string;
    email: string;
    department?: string;
    position?: string;
    phoneNumber?: string;
    profileImage?: string | null;
  };
}

const THAI_MONTHS_SHORT = [
  "ม.ค.", "ก.พ.", "มี.ค.", "เม.ย.", "พ.ค.", "มิ.ย.",
  "ก.ค.", "ส.ค.", "ก.ย.", "ต.ค.", "พ.ย.", "ธ.ค."
];

const WEEKDAY_NAMES = [
  "อาทิตย์", "จันทร์", "อังคาร", "พุธ", "พฤหัสบดี", "ศุกร์", "เสาร์"
];

const PRESET_RANGES = [
  { id: "30D", label: "30 วันล่าสุด" },
  { id: "7D", label: "7 วันล่าสุด" },
  { id: "THIS_MONTH", label: "เดือนนี้" },
  { id: "LAST_MONTH", label: "เดือนที่แล้ว" },
  { id: "THIS_YEAR", label: "ปีนี้" },
  { id: "ALL", label: "ทั้งหมด" },
];

export default function UsageReportPage() {
  const [bookings, setBookings] = useState<BookingRecord[]>([]);
  const [rooms, setRooms] = useState<MeetingRoom[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [selectedRange, setSelectedRange] = useState<string>("ALL");
  const [selectedRoomId, setSelectedRoomId] = useState<string>("ALL");
  const [selectedDept, setSelectedDept] = useState<string>("ALL");
  const [customStartDate, setCustomStartDate] = useState<string>("");
  const [customEndDate, setCustomEndDate] = useState<string>("");

  // 1. Fetch Rooms & Departments
  useEffect(() => {
    const fetchMetadata = async () => {
      try {
        const [roomsRes, deptsRes] = await Promise.all([
          fetch("/api/meeting-room/get"),
          fetch("/api/department/get"),
        ]);
        if (roomsRes.ok) {
          const rJson = await roomsRes.json();
          if (rJson.success && Array.isArray(rJson.data)) setRooms(rJson.data);
        }
        if (deptsRes.ok) {
          const dJson = await deptsRes.json();
          if (dJson.success && Array.isArray(dJson.data)) setDepartments(dJson.data);
        }
      } catch (err) {
        console.error("Error fetching rooms/departments:", err);
      }
    };
    fetchMetadata();
  }, []);

  // 2. Fetch All Bookings
  const fetchBookings = useCallback(async (isManualRefresh = false) => {
    try {
      if (isManualRefresh) setRefreshing(true);
      else setLoading(true);
      setError(null);

      const res = await fetch("/api/booking/get");
      if (!res.ok) {
        throw new Error("ไม่สามารถดึงข้อมูลรายงานการจองได้");
      }
      const json = await res.json();
      if (json.success && Array.isArray(json.data)) {
        setBookings(json.data);
      } else {
        setBookings([]);
      }
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (err: any) {
      console.error("fetchBookings error:", err);
      setError(err?.message || "เกิดข้อผิดพลาดในการโหลดข้อมูล");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchBookings();
  }, [fetchBookings]);

  // 3. Filter Bookings by Selected Range & Criteria
  const filteredBookings = useMemo(() => {
    const now = new Date();

    return bookings.filter((b) => {
      const bDate = new Date(b.startTime);

      // Date Range Filtering
      if (selectedRange === "7D") {
        const past = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        if (bDate < past) return false;
      } else if (selectedRange === "30D") {
        const past = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        if (bDate < past) return false;
      } else if (selectedRange === "THIS_MONTH") {
        if (
          bDate.getFullYear() !== now.getFullYear() ||
          bDate.getMonth() !== now.getMonth()
        )
          return false;
      } else if (selectedRange === "LAST_MONTH") {
        const lastMonth = now.getMonth() === 0 ? 11 : now.getMonth() - 1;
        const targetYear = now.getMonth() === 0 ? now.getFullYear() - 1 : now.getFullYear();
        if (
          bDate.getFullYear() !== targetYear ||
          bDate.getMonth() !== lastMonth
        )
          return false;
      } else if (selectedRange === "THIS_YEAR") {
        if (bDate.getFullYear() !== now.getFullYear()) return false;
      } else if (selectedRange === "CUSTOM") {
        if (customStartDate) {
          const s = new Date(customStartDate).getTime();
          if (new Date(b.endTime).getTime() < s) return false;
        }
        if (customEndDate) {
          const e = new Date(customEndDate);
          e.setHours(23, 59, 59, 999);
          if (bDate.getTime() > e.getTime()) return false;
        }
      }

      // Room Filtering
      if (selectedRoomId !== "ALL" && b.roomId !== selectedRoomId) {
        return false;
      }

      // Department Filtering
      if (selectedDept !== "ALL") {
        const deptName = b.employee?.department || "";
        if (deptName !== selectedDept) return false;
      }

      return true;
    });
  }, [bookings, selectedRange, selectedRoomId, selectedDept, customStartDate, customEndDate]);

  // 4. Calculate Aggregate Metrics
  const metrics = useMemo(() => {
    const total = filteredBookings.length;
    let approvedCount = 0;
    let pendingCount = 0;
    let rejectedCount = 0;
    let canceledCount = 0;
    let totalMinutes = 0;
    let totalParticipants = 0;

    filteredBookings.forEach((b) => {
      if (b.status === "APPROVED") approvedCount++;
      else if (b.status === "PENDING") pendingCount++;
      else if (b.status === "REJECTED") rejectedCount++;
      else if (b.status === "CANCELED") canceledCount++;

      // Count duration
      const s = new Date(b.startTime).getTime();
      const e = new Date(b.endTime).getTime();
      if (!isNaN(s) && !isNaN(e) && e > s) {
        totalMinutes += (e - s) / (1000 * 60);
      }

      totalParticipants += b.participant || 0;
    });

    const totalHours = Math.round((totalMinutes / 60) * 10) / 10;
    const avgDurationHours =
      total > 0 ? Math.round((totalMinutes / total / 60) * 10) / 10 : 0;
    const avgParticipants = total > 0 ? Math.round(totalParticipants / total) : 0;
    const approvalRate =
      total > 0 ? Math.round((approvedCount / total) * 100) : 0;

    return {
      total,
      approvedCount,
      pendingCount,
      rejectedCount,
      canceledCount,
      totalHours,
      avgDurationHours,
      totalParticipants,
      avgParticipants,
      approvalRate,
    };
  }, [filteredBookings]);

  // 5. Room Statistics Breakdown
  const roomStats = useMemo(() => {
    const map = new Map<
      string,
      {
        room: MeetingRoom;
        count: number;
        hours: number;
        participants: number;
      }
    >();

    rooms.forEach((r) => {
      map.set(r.id, { room: r, count: 0, hours: 0, participants: 0 });
    });

    filteredBookings.forEach((b) => {
      const existing = map.get(b.roomId);
      const s = new Date(b.startTime).getTime();
      const e = new Date(b.endTime).getTime();
      const hrs = !isNaN(s) && !isNaN(e) && e > s ? (e - s) / (1000 * 60 * 60) : 0;

      if (existing) {
        existing.count += 1;
        existing.hours += hrs;
        existing.participants += b.participant || 0;
      } else if (b.room) {
        map.set(b.roomId, {
          room: { id: b.roomId, name: b.room.name, capacity: b.room.capacity },
          count: 1,
          hours: hrs,
          participants: b.participant || 0,
        });
      }
    });

    const list = Array.from(map.values()).map((item) => ({
      ...item,
      hours: Math.round(item.hours * 10) / 10,
      avgParticipants: item.count > 0 ? Math.round(item.participants / item.count) : 0,
    }));

    // Sort by count descending
    list.sort((a, b) => b.count - a.count);
    return list;
  }, [rooms, filteredBookings]);

  // Top Most Popular Room
  const topRoom = roomStats[0] && roomStats[0].count > 0 ? roomStats[0] : null;

  // 6. Day of Week Distribution
  const weekdayStats = useMemo(() => {
    const counts = [0, 0, 0, 0, 0, 0, 0]; // Sun to Sat
    filteredBookings.forEach((b) => {
      const day = new Date(b.startTime).getDay();
      counts[day]++;
    });

    const max = Math.max(...counts, 1);
    return WEEKDAY_NAMES.map((name, idx) => ({
      name,
      count: counts[idx],
      percent: Math.round((counts[idx] / max) * 100),
      isWeekend: idx === 0 || idx === 6,
    }));
  }, [filteredBookings]);

  // 7. Peak Meeting Hours Distribution (08:00 - 18:00)
  const hourlyStats = useMemo(() => {
    const hours = Array.from({ length: 11 }, (_, i) => i + 8); // 8 to 18
    const counts = new Array(11).fill(0);

    filteredBookings.forEach((b) => {
      const s = new Date(b.startTime);
      const e = new Date(b.endTime);
      const sH = s.getHours();
      const eH = e.getHours();

      for (let h = 8; h <= 18; h++) {
        if (h >= sH && h < Math.max(sH + 1, eH)) {
          counts[h - 8]++;
        }
      }
    });

    const max = Math.max(...counts, 1);
    return hours.map((h, i) => ({
      hour: `${h.toString().padStart(2, "0")}:00`,
      count: counts[i],
      percent: Math.round((counts[i] / max) * 100),
    }));
  }, [filteredBookings]);

  // 8. Department Usage Breakdown
  const deptStats = useMemo(() => {
    const map = new Map<string, { count: number; participants: number }>();

    filteredBookings.forEach((b) => {
      const dept = b.employee?.department || "ไม่ระบุแผนก";
      const cur = map.get(dept) || { count: 0, participants: 0 };
      cur.count += 1;
      cur.participants += b.participant || 0;
      map.set(dept, cur);
    });

    const list = Array.from(map.entries()).map(([name, data]) => ({
      name,
      count: data.count,
      participants: data.participants,
    }));

    list.sort((a, b) => b.count - a.count);
    return list.slice(0, 5); // Top 5
  }, [filteredBookings]);

  // Donut chart calculations
  const donutData = useMemo(() => {
    const total = metrics.total || 1;
    const radius = 40;
    const circumference = 2 * Math.PI * radius;

    const approvedAngle = (metrics.approvedCount / total) * circumference;
    const pendingAngle = (metrics.pendingCount / total) * circumference;
    const rejectedAngle = (metrics.rejectedCount / total) * circumference;
    const canceledAngle = (metrics.canceledCount / total) * circumference;

    return {
      radius,
      circumference,
      approvedAngle,
      pendingAngle,
      rejectedAngle,
      canceledAngle,
    };
  }, [metrics]);

  return (
    <div className="space-y-6">
      {/* ─── Header & Quick Actions ─── */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-surface p-5 sm:p-6 rounded-2xl border border-border shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-xl bg-amber-50 text-amber-600 border border-amber-200 shadow-2xs">
              <BarChart3 className="w-5 h-5" />
            </span>
            <div>
              <h1 className="text-xl sm:text-2xl font-bold text-text">
                สถิติการใช้งานห้องประชุม
              </h1>
              <p className="text-xs sm:text-sm text-text-muted mt-0.5">
                แดชบอร์ดสรุปภาพรวม สัดส่วนการจอง และแนวโน้มพฤติกรรมการใช้งานห้องประชุม
              </p>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            type="button"
            onClick={() => fetchBookings(true)}
            disabled={refreshing}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-surface border border-border hover:bg-surface-sunken text-xs font-semibold text-text shadow-2xs transition-colors cursor-pointer"
            title="รีเฟรชข้อมูล"
          >
            <RefreshCw
              className={`w-3.5 h-3.5 text-text-muted ${refreshing ? "animate-spin text-primary-600" : ""}`}
            />
            <span>{refreshing ? "กำลังโหลด..." : "รีเฟรช"}</span>
          </button>

          <Link
            href="/p/report/approval"
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-primary-600 hover:bg-primary-700 text-white text-xs font-semibold shadow-xs transition-colors"
          >
            <FileSpreadsheet className="w-4 h-4" />
            <span>ดูตารางประวัติการจอง & Export</span>
            <ArrowRight className="w-3.5 h-3.5 ml-0.5 opacity-80" />
          </Link>
        </div>
      </div>

      {/* ─── Filter Control Bar ─── */}
      <div className="bg-surface p-4 sm:p-5 rounded-2xl border border-border shadow-xs space-y-3.5">
        <div className="flex items-center justify-between gap-2 border-b border-border/80 pb-3">
          <div className="flex items-center gap-2 text-xs font-bold text-text">
            <Filter className="w-4 h-4 text-primary-600" />
            <span>ตัวกรองช่วงเวลาและเงื่อนไข</span>
          </div>

          <div className="text-xs text-text-muted">
            พบข้อมูล <span className="font-bold text-text">{filteredBookings.length}</span> จากทั้งหมด {bookings.length} รายการ
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {/* Preset Range Pills */}
          <div className="flex flex-wrap items-center gap-1.5">
            {PRESET_RANGES.map((preset) => (
              <button
                key={preset.id}
                type="button"
                onClick={() => setSelectedRange(preset.id)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${selectedRange === preset.id
                    ? "bg-primary-600 text-white shadow-xs"
                    : "bg-surface-raised border border-border text-text-secondary hover:bg-surface-sunken hover:text-text"
                  }`}
              >
                {preset.label}
              </button>
            ))}

            <button
              type="button"
              onClick={() => setSelectedRange("CUSTOM")}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${selectedRange === "CUSTOM"
                  ? "bg-primary-600 text-white shadow-xs"
                  : "bg-surface-raised border border-border text-text-secondary hover:bg-surface-sunken"
                }`}
            >
              กำหนดเอง
            </button>
          </div>

          {/* Custom Date Picker Inputs (shown if CUSTOM is active) */}
          {selectedRange === "CUSTOM" && (
            <div className="flex items-center gap-2 bg-surface-raised p-1.5 rounded-xl border border-border text-xs">
              <input
                type="date"
                value={customStartDate}
                onChange={(e) => setCustomStartDate(e.target.value)}
                className="bg-white border border-border rounded-lg px-2 py-1 text-text text-xs focus:outline-none focus:ring-1 focus:ring-primary-500"
              />
              <span className="text-text-muted">ถึง</span>
              <input
                type="date"
                value={customEndDate}
                onChange={(e) => setCustomEndDate(e.target.value)}
                className="bg-white border border-border rounded-lg px-2 py-1 text-text text-xs focus:outline-none focus:ring-1 focus:ring-primary-500"
              />
            </div>
          )}

          <div className="h-4 w-px bg-border hidden sm:block" />

          {/* Room Filter Dropdown */}
          <div className="relative min-w-40">
            <select
              value={selectedRoomId}
              onChange={(e) => setSelectedRoomId(e.target.value)}
              className="w-full bg-surface-raised border border-border rounded-lg py-1.5 pl-3 pr-7 text-xs text-text cursor-pointer focus:outline-none focus:ring-1 focus:ring-primary-500"
            >
              <option value="ALL">ห้องประชุมทั้งหมด ({rooms.length})</option>
              {rooms.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.name}
                </option>
              ))}
            </select>
          </div>

          {/* Department Filter Dropdown */}
          <div className="relative min-w-40">
            <select
              value={selectedDept}
              onChange={(e) => setSelectedDept(e.target.value)}
              className="w-full bg-surface-raised border border-border rounded-lg py-1.5 pl-3 pr-7 text-xs text-text cursor-pointer focus:outline-none focus:ring-1 focus:ring-primary-500"
            >
              <option value="ALL">ทุกหน่วยงาน ({departments.length})</option>
              {departments.map((d) => (
                <option key={d.id} value={d.name}>
                  {d.name}
                </option>
              ))}
            </select>
          </div>

          {/* Reset button if filtered */}
          {(selectedRange !== "ALL" || selectedRoomId !== "ALL" || selectedDept !== "ALL") && (
            <button
              type="button"
              onClick={() => {
                setSelectedRange("ALL");
                setSelectedRoomId("ALL");
                setSelectedDept("ALL");
                setCustomStartDate("");
                setCustomEndDate("");
              }}
              className="text-xs font-semibold text-primary-600 hover:text-primary-700 underline cursor-pointer ml-auto"
            >
              รีเซ็ตตัวกรอง
            </button>
          )}
        </div>
      </div>

      {/* ─── Top 4 KPI Metrics ─── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* KPI 1: Total Bookings */}
        <div className="bg-surface p-4 sm:p-5 rounded-2xl border border-border shadow-xs relative overflow-hidden transition-all hover:shadow-md">
          <div className="flex items-center justify-between">
            <span className="p-2.5 rounded-xl bg-primary-50 text-primary-600 border border-primary-100">
              <Calendar className="w-5 h-5" />
            </span>
            <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-full bg-available-50 text-available-700 border border-available-200">
              <TrendingUp className="w-3 h-3" />
              อนุมัติ {metrics.approvalRate}%
            </span>
          </div>
          <div className="mt-3">
            <p className="text-xs font-medium text-text-muted">จำนวนการจองทั้งหมด</p>
            <p className="text-2xl sm:text-3xl font-extrabold text-text mt-0.5 tracking-tight">
              {loading ? "..." : metrics.total}
              <span className="text-xs font-normal text-text-secondary ml-1.5">รายการ</span>
            </p>
          </div>
          <div className="mt-3 pt-2.5 border-t border-border/70 flex items-center justify-between text-[11px] text-text-secondary">
            <span>อนุมัติ {metrics.approvedCount}</span>
            <span>รออนุมัติ {metrics.pendingCount}</span>
            <span>ปฏิเสธ/ยกเลิก {metrics.rejectedCount + metrics.canceledCount}</span>
          </div>
        </div>

        {/* KPI 2: Total Hours */}
        <div className="bg-surface p-4 sm:p-5 rounded-2xl border border-border shadow-xs relative overflow-hidden transition-all hover:shadow-md">
          <div className="flex items-center justify-between">
            <span className="p-2.5 rounded-xl bg-booked-50 text-booked-600 border border-booked-100">
              <Clock className="w-5 h-5" />
            </span>
            <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full bg-surface-raised border border-border text-text-secondary">
              เฉลี่ย {metrics.avgDurationHours} ชม./ครั้ง
            </span>
          </div>
          <div className="mt-3">
            <p className="text-xs font-medium text-text-muted">ชั่วโมงการใช้งานห้องรวม</p>
            <p className="text-2xl sm:text-3xl font-extrabold text-text mt-0.5 tracking-tight">
              {loading ? "..." : metrics.totalHours}
              <span className="text-xs font-normal text-text-secondary ml-1.5">ชั่วโมง</span>
            </p>
          </div>
          <div className="mt-3 pt-2.5 border-t border-border/70 text-[11px] text-text-secondary flex items-center justify-between">
            <span>ระยะเวลาการประชุม</span>
            <span className="font-semibold text-text">
              {metrics.total > 0 ? `${metrics.avgDurationHours} ชม. ต่อการประชุม` : "-"}
            </span>
          </div>
        </div>

        {/* KPI 3: Total Participants */}
        <div className="bg-surface p-4 sm:p-5 rounded-2xl border border-border shadow-xs relative overflow-hidden transition-all hover:shadow-md">
          <div className="flex items-center justify-between">
            <span className="p-2.5 rounded-xl bg-pending-50 text-pending-600 border border-pending-100">
              <Users className="w-5 h-5" />
            </span>
            <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full bg-surface-raised border border-border text-text-secondary">
              เฉลี่ย {metrics.avgParticipants} คน/ห้อง
            </span>
          </div>
          <div className="mt-3">
            <p className="text-xs font-medium text-text-muted">จำนวนผู้เข้าร่วมรวม</p>
            <p className="text-2xl sm:text-3xl font-extrabold text-text mt-0.5 tracking-tight">
              {loading ? "..." : metrics.totalParticipants.toLocaleString()}
              <span className="text-xs font-normal text-text-secondary ml-1.5">คน</span>
            </p>
          </div>
          <div className="mt-3 pt-2.5 border-t border-border/70 text-[11px] text-text-secondary flex items-center justify-between">
            <span>ผู้เข้าร่วมประชุมเฉลี่ย</span>
            <span className="font-semibold text-text">
              {metrics.total > 0 ? `~${metrics.avgParticipants} คน ต่อการประชุม` : "-"}
            </span>
          </div>
        </div>

        {/* KPI 4: Top Room Spotlight */}
        <div className="bg-surface p-4 sm:p-5 rounded-2xl border border-border shadow-xs relative overflow-hidden transition-all hover:shadow-md">
          <div className="flex items-center justify-between">
            <span className="p-2.5 rounded-xl bg-amber-50 text-amber-600 border border-amber-200">
              <Trophy className="w-5 h-5" />
            </span>
            <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-800">
              #1 ห้องยอดนิยม
            </span>
          </div>
          <div className="mt-3">
            <p className="text-xs font-medium text-text-muted">ห้องที่ถูกจองสูงสุด</p>
            <p className="text-lg sm:text-xl font-bold text-text mt-0.5 truncate" title={topRoom?.room.name || "-"}>
              {loading ? "..." : topRoom?.room.name || "ไม่มีข้อมูล"}
            </p>
          </div>
          <div className="mt-3 pt-2.5 border-t border-border/70 text-[11px] text-text-secondary flex items-center justify-between">
            <span>ความจุ {topRoom?.room.capacity || 0} ที่นั่ง</span>
            <span className="font-bold text-primary-600">
              {topRoom ? `${topRoom.count} ครั้ง (${topRoom.hours} ชม.)` : "-"}
            </span>
          </div>
        </div>
      </div>

      {/* ─── Visual Charts Row 1: Room Comparison & Status Breakdown ─── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Chart 1: Meeting Room Utilization & Share (2 Cols) */}
        <div className="lg:col-span-2 bg-surface p-5 sm:p-6 rounded-2xl border border-border shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-sm sm:text-base font-bold text-text flex items-center gap-2">
                  <DoorClosed className="w-4 h-4 text-primary-600" />
                  สถิติการใช้งานแยกตามห้องประชุม
                </h2>
                <p className="text-xs text-text-muted mt-0.5">
                  เปรียบเทียบจำนวนครั้งและชั่วโมงการใช้งานของแต่ละห้องประชุม
                </p>
              </div>
              <span className="text-xs font-medium text-text-secondary bg-surface-raised px-2.5 py-1 rounded-lg border border-border">
                {roomStats.length} ห้อง
              </span>
            </div>

            {/* Room Bars */}
            <div className="space-y-3.5 mt-5">
              {roomStats.length === 0 ? (
                <div className="py-12 text-center text-text-muted text-xs">
                  ไม่มีข้อมูลการใช้งานห้องประชุมตามเงื่อนไขที่เลือก
                </div>
              ) : (
                roomStats.map((item, idx) => {
                  const maxCount = Math.max(...roomStats.map((r) => r.count), 1);
                  const percent = Math.round((item.count / maxCount) * 100);
                  const shareOfTotal = metrics.total > 0 ? Math.round((item.count / metrics.total) * 100) : 0;

                  return (
                    <div key={item.room.id} className="space-y-1.5">
                      <div className="flex items-center justify-between text-xs">
                        <div className="flex items-center gap-2 min-w-0">
                          <span
                            className={`w-5 h-5 rounded-full flex items-center justify-center font-bold text-2xs shrink-0 ${idx === 0
                                ? "bg-amber-100 text-amber-800 border border-amber-300"
                                : "bg-surface-sunken text-text-secondary"
                              }`}
                          >
                            {idx + 1}
                          </span>
                          <span className="font-semibold text-text truncate max-w-xs sm:max-w-md">
                            {item.room.name}
                          </span>
                          <span className="text-[11px] text-text-muted shrink-0 hidden sm:inline">
                            (จุ {item.room.capacity} คน)
                          </span>
                        </div>
                        <div className="flex items-center gap-3 shrink-0 text-right">
                          <span className="font-bold text-text">
                            {item.count} ครั้ง
                          </span>
                          <span className="text-text-secondary text-[11px] w-16 text-right">
                            {item.hours} ชม.
                          </span>
                          <span className="font-bold text-primary-600 w-10 text-right">
                            {shareOfTotal}%
                          </span>
                        </div>
                      </div>

                      {/* Progress Bar */}
                      <div className="w-full h-2.5 bg-surface-sunken rounded-full overflow-hidden flex">
                        <div
                          style={{ width: `${percent}%` }}
                          className={`h-full rounded-full transition-all duration-500 ${idx === 0
                              ? "bg-linear-to-r from-amber-500 to-amber-400"
                              : idx === 1
                                ? "bg-linear-to-r from-primary-600 to-primary-400"
                                : "bg-slate-400"
                            }`}
                        />
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          <div className="mt-6 pt-4 border-t border-border/70 flex items-center justify-between text-xs text-text-secondary">
            <span>คำนวณจากคำร้องทั้งหมดในช่วงเวลาที่เลือก</span>
            <span className="font-medium text-text">รวม {metrics.totalHours} ชั่วโมง</span>
          </div>
        </div>

        {/* Chart 2: Booking Status Breakdown (Donut) (1 Col) */}
        <div className="bg-surface p-5 sm:p-6 rounded-2xl border border-border shadow-xs flex flex-col justify-between">
          <div>
            <h2 className="text-sm sm:text-base font-bold text-text flex items-center gap-2 mb-1">
              <Activity className="w-4 h-4 text-primary-600" />
              สัดส่วนสถานะคำขอจอง
            </h2>
            <p className="text-xs text-text-muted mb-4">
              จำแนกตามสถานะการพิจารณาคำขอจอง
            </p>

            {/* SVG Donut Chart */}
            <div className="relative flex items-center justify-center my-6">
              <svg className="w-44 h-44 -rotate-90 transform" viewBox="0 0 100 100">
                {/* Background Ring */}
                <circle
                  cx="50"
                  cy="50"
                  r={donutData.radius}
                  className="stroke-surface-sunken"
                  strokeWidth="12"
                  fill="transparent"
                />

                {metrics.total > 0 && (
                  <>
                    {/* Approved (Green) */}
                    <circle
                      cx="50"
                      cy="50"
                      r={donutData.radius}
                      stroke="#16a34a"
                      strokeWidth="12"
                      fill="transparent"
                      strokeDasharray={`${donutData.approvedAngle} ${donutData.circumference}`}
                      strokeDashoffset={0}
                      strokeLinecap="round"
                      className="transition-all duration-500"
                    />
                    {/* Pending (Purple) */}
                    <circle
                      cx="50"
                      cy="50"
                      r={donutData.radius}
                      stroke="#7c3aed"
                      strokeWidth="12"
                      fill="transparent"
                      strokeDasharray={`${donutData.pendingAngle} ${donutData.circumference}`}
                      strokeDashoffset={-donutData.approvedAngle}
                      strokeLinecap="round"
                      className="transition-all duration-500"
                    />
                    {/* Rejected (Red) */}
                    <circle
                      cx="50"
                      cy="50"
                      r={donutData.radius}
                      stroke="#dc2626"
                      strokeWidth="12"
                      fill="transparent"
                      strokeDasharray={`${donutData.rejectedAngle} ${donutData.circumference}`}
                      strokeDashoffset={-(donutData.approvedAngle + donutData.pendingAngle)}
                      strokeLinecap="round"
                      className="transition-all duration-500"
                    />
                    {/* Canceled (Slate) */}
                    <circle
                      cx="50"
                      cy="50"
                      r={donutData.radius}
                      stroke="#94a3b8"
                      strokeWidth="12"
                      fill="transparent"
                      strokeDasharray={`${donutData.canceledAngle} ${donutData.circumference}`}
                      strokeDashoffset={
                        -(
                          donutData.approvedAngle +
                          donutData.pendingAngle +
                          donutData.rejectedAngle
                        )
                      }
                      strokeLinecap="round"
                      className="transition-all duration-500"
                    />
                  </>
                )}
              </svg>

              {/* Center Metric */}
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                <span className="text-2xl font-black text-text tracking-tight">
                  {metrics.total}
                </span>
                <span className="text-2xs text-text-muted font-medium">รายการ</span>
              </div>
            </div>

            {/* Status Legends */}
            <div className="space-y-2 mt-4">
              <div className="flex items-center justify-between text-xs p-2 rounded-lg bg-surface-raised border border-border">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-available-600" />
                  <span className="font-medium text-text">อนุมัติแล้ว</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="font-bold text-text">{metrics.approvedCount}</span>
                  <span className="text-[11px] text-text-muted">
                    ({metrics.total > 0 ? Math.round((metrics.approvedCount / metrics.total) * 100) : 0}%)
                  </span>
                </div>
              </div>

              <div className="flex items-center justify-between text-xs p-2 rounded-lg bg-surface-raised border border-border">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-pending-600" />
                  <span className="font-medium text-text">รอการอนุมัติ</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="font-bold text-text">{metrics.pendingCount}</span>
                  <span className="text-[11px] text-text-muted">
                    ({metrics.total > 0 ? Math.round((metrics.pendingCount / metrics.total) * 100) : 0}%)
                  </span>
                </div>
              </div>

              <div className="flex items-center justify-between text-xs p-2 rounded-lg bg-surface-raised border border-border">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-unavailable-600" />
                  <span className="font-medium text-text">ไม่อนุมัติ</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="font-bold text-text">{metrics.rejectedCount}</span>
                  <span className="text-[11px] text-text-muted">
                    ({metrics.total > 0 ? Math.round((metrics.rejectedCount / metrics.total) * 100) : 0}%)
                  </span>
                </div>
              </div>

              <div className="flex items-center justify-between text-xs p-2 rounded-lg bg-surface-raised border border-border">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-slate-400" />
                  <span className="font-medium text-text">ยกเลิกแล้ว</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="font-bold text-text">{metrics.canceledCount}</span>
                  <span className="text-[11px] text-text-muted">
                    ({metrics.total > 0 ? Math.round((metrics.canceledCount / metrics.total) * 100) : 0}%)
                  </span>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-border/70 text-center">
            <span className="text-xs text-text-muted">
              อัตราการผ่านอนุมัติ: <strong className="text-available-700">{metrics.approvalRate}%</strong>
            </span>
          </div>
        </div>
      </div>

      {/* ─── Visual Charts Row 2: Peak Hours & Weekday Distribution ─── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Chart 3: Peak Meeting Hours (08:00 - 18:00) */}
        <div className="bg-surface p-5 sm:p-6 rounded-2xl border border-border shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-sm sm:text-base font-bold text-text flex items-center gap-2">
                <Clock3 className="w-4 h-4 text-primary-600" />
                ช่วงเวลายอดนิยมในการใช้งาน
              </h2>
              <p className="text-xs text-text-muted mt-0.5">
                ความหนาแน่นของการประชุมในแต่ละช่วงเวลาของวัน (08:00 - 18:00)
              </p>
            </div>
          </div>

          {/* Hourly Column Chart */}
          <div className="mt-6 flex items-end gap-1.5 sm:gap-2 h-44 pt-6 px-2 border-b border-border">
            {hourlyStats.map((item) => (
              <div key={item.hour} className="flex-1 flex flex-col items-center gap-1.5 h-full justify-end group">
                <span className="text-2xs font-bold text-text-secondary opacity-0 group-hover:opacity-100 transition-opacity">
                  {item.count}
                </span>
                <div
                  style={{ height: `${Math.max(item.percent, 4)}%` }}
                  className={`w-full rounded-t-md transition-all duration-300 ${item.percent >= 80
                      ? "bg-primary-600"
                      : item.percent >= 40
                        ? "bg-primary-400"
                        : "bg-primary-100 hover:bg-primary-300"
                    }`}
                  title={`${item.hour}: มีการประชุม ${item.count} ครั้ง`}
                />
              </div>
            ))}
          </div>

          {/* Hour labels */}
          <div className="flex justify-between text-2xs sm:text-[11px] text-text-muted mt-2 px-1">
            {hourlyStats.map((item, idx) => (
              <span
                key={item.hour}
                className={idx % 2 === 0 ? "font-medium" : "hidden sm:inline font-medium"}
              >
                {item.hour.split(":")[0]}น.
              </span>
            ))}
          </div>

          <div className="mt-4 pt-3 border-t border-border/70 flex items-center justify-between text-xs text-text-secondary">
            <span>ชั่วโมงที่มีการใช้งานหนาแน่นที่สุด: </span>
            <span className="font-bold text-primary-600">
              {hourlyStats.reduce((max, h) => (h.count > max.count ? h : max), hourlyStats[0])?.hour || "09:00"}
            </span>
          </div>
        </div>

        {/* Chart 4: Weekday Activity & Top Departments */}
        <div className="bg-surface p-5 sm:p-6 rounded-2xl border border-border shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-sm sm:text-base font-bold text-text flex items-center gap-2">
                  <Building2 className="w-4 h-4 text-primary-600" />
                  หน่วยงานที่ขอใช้งานสูงสุด
                </h2>
                <p className="text-xs text-text-muted mt-0.5">
                  5 หน่วยงานที่มีปริมาณการขอจองห้องประชุมมากที่สุด
                </p>
              </div>
            </div>

            <div className="space-y-3 mt-4">
              {deptStats.length === 0 ? (
                <div className="py-8 text-center text-text-muted text-xs">
                  ไม่มีข้อมูลหน่วยงาน
                </div>
              ) : (
                deptStats.map((dept, index) => {
                  const maxDept = Math.max(...deptStats.map((d) => d.count), 1);
                  const p = Math.round((dept.count / maxDept) * 100);

                  return (
                    <div key={dept.name} className="space-y-1">
                      <div className="flex items-center justify-between text-xs">
                        <div className="flex items-center gap-2 truncate">
                          <span className="w-4 h-4 rounded-full bg-surface-sunken text-text-secondary text-2xs font-bold flex items-center justify-center shrink-0">
                            {index + 1}
                          </span>
                          <span className="font-semibold text-text truncate">
                            {dept.name}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          <span className="font-bold text-text">{dept.count} ครั้ง</span>
                          <span className="text-[11px] text-text-muted">
                            ({dept.participants} คน)
                          </span>
                        </div>
                      </div>
                      <div className="w-full h-2 bg-surface-sunken rounded-full overflow-hidden">
                        <div
                          style={{ width: `${p}%` }}
                          className="h-full bg-linear-to-r from-pending-500 to-pending-400 rounded-full"
                        />
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Weekday distribution mini indicator */}
          <div className="mt-5 pt-4 border-t border-border/70">
            <p className="text-xs font-semibold text-text mb-2 flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-text-muted" />
              การกระจายตัวตามวันในสัปดาห์
            </p>
            <div className="grid grid-cols-7 gap-1 text-center">
              {weekdayStats.map((d) => (
                <div
                  key={d.name}
                  className={`p-1.5 rounded-lg border text-center transition-all ${d.count > 0
                      ? "bg-primary-50/70 border-primary-200 text-primary-800"
                      : "bg-surface-sunken border-border text-text-muted opacity-60"
                    }`}
                  title={`${d.name}: ${d.count} ครั้ง`}
                >
                  <p className="text-2xs font-bold truncate">{d.name.slice(0, 3)}</p>
                  <p className="text-xs font-extrabold mt-0.5">{d.count}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* ─── Table: Room Utilization Summary ─── */}
      <div className="bg-surface rounded-2xl border border-border shadow-xs overflow-hidden">
        <div className="p-4 sm:p-5 border-b border-border flex items-center justify-between">
          <div>
            <h2 className="text-sm sm:text-base font-bold text-text flex items-center gap-2">
              <Layers className="w-4 h-4 text-primary-600" />
              ตารางสรุปประสิทธิภาพการใช้งานห้องประชุม
            </h2>
            <p className="text-xs text-text-muted mt-0.5">
              ข้อมูลสรุปรายห้องประชุม ความจุ จำนวนครั้ง ชั่วโมง และอัตราการใช้งาน
            </p>
          </div>

          <Link
            href="/p/report/approval"
            className="text-xs font-semibold text-primary-600 hover:text-primary-700 hover:underline flex items-center gap-1"
          >
            <span>ดูรายการจองทั้งหมด</span>
            <ArrowRight className="w-3 h-3" />
          </Link>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-surface-raised border-b border-border text-text-secondary font-bold select-none">
              <tr>
                <th className="py-3 px-4 w-12 text-center">#</th>
                <th className="py-3 px-4">ชื่อห้องประชุม</th>
                <th className="py-3 px-4 text-center">ความจุ (ที่นั่ง)</th>
                <th className="py-3 px-4 text-center">จำนวนการจอง</th>
                <th className="py-3 px-4 text-center">ชั่วโมงใช้งานรวม</th>
                <th className="py-3 px-4 text-center">ผู้เข้าร่วมเฉลี่ย</th>
                <th className="py-3 px-4 text-center">สัดส่วนการใช้งาน</th>
                <th className="py-3 px-4 text-center">ระดับความนิยม</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/60">
              {roomStats.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-text-muted">
                    ไม่มีข้อมูลห้องประชุม
                  </td>
                </tr>
              ) : (
                roomStats.map((item, index) => {
                  const shareOfTotal =
                    metrics.total > 0 ? Math.round((item.count / metrics.total) * 100) : 0;

                  return (
                    <tr key={item.room.id} className="hover:bg-surface-raised/80 transition-colors">
                      <td className="py-3 px-4 text-center font-bold text-text-secondary">
                        {index + 1}
                      </td>
                      <td className="py-3 px-4 font-semibold text-text">
                        <div className="flex items-center gap-2">
                          <DoorClosed className="w-4 h-4 text-primary-600 shrink-0" />
                          <span>{item.room.name}</span>
                        </div>
                      </td>
                      <td className="py-3 px-4 text-center text-text-secondary">
                        {item.room.capacity} ที่นั่ง
                      </td>
                      <td className="py-3 px-4 text-center font-bold text-text">
                        {item.count} ครั้ง
                      </td>
                      <td className="py-3 px-4 text-center font-semibold text-text">
                        {item.hours} ชม.
                      </td>
                      <td className="py-3 px-4 text-center text-text-secondary">
                        {item.avgParticipants} คน/ครั้ง
                      </td>
                      <td className="py-3 px-4 text-center">
                        <div className="inline-flex items-center gap-2 w-28">
                          <div className="flex-1 h-2 bg-surface-sunken rounded-full overflow-hidden">
                            <div
                              style={{ width: `${shareOfTotal}%` }}
                              className="h-full bg-primary-600 rounded-full"
                            />
                          </div>
                          <span className="text-[11px] font-bold text-text w-8 text-right">
                            {shareOfTotal}%
                          </span>
                        </div>
                      </td>
                      <td className="py-3 px-4 text-center">
                        {index === 0 && item.count > 0 ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-2xs font-bold bg-amber-100 text-amber-800 border border-amber-300">
                            <Sparkles className="w-2.5 h-2.5" />
                            สูงสุด (Popular)
                          </span>
                        ) : shareOfTotal >= 20 ? (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-2xs font-semibold bg-available-50 text-available-700 border border-available-200">
                            ปานกลาง
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-2xs font-medium bg-surface-sunken text-text-secondary">
                            ปกติ
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
