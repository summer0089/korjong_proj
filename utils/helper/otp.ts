import crypto from "crypto";

export const OTP_COOKIE_NAME = "korjong_otp_token";

const OTP_SECRET = process.env.OTP_SECRET || "korjong-stateless-otp-secret-key-32chars!";

export type OtpVerificationError = "EXPIRED" | "INVALID" | "MALFORMED";

export interface VerifyOtpResult {
  isValid: boolean;
  error?: OtpVerificationError;
}

/**
 * สุ่มรหัส OTP ตัวเลขตามจำนวนหลักที่ระบุ (ค่าเริ่มต้น 6 หลัก)
 * @param digits - จำนวนหลักของ OTP (ค่าเริ่มต้น 6)
 */
export function generateOtpCode(digits = 6): string {
  const min = Math.pow(10, digits - 1);
  const max = Math.pow(10, digits) - 1;
  return Math.floor(min + Math.random() * (max - min + 1)).toString();
}

/**
 * สร้าง Stateless OTP Token โดยใช้ HMAC-SHA256
 * ข้อมูลที่ใช้ sign: email, otp, expiresAt
 * Format: `${expiresAt}.${signature}`
 *
 * @param email - อีเมลของผู้ใช้งาน
 * @param otp - รหัส OTP 6 หลัก
 * @param expiresInMinutes - อายุของ OTP (ค่าเริ่มต้น 5 นาที)
 */
export function createStatelessOtpToken(
  email: string,
  otp: string,
  expiresInMinutes = 5
): string {
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
 * ตรวจสอบความถูกต้องของ Stateless OTP Token
 *
 * @param email - อีเมลของผู้ใช้งาน
 * @param otp - รหัส OTP ที่ผู้ใช้กรอก
 * @param token - Stateless OTP token
 */
export function verifyStatelessOtpToken(
  email: string,
  otp: string,
  token: string
): VerifyOtpResult {
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

  // ตรวจสอบเวลาหมดอายุ (5 นาที)
  if (Date.now() > expiresAt) {
    return { isValid: false, error: "EXPIRED" };
  }

  // คำนวณ HMAC เพื่อตรวจสอบความถูกต้อง
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

/**
 * สร้าง Password Reset Token สำหรับยืนยันการเปลี่ยนรหัสผ่านหลังตรวจ OTP ผ่านแล้ว (อายุ 15 นาที)
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
 * ตรวจสอบความถูกต้องและวันหมดอายุของ Password Reset Token
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
