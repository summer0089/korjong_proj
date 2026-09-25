import { NextRequest, NextResponse } from "next/server";
import { db } from "@/prisma/db";
import checkProtectedApi from "@/utils/helper/protected_api";

// POST หรือ PUT /api/user/update/status - สลับหรือกำหนดสถานะการใช้งานบัญชี (เฉพาะ ADMIN)
export async function POST(req: NextRequest) {
  return handleUpdateStatus(req);
}

export async function PUT(req: NextRequest) {
  return handleUpdateStatus(req);
}

async function handleUpdateStatus(req: NextRequest) {
  try {
    // 1. ตรวจสอบสิทธิ์ผู้ดูแลระบบ (ADMIN)
    const authResult = await checkProtectedApi(["ADMIN"]);
    if (authResult instanceof NextResponse) return authResult;
    const { user: sessionUser } = authResult;

    const body = await req.json();
    const id = body.id || body.userId;

    if (!id || typeof id !== "string") {
      return NextResponse.json(
        { success: false, message: "กรุณาระบุรหัสผู้ใช้งาน (ID)" },
        { status: 400 }
      );
    }

    // คำนวณ isActive: ถ้าระบุ isActive ให้ใช้ค่านั้น หรือถ้าส่ง banned มาให้ใช้ !banned
    let isActive: boolean;
    if (typeof body.isActive === "boolean") {
      isActive = body.isActive;
    } else if (typeof body.banned === "boolean") {
      isActive = !body.banned;
    } else {
      return NextResponse.json(
        { success: false, message: "กรุณาระบุสถานะการใช้งาน (isActive)" },
        { status: 400 }
      );
    }

    // 2. ตรวจสอบว่าผู้ใช้งานมีอยู่จริงหรือไม่
    const targetUser = await db.orm.public.Employee.where({ id }).first();
    if (!targetUser) {
      return NextResponse.json(
        { success: false, message: "ไม่พบข้อมูลผู้ใช้งานที่ต้องการเปลี่ยนสถานะ" },
        { status: 404 }
      );
    }

    // 3. ป้องกันไม่ให้แอดมินระงับการใช้งานบัญชีของตนเอง
    if (sessionUser.id === id && !isActive) {
      return NextResponse.json(
        {
          success: false,
          message: "ไม่สามารถระงับการใช้งานบัญชีของตนเองที่กำลังเข้าสู่ระบบอยู่ได้",
        },
        { status: 400 }
      );
    }

    // 4. อัปเดตสถานะในฐานข้อมูล
    await db.orm.public.Employee.where({ id }).update({
      isActive,
    });

    const statusText = isActive ? "เปิดการใช้งานบัญชี" : "ระงับการใช้งานบัญชี";
    return NextResponse.json({
      success: true,
      message: `${statusText} "${targetUser.firstname} ${targetUser.lastname}" สำเร็จ`,
      data: {
        id: targetUser.id,
        isActive,
      },
    });
  } catch (error: unknown) {
    console.error("UPDATE status error:", error);
    const message =
      error instanceof Error ? error.message : "เกิดข้อผิดพลาดในการเปลี่ยนสถานะบัญชี";
    return NextResponse.json(
      { success: false, message },
      { status: 500 }
    );
  }
}
