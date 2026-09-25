"use client";

import React, { useState, useEffect, useMemo, useCallback } from "react";
import Link from "next/link";
import {
  FileSpreadsheet,
  Search,
  RefreshCw,
  Calendar,
  Clock,
  Users,
  Building2,
  DoorClosed,
  CheckCircle2,
  Clock3,
  XCircle,
  Ban,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  Eye,
  ChevronLeft,
  ChevronRight,
  Download,
  BarChart3,
  X,
  FileText,
  RotateCcw,
} from "lucide-react";
import BookingDetail from "@/components/scheduler/BookingDetail";
import { MeetingBooking } from "@/components/scheduler/types";

interface MeetingRoom {
  id: string;
  name: string;
  capacity: number;
}

interface Department {
  id: string;
  name: string;
}

type SortField =
  | "startTime"
  | "topic"
  | "room"
  | "employee"
  | "participant"
  | "status"
  | "createdAt";

type SortDirection = "asc" | "desc";

const THAI_MONTHS_SHORT = [
  "ม.ค.", "ก.พ.", "มี.ค.", "เม.ย.", "พ.ค.", "มิ.ย.",
  "ก.ค.", "ส.ค.", "ก.ย.", "ต.ค.", "พ.ย.", "ธ.ค."
];

export default function ApprovalHistoryReportPage() {
  const [bookings, setBookings] = useState<MeetingBooking[]>([]);
  const [rooms, setRooms] = useState<MeetingRoom[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Search & Filters
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [roomFilter, setRoomFilter] = useState("ALL");
  const [deptFilter, setDeptFilter] = useState("ALL");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  // Sorting
  const [sortField, setSortField] = useState<SortField>("startTime");
  const [sortDirection, setSortDirection] = useState<SortDirection>("desc");

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);

  // View Details Modal
  const [detailBooking, setDetailBooking] = useState<MeetingBooking | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);

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
  const fetchBookings = useCallback(async (isManual = false) => {
    try {
      if (isManual) setRefreshing(true);
      else setLoading(true);
      setError(null);

      const res = await fetch("/api/booking/get");
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

  // Reset to page 1 on filter changes
  useEffect(() => {
    setCurrentPage(1);
  }, [search, statusFilter, roomFilter, deptFilter, startDate, endDate]);

  // 3. Filter Bookings
  const filteredBookings = useMemo(() => {
    return bookings.filter((b) => {
      // Search text
      if (search.trim()) {
        const q = search.toLowerCase();
        const topicMatch = (b.topic || "").toLowerCase().includes(q);
        const noteMatch = (b.note || "").toLowerCase().includes(q);
        const roomMatch = (b.room?.name || "").toLowerCase().includes(q);
        const empName = `${b.employee?.firstname || ""} ${b.employee?.lastname || ""}`.toLowerCase();
        const empMatch = empName.includes(q);
        const deptMatch = (b.employee?.department || "").toLowerCase().includes(q);
        const emailMatch = (b.employee?.email || "").toLowerCase().includes(q);

        if (!topicMatch && !noteMatch && !roomMatch && !empMatch && !deptMatch && !emailMatch) {
          return false;
        }
      }

      // Status
      if (statusFilter !== "ALL" && b.status !== statusFilter) {
        return false;
      }

      // Room
      if (roomFilter !== "ALL" && b.roomId !== roomFilter) {
        return false;
      }

      // Department
      if (deptFilter !== "ALL") {
        const deptName = b.employee?.department || "";
        if (deptName !== deptFilter) return false;
      }

      // Date Range
      if (startDate) {
        const sTime = new Date(startDate).getTime();
        const bEndTime = new Date(b.endTime).getTime();
        if (bEndTime < sTime) return false;
      }
      if (endDate) {
        const eTime = new Date(endDate);
        eTime.setHours(23, 59, 59, 999);
        const bStartTime = new Date(b.startTime).getTime();
        if (bStartTime > eTime.getTime()) return false;
      }

      return true;
    });
  }, [bookings, search, statusFilter, roomFilter, deptFilter, startDate, endDate]);

  // 4. Sort Bookings
  const sortedBookings = useMemo(() => {
    const list = [...filteredBookings];
    list.sort((a, b) => {
      let comparison = 0;

      switch (sortField) {
        case "startTime":
          comparison = new Date(a.startTime).getTime() - new Date(b.startTime).getTime();
          break;
        case "createdAt": {
          const tA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
          const tB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
          comparison = tA - tB;
          break;
        }
        case "topic":
          comparison = (a.topic || "").localeCompare(b.topic || "", "th");
          break;
        case "room":
          comparison = (a.room?.name || "").localeCompare(b.room?.name || "", "th");
          break;
        case "employee": {
          const nameA = `${a.employee?.firstname || ""} ${a.employee?.lastname || ""}`;
          const nameB = `${b.employee?.firstname || ""} ${b.employee?.lastname || ""}`;
          comparison = nameA.localeCompare(nameB, "th");
          break;
        }
        case "participant":
          comparison = (a.participant || 0) - (b.participant || 0);
          break;
        case "status":
          comparison = (a.status || "").localeCompare(b.status || "");
          break;
        default:
          comparison = 0;
      }

      return sortDirection === "asc" ? comparison : -comparison;
    });
    return list;
  }, [filteredBookings, sortField, sortDirection]);

  // 5. Pagination
  const totalItems = sortedBookings.length;
  const totalPages = Math.ceil(totalItems / pageSize) || 1;
  const paginatedBookings = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return sortedBookings.slice(start, start + pageSize);
  }, [sortedBookings, currentPage, pageSize]);

  // 6. Handle Sort Click
  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection((prev) => (prev === "asc" ? "desc" : "asc"));
    } else {
      setSortField(field);
      setSortDirection("desc");
    }
  };

  // 7. Calculate Counts for Summary Badges
  const counts = useMemo(() => {
    let pending = 0;
    let approved = 0;
    let rejected = 0;
    let canceled = 0;

    bookings.forEach((b) => {
      if (b.status === "PENDING") pending++;
      else if (b.status === "APPROVED") approved++;
      else if (b.status === "REJECTED") rejected++;
      else if (b.status === "CANCELED") canceled++;
    });

    return { total: bookings.length, pending, approved, rejected, canceled };
  }, [bookings]);

  // 8. CSV Export Helper (RFC 4180 Standard + UTF-8 BOM for Thai Excel)
  const exportToCSV = (exportAll = false) => {
    const recordsToExport = exportAll ? bookings : filteredBookings;

    if (recordsToExport.length === 0) {
      alert("ไม่มีข้อมูลที่จะส่งออกเป็นไฟล์ CSV");
      return;
    }

    const headers = [
      "ลำดับ",
      "รหัสการจอง",
      "หัวข้อการประชุม",
      "ห้องประชุม",
      "ความจุห้อง (ที่นั่ง)",
      "วันที่จัดประชุม (พ.ศ.)",
      "เวลาเริ่มต้น",
      "เวลาสิ้นสุด",
      "ระยะเวลา (ชั่วโมง)",
      "จำนวนผู้เข้าร่วม (คน)",
      "สถานะคำขอ",
      "ผู้ขอจอง",
      "แผนก/หน่วยงาน",
      "ตำแหน่ง",
      "อีเมลผู้จอง",
      "เบอร์โทรศัพท์",
      "หมายเหตุ",
      "วันที่ยื่นคำขอ",
    ];

    const formatThaiDate = (dateString?: string) => {
      if (!dateString) return "-";
      const d = new Date(dateString);
      if (isNaN(d.getTime())) return dateString;
      const day = d.getDate();
      const month = THAI_MONTHS_SHORT[d.getMonth()];
      const year = d.getFullYear() + 543;
      return `${day} ${month} ${year}`;
    };

    const formatTimeOnly = (dateString: string) => {
      const d = new Date(dateString);
      if (isNaN(d.getTime())) return "";
      const h = d.getHours().toString().padStart(2, "0");
      const m = d.getMinutes().toString().padStart(2, "0");
      return `${h}:${m}`;
    };

    const getStatusText = (status: string) => {
      switch (status) {
        case "APPROVED":
          return "อนุมัติแล้ว";
        case "PENDING":
          return "รอการอนุมัติ";
        case "REJECTED":
          return "ไม่อนุมัติ";
        case "CANCELED":
          return "ยกเลิกแล้ว";
        default:
          return status;
      }
    };

    const rows = recordsToExport.map((b, index) => {
      const s = new Date(b.startTime).getTime();
      const e = new Date(b.endTime).getTime();
      const hours = !isNaN(s) && !isNaN(e) && e > s ? ((e - s) / (1000 * 60 * 60)).toFixed(1) : "0";

      return [
        (index + 1).toString(),
        b.id,
        b.topic || "",
        b.room?.name || "",
        b.room?.capacity?.toString() || "",
        formatThaiDate(b.startTime),
        formatTimeOnly(b.startTime),
        formatTimeOnly(b.endTime),
        hours,
        (b.participant || 0).toString(),
        getStatusText(b.status),
        `${b.employee?.firstname || ""} ${b.employee?.lastname || ""}`.trim(),
        b.employee?.department || "",
        b.employee?.position || "",
        b.employee?.email || "",
        b.employee?.phoneNumber || "",
        (b.note || "").replace(/\r?\n/g, " "),
        formatThaiDate(b.createdAt),
      ];
    });

    // Escape CSV cell according to RFC 4180
    const escapeCSV = (cell: string) => {
      if (cell === null || cell === undefined) return '""';
      const str = String(cell);
      if (str.includes(",") || str.includes('"') || str.includes("\n") || str.includes("\r")) {
        return `"${str.replace(/"/g, '""')}"`;
      }
      return `"${str}"`;
    };

    const csvContent =
      "\uFEFF" + // UTF-8 BOM
      [headers.map(escapeCSV).join(","), ...rows.map((row) => row.map(escapeCSV).join(","))].join("\r\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");

    const now = new Date();
    const timestamp = `${now.getFullYear()}${(now.getMonth() + 1).toString().padStart(2, "0")}${now.getDate().toString().padStart(2, "0")}_${now.getHours().toString().padStart(2, "0")}${now.getMinutes().toString().padStart(2, "0")}`;
    const filename = `รายงานการจองห้องประชุม_${timestamp}.csv`;

    link.setAttribute("href", url);
    link.setAttribute("download", filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // Helper Thai Date & Time formatting
  const formatDateTimeDisplay = (startTime: string, endTime: string): {
    dateText: string;
    timeText: string;
    duration: string;
  } => {
    const s = new Date(startTime);
    const e = new Date(endTime);
    if (isNaN(s.getTime())) {
      return {
        dateText: startTime,
        timeText: "-",
        duration: "",
      };
    }

    const day = s.getDate();
    const month = THAI_MONTHS_SHORT[s.getMonth()];
    const year = s.getFullYear() + 543;

    const sH = s.getHours().toString().padStart(2, "0");
    const sM = s.getMinutes().toString().padStart(2, "0");
    const eH = e.getHours().toString().padStart(2, "0");
    const eM = e.getMinutes().toString().padStart(2, "0");

    const hrs = !isNaN(e.getTime()) ? ((e.getTime() - s.getTime()) / (1000 * 60 * 60)).toFixed(1) : "";

    return {
      dateText: `${day} ${month} ${year}`,
      timeText: `${sH}:${sM} - ${eH}:${eM} น.`,
      duration: hrs ? `(${hrs} ชม.)` : "",
    };
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "APPROVED":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-available-50 text-available-700 border border-available-200">
            <CheckCircle2 className="w-3.5 h-3.5 text-available-600" />
            <span>อนุมัติแล้ว</span>
          </span>
        );
      case "PENDING":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-pending-50 text-pending-700 border border-pending-200">
            <Clock3 className="w-3.5 h-3.5 text-pending-600" />
            <span>รอการอนุมัติ</span>
          </span>
        );
      case "REJECTED":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-unavailable-50 text-unavailable-700 border border-unavailable-200">
            <Ban className="w-3.5 h-3.5 text-unavailable-600" />
            <span>ไม่อนุมัติ</span>
          </span>
        );
      case "CANCELED":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-secondary-100 text-secondary-700 border border-secondary-300">
            <XCircle className="w-3.5 h-3.5 text-secondary-500" />
            <span>ยกเลิกแล้ว</span>
          </span>
        );
      default:
        return <span>{status}</span>;
    }
  };

  const hasActiveFilters =
    search.trim() !== "" ||
    statusFilter !== "ALL" ||
    roomFilter !== "ALL" ||
    deptFilter !== "ALL" ||
    startDate !== "" ||
    endDate !== "";

  const resetFilters = () => {
    setSearch("");
    setStatusFilter("ALL");
    setRoomFilter("ALL");
    setDeptFilter("ALL");
    setStartDate("");
    setEndDate("");
  };

  return (
    <div className="space-y-6">
      {/* ─── Header & Primary Actions ─── */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-surface p-5 sm:p-6 rounded-2xl border border-border shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-xl bg-primary-50 text-primary-600 border border-primary-200 shadow-2xs">
              <FileSpreadsheet className="w-5 h-5" />
            </span>
            <div>
              <h1 className="text-xl sm:text-2xl font-bold text-text">
                ประวัติการจองห้องประชุมทั้งหมด
              </h1>
              <p className="text-xs sm:text-sm text-text-muted mt-0.5">
                รายงานตารางประวัติคำขอจองห้องประชุม ค้นหา กรองสถานะ และส่งออกข้อมูลเป็นไฟล์ CSV
              </p>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <Link
            href="/p/report/usage"
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-surface border border-border hover:bg-surface-sunken text-xs font-semibold text-text shadow-2xs transition-colors"
          >
            <BarChart3 className="w-4 h-4 text-amber-600" />
            <span>สถิติและกราฟสรุป</span>
          </Link>

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

          {/* Export to CSV Button */}
          <button
            type="button"
            onClick={() => exportToCSV(false)}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-available-600 hover:bg-available-700 text-white font-semibold text-xs sm:text-sm shadow-xs transition-all cursor-pointer"
          >
            <Download className="w-4 h-4" />
            <span>Export CSV {hasActiveFilters && `(${filteredBookings.length})`}</span>
          </button>
        </div>
      </div>

      {/* ─── KPI Quick Status Bar ─── */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        <button
          type="button"
          onClick={() => setStatusFilter("ALL")}
          className={`p-3.5 rounded-xl border text-left transition-all cursor-pointer ${statusFilter === "ALL"
              ? "bg-primary-50/70 border-primary-300 ring-2 ring-primary-500/20 shadow-xs"
              : "bg-surface border-border hover:bg-surface-raised"
            }`}
        >
          <p className="text-[11px] font-semibold text-text-muted">คำขอทั้งหมด</p>
          <p className="text-xl sm:text-2xl font-black text-text mt-0.5">{counts.total}</p>
        </button>

        <button
          type="button"
          onClick={() => setStatusFilter("PENDING")}
          className={`p-3.5 rounded-xl border text-left transition-all cursor-pointer ${statusFilter === "PENDING"
              ? "bg-pending-50 border-pending-300 ring-2 ring-pending-500/20 shadow-xs"
              : "bg-surface border-border hover:bg-surface-raised"
            }`}
        >
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-pending-600" />
            <p className="text-[11px] font-semibold text-pending-700">รอการอนุมัติ</p>
          </div>
          <p className="text-xl sm:text-2xl font-black text-pending-900 mt-0.5">{counts.pending}</p>
        </button>

        <button
          type="button"
          onClick={() => setStatusFilter("APPROVED")}
          className={`p-3.5 rounded-xl border text-left transition-all cursor-pointer ${statusFilter === "APPROVED"
              ? "bg-available-50 border-available-300 ring-2 ring-available-500/20 shadow-xs"
              : "bg-surface border-border hover:bg-surface-raised"
            }`}
        >
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-available-600" />
            <p className="text-[11px] font-semibold text-available-700">อนุมัติแล้ว</p>
          </div>
          <p className="text-xl sm:text-2xl font-black text-available-900 mt-0.5">{counts.approved}</p>
        </button>

        <button
          type="button"
          onClick={() => setStatusFilter("REJECTED")}
          className={`p-3.5 rounded-xl border text-left transition-all cursor-pointer ${statusFilter === "REJECTED"
              ? "bg-unavailable-50 border-unavailable-300 ring-2 ring-unavailable-500/20 shadow-xs"
              : "bg-surface border-border hover:bg-surface-raised"
            }`}
        >
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-unavailable-600" />
            <p className="text-[11px] font-semibold text-unavailable-700">ไม่อนุมัติ</p>
          </div>
          <p className="text-xl sm:text-2xl font-black text-unavailable-900 mt-0.5">{counts.rejected}</p>
        </button>

        <button
          type="button"
          onClick={() => setStatusFilter("CANCELED")}
          className={`p-3.5 rounded-xl border text-left transition-all cursor-pointer col-span-2 sm:col-span-1 ${statusFilter === "CANCELED"
              ? "bg-secondary-100 border-secondary-400 ring-2 ring-secondary-500/20 shadow-xs"
              : "bg-surface border-border hover:bg-surface-raised"
            }`}
        >
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-secondary-500" />
            <p className="text-[11px] font-semibold text-secondary-700">ยกเลิกแล้ว</p>
          </div>
          <p className="text-xl sm:text-2xl font-black text-secondary-900 mt-0.5">{counts.canceled}</p>
        </button>
      </div>

      {/* ─── Search & Filters Bar ─── */}
      <div className="bg-surface p-4 sm:p-5 rounded-2xl border border-border shadow-xs space-y-3.5">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
          {/* Search Box */}
          <div className="relative lg:col-span-2">
            <div className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-text-muted">
              <Search className="w-4 h-4" />
            </div>
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="ค้นหาหัวข้อ, ชื่อผู้จอง, อีเมล, แผนก, หรือห้องประชุม..."
              className="w-full bg-surface-raised border border-border rounded-xl py-2 pl-9 pr-8 text-xs sm:text-sm text-text focus:outline-none focus:ring-1 focus:ring-primary-500"
            />
            {search && (
              <button
                type="button"
                onClick={() => setSearch("")}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-text-muted hover:text-text p-0.5 cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Room Filter */}
          <div className="relative">
            <div className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-text-muted">
              <DoorClosed className="w-4 h-4" />
            </div>
            <select
              value={roomFilter}
              onChange={(e) => setRoomFilter(e.target.value)}
              className="w-full bg-surface-raised border border-border rounded-xl py-2 pl-9 pr-7 text-xs sm:text-sm text-text cursor-pointer focus:outline-none focus:ring-1 focus:ring-primary-500"
            >
              <option value="ALL">ห้องประชุมทั้งหมด ({rooms.length})</option>
              {rooms.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.name}
                </option>
              ))}
            </select>
          </div>

          {/* Department Filter */}
          <div className="relative">
            <div className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-text-muted">
              <Building2 className="w-4 h-4" />
            </div>
            <select
              value={deptFilter}
              onChange={(e) => setDeptFilter(e.target.value)}
              className="w-full bg-surface-raised border border-border rounded-xl py-2 pl-9 pr-7 text-xs sm:text-sm text-text cursor-pointer focus:outline-none focus:ring-1 focus:ring-primary-500"
            >
              <option value="ALL">ทุกหน่วยงาน ({departments.length})</option>
              {departments.map((d) => (
                <option key={d.id} value={d.name}>
                  {d.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Date Range & Clear Filters Row */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-border/70 text-xs">
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-semibold text-text flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-text-muted" />
              ช่วงวันที่จัดประชุม:
            </span>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="bg-surface-raised border border-border rounded-lg px-2.5 py-1 text-text text-xs focus:outline-none focus:ring-1 focus:ring-primary-500"
            />
            <span className="text-text-muted">ถึง</span>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="bg-surface-raised border border-border rounded-lg px-2.5 py-1 text-text text-xs focus:outline-none focus:ring-1 focus:ring-primary-500"
            />
          </div>

          {hasActiveFilters && (
            <button
              type="button"
              onClick={resetFilters}
              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-surface-sunken hover:bg-surface-raised border border-border text-xs font-semibold text-unavailable-600 transition-colors cursor-pointer"
            >
              <RotateCcw className="w-3 h-3" />
              <span>ล้างตัวกรองทั้งหมด</span>
            </button>
          )}
        </div>
      </div>

      {/* ─── DataTable Card ─── */}
      <div className="bg-surface rounded-2xl border border-border shadow-xs overflow-hidden">
        {/* Table Controls (Showing X of Y, Rows per page) */}
        <div className="p-4 sm:p-5 border-b border-border flex flex-wrap items-center justify-between gap-3">
          <div className="text-xs sm:text-sm text-text-secondary">
            แสดง <strong className="text-text">{paginatedBookings.length}</strong> รายการ จากผลการกรอง{" "}
            <strong className="text-text">{totalItems}</strong> รายการ (ทั้งหมด {bookings.length} รายการ)
          </div>

          <div className="flex items-center gap-2 text-xs text-text-secondary">
            <span>แสดงต่อหน้า:</span>
            <select
              value={pageSize}
              onChange={(e) => {
                setPageSize(Number(e.target.value));
                setCurrentPage(1);
              }}
              className="bg-surface-raised border border-border rounded-lg py-1 px-2 text-xs text-text cursor-pointer focus:outline-none focus:ring-1 focus:ring-primary-500"
            >
              <option value={10}>10</option>
              <option value={25}>25</option>
              <option value={50}>50</option>
              <option value={100}>100</option>
            </select>
          </div>
        </div>

        {/* Table Element */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs sm:text-sm">
            <thead className="bg-surface-raised border-b border-border text-text-secondary font-bold text-xs select-none">
              <tr>
                <th className="py-3 px-3 text-center w-12">#</th>
                <th
                  onClick={() => handleSort("startTime")}
                  className="py-3 px-3.5 cursor-pointer hover:bg-surface-sunken transition-colors"
                >
                  <div className="flex items-center gap-1.5">
                    <span>วันและเวลาจัดประชุม</span>
                    {sortField === "startTime" ? (
                      sortDirection === "asc" ? <ArrowUp className="w-3.5 h-3.5 text-primary-600" /> : <ArrowDown className="w-3.5 h-3.5 text-primary-600" />
                    ) : (
                      <ArrowUpDown className="w-3.5 h-3.5 text-text-muted" />
                    )}
                  </div>
                </th>
                <th
                  onClick={() => handleSort("topic")}
                  className="py-3 px-3.5 cursor-pointer hover:bg-surface-sunken transition-colors"
                >
                  <div className="flex items-center gap-1.5">
                    <span>หัวข้อการประชุม</span>
                    {sortField === "topic" ? (
                      sortDirection === "asc" ? <ArrowUp className="w-3.5 h-3.5 text-primary-600" /> : <ArrowDown className="w-3.5 h-3.5 text-primary-600" />
                    ) : (
                      <ArrowUpDown className="w-3.5 h-3.5 text-text-muted" />
                    )}
                  </div>
                </th>
                <th
                  onClick={() => handleSort("room")}
                  className="py-3 px-3.5 cursor-pointer hover:bg-surface-sunken transition-colors"
                >
                  <div className="flex items-center gap-1.5">
                    <span>ห้องประชุม</span>
                    {sortField === "room" ? (
                      sortDirection === "asc" ? <ArrowUp className="w-3.5 h-3.5 text-primary-600" /> : <ArrowDown className="w-3.5 h-3.5 text-primary-600" />
                    ) : (
                      <ArrowUpDown className="w-3.5 h-3.5 text-text-muted" />
                    )}
                  </div>
                </th>
                <th
                  onClick={() => handleSort("employee")}
                  className="py-3 px-3.5 cursor-pointer hover:bg-surface-sunken transition-colors"
                >
                  <div className="flex items-center gap-1.5">
                    <span>ผู้ขอจอง / หน่วยงาน</span>
                    {sortField === "employee" ? (
                      sortDirection === "asc" ? <ArrowUp className="w-3.5 h-3.5 text-primary-600" /> : <ArrowDown className="w-3.5 h-3.5 text-primary-600" />
                    ) : (
                      <ArrowUpDown className="w-3.5 h-3.5 text-text-muted" />
                    )}
                  </div>
                </th>
                <th
                  onClick={() => handleSort("participant")}
                  className="py-3 px-3.5 text-center cursor-pointer hover:bg-surface-sunken transition-colors"
                >
                  <div className="flex items-center justify-center gap-1.5">
                    <span>ผู้เข้าร่วม</span>
                    {sortField === "participant" ? (
                      sortDirection === "asc" ? <ArrowUp className="w-3.5 h-3.5 text-primary-600" /> : <ArrowDown className="w-3.5 h-3.5 text-primary-600" />
                    ) : (
                      <ArrowUpDown className="w-3.5 h-3.5 text-text-muted" />
                    )}
                  </div>
                </th>
                <th
                  onClick={() => handleSort("status")}
                  className="py-3 px-3.5 text-center cursor-pointer hover:bg-surface-sunken transition-colors"
                >
                  <div className="flex items-center justify-center gap-1.5">
                    <span>สถานะ</span>
                    {sortField === "status" ? (
                      sortDirection === "asc" ? <ArrowUp className="w-3.5 h-3.5 text-primary-600" /> : <ArrowDown className="w-3.5 h-3.5 text-primary-600" />
                    ) : (
                      <ArrowUpDown className="w-3.5 h-3.5 text-text-muted" />
                    )}
                  </div>
                </th>
                <th className="py-3 px-3.5 text-center w-20">จัดการ</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-border/60">
              {loading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i} className="animate-pulse">
                    <td className="py-4 px-3 text-center">
                      <div className="h-4 w-4 bg-surface-sunken rounded mx-auto" />
                    </td>
                    <td className="py-4 px-3.5">
                      <div className="h-4 w-32 bg-surface-sunken rounded mb-1" />
                      <div className="h-3 w-20 bg-surface-sunken rounded" />
                    </td>
                    <td className="py-4 px-3.5">
                      <div className="h-4 w-44 bg-surface-sunken rounded" />
                    </td>
                    <td className="py-4 px-3.5">
                      <div className="h-4 w-28 bg-surface-sunken rounded" />
                    </td>
                    <td className="py-4 px-3.5">
                      <div className="h-4 w-32 bg-surface-sunken rounded mb-1" />
                      <div className="h-3 w-24 bg-surface-sunken rounded" />
                    </td>
                    <td className="py-4 px-3.5 text-center">
                      <div className="h-4 w-8 bg-surface-sunken rounded mx-auto" />
                    </td>
                    <td className="py-4 px-3.5 text-center">
                      <div className="h-5 w-20 bg-surface-sunken rounded-full mx-auto" />
                    </td>
                    <td className="py-4 px-3.5 text-center">
                      <div className="h-7 w-7 bg-surface-sunken rounded-lg mx-auto" />
                    </td>
                  </tr>
                ))
              ) : paginatedBookings.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center">
                    <div className="flex flex-col items-center justify-center max-w-sm mx-auto text-text-muted space-y-2">
                      <FileText className="w-10 h-10 stroke-1 opacity-50" />
                      <p className="font-bold text-text text-sm">ไม่พบข้อมูลประวัติการจอง</p>
                      <p className="text-xs">
                        ไม่มีรายการที่ตรงกับเงื่อนไขการค้นหาหรือตัวกรองที่เลือก
                      </p>
                      {hasActiveFilters && (
                        <button
                          type="button"
                          onClick={resetFilters}
                          className="mt-2 text-xs font-semibold text-primary-600 hover:text-primary-700 underline cursor-pointer"
                        >
                          ล้างตัวกรองทั้งหมด
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ) : (
                paginatedBookings.map((booking, index) => {
                  const rowIndex = (currentPage - 1) * pageSize + index + 1;
                  const dt = formatDateTimeDisplay(booking.startTime, booking.endTime);

                  return (
                    <tr
                      key={booking.id}
                      className="hover:bg-surface-raised/80 transition-colors group cursor-pointer"
                      onClick={() => {
                        setDetailBooking(booking);
                        setIsDetailOpen(true);
                      }}
                    >
                      {/* # */}
                      <td className="py-3.5 px-3 text-center text-xs font-medium text-text-muted">
                        {rowIndex}
                      </td>

                      {/* Date & Time */}
                      <td className="py-3.5 px-3.5">
                        <div className="font-semibold text-text text-xs sm:text-sm">
                          {dt.dateText}
                        </div>
                        <div className="text-xs text-text-muted flex items-center gap-1 mt-0.5">
                          <Clock className="w-3 h-3 text-text-muted shrink-0" />
                          <span>{dt.timeText}</span>
                          <span className="text-[11px] text-text-secondary">{dt.duration}</span>
                        </div>
                      </td>

                      {/* Topic & Note */}
                      <td className="py-3.5 px-3.5 max-w-xs sm:max-w-sm">
                        <div className="font-bold text-text text-xs sm:text-sm line-clamp-1 group-hover:text-primary-600 transition-colors">
                          {booking.topic}
                        </div>
                        {booking.note && (
                          <div className="text-xs text-text-secondary line-clamp-1 mt-0.5">
                            {booking.note}
                          </div>
                        )}
                      </td>

                      {/* Room */}
                      <td className="py-3.5 px-3.5">
                        <div className="flex items-center gap-1.5 font-semibold text-text text-xs sm:text-sm">
                          <DoorClosed className="w-3.5 h-3.5 text-primary-600 shrink-0" />
                          <span className="truncate">{booking.room?.name || "ไม่ระบุห้อง"}</span>
                        </div>
                        <div className="text-[11px] text-text-muted mt-0.5">
                          ความจุ {booking.room?.capacity || 0} ที่นั่ง
                        </div>
                      </td>

                      {/* Booker & Department */}
                      <td className="py-3.5 px-3.5">
                        <div className="font-semibold text-text text-xs sm:text-sm truncate">
                          {booking.employee?.firstname} {booking.employee?.lastname}
                        </div>
                        <div className="text-xs text-text-muted truncate mt-0.5">
                          {booking.employee?.department || "ไม่ระบุแผนก"}
                        </div>
                      </td>

                      {/* Participants */}
                      <td className="py-3.5 px-3.5 text-center">
                        <span className="inline-flex items-center gap-1 text-xs font-semibold text-text bg-surface-raised px-2.5 py-1 rounded-lg border border-border">
                          <Users className="w-3 h-3 text-text-muted" />
                          <span>{booking.participant}</span>
                        </span>
                      </td>

                      {/* Status */}
                      <td className="py-3.5 px-3.5 text-center">
                        {getStatusBadge(booking.status)}
                      </td>

                      {/* Action: View Details */}
                      <td
                        className="py-3.5 px-3.5 text-center"
                        onClick={(e) => {
                          e.stopPropagation();
                          setDetailBooking(booking);
                          setIsDetailOpen(true);
                        }}
                      >
                        <button
                          type="button"
                          className="p-1.5 rounded-lg border border-border bg-surface hover:bg-primary-50 hover:border-primary-300 text-text-muted hover:text-primary-600 transition-colors cursor-pointer shadow-2xs"
                          title="ดูรายละเอียดการจอง"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Footer */}
        <div className="p-4 sm:p-5 border-t border-border flex flex-wrap items-center justify-between gap-3 bg-surface-raised">
          <div className="text-xs text-text-secondary">
            หน้า <strong className="text-text">{currentPage}</strong> จากทั้งหมด{" "}
            <strong className="text-text">{totalPages}</strong> หน้า
          </div>

          <div className="flex items-center gap-1.5">
            <button
              type="button"
              disabled={currentPage <= 1}
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg border border-border bg-surface text-xs font-semibold text-text disabled:opacity-40 disabled:cursor-not-allowed hover:bg-surface-sunken transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
              <span>ก่อนหน้า</span>
            </button>

            {/* Quick Page Number Pills */}
            <div className="hidden sm:flex items-center gap-1 px-1">
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                let pageNum = i + 1;
                if (totalPages > 5 && currentPage > 3) {
                  pageNum = currentPage - 2 + i;
                  if (pageNum > totalPages) pageNum = totalPages - (4 - i);
                }
                return (
                  <button
                    key={pageNum}
                    type="button"
                    onClick={() => setCurrentPage(pageNum)}
                    className={`w-7 h-7 rounded-lg text-xs font-bold transition-colors cursor-pointer ${currentPage === pageNum
                        ? "bg-primary-600 text-white shadow-2xs"
                        : "bg-surface border border-border text-text hover:bg-surface-sunken"
                      }`}
                  >
                    {pageNum}
                  </button>
                );
              })}
            </div>

            <button
              type="button"
              disabled={currentPage >= totalPages}
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg border border-border bg-surface text-xs font-semibold text-text disabled:opacity-40 disabled:cursor-not-allowed hover:bg-surface-sunken transition-colors"
            >
              <span>ถัดไป</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* ─── Detail Modal ─── */}
      <BookingDetail
        isOpen={isDetailOpen}
        booking={detailBooking}
        onClose={() => {
          setIsDetailOpen(false);
          setDetailBooking(null);
        }}
        readOnly={true}
      />
    </div>
  );
}
