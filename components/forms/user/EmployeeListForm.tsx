"use client";

import React, { useState, useEffect, useMemo } from "react";
import Image from "next/image";
import {
  DataTable,
  DataTableColumn,
  DataTableAction,
} from "@/components/form_controls/DataTable";
import { Button } from "@/components/form_controls/Button";
import { TextBox } from "@/components/form_controls/TextBox";
import { SelectBox } from "@/components/form_controls/SelectBox";
import { TextAlert } from "@/components/form_controls/TextAlert";
import {
  Users,
  Shield,
  ShieldCheck,
  ShieldAlert,
  UserCheck,
  UserX,
  Mail,
  Building2,
  Briefcase,
  RotateCcw,
  AlertTriangle,
  Ban,
  CheckCircle2,
  X,
  Plus,
  Phone,
  FileCheck2,
} from "lucide-react";

export interface UserItem {
  id: string;
  name: string;
  firstName: string;
  lastName: string;
  email: string;
  role: string;
  isActive: boolean;
  position: string;
  phoneNumber: string;
  departmentId: string;
  departmentName: string;
  image: string | null;
  createdAt: string;
  updatedAt?: string;
}

interface DepartmentOption {
  id: string;
  name: string;
}

const AVATAR_BG_PALETTE = [
  "bg-linear-to-tr from-blue-600 to-indigo-600",
  "bg-linear-to-tr from-emerald-600 to-teal-600",
  "bg-linear-to-tr from-violet-600 to-purple-600",
  "bg-linear-to-tr from-rose-500 to-pink-600",
  "bg-linear-to-tr from-amber-500 to-orange-600",
  "bg-linear-to-tr from-cyan-600 to-blue-600",
  "bg-linear-to-tr from-teal-600 to-emerald-600",
];

function getAvatarBgColor(text?: string): string {
  if (!text) return AVATAR_BG_PALETTE[0];
  let hash = 0;
  for (let i = 0; i < text.length; i++) {
    hash = (hash << 5) - hash + text.charCodeAt(i);
    hash |= 0;
  }
  const index = Math.abs(hash) % AVATAR_BG_PALETTE.length;
  return AVATAR_BG_PALETTE[index];
}

function getInitialChar(name?: string, firstName?: string): string {
  const target = (firstName || name || "").trim();
  if (!target) return "U";
  return target.charAt(0).toUpperCase();
}

function formatDate(dateStr?: string | null) {
  if (!dateStr) return "-";
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;
    const thaiYear = d.getFullYear() + 543;
    return `${d.toLocaleDateString("th-TH", {
      day: "numeric",
      month: "short",
    })} ${thaiYear} ${d.toLocaleTimeString("th-TH", {
      hour: "2-digit",
      minute: "2-digit",
    })} น.`;
  } catch {
    return dateStr;
  }
}

export function EmployeeListForm() {
  const [users, setUsers] = useState<UserItem[]>([]);
  const [departments, setDepartments] = useState<DepartmentOption[]>([]);
  const [currentSessionUser, setCurrentSessionUser] = useState<{
    id: string;
    role: string;
  } | null>(null);

  const [loading, setLoading] = useState(true);
  const [refreshKey, setRefreshKey] = useState(0);

  // Global alerts
  const [generalError, setGeneralError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  // Edit modal states
  const [editingUser, setEditingUser] = useState<UserItem | null>(null);
  const [editEmail, setEditEmail] = useState("");
  const [editRole, setEditRole] = useState("USER");
  const [editFirstName, setEditFirstName] = useState("");
  const [editLastName, setEditLastName] = useState("");
  const [editPosition, setEditPosition] = useState("");
  const [editDepartmentId, setEditDepartmentId] = useState("");
  const [editPhoneNumber, setEditPhoneNumber] = useState("");
  const [editPassword, setEditPassword] = useState("");
  const [isSavingEdit, setIsSavingEdit] = useState(false);
  const [editModalError, setEditModalError] = useState("");

  // Suspend modal states
  const [suspendingUser, setSuspendingUser] = useState<UserItem | null>(null);
  const [isSubmittingSuspend, setIsSubmittingSuspend] = useState(false);

  // Delete modal states
  const [deletingUser, setDeletingUser] = useState<UserItem | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Add User modal states
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [addEmail, setAddEmail] = useState("");
  const [addFirstName, setAddFirstName] = useState("");
  const [addLastName, setAddLastName] = useState("");
  const [addPosition, setAddPosition] = useState("");
  const [addDepartmentId, setAddDepartmentId] = useState("");
  const [addPhoneNumber, setAddPhoneNumber] = useState("");
  const [addPassword, setAddPassword] = useState("");
  const [addRole, setAddRole] = useState("USER");
  const [isAddingUser, setIsAddingUser] = useState(false);
  const [addModalError, setAddModalError] = useState("");

  const handleRefresh = () => {
    setLoading(true);
    setGeneralError("");
    setSuccessMessage("");
    setRefreshKey((k) => k + 1);
  };

  // Load current session user, users list and departments
  useEffect(() => {
    let ignore = false;

    async function loadInitialData() {
      try {
        setLoading(true);

        // Fetch current session
        const sessionRes = await fetch("/api/auth/session");
        const sessionJson = await sessionRes.json();
        if (!ignore && sessionJson.isLoggedIn && sessionJson.user) {
          setCurrentSessionUser(sessionJson.user);
        }

        // Fetch departments
        const deptRes = await fetch("/api/department/get");
        const deptJson = await deptRes.json();
        if (!ignore && deptJson.success && Array.isArray(deptJson.data)) {
          setDepartments(deptJson.data);
        }

        // Fetch users
        const usersRes = await fetch("/api/user/get");
        const usersJson = await usersRes.json();
        if (!ignore) {
          if (usersJson.success && Array.isArray(usersJson.data)) {
            setUsers(usersJson.data);
          } else {
            setGeneralError(usersJson.message || "ไม่สามารถโหลดข้อมูลผู้ใช้งานได้");
          }
        }
      } catch (err: unknown) {
        if (!ignore) {
          console.error("Fetch data error:", err);
          setGeneralError("ไม่สามารถเชื่อมต่อกับเซิร์ฟเวอร์ได้");
        }
      } finally {
        if (!ignore) {
          setLoading(false);
        }
      }
    }

    loadInitialData();

    return () => {
      ignore = true;
    };
  }, [refreshKey]);

  // Statistics calculation
  const stats = useMemo(() => {
    const total = users.length;
    const admins = users.filter((u) => u.role?.toUpperCase() === "ADMIN").length;
    const approvers = users.filter(
      (u) => u.role?.toUpperCase() === "APPROVER"
    ).length;
    const regulars = users.filter((u) => u.role?.toUpperCase() === "USER").length;
    const suspended = users.filter((u) => !u.isActive).length;
    return { total, admins, approvers, regulars, suspended };
  }, [users]);

  // Open Edit Modal
  const handleOpenEdit = (user: UserItem) => {
    setEditingUser(user);
    setEditEmail(user.email || "");
    setEditRole(user.role?.toUpperCase() || "USER");
    setEditFirstName(user.firstName || "");
    setEditLastName(user.lastName || "");
    setEditPosition(user.position === "-" ? "" : user.position || "");
    setEditDepartmentId(user.departmentId || "");
    setEditPhoneNumber(user.phoneNumber === "-" ? "" : user.phoneNumber || "");
    setEditPassword("");
    setEditModalError("");
  };

  // Submit Edit User
  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUser) return;

    if (!editEmail.trim()) {
      setEditModalError("กรุณากรอกอีเมล");
      return;
    }
    if (!editFirstName.trim() || !editLastName.trim()) {
      setEditModalError("กรุณากรอกชื่อจริงและนามสกุล");
      return;
    }
    if (!editDepartmentId) {
      setEditModalError("กรุณาเลือกสังกัดหน่วยงาน");
      return;
    }

    try {
      setIsSavingEdit(true);
      setEditModalError("");
      setGeneralError("");
      setSuccessMessage("");

      const payload: Record<string, unknown> = {
        email: editEmail.trim(),
        role: editRole,
        firstName: editFirstName.trim(),
        lastName: editLastName.trim(),
        position: editPosition.trim() || "-",
        departmentId: editDepartmentId,
        telephone: editPhoneNumber.trim() || "-",
      };

      if (editPassword.trim()) {
        payload.password = editPassword.trim();
      }

      const res = await fetch(`/api/user/update/${editingUser.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const json = await res.json();

      if (!res.ok || !json.success) {
        setEditModalError(json.message || "เกิดข้อผิดพลาดในการบันทึกข้อมูล");
        return;
      }

      setSuccessMessage(`แก้ไขข้อมูลบัญชี "${editEmail.trim()}" เรียบร้อยแล้ว`);
      setEditingUser(null);
      setRefreshKey((k) => k + 1);
    } catch (err) {
      console.error(err);
      setEditModalError("เกิดข้อผิดพลาดในการเชื่อมต่อเซิร์ฟเวอร์");
    } finally {
      setIsSavingEdit(false);
    }
  };

  // Open Suspend Modal
  const handleOpenSuspend = (user: UserItem) => {
    if (currentSessionUser && currentSessionUser.id === user.id) {
      setGeneralError("ไม่สามารถระงับการใช้งานบัญชีของตนเองที่กำลังเข้าสู่ระบบอยู่ได้");
      return;
    }
    setSuspendingUser(user);
  };

  // Submit Suspend / Unsuspend
  const handleConfirmSuspend = async () => {
    if (!suspendingUser) return;

    try {
      setIsSubmittingSuspend(true);
      setGeneralError("");
      setSuccessMessage("");

      const newActiveState = !suspendingUser.isActive;
      const res = await fetch("/api/user/update/status", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: suspendingUser.id,
          isActive: newActiveState,
        }),
      });

      const json = await res.json();

      if (!res.ok || !json.success) {
        setGeneralError(json.message || "ไม่สามารถเปลี่ยนสถานะบัญชีได้");
        setSuspendingUser(null);
        return;
      }

      setSuccessMessage(
        json.message ||
          `${
            newActiveState ? "เปิดการใช้งาน" : "ระงับการใช้งาน"
          }บัญชี "${suspendingUser.name}" เรียบร้อยแล้ว`
      );
      setSuspendingUser(null);
      setRefreshKey((k) => k + 1);
    } catch (err) {
      console.error(err);
      setGeneralError("เกิดข้อผิดพลาดในการเชื่อมต่อเพื่อเปลี่ยนสถานะ");
      setSuspendingUser(null);
    } finally {
      setIsSubmittingSuspend(false);
    }
  };

  // Open Delete Modal
  const handleOpenDelete = (user: UserItem) => {
    if (currentSessionUser && currentSessionUser.id === user.id) {
      setGeneralError("ไม่สามารถลบบัญชีของตนเองที่กำลังเข้าสู่ระบบอยู่ได้");
      return;
    }
    setDeletingUser(user);
  };

  // Confirm Delete User
  const handleConfirmDelete = async () => {
    if (!deletingUser) return;

    try {
      setIsDeleting(true);
      setGeneralError("");
      setSuccessMessage("");

      const res = await fetch(`/api/user/delete/${deletingUser.id}`, {
        method: "DELETE",
      });

      const json = await res.json();

      if (!res.ok || !json.success) {
        setGeneralError(json.message || "ไม่สามารถลบบัญชีผู้ใช้งานได้");
        setDeletingUser(null);
        return;
      }

      setSuccessMessage(
        json.message ||
          `ลบบัญชีผู้ใช้งาน "${deletingUser.name || deletingUser.email}" สำเร็จ`
      );
      setDeletingUser(null);
      setRefreshKey((k) => k + 1);
    } catch (err) {
      console.error(err);
      setGeneralError("เกิดข้อผิดพลาดในการเชื่อมต่อเพื่อลบข้อมูล");
      setDeletingUser(null);
    } finally {
      setIsDeleting(false);
    }
  };

  // Submit Add User
  const handleSaveAdd = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!addEmail.trim()) {
      setAddModalError("กรุณากรอกอีเมล");
      return;
    }
    if (!addFirstName.trim() || !addLastName.trim()) {
      setAddModalError("กรุณากรอกชื่อจริงและนามสกุล");
      return;
    }
    if (!addDepartmentId) {
      setAddModalError("กรุณาเลือกสังกัดหน่วยงาน");
      return;
    }
    if (!addPassword || addPassword.length < 8) {
      setAddModalError("รหัสผ่านต้องมีความยาวอย่างน้อย 8 ตัวอักษร");
      return;
    }

    try {
      setIsAddingUser(true);
      setAddModalError("");
      setGeneralError("");
      setSuccessMessage("");

      const res = await fetch("/api/user/add", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: addEmail.trim(),
          firstName: addFirstName.trim(),
          lastName: addLastName.trim(),
          position: addPosition.trim() || "-",
          departmentId: addDepartmentId,
          telephone: addPhoneNumber.trim() || "-",
          password: addPassword,
          role: addRole,
          isActive: true,
        }),
      });

      const json = await res.json();

      if (!res.ok || !json.success) {
        setAddModalError(json.message || "เกิดข้อผิดพลาดในการเพิ่มผู้ใช้งาน");
        return;
      }

      setSuccessMessage(`เพิ่มผู้ใช้งาน "${addFirstName} ${addLastName}" สำเร็จ`);
      setIsAddModalOpen(false);
      setAddEmail("");
      setAddFirstName("");
      setAddLastName("");
      setAddPosition("");
      setAddDepartmentId("");
      setAddPhoneNumber("");
      setAddPassword("");
      setAddRole("USER");
      setRefreshKey((k) => k + 1);
    } catch (err) {
      console.error(err);
      setAddModalError("เกิดข้อผิดพลาดในการเชื่อมต่อเซิร์ฟเวอร์");
    } finally {
      setIsAddingUser(false);
    }
  };

  // Define DataTable Columns
  const columns: DataTableColumn<UserItem>[] = [
    {
      key: "id",
      header: "ลำดับ",
      width: "60px",
      align: "center",
      sortable: false,
      render: (_, __, index) => (
        <span className="font-medium text-slate-400 text-xs">{index + 1}</span>
      ),
    },
    {
      key: "name",
      header: "ผู้ใช้งาน / ตำแหน่ง",
      width: "240px",
      render: (_, record) => {
        const cleanImage = record.image ? record.image.split(/[?#]/)[0] : null;
        const initial = getInitialChar(record.name, record.firstName);
        const bgColor = getAvatarBgColor(record.name || record.email);

        return (
          <div className="flex items-center gap-3">
            {cleanImage ? (
              <div className="relative w-10 h-10 rounded-full overflow-hidden shrink-0 border border-slate-200">
                <Image
                  src={cleanImage}
                  alt={record.name}
                  width={40}
                  height={40}
                  className="w-full h-full object-cover"
                  unoptimized
                />
              </div>
            ) : (
              <div
                className={`w-10 h-10 rounded-full shrink-0 flex items-center justify-center text-white font-bold text-sm shadow-xs ${bgColor}`}
              >
                {initial}
              </div>
            )}
            <div className="min-w-0">
              <div className="flex items-center gap-1.5">
                <span className="font-semibold text-slate-900 truncate">
                  {record.name}
                </span>
              </div>
              <div className="text-xs text-slate-500 truncate flex items-center gap-1">
                <Briefcase className="w-3 h-3 text-slate-400 shrink-0" />
                <span>{record.position || "-"}</span>
              </div>
            </div>
          </div>
        );
      },
    },
    {
      key: "email",
      header: "อีเมล / เบอร์โทรศัพท์",
      render: (_, record) => (
        <div className="space-y-1">
          <div className="flex items-center gap-1.5 text-xs text-slate-800">
            <Mail className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            <span className="font-mono select-all">{record.email || "-"}</span>
          </div>
          {record.phoneNumber && record.phoneNumber !== "-" && (
            <div className="flex items-center gap-1.5 text-xs text-slate-500">
              <Phone className="w-3.5 h-3.5 text-slate-400 shrink-0" />
              <span>{record.phoneNumber}</span>
            </div>
          )}
        </div>
      ),
    },
    {
      key: "role",
      header: "สิทธิ์การใช้งาน",
      width: "140px",
      align: "center",
      render: (_, record) => {
        const role = record.role?.toUpperCase();
        if (role === "ADMIN") {
          return (
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-purple-50 text-purple-700 border border-purple-200">
              <ShieldCheck className="w-3.5 h-3.5 text-purple-600" />
              Admin
            </span>
          );
        }
        if (role === "APPROVER") {
          return (
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
              <FileCheck2 className="w-3.5 h-3.5 text-emerald-600" />
              Approver
            </span>
          );
        }
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-slate-100 text-slate-700 border border-slate-200">
            <Users className="w-3.5 h-3.5 text-slate-500" />
            User
          </span>
        );
      },
    },
    {
      key: "departmentName",
      header: "สังกัดหน่วยงาน",
      render: (val) => (
        <div className="flex items-center gap-1.5 text-xs text-slate-700">
          <Building2 className="w-3.5 h-3.5 text-slate-400 shrink-0" />
          <span className="truncate">{String(val || "-")}</span>
        </div>
      ),
    },
    {
      key: "isActive",
      header: "สถานะบัญชี",
      width: "130px",
      align: "center",
      render: (_, record) => {
        if (!record.isActive) {
          return (
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-rose-50 text-rose-700 border border-rose-200">
              <Ban className="w-3 h-3 text-rose-500" />
              ระงับการใช้งาน
            </span>
          );
        }
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
            <CheckCircle2 className="w-3 h-3 text-emerald-600" />
            ปกติ
          </span>
        );
      },
    },
    {
      key: "createdAt",
      header: "วันที่สร้างบัญชี",
      width: "160px",
      render: (val) => (
        <span className="text-xs text-slate-500">
          {formatDate(String(val || ""))}
        </span>
      ),
    },
  ];

  // Custom action for Suspend / Unsuspend
  const customActions: DataTableAction<UserItem>[] = [
    {
      name: "suspend",
      label: "",
      className: "p-1.5!",
      icon: <ShieldAlert className="w-4 h-4 text-amber-600 hover:text-amber-700" />,
      onClick: (record) => handleOpenSuspend(record),
      show: (record) => Boolean(currentSessionUser?.id !== record.id),
      disabled: (record) => Boolean(currentSessionUser?.id === record.id),
    },
  ];

  return (
    <div className="space-y-6 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-xs">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
              <Shield className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-bold text-slate-900">
                บริหารจัดการบัญชีผู้ใช้งาน
              </h1>
              <p className="text-xs sm:text-sm text-slate-500">
                จัดการบัญชีผู้ใช้งาน กำหนดสิทธิ์ ดูแลสถานะ และความปลอดภัยของระบบ
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 self-start md:self-center">
          <Button
            variant="outline"
            size="sm"
            text="รีเฟรช"
            icon={<RotateCcw className="w-4 h-4" />}
            onClick={handleRefresh}
            disabled={loading}
          />
          <Button
            variant="primary"
            size="sm"
            text="เพิ่มผู้ใช้งานใหม่"
            icon={<Plus className="w-4 h-4" />}
            onClick={() => {
              setAddModalError("");
              setIsAddModalOpen(true);
            }}
          />
        </div>
      </div>

      {/* Global Alerts */}
      {generalError && (
        <TextAlert
          variant="error"
          title="เกิดข้อผิดพลาด"
          text={generalError}
          onClose={() => setGeneralError("")}
        />
      )}

      {successMessage && (
        <TextAlert
          variant="success"
          title="ดำเนินการสำเร็จ"
          text={successMessage}
          onClose={() => setSuccessMessage("")}
        />
      )}

      {/* Summary Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Total */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
            <Users className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xs text-slate-500 font-medium">ผู้ใช้งานทั้งหมด</div>
            <div className="text-xl font-bold text-slate-900">
              {stats.total}{" "}
              <span className="text-xs font-normal text-slate-400">บัญชี</span>
            </div>
          </div>
        </div>

        {/* Card 2: Admins */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center shrink-0">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xs text-slate-500 font-medium">
              ผู้ดูแลระบบ (Admin)
            </div>
            <div className="text-xl font-bold text-slate-900">
              {stats.admins}{" "}
              <span className="text-xs font-normal text-slate-400">บัญชี</span>
            </div>
          </div>
        </div>

        {/* Card 3: Approvers & Regular Users */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
            <UserCheck className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xs text-slate-500 font-medium">
              ผู้อนุมัติ & ทั่วไป
            </div>
            <div className="text-xl font-bold text-slate-900">
              {stats.approvers + stats.regulars}{" "}
              <span className="text-xs font-normal text-slate-400">บัญชี</span>
            </div>
          </div>
        </div>

        {/* Card 4: Suspended */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-rose-50 text-rose-600 flex items-center justify-center shrink-0">
            <UserX className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xs text-slate-500 font-medium">ระงับการใช้งาน</div>
            <div className="text-xl font-bold text-slate-900">
              {stats.suspended}{" "}
              <span className="text-xs font-normal text-slate-400">บัญชี</span>
            </div>
          </div>
        </div>
      </div>

      {/* Main DataTable Card */}
      <div className="space-y-3">
        <DataTable<UserItem>
          data={users}
          columns={columns}
          loading={loading}
          searchPlaceholder="ค้นหาชื่อ, อีเมล, สังกัด, ตำแหน่ง..."
          emptyMessage="ไม่พบข้อมูลผู้ใช้งานในระบบ"
          pageSize={10}
          pageSizeOptions={[10, 20, 30, 50]}
          actions={{
            header: "จัดการ",
            width: "130px",
            align: "center",
            onEdit: handleOpenEdit,
            onDelete: handleOpenDelete,
            editLabel: "แก้ไขข้อมูลผู้ใช้งาน",
            deleteLabel: "ลบบัญชีผู้ใช้งาน",
            isDeleteDisabled: (record: UserItem) =>
              Boolean(currentSessionUser?.id === record.id),
            customActions,
          }}
        />
      </div>

      {/* ========================================================================= */}
      {/* 1. Modal แก้ไขข้อมูลผู้ใช้ (Edit User Modal) */}
      {/* ========================================================================= */}
      {editingUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs animate-fade-in overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-xl w-full p-6 shadow-2xl border border-slate-100 my-8">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-lg">
                    แก้ไขข้อมูลบัญชีผู้ใช้งาน
                  </h3>
                  <p className="text-xs text-slate-500">
                    เปลี่ยนอีเมล ปรับระดับสิทธิ์ หรือแก้ไขข้อมูลสังกัด
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setEditingUser(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {editModalError && (
              <div className="mt-4">
                <TextAlert
                  variant="error"
                  title="ข้อผิดพลาด"
                  text={editModalError}
                  onClose={() => setEditModalError("")}
                />
              </div>
            )}

            <form onSubmit={handleSaveEdit} className="space-y-4 mt-4">
              <div>
                <TextBox
                  label="อีเมลบัญชีผู้ใช้งาน"
                  type="email"
                  value={editEmail}
                  onChange={(e) => setEditEmail(e.target.value)}
                  placeholder="user@example.com"
                  required
                  helperText="สามารถแก้ไขอีเมลได้ ระบบจะตรวจสอบความซ้ำซ้อนโดยอัตโนมัติ"
                />
              </div>

              <div>
                <SelectBox
                  label="สิทธิ์และบทบาทบัญชี (Role)"
                  value={editRole}
                  onChange={(e) => setEditRole(e.target.value)}
                  options={[
                    { value: "USER", label: "User (ผู้ใช้งานทั่วไป)" },
                    { value: "APPROVER", label: "Approver (ผู้อนุมัติการจอง)" },
                    { value: "ADMIN", label: "Admin (ผู้ดูแลระบบ)" },
                  ]}
                  helperText="สิทธิ์ Admin สามารถเข้าถึงการจัดการระบบและผู้ใช้งานได้ทั้งหมด"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <TextBox
                  label="ชื่อจริง"
                  value={editFirstName}
                  onChange={(e) => setEditFirstName(e.target.value)}
                  placeholder="ชื่อ"
                  required
                />
                <TextBox
                  label="นามสกุล"
                  value={editLastName}
                  onChange={(e) => setEditLastName(e.target.value)}
                  placeholder="นามสกุล"
                  required
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <SelectBox
                  label="สังกัดหน่วยงาน"
                  value={editDepartmentId}
                  onChange={(e) => setEditDepartmentId(e.target.value)}
                  options={departments.map((d) => ({
                    value: d.id,
                    label: d.name,
                  }))}
                  placeholder="เลือกสังกัดหน่วยงาน..."
                  required
                />
                <TextBox
                  label="ตำแหน่งงาน"
                  value={editPosition}
                  onChange={(e) => setEditPosition(e.target.value)}
                  placeholder="เช่น นักวิชาการคอมพิวเตอร์"
                />
              </div>

              <div>
                <TextBox
                  label="เบอร์โทรศัพท์"
                  value={editPhoneNumber}
                  onChange={(e) => setEditPhoneNumber(e.target.value)}
                  placeholder="0812345678"
                />
              </div>

              <div>
                <TextBox
                  label="รีเซ็ตรหัสผ่านใหม่ (ไม่บังคับ)"
                  type="password"
                  value={editPassword}
                  onChange={(e) => setEditPassword(e.target.value)}
                  placeholder="เว้นว่างไว้หากไม่ต้องการเปลี่ยนรหัสผ่าน"
                  helperText="ระบุรหัสผ่านใหม่อย่างน้อย 8 ตัวอักษร หากต้องการเปลี่ยนรหัสผ่านแทนผู้ใช้"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  text="ยกเลิก"
                  disabled={isSavingEdit}
                  onClick={() => setEditingUser(null)}
                />
                <Button
                  type="submit"
                  variant="primary"
                  size="sm"
                  text="บันทึกการเปลี่ยนแปลง"
                  loading={isSavingEdit}
                />
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 2. Modal ระงับ / ปลดระงับการใช้งานบัญชี (Suspend Modal) */}
      {/* ========================================================================= */}
      {suspendingUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs animate-fade-in">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-100">
            <div className="flex items-center gap-3.5 mb-4">
              <div
                className={`w-11 h-11 rounded-full flex items-center justify-center shrink-0 ${
                  !suspendingUser.isActive
                    ? "bg-emerald-50 text-emerald-600"
                    : "bg-rose-50 text-rose-600"
                }`}
              >
                {!suspendingUser.isActive ? (
                  <CheckCircle2 className="w-6 h-6" />
                ) : (
                  <Ban className="w-6 h-6" />
                )}
              </div>
              <div>
                <h4 className="font-bold text-slate-900 text-base">
                  {!suspendingUser.isActive
                    ? "ยืนยันการเปิดการใช้งานบัญชี"
                    : "ยืนยันการระงับการใช้งานบัญชี"}
                </h4>
                <p className="text-xs text-slate-500">
                  {!suspendingUser.isActive
                    ? "ผู้ใช้จะสามารถเข้าสู่ระบบและจองห้องประชุมได้ตามปกติ"
                    : "ผู้ใช้จะไม่สามารถเข้าสู่ระบบเพื่อใช้งานได้จนกว่าจะเปิดใช้งานอีกครั้ง"}
                </p>
              </div>
            </div>

            <div className="text-sm text-slate-600 mb-4 bg-slate-50 p-3.5 rounded-xl border border-slate-100 space-y-1">
              <div>
                ชื่อผู้ใช้งาน:{" "}
                <strong className="text-slate-900">{suspendingUser.name}</strong>
              </div>
              <div className="text-xs text-slate-500">
                อีเมล: <span className="font-mono">{suspendingUser.email}</span>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <Button
                variant="outline"
                size="sm"
                text="ยกเลิก"
                disabled={isSubmittingSuspend}
                onClick={() => setSuspendingUser(null)}
              />
              <Button
                variant={!suspendingUser.isActive ? "primary" : "danger"}
                size="sm"
                text={
                  !suspendingUser.isActive
                    ? "ยืนยันการเปิดใช้งาน"
                    : "ยืนยันการระงับการใช้งาน"
                }
                loading={isSubmittingSuspend}
                onClick={handleConfirmSuspend}
              />
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 3. Modal ยืนยันการลบบัญชีผู้ใช้งาน (Delete Confirmation Modal) */}
      {/* ========================================================================= */}
      {deletingUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs animate-fade-in">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-100">
            <div className="flex items-center gap-3.5 text-red-600 mb-4">
              <div className="w-11 h-11 rounded-full bg-red-50 flex items-center justify-center shrink-0">
                <AlertTriangle className="w-6 h-6 text-red-600" />
              </div>
              <div>
                <h4 className="font-bold text-slate-900 text-base">
                  ยืนยันการลบบัญชีผู้ใช้งาน
                </h4>
                <p className="text-xs text-slate-500">
                  การกระทำนี้จะลบข้อมูลบัญชีผู้ใช้งานถาวร
                </p>
              </div>
            </div>

            <div className="text-sm text-slate-600 mb-6 bg-red-50/50 p-3.5 rounded-xl border border-red-100 space-y-1">
              <p>
                คุณแน่ใจหรือไม่ว่าต้องการลบบัญชีผู้ใช้งาน{" "}
                <strong className="text-slate-900 font-semibold">
                  &ldquo;{deletingUser.name}&rdquo;
                </strong>{" "}
                (<span className="font-mono text-xs">{deletingUser.email}</span>)?
              </p>
              <p className="text-xs text-red-600 font-medium">
                * หากผู้ใช้มีประวัติการจองห้องประชุมในระบบ กรุณาใช้การระงับการใช้งานแทน
              </p>
            </div>

            <div className="flex items-center justify-end gap-3">
              <Button
                variant="outline"
                size="sm"
                text="ยกเลิก"
                disabled={isDeleting}
                onClick={() => setDeletingUser(null)}
              />
              <Button
                variant="danger"
                size="sm"
                text="ยืนยันการลบบัญชี"
                loading={isDeleting}
                onClick={handleConfirmDelete}
              />
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 4. Modal เพิ่มผู้ใช้งานใหม่ (Add User Modal) */}
      {/* ========================================================================= */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs animate-fade-in overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-xl w-full p-6 shadow-2xl border border-slate-100 my-8">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
                  <Plus className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-lg">
                    เพิ่มบัญชีผู้ใช้งานใหม่
                  </h3>
                  <p className="text-xs text-slate-500">
                    สร้างบัญชีผู้ใช้งานใหม่พร้อมกำหนดสิทธิ์และสังกัดหน่วยงาน
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsAddModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {addModalError && (
              <div className="mt-4">
                <TextAlert
                  variant="error"
                  title="ข้อผิดพลาด"
                  text={addModalError}
                  onClose={() => setAddModalError("")}
                />
              </div>
            )}

            <form onSubmit={handleSaveAdd} className="space-y-4 mt-4">
              <div>
                <TextBox
                  label="อีเมลบัญชี (Email)"
                  type="email"
                  value={addEmail}
                  onChange={(e) => setAddEmail(e.target.value)}
                  placeholder="newuser@example.com"
                  required
                />
              </div>

              <div>
                <SelectBox
                  label="สิทธิ์และบทบาท (Role)"
                  value={addRole}
                  onChange={(e) => setAddRole(e.target.value)}
                  options={[
                    { value: "USER", label: "User (ผู้ใช้งานทั่วไป)" },
                    { value: "APPROVER", label: "Approver (ผู้อนุมัติการจอง)" },
                    { value: "ADMIN", label: "Admin (ผู้ดูแลระบบ)" },
                  ]}
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <TextBox
                  label="ชื่อจริง"
                  value={addFirstName}
                  onChange={(e) => setAddFirstName(e.target.value)}
                  placeholder="ชื่อ"
                  required
                />
                <TextBox
                  label="นามสกุล"
                  value={addLastName}
                  onChange={(e) => setAddLastName(e.target.value)}
                  placeholder="นามสกุล"
                  required
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <SelectBox
                  label="สังกัดหน่วยงาน"
                  value={addDepartmentId}
                  onChange={(e) => setAddDepartmentId(e.target.value)}
                  options={departments.map((d) => ({
                    value: d.id,
                    label: d.name,
                  }))}
                  placeholder="เลือกสังกัดหน่วยงาน..."
                  required
                />
                <TextBox
                  label="ตำแหน่งงาน"
                  value={addPosition}
                  onChange={(e) => setAddPosition(e.target.value)}
                  placeholder="เช่น นักวิชาการพัสดุ"
                />
              </div>

              <div>
                <TextBox
                  label="เบอร์โทรศัพท์"
                  value={addPhoneNumber}
                  onChange={(e) => setAddPhoneNumber(e.target.value)}
                  placeholder="0812345678"
                />
              </div>

              <div>
                <TextBox
                  label="รหัสผ่านเริ่มต้น (อย่างน้อย 8 ตัวอักษร)"
                  type="password"
                  value={addPassword}
                  onChange={(e) => setAddPassword(e.target.value)}
                  placeholder="กำหนดรหัสผ่านเข้าใช้งาน"
                  required
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  text="ยกเลิก"
                  disabled={isAddingUser}
                  onClick={() => setIsAddModalOpen(false)}
                />
                <Button
                  type="submit"
                  variant="primary"
                  size="sm"
                  text="สร้างบัญชีผู้ใช้"
                  loading={isAddingUser}
                />
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default EmployeeListForm;
