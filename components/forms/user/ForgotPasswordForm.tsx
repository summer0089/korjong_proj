"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { Stepper, StepItem } from "@/components/form_controls/Stepper";
import { TextBox } from "@/components/form_controls/TextBox";
import { PasswordBox } from "@/components/form_controls/PasswordBox";
import { Button } from "@/components/form_controls/Button";
import { TextAlert } from "@/components/form_controls/TextAlert";
import { MessageBox } from "@/components/form_controls/MessageBox";
import {
  ForgotPasswordEmailSchema,
  ForgotPasswordOtpSchema,
  ResetPasswordSchema,
} from "@/utils/validation/forgot_password_form/schema";
import {
  KeyRound,
  ArrowLeft,
  ArrowRight,
  Send,
  RotateCw,
  CheckCircle2,
  Lock,
  HelpCircle,
  ShieldCheck,
} from "lucide-react";

interface FieldErrors {
  email?: string;
  otp?: string;
  newPassword?: string;
  confirmNewPassword?: string;
}

export function ForgotPasswordForm() {
  // Stepper State (1: Verify Email, 2: New Password, 3: Result Message)
  const [currentStep, setCurrentStep] = useState<number>(1);

  // Step 1: Email & OTP State
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [sendingOtp, setSendingOtp] = useState(false);
  const [verifyingOtp, setVerifyingOtp] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);
  const [resetToken, setResetToken] = useState("");

  // Step 2: New Password State
  const [newPassword, setNewPassword] = useState("");
  const [confirmNewPassword, setConfirmNewPassword] = useState("");
  const [savingPassword, setSavingPassword] = useState(false);

  // Step 3: Result State
  const [changeSuccess, setChangeSuccess] = useState<boolean | null>(null);
  const [changeMessage, setChangeMessage] = useState("");

  // Errors & Notifications
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [generalError, setGeneralError] = useState("");
  const [generalSuccess, setGeneralSuccess] = useState("");

  // Stepper definition (3 Steps)
  const steps: StepItem[] = [
    { title: "ยืนยันอีเมล", description: "ขอรับรหัส OTP" },
    { title: "รหัสผ่านใหม่", description: "กำหนดรหัสผ่าน" },
    { title: "เสร็จสิ้น", description: "ผลการดำเนินการ" },
  ];

  // Cooldown countdown timer for resend OTP
  useEffect(() => {
    if (resendCooldown <= 0) return;
    const timer = setInterval(() => {
      setResendCooldown((prev) => prev - 1);
    }, 1000);
    return () => clearInterval(timer);
  }, [resendCooldown]);

  // -------------------------------------------------------------
  // Step 1: Send OTP to Email
  // -------------------------------------------------------------
  const handleSendOtp = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setGeneralError("");
    setGeneralSuccess("");
    setFieldErrors((prev) => ({ ...prev, email: undefined }));

    const validation = ForgotPasswordEmailSchema.safeParse({ email });
    if (!validation.success) {
      setFieldErrors((prev) => ({
        ...prev,
        email: validation.error.issues[0]?.message,
      }));
      return;
    }

    setSendingOtp(true);
    try {
      const response = await fetch("/api/auth/otp/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: validation.data.email, type: "forgot_password" }),
      });

      const data = await response.json();
      if (!response.ok || !data.success) {
        setGeneralError(data.message || "ไม่สามารถส่งรหัส OTP ได้ กรุณาลองใหม่อีกครั้ง");
        return;
      }

      setOtpSent(true);
      setResendCooldown(60);
      setGeneralSuccess(`ระบบได้ส่งรหัส OTP ไปยังอีเมล ${validation.data.email} แล้ว กรุณาตรวจสอบกล่องข้อความ`);
    } catch (err: unknown) {
      console.error("Send reset OTP error:", err);
      setGeneralError("ไม่สามารถเชื่อมต่อกับเซิร์ฟเวอร์เพื่อส่ง OTP ได้");
    } finally {
      setSendingOtp(false);
    }
  };

  // -------------------------------------------------------------
  // Step 1: Verify OTP
  // -------------------------------------------------------------
  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setGeneralError("");
    setGeneralSuccess("");
    setFieldErrors((prev) => ({ ...prev, otp: undefined }));

    const validation = ForgotPasswordOtpSchema.safeParse({ email, otp });
    if (!validation.success) {
      setFieldErrors((prev) => ({
        ...prev,
        otp: validation.error.issues[0]?.message,
      }));
      return;
    }

    setVerifyingOtp(true);
    try {
      const response = await fetch("/api/auth/otp/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, otp: validation.data.otp }),
      });

      const data = await response.json();
      if (!response.ok || !data.success) {
        setGeneralError(data.message || "รหัส OTP ไม่ถูกต้องหรือหมดอายุแล้ว");
        return;
      }

      if (data.resetToken) {
        setResetToken(data.resetToken);
      }

      // Proceed to Step 2
      setGeneralSuccess("");
      setCurrentStep(2);
    } catch (err: unknown) {
      console.error("Verify reset OTP error:", err);
      setGeneralError("ไม่สามารถเชื่อมต่อกับเซิร์ฟเวอร์เพื่อตรวจสอบ OTP ได้");
    } finally {
      setVerifyingOtp(false);
    }
  };

  // -------------------------------------------------------------
  // Step 2: Change Password
  // -------------------------------------------------------------
  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setGeneralError("");
    setFieldErrors({});

    const validation = ResetPasswordSchema.safeParse({
      newPassword,
      confirmNewPassword,
    });

    if (!validation.success) {
      const errors: FieldErrors = {};
      for (const issue of validation.error.issues) {
        const field = issue.path[0] as keyof FieldErrors;
        if (field && !errors[field]) {
          errors[field] = issue.message;
        }
      }
      setFieldErrors(errors);
      return;
    }

    setSavingPassword(true);
    try {
      const response = await fetch("/api/user/update/password", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email,
          newPassword: validation.data.newPassword,
          resetToken,
        }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        setChangeSuccess(false);
        setChangeMessage(data.message || "เกิดข้อผิดพลาดในการเปลี่ยนรหัสผ่าน");
        setCurrentStep(3);
        return;
      }

      // Success
      setChangeSuccess(true);
      setChangeMessage(data.message || "เปลี่ยนรหัสผ่านใหม่สำเร็จเรียบร้อยแล้ว");
      setCurrentStep(3);
    } catch (err: unknown) {
      console.error("Change password error:", err);
      setChangeSuccess(false);
      setChangeMessage("ไม่สามารถเชื่อมต่อกับเซิร์ฟเวอร์ได้ กรุณาลองใหม่อีกครั้ง");
      setCurrentStep(3);
    } finally {
      setSavingPassword(false);
    }
  };

  return (
    <div className="w-full max-w-xl mx-auto my-auto transition-all duration-300">
      <div className="bg-white rounded-2xl sm:rounded-3xl border border-slate-200/90 shadow-xl shadow-slate-200/40 p-6 sm:p-10 transition-all">
        {/* Header & SSO Branding */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary-light text-primary border border-primary-border/60 text-xs font-semibold mb-3 tracking-wide shadow-2xs">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>ระบบจองห้องประชุมออนไลน์ เทศบาลเมืองแสนสุข</span>
          </div>

          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 font-sans">
            รีเซ็ตรหัสผ่าน
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1 max-w-sm mx-auto leading-relaxed">
            ยืนยันความเป็นเจ้าของบัญชีเพื่อกำหนดรหัสผ่านใหม่
          </p>
        </div>

        {/* Stepper Progress Bar */}
        <div className="mb-8 pb-6 border-b border-slate-100">
          <Stepper
            steps={steps}
            currentStep={currentStep}
            allowClickPrevious={currentStep === 2}
            onStepClick={(targetStep) => {
              if (targetStep < currentStep && currentStep < 3) {
                setGeneralError("");
                setCurrentStep(targetStep);
              }
            }}
          />
        </div>

        {/* Global Notifications */}
        {generalError && (
          <TextAlert
            text={generalError}
            variant="error"
            className="mb-5 shadow-2xs"
            onClose={() => setGeneralError("")}
          />
        )}

        {generalSuccess && (
          <TextAlert
            text={generalSuccess}
            variant="success"
            className="mb-5 shadow-2xs"
            onClose={() => setGeneralSuccess("")}
          />
        )}

        {/* ========================================================= */}
        {/* STEP 1: Enter Email & Verify OTP                          */}
        {/* ========================================================= */}
        {currentStep === 1 && (
          <div className="space-y-5 animate-fade-in">
            {/* Header info */}
            <div className="text-center mb-2">
              <div className="w-11 h-11 rounded-2xl bg-primary-light text-primary flex items-center justify-center mx-auto mb-3 border border-primary-border/60 shadow-2xs">
                <KeyRound className="w-5 h-5" />
              </div>
              <h2 className="text-lg sm:text-xl font-bold text-slate-900">
                ขั้นตอนที่ 1: ตรวจสอบและยืนยันอีเมลของคุณ
              </h2>
              <p className="text-xs sm:text-sm text-slate-500 mt-1">
                กรอกอีเมลที่ใช้ลงทะเบียน ระบบจะส่งรหัสยืนยัน OTP ไปยังกล่องข้อความ
              </p>
            </div>

            {/* Advice Callout Box */}
            <div className="p-3.5 bg-blue-50/80 border border-blue-200/70 rounded-xl text-xs text-blue-800 flex items-start gap-2.5">
              <HelpCircle className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
              <div>
                <span className="font-bold">คำแนะนำ:</span>
                <span className="ml-1">หากผู้ใช้งานลืม email ให้ติดต่อผู้ดูแลระบบ</span>
              </div>
            </div>

            {/* Email Form */}
            <form onSubmit={(e) => e.preventDefault()} noValidate className="space-y-4">
              <TextBox
                id="recovery-email"
                name="email"
                type="email"
                label="อีเมลบัญชีผู้ใช้งาน"
                placeholder="name@saensukcity.go.th หรือ name@example.com"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  if (fieldErrors.email) {
                    setFieldErrors((prev) => ({ ...prev, email: undefined }));
                  }
                }}
                error={fieldErrors.email}
                disabled={sendingOtp || verifyingOtp || otpSent}
              />

              {!otpSent ? (
                <div className="pt-2">
                  <Button
                    type="button"
                    variant="primary"
                    size="lg"
                    fullWidth
                    text="ส่ง OTP"
                    loading={sendingOtp}
                    loadingText="กำลังส่งรหัส OTP..."
                    rightIcon={<Send className="w-4 h-4 ml-1" />}
                    onClick={handleSendOtp}
                  />
                </div>
              ) : (
                <div className="space-y-4 pt-2 border-t border-slate-100 animate-fade-in">
                  <TextBox
                    id="recovery-otp"
                    name="otp"
                    type="text"
                    label="รหัสยืนยัน OTP (6 หลัก)"
                    placeholder="กรอกรหัส 6 หลักที่ได้รับในอีเมล"
                    value={otp}
                    maxLength={6}
                    onChange={(e) => {
                      const val = e.target.value.replace(/\D/g, "");
                      setOtp(val);
                      if (fieldErrors.otp) {
                        setFieldErrors((prev) => ({ ...prev, otp: undefined }));
                      }
                    }}
                    error={fieldErrors.otp}
                    disabled={verifyingOtp}
                    helperText="รหัส OTP มีอายุ 5 นาที หากไม่พบในกล่องจดหมายโปรดตรวจสอบใน Junk/Spam"
                  />

                  <div className="flex flex-col sm:flex-row items-center gap-3">
                    <Button
                      type="button"
                      variant="primary"
                      size="lg"
                      className="w-full sm:flex-1"
                      text="ยืนยันรหัส OTP"
                      loading={verifyingOtp}
                      loadingText="กำลังตรวจสอบรหัส..."
                      rightIcon={<CheckCircle2 className="w-4 h-4 ml-1" />}
                      onClick={handleVerifyOtp}
                    />

                    <Button
                      type="button"
                      variant="secondary"
                      size="lg"
                      className="w-full sm:w-auto"
                      disabled={resendCooldown > 0 || sendingOtp}
                      text={
                        resendCooldown > 0
                          ? `ขอรหัสใหม่ (${resendCooldown}s)`
                          : "ขอรหัส OTP อีกครั้ง"
                      }
                      leftIcon={<RotateCw className="w-4 h-4 mr-1" />}
                      onClick={() => handleSendOtp()}
                    />
                  </div>
                </div>
              )}
            </form>
          </div>
        )}

        {/* ========================================================= */}
        {/* STEP 2: Set New Password                                   */}
        {/* ========================================================= */}
        {currentStep === 2 && (
          <form onSubmit={handleChangePassword} noValidate className="space-y-5 animate-fade-in">
            {/* Header info */}
            <div className="text-center mb-2">
              <div className="w-11 h-11 rounded-2xl bg-primary-light text-primary flex items-center justify-center mx-auto mb-3 border border-primary-border/60 shadow-2xs">
                <Lock className="w-5 h-5" />
              </div>
              <h2 className="text-lg sm:text-xl font-bold text-slate-900">
                ขั้นตอนที่ 2: กำหนดรหัสผ่านใหม่
              </h2>
              <p className="text-xs sm:text-sm text-slate-500 mt-1">
                บัญชี: <strong className="text-primary font-mono">{email}</strong>
              </p>
            </div>

            <div className="space-y-4">
              <PasswordBox
                id="new-password"
                name="newPassword"
                label="รหัสผ่านใหม่"
                placeholder="อย่างน้อย 8 ตัวอักษร"
                value={newPassword}
                error={fieldErrors.newPassword}
                onChange={(e) => {
                  setNewPassword(e.target.value);
                  if (fieldErrors.newPassword) {
                    setFieldErrors((prev) => ({ ...prev, newPassword: undefined }));
                  }
                }}
                disabled={savingPassword}
              />

              <PasswordBox
                id="confirm-new-password"
                name="confirmNewPassword"
                label="ยืนยันรหัสผ่านใหม่"
                placeholder="กรอกรหัสผ่านใหม่อีกครั้ง"
                value={confirmNewPassword}
                error={fieldErrors.confirmNewPassword}
                onChange={(e) => {
                  setConfirmNewPassword(e.target.value);
                  if (fieldErrors.confirmNewPassword) {
                    setFieldErrors((prev) => ({ ...prev, confirmNewPassword: undefined }));
                  }
                }}
                disabled={savingPassword}
              />
            </div>

            <div className="flex items-center justify-between gap-3 pt-3">
              <Button
                type="button"
                variant="secondary"
                size="lg"
                text="ย้อนกลับ"
                leftIcon={<ArrowLeft className="w-4 h-4 mr-1" />}
                onClick={() => {
                  setGeneralError("");
                  setCurrentStep(1);
                }}
                disabled={savingPassword}
              />

              <Button
                type="submit"
                variant="primary"
                size="lg"
                text="ยืนยันเปลี่ยนรหัสผ่าน"
                loading={savingPassword}
                loadingText="กำลังบันทึกรหัสผ่าน..."
                rightIcon={<CheckCircle2 className="w-4 h-4 ml-1" />}
              />
            </div>
          </form>
        )}

        {/* ========================================================= */}
        {/* STEP 3: Result Message Screen                              */}
        {/* ========================================================= */}
        {currentStep === 3 && (
          <div className="space-y-6 animate-fade-in">
            {changeSuccess ? (
              <div className="space-y-6">
                <MessageBox
                  title="เปลี่ยนรหัสผ่านสำเร็จ!"
                  text={`ระบบได้ทำการเปลี่ยนรหัสผ่านสำหรับบัญชี "${email}" เรียบร้อยแล้ว ท่านสามารถเข้าสู่ระบบด้วยรหัสผ่านใหม่ได้ทันที`}
                  variant="success"
                  showSpinner={false}
                />

                <div className="pt-2 text-center">
                  <Link href="/u/signin">
                    <Button
                      type="button"
                      variant="primary"
                      size="lg"
                      fullWidth
                      text="ไปยังหน้าลงชื่อเข้าใช้งาน"
                      rightIcon={<ArrowRight className="w-4 h-4 ml-1" />}
                    />
                  </Link>
                </div>
              </div>
            ) : (
              <div className="space-y-6">
                <MessageBox
                  title="การเปลี่ยนรหัสผ่านไม่สำเร็จ"
                  text={changeMessage || "เกิดข้อผิดพลาดในการเปลี่ยนรหัสผ่าน กรุณาลองใหม่อีกครั้ง"}
                  variant="error"
                  showSpinner={false}
                />

                <div className="flex flex-col sm:flex-row items-center gap-3 pt-2">
                  <Button
                    type="button"
                    variant="secondary"
                    size="lg"
                    className="w-full sm:flex-1"
                    text="ลองใหม่อีกครั้ง"
                    leftIcon={<ArrowLeft className="w-4 h-4 mr-1" />}
                    onClick={() => {
                      setGeneralError("");
                      setCurrentStep(2);
                    }}
                  />

                  <Link href="/u/signin" className="w-full sm:w-auto">
                    <Button
                      type="button"
                      variant="outline"
                      size="lg"
                      className="w-full"
                      text="กลับไปยังหน้าลงชื่อเข้าใช้"
                    />
                  </Link>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Bottom Link to Signin (Visible for steps 1 and 2) */}
        {currentStep < 3 && (
          <div className="mt-8 text-center border-t border-slate-100 pt-5">
            <Link
              href="/u/signin"
              className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-medium text-slate-600 hover:text-primary transition-colors hover:underline"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>กลับไปยังหน้าลงชื่อเข้าใช้งาน</span>
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}

// Aliases for compatibility
export const ForgotPassword = ForgotPasswordForm;
export const ForgotPassowrdForm = ForgotPasswordForm;
export const ForgotPassowrd = ForgotPasswordForm;
export default ForgotPasswordForm;
