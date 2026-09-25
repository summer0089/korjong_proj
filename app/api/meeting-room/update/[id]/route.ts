import { NextRequest, NextResponse } from "next/server";
import { db } from "@/prisma/db";
import { MeetingRoomSchema } from "@/utils/validation/meeting_room_form/schema";

interface RouteParams {
  params: Promise<{ id: string }>;
}

// PUT /api/meeting-room/update/[id]/ - API สำหรับแก้ไขข้อมูลห้องประชุม
export async function PUT(req: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    if (!id) {
      return NextResponse.json(
        { success: false, message: "ไม่พบรหัสห้องประชุม (ID)" },
        { status: 400 }
      );
    }

    // ตรวจสอบว่ามีข้อมูลห้องประชุมที่ต้องการแก้ไขหรือไม่
    const existing = await db.orm.public.MeetingRoom.first({ id });
    if (!existing) {
      return NextResponse.json(
        { success: false, message: "ไม่พบข้อมูลห้องประชุมที่ต้องการแก้ไข" },
        { status: 404 }
      );
    }

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
    const duplicate = await db.orm.public.MeetingRoom
      .where((d) => d.name.eq(trimmedName))
      .where((d) => d.id.neq(id))
      .first();

    if (duplicate) {
      return NextResponse.json(
        { success: false, message: "มีห้องประชุมชื่อนี้อยู่ในระบบแล้ว" },
        { status: 409 }
      );
    }

    // แก้ไขข้อมูลห้องประชุม
    const updated = await db.orm.public.MeetingRoom
      .where({ id })
      .update({ name: trimmedName, capacity: capacity });

    return NextResponse.json({
      success: true,
      message: "แก้ไขข้อมูลห้องประชุมสำเร็จ",
      data: updated,
    });
  } catch (error: unknown) {
    console.error("PUT/POST /api/meeting-room/update/[id] error:", error);
    const message =
      error instanceof Error ? error.message : "เกิดข้อผิดพลาดในการแก้ไขห้องประชุม";
    return NextResponse.json(
      { success: false, message, error: String(error) },
      { status: 500 }
    );
  }
}

