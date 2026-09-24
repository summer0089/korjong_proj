import { NextResponse } from "next/server";
import { SESSION_COOKIE_NAME } from "@/utils/helper/auth_session";

// POST /api/auth/session/destroy - ทำลาย Session Cookie ทันที
export async function POST() {
  try {
    const response = NextResponse.json(
      {
        success: true,
        message: "ทำลาย Session เรียบร้อยแล้ว",
      },
      { status: 200 }
    );

    response.cookies.delete(SESSION_COOKIE_NAME);
    return response;
  } catch (error: unknown) {
    console.error("POST /api/auth/session/destroy error:", error);
    return NextResponse.json(
      {
        success: false,
        message: "เกิดข้อผิดพลาดในการทำลาย Session",
      },
      { status: 500 }
    );
  }
}
