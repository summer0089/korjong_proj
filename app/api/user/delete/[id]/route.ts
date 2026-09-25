import { NextRequest, NextResponse } from "next/server";
import { db } from "@/prisma/db";
import { checkAuth } from "@/lib/auth/guard";

interface RouteParams {
  params: Promise<{ id: string }>;
}

// DELETE /api/user/delete/[id] - ลบบัญชีผู้ใช้งาน (เฉพาะ ADMIN)
export async function DELETE(req: NextRequest, { params }: RouteParams) {
  try {
    const authResult = await checkAuth(["ADMIN"]);
    if (authResult instanceof NextResponse) return authResult;
    const { user: sessionUser } = authResult;

    const { id } = await params;
    if (!id) {
      return NextResponse.json(
        { success: false, message: "กรุณาระบุรหัสผู้ใช้งานที่ต้องการลบ (ID)" },
        { status: 400 }
      );
    }

    if (sessionUser.id === id) {
      return NextResponse.json(
        {
          success: false,
          message: "ไม่สามารถลบบัญชีของตนเองที่กำลังเข้าสู่ระบบอยู่ได้",
        },
        { status: 400 }
      );
    }

    const existing = await db.orm.public.Employee.where({ id }).first();
    if (!existing) {
      return NextResponse.json(
        { success: false, message: "ไม่พบข้อมูลผู้ใช้งานที่ต้องการลบ" },
        { status: 404 }
      );
    }

    const booking = await db.orm.public.MeetingBooking
      .where({ employeeId: id })
      .first();

    if (booking) {
      return NextResponse.json(
        {
          success: false,
          message:
            "ไม่สามารถลบบัญชีผู้ใช้งานนี้ได้ เนื่องจากมีประวัติการจองห้องประชุมในระบบ กรุณาใช้การระงับการใช้งานแทน เพื่อรักษาประวัติการจอง",
        },
        { status: 400 }
      );
    }

    await db.orm.public.Employee.where({ id }).delete();

    return NextResponse.json({
      success: true,
      message: `ลบบัญชีผู้ใช้งาน "${existing.firstname} ${existing.lastname}" สำเร็จ`,
    });
  } catch (error: unknown) {
    console.error("DELETE /api/user/delete/[id] error:", error);
    const message =
      error instanceof Error ? error.message : "เกิดข้อผิดพลาดในการลบบัญชีผู้ใช้งาน";
    return NextResponse.json(
      { success: false, message },
      { status: 500 }
    );
  }
}
