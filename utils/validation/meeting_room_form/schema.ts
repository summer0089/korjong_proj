import { z } from "zod";

export const MeetingRoomSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, "กรุณากรอกชื่อห้องประชุม")
    .max(150, "ชื่อห้องประชุมต้องไม่เกิน 150 ตัวอักษร"),
  capacity: z
    .number("จำนวนผู้เข้าใช้ต้องเป็นจำนวนเต็ม")
    .gte(5, "จำนวนผู้เข้าใช้ต้องมากกว่า 5 คน"),
});

export type MeetingRoomFormData = z.infer<typeof MeetingRoomSchema>;
