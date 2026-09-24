/**
 * Helper สำหรับสร้าง Avatar ตัวอักษรและสีพื้นหลัง
 * รองรับภาษาไทย (ดึงเฉพาะพยัญชนะต้น โดยข้ามสระหน้า เ, แ, โ, ใ, ไ) และภาษาอังกฤษ
 */

// รหัส Unicode พยัญชนะไทย ก (\u0E01) ถึง ฮ (\u0E2E)
const THAI_CONSONANT_REGEX = /[\u0E01-\u0E2E]/;

// สระหน้าภาษาไทยที่ต้องข้าม: เ, แ, โ, ใ, ไ
const THAI_LEADING_VOWELS = new Set(["\u0E40", "\u0E41", "\u0E42", "\u0E43", "\u0E44"]);

// ภาษาอังกฤษ A-Z
const LATIN_LETTER_REGEX = /[a-zA-Z]/;

// จานสีพื้นหลังที่คัดสรรมาอย่างสวยงาม สว่างชัดเจนและเข้ากับข้อความสีขาว
const AVATAR_PALETTE = [
  { bg: "#2563eb", text: "#ffffff", ring: "#93c5fd" }, // Blue
  { bg: "#0d9488", text: "#ffffff", ring: "#99f6e4" }, // Teal
  { bg: "#059669", text: "#ffffff", ring: "#a7f3d0" }, // Emerald
  { bg: "#7c3aed", text: "#ffffff", ring: "#c4b5fd" }, // Violet
  { bg: "#c026d3", text: "#ffffff", ring: "#f5d0fe" }, // Fuchsia
  { bg: "#e11d48", text: "#ffffff", ring: "#fecdd3" }, // Rose
  { bg: "#d97706", text: "#ffffff", ring: "#fde68a" }, // Amber
  { bg: "#4f46e5", text: "#ffffff", ring: "#c7d2fe" }, // Indigo
  { bg: "#0284c7", text: "#ffffff", ring: "#bae6fd" }, // Sky
  { bg: "#ea580c", text: "#ffffff", ring: "#fed7aa" }, // Orange
];

/**
 * ดึงตัวพยัญชนะแรกของชื่อ โดยไม่ใช้สระในภาษาไทย (ข้ามสระหน้า เ, แ, โ, ใ, ไ)
 * หรือตัวอักษรภาษาอังกฤษตัวแรก (แปลงเป็นตัวพิมพ์ใหญ่)
 *
 * @param name - ชื่อของผู้ใช้งาน (หรืออีเมล)
 * @returns ตัวพยัญชนะแรก 1 ตัว
 */
export function getInitialConsonant(name?: string | null): string {
  if (!name || typeof name !== "string") {
    return "U";
  }

  const trimmed = name.trim();
  if (!trimmed) {
    return "U";
  }

  // ค้นหาพยัญชนะแรกในข้อความ
  for (const char of trimmed) {
    // ข้ามสระหน้าภาษาไทย (เ, แ, โ, ใ, ไ)
    if (THAI_LEADING_VOWELS.has(char)) {
      continue;
    }

    // หากเป็นพยัญชนะไทย ก-ฮ
    if (THAI_CONSONANT_REGEX.test(char)) {
      return char;
    }

    // หากเป็นตัวอักษรภาษาอังกฤษ
    if (LATIN_LETTER_REGEX.test(char)) {
      return char.toUpperCase();
    }
  }

  // กรณีเป็นตัวเลข หรืออักขระอื่น ให้ใช้ตัวแรกที่ไม่ใช่ช่องว่าง
  return trimmed.charAt(0).toUpperCase();
}

/**
 * คำนวณ Hash อย่างง่ายจากสตริง เพื่อเลือกสีจาก Palette
 */
function hashString(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = (hash << 5) - hash + str.charCodeAt(i);
    hash |= 0; // แปลงเป็น 32bit integer
  }
  return Math.abs(hash);
}

/**
 * ดึงข้อมูลการแสดงผล Avatar (ตัวอักษรย่อ, สีพื้นหลัง, สีตัวอักษร)
 *
 * @param name - ชื่อของผู้ใช้งาน
 * @param seed - ค่าทางเลือกสำหรับสุ่มสี เช่น email หรือ id หากไม่ระบุจะใช้ name
 */
export function getAvatarProps(name?: string | null, seed?: string | null) {
  const initial = getInitialConsonant(name);
  const key = seed || name || "default";
  const paletteIndex = hashString(key) % AVATAR_PALETTE.length;
  const color = AVATAR_PALETTE[paletteIndex];

  return {
    initial,
    backgroundColor: color.bg,
    color: color.text,
    ringColor: color.ring,
  };
}
