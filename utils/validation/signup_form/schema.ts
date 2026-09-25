import { z } from "zod";

// Base schema for user signup data
export const EmployeeSchema = z.object({
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
  email: z
    .string()
    .trim()
    .min(1, "กรุณากรอกอีเมล")
    .pipe(z.email("รูปแบบอีเมลไม่ถูกต้อง")),
  telephone: z
    .string()
    .trim()
    .min(9, "เบอร์โทรศัพท์ต้องมีความยาวอย่างน้อย 9 หลัก")
    .max(10, "เบอร์โทรศัพท์ต้องไม่เกิน 10 หลัก")
    .regex(/^[0-9]+$/, "เบอร์โทรศัพท์ต้องประกอบด้วยตัวเลข"),
  position: z
    .string()
    .trim()
    .min(1, "กรุณากรอกชื่อตำแหน่งงาน")
    .max(150, "ชื่อตำแหน่งต้องไม่เกิน 150 ตัวอักษร"),
  departmentId: z
    .string()
    .trim()
    .min(1, "กรุณาเลือกหน่วยงานที่สังกัด"),
  image: z.string().optional().nullable(),
  password: z
    .string()
    .trim()
    .min(8, "รหัสผ่านต้องมีความยาวอย่างน้อย 8 ตัวอักษร")
    .max(16, "รหัสผ่านต้องไม่เกิน 16 ตัวอักษร"),
});

// Client form schema with confirm password
export const ConfirmPasswordSchema = EmployeeSchema
  .extend({
    confirmPassword: z.string().min(1, "กรุณายืนยันรหัสผ่าน"),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "รหัสผ่านและยืนยันรหัสผ่านไม่ตรงกัน",
    path: ["confirmPassword"],
  });

// Step 1: Email validation schema
export const emailStepSchema = z.object({
  email: z
    .string()
    .trim()
    .min(1, "กรุณากรอกอีเมล")
    .pipe(z.email("รูปแบบอีเมลไม่ถูกต้อง")),
});

// Step 1: OTP validation schema
export const otpStepSchema = z.object({
  otp: z
    .string()
    .trim()
    .length(6, "รหัส OTP ต้องมีความยาว 6 หลัก")
    .regex(/^\d{6}$/, "รหัส OTP ต้องเป็นตัวเลข 6 หลัก"),
});

// Step 2: Information form schema
export const EmployeeSignupSchema = z
  .object({
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
    position: z
      .string()
      .trim()
      .min(1, "กรุณากรอกชื่อตำแหน่งงาน")
      .max(150, "ชื่อตำแหน่งต้องไม่เกิน 150 ตัวอักษร"),
    departmentId: z
      .string()
      .trim()
      .min(1, "กรุณาเลือกหน่วยงานที่สังกัด"),
    password: z
      .string()
      .min(8, "รหัสผ่านต้องมีความยาวอย่างน้อย 8 ตัวอักษร")
      .max(100, "รหัสผ่านต้องไม่เกิน 100 ตัวอักษร"),
    confirmPassword: z.string().min(1, "กรุณายืนยันรหัสผ่าน"),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "รหัสผ่านและยืนยันรหัสผ่านไม่ตรงกัน",
    path: ["confirmPassword"],
  });

// API schema for /api/user/register
export const RegisterUserSchema = z.object({
  email: z
    .string()
    .trim()
    .min(1, "กรุณากรอกอีเมล")
    .pipe(z.string().email("รูปแบบอีเมลไม่ถูกต้อง")),
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
  position: z
    .string()
    .trim()
    .min(1, "กรุณากรอกชื่อตำแหน่งงาน")
    .max(150, "ชื่อตำแหน่งต้องไม่เกิน 150 ตัวอักษร"),
  departmentId: z
    .string()
    .trim()
    .min(1, "กรุณาเลือกหน่วยงานที่สังกัด"),
  password: z
    .string()
    .min(8, "รหัสผ่านต้องมีความยาวอย่างน้อย 8 ตัวอักษร")
    .max(100, "รหัสผ่านต้องไม่เกิน 100 ตัวอักษร"),
});

export type SignupFormData = z.infer<typeof ConfirmPasswordSchema>;
export type EmailStepData = z.infer<typeof emailStepSchema>;
export type OtpStepData = z.infer<typeof otpStepSchema>;
export type InfoStepData = z.infer<typeof EmployeeSignupSchema>;
export type RegisterUserData = z.infer<typeof RegisterUserSchema>;
