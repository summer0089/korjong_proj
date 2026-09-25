"use client";

import React from "react";
import { DoorClosed, ChevronDown } from "lucide-react";
import { MeetingRoom } from "./types";

export interface RoomFilterProps {
  rooms: MeetingRoom[];
  selectedRoomId: string;
  onChange: (roomId: string) => void;
  className?: string;
}

export const RoomFilter: React.FC<RoomFilterProps> = ({
  rooms,
  selectedRoomId,
  onChange,
  className = "",
}) => {
  return (
    <div className={`relative min-w-35 sm:min-w-42.5 ${className}`}>
      <div className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-text-muted">
        <DoorClosed className="w-4 h-4" />
      </div>

      <select
        value={selectedRoomId}
        onChange={(e) => onChange(e.target.value)}
        className="w-full bg-surface border border-border rounded-lg py-1.5 pl-9 pr-8 text-xs sm:text-sm text-text appearance-none hover:border-border-strong focus:outline-none focus:ring-1 focus:ring-primary-500 shadow-xs cursor-pointer"
      >
        <option value="ALL">ห้องประชุมทั้งหมด ({rooms.length})</option>
        {rooms.map((room) => (
          <option key={room.id} value={room.id}>
            {room.name} ({room.capacity} ที่นั่ง)
          </option>
        ))}
      </select>

      <div className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-text-muted">
        <ChevronDown className="w-3.5 h-3.5" />
      </div>
    </div>
  );
};

export default RoomFilter;
