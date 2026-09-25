import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { db } from "@/prisma/db";
import { SigninSchema } from "@/utils/validation/signin_form/schema";
import {
  createSessionToken,
  getSessionCookieOptions,
  sanitizeEmployeePayload,
  SESSION_COOKIE_NAME,
} from "@/lib/auth/session";

// POST /api/auth/signin - เข้าสู่ระบบและบันทึก Session Cookie
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    const validation = SigninSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        {
          success: false,
          message: validation.error.issues[0]?.message || "ข้อมูลที่ส่งมาไม่ถูกต้อง",
          errors: validation.error.format(),
        },
        { status: 400 }
      );
    }

    const { email, password, rememberMe } = validation.data;
    const normalizedEmail = email.toLowerCase().trim();

    // 1. ค้นหาข้อมูล Employee จากฐานข้อมูล
    const employee = await db.orm.public.Employee
      .where({ email: normalizedEmail })
      .first();

    if (!employee) {
      return NextResponse.json(
        {
          success: false,
          message: "อีเมลหรือรหัสผ่านไม่ถูกต้อง",
        },
        { status: 401 }
      );
    }

    // 2. ตรวจสอบรหัสผ่านด้วย bcrypt
    const isPasswordValid = await bcrypt.compare(password, employee.password);
    if (!isPasswordValid) {
      return NextResponse.json(
        {
          success: false,
          message: "อีเมลหรือรหัสผ่านไม่ถูกต้อง",
        },
        { status: 401 }
      );
    }

    // 3. ตรวจสอบสถานะการใช้งานบัญชี (isActive)
    if (!employee.isActive) {
      return NextResponse.json(
        {
          success: false,
          message: "บัญชีผู้ใช้นี้ถูกระงับการใช้งาน กรุณาติดต่อผู้ดูแลระบบ",
        },
        { status: 403 }
      );
    }

    // 4. เตรียมข้อมูล Employee ทั้งหมดสำหรับบันทึกลง Session Cookie (ไม่รวม password)
    const userPayload = sanitizeEmployeePayload(employee);

    // 5. สร้าง Signed Session Token
    const { token, maxAgeSeconds } = createSessionToken(userPayload, Boolean(rememberMe));

    // 6. ตั้งค่า HttpOnly Cookie ลงใน NextResponse
    const response = NextResponse.json(
      {
        success: true,
        message: "เข้าสู่ระบบสำเร็จ",
        user: userPayload,
      },
      { status: 200 }
    );

    response.cookies.set(
      SESSION_COOKIE_NAME,
      token,
      getSessionCookieOptions(maxAgeSeconds)
    );

    return response;
  } catch (error: unknown) {
    console.error("POST /api/auth/signin error:", error);
    const message =
      error instanceof Error ? error.message : "เกิดข้อผิดพลาดในการเข้าสู่ระบบ";
    return NextResponse.json(
      {
        success: false,
        message,
      },
      { status: 500 }
    );
  }
}
