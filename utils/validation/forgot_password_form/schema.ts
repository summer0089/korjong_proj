import { z } from "zod";

// Base schema for email input
export const ForgotPasswordEmailSchema = z.object({
  email: z
    .string()
    .trim()
    .min(1, "กรุณากรอกอีเมลของคุณ")
    .pipe(z.email("รูปแบบอีเมลไม่ถูกต้อง")),
});

// Alias for backward compatibility
export const ForgotPasswordSchema = ForgotPasswordEmailSchema;

// Schema for OTP verification
export const ForgotPasswordOtpSchema = z.object({
  email: z
    .string()
    .trim()
    .min(1, "กรุณากรอกอีเมลของคุณ")
    .pipe(z.email("รูปแบบอีเมลไม่ถูกต้อง")),
  otp: z
    .string()
    .trim()
    .length(6, "รหัส OTP ต้องมีความยาว 6 หลัก")
    .regex(/^\d{6}$/, "รหัส OTP ต้องเป็นตัวเลข 6 หลัก"),
});

// Schema for new password step
export const ResetPasswordSchema = z
  .object({
    newPassword: z
      .string()
      .min(8, "รหัสผ่านใหม่ต้องมีความยาวอย่างน้อย 8 ตัวอักษร")
      .max(100, "รหัสผ่านต้องไม่เกิน 100 ตัวอักษร"),
    confirmNewPassword: z.string().min(1, "กรุณายืนยันรหัสผ่านใหม่"),
  })
  .refine((data) => data.newPassword === data.confirmNewPassword, {
    message: "รหัสผ่านใหม่และยืนยันรหัสผ่านไม่ตรงกัน",
    path: ["confirmNewPassword"],
  });

// Schema for user/change_pwd API payload
export const ChangePasswordApiSchema = z.object({
  email: z
    .string()
    .trim()
    .min(1, "กรุณาระบุอีเมล")
    .pipe(z.email("รูปแบบอีเมลไม่ถูกต้อง")),
  newPassword: z
    .string()
    .min(8, "รหัสผ่านต้องมีความยาวอย่างน้อย 8 ตัวอักษร")
    .max(100, "รหัสผ่านต้องไม่เกิน 100 ตัวอักษร"),
});

export type ForgotPasswordFormData = z.infer<typeof ForgotPasswordSchema>;
export type ForgotPasswordOtpData = z.infer<typeof ForgotPasswordOtpSchema>;
export type ResetPasswordFormData = z.infer<typeof ResetPasswordSchema>;
export type ChangePasswordApiData = z.infer<typeof ChangePasswordApiSchema>;
