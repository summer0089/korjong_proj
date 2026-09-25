import React from "react";
import type { Metadata } from "next";
import ChangePasswordForm from "@/components/forms/user/ChangePasswordForm";

export const metadata: Metadata = {
  title: "เปลี่ยนรหัสผ่าน | Yuenyan Single Sign-On",
  description: "เปลี่ยนรหัสผ่านบัญชีผู้ใช้ระบบยืนยันตัวตนรวมศูนย์เทศบาลเมืองแสนสุข",
};

export default function ChangePasswordPage() {
  return (
    <div className="min-h-[calc(100vh-140px)] flex items-center justify-center py-10 px-4 sm:px-6 lg:px-8">
      {/* Background Decorative Gradient Blobs */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 -z-10 flex items-center justify-center overflow-hidden"
      >
        <div className="w-lg h-lg rounded-full bg-amber-500/5 blur-3xl opacity-60 transform -translate-y-16" />
        <div className="w-96 h-96 rounded-full bg-primary/5 blur-3xl opacity-50 transform translate-x-32 translate-y-24" />
      </div>

      <main className="w-full flex items-center justify-center">
        <ChangePasswordForm />
      </main>
    </div>
  );
}
