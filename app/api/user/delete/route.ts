import { NextRequest, NextResponse } from "next/server";
import { db } from "@/prisma/db";
import checkProtectedApi from "@/utils/helper/protected_api";

// DELETE /api/user/delete - ลบบัญชีผู้ใช้งาน (เฉพาะ ADMIN)
// รองรับการรับ id ผ่าน searchParams (?id=...) หรือ JSON body ({ id: "..." })
export async function DELETE(req: NextRequest) {
  try {
    // 1. ตรวจสอบสิทธิ์ผู้ดูแลระบบ (ADMIN)
    const authResult = await checkProtectedApi(["ADMIN"]);
    if (authResult instanceof NextResponse) return authResult;
    const { user: sessionUser } = authResult;

    let id = req.nextUrl.searchParams.get("id");
    if (!id) {
      try {
        const body = await req.json();
        id = body?.id || body?.userId;
      } catch {
        // body could be empty
      }
    }

    if (!id || typeof id !== "string") {
      return NextResponse.json(
        { success: false, message: "กรุณาระบุรหัสผู้ใช้งานที่ต้องการลบ (ID)" },
        { status: 400 }
      );
    }

    // 2. ป้องกันไม่ให้แอดมินลบบัญชีตนเอง
    if (sessionUser.id === id) {
      return NextResponse.json(
        {
          success: false,
          message: "ไม่สามารถลบบัญชีของตนเองที่กำลังเข้าสู่ระบบอยู่ได้",
        },
        { status: 400 }
      );
    }

    // 3. ตรวจสอบว่าผู้ใช้งานมีอยู่จริงหรือไม่
    const existing = await db.orm.public.Employee.where({ id }).first();
    if (!existing) {
      return NextResponse.json(
        { success: false, message: "ไม่พบข้อมูลผู้ใช้งานที่ต้องการลบ" },
        { status: 404 }
      );
    }

    // 4. ตรวจสอบว่าผู้ใช้มีประวัติการจองห้องประชุมหรือไม่
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

    // 5. ลบข้อมูลผู้ใช้งาน
    await db.orm.public.Employee.where({ id }).delete();

    return NextResponse.json({
      success: true,
      message: `ลบบัญชีผู้ใช้งาน "${existing.firstname} ${existing.lastname}" สำเร็จ`,
    });
  } catch (error: unknown) {
    console.error("DELETE /api/user/delete error:", error);
    const message =
      error instanceof Error ? error.message : "เกิดข้อผิดพลาดในการลบบัญชีผู้ใช้งาน";
    return NextResponse.json(
      { success: false, message },
      { status: 500 }
    );
  }
}
