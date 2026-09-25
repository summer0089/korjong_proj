"use client";

import React from "react";
import { Plus, Eye } from "lucide-react";
import { DateNavigator } from "./DateNavigator";
import { SearchInput } from "./SearchInput";
import { RoomFilter } from "./RoomFilter";
import { StatusFilter } from "./StatusFilter";
import { MeetingRoom } from "./types";

export interface SchedulerToolbarProps {
  currentDate: Date;
  onDateChange: (date: Date) => void;
  search: string;
  onSearchChange: (value: string) => void;
  rooms: MeetingRoom[];
  selectedRoomId: string;
  onRoomChange: (roomId: string) => void;
  selectedStatus: string;
  onStatusChange: (status: string) => void;
  onOpenAddModal: () => void;
  readOnly?: boolean;
  className?: string;
}

export const SchedulerToolbar: React.FC<SchedulerToolbarProps> = ({
  currentDate,
  onDateChange,
  search,
  onSearchChange,
  rooms,
  selectedRoomId,
  onRoomChange,
  selectedStatus,
  onStatusChange,
  onOpenAddModal,
  readOnly = false,
  className = "",
}) => {
  return (
    <div
      className={`bg-surface border border-border rounded-xl p-3.5 sm:p-4 shadow-xs space-y-3.5 ${className}`}
    >
      {/* Top Row: Date Navigator & Action Button */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <DateNavigator
          currentDate={currentDate}
          onDateChange={onDateChange}
        />

        <div className="flex items-center gap-2 shrink-0 self-end sm:self-auto">
          {readOnly ? (
            <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-surface-sunken border border-border text-xs font-medium text-text-secondary select-none">
              <Eye className="w-3.5 h-3.5 text-text-muted" />
              <span>โหมดดูข้อมูลเท่านั้น (Read-Only)</span>
            </div>
          ) : (
            <button
              type="button"
              onClick={onOpenAddModal}
              className="inline-flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-lg bg-primary-600 hover:bg-primary-700 text-white font-medium text-xs sm:text-sm shadow-sm transition-all focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-1 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>จองห้องประชุม</span>
            </button>
          )}
        </div>
      </div>

      {/* Bottom Row: Search & Filters */}
      <div className="flex flex-wrap items-center gap-2.5 pt-3 border-t border-border/60">
        <SearchInput
          value={search}
          onChange={onSearchChange}
          className="flex-1 min-w-50"
        />

        <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
          <RoomFilter
            rooms={rooms}
            selectedRoomId={selectedRoomId}
            onChange={onRoomChange}
            className="flex-1 sm:flex-initial"
          />

          <StatusFilter
            selectedStatus={selectedStatus}
            onChange={onStatusChange}
            className="flex-1 sm:flex-initial"
          />
        </div>
      </div>
    </div>
  );
};

export default SchedulerToolbar;
