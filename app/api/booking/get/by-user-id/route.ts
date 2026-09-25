import { NextRequest, NextResponse } from "next/server";
import { db } from "@/prisma/db";
import { getCurrentSessionUser, enrichBookings } from "@/utils/helper/booking";

// GET /api/booking/get/by-user-id - ดึงข้อมูลการจองโดยระบุ ID ของผู้จอง
export async function GET(req: NextRequest) {
  try {
    const sessionUser = await getCurrentSessionUser();
    const { searchParams } = new URL(req.url);

    // ดึง userId จาก query param (userId หรือ employeeId) หรือ fallback ไปที่ session
    const userId = searchParams.get("userId") || searchParams.get("employeeId") || sessionUser?.id;

    if (!userId) {
      return NextResponse.json(
        { success: false, message: "กรุณาระบุรหัสผู้ใช้งาน (userId หรือ employeeId)" },
        { status: 400 }
      );
    }

    // ดึงข้อมูลการจองทั้งหมดของผู้ใช้นี้
    const bookings = await db.orm.public.MeetingBooking
      .where({ employeeId: userId })
      .orderBy((b) => b.startTime.desc())
      .all();

    const enriched = await enrichBookings(bookings || []);

    return NextResponse.json({
      success: true,
      data: enriched,
      total: enriched.length,
    });
  } catch (error: unknown) {
    console.error("GET /api/booking/get/by-user-id error:", error);
    const message =
      error instanceof Error ? error.message : "เกิดข้อผิดพลาดในการดึงข้อมูลการจองของผู้ใช้";
    return NextResponse.json(
      { success: false, message, error: String(error) },
      { status: 500 }
    );
  }
}
