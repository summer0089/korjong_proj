import { z } from "zod";

export const ChangePasswordOwnerSchema = z
    .object({
        currentPassword: z.string().min(1, "กรุณากรอกรหัสผ่านปัจจุบัน"),
        newPassword: z
            .string()
            .min(8, "รหัสผ่านใหม่ต้องมีความยาวอย่างน้อย 8 ตัวอักษร")
            .max(16, "รหัสผ่านต้องไม่เกิน 16 ตัวอักษร"),
        confirmPassword: z.string().min(1, "กรุณายืนยันรหัสผ่านใหม่"),
    })
    .refine((data) => data.newPassword === data.confirmPassword, {
        message: "รหัสผ่านใหม่และการยืนยันรหัสผ่านไม่ตรงกัน",
        path: ["confirmPassword"],
    });

export type ChangePasswordOwnerData = z.infer<typeof ChangePasswordOwnerSchema>;