import { NextRequest, NextResponse } from "next/server";
import { db } from "@/prisma/db";
import { getCurrentSessionUser, enrichBooking } from "@/utils/helper/booking";

// POST/PATCH /api/booking/cancel - ยกเลิกการจองห้องประชุม (เปลี่ยนสถานะเป็น CANCELED)
async function handleCancel(req: NextRequest) {
  try {
    const sessionUser = await getCurrentSessionUser();

    let id: string | null = null;
    let cancelReason = "";

    const { searchParams } = new URL(req.url);
    id = searchParams.get("id");

    try {
      const body = await req.json();
      if (!id) id = body?.id || null;
      if (body?.reason) cancelReason = String(body.reason);
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

    // 2. ตรวจสอบสิทธิ์ (เฉพาะผู้จองคนเดิม หรือ Admin/Approver)
    if (
      sessionUser &&
      sessionUser.role !== "ADMIN" &&
      sessionUser.role !== "APPROVER" &&
      existing.employeeId !== sessionUser.id
    ) {
      return NextResponse.json(
        { success: false, message: "คุณไม่มีสิทธิ์ยกเลิกการจองของผู้อื่น" },
        { status: 403 }
      );
    }

    // 3. ตรวจสอบว่าถูกยกเลิกไปแล้วหรือไม่
    if (existing.status === "CANCELED") {
      return NextResponse.json(
        { success: false, message: "รายการจองนี้ถูกยกเลิกไปแล้ว" },
        { status: 400 }
      );
    }

    // 4. เปลี่ยนสถานะเป็น CANCELED
    const updateData: Record<string, any> = {
      status: "CANCELED",
    };
    if (cancelReason) {
      updateData.note = (existing.note || "") + `\n[เหตุผลที่ยกเลิก: ${cancelReason}]`;
    }

    const updated = await db.orm.public.MeetingBooking
      .where({ id })
      .update(updateData);

    const enriched = await enrichBooking(updated);

    return NextResponse.json({
      success: true,
      message: "ยกเลิกการจองห้องประชุมสำเร็จ",
      data: enriched,
    });
  } catch (error: unknown) {
    console.error("POST /api/booking/cancel error:", error);
    const message =
      error instanceof Error ? error.message : "เกิดข้อผิดพลาดในการยกเลิกการจอง";
    return NextResponse.json(
      { success: false, message, error: String(error) },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  return handleCancel(req);
}

export async function PATCH(req: NextRequest) {
  return handleCancel(req);
}
