import { NextRequest, NextResponse } from "next/server";
import { db } from "@/prisma/db";
import bcrypt from "bcryptjs";
import { checkAuth } from "@/lib/auth/guard";

interface RouteParams {
  params: Promise<{ id: string }>;
}

// PUT /api/user/update/[id] - แก้ไขข้อมูลผู้ใช้งานโดยผู้ดูแลระบบ (ADMIN)
export async function PUT(req: NextRequest, { params }: RouteParams) {
  try {
    const authResult = await checkAuth(["ADMIN"]);
    if (authResult instanceof NextResponse) return authResult;

    const { id } = await params;
    if (!id) {
      return NextResponse.json(
        { success: false, message: "กรุณาระบุรหัสผู้ใช้งาน (ID)" },
        { status: 400 }
      );
    }

    const existing = await db.orm.public.Employee.where({ id }).first();
    if (!existing) {
      return NextResponse.json(
        { success: false, message: "ไม่พบข้อมูลผู้ใช้งานที่ต้องการแก้ไข" },
        { status: 404 }
      );
    }

    const body = await req.json();

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const updateData: Record<string, any> = {};

    // 1. Email
    if (body.email) {
      const email = body.email.trim().toLowerCase();
      if (email !== existing.email) {
        // ตรวจสอบว่ามีผู้ใช้อื่นใช้อีเมลนี้แล้วหรือไม่
        const duplicate = await db.orm.public.Employee.where({ email }).first();
        if (duplicate && duplicate.id !== id) {
          return NextResponse.json(
            { success: false, message: "อีเมลนี้มีผู้ใช้งานอื่นในระบบใช้งานแล้ว" },
            { status: 409 }
          );
        }
        updateData.email = email;
      }
    }

    // 2. Names
    if (body.firstName !== undefined || body.firstname !== undefined) {
      updateData.firstname = (body.firstName || body.firstname || "").trim();
    }
    if (body.lastName !== undefined || body.lastname !== undefined) {
      updateData.lastname = (body.lastName || body.lastname || "").trim();
    }

    // 3. Position & Phone
    if (body.positionName !== undefined || body.position !== undefined) {
      updateData.position = (body.positionName || body.position || "-").trim();
    }
    if (body.telephone !== undefined || body.phoneNumber !== undefined) {
      updateData.phoneNumber = (body.telephone || body.phoneNumber || "-").trim();
    }

    // 4. Department
    if (body.departmentId) {
      const dept = await db.orm.public.Department.where({ id: body.departmentId }).first();
      if (!dept) {
        return NextResponse.json(
          { success: false, message: "ไม่พบข้อมูลสังกัดหน่วยงานที่เลือก" },
          { status: 400 }
        );
      }
      updateData.departmentId = dept.id;
      updateData.department = dept.name;
    }

    // 5. Role
    if (body.role) {
      const r = body.role.trim().toUpperCase();
      if (r === "ADMIN") {
        updateData.role = db.enums.public.Roles.members.ADMIN;
      } else if (r === "APPROVER") {
        updateData.role = db.enums.public.Roles.members.APPROVER;
      } else {
        updateData.role = db.enums.public.Roles.members.USER;
      }
    }

    // 6. Password (Optional)
    if (body.password && typeof body.password === "string" && body.password.trim()) {
      const pass = body.password.trim();
      if (pass.length < 8) {
        return NextResponse.json(
          { success: false, message: "รหัสผ่านใหม่ต้องมีความยาวอย่างน้อย 8 ตัวอักษร" },
          { status: 400 }
        );
      }
      updateData.password = await bcrypt.hash(pass, 10);
    }

    // 7. ทำการอัปเดต
    const updated = await db.orm.public.Employee.where({ id }).update(updateData);
    if (!updated) {
      return NextResponse.json(
        { success: false, message: "ไม่สามารถบันทึกข้อมูลผู้ใช้งานได้" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: `แก้ไขข้อมูลผู้ใช้งาน "${updateData.firstname || existing.firstname} ${updateData.lastname || existing.lastname}" เรียบร้อยแล้ว`,
      data: {
        id,
      },
    });
  } catch (error: unknown) {
    console.error("PUT /api/user/update/[id] error:", error);
    const message =
      error instanceof Error ? error.message : "เกิดข้อผิดพลาดในการแก้ไขข้อมูลผู้ใช้งาน";
    return NextResponse.json(
      { success: false, message },
      { status: 500 }
    );
  }
}
