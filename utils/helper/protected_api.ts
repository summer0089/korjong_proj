import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import {
  SESSION_COOKIE_NAME,
  verifySessionToken,
  EmployeeSessionPayload,
} from "@/utils/helper/auth_session";

/**
 * ผลลัพธ์จากการตรวจสอบสิทธิ์สำเร็จ
 */
export interface ProtectedApiSuccess {
  user: EmployeeSessionPayload;
}

/**
 * ตรวจสอบ session cookie และสิทธิ์ผู้ใช้งานสำหรับ API Route Handlers
 * - อ่าน session จาก cookie โดยตรง (ไม่ต้อง fetch)
 * - ถ้าผ่าน: คืนค่า { user } (EmployeeSessionPayload)
 * - ถ้าไม่ผ่าน: คืนค่า NextResponse (error)
 *
 * @example
 * const authResult = await checkProtectedApi(["ADMIN"]);
 * if (authResult instanceof NextResponse) return authResult;
 * const { user } = authResult;
 */
export default async function checkProtectedApi(
  roles?: string[]
): Promise<ProtectedApiSuccess | NextResponse> {
  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get(SESSION_COOKIE_NAME)?.value;

  // ตรวจสอบว่ามี session cookie หรือไม่
  if (!sessionCookie) {
    return NextResponse.json(
      { success: false, message: "คุณยังไม่ได้เข้าสู่ระบบ กรุณาเข้าสู่ระบบก่อน" },
      { status: 401 }
    );
  }

  // ตรวจสอบ token signature + หมดอายุ
  const result = verifySessionToken(sessionCookie);

  if (!result.isValid || !result.payload) {
    return NextResponse.json(
      {
        success: false,
        message:
          result.error === "EXPIRED"
            ? "เซสชันหมดอายุ กรุณาเข้าสู่ระบบใหม่"
            : "เซสชันไม่ถูกต้อง กรุณาเข้าสู่ระบบใหม่",
      },
      { status: 401 }
    );
  }

  // ตรวจสอบสิทธิ์ (roles)
  if (roles && roles.length > 0) {
    if (!roles.includes(result.payload.role)) {
      return NextResponse.json(
        { success: false, message: "คุณไม่มีสิทธิ์เข้าถึงหน้านี้" },
        { status: 403 }
      );
    }
  }

  return { user: result.payload };
}