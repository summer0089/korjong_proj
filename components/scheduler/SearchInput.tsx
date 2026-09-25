"use client";

import React from "react";
import { Search, X } from "lucide-react";

export interface SearchInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
}

export const SearchInput: React.FC<SearchInputProps> = ({
  value,
  onChange,
  placeholder = "ค้นหาหัวข้อ, ผู้จอง...",
  className = "",
}) => {
  return (
    <div className={`relative min-w-45 sm:min-w-55 ${className}`}>
      <div className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-text-muted">
        <Search className="w-4 h-4" />
      </div>

      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full bg-surface border border-border rounded-lg py-1.5 pl-9 pr-8 text-xs sm:text-sm text-text transition-colors hover:border-border-strong focus:outline-none focus:ring-1 focus:ring-primary-500 shadow-xs"
      />

      {value && (
        <button
          type="button"
          onClick={() => onChange("")}
          className="absolute right-2.5 top-1/2 -translate-y-1/2 text-text-muted hover:text-text p-0.5 rounded transition-colors"
          title="ล้างข้อความค้นหา"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      )}
    </div>
  );
};

export default SearchInput;
