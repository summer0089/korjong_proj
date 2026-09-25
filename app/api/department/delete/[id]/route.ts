import { NextRequest, NextResponse } from "next/server";
import { db } from "@/prisma/db";

interface RouteParams {
  params: Promise<{ id: string }>;
}

// DELETE department/delete/[id]/ - API สำหรับลบข้อมูลหน่วยงาน
export async function DELETE(req: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    if (!id) {
      return NextResponse.json(
        { success: false, message: "ไม่พบรหัสหน่วยงาน (ID)" },
        { status: 400 }
      );
    }

    // ตรวจสอบว่ามีข้อมูลหน่วยงานที่ต้องการลบหรือไม่
    const existing = await db.orm.public.Department.first({ id });
    if (!existing) {
      return NextResponse.json(
        { success: false, message: "ไม่พบข้อมูลหน่วยงานที่ต้องการลบ" },
        { status: 404 }
      );
    }

    // ตรวจสอบว่ามีผู้ใช้งานหรือพนักงานสังกัดอยู่หรือไม่
    const userInDept = await db.orm.public.Employee
      .where((employee) => employee.departmentId.eq(id))
      .first();

    if (userInDept) {
      return NextResponse.json(
        {
          success: false,
          message: "ไม่สามารถลบหน่วยงานนี้ได้ เนื่องจากมีผู้ใช้งานหรือพนักงานสังกัดอยู่",
        },
        { status: 400 }
      );
    }

    // ลบข้อมูลหน่วยงาน
    await db.orm.public.Department.where({ id }).delete();

    return NextResponse.json({
      success: true,
      message: `ลบหน่วยงาน "${existing.name}" สำเร็จ`,
    });
  } catch (error: unknown) {
    console.error("DELETE /api/department/delete/[id] error:", error);
    const message =
      error instanceof Error ? error.message : "เกิดข้อผิดพลาดในการลบหน่วยงาน";
    return NextResponse.json(
      { success: false, message, error: String(error) },
      { status: 500 }
    );
  }
}
