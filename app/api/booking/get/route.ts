import { NextRequest, NextResponse } from "next/server";
import { db } from "@/prisma/db";
import { enrichBookings } from "@/utils/helper/booking";

// GET /api/booking/get - ดึงข้อมูลการจองห้องประชุมทั้งหมด (รองรับตัวกรองเสริม)
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);

    const roomId = searchParams.get("roomId");
    const status = searchParams.get("status");
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");
    const search = searchParams.get("search");

    let allBookings = await db.orm.public.MeetingBooking
      .orderBy((b) => b.startTime.asc())
      .all();

    if (!Array.isArray(allBookings)) {
      return NextResponse.json({
        success: true,
        data: [],
        total: 0,
      });
    }

    // Filter by room
    if (roomId && roomId !== "ALL") {
      allBookings = allBookings.filter((b: any) => b.roomId === roomId);
    }

    // Filter by status
    if (status && status !== "ALL") {
      if (status === "APPROVED_PENDING") {
        allBookings = allBookings.filter(
          (b: any) => b.status === "APPROVED" || b.status === "PENDING"
        );
      } else {
        const statuses = status.split(",").map((s) => s.trim().toUpperCase());
        allBookings = allBookings.filter((b: any) => statuses.includes(b.status));
      }
    }

    // Filter by date range (if requested)
    if (startDate) {
      const s = new Date(startDate).getTime();
      allBookings = allBookings.filter(
        (b: any) => new Date(b.endTime).getTime() >= s
      );
    }
    if (endDate) {
      const e = new Date(endDate).getTime();
      allBookings = allBookings.filter(
        (b: any) => new Date(b.startTime).getTime() <= e
      );
    }

    // Filter by search query
    if (search && search.trim()) {
      const q = search.toLowerCase();
      allBookings = allBookings.filter(
        (b: any) =>
          (b.topic || "").toLowerCase().includes(q) ||
          (b.note || "").toLowerCase().includes(q)
      );
    }

    // ผนวกข้อมูล Room และ Employee
    const enriched = await enrichBookings(allBookings);

    return NextResponse.json({
      success: true,
      data: enriched,
      total: enriched.length,
    });
  } catch (error: unknown) {
    console.error("GET /api/booking/get error:", error);
    const message =
      error instanceof Error ? error.message : "เกิดข้อผิดพลาดในการดึงข้อมูลการจองทั้งหมด";
    return NextResponse.json(
      { success: false, message, error: String(error) },
      { status: 500 }
    );
  }
}
