import { NextRequest, NextResponse } from "next/server";
import { db } from "@/prisma/db";
import checkProtectedApi from "@/utils/helper/protected_api";

interface RouteParams {
  params: Promise<{ id: string }>;
}

// GET /api/user/get/[id] - ดึงข้อมูลผู้ใช้จาก id
export async function GET(req: NextRequest, { params }: RouteParams) {
  try {
    // 1. ตรวจสอบสิทธิ์ผู้ใช้งาน
    const authResult = await checkProtectedApi(["ADMIN", "USER", "APPROVER"]);
    if (authResult instanceof NextResponse) return authResult;
    const { user: sessionUser } = authResult;

    // 2. ดึง id จาก URL parameter
    const { id } = await params;
    if (!id) {
      return NextResponse.json(
        { success: false, message: "ไม่พบรหัสผู้ใช้งาน (ID)" },
        { status: 400 }
      );
    }

    // 3. ป้องกัน: ผู้ใช้ทั่วไปดูได้เฉพาะข้อมูลตนเอง, ADMIN ดูได้ทุกคน
    if (sessionUser.role !== "ADMIN" && sessionUser.id !== id) {
      return NextResponse.json(
        { success: false, message: "คุณไม่มีสิทธิ์เข้าถึงข้อมูลของผู้ใช้รายนี้" },
        { status: 403 }
      );
    }

    // 4. ค้นหาข้อมูลพนักงานจาก ID
    const employee = await db.orm.public.Employee
      .where({ id })
      .first();

    if (!employee) {
      return NextResponse.json(
        { success: false, message: "ไม่พบข้อมูลผู้ใช้งาน" },
        { status: 404 }
      );
    }

    // 5. ดึงชื่อหน่วยงาน
    let departmentName = "";
    if (employee.departmentId) {
      const department = await db.orm.public.Department
        .where({ id: employee.departmentId })
        .first();
      if (department) departmentName = department.name;
    }

    return NextResponse.json({
      success: true,
      data: {
        id: employee.id,
        firstName: employee.firstname,
        lastName: employee.lastname,
        email: employee.email,
        role: employee.role,
        position: employee.position,
        phoneNumber: employee.phoneNumber,
        departmentId: employee.departmentId,
        departmentName,
        image: employee.profileImage || null,
      },
    });

  } catch (error: unknown) {
    console.error("GET /api/user/get/[id] error:", error);
    return NextResponse.json(
      {
        success: false,
        message: "เกิดข้อผิดพลาดในการดึงข้อมูลส่วนตัว",
      },
      { status: 500 }
    );
  }
}
