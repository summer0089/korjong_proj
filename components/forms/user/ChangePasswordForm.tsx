"use client";

import React, { useState } from "react";
import Link from "next/link";
import { ChangePasswordOwnerSchema } from "@/utils/validation/change_password_form/schema";
import { PasswordBox } from "@/components/form_controls/PasswordBox";
import { Button } from "@/components/form_controls/Button";
import { TextAlert } from "@/components/form_controls/TextAlert";
import { MessageBox } from "@/components/form_controls/MessageBox";
import {
  KeyRound,
  ArrowLeft,
  CheckCircle2,
  Lock,
} from "lucide-react";

interface FormErrors {
  currentPassword?: string;
  newPassword?: string;
  confirmPassword?: string;
}

export default function ChangePasswordForm() {
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [errors, setErrors] = useState<FormErrors>({});
  const [generalError, setGeneralError] = useState("");
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setGeneralError("");
    setErrors({});

    const payload = {
      currentPassword,
      newPassword,
      confirmPassword,
    };

    const validation = ChangePasswordOwnerSchema.safeParse(payload);
    if (!validation.success) {
      const errMap: FormErrors = {};
      for (const issue of validation.error.issues) {
        const field = issue.path[0] as keyof FormErrors;
        if (field && !errMap[field]) {
          errMap[field] = issue.message;
        }
      }
      setErrors(errMap);
      return;
    }

    try {
      setLoading(true);

      const res = await fetch("/api/user/update/password", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const resJson = await res.json();
      if (!res.ok || !resJson.success) {
        setGeneralError(resJson.message || "เกิดข้อผิดพลาดในการเปลี่ยนรหัสผ่าน");
        return;
      }

      setSuccess(true);
    } catch (err: unknown) {
      console.error("Failed to change password:", err);
      setGeneralError("ไม่สามารถเชื่อมต่อกับเซิร์ฟเวอร์ได้ กรุณาลองใหม่อีกครั้ง");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-md sm:max-w-lg mx-auto transition-all duration-300">
      {success ? (
        <div className="bg-white rounded-3xl border border-slate-200 shadow-xl p-6 sm:p-10 animate-fade-in text-center space-y-6">
          <MessageBox
            title="เปลี่ยนรหัสผ่านสำเร็จ!"
            text="รหัสผ่านใหม่ของคุณได้รับการบันทึกและเข้ารหัสอย่างปลอดภัยแล้ว คุณสามารถใช้รหัสผ่านใหม่นี้ในการลงชื่อเข้าใช้งานในครั้งต่อไป"
            variant="success"
          />

          <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link href="/u/profile" className="w-full sm:w-auto">
              <Button
                type="button"
                variant="primary"
                size="md"
                text="กลับไปยังหน้าแก้ไขข้อมูลส่วนตัว"
                icon={<ArrowLeft className="w-4 h-4" />}
                className="w-full"
              />
            </Link>
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-3xl border border-slate-200/90 shadow-xl shadow-slate-200/50 p-6 sm:p-10 backdrop-blur-sm">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-50 text-amber-800 border border-amber-200 text-xs font-semibold mb-3 shadow-2xs">
              <KeyRound className="w-3.5 h-3.5" />
              <span>ความปลอดภัยของบัญชีผู้ใช้</span>
            </div>

            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900">
              เปลี่ยนรหัสผ่าน
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 mt-2 max-w-sm mx-auto leading-relaxed">
              กรุณากรอกรหัสผ่านปัจจุบันและกำหนดรหัสผ่านใหม่ของคุณเพื่อความปลอดภัย
            </p>
          </div>

          {/* Feedback Alert */}
          {generalError && (
            <TextAlert
              text={generalError}
              variant="error"
              className="mb-6 shadow-2xs"
              onClose={() => setGeneralError("")}
            />
          )}

          {/* Form */}
          <form noValidate onSubmit={handleSubmit} className="space-y-5">
            {/* Current Password */}
            <div>
              <PasswordBox
                id="currentPassword"
                name="currentPassword"
                label="รหัสผ่านปัจจุบัน"
                placeholder="กรอกรหัสผ่านปัจจุบันของคุณ"
                value={currentPassword}
                error={errors.currentPassword}
                onChange={(e) => {
                  setCurrentPassword(e.target.value);
                  if (errors.currentPassword) {
                    setErrors((prev) => ({ ...prev, currentPassword: undefined }));
                  }
                }}
                disabled={loading}
              />
            </div>

            {/* New Password */}
            <div>
              <PasswordBox
                id="newPassword"
                name="newPassword"
                label="รหัสผ่านใหม่"
                placeholder="ความยาวอย่างน้อย 8 ตัวอักษร"
                value={newPassword}
                error={errors.newPassword}
                onChange={(e) => {
                  setNewPassword(e.target.value);
                  if (errors.newPassword) {
                    setErrors((prev) => ({ ...prev, newPassword: undefined }));
                  }
                }}
                disabled={loading}
              />
            </div>

            {/* Confirm Password */}
            <div>
              <PasswordBox
                id="confirmPassword"
                name="confirmPassword"
                label="ยืนยันรหัสผ่านใหม่"
                placeholder="กรอกรหัสผ่านใหม่อีกครั้ง"
                value={confirmPassword}
                error={errors.confirmPassword}
                onChange={(e) => {
                  setConfirmPassword(e.target.value);
                  if (errors.confirmPassword) {
                    setErrors((prev) => ({ ...prev, confirmPassword: undefined }));
                  }
                }}
                disabled={loading}
              />
            </div>

            {/* Password Hint */}
            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80 text-xs text-slate-500 flex items-start gap-2">
              <Lock className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
              <span>
                รหัสผ่านต้องมีความยาวอย่างน้อย 8 ตัวอักษร แนะนำให้ผสมตัวอักษรพิมพ์ใหญ่ พิมพ์เล็ก ตัวเลข และอักขระพิเศษ
              </span>
            </div>

            {/* Actions */}
            <div className="pt-2 space-y-3">
              <Button
                type="submit"
                variant="primary"
                size="lg"
                text="ยืนยันการเปลี่ยนรหัสผ่าน"
                icon={<CheckCircle2 className="w-4 h-4" />}
                loading={loading}
                loadingText="กำลังตรวจสอบและบันทึกข้อมูล..."
                fullWidth
                className="shadow-md"
              />

              <Link href="/u/profile" className="block text-center">
                <Button
                  type="button"
                  variant="outline"
                  size="md"
                  text="ย้อนกลับไปยังหน้าแก้ไขข้อมูลส่วนตัว"
                  icon={<ArrowLeft className="w-4 h-4" />}
                  fullWidth
                  disabled={loading}
                />
              </Link>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
