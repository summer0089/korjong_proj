import { NextRequest, NextResponse } from "next/server";
import {
  createSessionToken,
  getSessionCookieOptions,
  sanitizeEmployeePayload,
  SESSION_COOKIE_NAME,
  EmployeeSessionPayload,
} from "@/utils/helper/auth_session";

// POST /api/auth/session/set - บันทึกหรืออัปเดตข้อมูล Session ลงใน Cookie
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { user, rememberMe } = body as {
      user: Partial<EmployeeSessionPayload>;
      rememberMe?: boolean;
    };

    if (!user || !user.id || !user.email) {
      return NextResponse.json(
        {
          success: false,
          message: "ข้อมูลผู้ใช้ไม่ครบถ้วน (ต้องการ id และ email)",
        },
        { status: 400 }
      );
    }

    const sanitizedPayload = sanitizeEmployeePayload(user);
    const { token, maxAgeSeconds } = createSessionToken(
      sanitizedPayload,
      Boolean(rememberMe)
    );

    const response = NextResponse.json(
      {
        success: true,
        message: "บันทึก Session สำเร็จ",
        user: sanitizedPayload,
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
    console.error("POST /api/auth/session/set error:", error);
    return NextResponse.json(
      {
        success: false,
        message: "เกิดข้อผิดพลาดในการบันทึก Session",
      },
      { status: 500 }
    );
  }
}
