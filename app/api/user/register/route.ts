import { NextRequest, NextResponse } from "next/server";
import { db } from "@/prisma/db";
import bcrypt from "bcryptjs";
import { RegisterUserSchema } from "@/utils/validation/signup_form/schema";

// POST /api/user/register - บันทึกข้อมูลผู้ใช้
export async function POST(req: NextRequest) {
    try {
        const body = await req.json();

        const validation = RegisterUserSchema.safeParse(body);
        if (!validation.success) {
            return NextResponse.json(
                {
                    success: false,
                    message: validation.error.issues[0]?.message || "ข้อมูลไม่ถูกต้อง",
                    errors: validation.error.format(),
                },
                { status: 400 }
            );
        }

        const {
            email,
            firstName,
            lastName,
            telephone,
            position,
            departmentId,
            password,
        } = validation.data;

        const normalizedEmail = email.toLowerCase().trim();

        // ตรวจสอบอีเมลซ้ำ
        const existing = await db.orm.public.Employee
            .where({ email: normalizedEmail })
            .first();

        if (existing) {
            return NextResponse.json(
                {
                    success: false,
                    message: "อีเมลนี้ได้ลงทะเบียนไว้ในระบบแล้ว กรุณาเข้าสู่ระบบ",
                },
                { status: 409 }
            );
        }

        // ตรวจสอบหน่วยงานที่เลือก
        const department = await db.orm.public.Department
            .where({ id: departmentId })
            .first();

        if (!department) {
            return NextResponse.json(
                {
                    success: false,
                    message: "ไม่พบข้อมูลหน่วยงานที่เลือก",
                },
                { status: 400 }
            );
        }

        // Hash รหัสผ่าน
        const hashedPassword = await bcrypt.hash(password, 10);

        // สร้างข้อมูลพนักงาน (Employee)
        const user = await db.orm.public.Employee.create({
            firstname: firstName.trim(),
            lastname: lastName.trim(),
            email: normalizedEmail,
            password: hashedPassword,
            role: db.enums.public.Roles.members.USER,
            position: position.trim(),
            department: department.name,
            phoneNumber: telephone.trim(),
            isActive: true,
            departmentId: department.id,
        });

        return NextResponse.json(
            {
                success: true,
                message: "ลงทะเบียนผู้ใช้งานสำเร็จ",
                data: {
                    id: user.id,
                    name: `${user.firstname} ${user.lastname}`,
                    email: user.email,
                },
            },
            { status: 201 }
        );
    } catch (error: unknown) {
        console.error("POST /api/user/register error:", error);
        const message =
            error instanceof Error ? error.message : "เกิดข้อผิดพลาดในการลงทะเบียนผู้ใช้";
        return NextResponse.json(
            {
                success: false,
                message,
            },
            { status: 500 }
        );
    }
}
