"use client";

import React, { useState, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { ShieldCheck, LogIn, ArrowRight } from "lucide-react";
import { signinSchema } from "@/utils/validation/signin_form/schema";
import { TextBox } from "@/components/form_controls/TextBox";
import { PasswordBox } from "@/components/form_controls/PasswordBox";
import { CheckBox } from "@/components/form_controls/CheckBox";
import { Button } from "@/components/form_controls/Button";
import { TextAlert } from "@/components/form_controls/TextAlert";
import { MessageBox } from "@/components/form_controls/MessageBox";

interface FieldErrors {
  email?: string;
  password?: string;
}

function SigninFormContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl");

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [generalError, setGeneralError] = useState("");
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setGeneralError("");
    setFieldErrors({});

    const result = signinSchema.safeParse({
      email,
      password,
      rememberMe,
    });

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

    setLoading(true);

    try {
      const res = await fetch("/api/auth/signin", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: email.trim(),
          password,
          rememberMe,
        }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        setGeneralError(data.message || "เกิดข้อผิดพลาดในการเข้าสู่ระบบ กรุณาลองใหม่อีกครั้ง");
        setLoading(false);
        return;
      }

      // เข้าสู่ระบบสำเร็จ
      setSuccess(true);
      setLoading(false);

      // แจ้งเตือน Navbar และคอมโพเนนต์อื่นว่าสถานะ Auth มีการเปลี่ยนแปลง
      if (typeof window !== "undefined") {
        window.dispatchEvent(new Event("korjong-auth-change"));
      }

      // นำทางไปยัง callbackUrl หรือหน้าหลัก
      const target =
        callbackUrl &&
        !callbackUrl.startsWith("/u/signin") &&
        !callbackUrl.startsWith("/u/signup")
          ? callbackUrl
          : "/";

      setTimeout(() => {
        router.push(target);
        router.refresh();
      }, 1000);
    } catch (err: unknown) {
      console.error("Sign in error:", err);
      setGeneralError("ไม่สามารถเชื่อมต่อกับเซิร์ฟเวอร์ได้ กรุณาลองใหม่อีกครั้ง");
      setLoading(false);
    }
  };

  return (
    <div className="my-auto max-w-md w-full mx-auto">
      {success ? (
        /* Success Animation and Message */
        <MessageBox
          title="ลงชื่อเข้าใช้งานสำเร็จ!"
          text="ยินดีต้อนรับเข้าสู่ระบบ ขณะนี้ระบบกำลังนำทางคุณไปยังหน้าหลัก..."
          variant="success"
          showSpinner={true}
        />
      ) : (
        /* Main Form */
        <div>
          {/* Tag & Heading */}
          <div className="mb-6 sm:mb-8">
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-text mb-2 font-sans">
              ลงชื่อเข้าใช้งานระบบ
            </h1>
            <p className="text-sm text-text-secondary leading-relaxed">
              กรุณากรอกบัญชีอีเมลและรหัสผ่าน เพื่อเข้าใช้งานระบบจองห้องประชุม
            </p>
          </div>

          {generalError && (
            <TextAlert
              text={generalError}
              variant="error"
              className="mb-5"
            />
          )}

          {/* Form Elements */}
          <form noValidate onSubmit={handleSignIn} className="space-y-4 sm:space-y-5">
            <TextBox
              id="email"
              name="email"
              type="text"
              label="อีเมลบัญชีผู้ใช้"
              placeholder="example@domain.com"
              value={email}
              error={fieldErrors.email}
              onChange={(e) => {
                setEmail(e.target.value);
                if (fieldErrors.email) {
                  setFieldErrors((prev) => ({ ...prev, email: undefined }));
                }
              }}
              disabled={loading}
            />

            <PasswordBox
              id="password"
              name="password"
              label="รหัสผ่านของท่าน"
              placeholder="กรอกรหัสผ่านของคุณ"
              value={password}
              error={fieldErrors.password}
              onChange={(e) => {
                setPassword(e.target.value);
                if (fieldErrors.password) {
                  setFieldErrors((prev) => ({ ...prev, password: undefined }));
                }
              }}
              disabled={loading}
            />

            {/* Keep signed in & Forgot password link */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pt-0.5">
              <CheckBox
                id="remember-me"
                name="remember-me"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                label="จดจำการใช้งานในอุปกรณ์นี้"
                disabled={loading}
              />
              <Link
                href="/u/forgot_password"
                className="text-xs sm:text-sm text-primary-600 hover:text-primary-700 font-medium transition-colors hover:underline shrink-0"
              >
                ลืมรหัสผ่าน?
              </Link>
            </div>

            {/* Sign In Button */}
            <Button
              type="submit"
              loading={loading}
              loadingText="กำลังตรวจสอบข้อมูล..."
              fullWidth
              variant="primary"
              size="md"
              icon={<LogIn className="w-4 h-4" />}
              iconPosition="left"
              text="เข้าสู่ระบบ"
              className="mt-2 py-3 text-base font-semibold shadow-sm hover:shadow-md transition-all active:scale-[0.99]"
            />
          </form>

          {/* Registration banner */}
          <div className="mt-8 pt-5 border-t border-border flex flex-col sm:flex-row items-center justify-between gap-3 text-xs sm:text-sm text-text-secondary">
            <span>ยังไม่มีบัญชีผู้ใช้งานใช่หรือไม่?</span>
            <Link
              href="/u/signup"
              className="inline-flex items-center text-primary-600 hover:text-primary-700 font-semibold transition-colors hover:underline group"
            >
              <span>ลงทะเบียนใช้งานใหม่</span>
              <ArrowRight className="w-3.5 h-3.5 ml-1 group-hover:translate-x-0.5 transition-transform" />
            </Link>
          </div>

          {/* Security badge footer */}
          <div className="mt-6 flex items-center justify-center gap-1.5 text-xs text-text-muted">
            <ShieldCheck className="w-3.5 h-3.5 text-primary-600 shrink-0" />
            <span>เข้าสู่ระบบอย่างปลอดภัยด้วยการเข้ารหัสข้อมูล SSL</span>
          </div>
        </div>
      )}
    </div>
  );
}

export default function SigninForm() {
  return (
    <Suspense fallback={<div className="text-center py-8 text-text-muted">กำลังโหลดแบบฟอร์ม...</div>}>
      <SigninFormContent />
    </Suspense>
  );
}
