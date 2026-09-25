import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { db } from "@/prisma/db";
import checkProtectedApi from "@/utils/helper/protected_api";
import { verifyPasswordResetToken } from "@/utils/helper/otp";
import { ChangePasswordOwnerSchema } from "@/utils/validation/change_password_form/schema";
import { ChangePasswordApiSchema } from "@/utils/validation/forgot_password_form/schema";

// PUT /api/user/update/password - เปลี่ยนรหัสผ่าน (รองรับทั้งผู้ใช้ที่ล็อกอินแล้วและกรณีลืมรหัสผ่านผ่าน OTP)
export async function PUT(req: NextRequest) {
  try {
    const body = await req.json();

    // =========================================================================
    // กรณีที่ 1: การรีเซ็ตรหัสผ่านจากหน้าลืมรหัสผ่าน (Forgot Password via resetToken)
    // =========================================================================
    if (body.resetToken && body.email) {
      const validation = ChangePasswordApiSchema.safeParse(body);
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

      const { email, newPassword } = validation.data;
      const normalizedEmail = email.toLowerCase().trim();

      // ตรวจสอบความถูกต้องและวันหมดอายุของ resetToken
      const isTokenValid = verifyPasswordResetToken(normalizedEmail, body.resetToken);
      if (!isTokenValid) {
        return NextResponse.json(
          {
            success: false,
            message: "รหัสยืนยันการรีเซ็ตรหัสผ่านไม่ถูกต้องหรือหมดอายุแล้ว กรุณาขอรหัส OTP ใหม่",
          },
          { status: 400 }
        );
      }

      // ค้นหาข้อมูลพนักงานในระบบ
      const employee = await db.orm.public.Employee
        .where({ email: normalizedEmail })
        .first();

      if (!employee) {
        return NextResponse.json(
          {
            success: false,
            message: "ไม่พบข้อมูลผู้ใช้งานที่ใช้อีเมลนี้ในระบบ",
          },
          { status: 404 }
        );
      }

      if (!employee.isActive) {
        return NextResponse.json(
          {
            success: false,
            message: "บัญชีผู้ใช้นี้ถูกระงับการใช้งาน กรุณาติดต่อผู้ดูแลระบบ",
          },
          { status: 403 }
        );
      }

      // Hash รหัสผ่านใหม่และบันทึกลงฐานข้อมูล
      const hashedPassword = await bcrypt.hash(newPassword, 10);

      await db.orm.public.Employee
        .where({ id: employee.id })
        .update({ password: hashedPassword });

      return NextResponse.json({
        success: true,
        message: "เปลี่ยนรหัสผ่านใหม่สำเร็จเรียบร้อยแล้ว",
      });
    }

    // =========================================================================
    // กรณีที่ 2: การเปลี่ยนรหัสผ่านสำหรับผู้ใช้งานที่เข้าสู่ระบบแล้ว (Authenticated User)
    // =========================================================================
    const authResult = await checkProtectedApi(["ADMIN", "USER", "APPROVER"]);
    if (authResult instanceof NextResponse) return authResult;
    const { user: sessionUser } = authResult;

    const validation = ChangePasswordOwnerSchema.safeParse(body);
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

    const { currentPassword, newPassword } = validation.data;

    if (currentPassword === newPassword) {
      return NextResponse.json(
        {
          success: false,
          message: "รหัสผ่านใหม่ต้องไม่ตรงกับรหัสผ่านปัจจุบัน",
        },
        { status: 400 }
      );
    }

    const employee = await db.orm.public.Employee
      .where({ id: sessionUser.id })
      .first();

    if (!employee) {
      return NextResponse.json(
        {
          success: false,
          message: "ไม่พบข้อมูลผู้ใช้งาน",
        },
        { status: 404 }
      );
    }

    const isCurrentValid = await bcrypt.compare(currentPassword, employee.password);
    if (!isCurrentValid) {
      return NextResponse.json(
        {
          success: false,
          message: "รหัสผ่านปัจจุบันไม่ถูกต้อง กรุณาตรวจสอบอีกครั้ง",
        },
        { status: 400 }
      );
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);

    await db.orm.public.Employee
      .where({ id: employee.id })
      .update({ password: hashedPassword });

    return NextResponse.json({
      success: true,
      message: "เปลี่ยนรหัสผ่านสำเร็จเรียบร้อยแล้ว",
    });

  } catch (error: unknown) {
    console.error("PUT /api/user/update/password error:", error);
    const message =
      error instanceof Error ? error.message : "เกิดข้อผิดพลาดในการเปลี่ยนรหัสผ่าน";
    return NextResponse.json(
      {
        success: false,
        message,
      },
      { status: 500 }
    );
  }
}

// รองรับทั้ง PUT และ POST เพื่อความยืดหยุ่นในการเรียกใช้งาน
export const POST = PUT;
