import { NextRequest, NextResponse } from "next/server";
import { db } from "@/prisma/db";
import { getCurrentSessionUser, enrichBooking, checkBookingConflict } from "@/utils/helper/booking";

// PUT/POST /api/booking/update - แก้ไขการจองห้องประชุม
async function handleUpdate(req: NextRequest) {
  try {
    const sessionUser = await getCurrentSessionUser();
    const body = await req.json();

    const {
      id,
      topic,
      participant,
      note,
      startTime,
      endTime,
      roomId,
    } = body;

    if (!id) {
      return NextResponse.json(
        { success: false, message: "ไม่พบรหัสการจองห้องประชุม (ID)" },
        { status: 400 }
      );
    }

    // 1. ตรวจสอบว่ามีข้อมูลการจองอยู่หรือไม่
    const existing = await db.orm.public.MeetingBooking.first({ id });
    if (!existing) {
      return NextResponse.json(
        { success: false, message: "ไม่พบข้อมูลการจองห้องประชุมที่ต้องการแก้ไข" },
        { status: 404 }
      );
    }

    // 2. ตรวจสอบสิทธิ์ (เฉพาะผู้จองคนเดิม หรือ Admin/Approver เท่านั้น)
    if (
      sessionUser &&
      sessionUser.role !== "ADMIN" &&
      sessionUser.role !== "APPROVER" &&
      existing.employeeId !== sessionUser.id
    ) {
      return NextResponse.json(
        { success: false, message: "คุณไม่มีสิทธิ์แก้ไขการจองของผู้อื่น" },
        { status: 403 }
      );
    }

    // 3. ตรวจสอบสถานะการจอง (ถ้าถูกยกเลิกแล้ว ไม่ควรแก้ไข)
    if (existing.status === "CANCELED") {
      return NextResponse.json(
        { success: false, message: "ไม่สามารถแก้ไขการจองที่ถูกยกเลิกแล้วได้" },
        { status: 400 }
      );
    }

    // 4. เตรียมข้อมูลที่จะอัปเดต
    const updateData: Record<string, any> = {};

    if (topic !== undefined && topic.trim()) {
      updateData.topic = topic.trim();
    }

    if (participant !== undefined) {
      const p = Number(participant);
      if (p < 1) {
        return NextResponse.json(
          { success: false, message: "จำนวนผู้เข้าร่วมต้องมากกว่า 0" },
          { status: 400 }
        );
      }
      updateData.participant = p;
    }

    if (note !== undefined) {
      updateData.note = String(note).trim();
    }

    const targetRoomId = roomId || existing.roomId;
    if (roomId && roomId !== existing.roomId) {
      const room = await db.orm.public.MeetingRoom.first({ id: roomId });
      if (!room) {
        return NextResponse.json(
          { success: false, message: "ไม่พบข้อมูลห้องประชุมที่ระบุ" },
          { status: 404 }
        );
      }
      updateData.roomId = roomId;
    }

    const newStart = startTime ? new Date(startTime) : new Date(existing.startTime);
    const newEnd = endTime ? new Date(endTime) : new Date(existing.endTime);

    if (isNaN(newStart.getTime()) || isNaN(newEnd.getTime())) {
      return NextResponse.json(
        { success: false, message: "รูปแบบวันเวลาไม่ถูกต้อง" },
        { status: 400 }
      );
    }

    if (newEnd.getTime() <= newStart.getTime()) {
      return NextResponse.json(
        { success: false, message: "เวลาสิ้นสุดต้องมากกว่าเวลาเริ่มต้น" },
        { status: 400 }
      );
    }

    if (startTime) updateData.startTime = newStart.toISOString();
    if (endTime) updateData.endTime = newEnd.toISOString();

    // 5. ตรวจสอบเวลาชนกันกับรายการอื่นในห้องเดียวกัน
    const conflictCheck = await checkBookingConflict(
      targetRoomId,
      newStart.toISOString(),
      newEnd.toISOString(),
      id
    );

    if (conflictCheck.hasConflict) {
      return NextResponse.json(
        {
          success: false,
          message: "ช่วงเวลานี้มีการจองห้องประชุมนี้แล้ว กรุณาเลือกช่วงเวลาอื่น",
        },
        { status: 409 }
      );
    }

    // 6. อัปเดตข้อมูลลงฐานข้อมูล
    const updated = await db.orm.public.MeetingBooking
      .where({ id })
      .update(updateData);

    const enriched = await enrichBooking(updated);

    return NextResponse.json({
      success: true,
      message: "แก้ไขข้อมูลการจองห้องประชุมสำเร็จ",
      data: enriched,
    });
  } catch (error: unknown) {
    console.error("PUT /api/booking/update error:", error);
    const message =
      error instanceof Error ? error.message : "เกิดข้อผิดพลาดในการแก้ไขการจอง";
    return NextResponse.json(
      { success: false, message, error: String(error) },
      { status: 500 }
    );
  }
}

export async function PUT(req: NextRequest) {
  return handleUpdate(req);
}

export async function POST(req: NextRequest) {
  return handleUpdate(req);
}
