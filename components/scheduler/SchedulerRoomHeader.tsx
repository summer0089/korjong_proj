"use client";

import React from "react";
import { Users, ChevronLeft, ChevronRight, Building } from "lucide-react";
import { MeetingRoom } from "./types";

export interface SchedulerRoomHeaderProps {
  rooms: MeetingRoom[];
  isMobile: boolean;
  activeMobileRoomId: string;
  onMobileRoomChange: (roomId: string) => void;
  columnWidth: number;
  className?: string;
}

export const SchedulerRoomHeader: React.FC<SchedulerRoomHeaderProps> = ({
  rooms,
  isMobile,
  activeMobileRoomId,
  onMobileRoomChange,
  columnWidth,
  className = "",
}) => {
  // Mobile Single Room View Header
  if (isMobile) {
    const activeIndex = rooms.findIndex((r) => r.id === activeMobileRoomId);
    const activeRoom = rooms[activeIndex >= 0 ? activeIndex : 0] || rooms[0];

    const handlePrevRoom = () => {
      if (activeIndex > 0) {
        onMobileRoomChange(rooms[activeIndex - 1].id);
      } else {
        onMobileRoomChange(rooms[rooms.length - 1].id);
      }
    };

    const handleNextRoom = () => {
      if (activeIndex < rooms.length - 1) {
        onMobileRoomChange(rooms[activeIndex + 1].id);
      } else {
        onMobileRoomChange(rooms[0].id);
      }
    };

    return (
      <div
        className={`sticky top-0 z-30 bg-surface-raised border-b border-border p-2.5 flex items-center justify-between gap-2 shadow-xs ${className}`}
      >
        <button
          type="button"
          onClick={handlePrevRoom}
          disabled={rooms.length <= 1}
          className="p-1.5 rounded-lg border border-border bg-surface text-text-secondary hover:text-text hover:bg-surface-sunken disabled:opacity-40 transition-colors"
          title="ห้องก่อนหน้า"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>

        <div className="flex-1 max-w-xs">
          <div className="relative">
            <select
              value={activeRoom?.id}
              onChange={(e) => onMobileRoomChange(e.target.value)}
              className="w-full bg-surface border border-border-strong rounded-lg py-1.5 px-3 text-sm font-semibold text-text text-center appearance-none focus:outline-none focus:ring-1 focus:ring-primary-500"
            >
              {rooms.map((room) => (
                <option key={room.id} value={room.id}>
                  {room.name} ({room.capacity} ที่นั่ง)
                </option>
              ))}
            </select>
          </div>
          {activeRoom && (
            <div className="flex items-center justify-center gap-2 mt-1 text-[11px] text-text-secondary">
              <span className="inline-flex items-center gap-1">
                <Users className="w-3 h-3 text-text-muted" />
                รองรับ {activeRoom.capacity} ท่าน
              </span>
              {activeRoom.location && (
                <span className="text-text-muted">• {activeRoom.location}</span>
              )}
            </div>
          )}
        </div>

        <button
          type="button"
          onClick={handleNextRoom}
          disabled={rooms.length <= 1}
          className="p-1.5 rounded-lg border border-border bg-surface text-text-secondary hover:text-text hover:bg-surface-sunken disabled:opacity-40 transition-colors"
          title="ห้องถัดไป"
        >
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>
    );
  }

  // Desktop Multi-Room Columns Header
  return (
    <div
      className={`sticky top-0 z-30 bg-surface-raised border-b border-border flex shadow-xs ${className}`}
    >
      {rooms.map((room) => (
        <div
          key={room.id}
          style={{ width: `${columnWidth}px`, minWidth: `${columnWidth}px` }}
          className="h-14 sm:h-16 px-3 py-2 border-r border-border flex flex-col justify-center select-none bg-surface-raised hover:bg-surface transition-colors"
        >
          <div className="flex items-center justify-between gap-1.5">
            <span
              className="text-xs sm:text-sm font-bold text-text truncate"
              title={room.name}
            >
              {room.name}
            </span>
            <span className="inline-flex items-center gap-1 text-[11px] font-medium text-text-secondary bg-surface px-1.5 py-0.5 rounded-md border border-border/70 shrink-0">
              <Users className="w-3 h-3 text-primary-600" />
              <span>{room.capacity}</span>
            </span>
          </div>

          <div className="flex items-center gap-1.5 mt-0.5 text-2xs text-text-muted truncate">
            {room.location ? (
              <span className="truncate">{room.location}</span>
            ) : (
              <span className="inline-flex items-center gap-1">
                <Building className="w-2.5 h-2.5" /> ห้องประชุม
              </span>
            )}
          </div>
        </div>
      ))}
    </div>
  );
};

export default SchedulerRoomHeader;
