import { NextRequest, NextResponse } from "next/server";
import { db } from "@/prisma/db";

interface RouteParams {
  params: Promise<{ id: string }>;
}

// GET /api/meeting-room/get/[id] - API สำหรับดึงข้อมูลห้องประชุม
export async function GET(req: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    if (!id) {
      return NextResponse.json(
        { success: false, message: "ไม่พบรหัสห้องประชุม (ID)" },
        { status: 400 }
      );
    }

    // ค้นหาห้องประชุมตามรหัส
    const meetingRoom = await db.orm.public.MeetingRoom.first({ id });

    if (!meetingRoom) {
      return NextResponse.json(
        { success: false, message: "ไม่พบข้อมูลห้องประชุม" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: meetingRoom,
    });
  } catch (error: unknown) {
    console.error("GET /api/meeting-room/get/[id] error:", error);
    const message =
      error instanceof Error ? error.message : "เกิดข้อผิดพลาดในการดึงข้อมูลหน่วยงาน";
    return NextResponse.json(
      { success: false, message, error: String(error) },
      { status: 500 }
    );
  }
}
