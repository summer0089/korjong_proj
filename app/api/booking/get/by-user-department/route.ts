import { NextRequest, NextResponse } from "next/server";
import { db } from "@/prisma/db";
import { enrichBookings } from "@/utils/helper/booking";

// GET /api/booking/get/by-user-department - ดึงข้อมูลการจองโดยระบุชื่อหน่วยงาน
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const departmentName = searchParams.get("department") || searchParams.get("departmentName");
    const departmentId = searchParams.get("departmentId");

    if (!departmentName && !departmentId) {
      return NextResponse.json(
        { success: false, message: "กรุณาระบุชื่อหน่วยงาน (department หรือ departmentName)" },
        { status: 400 }
      );
    }

    // 1. หาข้อมูลหน่วยงาน
    let targetDeptId = departmentId;
    if (!targetDeptId && departmentName) {
      const dept = await db.orm.public.Department
        .where((d) => d.name.eq(departmentName.trim()))
        .first();
      if (dept) {
        targetDeptId = dept.id;
      }
    }

    // 2. หาพนักงานในหน่วยงานนี้
    const allEmployees = await db.orm.public.Employee.all();
    const matchingEmployeeIds = (allEmployees || [])
      .filter((e: any) => {
        if (targetDeptId && e.departmentId === targetDeptId) return true;
        if (departmentName && (e.department || "").toLowerCase() === departmentName.trim().toLowerCase()) return true;
        return false;
      })
      .map((e: any) => e.id);

    if (matchingEmployeeIds.length === 0) {
      return NextResponse.json({
        success: true,
        data: [],
        total: 0,
        message: "ไม่พบพนักงานในหน่วยงานที่ระบุ",
      });
    }

    // 3. ดึงรายการจองของพนักงานในหน่วยงานนี้
    const allBookings = await db.orm.public.MeetingBooking
      .orderBy((b) => b.startTime.desc())
      .all();

    const deptBookings = (allBookings || []).filter((b: any) =>
      matchingEmployeeIds.includes(b.employeeId)
    );

    const enriched = await enrichBookings(deptBookings);

    return NextResponse.json({
      success: true,
      data: enriched,
      total: enriched.length,
    });
  } catch (error: unknown) {
    console.error("GET /api/booking/get/by-user-department error:", error);
    const message =
      error instanceof Error ? error.message : "เกิดข้อผิดพลาดในการดึงข้อมูลการจองตามหน่วยงาน";
    return NextResponse.json(
      { success: false, message, error: String(error) },
      { status: 500 }
    );
  }
}
