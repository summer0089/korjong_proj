import { NextResponse } from "next/server";
import { db } from "@/prisma/db";

// GET /api/meeting-room/get/ - API สำหรับดึงข้อมูลห้องประชุม
export async function GET() {
  try {
    // ดึงข้อมูลห้องประชุมทั้งหมดเรียงตามวันที่สร้างล่าสุด
    const meetingRooms = await db.orm.public.MeetingRoom
      .orderBy((record) => record.createdAt.asc())
      .all();

    return NextResponse.json({
      success: true,
      data: meetingRooms,
    });
  } catch (error: unknown) {
    console.error("GET /api/meeting-room/get error:", error);
    return NextResponse.json(
      { success: false, message: "ไม่สามารถดึงข้อมูลห้องประชุมได้" },
      { status: 500 }
    );
  }
}
