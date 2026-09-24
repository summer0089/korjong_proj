"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronDown } from "lucide-react";
import { NavMenuItem, NavbarCenterProps } from "./types";

/**
 * NavbarCenter Component
 * ชุดเมนูหลักของระบบ รองรับทั้งการแสดงผลแบบ Desktop (Dropdown & Accordion)
 * และแบบ Mobile Drawer พร้อมปรับปรุงสีตาม Design Theme Tokens
 */
export function NavbarCenter({
  menus = [],
  isMobile = false,
  className = "",
  onItemClick,
}: NavbarCenterProps) {
  const pathname = usePathname();

  // Desktop active dropdown menu index
  const [activeMenuIndex, setActiveMenuIndex] = useState<number | null>(null);

  // Accordion state สำหรับเมนูย่อยซ้อน (Submenu Level 2) หรือ Mobile items
  const [openAccordions, setOpenAccordions] = useState<Record<string, boolean>>({});

  // Container ref สำหรับตรวจจับ click-outside บน Desktop
  const navContainerRef = useRef<HTMLDivElement>(null);

  // ปิด dropdown เมื่อมีการเปลี่ยนเส้นทาง (URL / Pathname)
  useEffect(() => {
    setActiveMenuIndex(null);
  }, [pathname]);

  // Handle click outside บน Desktop dropdown
  useEffect(() => {
    if (isMobile) return;

    function handleClickOutside(event: MouseEvent) {
      if (
        navContainerRef.current &&
        !navContainerRef.current.contains(event.target as Node)
      ) {
        setActiveMenuIndex(null);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isMobile]);

  // สลับการเปิด/ปิด Accordion
  const toggleAccordion = (key: string) => {
    setOpenAccordions((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  // =========================================================================
  // MOBILE NAVIGATION VIEW
  // =========================================================================
  if (isMobile) {
    return (
      <div className={`space-y-1 ${className}`}>
        {menus.map((item, mIdx) => {
          const hasSub = Boolean(item.submenu && item.submenu.length > 0);
          const topAccordionKey = `mobile-top-${mIdx}`;
          const isTopOpen = Boolean(openAccordions[topAccordionKey]);

          // รายการเมนูเดี่ยว (ไม่มีเมนูย่อย)
          if (!hasSub) {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.menu_title}
                href={item.href || "#"}
                onClick={onItemClick}
                className={`flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors ${
                  isActive
                    ? "bg-primary-50 text-primary-600 font-semibold"
                    : "text-text hover:bg-secondary-50"
                }`}
              >
                {item.icon && <span>{item.icon}</span>}
                <span>{item.menu_title}</span>
                {item.badge && (
                  <span className="text-2xs px-2 py-0.5 rounded-full bg-primary-100 text-primary-700 ml-auto font-medium">
                    {item.badge}
                  </span>
                )}
              </Link>
            );
          }

          // เมนูที่มี Submenu (แสดงผลเป็น Accordion ใน Mobile)
          return (
            <div
              key={item.menu_title}
              className="rounded-xl border border-secondary-200 overflow-hidden"
            >
              <button
                type="button"
                onClick={() => toggleAccordion(topAccordionKey)}
                className="w-full flex items-center justify-between px-3.5 py-2.5 text-sm font-semibold text-text bg-secondary-50/60 hover:bg-secondary-100/80 transition-colors cursor-pointer"
              >
                <div className="flex items-center gap-2">
                  {item.icon && <span>{item.icon}</span>}
                  <span>{item.menu_title}</span>
                </div>
                <ChevronDown
                  className={`w-4 h-4 text-text-muted transition-transform duration-200 ${
                    isTopOpen ? "rotate-180 text-primary-600" : ""
                  }`}
                />
              </button>

              {isTopOpen && (
                <div className="p-2 space-y-1 bg-surface border-t border-secondary-100">
                  {item.submenu?.map((sub, sIdx) => {
                    const hasNested = Boolean(
                      sub.submenu && sub.submenu.length > 0
                    );
                    const subKey = `mobile-sub-${mIdx}-${sIdx}`;
                    const isSubOpen = Boolean(openAccordions[subKey]);

                    // Submenu ที่มี Submenu Level 2 ซ้อนอยู่
                    if (hasNested) {
                      return (
                        <div
                          key={sub.title}
                          className="rounded-lg bg-secondary-50/50 overflow-hidden"
                        >
                          <button
                            type="button"
                            onClick={() => toggleAccordion(subKey)}
                            className="w-full flex items-center justify-between px-3 py-2 text-xs font-semibold text-text hover:bg-secondary-100 transition-colors cursor-pointer"
                          >
                            <div className="flex items-center gap-2">
                              {sub.icon && <span>{sub.icon}</span>}
                              <span>{sub.title}</span>
                            </div>
                            <ChevronDown
                              className={`w-3.5 h-3.5 text-text-muted transition-transform duration-200 ${
                                isSubOpen ? "rotate-180 text-primary-600" : ""
                              }`}
                            />
                          </button>

                          {isSubOpen && (
                            <div className="pl-6 pr-2 py-1 space-y-1 border-l-2 border-primary-200 ml-4 mb-1">
                              {sub.submenu?.map((nested) => {
                                const isNestedActive = pathname === nested.href;
                                return (
                                  <Link
                                    key={nested.title}
                                    href={nested.href || "#"}
                                    onClick={onItemClick}
                                    className={`flex items-center gap-2 px-2 py-1.5 text-xs rounded-md transition-colors ${
                                      isNestedActive
                                        ? "font-semibold text-primary-600 bg-primary-50"
                                        : "text-text-secondary hover:text-text hover:bg-surface"
                                    }`}
                                  >
                                    {nested.icon && <span>{nested.icon}</span>}
                                    <span>{nested.title}</span>
                                  </Link>
                                );
                              })}
                            </div>
                          )}
                        </div>
                      );
                    }

                    // Regular Mobile Submenu item
                    const isSubActive = pathname === sub.href;
                    return (
                      <Link
                        key={sub.title}
                        href={sub.href || "#"}
                        onClick={onItemClick}
                        className={`flex items-center gap-2.5 px-3 py-2 text-xs rounded-lg transition-colors ${
                          isSubActive
                            ? "bg-primary-50 text-primary-600 font-semibold"
                            : "text-text hover:bg-secondary-50"
                        }`}
                      >
                        {sub.icon && <span>{sub.icon}</span>}
                        <span>{sub.title}</span>
                      </Link>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>
    );
  }

  // =========================================================================
  // DESKTOP NAVIGATION VIEW
  // =========================================================================
  return (
    <nav
      ref={navContainerRef}
      className={`hidden md:flex items-center gap-1.5 flex-1 justify-start ml-6 ${className}`}
    >
      {menus.map((item, menuIdx) => {
        const hasSubmenu = Boolean(item.submenu && item.submenu.length > 0);
        const isOpen = activeMenuIndex === menuIdx;

        // เมนูเดี่ยว ไม่มี dropdown
        if (!hasSubmenu) {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.menu_title}
              href={item.href || "#"}
              className={`flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-sm font-medium transition-colors ${
                isActive
                  ? "text-primary-600 bg-primary-50 font-semibold"
                  : "text-text-secondary hover:text-text hover:bg-secondary-100"
              }`}
            >
              {item.icon && <span>{item.icon}</span>}
              <span>{item.menu_title}</span>
              {item.badge && (
                <span className="text-2xs px-1.5 py-0.5 rounded-full bg-booked-100 text-booked-800 border border-booked-200">
                  {item.badge}
                </span>
              )}
            </Link>
          );
        }

        // เมนูหลักที่มี Dropdown
        return (
          <div key={item.menu_title} className="relative">
            <button
              type="button"
              onClick={() => setActiveMenuIndex(isOpen ? null : menuIdx)}
              className={`flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-sm font-medium transition-colors cursor-pointer ${
                isOpen
                  ? "text-primary-600 bg-primary-50"
                  : "text-text-secondary hover:text-text hover:bg-secondary-100"
              }`}
              aria-expanded={isOpen}
            >
              {item.icon && <span>{item.icon}</span>}
              <span>{item.menu_title}</span>
              <ChevronDown
                className={`w-3.5 h-3.5 transition-transform duration-200 ${
                  isOpen ? "rotate-180 text-primary-600" : "text-text-muted"
                }`}
              />
            </button>

            {/* Dropdown Menu Panel */}
            {isOpen && (
              <div className="absolute left-0 mt-1.5 w-72 bg-surface rounded-2xl shadow-xl border border-secondary-200 py-2.5 z-50 animate-in fade-in slide-in-from-top-2 duration-150">
                <div className="px-3 pb-2 mb-1 border-b border-secondary-100 text-xs font-semibold text-text-muted uppercase tracking-wider">
                  {item.menu_title}
                </div>

                <div className="space-y-1 px-1.5">
                  {item.submenu?.map((sub, subIdx) => {
                    const hasNestedSub = Boolean(
                      sub.submenu && sub.submenu.length > 0
                    );
                    const accordionKey = `${menuIdx}-${subIdx}`;
                    const isAccordionOpen = Boolean(openAccordions[accordionKey]);

                    // ถ้ามี Submenu ย่อยลงไปอีก -> เรนเดอร์เป็น Accordion
                    if (hasNestedSub) {
                      return (
                        <div key={sub.title} className="rounded-xl overflow-hidden">
                          <button
                            type="button"
                            onClick={() => toggleAccordion(accordionKey)}
                            className={`w-full flex items-center justify-between px-3 py-2 text-xs font-semibold rounded-lg transition-colors cursor-pointer ${
                              isAccordionOpen
                                ? "bg-primary-50 text-primary-600"
                                : "text-text hover:bg-secondary-50"
                            }`}
                          >
                            <div className="flex items-center gap-2">
                              {sub.icon && <span>{sub.icon}</span>}
                              <span>{sub.title}</span>
                            </div>
                            <ChevronDown
                              className={`w-3.5 h-3.5 transition-transform duration-200 ${
                                isAccordionOpen
                                  ? "rotate-180 text-primary-600"
                                  : "text-text-muted"
                              }`}
                            />
                          </button>

                          {/* เนื้อหา Submenu Level 2 ภายใน Accordion */}
                          {isAccordionOpen && (
                            <div className="pl-6 pr-2 py-1 space-y-0.5 border-l-2 border-primary-200 ml-4 mt-1 mb-1">
                              {sub.submenu?.map((nested) => {
                                const isNestedActive = pathname === nested.href;
                                return (
                                  <Link
                                    key={nested.title}
                                    href={nested.href || "#"}
                                    onClick={() => setActiveMenuIndex(null)}
                                    className={`flex items-center gap-2 px-2.5 py-1.5 rounded-md text-xs transition-colors ${
                                      isNestedActive
                                        ? "font-semibold text-primary-600 bg-primary-50"
                                        : "text-text-secondary hover:text-text hover:bg-secondary-100"
                                    }`}
                                  >
                                    {nested.icon && <span>{nested.icon}</span>}
                                    <span>{nested.title}</span>
                                  </Link>
                                );
                              })}
                            </div>
                          )}
                        </div>
                      );
                    }

                    // รายการเมนูย่อยปกติ (ไม่มี Submenu ซ้อน)
                    const isSubActive = pathname === sub.href;
                    return (
                      <Link
                        key={sub.title}
                        href={sub.href || "#"}
                        onClick={() => setActiveMenuIndex(null)}
                        className={`flex items-start gap-2.5 px-3 py-2 rounded-xl text-xs transition-colors ${
                          isSubActive
                            ? "bg-primary-50 text-primary-600 font-semibold"
                            : "text-text hover:bg-secondary-50 hover:text-primary-700"
                        }`}
                      >
                        {sub.icon && (
                          <div className="mt-0.5 shrink-0 text-primary-500">
                            {sub.icon}
                          </div>
                        )}
                        <div className="flex-1 min-w-0">
                          <div className="font-medium leading-tight">
                            {sub.title}
                          </div>
                          {sub.description && (
                            <div className="text-[11px] text-text-muted mt-0.5 truncate">
                              {sub.description}
                            </div>
                          )}
                        </div>
                      </Link>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        );
      })}
    </nav>
  );
}

export default NavbarCenter;
