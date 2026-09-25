import { NextRequest, NextResponse } from "next/server";
import { db } from "@/prisma/db";
import { getCurrentSessionUser, enrichBooking, checkBookingConflict } from "@/utils/helper/booking";

// POST/PATCH /api/booking/status/approve - อนุมัติการจองห้องประชุม
async function handleApprove(req: NextRequest) {
  try {
    const sessionUser = await getCurrentSessionUser();

    // ตรวจสอบสิทธิ์ (ถ้ามี session ต้องเป็น APPROVER หรือ ADMIN)
    if (sessionUser && sessionUser.role !== "ADMIN" && sessionUser.role !== "APPROVER") {
      return NextResponse.json(
        { success: false, message: "คุณไม่มีสิทธิ์อนุมัติการจองห้องประชุม" },
        { status: 403 }
      );
    }

    let id: string | null = null;
    const { searchParams } = new URL(req.url);
    id = searchParams.get("id");

    if (!id) {
      try {
        const body = await req.json();
        id = body?.id || null;
      } catch {
        // no body
      }
    }

    if (!id) {
      return NextResponse.json(
        { success: false, message: "ไม่พบรหัสการจองห้องประชุม (ID)" },
        { status: 400 }
      );
    }

    // 1. ตรวจสอบว่ามีข้อมูลการจองหรือไม่
    const existing = await db.orm.public.MeetingBooking.first({ id });
    if (!existing) {
      return NextResponse.json(
        { success: false, message: "ไม่พบข้อมูลการจองห้องประชุม" },
        { status: 404 }
      );
    }

    // 2. เงื่อนไข: สถานะที่สามารถได้รับอนุมัติคือ "รออนุมัติ" (PENDING) เท่านั้น
    if (existing.status !== "PENDING") {
      return NextResponse.json(
        {
          success: false,
          message: `ไม่สามารถอนุมัติได้เนื่องจากสถานะปัจจุบันคือ "${existing.status}" (สามารถอนุมัติได้เฉพาะสถานะรอการอนุมัติเท่านั้น)`,
        },
        { status: 400 }
      );
    }

    // 3. ตรวจสอบว่ามีรายการอื่นที่ APPROVED ไปก่อนหน้าแล้วในช่วงเวลาเดียวกันหรือไม่
    const conflictCheck = await checkBookingConflict(
      existing.roomId,
      existing.startTime,
      existing.endTime,
      id
    );

    if (conflictCheck.hasConflict && conflictCheck.conflictingBooking?.status === "APPROVED") {
      return NextResponse.json(
        {
          success: false,
          message: "ไม่สามารถอนุมัติได้ เนื่องจากมีรายการจองอื่นที่ได้รับการอนุมัติในช่วงเวลานี้ไปแล้ว",
        },
        { status: 409 }
      );
    }

    // 4. เปลี่ยนสถานะเป็น APPROVED
    const updated = await db.orm.public.MeetingBooking
      .where({ id })
      .update({
        status: "APPROVED",
      });

    const enriched = await enrichBooking(updated);

    return NextResponse.json({
      success: true,
      message: "อนุมัติคำขอจองห้องประชุมเรียบร้อยแล้ว",
      data: enriched,
    });
  } catch (error: unknown) {
    console.error("POST /api/booking/status/approve error:", error);
    const message =
      error instanceof Error ? error.message : "เกิดข้อผิดพลาดในการอนุมัติการจอง";
    return NextResponse.json(
      { success: false, message, error: String(error) },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  return handleApprove(req);
}

export async function PATCH(req: NextRequest) {
  return handleApprove(req);
}
