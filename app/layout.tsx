import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import NavBar, { NavMenuItem, ProtectedPath, UserMenuItem } from "@/components/nevigation/NavMenu/Navbar";
import Footer from "@/components/nevigation/Footer";
import { BarChart3, Building2, Calendar, CalendarDays, Check, DoorClosed, Home, Key, Layers, PlusCircle, User, Users } from "lucide-react";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Korjong : ระบบจองห้องประชุมออนไลน์",
  description: "Korjong : ระบบจองห้องประชุมออนไลน์",
};

const DEFAULT_MENUS: NavMenuItem[] = [
  {
    menu_title: "หน้าหลัก",
    href: "/",
    icon: <Home className="w-4 h-4" />,
  },
  {
    menu_title: "การจองห้องประชุม",
    icon: <Calendar className="w-4 h-4" />,
    submenu: [
      {
        title: "จองห้องประชุมใหม่",
        href: "/p/booking/new",
        icon: <PlusCircle className="w-4 h-4 text-[#1a73e8]" />,
        description: "เลือกห้องประชุม วันและช่วงเวลาที่ต้องการ",
      },
      {
        title: "รายการจองของฉัน",
        href: "/p/my-booking",
        icon: <CalendarDays className="w-4 h-4 text-purple-600" />,
        description: "ตรวจสอบสถานะและประวัติการจองห้องประชุม",
      },
      {
        title: "การอนุมัติคำขอจอง",
        href: "/a/approve-list",
        icon: <Check className="w-4 h-4 text-purple-600" />,
        description: "อนุมัติคำขอจองห้องประชุม",
      },
    ],
  },
  {
    menu_title: "จัดการระบบ",
    icon: <Layers className="w-4 h-4" />,
    submenu: [
      {
        title: "ข้อมูลพื้นฐาน",
        icon: <Layers className="w-4 h-4 text-blue-600" />,
        description: "กำหนดหน่วยงาน ห้องประชุม และอุปกรณ์",
        submenu: [
          {
            title: "หน่วยงานภายใน",
            href: "/i/department",
            icon: <Building2 className="w-3.5 h-3.5 text-blue-500" />,
          },
          {
            title: "ห้องประชุมและสถานที่",
            href: "/i/meeting-room",
            icon: <DoorClosed className="w-3.5 h-3.5 text-blue-500" />,
          },
        ],
      },
      {
        title: "รายงานและสถิติ",
        icon: <BarChart3 className="w-4 h-4 text-amber-600" />,
        description: "สถิติการใช้งานและการอนุมัติ",
        submenu: [
          {
            title: "สถิติการใช้งานห้องประชุม",
            href: "/reports/usage",
            icon: <BarChart3 className="w-3.5 h-3.5 text-amber-500" />,
          },
          {
            title: "ประวัติการอนุมัติการจอง",
            href: "/reports/approvals",
            icon: <CalendarDays className="w-3.5 h-3.5 text-amber-500" />,
          },
        ],
      },
      {
        title: "จัดการผู้ใช้งานระบบ",
        href: "/a/employee-list",
        icon: <Users className="w-4 h-4 text-slate-600" />,
        description: "จัดการสิทธิ์และบัญชีผู้ใช้งาน",
      },
    ],
  },
];

const DEFAULT_USER_MENUS: UserMenuItem[] = [
  {
    title: "แก้ไขข้อมูลส่วนตัว",
    href: "/u/profile",
    icon: <User className="w-4 h-4 text-text-muted" />,
  },
  {
    title: "เปลี่ยนรหัสผ่าน",
    href: "/u/change-password",
    icon: <Key className="w-4 h-4 text-text-muted" />,
  },
  {
    title: "ดูรายการที่เคยจองห้องประชุม",
    href: "/p/my-booking",
    icon: <CalendarDays className="w-4 h-4 text-text-muted" />,
  },
]

const PROTECTED_PATHS: ProtectedPath[] = [
  {
    path: "/p/booking/new",
    roles: ["USER", "ADMIN", "APPROVER"],
  },
  {
    path: "/p/approve-list",
    roles: ["ADMIN", "APPROVER"],
  },
  {
    path: "/u/my-booking",
    roles: ["USER", "ADMIN", "APPROVER"],
  },
  {
    path: "/u/profile",
    roles: ["USER", "ADMIN", "APPROVER"],
  },
  {
    path: "/u/change-password",
    roles: ["USER", "ADMIN", "APPROVER"],
  },
  {
    path: "/i/department",
    roles: ["ADMIN"],
  },
  {
    path: "/i/meetingroom",
    roles: ["ADMIN"],
  },
  {
    path: "/a/employee-list",
    roles: ["ADMIN"],
  },
]

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="th"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-background text-foreground">
        <NavBar
          menus={DEFAULT_MENUS}
          userMenus={DEFAULT_USER_MENUS}
          protectedPaths={PROTECTED_PATHS}
        />
        <div className="flex-1">{children}</div>
        <Footer
          organizationName="เทศบาลเมืองแสนสุข"
          copyrightYear={new Date().getFullYear() + 543}
        />
      </body>
    </html>
  );
}
