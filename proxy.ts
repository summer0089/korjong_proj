import { NextRequest, NextResponse } from "next/server";
import {
  SESSION_COOKIE_NAME,
  verifySessionToken,
} from "@/lib/auth/session";

// เส้นทางที่ต้องการป้องกัน ต้องเข้าสู่ระบบก่อน (Protected Routes)
const PROTECTED_PREFIXES = [
  "/p/my-booking",
  "/u/profile",
  "/u/change-password",
];

//เส้นทางสำหรับ admin เท่านั้น
const ADMIN_PREFIXES = [
  "/a/employee-list",
  "/i/department",
  "/i/meeting-room"
];

//เส้นทางสำหรับ approver และ admin เท่านั้น
const APPROVER_PREFIXES = [
  "/a/approve-list",
];

// หน้าสำหรับการยืนยันตัวตน (ถ้าเข้าสู่ระบบแล้วไม่ควรเข้าซ้ำ)
const AUTH_PAGES = ["/u/signin", "/u/signup"];

/**
 * Next.js 16 Request Proxy (Middleware)
 * ทำหน้าที่ตรวจสอบ Session Cookie และควบคุมการเข้าถึง Route ต่างๆ
 */
export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // ตรวจสอบความถูกต้องของ Session Cookie
  const sessionCookie = request.cookies.get(SESSION_COOKIE_NAME)?.value;
  const sessionResult = verifySessionToken(sessionCookie);
  const isAuthenticated = sessionResult.isValid && Boolean(sessionResult.payload);

  // 1. หากเข้าสู่ระบบแล้ว และพยายามเปิดหน้า Signin / Signup ให้พาไปหน้าแรก
  const isAuthPage = AUTH_PAGES.some(
    (page) => pathname === page || pathname.startsWith(`${page}/`)
  );

  if (isAuthenticated && isAuthPage) {
    const callbackUrl = request.nextUrl.searchParams.get("callbackUrl");
    const targetUrl =
      callbackUrl && !AUTH_PAGES.some((p) => callbackUrl.startsWith(p))
        ? callbackUrl
        : "/";
    return NextResponse.redirect(new URL(targetUrl, request.url));
  }

  // 2. ตรวจสอบ Protected Routes
  const isProtected = PROTECTED_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`)
  );

  if (isProtected && !isAuthenticated) {
    // ผู้ใช้ยังไม่ได้เข้าสู่ระบบ ส่งไปยังหน้า /u/signin พร้อม callbackUrl
    const signinUrl = new URL("/u/signin", request.url);
    const callbackUrl = `${pathname}${request.nextUrl.search}`;
    signinUrl.searchParams.set("callbackUrl", callbackUrl);
    return NextResponse.redirect(signinUrl);
  }

  // 3. ตรวจสอบสิทธิ์เฉพาะ Admin สำหรับหน้าจัดการระบบ (/u/management)
  const isAdminRoute = ADMIN_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`)
  );

  if (isAdminRoute && isAuthenticated) {
    const role = sessionResult.payload?.role;
    if (role !== "ADMIN") {
      // ไม่มีสิทธิ์ Admin นำทางกลับหน้าแรก
      return NextResponse.redirect(new URL("/", request.url));
    }
  }

  // 4. ตรวจสอบสิทธิ์เฉพาะ Approver และ Admin สำหรับหน้าอนุมัติ (/a/request/approval)
  const isApproverRoute = APPROVER_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`)
  );

  if (isApproverRoute && isAuthenticated) {
    const role = sessionResult.payload?.role;
    if (role !== "APPROVER" && role !== "ADMIN") {
      // ไม่มีสิทธิ์ Approver หรือ Admin นำทางกลับหน้าแรก
      return NextResponse.redirect(new URL("/", request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - static image/asset extensions
     */
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
