import { NextResponse } from "next/server";
import { db } from "@/prisma/db";

// GET department/get/ - API สำหรับดึงข้อมูลหน่วยงาน
export async function GET() {
  try {
    // ดึงข้อมูลหน่วยงานทั้งหมดเรียงตามวันที่สร้างล่าสุด
    const departments = await db.orm.public.Department
      .orderBy((record) => record.createdAt.asc())
      .all();

    return NextResponse.json({
      success: true,
      data: departments,
    });
  } catch (error: unknown) {
    console.error("GET /api/department/get error:", error);
    return NextResponse.json(
      { success: false, message: "ไม่สามารถดึงข้อมูลหน่วยงานได้" },
      { status: 500 }
    );
  }
}
