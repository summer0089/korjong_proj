"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import { usePathname, useRouter } from "next/navigation";
import { Menu, X } from "lucide-react";
import { NavbarLogo } from "./NavbarLogo";
import { NavbarCenter } from "./NavbarCenter";
import { NavbarUserPanel } from "./NavbarUserPanel";
import {
  NavBarProps,
  UserProfile,
  NavMenuItem,
  SubMenuItem,
  UserMenuItem,
  NavbarLogoProps,
  NavbarCenterProps,
  NavbarUserPanelProps,
  ProtectedPath,
} from "./types";

// Re-export types สำหรับผู้ใช้งานภายนอก
export type {
  NavBarProps,
  UserProfile,
  NavMenuItem,
  SubMenuItem,
  UserMenuItem,
  NavbarLogoProps,
  NavbarCenterProps,
  NavbarUserPanelProps,
  ProtectedPath,
};

// Re-export sub-components
export { NavbarLogo, NavbarCenter, NavbarUserPanel };

// Default Menu Configuration
const DEFAULT_MENUS: NavMenuItem[] = [];

/**
 * แปลงข้อมูลพนักงานจาก Session เป็น UserProfile สำหรับ Navbar
 */
function mapSessionToUserProfile(emp: any): UserProfile {
  const firstName = emp.firstname || "";
  const lastName = emp.lastname || "";
  const name = `${firstName} ${lastName}`.trim() || emp.email;

  return {
    id: emp.id,
    name,
    firstName: emp.firstname,
    lastName: emp.lastname,
    email: emp.email,
    role: emp.role,
    position: emp.position,
    department: emp.department,
    phoneNumber: emp.phoneNumber,
    profile_image: emp.profileImage || null,
  };
}

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
  userMenus,
  protectedPaths = [],
  user,
  isLoggedIn,
  onLogout,
  hiddenPaths = ["/u/signin", "/u/signup", "/u/forgot-password", "/u/forgot_password"],
  hidden = false,
  className = "",
}: NavBarProps) {
  const pathname = usePathname();
  const router = useRouter();

  // สถานะเปิด/ปิด Mobile Drawer
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  // สถานะผู้ใช้งานปัจจุบัน
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(
    user !== undefined ? (isLoggedIn ? user : null) : null
  );

  // ฟังก์ชันดึงสถานะ Session จาก Cookie ผ่าน API
  const refreshSession = useCallback(async () => {
    try {
      const res = await fetch("/api/auth/session", {
        cache: "no-store",
      });
      if (res.ok) {
        const data = await res.json();
        if (data.isLoggedIn && data.user) {
          setCurrentUser(mapSessionToUserProfile(data.user));
          return;
        }
      }
      setCurrentUser(null);
    } catch (err) {
      console.error("Failed to check session:", err);
      setCurrentUser(null);
    }
  }, []);

  // ตรวจสอบ Session จาก Cookie และ Props
  useEffect(() => {
    // หากมีการส่ง user มาทาง props แบบระบุชัดเจน ให้ใช้ค่านั้น
    if (user !== undefined && isLoggedIn !== undefined) {
      setCurrentUser(isLoggedIn ? user : null);
      return;
    }

    // ตรวจสอบ Session จาก Cookie
    refreshSession();

    // ฟัง event เมื่อมีการ login หรือ logout จากหน้าอื่น
    const handleAuthChange = () => {
      refreshSession();
    };

    window.addEventListener("korjong-auth-change", handleAuthChange);
    return () => {
      window.removeEventListener("korjong-auth-change", handleAuthChange);
    };
  }, [pathname, user, isLoggedIn, refreshSession]);

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
  const handleLogout = async () => {
    try {
      await fetch("/api/auth/signout", {
        method: "POST",
      });
    } catch (err) {
      console.error("Signout error:", err);
    } finally {
      setCurrentUser(null);
      if (typeof window !== "undefined") {
        window.dispatchEvent(new Event("korjong-auth-change"));
      }
      if (onLogout) {
        onLogout();
      } else {
        router.push("/u/signin");
        router.refresh();
      }
    }
  };

  return (
    <header
      className={`bg-surface/95 backdrop-blur-md border-b border-border sticky top-0 z-40 z-sticky shadow-xs select-none ${className}`}
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
        <NavbarCenter menus={menus} protectedPaths={protectedPaths} userRole={currentUser?.role} />

        {/* ========================================================================= */}
        {/* 3. ส่วนขวา: NavbarUserPanel (User Authenticated / Sign In Button) */}
        {/* ========================================================================= */}
        <div className="flex items-center gap-3 shrink-0 ml-auto">
          <NavbarUserPanel
            user={currentUser}
            menus={userMenus}
            protectedPaths={protectedPaths}
            userRole={currentUser?.role}
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
            menus={userMenus}
            protectedPaths={protectedPaths}
            userRole={currentUser?.role}
            isLoggedIn={Boolean(currentUser)}
            onLogout={handleLogout}
            isMobile
            onItemClick={() => setIsMobileOpen(false)}
          />

          {/* ชุดเมนูหลักบน Mobile */}
          <NavbarCenter
            menus={menus}
            protectedPaths={protectedPaths}
            userRole={currentUser?.role}
            isMobile
            onItemClick={() => setIsMobileOpen(false)}
          />
        </div>
      )}
    </header>
  );
}

export default NavBar;
