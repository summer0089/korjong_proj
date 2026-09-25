import React from "react";
import Link from "next/link";
import { ChevronRight } from "lucide-react";

export interface BreadcrumbItem {
  label: string; // ชื่อหน้า
  href?: string; // ลิงก์ปลายทาง (ถ้าไม่มีหรือเป็นรายการสุดท้าย จะแสดงผลเป็นข้อความ)
  icon?: React.ReactNode; // ไอคอนประกอบ (เช่น Home)
}

export interface BreadcrumbProps {
  items: BreadcrumbItem[];
  separator?: React.ReactNode; // สัญลักษณ์คั่นระหว่างรายการ (ค่าเริ่มต้น: ChevronRight)
  className?: string;
}

export function Breadcrumb({
  items = [],
  separator,
  className = "",
}: BreadcrumbProps) {
  if (!items || items.length === 0) {
    return null;
  }

  const defaultSeparator = (
    <ChevronRight className="w-3 h-3 text-text-muted shrink-0" aria-hidden="true" />
  );

  return (
    <nav
      aria-label="Breadcrumb"
      className={`flex items-center text-xs text-text-muted select-none ${className}`}
    >
      <ol className="flex items-center gap-1.5 flex-wrap list-none p-0 m-0">
        {items.map((item, index) => {
          const isLast = index === items.length - 1;

          return (
            <li key={`${item.label}-${index}`} className="flex items-center gap-1.5">
              {item.href && !isLast ? (
                <Link
                  href={item.href}
                  className="hover:text-text transition-colors flex items-center gap-1"
                >
                  {item.icon && <span className="shrink-0">{item.icon}</span>}
                  <span>{item.label}</span>
                </Link>
              ) : isLast ? (
                <span
                  className="font-medium text-text flex items-center gap-1"
                  aria-current="page"
                >
                  {item.icon && <span className="shrink-0">{item.icon}</span>}
                  <span>{item.label}</span>
                </span>
              ) : (
                <span className="text-text-muted flex items-center gap-1">
                  {item.icon && <span className="shrink-0">{item.icon}</span>}
                  <span>{item.label}</span>
                </span>
              )}

              {!isLast && (
                <span className="flex items-center" aria-hidden="true">
                  {separator || defaultSeparator}
                </span>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}

export default Breadcrumb;
