import { NextRequest, NextResponse } from "next/server";
import { db } from "@/prisma/db";
import { getCurrentSessionUser, enrichBooking } from "@/utils/helper/booking";

// POST/PATCH /api/booking/status/reject - ปฏิเสธคำขอจองห้องประชุม
async function handleReject(req: NextRequest) {
  try {
    const sessionUser = await getCurrentSessionUser();

    // ตรวจสอบสิทธิ์ (ถ้ามี session ต้องเป็น APPROVER หรือ ADMIN)
    if (sessionUser && sessionUser.role !== "ADMIN" && sessionUser.role !== "APPROVER") {
      return NextResponse.json(
        { success: false, message: "คุณไม่มีสิทธิ์ปฏิเสธการจองห้องประชุม" },
        { status: 403 }
      );
    }

    let id: string | null = null;
    let noteAppend = "";

    const { searchParams } = new URL(req.url);
    id = searchParams.get("id");

    try {
      const body = await req.json();
      if (!id) id = body?.id || null;
      if (body?.reason) {
        noteAppend = `\n[เหตุผลที่ไม่อนุมัติ: ${body.reason}]`;
      }
    } catch {
      // no body
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

    // 2. เงื่อนไข: สถานะที่สามารถปฏิเสธได้คือ "รออนุมัติ" (PENDING) เท่านั้น
    if (existing.status !== "PENDING") {
      return NextResponse.json(
        {
          success: false,
          message: `ไม่สามารถดำเนินการได้เนื่องจากสถานะปัจจุบันคือ "${existing.status}" (สามารถปฏิเสธได้เฉพาะสถานะรอการอนุมัติเท่านั้น)`,
        },
        { status: 400 }
      );
    }

    // 3. เปลี่ยนสถานะเป็น REJECTED
    const updateData: Record<string, any> = {
      status: "REJECTED",
    };
    if (noteAppend) {
      updateData.note = (existing.note || "") + noteAppend;
    }

    const updated = await db.orm.public.MeetingBooking
      .where({ id })
      .update(updateData);

    const enriched = await enrichBooking(updated);

    return NextResponse.json({
      success: true,
      message: "ปฏิเสธคำขอจองห้องประชุมเรียบร้อยแล้ว",
      data: enriched,
    });
  } catch (error: unknown) {
    console.error("POST /api/booking/status/reject error:", error);
    const message =
      error instanceof Error ? error.message : "เกิดข้อผิดพลาดในการปฏิเสธการจอง";
    return NextResponse.json(
      { success: false, message, error: String(error) },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  return handleReject(req);
}

export async function PATCH(req: NextRequest) {
  return handleReject(req);
}
