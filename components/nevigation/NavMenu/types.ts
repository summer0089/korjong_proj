import React from "react";

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
  isMobile?: boolean;
  className?: string;
  onItemClick?: () => void;
}

/** Props สำหรับ NavbarUserPanel */
export interface NavbarUserPanelProps {
  user?: UserProfile | null;
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
  user?: UserProfile | null;
  isLoggedIn?: boolean;
  onLogout?: () => void;
  hiddenPaths?: string[];
  hidden?: boolean;
  className?: string;
}
