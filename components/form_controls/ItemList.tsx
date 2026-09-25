"use client";

import React, { useState, useMemo } from "react";
import {
  Search,
  X,
  Calendar,
  DoorClosed,
  Users,
  User,
  FileText,
  CheckCircle2,
  Clock3,
  XCircle,
  AlertCircle,
  Edit,
  Trash2,
  Check,
  Ban,
  Eye,
  Inbox,
  Filter,
  ArrowUpDown,
  Sparkles,
} from "lucide-react";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export interface ItemListProps<T = any> {
  items: T[];
  loading?: boolean;
  searchable?: boolean;
  searchPlaceholder?: string;
  statusFilterable?: boolean;
  title?: string;
  subtitle?: string;
  emptyTitle?: string;
  emptyDescription?: string;
  renderItem?: (item: T, index: number) => React.ReactNode;
  onApprove?: (item: T) => Promise<boolean | void> | void;
  onReject?: (item: T, reason?: string) => Promise<boolean | void> | void;
  onEdit?: (item: T) => void;
  onCancel?: (item: T, reason?: string) => Promise<boolean | void> | void;
  onDelete?: (item: T) => Promise<boolean | void> | void;
  onViewDetails?: (item: T) => void;
  headerActions?: React.ReactNode;
  currentUserId?: string | null;
  className?: string;
}

const THAI_MONTHS_SHORT = [
  "ม.ค.", "ก.พ.", "มี.ค.", "เม.ย.", "พ.ค.", "มิ.ย.",
  "ก.ค.", "ส.ค.", "ก.ย.", "ต.ค.", "พ.ย.", "ธ.ค."
];

export function ItemList<T extends Record<string, any>>({
  items,
  loading = false,
  searchable = true,
  searchPlaceholder = "ค้นหาหัวข้อ, ห้องประชุม, ผู้จอง...",
  statusFilterable = true,
  title,
  subtitle,
  emptyTitle = "ไม่พบรายการ",
  emptyDescription = "ยังไม่มีรายการคำขอจองในระบบ หรือไม่ตรงกับเงื่อนไขการค้นหา",
  renderItem,
  onApprove,
  onReject,
  onEdit,
  onCancel,
  onDelete,
  onViewDetails,
  headerActions,
  currentUserId,
  className = "",
}: ItemListProps<T>) {
  // Search & Filter State
  const [search, setSearch] = useState("");
  const [selectedStatus, setSelectedStatus] = useState<string>("ALL");
  const [sortBy, setSortBy] = useState<"newest" | "oldest" | "startTime">("startTime");

  // Action Confirmation Modals State
  const [actionItem, setActionItem] = useState<T | null>(null);
  const [actionType, setActionType] = useState<"approve" | "reject" | "cancel" | "delete" | null>(null);
  const [actionReason, setActionReason] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);

  // Filtered & Sorted items
  const filteredItems = useMemo(() => {
    let result = [...items];

    // Status filter
    if (statusFilterable && selectedStatus !== "ALL") {
      result = result.filter((item) => item.status === selectedStatus);
    }

    // Search filter
    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter((item) => {
        const topic = (item.topic || "").toLowerCase();
        const note = (item.note || "").toLowerCase();
        const roomName = (item.room?.name || "").toLowerCase();
        const booker = item.employee
          ? `${item.employee.firstname} ${item.employee.lastname}`.toLowerCase()
          : "";
        const dept = (item.employee?.department || "").toLowerCase();

        return (
          topic.includes(q) ||
          note.includes(q) ||
          roomName.includes(q) ||
          booker.includes(q) ||
          dept.includes(q)
        );
      });
    }

    // Sorting
    result.sort((a, b) => {
      if (sortBy === "newest") {
        const tA = new Date(a.createdAt || a.startTime).getTime();
        const tB = new Date(b.createdAt || b.startTime).getTime();
        return tB - tA;
      }
      if (sortBy === "oldest") {
        const tA = new Date(a.createdAt || a.startTime).getTime();
        const tB = new Date(b.createdAt || b.startTime).getTime();
        return tA - tB;
      }
      // sortBy === "startTime"
      const tA = new Date(a.startTime).getTime();
      const tB = new Date(b.startTime).getTime();
      return tB - tA; // upcoming / most recent start time first
    });

    return result;
  }, [items, selectedStatus, search, sortBy, statusFilterable]);

  // Format Helpers
  const formatDateTime = (dateStr: string) => {
    try {
      const d = new Date(dateStr);
      if (isNaN(d.getTime())) return dateStr;
      const day = d.getDate();
      const month = THAI_MONTHS_SHORT[d.getMonth()];
      const thaiYear = d.getFullYear() + 543;
      const time = d.toLocaleTimeString("th-TH", { hour: "2-digit", minute: "2-digit" });
      return `${day} ${month} ${thaiYear} • ${time} น.`;
    } catch {
      return dateStr;
    }
  };

  const formatTimeOnly = (dateStr: string) => {
    try {
      const d = new Date(dateStr);
      return d.toLocaleTimeString("th-TH", { hour: "2-digit", minute: "2-digit" });
    } catch {
      return dateStr;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "APPROVED":
        return {
          bg: "bg-available-50 text-available-800 border-available-300",
          icon: <CheckCircle2 className="w-3.5 h-3.5 text-available-600" />,
          label: "อนุมัติแล้ว",
        };
      case "PENDING":
        return {
          bg: "bg-pending-50 text-pending-800 border-pending-300",
          icon: <Clock3 className="w-3.5 h-3.5 text-pending-600" />,
          label: "รอการอนุมัติ",
        };
      case "REJECTED":
        return {
          bg: "bg-unavailable-50 text-unavailable-800 border-unavailable-300",
          icon: <AlertCircle className="w-3.5 h-3.5 text-unavailable-600" />,
          label: "ไม่อนุมัติ",
        };
      case "CANCELED":
      default:
        return {
          bg: "bg-secondary-100 text-secondary-700 border-secondary-300",
          icon: <XCircle className="w-3.5 h-3.5 text-secondary-500" />,
          label: "ยกเลิกแล้ว",
        };
    }
  };

  // Action Confirmation Handlers
  const handleConfirmAction = async () => {
    if (!actionItem || !actionType) return;
    try {
      setIsProcessing(true);
      if (actionType === "approve" && onApprove) {
        await onApprove(actionItem);
      } else if (actionType === "reject" && onReject) {
        await onReject(actionItem, actionReason.trim());
      } else if (actionType === "cancel" && onCancel) {
        await onCancel(actionItem, actionReason.trim());
      } else if (actionType === "delete" && onDelete) {
        await onDelete(actionItem);
      }
      setActionItem(null);
      setActionType(null);
      setActionReason("");
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Top Header Card */}
      <div className="bg-surface p-4 sm:p-5 rounded-2xl border border-border shadow-xs flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          {title && <h2 className="text-lg sm:text-xl font-bold text-text">{title}</h2>}
          {subtitle && <p className="text-xs sm:text-sm text-text-secondary mt-0.5">{subtitle}</p>}
        </div>

        {/* Custom Header Actions (e.g. "+ จองห้องประชุมใหม่") */}
        {headerActions && <div className="flex items-center gap-2 self-start md:self-auto">{headerActions}</div>}
      </div>

      {/* Toolbar: Search, Status Filter & Sorting */}
      <div className="bg-surface p-3.5 sm:p-4 rounded-xl border border-border shadow-xs flex flex-wrap items-center justify-between gap-3">
        {/* Search Input */}
        {searchable && (
          <div className="relative flex-1 min-w-55 max-w-md">
            <div className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-text-muted">
              <Search className="w-4 h-4" />
            </div>
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={searchPlaceholder}
              className="w-full bg-surface-raised border border-border rounded-lg py-2 pl-9 pr-8 text-xs sm:text-sm text-text focus:outline-none focus:ring-1 focus:ring-primary-500"
            />
            {search && (
              <button
                type="button"
                onClick={() => setSearch("")}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-text-muted hover:text-text p-0.5 rounded"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        )}

        {/* Filter & Sort Controls */}
        <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
          {/* Status Filter */}
          {statusFilterable && (
            <div className="relative flex-1 sm:flex-initial">
              <div className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-text-muted">
                <Filter className="w-3.5 h-3.5" />
              </div>
              <select
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
                className="w-full bg-surface-raised border border-border rounded-lg py-1.5 pl-8 pr-7 text-xs sm:text-sm text-text appearance-none cursor-pointer focus:outline-none focus:ring-1 focus:ring-primary-500"
              >
                <option value="ALL">สถานะทั้งหมด ({items.length})</option>
                <option value="PENDING">
                  รออนุมัติ ({items.filter((i) => i.status === "PENDING").length})
                </option>
                <option value="APPROVED">
                  อนุมัติแล้ว ({items.filter((i) => i.status === "APPROVED").length})
                </option>
                <option value="REJECTED">
                  ไม่อนุมัติ ({items.filter((i) => i.status === "REJECTED").length})
                </option>
                <option value="CANCELED">
                  ยกเลิกแล้ว ({items.filter((i) => i.status === "CANCELED").length})
                </option>
              </select>
            </div>
          )}

          {/* Sort By */}
          <div className="relative flex-1 sm:flex-initial">
            <div className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-text-muted">
              <ArrowUpDown className="w-3.5 h-3.5" />
            </div>
            <select
              value={sortBy}
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              onChange={(e) => setSortBy(e.target.value as any)}
              className="w-full bg-surface-raised border border-border rounded-lg py-1.5 pl-8 pr-7 text-xs sm:text-sm text-text appearance-none cursor-pointer focus:outline-none focus:ring-1 focus:ring-primary-500"
            >
              <option value="startTime">เรียงตามวันเวลาที่จอง</option>
              <option value="newest">ยื่นคำขอล่าสุดก่อน</option>
              <option value="oldest">ยื่นคำขอแรกสุดก่อน</option>
            </select>
          </div>
        </div>
      </div>

      {/* List Container */}
      <div className="space-y-3">
        {/* Loading State Skeleton */}
        {loading && (
          <div className="space-y-3">
            {[1, 2, 3].map((n) => (
              <div
                key={n}
                className="bg-surface p-4 sm:p-5 rounded-xl border border-border shadow-xs animate-pulse space-y-3"
              >
                <div className="flex items-center justify-between">
                  <div className="h-4 bg-surface-sunken rounded w-1/3" />
                  <div className="h-6 bg-surface-sunken rounded-full w-20" />
                </div>
                <div className="h-3 bg-surface-sunken rounded w-1/2" />
                <div className="h-3 bg-surface-sunken rounded w-2/3" />
              </div>
            ))}
          </div>
        )}

        {/* Empty State */}
        {!loading && filteredItems.length === 0 && (
          <div className="bg-surface p-8 sm:p-12 rounded-2xl border border-border text-center space-y-3 shadow-xs">
            <div className="w-12 h-12 rounded-2xl bg-surface-sunken text-text-muted flex items-center justify-center mx-auto">
              <Inbox className="w-6 h-6" />
            </div>
            <div className="space-y-1 max-w-sm mx-auto">
              <h3 className="text-base font-bold text-text">{emptyTitle}</h3>
              <p className="text-xs sm:text-sm text-text-secondary">{emptyDescription}</p>
            </div>
            {search && (
              <button
                type="button"
                onClick={() => {
                  setSearch("");
                  setSelectedStatus("ALL");
                }}
                className="px-3.5 py-1.5 rounded-lg bg-surface-raised border border-border hover:bg-surface-sunken text-xs font-semibold text-text transition-colors"
              >
                ล้างตัวกรองการค้นหา
              </button>
            )}
          </div>
        )}

        {/* Item Cards */}
        {!loading &&
          filteredItems.map((item, index) => {
            if (renderItem) {
              return <React.Fragment key={item.id || index}>{renderItem(item, index)}</React.Fragment>;
            }

            const statusBadge = getStatusBadge(item.status);
            const isOwner = Boolean(
              currentUserId && item.employeeId && item.employeeId === currentUserId
            );

            const startStr = formatDateTime(item.startTime);
            const endTimeStr = formatTimeOnly(item.endTime);

            return (
              <div
                key={item.id || index}
                className="bg-surface rounded-2xl border border-border hover:border-border-strong p-4 sm:p-5 shadow-xs hover:shadow-card transition-all space-y-3.5 select-none"
              >
                {/* Card Top: Topic & Status Badge */}
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-2.5">
                  <div className="space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span
                        className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full border text-xs font-semibold ${statusBadge.bg}`}
                      >
                        {statusBadge.icon}
                        <span>{statusBadge.label}</span>
                      </span>

                      {isOwner && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-primary-50 text-primary-700 border border-primary-200 text-[11px] font-bold">
                          <Sparkles className="w-3 h-3 text-primary-600" />
                          <span>การจองของฉัน</span>
                        </span>
                      )}
                    </div>

                    <h3 className="text-base sm:text-lg font-bold text-text hover:text-primary-600 transition-colors">
                      {item.topic}
                    </h3>
                  </div>

                  {/* Date & Time pill */}
                  <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-surface-raised border border-border/80 text-xs font-semibold text-text-secondary self-start sm:self-auto shrink-0">
                    <Calendar className="w-3.5 h-3.5 text-primary-600" />
                    <span>
                      {startStr} - {endTimeStr} น.
                    </span>
                  </div>
                </div>

                {/* Card Info Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 p-3 rounded-xl bg-surface-sunken/60 border border-border/60 text-xs">
                  {/* Room */}
                  <div className="flex items-center gap-2">
                    <div className="p-1.5 rounded-lg bg-surface border border-border/80 text-primary-600 shrink-0">
                      <DoorClosed className="w-3.5 h-3.5" />
                    </div>
                    <div className="truncate">
                      <p className="text-[11px] text-text-muted">ห้องประชุม</p>
                      <p className="font-semibold text-text truncate">
                        {item.room?.name || "ไม่ระบุห้อง"}
                        {item.room?.capacity ? ` (${item.room.capacity} ที่นั่ง)` : ""}
                      </p>
                    </div>
                  </div>

                  {/* Booker */}
                  <div className="flex items-center gap-2">
                    <div className="p-1.5 rounded-lg bg-surface border border-border/80 text-primary-600 shrink-0">
                      <User className="w-3.5 h-3.5" />
                    </div>
                    <div className="truncate">
                      <p className="text-[11px] text-text-muted">ผู้ขอจอง</p>
                      <p className="font-semibold text-text truncate">
                        {item.employee
                          ? `${item.employee.firstname} ${item.employee.lastname}`
                          : "ไม่ระบุ"}
                        {item.employee?.department ? ` • ${item.employee.department}` : ""}
                      </p>
                    </div>
                  </div>

                  {/* Participants */}
                  <div className="flex items-center gap-2">
                    <div className="p-1.5 rounded-lg bg-surface border border-border/80 text-primary-600 shrink-0">
                      <Users className="w-3.5 h-3.5" />
                    </div>
                    <div>
                      <p className="text-[11px] text-text-muted">จำนวนผู้เข้าร่วม</p>
                      <p className="font-semibold text-text">{item.participant || 1} ท่าน</p>
                    </div>
                  </div>
                </div>

                {/* Note / Equipment */}
                {item.note && (
                  <div className="flex items-start gap-2 text-xs text-text-secondary px-1">
                    <FileText className="w-3.5 h-3.5 text-text-muted shrink-0 mt-0.5" />
                    <p className="leading-relaxed line-clamp-2">{item.note}</p>
                  </div>
                )}

                {/* Card Actions Footer */}
                <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-border/60">
                  <span className="text-[11px] text-text-muted">
                    {item.createdAt ? `สร้างเมื่อ ${formatDateTime(item.createdAt)}` : ""}
                  </span>

                  <div className="flex flex-wrap items-center gap-2">
                    {/* Approver Actions */}
                    {onApprove && item.status === "PENDING" && (
                      <button
                        type="button"
                        onClick={() => {
                          setActionItem(item);
                          setActionType("approve");
                        }}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-available-600 hover:bg-available-700 text-white text-xs font-semibold shadow-xs transition-colors"
                      >
                        <Check className="w-3.5 h-3.5" />
                        <span>อนุมัติ</span>
                      </button>
                    )}

                    {onReject && item.status === "PENDING" && (
                      <button
                        type="button"
                        onClick={() => {
                          setActionItem(item);
                          setActionType("reject");
                          setActionReason("");
                        }}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-unavailable-300 text-unavailable-700 hover:bg-unavailable-50 text-xs font-medium transition-colors"
                      >
                        <Ban className="w-3.5 h-3.5" />
                        <span>ไม่อนุมัติ</span>
                      </button>
                    )}

                    {/* Owner Edit Action */}
                    {onEdit && item.status !== "CANCELED" && item.status !== "REJECTED" && (
                      <button
                        type="button"
                        onClick={() => onEdit(item)}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-primary-50 text-primary-700 hover:bg-primary-100 border border-primary-200 text-xs font-semibold transition-colors"
                      >
                        <Edit className="w-3.5 h-3.5" />
                        <span>แก้ไข</span>
                      </button>
                    )}

                    {/* Owner Cancel Action */}
                    {onCancel && item.status !== "CANCELED" && item.status !== "REJECTED" && (
                      <button
                        type="button"
                        onClick={() => {
                          setActionItem(item);
                          setActionType("cancel");
                          setActionReason("");
                        }}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-unavailable-300 text-unavailable-700 hover:bg-unavailable-50 text-xs font-medium transition-colors"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>ยกเลิก</span>
                      </button>
                    )}

                    {/* Delete Action (for canceled/rejected items) */}
                    {onDelete && (item.status === "CANCELED" || item.status === "REJECTED") && (
                      <button
                        type="button"
                        onClick={() => {
                          setActionItem(item);
                          setActionType("delete");
                        }}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-border hover:border-unavailable-400 text-text-muted hover:text-unavailable-700 hover:bg-unavailable-50 text-xs font-medium transition-colors"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>ลบรายการ</span>
                      </button>
                    )}

                    {/* View Details Modal Trigger */}
                    {onViewDetails && (
                      <button
                        type="button"
                        onClick={() => onViewDetails(item)}
                        className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-surface border border-border hover:bg-surface-sunken text-text text-xs font-medium transition-colors"
                      >
                        <Eye className="w-3.5 h-3.5 text-text-muted" />
                        <span>รายละเอียด</span>
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
      </div>

      {/* Confirmation Modal */}
      {actionItem && actionType && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-fade-in">
          <div className="w-full max-w-md bg-surface rounded-2xl shadow-2xl border border-border p-5 space-y-4 animate-scale-up">
            <div className="space-y-1.5">
              <h3 className="text-base font-bold text-text flex items-center gap-2">
                {actionType === "approve" && <CheckCircle2 className="w-5 h-5 text-available-600" />}
                {actionType === "reject" && <AlertCircle className="w-5 h-5 text-unavailable-600" />}
                {actionType === "cancel" && <AlertCircle className="w-5 h-5 text-unavailable-600" />}
                {actionType === "delete" && <Trash2 className="w-5 h-5 text-unavailable-600" />}
                <span>
                  {actionType === "approve" && "ยืนยันการอนุมัติคำขอจอง"}
                  {actionType === "reject" && "ยืนยันไม่อนุมัติคำขอจอง"}
                  {actionType === "cancel" && "ยืนยันยกเลิกการจอง"}
                  {actionType === "delete" && "ยืนยันลบข้อมูลการจองถาวร"}
                </span>
              </h3>
              <p className="text-xs text-text-secondary leading-relaxed">
                {actionType === "approve" && `คุณต้องการอนุมัติการจองห้องประชุม "${actionItem.topic}" ใช่หรือไม่?`}
                {actionType === "reject" && `คุณต้องการปฏิเสธคำขอจอง "${actionItem.topic}" ใช่หรือไม่?`}
                {actionType === "cancel" && `เมื่อยกเลิกแล้ว ช่วงเวลาของ "${actionItem.topic}" จะว่างเพื่อให้ผู้อื่นจองต่อได้`}
                {actionType === "delete" && `ข้อมูลการจอง "${actionItem.topic}" จะถูกลบออกจากระบบอย่างถาวร`}
              </p>
            </div>

            {/* Optional Reason Input for Reject or Cancel */}
            {(actionType === "reject" || actionType === "cancel") && (
              <div className="space-y-1">
                <label className="block text-xs font-semibold text-text-secondary">
                  ระบุเหตุผล (ถ้ามี):
                </label>
                <input
                  type="text"
                  value={actionReason}
                  onChange={(e) => setActionReason(e.target.value)}
                  placeholder="เช่น ห้องปิดซ่อมบำรุง หรือ ติดภารกิจด่วน"
                  className="w-full bg-surface-raised border border-border rounded-lg p-2.5 text-xs text-text focus:outline-none focus:ring-1 focus:ring-primary-500"
                />
              </div>
            )}

            {/* Modal Actions */}
            <div className="flex items-center justify-end gap-2 pt-2 border-t border-border/80">
              <button
                type="button"
                disabled={isProcessing}
                onClick={() => {
                  setActionItem(null);
                  setActionType(null);
                }}
                className="px-3.5 py-1.5 rounded-lg bg-surface border border-border hover:bg-surface-sunken text-xs font-medium text-text transition-colors"
              >
                ย้อนกลับ
              </button>

              <button
                type="button"
                disabled={isProcessing}
                onClick={handleConfirmAction}
                className={`px-4 py-1.5 rounded-lg text-xs font-bold text-white shadow-xs transition-colors ${actionType === "approve"
                    ? "bg-available-600 hover:bg-available-700"
                    : "bg-unavailable-600 hover:bg-unavailable-700"
                  }`}
              >
                {isProcessing
                  ? "กำลังบันทึก..."
                  : actionType === "approve"
                    ? "ยืนยันอนุมัติ"
                    : actionType === "reject"
                      ? "ยืนยันไม่อนุมัติ"
                      : actionType === "cancel"
                        ? "ยืนยันยกเลิก"
                        : "ยืนยันลบ"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default ItemList;
