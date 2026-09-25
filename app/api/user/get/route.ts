import { NextRequest, NextResponse } from "next/server";
import { db } from "@/prisma/db";
import { checkAuth } from "@/lib/auth/guard";

// GET /api/user/get - ดึงข้อมูลผู้ใช้ทั้งหมด
export async function GET(req: NextRequest) {
  try {
    // 1. ตรวจสอบสิทธิ์ผู้ใช้งาน (เฉพาะ ADMIN)
    const authResult = await checkAuth(["ADMIN"]);
    if (authResult instanceof NextResponse) return authResult;

    // 2. ดึงข้อมูลหน่วยงานทั้งหมด
    const departments = await db.orm.public.Department.all();
    const deptMap: Record<string, string> = {};
    if (Array.isArray(departments)) {
      departments.forEach((dept: { id: string; name: string }) => {
        if (dept.id && dept.name) {
          deptMap[dept.id] = dept.name;
        }
      });
    }

    // 3. ดึงข้อมูลผู้ใช้ทั้งหมด
    const employees = await db.orm.public.Employee.all();

    if (!Array.isArray(employees)) {
      return NextResponse.json({
        success: true,
        data: [],
        total: 0,
      });
    }

    // 4. จัดรูปแบบข้อมูลผู้ใช้ (ใช้ชื่อ column ตาม Prisma schema)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const employees_data = employees.map((e: any) => ({
      id: e.id,
      name: `${e.firstname || ""} ${e.lastname || ""}`.trim() || "-",
      firstName: e.firstname || "",
      lastName: e.lastname || "",
      email: e.email,
      role: e.role || "USER",
      isActive: e.isActive !== undefined ? Boolean(e.isActive) : true,
      position: e.position || "-",
      phoneNumber: e.phoneNumber || "-",
      departmentId: e.departmentId || "",
      departmentName: e.departmentId ? deptMap[e.departmentId] || "-" : "-",
      image: e.profileImage || null,
      createdAt: e.createdAt,
      updatedAt: e.updatedAt,
    }));

    return NextResponse.json({
      success: true,
      data: employees_data,
      total: employees_data.length,
    });

  } catch (error: unknown) {
    console.error("GET /api/user/get error:", error);
    const message =
      error instanceof Error ? error.message : "เกิดข้อผิดพลาดในการดึงข้อมูลผู้ใช้งาน";
    return NextResponse.json(
      { success: false, message, error: String(error) },
      { status: 500 }
    );
  }
}
