import { NextRequest, NextResponse } from "next/server";
import { promises as fs } from "fs";
import path from "path";
import { db } from "@/prisma/db";
import checkProtectedApi from "@/utils/helper/protected_api";
import {
  createSessionToken,
  getSessionCookieOptions,
  sanitizeEmployeePayload,
  SESSION_COOKIE_NAME,
} from "@/utils/helper/auth_session";

// POST /api/user/update/profile/image - อัปโหลดรูปภาพโปรไฟล์
export async function POST(req: NextRequest) {
  try {
    const authResult = await checkProtectedApi(["ADMIN", "USER", "APPROVER"]);
    if (authResult instanceof NextResponse) return authResult;
    const { user: sessionUser } = authResult;

    const body = await req.json();
    const { imageBase64 } = body;

    if (!imageBase64 || typeof imageBase64 !== "string") {
      return NextResponse.json(
        {
          success: false,
          message: "ไม่พบข้อมูลรูปภาพที่ต้องการอัปโหลด",
        },
        { status: 400 }
      );
    }

    // ตรวจสอบข้อมูลอยู่ใยรูปแบบ base64 หรือไม่
    const matches = imageBase64.match(/^data:([A-Za-z-+/]+);base64,(.+)$/);
    if (!matches || matches.length !== 3) {
      return NextResponse.json(
        {
          success: false,
          message: "รูปแบบข้อมูลรูปภาพไม่ถูกต้อง (ต้องการ Base64 Data URL)",
        },
        { status: 400 }
      );
    }

    const imageBuffer = Buffer.from(matches[2], "base64");

    // ตรวจสอบ directory เก็บรูปภาพ
    const avatarDir = path.join(process.cwd(), "public", "profile_images");
    await fs.mkdir(avatarDir, { recursive: true });

    // บันทึกไฟล์รูปภาพโปรไฟล์
    const filename = `profile_${sessionUser.id}.jpg`;
    const filePath = path.join(avatarDir, filename);
    await fs.writeFile(filePath, imageBuffer);

    const imageUrl = `/profile_images/${filename}`;

    // อัปเดตรูปภาพโปรไฟล์ของผู้ใช้งานในฐานข้อมูล
    await db.orm.public.Employee
      .where({ id: sessionUser.id })
      .update({ profileImage: imageUrl });

    // ดึงข้อมูลล่าสุดของผู้ใช้และหน่วยงานเพื่อความถูกต้องครบถ้วนในการต่อ session
    const employee = await db.orm.public.Employee
      .where({ id: sessionUser.id })
      .first();

    let departmentName = sessionUser.department;
    if (employee?.departmentId) {
      const department = await db.orm.public.Department
        .where({ id: employee.departmentId })
        .first();
      if (department) departmentName = department.name;
    }

    // ปรับปรุง session ของผู้ใช้งานให้เป็นปัจจุบัน (navbar จะได้แสดงรูปโปรไฟล์ใหม่ทันที)
    const updatedPayload = sanitizeEmployeePayload({
      ...sessionUser,
      ...employee,
      profileImage: imageUrl,
      department: departmentName,
    });

    const { token, maxAgeSeconds } = createSessionToken(updatedPayload);

    const response = NextResponse.json({
      success: true,
      message: "อัปโหลดและบันทึกรูปภาพโปรไฟล์เรียบร้อยแล้ว",
      imageUrl,
      data: updatedPayload,
    });

    // บันทึก session cookie ใหม่ลงใน response
    response.cookies.set(
      SESSION_COOKIE_NAME,
      token,
      getSessionCookieOptions(maxAgeSeconds)
    );

    return response;
  } catch (error: unknown) {
    console.error("POST /api/user/update/profile/image error:", error);
    const message =
      error instanceof Error ? error.message : "เกิดข้อผิดพลาดในการอัปโหลดรูปภาพ";
    return NextResponse.json(
      {
        success: false,
        message,
      },
      { status: 500 }
    );
  }
}

// รองรับทั้ง PUT และ POST เพื่อความยืดหยุ่นในการเรียกใช้งาน
export const PUT = POST;
