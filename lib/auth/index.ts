/**
 * @module lib/auth
 * @description Barrel export สำหรับระบบ Auth ทั้งหมด
 *
 * สามารถ import แบบรวมได้เลย:
 * @example
 * import { checkAuth, createSessionToken, generateOtpCode } from "@/lib/auth";
 *
 * หรือ import แยกตาม module:
 * @example
 * import { createSessionToken } from "@/lib/auth/session";
 * import { generateOtpCode } from "@/lib/auth/otp";
 * import { checkAuth } from "@/lib/auth/guard";
 */

// Session — สร้าง/ตรวจสอบ/ลบ Session Token + Cookie
export {
  SESSION_COOKIE_NAME,
  sanitizeEmployeePayload,
  createSessionToken,
  verifySessionToken,
  getSessionCookieOptions,
  type EmployeeSessionPayload,
  type VerifySessionResult,
} from "./session";

// OTP — สร้าง/ตรวจสอบ OTP + Password Reset Token
export {
  OTP_COOKIE_NAME,
  generateOtpCode,
  createOtpToken,
  verifyOtpToken,
  createPasswordResetToken,
  verifyPasswordResetToken,
  type OtpVerificationError,
  type VerifyOtpResult,
} from "./otp";

// Guard — ป้องกัน API Route ด้วย session + role check
export {
  checkAuth,
  type AuthSuccess,
} from "./guard";
