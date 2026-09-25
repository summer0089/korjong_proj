"use client";

import React from "react";
import { Filter, ChevronDown } from "lucide-react";

export interface StatusFilterProps {
  selectedStatus: string;
  onChange: (status: string) => void;
  className?: string;
}

export const StatusFilter: React.FC<StatusFilterProps> = ({
  selectedStatus,
  onChange,
  className = "",
}) => {
  return (
    <div className={`relative min-w-32.5 sm:min-w-37.5 ${className}`}>
      <div className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-text-muted">
        <Filter className="w-4 h-4" />
      </div>

      <select
        value={selectedStatus}
        onChange={(e) => onChange(e.target.value)}
        className="w-full bg-surface border border-border rounded-lg py-1.5 pl-9 pr-8 text-xs sm:text-sm text-text appearance-none hover:border-border-strong focus:outline-none focus:ring-1 focus:ring-primary-500 shadow-xs cursor-pointer"
      >
        <option value="APPROVED_PENDING">อนุมัติและรออนุมัติ</option>
        <option value="ALL">สถานะทั้งหมด</option>
        <option value="APPROVED">เฉพาะที่อนุมัติแล้ว</option>
        <option value="PENDING">เฉพาะที่รอการอนุมัติ</option>
        <option value="REJECTED">ไม่อนุมัติ</option>
        <option value="CANCELED">ยกเลิกแล้ว</option>
      </select>

      <div className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-text-muted">
        <ChevronDown className="w-3.5 h-3.5" />
      </div>
    </div>
  );
};

export default StatusFilter;
