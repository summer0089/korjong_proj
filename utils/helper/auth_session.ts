import crypto from "crypto";

export const SESSION_COOKIE_NAME = "korjong_session";

const AUTH_SECRET =
  process.env.AUTH_SECRET ||
  process.env.BETTER_AUTH_SECRET ||
  process.env.OTP_SECRET ||
  "korjong_session_super_secret_auth_key_2026_default_key";

/**
 * โครงสร้างข้อมูล Employee ทั้งหมดที่บันทึกลงใน Session Cookie (ไม่รวมรหัสผ่าน)
 */
export interface EmployeeSessionPayload {
  id: string;
  email: string;
  firstname: string;
  lastname: string;
  position: string;
  department: string;
  departmentId: string;
  phoneNumber: string;
  profileImage: string | null;
  role: "ADMIN" | "APPROVER" | "USER" | string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

interface TokenEnvelope {
  data: EmployeeSessionPayload;
  exp: number; // timestamp ms
  iat: number; // timestamp ms
}

/**
 * แปลงข้อมูลจากฐานข้อมูล Employee ให้เป็น EmployeeSessionPayload ที่ปลอดภัยและไม่มี password
 */
export function sanitizeEmployeePayload(employee: Record<string, any>): EmployeeSessionPayload {
  return {
    id: String(employee.id ?? ""),
    email: String(employee.email ?? "").toLowerCase().trim(),
    firstname: String(employee.firstname ?? ""),
    lastname: String(employee.lastname ?? ""),
    position: String(employee.position ?? ""),
    department: String(employee.department ?? ""),
    departmentId: String(employee.departmentId ?? ""),
    phoneNumber: String(employee.phoneNumber ?? ""),
    profileImage: employee.profileImage ? String(employee.profileImage) : null,
    role: String(employee.role ?? "USER"),
    isActive: Boolean(employee.isActive),
    createdAt: employee.createdAt instanceof Date ? employee.createdAt.toISOString() : String(employee.createdAt ?? ""),
    updatedAt: employee.updatedAt instanceof Date ? employee.updatedAt.toISOString() : String(employee.updatedAt ?? ""),
  };
}

/**
 * เข้ารหัส base64url ตามมาตรฐาน JWT
 */
function base64UrlEncode(str: string): string {
  return Buffer.from(str)
    .toString("base64")
    .replace(/=/g, "")
    .replace(/\+/g, "-")
    .replace(/\//g, "_");
}

/**
 * ถอดรหัส base64url ตามมาตรฐาน JWT
 */
function base64UrlDecode(str: string): string {
  let base64 = str.replace(/-/g, "+").replace(/_/g, "/");
  while (base64.length % 4) {
    base64 += "=";
  }
  return Buffer.from(base64, "base64").toString("utf-8");
}

/**
 * สร้าง Signed Session Token ที่บรรจุข้อมูลทั้งหมดของ Employee
 * @param payload ข้อมูล Employee
 * @param rememberMe ตัวเลือกว่าจะจำการเข้าใช้งาน 30 วัน หรือ 7 วัน
 */
export function createSessionToken(
  payload: EmployeeSessionPayload,
  rememberMe: boolean = false
): { token: string; maxAgeSeconds: number; expiresAt: Date } {
  const iat = Date.now();
  // 30 วัน เมื่อเลือก rememberMe หรือ 7 วัน เมื่อไม่ได้เลือก
  const maxAgeDays = rememberMe ? 30 : 7;
  const maxAgeSeconds = maxAgeDays * 24 * 60 * 60;
  const exp = iat + maxAgeSeconds * 1000;

  const envelope: TokenEnvelope = {
    data: payload,
    exp,
    iat,
  };

  const encodedPayload = base64UrlEncode(JSON.stringify(envelope));
  const signature = crypto
    .createHmac("sha256", AUTH_SECRET)
    .update(encodedPayload)
    .digest("base64url");

  const token = `${encodedPayload}.${signature}`;

  return {
    token,
    maxAgeSeconds,
    expiresAt: new Date(exp),
  };
}

export interface VerifySessionResult {
  isValid: boolean;
  payload?: EmployeeSessionPayload;
  error?: "EXPIRED" | "INVALID" | "MALFORMED" | "MISSING";
}

/**
 * ตรวจสอบความถูกต้องและถอดรหัส Session Token
 * @param token ค่า Session Token จาก Cookie
 */
export function verifySessionToken(token?: string | null): VerifySessionResult {
  if (!token || typeof token !== "string") {
    return { isValid: false, error: "MISSING" };
  }

  const parts = token.split(".");
  if (parts.length !== 2) {
    return { isValid: false, error: "MALFORMED" };
  }

  const [encodedPayload, signature] = parts;

  // ตรวจสอบ Signature ด้วย HMAC-SHA256
  const expectedSignature = crypto
    .createHmac("sha256", AUTH_SECRET)
    .update(encodedPayload)
    .digest("base64url");

  try {
    const sigBuffer = Buffer.from(signature);
    const expectedBuffer = Buffer.from(expectedSignature);

    if (
      sigBuffer.length !== expectedBuffer.length ||
      !crypto.timingSafeEqual(sigBuffer, expectedBuffer)
    ) {
      return { isValid: false, error: "INVALID" };
    }
  } catch {
    return { isValid: false, error: "INVALID" };
  }

  // ถอดรหัส JSON Payload
  try {
    const jsonStr = base64UrlDecode(encodedPayload);
    const envelope = JSON.parse(jsonStr) as TokenEnvelope;

    if (!envelope || !envelope.exp || !envelope.data) {
      return { isValid: false, error: "MALFORMED" };
    }

    // ตรวจสอบวันหมดอายุ
    if (Date.now() > envelope.exp) {
      return { isValid: false, error: "EXPIRED" };
    }

    return {
      isValid: true,
      payload: envelope.data,
    };
  } catch {
    return { isValid: false, error: "MALFORMED" };
  }
}

/**
 * การตั้งค่า Option สำหรับ Cookie
 */
export function getSessionCookieOptions(maxAgeSeconds: number = 7 * 24 * 60 * 60) {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax" as const,
    path: "/",
    maxAge: maxAgeSeconds,
  };
}
