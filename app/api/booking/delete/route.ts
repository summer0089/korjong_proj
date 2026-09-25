import { NextRequest, NextResponse } from "next/server";
import { db } from "@/prisma/db";
import { getCurrentSessionUser } from "@/utils/helper/booking";

// DELETE/POST /api/booking/delete - ลบข้อมูลการจองห้องประชุม
async function handleDelete(req: NextRequest) {
  try {
    const sessionUser = await getCurrentSessionUser();

    // ดึง id จาก body หรือ query param
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

    // 1. ตรวจสอบว่ามีข้อมูลการจองอยู่หรือไม่
    const existing = await db.orm.public.MeetingBooking.first({ id });
    if (!existing) {
      return NextResponse.json(
        { success: false, message: "ไม่พบข้อมูลการจองห้องประชุมที่ต้องการลบ" },
        { status: 404 }
      );
    }

    // 2. ตรวจสอบสิทธิ์ (เฉพาะเจ้าของการจอง หรือ Admin/Approver)
    if (
      sessionUser &&
      sessionUser.role !== "ADMIN" &&
      sessionUser.role !== "APPROVER" &&
      existing.employeeId !== sessionUser.id
    ) {
      return NextResponse.json(
        { success: false, message: "คุณไม่มีสิทธิ์ลบการจองของผู้อื่น" },
        { status: 403 }
      );
    }

    // 3. ลบข้อมูลออกจากฐานข้อมูล
    await db.orm.public.MeetingBooking.where({ id }).delete();

    return NextResponse.json({
      success: true,
      message: `ลบการจองห้องประชุม "${existing.topic}" สำเร็จ`,
    });
  } catch (error: unknown) {
    console.error("DELETE /api/booking/delete error:", error);
    const message =
      error instanceof Error ? error.message : "เกิดข้อผิดพลาดในการลบการจองห้องประชุม";
    return NextResponse.json(
      { success: false, message, error: String(error) },
      { status: 500 }
    );
  }
}

export async function DELETE(req: NextRequest) {
  return handleDelete(req);
}

export async function POST(req: NextRequest) {
  return handleDelete(req);
}
