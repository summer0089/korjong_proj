"use client";

import React, { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { CarouselItem } from "@/components/carousel/type";

interface CarouselProps {
  items: CarouselItem[];
  interval?: number;
}

export default function Carousel({ items, interval }: CarouselProps) {

  const [activeIndex, setActiveIndex] = useState(0);

  // นับเวลาเพื่อเปลี่ยนสไลด์ถัดไป
  useEffect(() => {
    if (!items || items.length === 0) return;

    //เปลี่ยนสไลด์ทุกๆ interval ms
    const step = setInterval(() => {
      setActiveIndex((prevIndex) => (prevIndex + 1) % items.length);
    }, interval || 7000);

    //ทำงานเมื่อเปลี่ยน/ปิดหน้าเว็บ หรือ component นี้ถูกทำลาย
    return () => clearInterval(step);
  }, [items, interval]);

  // ถ้าไม่มีรูปให้แสดงข้อความนี้
  if (!items || items.length === 0) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-slate-900 text-white">
        No images available
      </div>
    );
  }

  return (
    <>
      <div className="w-full h-full relative select-none">
        {/* รูปภาพพร้อมฟังก์ชัน Cross-fade */}
        <div className="absolute inset-0 w-full h-full">
          {items.map((img, idx) => (
            <div
              key={idx}
              className={`absolute inset-0 w-full h-full transition-all duration-1000 ease-in-out transform ${idx === activeIndex
                ? "opacity-100 scale-100 z-10"
                : "opacity-0 scale-105 z-0"
                }`}
            >
              <Link href={img.href || "#"} className="cursor-pointer">
                <Image
                  src={img.src}
                  alt={img.alt}
                  fill
                  sizes="50vw"
                  priority={idx === 0}
                  className="object-cover select-none"
                />
              </Link>
              {/* พื้นหลังเป็นเงา เพื่อให้อ่านข้อความได้ชัดเจน */}
              <div className="absolute inset-0 bg-linear-to-t from-secondary-950/95 via-secondary-950/5 to-transparent z-20" />
            </div>
          ))}
        </div>

        {/* ส่วนแสดงข้อความ */}
        <div className="absolute bottom-20 left-0 right-0 z-30 px-8 sm:px-12 text-center text-white">
          {items.map((img, idx) => (
            <div
              key={idx}
              className={`transition-all duration-700 ease-in-out transform ${idx === activeIndex
                ? "opacity-100 translate-y-0 scale-100"
                : "opacity-0 translate-y-4 scale-95 pointer-events-none absolute left-0 right-0"
                }`}
            >
              <h2 className="text-2xl font-bold tracking-wide sm:text-3xl lg:text-4xl mb-2 drop-shadow-md text-white">
                {img.title}
              </h2>
              {img.location && (
                <p className="text-xs font-semibold text-accent-300 uppercase tracking-widest mb-3 drop-shadow-sm">
                  {img.location}
                </p>
              )}
              <p className="text-sm text-secondary-200/90 max-w-md mx-auto leading-relaxed drop-shadow-sm font-light">
                {img.description}
              </p>
            </div>
          ))}
        </div>

        {/* ปุ่มเปลี่ยนสไลด์ด้านล่าง */}
        <div className="absolute bottom-8 left-0 right-0 z-30 flex justify-center items-center gap-2">
          {items.map((_, idx) => (
            <button
              key={idx}
              onClick={() => setActiveIndex(idx)}
              className={`h-1.5 rounded-full transition-all duration-300 ease-in-out cursor-pointer ${idx === activeIndex
                ? "bg-white w-8"
                : "bg-white/30 hover:bg-white/60 w-2.5"
                }`}
              aria-label={`ไปที่ภาพที่ ${idx + 1}`}
            />
          ))}
        </div>
      </div>
    </>

  );
}
