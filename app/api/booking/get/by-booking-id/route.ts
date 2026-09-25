import { NextRequest, NextResponse } from "next/server";
import { db } from "@/prisma/db";
import { enrichBooking } from "@/utils/helper/booking";

// GET /api/booking/get/by-booking-id - ดึงข้อมูลการจองโดยระบุ ID ของการจอง
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id") || searchParams.get("bookingId");

    if (!id) {
      return NextResponse.json(
        { success: false, message: "กรุณาระบุรหัสการจอง (id หรือ bookingId)" },
        { status: 400 }
      );
    }

    const booking = await db.orm.public.MeetingBooking.first({ id });
    if (!booking) {
      return NextResponse.json(
        { success: false, message: "ไม่พบข้อมูลการจองห้องประชุม" },
        { status: 404 }
      );
    }

    const enriched = await enrichBooking(booking);

    return NextResponse.json({
      success: true,
      data: enriched,
    });
  } catch (error: unknown) {
    console.error("GET /api/booking/get/by-booking-id error:", error);
    const message =
      error instanceof Error ? error.message : "เกิดข้อผิดพลาดในการดึงข้อมูลการจอง";
    return NextResponse.json(
      { success: false, message, error: String(error) },
      { status: 500 }
    );
  }
}
