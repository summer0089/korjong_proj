"use client";

import { useState, useEffect, useMemo } from "react";
import { usePathname } from "next/navigation";
import { Menu, X } from "lucide-react";
import { NavbarLogo } from "./NavbarLogo";
import { NavbarCenter } from "./NavbarCenter";
import { NavbarUserPanel } from "./NavbarUserPanel";
import {
  NavBarProps,
  UserProfile,
  NavMenuItem,
  SubMenuItem,
  NavbarLogoProps,
  NavbarCenterProps,
  NavbarUserPanelProps,
} from "./types";

// Re-export types สำหรับผู้ใช้งานภายนอก
export type {
  NavBarProps,
  UserProfile,
  NavMenuItem,
  SubMenuItem,
  NavbarLogoProps,
  NavbarCenterProps,
  NavbarUserPanelProps,
};

// Re-export sub-components
export { NavbarLogo, NavbarCenter, NavbarUserPanel };

// Default Menu Configuration
const DEFAULT_MENUS: NavMenuItem[] = [];

// Default User Profile
const DEFAULT_USER: UserProfile = {
  name: "เจ้าหน้าที่ผู้ดูแลระบบ",
  email: "admin@korjong.local",
  role: "ผู้ดูแลระบบ (Admin)",
  profile_image: "/user_avatar/test_avatar.jpg",
};

/**
 * NavBar Component (Container หลัก)
 * ประกอบด้วย:
 * 1. NavbarLogo (ส่วนแรกของ navbar - โลโก้และชื่อระบบ)
 * 2. NavbarCenter (ชุดเมนูหลัก ทั้ง desktop และ mobile)
 * 3. NavbarUserPanel (เมนูสำหรับ user ที่ผ่านการยืนยันตน / ปุ่มเข้าสู่ระบบ)
 */
export function NavBar({
  logoSrc = "/logo_korjong_64.png",
  logoHref = "/",
  logoAlt = "Korjong Logo",
  title = "Korjong : ขอจอง",
  badge = "ระบบจองห้องประชุม",
  menus = DEFAULT_MENUS,
  user = DEFAULT_USER,
  isLoggedIn = true,
  onLogout,
  hiddenPaths = ["/u/signin", "/u/signup", "/u/forgot-password"],
  hidden = false,
  className = "",
}: NavBarProps) {
  const pathname = usePathname();

  // สถานะเปิด/ปิด Mobile Drawer
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  // สถานะผู้ใช้งานปัจจุบัน
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(
    isLoggedIn ? user : null
  );

  // อัปเดต currentUser เมื่อ props เปลี่ยน
  useEffect(() => {
    setCurrentUser(isLoggedIn ? user : null);
  }, [isLoggedIn, user]);

  // ปิด mobile drawer เมื่อเปลี่ยนหน้า
  useEffect(() => {
    setIsMobileOpen(false);
  }, [pathname]);

  // ตรวจสอบหน้าที่ต้องการซ่อน Navbar ตาม hiddenPaths
  const isHiddenPage = useMemo(() => {
    if (hidden) return true;
    if (!pathname) return false;
    return hiddenPaths.some((path) => {
      if (pathname === path) return true;
      if (path !== "/" && pathname.startsWith(`${path}/`)) return true;
      return false;
    });
  }, [hidden, pathname, hiddenPaths]);

  if (isHiddenPage) {
    return null;
  }

  // ฟังก์ชั่น Logout กลาง
  const handleLogout = () => {
    if (onLogout) {
      onLogout();
    } else {
      setCurrentUser(null);
    }
  };

  return (
    <header
      className={`bg-surface/95 backdrop-blur-md border-b border-border sticky top-0 z-sticky shadow-xs select-none ${className}`}
    >
      <div className="w-full px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
        {/* ========================================================================= */}
        {/* 1. ส่วนแรก: NavbarLogo (Logo, ชื่อระบบ และ Badge) */}
        {/* ========================================================================= */}
        <NavbarLogo
          logoSrc={logoSrc}
          logoHref={logoHref}
          logoAlt={logoAlt}
          title={title}
          badge={badge}
        />

        {/* ========================================================================= */}
        {/* 2. ส่วนกลาง: NavbarCenter (ชุดเมนูหลัก Desktop) */}
        {/* ========================================================================= */}
        <NavbarCenter menus={menus} />

        {/* ========================================================================= */}
        {/* 3. ส่วนขวา: NavbarUserPanel (User Authenticated / Sign In Button) */}
        {/* ========================================================================= */}
        <div className="flex items-center gap-3 shrink-0 ml-auto">
          <NavbarUserPanel
            user={currentUser}
            isLoggedIn={Boolean(currentUser)}
            onLogout={handleLogout}
          />

          {/* ปุ่มสลับเปิด/ปิดเมนู Mobile Drawer */}
          <button
            type="button"
            onClick={() => setIsMobileOpen((prev) => !prev)}
            className="md:hidden p-2 text-text-secondary hover:text-text hover:bg-secondary-100 rounded-lg transition-colors cursor-pointer"
            aria-label="Toggle navigation menu"
          >
            {isMobileOpen ? (
              <X className="w-5 h-5 text-text" />
            ) : (
              <Menu className="w-5 h-5 text-text" />
            )}
          </button>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 4. เมนูย่อยบนหน้าจอมือถือ (Mobile Drawer) */}
      {/* ========================================================================= */}
      {isMobileOpen && (
        <div className="md:hidden border-t border-border bg-surface px-4 py-4 space-y-4 max-h-[calc(100vh-4rem)] overflow-y-auto animate-in fade-in duration-150">
          {/* ข้อมูลและเมนูผู้ใช้งานบน Mobile */}
          <NavbarUserPanel
            user={currentUser}
            isLoggedIn={Boolean(currentUser)}
            onLogout={handleLogout}
            isMobile
            onItemClick={() => setIsMobileOpen(false)}
          />

          {/* ชุดเมนูหลักบน Mobile */}
          <NavbarCenter
            menus={menus}
            isMobile
            onItemClick={() => setIsMobileOpen(false)}
          />
        </div>
      )}
    </header>
  );
}

export default NavBar;
