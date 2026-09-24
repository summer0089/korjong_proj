import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import NavBar, { NavMenuItem, UserMenuItem } from "@/components/nevigation/NavMenu/Navbar";
import Footer from "@/components/nevigation/Footer";
import { BarChart3, Building2, Calendar, CalendarDays, DoorClosed, Home, Layers, PlusCircle, User, Users } from "lucide-react";

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
        href: "/bookings/new",
        icon: <PlusCircle className="w-4 h-4 text-[#1a73e8]" />,
        description: "เลือกห้องประชุม วันและช่วงเวลาที่ต้องการ",
      },
      {
        title: "ปฏิทินการใช้ห้องประชุม",
        href: "/calendar",
        icon: <Calendar className="w-4 h-4 text-emerald-600" />,
        description: "ตรวจสอบตารางเวลาห้องประชุมแบบเรียลไทม์",
      },
      {
        title: "รายการจองของฉัน",
        href: "/u/bookings",
        icon: <CalendarDays className="w-4 h-4 text-purple-600" />,
        description: "ตรวจสอบสถานะและประวัติการจองห้องประชุม",
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
            href: "/i/meetingroom",
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
        href: "/u/management",
        icon: <Users className="w-4 h-4 text-slate-600" />,
        description: "จัดการสิทธิ์และบัญชีผู้ใช้งาน",
      },
    ],
  },
];

const DEFAULT_USER_MENUS: UserMenuItem[] = [
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
        />
        <div className="flex-1">{children}</div>
        <Footer />
      </body>
    </html>
  );
}
