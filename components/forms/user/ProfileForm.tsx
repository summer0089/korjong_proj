"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { EmployeeProfileSchema } from "@/utils/validation/profile_form/schema";
import { TextBox } from "@/components/form_controls/TextBox";
import { SelectBox } from "@/components/form_controls/SelectBox";
import { Button } from "@/components/form_controls/Button";
import { TextAlert } from "@/components/form_controls/TextAlert";
import { ImageInput } from "@/components/form_controls/ImageInput";
import {
  ShieldCheck,
  Briefcase,
  Lock,
  KeyRound,
  CheckCircle2,
} from "lucide-react";

interface DepartmentOption {
  value: string;
  label: string;
}

interface UserProfileData {
  id: string;
  name: string;
  firstName: string;
  lastName: string;
  email: string;
  role: string;
  position: string;
  phoneNumber: string;
  departmentId: string;
  departmentName: string;
  image: string | null;
}

interface FormErrors {
  firstName?: string;
  lastName?: string;
  positionName?: string;
  departmentId?: string;
  telephone?: string;
}

export default function EditProfileForm() {
  const router = useRouter();

  // Profile data states
  const [profile, setProfile] = useState<UserProfileData | null>(null);
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [positionName, setPositionName] = useState("");
  const [departmentId, setDepartmentId] = useState("");
  const [telephone, setTelephone] = useState("");
  const [currentImage, setCurrentImage] = useState<string | null>(null);
  const [newAvatarBase64, setNewAvatarBase64] = useState<string | null>(null);

  // Department options state
  const [departments, setDepartments] = useState<DepartmentOption[]>([]);

  // Status & Feedback states
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<FormErrors>({});
  const [generalError, setGeneralError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  // 1. โหลดข้อมูลส่วนตัวและหน่วยงานเมื่อเปิดหน้า
  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true);

        // โหลดข้อมูลส่วนตัวของผู้ใช้งานปัจจุบัน
        const sessionRes = await fetch("/api/auth/session/get");
        const sessionJson = await sessionRes.json();

        if (!sessionJson.isLoggedIn || !sessionJson.user) {
          router.push("/u/signin");
          return;
        }

        const profileRes = await fetch(`/api/user/get/${sessionJson.user.id}`);
        const profileJson = await profileRes.json();

        if (!profileRes.ok || !profileJson.success) {
          // ถ้ายังไม่ได้เข้าสู่ระบบ
          router.push("/u/signin");
          return;
        }

        const data: UserProfileData = profileJson.data;
        setProfile(data);
        setFirstName(data.firstName || "");
        setLastName(data.lastName || "");
        setPositionName(data.position || "");
        setDepartmentId(data.departmentId || "");
        setTelephone(data.phoneNumber || "");
        setCurrentImage(data.image || null);

        // Fetch department list
        const deptRes = await fetch("/api/department/get");
        const deptJson = await deptRes.json();
        if (deptJson.success && Array.isArray(deptJson.data)) {
          setDepartments(
            deptJson.data.map((d: { id: string; name: string }) => ({
              value: d.id,
              label: d.name,
            }))
          );
        }
      } catch (err) {
        console.error("Failed to load user profile:", err);
        setGeneralError("ไม่สามารถโหลดข้อมูลผู้ใช้งานได้ กรุณาลองใหม่อีกครั้ง");
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, [router]);

  // 2. จัดการการปรับปรุงชุดข้อมูลของผู้ใช้งาน
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setGeneralError("");
    setSuccessMessage("");
    setErrors({});

    let activeImage = currentImage;

    try {
      setSaving(true);

      // เตรียมชุดข้อมูลที่รับค่ามาจากผู้ใช้งาน
      const payload = {
        firstName,
        lastName,
        positionName,
        departmentId,
        telephone,
        image: activeImage,
      };

      // ตรวจสอบความถูกต้องของชุดข้อมูลที่รับค่ามาจากผู้ใช้งาน
      const validation = EmployeeProfileSchema.safeParse(payload);
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

      // ปรับปรุงข้อมูลผู้ใช้งานในฐานข้อมูล
      const res = await fetch("/api/user/update/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const resJson = await res.json();
      if (!res.ok || !resJson.success) {
        setGeneralError(resJson.message || "เกิดข้อผิดพลาดในการบันทึกข้อมูล");
        return;
      }

      // อัปโหลดรูปภาพเมื่อดำเนินการปรับปรุงชุดข้อมูลในฐานข้อมูลเรียบร้อยแล้ว
      if (newAvatarBase64) {
        const uploadRes = await fetch("/api/user/update/profile/image", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ imageBase64: newAvatarBase64 }),
        });

        const uploadJson = await uploadRes.json();
        if (!uploadRes.ok || !uploadJson.success) {
          throw new Error(uploadJson.message || "อัปโหลดรูปภาพไม่สำเร็จ");
        }

        activeImage = uploadJson.imageUrl;
        setCurrentImage(activeImage);
        setNewAvatarBase64(null);
      }

      // ปรับปรุง state ภายในหน้าให้ตรงกับข้อมูลที่บันทึกล่าสุด
      setProfile((prev) =>
        prev
          ? {
              ...prev,
              firstName,
              lastName,
              position: positionName,
              departmentId,
              phoneNumber: telephone,
              image: activeImage,
            }
          : prev
      );

      setSuccessMessage("บันทึกการแก้ไขข้อมูลส่วนตัวสำเร็จเรียบร้อยแล้ว");

      // ส่งสัญญาณให้ Navbar อัปเดตข้อมูลผู้ใช้งานและรูปโปรไฟล์ทันที
      if (typeof window !== "undefined") {
        window.dispatchEvent(new Event("korjong-auth-change"));
      }
    } catch (err: unknown) {
      console.error("Failed to save profile:", err);
      const msg =
        err instanceof Error
          ? err.message
          : "ไม่สามารถเชื่อมต่อกับเซิร์ฟเวอร์ได้ กรุณาลองใหม่อีกครั้ง";
      setGeneralError(msg);
    } finally {
      setSaving(false);
    }
  };

  // Loading skeleton
  if (loading) {
    return (
      <div className="w-full max-w-3xl mx-auto p-6 sm:p-10 bg-white rounded-3xl border border-slate-200 shadow-xl animate-pulse">
        <div className="h-8 bg-slate-200 rounded-lg w-1/3 mb-6" />
        <div className="flex items-center gap-6 mb-8">
          <div className="w-24 h-24 rounded-full bg-slate-200" />
          <div className="space-y-3 flex-1">
            <div className="h-4 bg-slate-200 rounded w-1/4" />
            <div className="h-4 bg-slate-200 rounded w-1/2" />
          </div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="h-12 bg-slate-200 rounded-xl" />
          <div className="h-12 bg-slate-200 rounded-xl" />
          <div className="h-12 bg-slate-200 rounded-xl" />
          <div className="h-12 bg-slate-200 rounded-xl" />
        </div>
      </div>
    );
  }

  const initialChar = (firstName?.[0] || profile?.name?.[0] || "U").toUpperCase();

  return (
    <div className="w-full max-w-3xl mx-auto transition-all duration-300">
      <div className="bg-white rounded-3xl border border-slate-200/90 shadow-xl shadow-slate-200/50 p-6 sm:p-10 backdrop-blur-sm">
        {/* Form Header */}
        <div className="border-b border-slate-100 pb-6 mb-8">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900">
                แก้ไขข้อมูลส่วนตัว
              </h1>
              <p className="text-xs sm:text-sm text-slate-500 mt-1">
                จัดการข้อมูลโปรไฟล์ สังกัดหน่วยงาน และรูปประจำตัวของคุณ
              </p>
            </div>

            {/* Role Badge */}
            {profile?.role && (
              <div className="px-3.5 py-1.5 rounded-xl bg-slate-100 border border-slate-200 text-xs font-medium text-slate-700 flex items-center gap-1.5">
                <Briefcase className="w-3.5 h-3.5 text-primary" />
                <span>สิทธิ์การใช้งาน: </span>
                <strong className="text-slate-900 font-semibold">
                  {profile.role.toUpperCase() === "ADMIN"
                    ? "ผู้ดูแลระบบ"
                    : profile.role.toUpperCase() === "APPROVER"
                    ? "ผู้อนุมัติ"
                    : "ผู้ใช้งานทั่วไป"}
                </strong>
              </div>
            )}
          </div>
        </div>

        {/* Feedback Alerts */}
        {generalError && (
          <TextAlert
            text={generalError}
            variant="error"
            className="mb-6 shadow-2xs"
            onClose={() => setGeneralError("")}
          />
        )}

        {successMessage && (
          <TextAlert
            text={successMessage}
            variant="success"
            className="mb-6 shadow-2xs"
            onClose={() => setSuccessMessage("")}
          />
        )}

        {/* ========================================================================= */}
        {/* SECTION 1: Avatar Image Input (100x100 px auto-resize & preview) */}
        {/* ========================================================================= */}
        <ImageInput
          currentImage={currentImage}
          value={newAvatarBase64}
          fallbackText={initialChar}
          disabled={saving}
          onChange={(resizedBase64) => {
            setNewAvatarBase64(resizedBase64);
            setGeneralError("");
          }}
          onError={(msg) => setGeneralError(msg)}
        />

        {/* ========================================================================= */}
        {/* SECTION 2: Profile Form Fields */}
        {/* ========================================================================= */}
        <form noValidate onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            {/* First Name */}
            <div>
              <TextBox
                id="firstName"
                name="firstName"
                label="ชื่อจริง"
                placeholder="กรอกชื่อจริง"
                value={firstName}
                error={errors.firstName}
                onChange={(e) => {
                  setFirstName(e.target.value);
                  if (errors.firstName) {
                    setErrors((prev) => ({ ...prev, firstName: undefined }));
                  }
                }}
                disabled={saving}
              />
            </div>

            {/* Last Name */}
            <div>
              <TextBox
                id="lastName"
                name="lastName"
                label="นามสกุล"
                placeholder="กรอกนามสกุล"
                value={lastName}
                error={errors.lastName}
                onChange={(e) => {
                  setLastName(e.target.value);
                  if (errors.lastName) {
                    setErrors((prev) => ({ ...prev, lastName: undefined }));
                  }
                }}
                disabled={saving}
              />
            </div>

            {/* Position */}
            <div>
              <TextBox
                id="positionName"
                name="positionName"
                label="ตำแหน่งงาน"
                placeholder="เช่น นักวิชาการคอมพิวเตอร์"
                value={positionName}
                error={errors.positionName}
                onChange={(e) => {
                  setPositionName(e.target.value);
                  if (errors.positionName) {
                    setErrors((prev) => ({ ...prev, positionName: undefined }));
                  }
                }}
                disabled={saving}
              />
            </div>

            {/* Telephone */}
            <div>
              <TextBox
                id="telephone"
                name="telephone"
                label="หมายเลขโทรศัพท์"
                placeholder="เช่น 0812345678"
                value={telephone}
                error={errors.telephone}
                onChange={(e) => {
                  setTelephone(e.target.value);
                  if (errors.telephone) {
                    setErrors((prev) => ({ ...prev, telephone: undefined }));
                  }
                }}
                disabled={saving}
              />
            </div>

            {/* Department (Full row or 2-col) */}
            <div className="sm:col-span-2">
              <SelectBox
                id="departmentId"
                name="departmentId"
                label="หน่วยงานที่สังกัด"
                placeholder="-- เลือกหน่วยงานที่สังกัด --"
                value={departmentId}
                options={departments}
                error={errors.departmentId}
                onChange={(e) => {
                  setDepartmentId(e.target.value);
                  if (errors.departmentId) {
                    setErrors((prev) => ({ ...prev, departmentId: undefined }));
                  }
                }}
                disabled={saving}
              />
            </div>

            {/* Email (Read-Only) */}
            <div className="sm:col-span-2">
              <div className="relative">
                <TextBox
                  id="email"
                  name="email"
                  label="อีเมลบัญชีผู้ใช้ (ไม่สามารถแก้ไขได้)"
                  value={profile?.email || ""}
                  disabled={true}
                  className="bg-slate-100 text-slate-500 cursor-not-allowed pl-10"
                />
                <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-9.5 pointer-events-none" />
              </div>
              <p className="text-[11px] text-slate-400 mt-1.5">
                อีเมลใช้สำหรับยืนยันตัวตนในระบบ หากต้องการเปลี่ยนอีเมล กรุณาติดต่อผู้ดูแลระบบ
              </p>
            </div>
          </div>

          {/* Submit Button */}
          <div className="pt-2 flex flex-col sm:flex-row items-center justify-end gap-3 border-t border-slate-100">
            <Button
              type="submit"
              variant="primary"
              size="md"
              text="บันทึกการแก้ไขข้อมูล"
              icon={<CheckCircle2 className="w-4 h-4" />}
              loading={saving}
              loadingText="กำลังบันทึกข้อมูล..."
              className="w-full sm:w-auto shadow-md"
            />
          </div>
        </form>

        {/* ========================================================================= */}
        {/* SECTION 3: Separate Change Password Link (Requirement 3) */}
        {/* ========================================================================= */}
        <div className="mt-10 pt-8 border-t border-slate-200/80">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-5 rounded-2xl bg-amber-50/50 border border-amber-200/60">
            <div className="flex items-start gap-3.5">
              <div className="p-2.5 rounded-xl bg-amber-100 text-amber-800 shrink-0 mt-0.5">
                <KeyRound className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900">
                  ความปลอดภัยและรหัสผ่าน (Account Security)
                </h3>
                <p className="text-xs text-slate-600 mt-0.5 leading-relaxed">
                  ฟังก์ชันการเปลี่ยนรหัสผ่านถูกแยกออกเป็นหน้าต่างหากเพื่อความปลอดภัยระดับสูงสุด
                </p>
              </div>
            </div>

            <Link href="/u/change-password" className="shrink-0 w-full sm:w-auto">
              <Button
                type="button"
                variant="outline"
                size="sm"
                text="เปลี่ยนรหัสผ่าน"
                icon={<KeyRound className="w-3.5 h-3.5 text-amber-600" />}
                className="w-full sm:w-auto border-amber-300 text-amber-900 hover:bg-amber-100"
              />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
