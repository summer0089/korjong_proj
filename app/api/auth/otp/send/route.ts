import { NextRequest, NextResponse } from "next/server";
import { db } from "@/prisma/db";
import { emailStepSchema } from "@/utils/validation/signup_form/schema";
import { sendOtpEmail } from "@/utils/helper/smtp_email";
import {
  generateOtpCode,
  createStatelessOtpToken,
  OTP_COOKIE_NAME,
} from "@/utils/helper/otp";

// POST /api/auth/otp/send - ส่งรหัส OTP ไปยังอีเมล (Stateless OTP via Crypto)
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    const validation = emailStepSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        {
          success: false,
          message: validation.error.issues[0]?.message || "อีเมลไม่ถูกต้อง",
        },
        { status: 400 }
      );
    }

    const email = validation.data.email.toLowerCase().trim();

    // ตรวจสอบว่ามีพนักงานที่มีอีเมลนี้แล้วหรือไม่
    const existingEmployee = await db.orm.public.Employee
      .where((employee) => employee.email.eq(email))
      .first();

    if (existingEmployee) {
      return NextResponse.json(
        {
          success: false,
          message: "อีเมลนี้ได้ลงทะเบียนไว้ในระบบแล้ว กรุณาเข้าสู่ระบบ",
        },
        { status: 409 }
      );
    }

    // สร้างรหัส OTP 6 หลัก และสร้าง Stateless Token ด้วย Crypto HMAC (หมดอายุใน 5 นาที)
    const otp = generateOtpCode(6);
    const token = createStatelessOtpToken(email, otp, 5);

    // Send email via SMTP
    try {
      await sendOtpEmail(email, otp);
    } catch (mailError) {
      console.error("Failed to send OTP email via SMTP:", mailError);
      return NextResponse.json(
        {
          success: false,
          message: "ไม่สามารถส่งอีเมลรหัส OTP ได้ กรุณาตรวจสอบการตั้งค่า SMTP หรือลองใหม่อีกครั้ง",
        },
        { status: 500 }
      );
    }

    // ส่ง Response พร้อมแนบ token ทั้งใน JSON และ HttpOnly Cookie
    const response = NextResponse.json({
      success: true,
      message: `ระบบได้ส่งรหัส OTP ไปยังอีเมล ${email} เรียบร้อยแล้ว`,
      token,
    });

    response.cookies.set(OTP_COOKIE_NAME, token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 5 * 60, // 5 นาที
      path: "/",
    });

    return response;
  } catch (error: unknown) {
    console.error("POST /api/auth/otp/send error:", error);
    const message =
      error instanceof Error ? error.message : "เกิดข้อผิดพลาดในการส่งรหัส OTP";
    return NextResponse.json(
      {
        success: false,
        message,
      },
      { status: 500 }
    );
  }
}
