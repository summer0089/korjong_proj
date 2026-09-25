/**
 * @module lib/auth/session
 * @description จัดการ Session Token แบบ Stateless ด้วย HMAC-SHA256
 *
 * ฟีเจอร์หลัก:
 *  - สร้าง Session Token (createSessionToken)
 *  - ตรวจสอบ/ถอดรหัส Session Token (verifySessionToken)
 *  - แปลงข้อมูล Employee ให้ปลอดภัย (sanitizeEmployeePayload)
 *  - ตั้งค่า Cookie options (getSessionCookieOptions)
 *
 * @example
 * import { createSessionToken, verifySessionToken, SESSION_COOKIE_NAME } from "@/lib/auth/session";
 *
 * // สร้าง session
 * const { token, maxAgeSeconds } = createSessionToken(payload, true);
 * response.cookies.set(SESSION_COOKIE_NAME, token, getSessionCookieOptions(maxAgeSeconds));
 *
 * // ตรวจสอบ session
 * const result = verifySessionToken(cookieValue);
 * if (result.isValid) console.log(result.payload);
 */

/*ตัวอย่างการใช้งาน

    [การสร้าง Session Token]

    import { createSessionToken, getSessionCookieOptions, sanitizeEmployeePayload, SESSION_COOKIE_NAME } from "@/lib/auth/session";
    const updatedPayload = sanitizeEmployeePayload(updatedEmployee);
    const { token, maxAgeSeconds } = createSessionToken(updatedPayload);
    response.cookies.set(SESSION_COOKIE_NAME, token, getSessionCookieOptions(maxAgeSeconds));

    ----------------------------------------------------------------------------------------

    [การดึงค่า session มาใช้งานฝั่ง server]

    import { cookies } from "next/headers";
    import { SESSION_COOKIE_NAME, verifySessionToken } from "@/lib/auth/session";
    const cookieStore = await cookies();
    const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;
    const result = verifySessionToken(token);
    if (result.isValid) {
    const user = result.payload; // EmployeeSessionPayload
    }
  -------------------------------------------------------------------------------------------

  [การดึงค่า session มาใช้งานฝั่ง client(react component)]
  
  import { useSession } from "@/lib/auth/use-session";
  const { user, isLoading } = useSession();

  if (isLoading) return <div>Loading...</div>;
  if (!user) return <div>Please log in</div>;

  return (
    <div>
      <h1>Welcome {user.firstname}</h1>
      <p>Role: {user.role}</p>
      <p>Department: {user.department}</p>
      <p>Department ID: {user.departmentId}</p>
    </div>
  );
*/

import crypto from "crypto";

// ──────────────────────────────────────────────
// Constants
// ──────────────────────────────────────────────

/** ชื่อ Cookie สำหรับเก็บ Session Token */
export const SESSION_COOKIE_NAME = "korjong_session";

/** Secret key สำหรับ sign/verify — ต้องตั้งค่าใน .env */
const AUTH_SECRET = process.env.AUTH_SECRET || "korjong-stateless-otp-secret-key-32chars!";

if (!AUTH_SECRET) {
  throw new Error("Missing AUTH_SECRET environment variable");
}

// ──────────────────────────────────────────────
// Types
// ──────────────────────────────────────────────

/** ข้อมูล Employee ที่บันทึกใน Session Cookie (ไม่รวม password) */
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

/** ผลลัพธ์จากการตรวจสอบ Session Token */
export interface VerifySessionResult {
  isValid: boolean;
  payload?: EmployeeSessionPayload;
  error?: "EXPIRED" | "INVALID" | "MALFORMED" | "MISSING";
}

/** โครงสร้างภายในของ Token (ไม่ export — ใช้ภายในเท่านั้น) */
interface TokenEnvelope {
  data: EmployeeSessionPayload;
  exp: number; // timestamp ms
  iat: number; // timestamp ms
}

// ──────────────────────────────────────────────
// Internal Helpers (base64url encode/decode)
// ──────────────────────────────────────────────

function base64UrlEncode(str: string): string {
  return Buffer.from(str)
    .toString("base64")
    .replace(/=/g, "")
    .replace(/\+/g, "-")
    .replace(/\//g, "_");
}

function base64UrlDecode(str: string): string {
  let base64 = str.replace(/-/g, "+").replace(/_/g, "/");
  while (base64.length % 4) base64 += "=";
  return Buffer.from(base64, "base64").toString("utf-8");
}

// ──────────────────────────────────────────────
// Public API
// ──────────────────────────────────────────────

/**
 * แปลงข้อมูลจาก DB (Employee record) ให้เป็น EmployeeSessionPayload ที่ปลอดภัย
 * — ลบ password ออก, normalize ค่า, แปลง Date เป็น ISO string
 *
 * @param employee - record จากฐานข้อมูล (อาจมี field อะไรก็ได้)
 * @returns payload ที่ปลอดภัยสำหรับ session
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
 * สร้าง Signed Session Token พร้อมข้อมูล Employee ทั้งหมด
 *
 * @param payload - ข้อมูล Employee (ผ่าน sanitizeEmployeePayload แล้ว)
 * @param rememberMe - true = 30 วัน, false = 7 วัน (ค่าเริ่มต้น)
 * @returns token string, อายุเป็นวินาที, และวันหมดอายุ
 *
 * @example
 * const { token, maxAgeSeconds, expiresAt } = createSessionToken(userPayload, true);
 */
export function createSessionToken(
  payload: EmployeeSessionPayload,
  rememberMe: boolean = false,
): { token: string; maxAgeSeconds: number; expiresAt: Date } {
  const iat = Date.now();
  const maxAgeDays = rememberMe ? 30 : 7;
  const maxAgeSeconds = maxAgeDays * 24 * 60 * 60;
  const exp = iat + maxAgeSeconds * 1000;

  const envelope: TokenEnvelope = { data: payload, exp, iat };

  const encodedPayload = base64UrlEncode(JSON.stringify(envelope));
  const signature = crypto
    .createHmac("sha256", AUTH_SECRET)
    .update(encodedPayload)
    .digest("base64url");

  return {
    token: `${encodedPayload}.${signature}`,
    maxAgeSeconds,
    expiresAt: new Date(exp),
  };
}

/**
 * ตรวจสอบและถอดรหัส Session Token
 *
 * @param token - ค่า cookie value ที่ได้จาก request
 * @returns ผลลัพธ์: isValid + payload หรือ error code
 *
 * @example
 * const result = verifySessionToken(req.cookies.get(SESSION_COOKIE_NAME)?.value);
 * if (!result.isValid) return NextResponse.json({ error: result.error }, { status: 401 });
 * const user = result.payload; // EmployeeSessionPayload
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

  // ตรวจสอบ Signature (timing-safe comparison)
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

  // ถอดรหัสและตรวจสอบ payload
  try {
    const jsonStr = base64UrlDecode(encodedPayload);
    const envelope = JSON.parse(jsonStr) as TokenEnvelope;

    if (!envelope?.exp || !envelope?.data) {
      return { isValid: false, error: "MALFORMED" };
    }

    // ตรวจสอบวันหมดอายุ
    if (Date.now() > envelope.exp) {
      return { isValid: false, error: "EXPIRED" };
    }

    return { isValid: true, payload: envelope.data };
  } catch {
    return { isValid: false, error: "MALFORMED" };
  }
}

/**
 * ตั้งค่า Cookie options สำหรับ Session
 * — httpOnly, secure (production only), sameSite: lax
 *
 * @param maxAgeSeconds - อายุ cookie เป็นวินาที (ค่าเริ่มต้น 7 วัน)
 *
 * @example
 * response.cookies.set(SESSION_COOKIE_NAME, token, getSessionCookieOptions(maxAgeSeconds));
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
