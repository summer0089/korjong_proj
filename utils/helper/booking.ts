import { db } from "@/prisma/db";
import { cookies } from "next/headers";
import { SESSION_COOKIE_NAME, verifySessionToken, EmployeeSessionPayload } from "@/lib/auth/session";

/**
 * ดึงข้อมูล Session User ปัจจุบัน (ถ้ามี) แบบไม่บังคับ
 */
export async function getCurrentSessionUser(): Promise<EmployeeSessionPayload | null> {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;
    if (!token) return null;
    const result = verifySessionToken(token);
    if (result.isValid && result.payload) {
      return result.payload;
    }
    return null;
  } catch {
    return null;
  }
}

/**
 * ผนวกข้อมูล Room และ Employee เข้ากับรายการ Bookings
 */
export async function enrichBookings(bookings: any[]) {
  if (!bookings || bookings.length === 0) return [];

  try {
    const [rooms, employees, departments] = await Promise.all([
      db.orm.public.MeetingRoom.all(),
      db.orm.public.Employee.all(),
      db.orm.public.Department.all(),
    ]);

    const deptMap = new Map<string, string>();
    if (Array.isArray(departments)) {
      departments.forEach((d: any) => {
        if (d.id && d.name) deptMap.set(d.id, d.name);
      });
    }

    const roomMap = new Map<string, any>();
    if (Array.isArray(rooms)) {
      rooms.forEach((r: any) => {
        if (r.id) {
          roomMap.set(r.id, {
            id: r.id,
            name: r.name,
            capacity: r.capacity,
          });
        }
      });
    }

    const empMap = new Map<string, any>();
    if (Array.isArray(employees)) {
      employees.forEach((e: any) => {
        if (e.id) {
          empMap.set(e.id, {
            id: e.id,
            firstname: e.firstname,
            lastname: e.lastname,
            email: e.email,
            department: e.department || deptMap.get(e.departmentId) || "",
            position: e.position,
            phoneNumber: e.phoneNumber,
            profileImage: e.profileImage || null,
          });
        }
      });
    }

    return bookings.map((b: any) => ({
      id: b.id,
      topic: b.topic,
      participant: b.participant,
      note: b.note || "",
      status: b.status,
      startTime: b.startTime,
      endTime: b.endTime,
      createdAt: b.createdAt,
      updatedAt: b.updatedAt,
      employeeId: b.employeeId,
      roomId: b.roomId,
      room: roomMap.get(b.roomId) || null,
      employee: empMap.get(b.employeeId) || null,
    }));
  } catch (error) {
    console.error("enrichBookings error:", error);
    return bookings;
  }
}

/**
 * ผนวกข้อมูลเดี่ยว
 */
export async function enrichBooking(booking: any) {
  if (!booking) return null;
  const enrichedList = await enrichBookings([booking]);
  return enrichedList[0] || booking;
}

/**
 * ตรวจสอบว่าช่วงเวลาทับซ้อนกับการจองอื่นในห้องเดียวกันหรือไม่ (สถานะ APPROVED หรือ PENDING)
 */
export async function checkBookingConflict(
  roomId: string,
  startTime: string,
  endTime: string,
  excludeBookingId?: string
): Promise<{ hasConflict: boolean; conflictingBooking?: any }> {
  try {
    const start = new Date(startTime).getTime();
    const end = new Date(endTime).getTime();

    // ดึงการจองทั้งหมดของห้องนี้
    const roomBookings = await db.orm.public.MeetingBooking
      .where({ roomId })
      .all();

    if (!Array.isArray(roomBookings)) {
      return { hasConflict: false };
    }

    for (const b of roomBookings) {
      if (excludeBookingId && b.id === excludeBookingId) continue;
      // เฉพาะสถานะ PENDING หรือ APPROVED ที่นับว่าชน
      if (b.status !== "PENDING" && b.status !== "APPROVED") continue;

      const bStart = new Date(b.startTime).getTime();
      const bEnd = new Date(b.endTime).getTime();

      // Overlap: start < bEnd && end > bStart
      if (start < bEnd && end > bStart) {
        return { hasConflict: true, conflictingBooking: b };
      }
    }

    return { hasConflict: false };
  } catch (error) {
    console.error("checkBookingConflict error:", error);
    return { hasConflict: false };
  }
}
