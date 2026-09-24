import { z } from "zod";

export const signinSchema = z.object({
    email: z
        .string()
        .trim()
        .min(1, "กรุณากรอกอีเมล")
        .pipe(z.email("รูปแบบอีเมลไม่ถูกต้อง")),
    password: z
        .string()
        .min(8, "รหัสผ่านต้องมีอย่างน้อย 8 ตัวอักษร"),
    rememberMe: z.boolean().optional(),
});

export type SigninFormData = z.infer<typeof signinSchema>;