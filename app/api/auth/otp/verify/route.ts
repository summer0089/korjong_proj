import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { verifyOtpToken, createPasswordResetToken, OTP_COOKIE_NAME } from "@/lib/auth/otp";

const verifyOtpSchema = z.object({
  email: z
    .string()
    .trim()
    .min(1, "กรุณาระบุอีเมล")
    .pipe(z.email("รูปแบบอีเมลไม่ถูกต้อง")),
  otp: z
    .string()
    .trim()
    .length(6, "รหัส OTP ต้องมีความยาว 6 หลัก")
    .regex(/^\d{6}$/, "รหัส OTP ต้องเป็นตัวเลข 6 หลัก"),
  token: z.string().optional(),
});

// POST /api/auth/otp/verify - ตรวจสอบรหัส OTP (Stateless OTP via Crypto)
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    const validation = verifyOtpSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        {
          success: false,
          message: validation.error.issues[0]?.message || "ข้อมูลไม่ถูกต้อง",
        },
        { status: 400 }
      );
    }

    const { email, otp } = validation.data;
    const normalizedEmail = email.toLowerCase().trim();

    // ดึง token จาก Cookie, Header หรือ Body
    const token =
      req.cookies.get(OTP_COOKIE_NAME)?.value ||
      req.cookies.get("otp_token")?.value ||
      req.headers.get("x-otp-token") ||
      validation.data.token;

    if (!token) {
      return NextResponse.json(
        {
          success: false,
          message: "ไม่พบข้อมูล Token สำหรับยืนยัน OTP หรือรหัสหมดอายุแล้ว กรุณากดขอรหัส OTP ใหม่",
        },
        { status: 400 }
      );
    }

    // ตรวจสอบความถูกต้องและเวลาหมดอายุของ Stateless OTP Token
    const result = verifyOtpToken(normalizedEmail, otp, token);

    if (!result.isValid) {
      if (result.error === "EXPIRED") {
        return NextResponse.json(
          {
            success: false,
            message: "รหัส OTP หมดอายุแล้ว กรุณากดขอรหัส OTP ใหม่อีกครั้ง",
          },
          { status: 400 }
        );
      }

      return NextResponse.json(
        {
          success: false,
          message: "รหัส OTP ไม่ถูกต้อง กรุณาตรวจสอบอีกครั้ง",
        },
        { status: 400 }
      );
    }

    // สร้าง resetToken อายุ 15 นาที
    const resetToken = createPasswordResetToken(normalizedEmail, 15);

    // ยืนยันสำเร็จ เคลียร์ Cookie
    const response = NextResponse.json({
      success: true,
      message: "ยืนยันรหัส OTP สำเร็จ",
      resetToken,
    });

    response.cookies.delete(OTP_COOKIE_NAME);
    response.cookies.delete("otp_token");

    return response;
  } catch (error: unknown) {
    console.error("POST /api/auth/otp/verify error:", error);
    const message =
      error instanceof Error ? error.message : "เกิดข้อผิดพลาดในการตรวจสอบรหัส OTP";
    return NextResponse.json(
      {
        success: false,
        message,
      },
      { status: 500 }
    );
  }
}
