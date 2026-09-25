import React from "react";

/** กำหนด path ที่ต้องตรวจสอบสิทธิ์ก่อนแสดงเมนู */
export interface ProtectedPath {
  path: string;
  roles: string[];
}

/** ข้อมูลโปรไฟล์ผู้ใช้งาน */
export interface UserProfile {
  id?: string;
  name: string;
  firstName?: string;
  lastName?: string;
  email?: string;
  role?: string;
  position?: string;
  department?: string;
  phoneNumber?: string;
  profile_image?: string | null;
}

/** ข้อมูลเมนูย่อย (Submenu Level 1 & 2) */
export interface SubMenuItem {
  title: string;
  href?: string;
  icon?: React.ReactNode;
  badge?: string;
  description?: string;
  roles?: string[]; // กำหนด role ที่สามารถมองเห็นเมนูนี้ได้ (ถ้าไม่กำหนด = ทุกคนมองเห็นได้)
  submenu?: SubMenuItem[]; // Submenu level 2 (Accordion)
}

/** ข้อมูลเมนูหลัก (Top-level Menu) */
export interface NavMenuItem {
  menu_title: string;
  href?: string;
  icon?: React.ReactNode;
  badge?: string;
  roles?: string[];
  submenu?: SubMenuItem[];
}

/** ข้อมูลรายการเมนูสำหรับผู้ใช้งาน (User Panel Menu Item) */
export interface UserMenuItem {
  title: string;
  href?: string;
  icon?: React.ReactNode;
  badge?: string;
  description?: string;
  roles?: string[];
  onClick?: () => void;
}

/** Props สำหรับ NavbarLogo */
export interface NavbarLogoProps {
  logoSrc?: string;
  logoHref?: string;
  logoAlt?: string;
  title?: string;
  badge?: string;
  className?: string;
}

export type NavBarLogoProps = NavbarLogoProps;

/** Props สำหรับ NavbarCenter */
export interface NavbarCenterProps {
  menus?: NavMenuItem[];
  protectedPaths?: ProtectedPath[];
  userRole?: string;
  isMobile?: boolean;
  className?: string;
  onItemClick?: () => void;
}

/** Props สำหรับ NavbarUserPanel */
export interface NavbarUserPanelProps {
  user?: UserProfile | null;
  menus?: UserMenuItem[];
  userMenus?: UserMenuItem[];
  protectedPaths?: ProtectedPath[];
  userRole?: string;
  isLoggedIn?: boolean;
  onLogout?: () => void;
  isMobile?: boolean;
  className?: string;
  onItemClick?: () => void;
}

/** Props สำหรับ NavBar Container หลัก */
export interface NavBarProps {
  logoSrc?: string;
  logoHref?: string;
  logoAlt?: string;
  title?: string;
  badge?: string;
  menus?: NavMenuItem[];
  userMenus?: UserMenuItem[];
  protectedPaths?: ProtectedPath[];
  user?: UserProfile | null;
  isLoggedIn?: boolean;
  onLogout?: () => void;
  hiddenPaths?: string[];
  hidden?: boolean;
  className?: string;
}
