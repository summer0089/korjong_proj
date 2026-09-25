"use client";

import React from "react";
import Link from "next/link";
import Image from "next/image";
import { NavbarLogoProps } from "./types";

/**
 * NavbarLogo Component
 * ส่วนแสดง Logo แบรนด์, ชื่อระบบ และ Badge กำกับ ด้านซ้ายของ NavBar
 */
export function NavbarLogo({
  logoSrc = "/logo_korjong_64.png",
  logoHref = "/",
  logoAlt = "Korjong Logo",
  title = "Korjong : ขอจอง",
  badge,
  className = "",
}: NavbarLogoProps) {
  return (
    <div className={`flex items-center gap-3 shrink-0 ${className}`}>
      <Link
        href={logoHref}
        className="flex items-center gap-2.5 group transition-transform active:scale-98"
      >
        {/* ไอคอน Logo */}
        <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0">
          <Image
            src={logoSrc}
            alt={logoAlt}
            width={32}
            height={32}
            className="object-contain"
            priority
          />
        </div>

        {/* ชื่อระบบ */}
        <div className="flex flex-col">
          <span className="font-bold text-base text-text tracking-tight group-hover:text-primary-600 transition-colors leading-tight">
            {title}
          </span>
        </div>
      </Link>

      {/* Badge แสดงคำอธิบายสั้น */}
      {badge && (
        <div className="hidden sm:flex items-center gap-2">
          <span className="text-secondary-300 font-light">|</span>
          <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-primary-50 text-primary-600 border border-primary-100">
            {badge}
          </span>
        </div>
      )}
    </div>
  );
}

// Alias สำหรับการเรียกชื่อแบบเดิม
export const NavBarLogo = NavbarLogo;
export default NavbarLogo;
