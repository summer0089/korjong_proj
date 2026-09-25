"use client";

import React from "react";
import { TimeSlot } from "./types";

export interface SchedulerTimeCellProps {
  roomId: string;
  slot: TimeSlot;
  slotHeight: number;
  isFullHour: boolean;
  isSelected?: boolean;
  readOnly?: boolean;
  onMouseDown?: (roomId: string, slot: TimeSlot) => void;
  onMouseEnter?: (roomId: string, slot: TimeSlot) => void;
  onClick?: (roomId: string, slot: TimeSlot) => void;
  className?: string;
}

export const SchedulerTimeCell: React.FC<SchedulerTimeCellProps> = ({
  roomId,
  slot,
  slotHeight,
  isFullHour,
  isSelected = false,
  readOnly = false,
  onMouseDown,
  onMouseEnter,
  onClick,
  className = "",
}) => {
  return (
    <div
      style={{ height: `${slotHeight}px` }}
      onMouseDown={(e) => {
        if (!readOnly && e.button === 0 && onMouseDown) {
          e.preventDefault();
          onMouseDown(roomId, slot);
        }
      }}
      onMouseEnter={() => {
        if (!readOnly && onMouseEnter) {
          onMouseEnter(roomId, slot);
        }
      }}
      onClick={() => {
        if (!readOnly && onClick) {
          onClick(roomId, slot);
        }
      }}
      className={`relative border-b transition-colors select-none ${isFullHour ? "border-b-border/80" : "border-b-border/30 border-dashed"
        } ${isSelected
          ? "bg-primary-100/70 border-primary-400"
          : readOnly
            ? "hover:bg-transparent"
            : "hover:bg-primary-50/40 cursor-pointer"
        } ${className}`}
    >
      {/* Subtle hover plus icon hint when not readOnly and not selected */}
      {!readOnly && !isSelected && (
        <span className="opacity-0 hover:opacity-100 absolute inset-0 flex items-center justify-center text-2xs text-primary-400 font-bold select-none pointer-events-none transition-opacity">
          +
        </span>
      )}
    </div>
  );
};

export default SchedulerTimeCell;
