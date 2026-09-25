/**
 * @module lib/auth/otp
 * @description จัดการ OTP แบบ Stateless ด้วย HMAC-SHA256 (ไม่ต้องเก็บใน DB)
 *
 * ฟีเจอร์หลัก:
 *  - สุ่มรหัส OTP (generateOtpCode)
 *  - สร้าง/ตรวจสอบ Stateless OTP Token (createOtpToken / verifyOtpToken)
 *  - สร้าง/ตรวจสอบ Password Reset Token (createPasswordResetToken / verifyPasswordResetToken)
 *
 * @example
 * import { generateOtpCode, createOtpToken, verifyOtpToken } from "@/lib/auth/otp";
 *
 * const code = generateOtpCode();           // "482951"
 * const token = createOtpToken(email, code); // signed token
 * const result = verifyOtpToken(email, code, token);
 * if (result.isValid) { ... }
 */

import crypto from "crypto";

// ──────────────────────────────────────────────
// Constants
// ──────────────────────────────────────────────

/** ชื่อ Cookie สำหรับเก็บ OTP Token */
export const OTP_COOKIE_NAME = "korjong_otp_token";

/** Secret key สำหรับ OTP — ต้องตั้งค่าใน .env */
const OTP_SECRET = process.env.OTP_SECRET || "korjong-stateless-otp-secret-key-32chars!";

// ──────────────────────────────────────────────
// Types
// ──────────────────────────────────────────────

/** ประเภทข้อผิดพลาดจากการตรวจสอบ OTP */
export type OtpVerificationError = "EXPIRED" | "INVALID" | "MALFORMED";

/** ผลลัพธ์จากการตรวจสอบ OTP Token */
export interface VerifyOtpResult {
  isValid: boolean;
  error?: OtpVerificationError;
}

// ──────────────────────────────────────────────
// OTP Code Generation
// ──────────────────────────────────────────────

/**
 * สุ่มรหัส OTP ตัวเลขตามจำนวนหลักที่ระบุ
 *
 * @param digits - จำนวนหลัก (ค่าเริ่มต้น 6)
 * @returns รหัส OTP เป็น string เช่น "482951"
 *
 * @example
 * const code = generateOtpCode();   // "482951"
 * const code4 = generateOtpCode(4); // "7321"
 */
export function generateOtpCode(digits = 6): string {
  const min = Math.pow(10, digits - 1);
  const max = Math.pow(10, digits) - 1;
  return Math.floor(min + Math.random() * (max - min + 1)).toString();
}

// ──────────────────────────────────────────────
// Stateless OTP Token (Create / Verify)
// ──────────────────────────────────────────────

/**
 * สร้าง Stateless OTP Token (HMAC-SHA256)
 * ข้อมูลที่ sign: email + otp + expiresAt → Format: `{expiresAt}.{signature}`
 *
 * @param email - อีเมลผู้ใช้
 * @param otp - รหัส OTP ที่สร้างจาก generateOtpCode()
 * @param expiresInMinutes - อายุ OTP เป็นนาที (ค่าเริ่มต้น 5)
 * @returns token string สำหรับเก็บใน cookie
 */
export function createOtpToken(email: string, otp: string, expiresInMinutes = 5): string {
  const normalizedEmail = email.toLowerCase().trim();
  const expiresAt = Date.now() + expiresInMinutes * 60 * 1000;
  const payload = `${normalizedEmail}:${otp}:${expiresAt}`;

  const signature = crypto
    .createHmac("sha256", OTP_SECRET)
    .update(payload)
    .digest("hex");

  return `${expiresAt}.${signature}`;
}

/**
 * ตรวจสอบ Stateless OTP Token
 *
 * @param email - อีเมลผู้ใช้
 * @param otp - รหัส OTP ที่ผู้ใช้กรอก
 * @param token - token ที่ได้จาก createOtpToken()
 * @returns ผลลัพธ์: isValid + error code (ถ้าไม่ผ่าน)
 *
 * @example
 * const result = verifyOtpToken("user@example.com", "482951", tokenFromCookie);
 * if (result.isValid) { // OTP ถูกต้อง }
 * if (result.error === "EXPIRED") { // หมดอายุ }
 */
export function verifyOtpToken(email: string, otp: string, token: string): VerifyOtpResult {
  if (!token || typeof token !== "string") {
    return { isValid: false, error: "MALFORMED" };
  }

  const parts = token.split(".");
  if (parts.length !== 2) {
    return { isValid: false, error: "MALFORMED" };
  }

  const [expiresAtStr, signature] = parts;
  const expiresAt = parseInt(expiresAtStr, 10);

  if (isNaN(expiresAt)) {
    return { isValid: false, error: "MALFORMED" };
  }

  // ตรวจสอบวันหมดอายุ
  if (Date.now() > expiresAt) {
    return { isValid: false, error: "EXPIRED" };
  }

  // คำนวณ HMAC แล้วเทียบ (timing-safe)
  const normalizedEmail = email.toLowerCase().trim();
  const payload = `${normalizedEmail}:${otp.trim()}:${expiresAt}`;
  const expectedSignature = crypto
    .createHmac("sha256", OTP_SECRET)
    .update(payload)
    .digest("hex");

  try {
    const sigBuffer = Buffer.from(signature, "hex");
    const expectedBuffer = Buffer.from(expectedSignature, "hex");
    if (
      sigBuffer.length !== expectedBuffer.length ||
      !crypto.timingSafeEqual(sigBuffer, expectedBuffer)
    ) {
      return { isValid: false, error: "INVALID" };
    }
    return { isValid: true };
  } catch {
    return { isValid: false, error: "INVALID" };
  }
}

// ──────────────────────────────────────────────
// Password Reset Token (Create / Verify)
// ──────────────────────────────────────────────

/**
 * สร้าง Password Reset Token หลังผ่าน OTP แล้ว
 * — ใช้สำหรับ flow ลืมรหัสผ่าน
 *
 * @param email - อีเมลผู้ใช้
 * @param expiresInMinutes - อายุ token เป็นนาที (ค่าเริ่มต้น 15)
 * @returns token string
 */
export function createPasswordResetToken(email: string, expiresInMinutes = 15): string {
  const normalizedEmail = email.toLowerCase().trim();
  const expiresAt = Date.now() + expiresInMinutes * 60 * 1000;
  const payload = `reset:${normalizedEmail}:${expiresAt}`;

  const signature = crypto
    .createHmac("sha256", OTP_SECRET)
    .update(payload)
    .digest("hex");

  return `${expiresAt}.${signature}`;
}

/**
 * ตรวจสอบ Password Reset Token
 *
 * @param email - อีเมลผู้ใช้
 * @param token - token ที่ได้จาก createPasswordResetToken()
 * @returns true ถ้า token ถูกต้องและยังไม่หมดอายุ
 *
 * @example
 * if (!verifyPasswordResetToken(email, resetToken)) {
 *   return NextResponse.json({ message: "Token หมดอายุ" }, { status: 400 });
 * }
 */
export function verifyPasswordResetToken(email: string, token: string): boolean {
  if (!token || typeof token !== "string") return false;

  const parts = token.split(".");
  if (parts.length !== 2) return false;

  const [expiresAtStr, signature] = parts;
  const expiresAt = parseInt(expiresAtStr, 10);
  if (isNaN(expiresAt) || Date.now() > expiresAt) return false;

  const normalizedEmail = email.toLowerCase().trim();
  const payload = `reset:${normalizedEmail}:${expiresAt}`;
  const expectedSignature = crypto
    .createHmac("sha256", OTP_SECRET)
    .update(payload)
    .digest("hex");

  try {
    const sigBuffer = Buffer.from(signature, "hex");
    const expectedBuffer = Buffer.from(expectedSignature, "hex");
    if (sigBuffer.length !== expectedBuffer.length) return false;
    return crypto.timingSafeEqual(sigBuffer, expectedBuffer);
  } catch {
    return false;
  }
}
