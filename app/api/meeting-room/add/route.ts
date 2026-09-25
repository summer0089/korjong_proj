import { NextRequest, NextResponse } from "next/server";
import { db } from "@/prisma/db";
import { MeetingRoomSchema } from "@/utils/validation/meeting_room_form/schema";

// POST /api/department/add - API สำหรับเพิ่มข้อมูลหน่วยงาน
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    const validation = MeetingRoomSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        {
          success: false,
          message: validation.error.issues[0]?.message || "ข้อมูลไม่ถูกต้อง",
          errors: validation.error.format(),
        },
        { status: 400 }
      );
    }

    const { name, capacity } = validation.data;
    const trimmedName = name.trim();

    // ตรวจสอบชื่อห้องประชุมซ้ำ
    const existing = await db.orm.public.MeetingRoom
      .where((meetingRoom) => meetingRoom.name.eq(trimmedName))
      .first();

    if (existing) {
      return NextResponse.json(
        {
          success: false,
          message: "มีชื่อห้องประชุมนี้อยู่ในระบบแล้ว",
        },
        { status: 409 }
      );
    }

    // เพิ่มข้อมูลห้องประชุมใหม่ลงฐานข้อมูล
    const created = await db.orm.public.MeetingRoom.create({
      name: trimmedName,
      capacity,
    });

    return NextResponse.json(
      {
        success: true,
        message: "เพิ่มห้องประชุมสำเร็จ",
        data: created,
      },
      { status: 201 }
    );
  } catch (error: unknown) {
    console.error("POST /api/meeting-room/add error:", error);
    const message =
      error instanceof Error ? error.message : "เกิดข้อผิดพลาดในการเพิ่มห้องประชุม";
    return NextResponse.json(
      {
        success: false,
        message,
        error: String(error),
      },
      { status: 500 }
    );
  }
}
