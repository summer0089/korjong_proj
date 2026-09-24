"use client";

import React, { useState, useEffect } from "react";
import { TextBox } from "@/components/form_controls/TextBox";
import { Button } from "@/components/form_controls/Button";
import { TextAlert } from "@/components/form_controls/TextAlert";
import { DataTable, DataTableColumn } from "@/components/form_controls/DataTable";
import { departmentSchema } from "@/utils/validation/department_form/schema";
import { formatThaiDate } from "@/utils/helper/thai_date";
import {
  Building2,
  Plus,
  Check,
  X,
  AlertTriangle,
  RotateCcw,
} from "lucide-react";

interface Department {
  id: string;
  name: string;
  createdAt: string;
  updatedAt: string;
}

export function DepartmentForm() {
  const [departments, setDepartments] = useState<Department[]>([]);
  const [name, setName] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);

  const [fieldError, setFieldError] = useState<string | undefined>();
  const [generalError, setGeneralError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Delete modal state
  const [deletingDepartment, setDeletingDepartment] = useState<Department | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  const handleRefresh = () => {
    setIsLoading(true);
    setRefreshKey((k) => k + 1);
  };

  // effect สำหรับดึงข้อมูลหน่วยงาน เมื่อมีการกดปุ่ม refresh หรือ refreshKey เปลี่ยน
  useEffect(() => {
    let ignore = false;

    async function fetchDepartments() {
      try {
        const res = await fetch("/api/department/get");
        const json = await res.json();
        if (!ignore) {
          if (json.success && Array.isArray(json.data)) {
            setDepartments(json.data);
          } else {
            setGeneralError(json.message || "ไม่สามารถโหลดข้อมูลหน่วยงานได้");
          }
        }
      } catch (err: unknown) {
        if (!ignore) {
          console.error(err);
          setGeneralError("ไม่สามารถเชื่อมต่อกับเซิร์ฟเวอร์ได้");
        }
      } finally {
        if (!ignore) {
          setIsLoading(false);
        }
      }
    }

    fetchDepartments();

    return () => {
      ignore = true;
    };
  }, [refreshKey]);

  // บันทึกลงฐานข้อมูล (Add or Edit)
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFieldError(undefined);
    setGeneralError("");
    setSuccessMessage("");

    // Validate using Zod
    const validation = departmentSchema.safeParse({ name });
    if (!validation.success) {
      const issue = validation.error.issues[0];
      setFieldError(issue?.message || "ข้อมูลไม่ถูกต้อง");
      return;
    }

    try {
      setIsSubmitting(true);
      const isEditing = Boolean(editingId);
      const url = isEditing
        ? `/api/department/update/${editingId}`
        : "/api/department/add";
      const method = isEditing ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: name.trim() }),
      });

      const json = await res.json();

      if (!res.ok || !json.success) {
        setGeneralError(json.message || "เกิดข้อผิดพลาดในการบันทึกข้อมูล");
        return;
      }

      setSuccessMessage(
        isEditing
          ? "แก้ไขข้อมูลหน่วยงานเรียบร้อยแล้ว"
          : "เพิ่มหน่วยงานใหม่เรียบร้อยแล้ว"
      );
      setName("");
      setEditingId(null);
      setRefreshKey((k) => k + 1);
    } catch (err: unknown) {
      console.error(err);
      setGeneralError("เกิดข้อผิดพลาดในการเชื่อมต่อเซิร์ฟเวอร์");
    } finally {
      setIsSubmitting(false);
    }
  };

  // เริ่มแก้ไขข้อมูลหน่วยงาน
  const handleEdit = (dept: Department) => {
    setEditingId(dept.id);
    setName(dept.name);
    setFieldError(undefined);
    setGeneralError("");
    setSuccessMessage("");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  // ยกเลิกการแก้ไขข้อมูลหน่วยงาน
  const handleCancelEdit = () => {
    setEditingId(null);
    setName("");
    setFieldError(undefined);
    setGeneralError("");
  };

  // ยืนยันการลบข้อมูลหน่วยงาน
  const handleConfirmDelete = async () => {
    if (!deletingDepartment) return;

    try {
      setIsDeleting(true);
      setGeneralError("");
      setSuccessMessage("");

      const res = await fetch(`/api/department/delete/${deletingDepartment.id}`, {
        method: "DELETE",
      });

      const json = await res.json();

      if (!res.ok || !json.success) {
        setGeneralError(json.message || "ไม่สามารถลบหน่วยงานได้");
        setDeletingDepartment(null);
        return;
      }

      setSuccessMessage(`ลบหน่วยงาน "${deletingDepartment.name}" เรียบร้อยแล้ว`);
      setDeletingDepartment(null);

      // If we were editing this department, cancel edit
      if (editingId === deletingDepartment.id) {
        handleCancelEdit();
      }

      setRefreshKey((k) => k + 1);
    } catch (err: unknown) {
      console.error(err);
      setGeneralError("เกิดข้อผิดพลาดในการเชื่อมต่อเพื่อลบข้อมูล");
      setDeletingDepartment(null);
    } finally {
      setIsDeleting(false);
    }
  };

  // DataTable column definitions
  const columns: DataTableColumn<Department>[] = [
    {
      key: "id",
      header: "ลำดับ",
      width: "80px",
      align: "center",
      sortable: false,
      render: (_, __, index) => (
        <span className="font-medium text-slate-500">{index + 1}</span>
      ),
    },
    {
      key: "name",
      header: "ชื่อหน่วยงานภายใน",
      render: (val) => (
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-primary-light text-primary flex items-center justify-center shrink-0">
            <Building2 className="w-4 h-4" />
          </div>
          <span className="font-semibold text-slate-800">
            {String(val ?? "")}
          </span>
        </div>
      ),
    },
    {
      key: "createdAt",
      header: "วันที่สร้าง",
      width: "220px",
      render: (val) => (
        <span className="text-xs text-slate-500">
          {formatThaiDate(String(val ?? ""))}
        </span>
      ),
    },
  ];

  return (
    <div className="space-y-8 w-full">
      {/* Notifications */}
      {generalError && (
        <TextAlert
          variant="error"
          text={generalError}
          onClose={() => setGeneralError("")}
        />
      )}

      {successMessage && (
        <TextAlert
          variant="success"
          text={successMessage}
          onClose={() => setSuccessMessage("")}
        />
      )}

      {/* Input Form Card */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-6 sm:p-8 transition-all">
        <div className="flex items-center justify-between pb-5 mb-6 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary-light text-primary flex items-center justify-center">
              <Building2 className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-800">
                {editingId ? "แก้ไขชื่อหน่วยงานภายใน" : "เพิ่มหน่วยงานภายในใหม่"}
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                {editingId
                  ? "กรอกชื่อหน่วยงานที่ต้องการเปลี่ยนแปลงแล้วกดบันทึก"
                  : "กรอกชื่อหน่วยงานภายในองค์กรเพื่อใช้สำหรับกำหนดสังกัดผู้ใช้งาน"}
              </p>
            </div>
          </div>

          {editingId && (
            <span className="px-2.5 py-1 text-xs font-semibold rounded-full bg-amber-50 text-amber-700 border border-amber-200/60 animate-fade-in">
              กำลังแก้ไข
            </span>
          )}
        </div>

        <form onSubmit={handleSubmit} noValidate className="space-y-6">
          <div className="max-w-xl">
            <TextBox
              id="department-name"
              name="name"
              label="ชื่อหน่วยงานภายใน"
              placeholder="ตัวอย่าง: สำนักปลัดเทศบาล, กองคลัง, กองช่าง"
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                if (fieldError) setFieldError(undefined);
              }}
              error={fieldError}
              disabled={isSubmitting}
              autoFocus={Boolean(editingId)}
            />
          </div>

          <div className="flex items-center gap-3 pt-2">
            <Button
              type="submit"
              variant="primary"
              loading={isSubmitting}
              text={editingId ? "บันทึกการแก้ไข" : "เพิ่มหน่วยงาน"}
              icon={
                editingId ? (
                  <Check className="w-4 h-4" />
                ) : (
                  <Plus className="w-4 h-4" />
                )
              }
            />

            {editingId && (
              <Button
                type="button"
                variant="outline"
                text="ยกเลิก"
                icon={<X className="w-4 h-4" />}
                onClick={handleCancelEdit}
                disabled={isSubmitting}
              />
            )}
          </div>
        </form>
      </div>

      {/* Data Table Card */}
      <div className="space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 px-1">
          <div>
            <h3 className="text-base font-bold text-slate-800">
              รายชื่อหน่วยงานภายในทั้งหมด
            </h3>
            <p className="text-xs text-slate-500">
              จัดการรายการหน่วยงาน สามารถค้นหา แก้ไข หรือลบข้อมูลได้
            </p>
          </div>

          <Button
            variant="ghost"
            size="sm"
            text="รีเฟรชข้อมูล"
            icon={<RotateCcw className="w-3.5 h-3.5" />}
            onClick={handleRefresh}
            disabled={isLoading}
          />
        </div>

        <DataTable<Department>
          data={departments}
          columns={columns}
          loading={isLoading}
          searchPlaceholder="ค้นหาชื่อหน่วยงาน..."
          emptyMessage="ยังไม่มีข้อมูลหน่วยงานภายใน"
          actions={{
            header: "การจัดการ",
            width: "120px",
            align: "center",
            onEdit: handleEdit,
            onDelete: (dept) => setDeletingDepartment(dept),
            editLabel: "แก้ไขชื่อหน่วยงาน",
            deleteLabel: "ลบหน่วยงาน",
          }}
        />
      </div>

      {/* Delete Confirmation Modal */}
      {deletingDepartment && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-100">
            <div className="flex items-center gap-3.5 text-red-600 mb-4">
              <div className="w-10 h-10 rounded-full bg-red-50 flex items-center justify-center shrink-0">
                <AlertTriangle className="w-5 h-5 text-red-600" />
              </div>
              <div>
                <h4 className="font-bold text-slate-900 text-base">
                  ยืนยันการลบหน่วยงาน
                </h4>
                <p className="text-xs text-slate-500">
                  การกระทำนี้ไม่สามารถย้อนกลับได้
                </p>
              </div>
            </div>

            <p className="text-sm text-slate-600 mb-6 bg-slate-50 p-3.5 rounded-lg border border-slate-100">
              คุณแน่ใจหรือไม่ว่าต้องการลบหน่วยงาน{" "}
              <strong className="text-slate-900 font-semibold">
                &ldquo;{deletingDepartment.name}&rdquo;
              </strong>{" "}
              ออกจากระบบ?
            </p>

            <div className="flex items-center justify-end gap-3">
              <Button
                variant="outline"
                size="sm"
                text="ยกเลิก"
                disabled={isDeleting}
                onClick={() => setDeletingDepartment(null)}
              />
              <Button
                variant="danger"
                size="sm"
                text="ยืนยันการลบ"
                loading={isDeleting}
                onClick={handleConfirmDelete}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default DepartmentForm;
