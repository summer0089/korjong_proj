"use client";

import React, { useState, useEffect } from "react";
import { TextBox } from "@/components/form_controls/TextBox";
import { Button } from "@/components/form_controls/Button";
import { TextAlert } from "@/components/form_controls/TextAlert";
import { DataTable, DataTableColumn } from "@/components/form_controls/DataTable";
import { MeetingRoomSchema, MeetingRoomFormData } from "@/utils/validation/meeting_room_form/schema";
import { formatThaiDate } from "@/utils/helper/thai_date";
import {
  Building2,
  Plus,
  Check,
  X,
  AlertTriangle,
  RotateCcw,
} from "lucide-react";

interface MeetingRoom {
  id: string;
  name: string;
  capacity: number;
  createdAt: string;
  updatedAt: string;
}

type FieldErrors = Partial<Record<keyof MeetingRoomFormData, string>>;

export function MeetingRoomForm() {
  const [meetingRooms, setMeetingRooms] = useState<MeetingRoom[]>([]);
  const [name, setName] = useState("");
  const [capacity, setCapacity] = useState<number | "">(5);
  const [editingId, setEditingId] = useState<string | null>(null);

  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [generalError, setGeneralError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Delete modal state
  const [deletingMeetingRoom, setDeletingMeetingRoom] = useState<MeetingRoom | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  const handleRefresh = () => {
    setIsLoading(true);
    setRefreshKey((k) => k + 1);
  };

  // effect สำหรับดึงข้อมูลห้องประชุม เมื่อมีการกดปุ่ม refresh หรือ refreshKey เปลี่ยน
  useEffect(() => {
    let ignore = false;

    async function fetchMeetingRooms() {
      try {
        const res = await fetch("/api/meeting-room/get");
        const json = await res.json();
        if (!ignore) {
          if (json.success && Array.isArray(json.data)) {
            setMeetingRooms(json.data);
          } else {
            setGeneralError(json.message || "ไม่สามารถโหลดข้อมูลห้องประชุมได้");
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

    fetchMeetingRooms();

    return () => {
      ignore = true;
    };
  }, [refreshKey]);

  // บันทึกลงฐานข้อมูล (Add or Edit)
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFieldErrors({});
    setGeneralError("");
    setSuccessMessage("");

    // แปลง capacity จาก string/number (หากเป็นค่าว่างให้เป็น NaN เพื่อให้ Schema แจ้งเตือนถูกต้อง)
    const parsedCapacity = capacity === "" ? NaN : Number(capacity);

    // Validate using Zod
    const result = MeetingRoomSchema.safeParse({ name, capacity: parsedCapacity });
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

    try {
      setIsSubmitting(true);
      const isEditing = Boolean(editingId);
      const url = isEditing
        ? `/api/meeting-room/update/${editingId}`
        : "/api/meeting-room/add";
      const method = isEditing ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: name.trim(), capacity: Number(capacity) }),
      });

      const json = await res.json();

      if (!res.ok || !json.success) {
        setGeneralError(json.message || "เกิดข้อผิดพลาดในการบันทึกข้อมูล");
        return;
      }

      setSuccessMessage(
        isEditing
          ? "แก้ไขข้อมูลห้องประชุมเรียบร้อยแล้ว"
          : "เพิ่มห้องประชุมใหม่เรียบร้อยแล้ว"
      );
      setName("");
      setCapacity(5);
      setEditingId(null);
      setFieldErrors({});
      setRefreshKey((k) => k + 1);
    } catch (err: unknown) {
      console.error(err);
      setGeneralError("เกิดข้อผิดพลาดในการเชื่อมต่อเซิร์ฟเวอร์");
    } finally {
      setIsSubmitting(false);
    }
  };

  // เริ่มแก้ไขข้อมูลห้องประชุม
  const handleEdit = (room: MeetingRoom) => {
    setEditingId(room.id);
    setName(room.name);
    setCapacity(room.capacity ?? 5);
    setFieldErrors({});
    setGeneralError("");
    setSuccessMessage("");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  // ยกเลิกการแก้ไขข้อมูลห้องประชุม
  const handleCancelEdit = () => {
    setEditingId(null);
    setName("");
    setCapacity(5);
    setFieldErrors({});
    setGeneralError("");
  };

  // ยืนยันการลบข้อมูลหน่วยงาน
  const handleConfirmDelete = async () => {
    if (!deletingMeetingRoom) return;

    try {
      setIsDeleting(true);
      setGeneralError("");
      setSuccessMessage("");

      const res = await fetch(`/api/meeting-room/delete/${deletingMeetingRoom.id}`, {
        method: "DELETE",
      });

      const json = await res.json();

      if (!res.ok || !json.success) {
        setGeneralError(json.message || "ไม่สามารถลบห้องประชุมได้");
        setDeletingMeetingRoom(null);
        return;
      }

      setSuccessMessage(`ลบห้องประชุม "${deletingMeetingRoom.name}" เรียบร้อยแล้ว`);
      setDeletingMeetingRoom(null);

      // ยกเลิกการแก้ไขข้อมูลหน่วยงาน ถ้ากำลังแก้ไขข้อมูลหน่วยงานที่กำลังจะลบ
      if (editingId === deletingMeetingRoom.id) {
        handleCancelEdit();
      }

      setRefreshKey((k) => k + 1);
    } catch (err: unknown) {
      console.error(err);
      setGeneralError("เกิดข้อผิดพลาดในการเชื่อมต่อเพื่อลบข้อมูล");
      setDeletingMeetingRoom(null);
    } finally {
      setIsDeleting(false);
    }
  };

  // DataTable column definitions
  const columns: DataTableColumn<MeetingRoom>[] = [
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
      header: "ชื่อห้องประชุม",
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
      key: "capacity",
      header: "จำนวนผู้เข้าประชุม",
      render: (val) => (
        <div className="flex items-center gap-2">
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
                {editingId ? "แก้ไขชื่อห้องประชุม" : "เพิ่มห้องประชุมใหม่"}
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                {editingId
                  ? "กรอกชื่อห้องประชุมที่ต้องการเปลี่ยนแปลงแล้วกดบันทึก"
                  : "กรอกชื่อห้องประชุมภายในองค์กรเพื่อใช้สำหรับกำหนดสังกัดผู้ใช้งาน"}
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
              id="meeting-room-name"
              name="name"
              label="ชื่อห้องประชุม"
              placeholder="ตัวอย่าง: ห้องประชุม 1, ห้องประชุม 2, ห้องประชุม 3"
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                if (fieldErrors.name) {
                  setFieldErrors((prev) => ({ ...prev, name: undefined }));
                }
              }}
              error={fieldErrors.name}
              disabled={isSubmitting}
              autoFocus={Boolean(editingId)}
            />
          </div>

          <div className="max-w-xl">
            <TextBox
              id="meeting-room-capacity"
              name="capacity"
              label="จำนวนผู้เข้าประชุม"
              type="text"
              inputMode="numeric"
              placeholder="ตัวอย่าง: 10, 20, 30"
              value={capacity}
              onChange={(e) => {
                const val = e.target.value.replace(/\D/g, "");
                setCapacity(val === "" ? "" : Number(val));
                if (fieldErrors.capacity) {
                  setFieldErrors((prev) => ({ ...prev, capacity: undefined }));
                }
              }}
              error={fieldErrors.capacity}
              disabled={isSubmitting}
            />
          </div>

          <div className="flex items-center gap-3 pt-2">
            <Button
              type="submit"
              variant="primary"
              loading={isSubmitting}
              text={editingId ? "บันทึกการแก้ไข" : "เพิ่มห้องประชุม"}
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
              รายชื่อห้องประชุมทั้งหมด
            </h3>
            <p className="text-xs text-slate-500">
              จัดการรายการห้องประชุม สามารถค้นหา แก้ไข หรือลบข้อมูลได้
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

        <DataTable<MeetingRoom>
          data={meetingRooms}
          columns={columns}
          loading={isLoading}
          searchPlaceholder="ค้นหาชื่อห้องประชุม..."
          emptyMessage="ยังไม่มีข้อมูลห้องประชุม"
          actions={{
            header: "การจัดการ",
            width: "120px",
            align: "center",
            onEdit: handleEdit,
            onDelete: (room) => setDeletingMeetingRoom(room),
            editLabel: "แก้ไขชื่อห้องประชุม",
            deleteLabel: "ลบห้องประชุม",
          }}
        />
      </div>

      {/* Delete Confirmation Modal */}
      {deletingMeetingRoom && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-100">
            <div className="flex items-center gap-3.5 text-red-600 mb-4">
              <div className="w-10 h-10 rounded-full bg-red-50 flex items-center justify-center shrink-0">
                <AlertTriangle className="w-5 h-5 text-red-600" />
              </div>
              <div>
                <h4 className="font-bold text-slate-900 text-base">
                  ยืนยันการลบห้องประชุม
                </h4>
                <p className="text-xs text-slate-500">
                  การกระทำนี้ไม่สามารถย้อนกลับได้
                </p>
              </div>
            </div>

            <p className="text-sm text-slate-600 mb-6 bg-slate-50 p-3.5 rounded-lg border border-slate-100">
              คุณแน่ใจหรือไม่ว่าต้องการลบห้องประชุม{" "}
              <strong className="text-slate-900 font-semibold">
                &ldquo;{deletingMeetingRoom.name}&rdquo;
              </strong>{" "}
              ออกจากระบบ?
            </p>

            <div className="flex items-center justify-end gap-3">
              <Button
                variant="outline"
                size="sm"
                text="ยกเลิก"
                disabled={isDeleting}
                onClick={() => setDeletingMeetingRoom(null)}
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

export default MeetingRoomForm;
