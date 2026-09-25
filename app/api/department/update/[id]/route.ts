import { NextRequest, NextResponse } from "next/server";
import { db } from "@/prisma/db";
import { DepartmentSchema } from "@/utils/validation/department_form/schema";

interface RouteParams {
  params: Promise<{ id: string }>;
}

// PUT department/update/[id]/ - API สำหรับแก้ไขข้อมูลหน่วยงาน
export async function PUT(req: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    if (!id) {
      return NextResponse.json(
        { success: false, message: "ไม่พบรหัสหน่วยงาน (ID)" },
        { status: 400 }
      );
    }

    // ตรวจสอบว่ามีข้อมูลหน่วยงานที่ต้องการแก้ไขหรือไม่
    const existing = await db.orm.public.Department.first({ id });
    if (!existing) {
      return NextResponse.json(
        { success: false, message: "ไม่พบข้อมูลหน่วยงานที่ต้องการแก้ไข" },
        { status: 404 }
      );
    }

    const body = await req.json();
    const validation = DepartmentSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        {
          success: false,
          message: validation.error.issues[0]?.message || "ข้อมูลไม่ถูกต้อง",
          errors: validation.error.format(),
        },
        { status: 400 }
      );
    }

    const { name } = validation.data;
    const trimmedName = name.trim();

    // ตรวจสอบชื่อหน่วยงานซ้ำ
    const duplicate = await db.orm.public.Department
      .where((d) => d.name.eq(trimmedName))
      .where((d) => d.id.neq(id))
      .first();

    if (duplicate) {
      return NextResponse.json(
        { success: false, message: "มีหน่วยงานชื่อนี้อยู่ในระบบแล้ว" },
        { status: 409 }
      );
    }

    // แก้ไขข้อมูลหน่วยงาน
    const updated = await db.orm.public.Department
      .where({ id })
      .update({ name: trimmedName });

    return NextResponse.json({
      success: true,
      message: "แก้ไขข้อมูลหน่วยงานสำเร็จ",
      data: updated,
    });
  } catch (error: unknown) {
    console.error("PUT/POST /api/department/update/[id] error:", error);
    const message =
      error instanceof Error ? error.message : "เกิดข้อผิดพลาดในการแก้ไขหน่วยงาน";
    return NextResponse.json(
      { success: false, message, error: String(error) },
      { status: 500 }
    );
  }
}

