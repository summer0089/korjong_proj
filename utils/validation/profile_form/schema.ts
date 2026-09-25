import { z } from "zod";

export const EmployeeProfileSchema = z.object({
  firstName: z
    .string()
    .trim()
    .min(1, "กรุณากรอกชื่อจริง")
    .max(100, "ชื่อต้องไม่เกิน 100 ตัวอักษร"),
  lastName: z
    .string()
    .trim()
    .min(1, "กรุณากรอกนามสกุล")
    .max(100, "นามสกุลต้องไม่เกิน 100 ตัวอักษร"),
  telephone: z
    .string()
    .trim()
    .min(9, "เบอร์โทรศัพท์ต้องมีความยาวอย่างน้อย 9 หลัก")
    .max(10, "เบอร์โทรศัพท์ต้องไม่เกิน 10 หลัก")
    .regex(/^[0-9]+$/, "เบอร์โทรศัพท์ต้องประกอบด้วยตัวเลข"),
  positionName: z
    .string()
    .trim()
    .min(1, "กรุณากรอกชื่อตำแหน่งงาน")
    .max(150, "ชื่อตำแหน่งต้องไม่เกิน 150 ตัวอักษร"),
  departmentId: z
    .string()
    .trim()
    .min(1, "กรุณาเลือกหน่วยงานที่สังกัด"),
  image: z.string().nullable().optional(),
});

export type EmployeeProfileData = z.infer<typeof EmployeeProfileSchema>;
