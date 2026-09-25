/**
 * @module lib/auth/guard
 * @description ป้องกัน API Route — ตรวจสอบ session cookie + สิทธิ์ (roles) ก่อนเข้าถึง
 *
 * @example
 * import { checkAuth } from "@/lib/auth/guard";
 *
 * export async function GET() {
 *   const auth = await checkAuth(["ADMIN"]);
 *   if (auth instanceof NextResponse) return auth;  // 401 / 403
 *   const { user } = auth;
 *   // ... ทำงานต่อ
 * }
 */

import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import {
  SESSION_COOKIE_NAME,
  verifySessionToken,
  type EmployeeSessionPayload,
} from "@/lib/auth/session";

// ──────────────────────────────────────────────
// Types
// ──────────────────────────────────────────────

/** ผลลัพธ์เมื่อ auth สำเร็จ */
export interface AuthSuccess {
  user: EmployeeSessionPayload;
}

// ──────────────────────────────────────────────
// Public API
// ──────────────────────────────────────────────

/**
 * ตรวจสอบ session + สิทธิ์ผู้ใช้สำหรับ API Route Handler
 *
 * - อ่าน session จาก cookie โดยตรง (server-side, ไม่ fetch)
 * - ถ้าผ่าน: คืน `{ user }` (EmployeeSessionPayload)
 * - ถ้าไม่ผ่าน: คืน `NextResponse` พร้อม error (401/403)
 *
 * @param roles - array ของ role ที่อนุญาต เช่น ["ADMIN"] (ถ้าไม่ระบุ = อนุญาตทุก role)
 * @returns `AuthSuccess` หรือ `NextResponse` (error)
 *
 * @example
 * // อนุญาตทุก role
 * const auth = await checkAuth();
 *
 * // อนุญาตเฉพาะ ADMIN
 * const auth = await checkAuth(["ADMIN"]);
 *
 * // อนุญาต ADMIN และ APPROVER
 * const auth = await checkAuth(["ADMIN", "APPROVER"]);
 *
 * // ตรวจสอบผลลัพธ์
 * if (auth instanceof NextResponse) return auth;
 * const { user } = auth;
 */
export async function checkAuth(roles?: string[]): Promise<AuthSuccess | NextResponse> {
  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get(SESSION_COOKIE_NAME)?.value;

  // ไม่มี session cookie
  if (!sessionCookie) {
    return NextResponse.json(
      { success: false, message: "คุณยังไม่ได้เข้าสู่ระบบ กรุณาเข้าสู่ระบบก่อน" },
      { status: 401 },
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
      { status: 401 },
    );
  }

  // ตรวจสอบ role (ถ้าระบุ)
  if (roles && roles.length > 0) {
    if (!roles.includes(result.payload.role)) {
      return NextResponse.json(
        { success: false, message: "คุณไม่มีสิทธิ์เข้าถึงหน้านี้" },
        { status: 403 },
      );
    }
  }

  return { user: result.payload };
}
