"use client";

import React, { useState, useRef, useEffect } from "react";
import Image from "next/image";
import { Button } from "@/components/form_controls/Button";
import { TextAlert } from "@/components/form_controls/TextAlert";
import { Camera, Upload, Info } from "lucide-react";

export interface ResizeParams {
  sx: number;
  sy: number;
  sWidth: number;
  sHeight: number;
  dx: number;
  dy: number;
  dWidth: number;
  dHeight: number;
}

/**
 * Pure calculation function for center-cover resizing to target dimensions (default 100x100 px).
 * Scales and centers the image without distortion.
 */
export function calculateResizeDimensions(
  naturalWidth: number,
  naturalHeight: number,
  targetWidth = 100,
  targetHeight = 100
): ResizeParams {
  if (naturalWidth <= 0 || naturalHeight <= 0) {
    throw new Error("ขนาดของรูปภาพไม่ถูกต้อง (ความกว้างและความสูงต้องมากกว่า 0)");
  }

  // Cover scaling: scale so that the image completely covers targetWidth x targetHeight
  const scale = Math.max(
    targetWidth / naturalWidth,
    targetHeight / naturalHeight
  );
  const sWidth = targetWidth / scale;
  const sHeight = targetHeight / scale;
  const sx = Math.max(0, (naturalWidth - sWidth) / 2);
  const sy = Math.max(0, (naturalHeight - sHeight) / 2);

  return {
    sx,
    sy,
    sWidth,
    sHeight,
    dx: 0,
    dy: 0,
    dWidth: targetWidth,
    dHeight: targetHeight,
  };
}

/**
 * Resizes an image file or Base64 data URL to exactly 100x100 px (or target dimensions) via HTML5 Canvas.
 */
export async function resizeImageTo100x100(
  source: File | string,
  targetWidth = 100,
  targetHeight = 100,
  quality = 0.92
): Promise<string> {
  let dataUrl: string;

  if (typeof source === "string") {
    dataUrl = source;
  } else if (typeof window !== "undefined" && typeof FileReader !== "undefined") {
    dataUrl = await new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => resolve(e.target?.result as string);
      reader.onerror = () => reject(new Error("เกิดข้อผิดพลาดในการอ่านไฟล์รูปภาพ"));
      reader.readAsDataURL(source);
    });
  } else {
    throw new Error("ไม่สามารถอ่านข้อมูลไฟล์รูปภาพในสภาพแวดล้อมนี้ได้");
  }

  const img = new window.Image();
  img.src = dataUrl;
  await new Promise<void>((resolve, reject) => {
    img.onload = () => resolve();
    img.onerror = () => reject(new Error("ไม่สามารถประมวลผลไฟล์รูปภาพได้"));
  });

  const params = calculateResizeDimensions(
    img.naturalWidth,
    img.naturalHeight,
    targetWidth,
    targetHeight
  );

  const canvas = document.createElement("canvas");
  canvas.width = params.dWidth;
  canvas.height = params.dHeight;
  const ctx = canvas.getContext("2d");

  if (!ctx) {
    throw new Error("ไม่สามารถสร้าง Canvas Context สำหรับประมวลผลรูปภาพได้");
  }

  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = "high";

  ctx.drawImage(
    img,
    params.sx,
    params.sy,
    params.sWidth,
    params.sHeight,
    params.dx,
    params.dy,
    params.dWidth,
    params.dHeight
  );

  const resizedResult = canvas.toDataURL("image/jpeg", quality);
  if (!resizedResult || resizedResult === "data:,") {
    throw new Error("เกิดข้อผิดพลาดในการสร้างรูปภาพขนาด 100 × 100 px");
  }

  return resizedResult;
}

/**
 * Sanitizes image URL by stripping query strings and hashes that cause Next.js Image localPatterns error
 */
export function sanitizeImageUrl(url?: string | null): string | null {
  if (!url || typeof url !== "string") return null;
  const clean = url.trim().split(/[?#]/)[0];
  return clean.length > 0 ? clean : null;
}

export interface ImageInputProps {
  id?: string;
  name?: string;
  currentImage?: string | null;
  fallbackText?: string;
  value?: string | null;
  onChange?: (resizedBase64: string | null) => void;
  disabled?: boolean;
  targetWidth?: number;
  targetHeight?: number;
  maxFileSizeMB?: number;
  title?: string;
  adviceText?: string;
  className?: string;
  onError?: (errorMessage: string) => void;
}

export function ImageInput({
  id = "image-input",
  name = "image",
  currentImage,
  fallbackText = "U",
  value,
  onChange,
  disabled = false,
  targetWidth = 100,
  targetHeight = 100,
  maxFileSizeMB = 5,
  title = "รูปภาพโปรไฟล์ (User Avatar)",
  adviceText,
  className = "",
  onError,
}: ImageInputProps) {
  // Local preview state for the newly selected & resized 100x100 image
  const [localPreview, setLocalPreview] = useState<string | null>(null);
  const [resizing, setResizing] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Clear local preview when controlled value is reset to null/undefined
  useEffect(() => {
    if (!value) {
      setLocalPreview(null);
    }
  }, [value]);

  // The active image to display: local preview > controlled value > initial currentImage
  const rawDisplayImage = localPreview || value || currentImage;
  const sanitizedDisplay = sanitizeImageUrl(rawDisplayImage);

  // File selection handler: resizes to 100x100 and previews locally WITHOUT saving to server
  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setErrorMessage("");

    // 1. Validate MIME type
    if (!file.type.startsWith("image/")) {
      const msg = "กรุณาเลือกไฟล์ที่เป็นรูปภาพเท่านั้น (JPG, PNG, WebP)";
      setErrorMessage(msg);
      if (onError) onError(msg);
      if (fileInputRef.current) fileInputRef.current.value = "";
      return;
    }

    // 2. Validate file size
    if (file.size > maxFileSizeMB * 1024 * 1024) {
      const msg = `ไฟล์รูปภาพมีขนาดใหญ่เกิน ${maxFileSizeMB} MB กรุณาเลือกไฟล์ใหม่`;
      setErrorMessage(msg);
      if (onError) onError(msg);
      if (fileInputRef.current) fileInputRef.current.value = "";
      return;
    }

    try {
      setResizing(true);

      // 3. Automatically resize the selected image to 100x100 px via Canvas
      const resizedBase64 = await resizeImageTo100x100(
        file,
        targetWidth,
        targetHeight
      );

      // 4. Update preview locally (DO NOT save to server yet)
      setLocalPreview(resizedBase64);

      // 5. Notify parent form of the new resized image data for later submission
      if (onChange) {
        onChange(resizedBase64);
      }
    } catch (err: unknown) {
      const msg =
        err instanceof Error
          ? err.message
          : "เกิดข้อผิดพลาดในการปรับขนาดรูปภาพ";
      setErrorMessage(msg);
      if (onError) onError(msg);
    } finally {
      setResizing(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const displayAdvice =
    adviceText ||
    `ควรเลือกรูปภาพสัดส่วน 1:1 เช่น ภาพถ่ายหน้าตรง ระบบจะปรับขนาด (Resize) ให้เป็นขนาดมาตรฐาน ${targetWidth} × ${targetHeight} พิกเซล โดยอัตโนมัติ (รองรับไฟล์ JPG, PNG, WebP ขนาดไม่เกิน ${maxFileSizeMB} MB) และจะบันทึกเมื่อกดบันทึกข้อมูลฟอร์ม`;

  return (
    <div
      className={`mb-8 p-5 sm:p-6 rounded-2xl bg-surface-raised/80 border border-border/80 ${className}`}
    >
      <h2 className="text-sm font-bold text-text mb-4 flex items-center gap-2">
        <Camera className="w-4 h-4 text-primary" />
        <span>{title}</span>
      </h2>

      {errorMessage && (
        <div className="mb-4">
          <TextAlert
            text={errorMessage}
            variant="error"
            onClose={() => setErrorMessage("")}
          />
        </div>
      )}

      <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6">
        {/* Avatar Preview Box (Strictly 100x100 px resized display) */}
        <div className="relative group shrink-0">
          <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-2xl overflow-hidden ring-4 ring-surface shadow-md flex items-center justify-center bg-linear-to-tr from-primary-600 to-accent-700 text-text-inverse font-bold text-3xl select-none">
            {sanitizedDisplay ? (
              <Image
                src={sanitizedDisplay}
                alt="User Avatar"
                width={112}
                height={112}
                className="w-full h-full object-cover"
                unoptimized
              />
            ) : (
              <span>{fallbackText}</span>
            )}
          </div>

          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="absolute -bottom-2 -right-2 p-2.5 rounded-xl bg-primary text-white shadow-md hover:bg-primary-hover transition-all cursor-pointer hover:scale-105 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
            title="เลือกรูปภาพใหม่"
            disabled={disabled || resizing}
          >
            <Camera className="w-4 h-4" />
          </button>

          {/* Hidden File Input */}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            className="hidden"
            onChange={handleFileSelect}
            disabled={disabled || resizing}
          />

          {/* Hidden Form Field for form submission */}
          <input
            type="hidden"
            id={id}
            name={name}
            value={localPreview || value || ""}
          />
        </div>

        {/* Actions & Advice */}
        <div className="flex-1 space-y-3 text-center sm:text-left">
          <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2.5">
            <Button
              type="button"
              variant="outline"
              size="sm"
              text={resizing ? "กำลังปรับขนาดรูปภาพ..." : "เลือกรูปภาพใหม่..."}
              icon={<Upload className="w-3.5 h-3.5" />}
              onClick={() => fileInputRef.current?.click()}
              disabled={disabled || resizing}
              loading={resizing}
            />

            {localPreview && (
              <span className="text-[11px] font-medium text-available-600 bg-available-50 border border-available-200/60 px-2.5 py-1 rounded-lg">
                ปรับขนาด 100 × 100 px แล้ว (รอการกดบันทึก)
              </span>
            )}
          </div>

          {/* Aspect Ratio 1:1 and 100x100 px Advice Box */}
          <div className="rounded-xl p-3.5 bg-primary-50/70 border border-primary-200/60 text-xs text-primary-900 flex items-start gap-2.5 text-left">
            <Info className="w-4 h-4 text-primary-600 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <p className="font-semibold text-primary-800">
                คำแนะนำสัดส่วนและขนาดรูปภาพ:
              </p>
              <p className="text-primary-700/90 leading-relaxed">
                {displayAdvice}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ImageInput;
