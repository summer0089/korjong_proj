import { NextRequest, NextResponse } from "next/server";
import { db } from "@/prisma/db";
import { getCurrentSessionUser, enrichBooking, checkBookingConflict } from "@/utils/helper/booking";

// POST /api/booking/new - สร้างการจองห้องประชุมใหม่
export async function POST(req: NextRequest) {
  try {
    const sessionUser = await getCurrentSessionUser();
    const body = await req.json();

    const {
      topic,
      participant,
      note = "",
      startTime,
      endTime,
      roomId,
      employeeId: bodyEmployeeId,
    } = body;

    // 1. ตรวจสอบข้อมูลบังคับ
    if (!topic || !topic.trim()) {
      return NextResponse.json(
        { success: false, message: "กรุณาระบุหัวข้อการประชุม" },
        { status: 400 }
      );
    }

    if (!roomId) {
      return NextResponse.json(
        { success: false, message: "กรุณาระบุห้องประชุม" },
        { status: 400 }
      );
    }

    if (!startTime || !endTime) {
      return NextResponse.json(
        { success: false, message: "กรุณาระบุเวลาเริ่มต้นและเวลาสิ้นสุด" },
        { status: 400 }
      );
    }

    const startDate = new Date(startTime);
    const endDate = new Date(endTime);

    if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
      return NextResponse.json(
        { success: false, message: "รูปแบบวันเวลาไม่ถูกต้อง" },
        { status: 400 }
      );
    }

    if (endDate.getTime() <= startDate.getTime()) {
      return NextResponse.json(
        { success: false, message: "เวลาสิ้นสุดต้องมากกว่าเวลาเริ่มต้น" },
        { status: 400 }
      );
    }

    // 2. ตรวจสอบวันที่ในอดีต (ไม่สามารถจองย้อนหลังได้)
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const bookingDay = new Date(startDate);
    bookingDay.setHours(0, 0, 0, 0);

    if (bookingDay < today) {
      return NextResponse.json(
        { success: false, message: "ไม่สามารถจองห้องประชุมในวันที่ย้อนหลังได้" },
        { status: 400 }
      );
    }

    // 3. ตรวจสอบว่าห้องประชุมมีอยู่จริง
    const room = await db.orm.public.MeetingRoom.first({ id: roomId });
    if (!room) {
      return NextResponse.json(
        { success: false, message: "ไม่พบข้อมูลห้องประชุมที่ระบุ" },
        { status: 404 }
      );
    }

    // 4. ตรวจสอบผู้จอง (จาก Session หรือ Body หรือหาพนักงานคนแรก)
    let employeeId = sessionUser?.id || bodyEmployeeId;
    if (!employeeId) {
      const firstEmployee = await db.orm.public.Employee.first();
      if (firstEmployee) {
        employeeId = firstEmployee.id;
      } else {
        return NextResponse.json(
          { success: false, message: "กรุณาเข้าสู่ระบบก่อนทำการจองห้องประชุม" },
          { status: 401 }
        );
      }
    }

    // 5. ตรวจสอบการจองเวลาทับซ้อนในห้องเดียวกัน
    const conflictCheck = await checkBookingConflict(roomId, startTime, endTime);
    if (conflictCheck.hasConflict) {
      return NextResponse.json(
        {
          success: false,
          message: "ช่วงเวลานี้มีการจองห้องประชุมนี้แล้ว กรุณาเลือกช่วงเวลาอื่น",
        },
        { status: 409 }
      );
    }

    // 6. บันทึกข้อมูลการจองลงฐานข้อมูล
    const created = await db.orm.public.MeetingBooking.create({
      topic: topic.trim(),
      participant: Number(participant) || 1,
      note: (note || "").trim(),
      status: "PENDING",
      startTime: startDate.toISOString(),
      endTime: endDate.toISOString(),
      roomId,
      employeeId,
    });

    // 7. ผนวกข้อมูล Room และ Employee ส่งกลับ
    const enriched = await enrichBooking(created);

    return NextResponse.json(
      {
        success: true,
        message: "สร้างคำขอจองห้องประชุมสำเร็จ",
        data: enriched,
      },
      { status: 201 }
    );
  } catch (error: unknown) {
    console.error("POST /api/booking/new error:", error);
    const message =
      error instanceof Error ? error.message : "เกิดข้อผิดพลาดในการสร้างคำขอจอง";
    return NextResponse.json(
      { success: false, message, error: String(error) },
      { status: 500 }
    );
  }
}
