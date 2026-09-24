import React from "react";
import Link from "next/link";
import { Home } from "lucide-react";
import CarouselContainer from "@/components/carousel/CarouselContainer";
import { CarouselItem } from "@/components/carousel/type";
import SigninForm from "@/components/forms/user/Signin";
import NavbarLogo from "@/components/nevigation/NavMenu/NavbarLogo";

// ข้อมูลรูปภาพและข้อความสำหรับ Carousel ฝั่งซ้าย
const CAROUSEL_IMAGES: CarouselItem[] = [
  {
    src: "/signin_carousel/korjong_info_01.png",
    alt: "จองง่าย ไม่ต้องประสานหลายขั้นตอน",
    title: "จองง่าย ไม่ต้องประสานหลายขั้นตอน",
    href: "#",
    location: "KORJONG SMART RESERVATION",
    description: "ค้นหาห้องประชุม เลือกวันและเวลาที่ต้องการ พร้อมส่งคำขอจองได้อย่างรวดเร็ว ลดขั้นตอนการติดต่อและประสานงานแบบเดิม"
  },
  {
    src: "/signin_carousel/korjong_info_02.png",
    alt: "เห็นตารางว่างแบบชัดเจน",
    title: "เห็นตารางว่างแบบชัดเจน",
    href: "#",
    location: "REAL-TIME AVAILABILITY",
    description: "ตรวจสอบสถานะห้องประชุมและช่วงเวลาที่ถูกจองได้ทันที ช่วยให้เลือกห้องและเวลาที่เหมาะสมได้ง่าย ลดปัญหาการจองซ้ำหรือการใช้ห้องไม่ตรงเวลา"
  }
];

export default function SignInPage() {
  const currentYearBE = new Date().getFullYear() + 543;

  return (
    <main className="min-h-screen w-full flex bg-surface-raised font-sans antialiased text-text">
      {/* Wrapper หลักแบ่ง 2 ฝั่ง Responsive */}
      <div className="w-full flex flex-col lg:flex-row min-h-screen">

        {/* ฝั่งซ้าย: Image Carousel (แสดงเฉพาะหน้าจอขนาด lg ขึ้นไป) */}
        <div className="hidden lg:flex lg:w-1/2 xl:w-1/2 p-5 xl:p-7 relative select-none flex-col justify-between overflow-hidden">

          {/* การ์ด Carousel หลัก */}
          <div className="relative w-full h-full rounded-3xl overflow-hidden shadow-2xl border border-secondary-800/80 bg-secondary-950">
            <CarouselContainer
              items={CAROUSEL_IMAGES}
              className="w-full h-full relative"
            />
          </div>
        </div>

        {/* ฝั่งขวา: Sign In Form และ Brand Header */}
        <div className="w-full lg:w-1/2 xl:w-5/12 flex flex-col justify-between p-6 sm:p-10 md:p-12 lg:p-10 xl:p-14 bg-surface border-l border-border/70 min-h-screen">

          {/* Top Bar: โลโก้ และ ปุ่มกลับสู่หน้าหลัก */}
          <header className="flex justify-between items-center w-full pb-6 border-b border-border/40">
            <NavbarLogo
              title="Korjong : ขอจอง"
              badge="ระบบจองห้องประชุม"
            />

            <Link
              href="/"
              className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-medium text-text-secondary hover:text-primary-600 hover:bg-primary-50 px-3 py-1.5 rounded-lg border border-border hover:border-primary-200 transition-all duration-150 group"
              title="กลับสู่หน้าหลัก"
            >
              <Home className="w-3.5 h-3.5 text-text-muted group-hover:text-primary-600 transition-colors" />
              <span>กลับสู่หน้าหลัก</span>
            </Link>
          </header>

          {/* ส่วนเนื้อหาฟอร์ม Sign In ตรงกลาง */}
          <div className="py-6 sm:py-8 my-auto w-full">
            <SigninForm />
          </div>

          {/* Footer ด้านล่างของฝั่ง Sign In */}
          <footer className="w-full pt-6 border-t border-border/40 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-text-muted">
            <p>© {currentYearBE} เทศบาลเมืองแสนสุข</p>
            <p className="flex items-center gap-1">
              <span>ระบบจองห้องประชุมออนไลน์ Korjong</span>
            </p>
          </footer>

        </div>

      </div>
    </main>
  );
}
