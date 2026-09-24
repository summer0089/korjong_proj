import { z } from "zod";

export const departmentSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, "กรุณากรอกชื่อหน่วยงานภายใน")
    .max(150, "ชื่อหน่วยงานต้องไม่เกิน 150 ตัวอักษร"),
});

export type DepartmentFormData = z.infer<typeof departmentSchema>;
