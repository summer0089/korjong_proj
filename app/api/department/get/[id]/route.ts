import { NextRequest, NextResponse } from "next/server";
import { db } from "@/prisma/db";

interface RouteParams {
  params: Promise<{ id: string }>;
}

// GET department/get/[id] - API สำหรับดึงข้อมูลหน่วยงาน
export async function GET(req: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    if (!id) {
      return NextResponse.json(
        { success: false, message: "ไม่พบรหัสหน่วยงาน (ID)" },
        { status: 400 }
      );
    }

    // ค้นหาหน่วยงานตามรหัส
    const department = await db.orm.public.Department.first({ id });

    if (!department) {
      return NextResponse.json(
        { success: false, message: "ไม่พบข้อมูลหน่วยงาน" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: department,
    });
  } catch (error: unknown) {
    console.error("GET /api/department/get/[id] error:", error);
    const message =
      error instanceof Error ? error.message : "เกิดข้อผิดพลาดในการดึงข้อมูลหน่วยงาน";
    return NextResponse.json(
      { success: false, message, error: String(error) },
      { status: 500 }
    );
  }
}
