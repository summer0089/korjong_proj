"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { Stepper, StepItem } from "@/components/form_controls/Stepper";
import { TextBox } from "@/components/form_controls/TextBox";
import { PasswordBox } from "@/components/form_controls/PasswordBox";
import { SelectBox, SelectOption } from "@/components/form_controls/SelectBox";
import { Button } from "@/components/form_controls/Button";
import { TextAlert } from "@/components/form_controls/TextAlert";
import { MessageBox } from "@/components/form_controls/MessageBox";
import {
  emailStepSchema,
  otpStepSchema,
  EmployeeSignupSchema,
  InfoStepData,
} from "@/utils/validation/signup_form/schema";
import {
  Mail,
  ShieldCheck,
  User,
  Building2,
  Phone,
  Lock,
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  RotateCw,
  Send,
  AlertTriangle,
  UserCheck,
} from "lucide-react";

interface DepartmentItem {
  id: string;
  name: string;
}

type FieldErrors = Partial<Record<keyof InfoStepData | "email" | "otp", string>>;

export function Signup() {
  // Stepper State
  const [currentStep, setCurrentStep] = useState<number>(1);

  // Step 1: Email & OTP State
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [otpToken, setOtpToken] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [sendingOtp, setSendingOtp] = useState(false);
  const [verifyingOtp, setVerifyingOtp] = useState(false);
  const [emailVerified, setEmailVerified] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);

  // Step 2: User Info State
  const [formData, setFormData] = useState<InfoStepData>({
    firstName: "",
    lastName: "",
    position: "",
    departmentId: "",
    telephone: "",
    password: "",
    confirmPassword: "",
  });

  // Departments List
  const [departments, setDepartments] = useState<SelectOption[]>([]);
  const [loadingDepartments, setLoadingDepartments] = useState(true);

  // General & Field Errors
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [generalError, setGeneralError] = useState("");
  const [generalSuccess, setGeneralSuccess] = useState("");

  // Step 3 & 4: Registration State
  const [isRegistering, setIsRegistering] = useState(false);
  const [registrationSuccess, setRegistrationSuccess] = useState<boolean | null>(null);
  const [registrationMessage, setRegistrationMessage] = useState("");

  // Stepper definition
  const steps: StepItem[] = [
    { title: "ยืนยันอีเมล", description: "รับรหัส OTP" },
    { title: "ข้อมูลผู้ใช้", description: "ข้อมูลและรหัสผ่าน" },
    { title: "ตรวจสอบ", description: "ยืนยันความถูกต้อง" },
    { title: "เสร็จสิ้น", description: "ผลการลงทะเบียน" },
  ];

  // Fetch departments for dropdown
  useEffect(() => {
    let isMounted = true;
    async function fetchDepartments() {
      try {
        const res = await fetch("/api/department/get");
        const json = await res.json();
        if (json.success && Array.isArray(json.data) && isMounted) {
          const options: SelectOption[] = json.data.map((d: DepartmentItem) => ({
            value: d.id,
            label: d.name,
          }));
          setDepartments(options);
        }
      } catch (err) {
        console.error("Failed to fetch departments:", err);
      } finally {
        if (isMounted) setLoadingDepartments(false);
      }
    }

    fetchDepartments();
    return () => {
      isMounted = false;
    };
  }, []);

  // Cooldown countdown timer for resend OTP
  useEffect(() => {
    if (resendCooldown <= 0) return;
    const timer = setInterval(() => {
      setResendCooldown((prev) => prev - 1);
    }, 1000);
    return () => clearInterval(timer);
  }, [resendCooldown]);

  // Handle Form input change
  const handleInputChange = (field: keyof InfoStepData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (fieldErrors[field]) {
      setFieldErrors((prev) => ({ ...prev, [field]: undefined }));
    }
  };

  // ล้างสถานะ OTP เพื่อเปลี่ยนอีเมลใหม่
  const handleChangeEmail = () => {
    setOtpSent(false);
    setOtp("");
    setOtpToken("");
    setEmailVerified(false);
    setResendCooldown(0);
    setGeneralError("");
    setGeneralSuccess("");
    setFieldErrors((prev) => ({ ...prev, email: undefined, otp: undefined }));
  };

  // -------------------------------------------------------------
  // Step 1: Send OTP to Email
  // -------------------------------------------------------------
  const handleSendOtp = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setGeneralError("");
    setGeneralSuccess("");
    setFieldErrors((prev) => ({ ...prev, email: undefined }));

    // Validate email with Zod
    const emailResult = emailStepSchema.safeParse({ email });
    if (!emailResult.success) {
      setFieldErrors((prev) => ({
        ...prev,
        email: emailResult.error.issues[0]?.message,
      }));
      return;
    }

    setSendingOtp(true);
    try {
      const response = await fetch("/api/auth/otp/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: emailResult.data.email }),
      });

      const data = await response.json();
      if (!response.ok || !data.success) {
        setGeneralError(data.message || "ไม่สามารถส่งรหัส OTP ได้ กรุณาลองใหม่อีกครั้ง");
        return;
      }

      if (data.token) {
        setOtpToken(data.token);
      }
      setOtpSent(true);
      setOtp("");
      setResendCooldown(60);
      setGeneralSuccess(data.message || `ส่งรหัส OTP ไปยังอีเมล ${emailResult.data.email} แล้ว กรุณาตรวจสอบกล่องจดหมาย`);
    } catch (err: unknown) {
      console.error("Send OTP error:", err);
      setGeneralError("ไม่สามารถเชื่อมต่อกับเซิร์ฟเวอร์เพื่อส่ง OTP ได้");
    } finally {
      setSendingOtp(false);
    }
  };

  // -------------------------------------------------------------
  // Step 1: Verify OTP
  // -------------------------------------------------------------
  const handleVerifyOtp = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setGeneralError("");
    setGeneralSuccess("");
    setFieldErrors((prev) => ({ ...prev, otp: undefined }));

    const otpResult = otpStepSchema.safeParse({ otp });
    if (!otpResult.success) {
      setFieldErrors((prev) => ({
        ...prev,
        otp: otpResult.error.issues[0]?.message,
      }));
      return;
    }

    setVerifyingOtp(true);
    try {
      const response = await fetch("/api/auth/otp/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: email.trim(),
          otp: otpResult.data.otp,
          token: otpToken || undefined,
        }),
      });

      const data = await response.json();
      if (!response.ok || !data.success) {
        setGeneralError(data.message || "รหัส OTP ไม่ถูกต้องหรือหมดอายุ");
        return;
      }

      // Success: Proceed to Step 2
      setEmailVerified(true);
      setGeneralSuccess("");
      setCurrentStep(2);
    } catch (err: unknown) {
      console.error("Verify OTP error:", err);
      setGeneralError("ไม่สามารถเชื่อมต่อกับเซิร์ฟเวอร์เพื่อตรวจสอบ OTP ได้");
    } finally {
      setVerifyingOtp(false);
    }
  };

  // -------------------------------------------------------------
  // Step 2: Validate User Info & Proceed to Step 3
  // -------------------------------------------------------------
  const handleProceedToReview = (e: React.FormEvent) => {
    e.preventDefault();
    setGeneralError("");
    setFieldErrors({});

    const result = EmployeeSignupSchema.safeParse(formData);
    if (!result.success) {
      const errors: FieldErrors = {};
      for (const issue of result.error.issues) {
        const field = issue.path[0] as keyof FieldErrors;
        if (field && !errors[field]) {
          errors[field] = issue.message;
        }
      }
      setFieldErrors(errors);
      return;
    }

    // Success: Advance to Step 3 (Review)
    setCurrentStep(3);
  };

  // -------------------------------------------------------------
  // Step 3: Confirm Registration via API
  // -------------------------------------------------------------
  const handleConfirmRegister = async () => {
    setGeneralError("");
    setIsRegistering(true);

    try {
      const response = await fetch("/api/user/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email,
          firstName: formData.firstName,
          lastName: formData.lastName,
          position: formData.position,
          departmentId: formData.departmentId,
          telephone: formData.telephone,
          password: formData.password,
        }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        setRegistrationSuccess(false);
        setRegistrationMessage(data.message || "เกิดข้อผิดพลาดในการลงทะเบียน");
        setCurrentStep(4);
        return;
      }

      // Registration Succeeded!
      setRegistrationSuccess(true);
      setRegistrationMessage(data.message || "ลงทะเบียนผู้ใช้งานสำเร็จ");
      setCurrentStep(4);
    } catch (err: unknown) {
      console.error("Register error:", err);
      setRegistrationSuccess(false);
      setRegistrationMessage("ไม่สามารถเชื่อมต่อกับเซิร์ฟเวอร์ได้ กรุณาลองใหม่อีกครั้ง");
      setCurrentStep(4);
    } finally {
      setIsRegistering(false);
    }
  };

  // Helper to find department name
  const selectedDepartment = departments.find((d) => d.value === formData.departmentId);

  return (
    <div className="w-full max-w-xl sm:max-w-2xl mx-auto my-auto transition-all duration-300">
      <div className="bg-white rounded-2xl sm:rounded-3xl border border-slate-200/90 shadow-xl shadow-slate-200/40 p-6 sm:p-10 transition-all">
        {/* Top Header & Branding */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary-50 text-primary-600 border border-primary-200 text-xs font-semibold mb-3 tracking-wide shadow-2xs">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Korjong : ระบบจองห้องประชุมออนไลน์ เทศบาลเมืองแสนสุข</span>
          </div>

          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 font-sans">
            ลงทะเบียนผู้ใช้งานระบบ
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1.5 max-w-md mx-auto leading-relaxed">
            ลงทะเบียนบัญชีสำหรับระบบจองห้องประชุมออนไลน์ เทศบาลเมืองแสนสุข
          </p>
        </div>

        {/* Stepper Progress Bar */}
        <div className="mb-8 pb-6 border-b border-slate-100">
          <Stepper
            steps={steps}
            currentStep={currentStep}
            allowClickPrevious={currentStep < 4}
            onStepClick={(targetStep) => {
              if (targetStep < currentStep && currentStep < 4) {
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
            className="mb-6 shadow-2xs"
            onClose={() => setGeneralError("")}
          />
        )}

        {generalSuccess && (
          <TextAlert
            text={generalSuccess}
            variant="success"
            className="mb-6 shadow-2xs"
            onClose={() => setGeneralSuccess("")}
          />
        )}

        {/* ========================================================= */}
        {/* STEP 1: Email Input & OTP Verification                     */}
        {/* ========================================================= */}
        {currentStep === 1 && (
          <div className="space-y-6 animate-fade-in">
            <div className="bg-slate-50 border border-slate-200/70 rounded-xl p-4 sm:p-5">
              <div className="flex items-start gap-3">
                <div className="p-2 rounded-lg bg-primary-50 text-primary-600 shrink-0">
                  <Mail className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-sm font-bold text-slate-900">
                    ขั้นตอนที่ 1: ตรวจสอบและยืนยันอีเมลของคุณ
                  </h2>
                  <p className="text-xs text-slate-500 mt-0.5 leading-relaxed">
                    ระบบจะส่งรหัส OTP 6 หลักไปยังอีเมลที่ระบุผ่านระบบอีเมลความปลอดภัย (SMTP) เพื่อยืนยันความเป็นเจ้าของบัญชี
                  </p>
                </div>
              </div>
            </div>

            {/* If email is already verified */}
            {emailVerified ? (
              <div className="space-y-4 animate-fade-in">
                <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2.5">
                    <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                    <div>
                      <div className="text-xs font-semibold text-emerald-900">อีเมลได้รับการยืนยันแล้ว</div>
                      <div className="text-xs font-mono font-medium text-emerald-700">{email}</div>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={handleChangeEmail}
                    className="text-xs text-slate-600 hover:text-slate-900 underline font-medium cursor-pointer"
                  >
                    เปลี่ยนอีเมล
                  </button>
                </div>

                <div className="pt-2">
                  <Button
                    type="button"
                    variant="primary"
                    size="lg"
                    fullWidth
                    text="ถัดไป: กรอกข้อมูลผู้ใช้"
                    rightIcon={<ArrowRight className="w-4 h-4 ml-1" />}
                    onClick={() => {
                      setGeneralError("");
                      setCurrentStep(2);
                    }}
                  />
                </div>
              </div>
            ) : (
              /* Email Form & OTP verification */
              <form onSubmit={!otpSent ? handleSendOtp : handleVerifyOtp} noValidate className="space-y-4">
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label htmlFor="signup-email" className="block text-xs font-semibold text-text">
                      อีเมลสำหรับลงทะเบียน
                    </label>
                    {otpSent && (
                      <button
                        type="button"
                        onClick={handleChangeEmail}
                        className="text-2xs text-primary-600 hover:underline font-medium cursor-pointer"
                      >
                        เปลี่ยนอีเมล
                      </button>
                    )}
                  </div>
                  <TextBox
                    id="signup-email"
                    name="email"
                    type="email"
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
                </div>

                {!otpSent ? (
                  <div className="pt-2">
                    <Button
                      type="submit"
                      variant="primary"
                      size="lg"
                      fullWidth
                      text="ขอรับรหัส OTP"
                      loading={sendingOtp}
                      loadingText="กำลังส่งรหัส OTP..."
                      rightIcon={<Send className="w-4 h-4 ml-1" />}
                    />
                  </div>
                ) : (
                  <div className="space-y-4 pt-2 border-t border-slate-100 animate-fade-in">
                    {/* OTP Input Box */}
                    <div>
                      <TextBox
                        id="signup-otp"
                        name="otp"
                        type="text"
                        label="รหัสยืนยันตัวตน OTP (6 หลัก)"
                        placeholder="กรอกรหัส 6 หลักที่ได้รับในอีเมล"
                        value={otp}
                        maxLength={6}
                        autoFocus
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
                    </div>

                    <div className="flex flex-col sm:flex-row items-center gap-3">
                      <Button
                        type="submit"
                        variant="primary"
                        size="lg"
                        className="w-full sm:flex-1"
                        text="ยืนยันรหัส OTP"
                        loading={verifyingOtp}
                        loadingText="กำลังตรวจสอบรหัส..."
                        rightIcon={<CheckCircle2 className="w-4 h-4 ml-1" />}
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
            )}
          </div>
        )}

        {/* ========================================================= */}
        {/* STEP 2: User Information & Password                       */}
        {/* ========================================================= */}
        {currentStep === 2 && (
          <form onSubmit={handleProceedToReview} noValidate className="space-y-5 animate-fade-in">
            {/* Header info */}
            <div className="bg-slate-50 border border-slate-200/70 rounded-xl p-4">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <div className="flex items-center gap-2">
                  <User className="w-4 h-4 text-primary" />
                  <span className="text-xs font-semibold text-slate-700">อีเมลที่ยืนยันแล้ว:</span>
                  <span className="text-xs font-bold text-primary">{email}</span>
                </div>
                <div className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                  <CheckCircle2 className="w-3 h-3" />
                  <span>ยืนยันเรียบร้อย</span>
                </div>
              </div>
            </div>

            {/* Name fields */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <TextBox
                id="firstName"
                name="firstName"
                label="ชื่อจริง"
                placeholder="เช่น สมชาย"
                value={formData.firstName}
                error={fieldErrors.firstName}
                onChange={(e) => handleInputChange("firstName", e.target.value)}
              />

              <TextBox
                id="lastName"
                name="lastName"
                label="นามสกุล"
                placeholder="เช่น ใจดี"
                value={formData.lastName}
                error={fieldErrors.lastName}
                onChange={(e) => handleInputChange("lastName", e.target.value)}
              />
            </div>

            {/* Position and Phone */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <TextBox
                id="position"
                name="position"
                label="ตำแหน่งงาน"
                placeholder="เช่น นักวิชาการคอมพิวเตอร์"
                value={formData.position}
                error={fieldErrors.position}
                onChange={(e) => handleInputChange("position", e.target.value)}
              />

              <TextBox
                id="telephone"
                name="telephone"
                type="tel"
                label="หมายเลขโทรศัพท์"
                placeholder="เช่น 0812345678"
                minLength={9}
                maxLength={10}
                value={formData.telephone}
                error={fieldErrors.telephone}
                onChange={(e) => handleInputChange("telephone", e.target.value)}
              />
            </div>

            {/* Department Selection */}
            <div>
              <SelectBox
                id="departmentId"
                name="departmentId"
                label="สังกัดหน่วยงานภายใน"
                placeholder={
                  loadingDepartments
                    ? "กำลังโหลดรายชื่อหน่วยงาน..."
                    : "กรุณาเลือกหน่วยงานที่สังกัด"
                }
                options={departments}
                value={formData.departmentId}
                error={fieldErrors.departmentId}
                onChange={(e) => handleInputChange("departmentId", e.target.value)}
                disabled={loadingDepartments}
              />
            </div>

            {/* Password and Confirm Password */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <PasswordBox
                id="password"
                name="password"
                label="ตั้งรหัสผ่าน"
                placeholder="อย่างน้อย 8 ตัวอักษร"
                value={formData.password}
                error={fieldErrors.password}
                onChange={(e) => handleInputChange("password", e.target.value)}
              />

              <PasswordBox
                id="confirmPassword"
                name="confirmPassword"
                label="ยืนยันรหัสผ่าน"
                placeholder="กรอกรหัสผ่านซ้ำอีกครั้ง"
                value={formData.confirmPassword}
                error={fieldErrors.confirmPassword}
                onChange={(e) => handleInputChange("confirmPassword", e.target.value)}
              />
            </div>

            {/* Buttons Row */}
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
              />

              <Button
                type="submit"
                variant="primary"
                size="lg"
                text="ถัดไป: ตรวจสอบข้อมูล"
                rightIcon={<ArrowRight className="w-4 h-4 ml-1" />}
              />
            </div>
          </form>
        )}

        {/* ========================================================= */}
        {/* STEP 3: Review Information & Submit                       */}
        {/* ========================================================= */}
        {currentStep === 3 && (
          <div className="space-y-6 animate-fade-in">
            <div className="bg-slate-50 border border-slate-200/70 rounded-xl p-4">
              <div className="flex items-center gap-2 text-slate-800">
                <UserCheck className="w-5 h-5 text-primary" />
                <h2 className="text-sm font-bold">
                  ขั้นตอนที่ 3: ตรวจสอบความถูกต้องของข้อมูลก่อนบันทึก
                </h2>
              </div>
              <p className="text-xs text-slate-500 mt-1">
                โปรดตรวจสอบข้อมูลของท่านให้ครบถ้วนถูกต้อง เมื่อยืนยันระบบจะสร้างบัญชีผู้ใช้ในฐานข้อมูลทันที
              </p>
            </div>

            {/* Summary Details Card */}
            <div className="divide-y divide-slate-100 border rounded-xl overflow-hidden bg-white text-xs sm:text-sm">
              <div className="p-3.5 sm:p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-1 bg-slate-50/50">
                <span className="text-slate-500 font-medium flex items-center gap-1.5">
                  <Mail className="w-3.5 h-3.5 text-primary" /> อีเมลบัญชีผู้ใช้
                </span>
                <span className="font-semibold text-slate-900 flex items-center gap-2">
                  {email}
                  <span className="text-2xs bg-emerald-100 text-emerald-800 px-1.5 py-0.5 rounded font-bold">
                    ยืนยันแล้ว
                  </span>
                </span>
              </div>

              <div className="p-3.5 sm:p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                <span className="text-slate-500 font-medium flex items-center gap-1.5">
                  <User className="w-3.5 h-3.5 text-primary" /> ชื่อ-นามสกุล
                </span>
                <span className="font-semibold text-slate-900">
                  {formData.firstName} {formData.lastName}
                </span>
              </div>

              <div className="p-3.5 sm:p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-1 bg-slate-50/50">
                <span className="text-slate-500 font-medium flex items-center gap-1.5">
                  <Building2 className="w-3.5 h-3.5 text-primary" /> หน่วยงานที่สังกัด
                </span>
                <span className="font-semibold text-slate-900">
                  {selectedDepartment?.label || "ไม่ได้ระบุ"}
                </span>
              </div>

              <div className="p-3.5 sm:p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                <span className="text-slate-500 font-medium flex items-center gap-1.5">
                  <UserCheck className="w-3.5 h-3.5 text-primary" /> ตำแหน่งงาน
                </span>
                <span className="font-semibold text-slate-900">
                  {formData.position}
                </span>
              </div>

              <div className="p-3.5 sm:p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-1 bg-slate-50/50">
                <span className="text-slate-500 font-medium flex items-center gap-1.5">
                  <Phone className="w-3.5 h-3.5 text-primary" /> หมายเลขโทรศัพท์
                </span>
                <span className="font-semibold text-slate-900">
                  {formData.telephone}
                </span>
              </div>

              <div className="p-3.5 sm:p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                <span className="text-slate-500 font-medium flex items-center gap-1.5">
                  <Lock className="w-3.5 h-3.5 text-primary" /> รหัสผ่าน
                </span>
                <span className="font-mono text-slate-400 font-bold">
                  ••••••••••••
                </span>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center justify-between gap-3 pt-2">
              <Button
                type="button"
                variant="secondary"
                size="lg"
                text="ย้อนกลับไปแก้ไข"
                leftIcon={<ArrowLeft className="w-4 h-4 mr-1" />}
                onClick={() => {
                  setGeneralError("");
                  setCurrentStep(2);
                }}
                disabled={isRegistering}
              />

              <Button
                type="button"
                variant="primary"
                size="lg"
                text="ยืนยันการลงทะเบียน"
                loading={isRegistering}
                loadingText="กำลังบันทึกข้อมูล..."
                rightIcon={<CheckCircle2 className="w-4 h-4 ml-1" />}
                onClick={handleConfirmRegister}
              />
            </div>
          </div>
        )}

        {/* ========================================================= */}
        {/* STEP 4: Registration Result (Success or Failure)           */}
        {/* ========================================================= */}
        {currentStep === 4 && (
          <div className="space-y-6 animate-fade-in">
            {registrationSuccess ? (
              <div className="space-y-6">
                <MessageBox
                  title="ลงทะเบียนบัญชีผู้ใช้สำเร็จ!"
                  text={`ระบบได้สร้างบัญชีผู้ใช้งานสำหรับ "${email}" ในฐานข้อมูลเรียบร้อยแล้ว ท่านสามารถเข้าสู่ระบบและเริ่มใช้งานระบบบริการดิจิทัลทั้งหมดของเทศบาลเมืองแสนสุขได้ทันที`}
                  variant="success"
                  showSpinner={false}
                />

                <div className="p-4 bg-emerald-50/70 border border-emerald-100 rounded-xl text-xs text-emerald-800 space-y-1.5">
                  <div className="font-bold flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>ข้อมูลเข้าสู่ระบบของคุณ:</span>
                  </div>
                  <p>อีเมล: <strong className="font-mono text-emerald-950">{email}</strong></p>
                  <p>ชื่อผู้ใช้: <strong className="text-emerald-950">{formData.firstName} {formData.lastName}</strong></p>
                  <p>สังกัด: <strong className="text-emerald-950">{selectedDepartment?.label}</strong></p>
                </div>

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
                  title="การลงทะเบียนไม่สำเร็จ"
                  text={registrationMessage || "เกิดข้อผิดพลาดในการบันทึกข้อมูลลงฐานข้อมูล กรุณาลองใหม่อีกครั้ง"}
                  variant="error"
                  showSpinner={false}
                />

                <div className="p-4 bg-rose-50/60 border border-rose-100 rounded-xl text-xs text-rose-800 flex items-start gap-2">
                  <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                  <div>
                    <p className="font-bold">คำแนะนำ:</p>
                    <p className="mt-0.5">โปรดตรวจสอบว่าอีเมลนี้ยังไม่ได้ลงทะเบียนในระบบ หรือลองคลิก &ldquo;ย้อนกลับไปตรวจสอบข้อมูล&rdquo; เพื่อตรวจสอบความถูกต้องอีกครั้ง</p>
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row items-center gap-3 pt-2">
                  <Button
                    type="button"
                    variant="secondary"
                    size="lg"
                    className="w-full sm:flex-1"
                    text="ย้อนกลับไปตรวจสอบข้อมูล"
                    leftIcon={<ArrowLeft className="w-4 h-4 mr-1" />}
                    onClick={() => {
                      setGeneralError("");
                      setCurrentStep(3);
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

        {/* Bottom Link to Signin (Visible for steps 1-3) */}
        {currentStep < 4 && (
          <div className="mt-8 text-center border-t border-slate-100 pt-5">
            <span className="text-xs sm:text-sm text-slate-500 mr-1.5">
              มีบัญชีผู้ใช้งานอยู่แล้ว?
            </span>
            <Link
              href="/u/signin"
              className="inline-flex items-center gap-1 text-xs sm:text-sm font-semibold text-primary hover:text-primary-hover hover:underline transition-colors"
            >
              <span>ลงชื่อเข้าใช้งาน</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}

// Aliases for compatibility
export const SignupForm = Signup;
export default Signup;
