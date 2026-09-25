import { NextRequest, NextResponse } from "next/server";
import { db } from "@/prisma/db";
import { enrichBookings } from "@/utils/helper/booking";

// GET /api/booking/get/status - ดึงข้อมูลการจองโดยระบุสถานะ
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const statusParam = searchParams.get("status");

    if (!statusParam) {
      return NextResponse.json(
        {
          success: false,
          message: "กรุณาระบุสถานะที่ต้องการค้นหา (status เช่น PENDING, APPROVED, CANCELED, REJECTED)",
        },
        { status: 400 }
      );
    }

    const requestedStatuses = statusParam
      .split(",")
      .map((s) => s.trim().toUpperCase());

    const allBookings = await db.orm.public.MeetingBooking
      .orderBy((b) => b.startTime.desc())
      .all();

    const filtered = (allBookings || []).filter((b: any) =>
      requestedStatuses.includes(b.status)
    );

    const enriched = await enrichBookings(filtered);

    return NextResponse.json({
      success: true,
      data: enriched,
      total: enriched.length,
    });
  } catch (error: unknown) {
    console.error("GET /api/booking/get/status error:", error);
    const message =
      error instanceof Error ? error.message : "เกิดข้อผิดพลาดในการดึงข้อมูลการจองตามสถานะ";
    return NextResponse.json(
      { success: false, message, error: String(error) },
      { status: 500 }
    );
  }
}
