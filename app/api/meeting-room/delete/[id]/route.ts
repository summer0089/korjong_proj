import { NextRequest, NextResponse } from "next/server";
import { db } from "@/prisma/db";

interface RouteParams {
  params: Promise<{ id: string }>;
}

// DELETE /api/meeting-room/delete/[id]/ - API สำหรับลบข้อมูลห้องประชุม
export async function DELETE(req: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    if (!id) {
      return NextResponse.json(
        { success: false, message: "ไม่พบรหัสห้องประชุม (ID)" },
        { status: 400 }
      );
    }

    // ตรวจสอบว่ามีข้อมูลห้องประชุมที่ต้องการลบหรือไม่
    const existing = await db.orm.public.MeetingRoom.first({ id });
    if (!existing) {
      return NextResponse.json(
        { success: false, message: "ไม่พบข้อมูลห้องประชุมที่ต้องการลบ" },
        { status: 404 }
      );
    }

    // ลบข้อมูลห้องประชุม
    await db.orm.public.MeetingRoom.where({ id }).delete();

    return NextResponse.json({
      success: true,
      message: `ลบห้องประชุม "${existing.name}" สำเร็จ`,
    });
  } catch (error: unknown) {
    console.error("DELETE /api/meeting-room/delete/[id] error:", error);
    const message =
      error instanceof Error ? error.message : "เกิดข้อผิดพลาดในการลบห้องประชุม";
    return NextResponse.json(
      { success: false, message, error: String(error) },
      { status: 500 }
    );
  }
}
