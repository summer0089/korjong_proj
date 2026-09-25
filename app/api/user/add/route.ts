import { NextRequest, NextResponse } from "next/server";
import { db } from "@/prisma/db";
import bcrypt from "bcryptjs";
import checkProtectedApi from "@/utils/helper/protected_api";

// POST /api/user/add - เพิ่มบัญชีผู้ใช้งานใหม่โดยผู้ดูแลระบบ (ADMIN)
export async function POST(req: NextRequest) {
  try {
    // 1. ตรวจสอบสิทธิ์ผู้ดูแลระบบ (ADMIN)
    const authResult = await checkProtectedApi(["ADMIN"]);
    if (authResult instanceof NextResponse) return authResult;

    const body = await req.json();

    const email = (body.email || "").trim().toLowerCase();
    const firstName = (body.firstName || body.firstname || "").trim();
    const lastName = (body.lastName || body.lastname || "").trim();
    const position = (body.positionName || body.position || "-").trim();
    const departmentId = (body.departmentId || "").trim();
    const telephone = (body.telephone || body.phoneNumber || "-").trim();
    const password = body.password;
    const rawRole = (body.role || "USER").trim().toUpperCase();
    const isActive = body.isActive !== false;

    // ตรวจสอบฟิลด์ที่จำเป็น
    if (!email) {
      return NextResponse.json(
        { success: false, message: "กรุณาระบุอีเมล" },
        { status: 400 }
      );
    }
    if (!firstName || !lastName) {
      return NextResponse.json(
        { success: false, message: "กรุณาระบุชื่อจริงและนามสกุล" },
        { status: 400 }
      );
    }
    if (!departmentId) {
      return NextResponse.json(
        { success: false, message: "กรุณาเลือกสังกัดหน่วยงาน" },
        { status: 400 }
      );
    }
    if (!password || password.length < 8) {
      return NextResponse.json(
        { success: false, message: "รหัสผ่านต้องมีความยาวอย่างน้อย 8 ตัวอักษร" },
        { status: 400 }
      );
    }

    // ตรวจสอบอีเมลซ้ำ
    const existing = await db.orm.public.Employee
      .where({ email })
      .first();

    if (existing) {
      return NextResponse.json(
        {
          success: false,
          message: "อีเมลนี้มีอยู่ในระบบแล้ว กรุณาใช้อีเมลอื่น",
        },
        { status: 409 }
      );
    }

    // ตรวจสอบหน่วยงาน
    const department = await db.orm.public.Department
      .where({ id: departmentId })
      .first();

    if (!department) {
      return NextResponse.json(
        { success: false, message: "ไม่พบข้อมูลหน่วยงานที่เลือก" },
        { status: 400 }
      );
    }

    // กำหนด Role ตาม enum
    let roleEnum: "ADMIN" | "APPROVER" | "USER" = db.enums.public.Roles.members.USER;
    if (rawRole === "ADMIN") {
      roleEnum = db.enums.public.Roles.members.ADMIN;
    } else if (rawRole === "APPROVER") {
      roleEnum = db.enums.public.Roles.members.APPROVER;
    }

    // Hash รหัสผ่าน
    const hashedPassword = await bcrypt.hash(password, 10);

    // บันทึกผู้ใช้ใหม่
    const newUser = await db.orm.public.Employee.create({
      firstname: firstName,
      lastname: lastName,
      email,
      password: hashedPassword,
      role: roleEnum,
      position,
      department: department.name,
      phoneNumber: telephone,
      isActive,
      departmentId: department.id,
    });

    return NextResponse.json(
      {
        success: true,
        message: `เพิ่มผู้ใช้งาน "${newUser.firstname} ${newUser.lastname}" สำเร็จ`,
        data: {
          id: newUser.id,
          name: `${newUser.firstname} ${newUser.lastname}`,
          email: newUser.email,
        },
      },
      { status: 201 }
    );
  } catch (error: unknown) {
    console.error("POST /api/user/add error:", error);
    const message =
      error instanceof Error ? error.message : "เกิดข้อผิดพลาดในการสร้างบัญชีผู้ใช้งาน";
    return NextResponse.json(
      { success: false, message },
      { status: 500 }
    );
  }
}
