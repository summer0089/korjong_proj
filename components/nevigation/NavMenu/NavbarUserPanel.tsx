"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { ChevronDown, User, CalendarDays, LogOut, LogIn } from "lucide-react";
import { Button } from "@/components/form_controls/Button";
import { NavbarUserPanelProps, UserMenuItem } from "./types";
import { getAvatarProps } from "@/utils/helper/avatar";

/** แปลงชื่อ Role ให้อ่านง่าย */
function formatRoleName(role?: string): string {
  if (!role) return "ผู้ใช้งานทั่วไป";
  if (role === "ADMIN") return "ผู้ดูแลระบบ (Admin)";
  if (role === "APPROVER") return "ผู้อนุมัติ (Approver)";
  if (role === "USER") return "ผู้ใช้งานทั่วไป";
  return role;
}

/** เมนูเริ่มต้นสำหรับผู้ใช้งาน */
export const DEFAULT_USER_MENUS: UserMenuItem[] = [
  {
    title: "แก้ไขข้อมูล",
    href: "/u/profile",
    icon: <User className="w-4 h-4 text-text-muted" />,
  },
  {
    title: "ดูรายการที่เคยจองห้องประชุม",
    href: "/u/bookings",
    icon: <CalendarDays className="w-4 h-4 text-text-muted" />,
  },
];

/**
 * NavbarUserPanel Component
 * ส่วนเมนูสำหรับผู้ใช้งานที่ผ่านการยืนยันตน (Authenticated User) หรือปุ่มเข้าสู่ระบบ
 * พร้อม Dropdown รายละเอียดผู้ใช้, เมนูแก้ไขข้อมูล, รายการจอง และปุ่มออกจากระบบ
 */
export function NavbarUserPanel({
  user,
  menus,
  userMenus,
  isLoggedIn = true,
  onLogout,
  isMobile = false,
  className = "",
  onItemClick,
}: NavbarUserPanelProps) {
  const effectiveMenus = menus ?? userMenus ?? DEFAULT_USER_MENUS;
  const pathname = usePathname();

  // สถานะเปิด/ปิด Dropdown Menu ของ User
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);

  // Ref สำหรับตรวจจับการคลิกภายนอก (Click Outside) เพื่อปิด Dropdown
  const userMenuRef = useRef<HTMLDivElement>(null);

  // ปิด Dropdown เมื่อมีการเปลี่ยนหน้า (Route change)
  useEffect(() => {
    return () => setIsUserMenuOpen(false);
  }, [pathname]);

  // Handle click outside บน Desktop dropdown
  useEffect(() => {
    if (isMobile) return;

    function handleClickOutside(event: MouseEvent) {
      if (
        userMenuRef.current &&
        !userMenuRef.current.contains(event.target as Node)
      ) {
        setIsUserMenuOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isMobile]);

  // ฟังก์ชั่นจัดการการออกจากระบบ
  const handleLogout = () => {
    setIsUserMenuOpen(false);
    if (onItemClick) onItemClick();
    if (onLogout) {
      onLogout();
    }
  };

  const isUserAuthenticated = isLoggedIn && user !== null && user !== undefined;
  const avatarProps = user
    ? getAvatarProps(user.firstName || user.name, user.email || user.id)
    : null;
  const displayRole = user?.role ? formatRoleName(user.role) : "";

  // =========================================================================
  // MOBILE VIEW
  // =========================================================================
  if (isMobile) {
    if (!isUserAuthenticated) {
      return (
        <div className={`pt-2 ${className}`}>
          <Link href="/u/signin" onClick={onItemClick} className="block">
            <Button
              variant="primary"
              size="md"
              fullWidth
              text="เข้าสู่ระบบ"
              icon={<LogIn className="w-4 h-4" />}
            />
          </Link>
        </div>
      );
    }

    return (
      <div className={className}>
        {/* สรุปข้อมูลผู้ใช้ในแถบมือถือ */}
        <div className="flex items-center gap-3 p-3 bg-secondary-50/70 rounded-xl border border-secondary-100 mb-2">
          <div
            className="w-10 h-10 rounded-full overflow-hidden shrink-0 flex items-center justify-center text-text-inverse font-semibold text-sm shadow-xs"
            style={
              user.profile_image
                ? undefined
                : {
                    backgroundColor: avatarProps?.backgroundColor,
                    color: avatarProps?.color,
                  }
            }
          >
            {user.profile_image ? (
              <Image
                src={user.profile_image}
                alt={user.name}
                width={40}
                height={40}
                className="w-full h-full object-cover"
              />
            ) : (
              <span>{avatarProps?.initial}</span>
            )}
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-xs font-semibold text-text truncate">
              {user.name}
            </div>
            <div className="text-2xs text-text-muted truncate">
              {displayRole || user.email || "ผู้ใช้งาน"}
            </div>
          </div>
        </div>

        {/* ลิงก์เมนูสำหรับผู้ใช้ในแถบมือถือ */}
        <div className="pt-2 border-t border-secondary-200 space-y-1">
          {effectiveMenus.map((item, idx) => {
            if (item.roles && item.roles.length > 0 && user?.role) {
              if (!item.roles.includes(user.role)) return null;
            }

            const handleClick = () => {
              if (item.onClick) item.onClick();
              if (onItemClick) onItemClick();
            };

            if (item.href) {
              return (
                <Link
                  key={item.title || idx}
                  href={item.href}
                  onClick={handleClick}
                  className="flex items-center gap-2.5 px-3 py-2 text-xs font-medium text-text-secondary rounded-lg hover:bg-secondary-50 hover:text-text transition-colors"
                >
                  {item.icon && <span>{item.icon}</span>}
                  <span>{item.title}</span>
                  {item.badge && (
                    <span className="text-2xs px-2 py-0.5 rounded-full bg-primary-100 text-primary-700 ml-auto font-medium">
                      {item.badge}
                    </span>
                  )}
                </Link>
              );
            }

            return (
              <button
                key={item.title || idx}
                type="button"
                onClick={handleClick}
                className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-medium text-text-secondary rounded-lg hover:bg-secondary-50 hover:text-text text-left transition-colors cursor-pointer"
              >
                {item.icon && <span>{item.icon}</span>}
                <span>{item.title}</span>
                {item.badge && (
                  <span className="text-2xs px-2 py-0.5 rounded-full bg-primary-100 text-primary-700 ml-auto font-medium">
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
          <button
            type="button"
            onClick={handleLogout}
            className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-medium text-unavailable-600 rounded-lg hover:bg-unavailable-50 text-left transition-colors cursor-pointer"
          >
            <LogOut className="w-4 h-4" />
            <span>ออกจากระบบ</span>
          </button>
        </div>
      </div>
    );
  }

  // =========================================================================
  // DESKTOP VIEW
  // =========================================================================
  if (!isUserAuthenticated) {
    return (
      <div className={`flex items-center ${className}`}>
        <Link href="/u/signin">
          <Button
            variant="primary"
            size="sm"
            text="เข้าสู่ระบบ"
            icon={<LogIn className="w-4 h-4" />}
          />
        </Link>
      </div>
    );
  }

  return (
    <div className={`relative ${className}`} ref={userMenuRef}>
      {/* ปุ่มกดเปิด Dropdown โปรไฟล์ */}
      <button
        type="button"
        onClick={() => setIsUserMenuOpen((prev) => !prev)}
        className="flex items-center gap-2 p-1 rounded-full hover:bg-secondary-100 transition-colors cursor-pointer group focus:outline-none focus:ring-2 focus:ring-primary-500/20"
        aria-label="User profile menu"
        aria-expanded={isUserMenuOpen}
      >
        <div
          className="relative w-9 h-9 rounded-full overflow-hidden ring-2 ring-secondary-200 group-hover:ring-primary-500 transition-all flex items-center justify-center text-text-inverse font-semibold text-xs shadow-xs"
          style={
            user.profile_image
              ? undefined
              : {
                  backgroundColor: avatarProps?.backgroundColor,
                  color: avatarProps?.color,
                }
          }
        >
          {user.profile_image ? (
            <Image
              src={user.profile_image}
              alt={user.name}
              width={36}
              height={36}
              className="w-full h-full object-cover"
            />
          ) : (
            <span>{avatarProps?.initial}</span>
          )}
        </div>

        <div className="hidden lg:flex flex-col text-left leading-tight pr-1">
          <span className="text-xs font-semibold text-text truncate max-w-32.5">
            {user.name}
          </span>
          <span className="text-2xs text-text-muted truncate max-w-32.5">
            {displayRole || user.email || "ผู้ใช้งาน"}
          </span>
        </div>

        <ChevronDown
          className={`hidden lg:block w-3.5 h-3.5 text-text-muted transition-transform duration-200 ${
            isUserMenuOpen ? "rotate-180 text-primary-600" : ""
          }`}
        />
      </button>

      {/* User Dropdown Menu Card */}
      {isUserMenuOpen && (
        <div className="absolute right-0 mt-2 w-72 bg-surface rounded-2xl shadow-xl border border-secondary-200 py-2 z-50 animate-in fade-in slide-in-from-top-2 duration-150">
          {/* Header ข้อมูลผู้ใช้ */}
          <div className="px-4 py-3 border-b border-secondary-100 flex items-center gap-3">
            <div
              className="w-11 h-11 rounded-full overflow-hidden shrink-0 flex items-center justify-center text-text-inverse font-bold text-sm ring-2 ring-primary-100 shadow-xs"
              style={
                user.profile_image
                  ? undefined
                  : {
                      backgroundColor: avatarProps?.backgroundColor,
                      color: avatarProps?.color,
                    }
              }
            >
              {user.profile_image ? (
                <Image
                  src={user.profile_image}
                  alt={user.name}
                  width={44}
                  height={44}
                  className="w-full h-full object-cover"
                />
              ) : (
                <span>{avatarProps?.initial}</span>
              )}
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-sm font-semibold text-text truncate">
                {user.name}
              </div>
              {user.email && (
                <div className="text-xs text-text-secondary truncate">
                  {user.email}
                </div>
              )}
              {displayRole && (
                <div className="inline-block text-2xs font-medium text-primary-600 bg-primary-50 px-2 py-0.5 rounded-full mt-0.5 border border-primary-100">
                  {displayRole}
                </div>
              )}
            </div>
          </div>

          {/* รายการเมนูผู้ใช้งาน */}
          <div className="px-2 py-1.5 space-y-0.5">
            {effectiveMenus.map((item, idx) => {
              if (item.roles && item.roles.length > 0 && user?.role) {
                if (!item.roles.includes(user.role)) return null;
              }

              const handleClick = () => {
                setIsUserMenuOpen(false);
                if (item.onClick) item.onClick();
                if (onItemClick) onItemClick();
              };

              if (item.href) {
                return (
                  <Link
                    key={item.title || idx}
                    href={item.href}
                    onClick={handleClick}
                    className="flex items-center gap-3 px-3 py-2 text-xs font-medium text-text-secondary rounded-xl hover:bg-secondary-50 hover:text-text transition-colors"
                  >
                    {item.icon && <span className="text-text-muted">{item.icon}</span>}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-1">
                        <span>{item.title}</span>
                        {item.badge && (
                          <span className="text-2xs px-2 py-0.5 rounded-full bg-primary-100 text-primary-700 font-medium">
                            {item.badge}
                          </span>
                        )}
                      </div>
                      {item.description && (
                        <div className="text-[11px] text-text-muted mt-0.5 truncate">
                          {item.description}
                        </div>
                      )}
                    </div>
                  </Link>
                );
              }

              return (
                <button
                  key={item.title || idx}
                  type="button"
                  onClick={handleClick}
                  className="w-full flex items-center gap-3 px-3 py-2 text-xs font-medium text-text-secondary rounded-xl hover:bg-secondary-50 hover:text-text text-left transition-colors cursor-pointer"
                >
                  {item.icon && <span className="text-text-muted">{item.icon}</span>}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-1">
                      <span>{item.title}</span>
                      {item.badge && (
                        <span className="text-2xs px-2 py-0.5 rounded-full bg-primary-100 text-primary-700 font-medium">
                          {item.badge}
                        </span>
                      )}
                    </div>
                    {item.description && (
                      <div className="text-[11px] text-text-muted mt-0.5 truncate">
                        {item.description}
                      </div>
                    )}
                  </div>
                </button>
              );
            })}
          </div>

          {/* Divider */}
          <div className="border-t border-secondary-100 my-1" />

          {/* ปุ่มออกจากระบบ */}
          <div className="px-2 pt-0.5">
            <button
              type="button"
              onClick={handleLogout}
              className="w-full flex items-center gap-3 px-3 py-2 text-xs font-medium text-unavailable-600 rounded-xl hover:bg-unavailable-50 hover:text-unavailable-700 transition-colors cursor-pointer"
            >
              <LogOut className="w-4 h-4" />
              <span>ออกจากระบบ</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default NavbarUserPanel;
