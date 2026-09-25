import { NextResponse } from "next/server";
import { SESSION_COOKIE_NAME } from "@/lib/auth/session";

// POST /api/auth/signout - ออกจากระบบและลบ Session Cookie
export async function POST() {
  try {
    const response = NextResponse.json(
      {
        success: true,
        message: "ออกจากระบบสำเร็จ",
      },
      { status: 200 }
    );

    response.cookies.delete(SESSION_COOKIE_NAME);

    return response;
  } catch (error: unknown) {
    console.error("POST /api/auth/signout error:", error);
    return NextResponse.json(
      {
        success: false,
        message: "เกิดข้อผิดพลาดในการออกจากระบบ",
      },
      { status: 500 }
    );
  }
}
