import { NextRequest, NextResponse } from "next/server";
import { SESSION_COOKIE_NAME, verifySessionToken } from "@/lib/auth/session";

/**
 * GET /api/auth/session
 * ตรวจสอบและดึงข้อมูลผู้ใช้งานจาก Session Cookie (HttpOnly)
 * เพื่อให้ Client Components เช่น Navbar, ProfileForm ดึงข้อมูล session ได้อย่างปลอดภัย
 */
export async function GET(req: NextRequest) {
  try {
    const sessionCookie = req.cookies.get(SESSION_COOKIE_NAME)?.value;

    if (!sessionCookie) {
      return NextResponse.json(
        {
          isLoggedIn: false,
          user: null,
          message: "ไม่มี Session หรือยังไม่ได้เข้าสู่ระบบ",
        },
        { status: 200 }
      );
    }

    const result = verifySessionToken(sessionCookie);

    if (!result.isValid || !result.payload) {
      return NextResponse.json(
        {
          isLoggedIn: false,
          user: null,
          error: result.error,
          message:
            result.error === "EXPIRED"
              ? "เซสชันหมดอายุ กรุณาเข้าสู่ระบบใหม่"
              : "เซสชันไม่ถูกต้อง",
        },
        { status: 200 }
      );
    }

    return NextResponse.json(
      {
        isLoggedIn: true,
        user: result.payload,
      },
      { status: 200 }
    );
  } catch (error: unknown) {
    console.error("GET /api/auth/session error:", error);
    return NextResponse.json(
      {
        isLoggedIn: false,
        user: null,
        error: "INTERNAL_ERROR",
        message: "เกิดข้อผิดพลาดในการตรวจสอบ Session",
      },
      { status: 500 }
    );
  }
}
