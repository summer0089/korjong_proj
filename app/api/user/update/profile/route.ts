import { NextRequest, NextResponse } from "next/server";
import { db } from "@/prisma/db";
import checkProtectedApi from "@/utils/helper/protected_api";
import { EmployeeProfileSchema } from "@/utils/validation/profile_form/schema";
import {
  createSessionToken,
  getSessionCookieOptions,
  sanitizeEmployeePayload,
  SESSION_COOKIE_NAME,
} from "@/utils/helper/auth_session";

// PUT /api/user/update/profile - อัปเดตข้อมูลส่วนตัว
export async function PUT(req: NextRequest) {
  try {
    // 1. ตรวจสอบสิทธิ์ผู้ใช้งานจาก session cookie
    const authResult = await checkProtectedApi(["USER", "ADMIN", "APPROVER"]);
    if (authResult instanceof NextResponse) return authResult;
    const { user: sessionUser } = authResult;

    const body = await req.json();

    // 2. ตรวจสอบว่าผู้ใช้แก้ไขข้อมูลของตนเองเท่านั้น
    if (body.id && body.id !== sessionUser.id) {
      return NextResponse.json(
        {
          success: false,
          message: "คุณไม่มีสิทธิ์แก้ไขข้อมูลของผู้อื่น ผู้ใช้งานเจ้าของบัญชีเท่านั้นที่สามารถแก้ไขข้อมูลได้",
        },
        { status: 403 }
      );
    }

    // 3. เตรียมข้อมูลสำหรับ validation
    const payload = {
      ...body,
      telephone: body.telephone || body.phoneNumber,
      positionName: body.positionName || body.position,
    };

    const validation = EmployeeProfileSchema.safeParse(payload);
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

    const {
      firstName,
      lastName,
      telephone,
      positionName,
      departmentId,
      image,
    } = validation.data;

    // 4. ตรวจสอบว่าหน่วยงานที่เลือกมีอยู่จริงหรือไม่
    const department = await db.orm.public.Department
      .where({ id: departmentId })
      .first();

    if (!department) {
      return NextResponse.json(
        {
          success: false,
          message: "ไม่พบข้อมูลหน่วยงานที่เลือก",
        },
        { status: 400 }
      );
    }

    // 5. อัปเดตข้อมูลผู้ใช้ (ใช้ชื่อ column ตาม Prisma schema: firstname, lastname)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const updateData: Record<string, any> = {
      firstname: firstName.trim(),
      lastname: lastName.trim(),
      phoneNumber: telephone.trim(),
      position: positionName.trim(),
      departmentId: department.id,
    };

    if (image !== undefined) {
      updateData.profileImage = image;
    }

    const updatedEmployee = await db.orm.public.Employee
      .where({ id: sessionUser.id })
      .update(updateData);

    if (!updatedEmployee) {
      return NextResponse.json(
        { success: false, message: "ไม่พบข้อมูลผู้ใช้งานที่ต้องการอัปเดต" },
        { status: 404 }
      );
    }

    // 6. สร้าง session ใหม่ด้วยข้อมูลที่อัปเดตแล้ว (re-issue cookie ตรงๆ ไม่ต้อง fetch)
    const updatedPayload = sanitizeEmployeePayload({
      ...updatedEmployee,
      department: department.name,
    });

    const { token, maxAgeSeconds } = createSessionToken(updatedPayload);

    const response = NextResponse.json({
      success: true,
      message: "บันทึกข้อมูลส่วนตัวสำเร็จเรียบร้อยแล้ว",
      data: updatedPayload,
    });

    // Set updated session cookie directly on response
    response.cookies.set(
      SESSION_COOKIE_NAME,
      token,
      getSessionCookieOptions(maxAgeSeconds)
    );

    return response;

  } catch (error: unknown) {
    console.error("PUT /api/user/update/profile error:", error);
    const message =
      error instanceof Error ? error.message : "เกิดข้อผิดพลาดในการบันทึกข้อมูล";
    return NextResponse.json(
      {
        success: false,
        message,
      },
      { status: 500 }
    );
  }
}
