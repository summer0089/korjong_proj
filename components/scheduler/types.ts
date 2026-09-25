export type MeetingStatus = "PENDING" | "APPROVED" | "CANCELED" | "REJECTED";

export interface MeetingRoom {
  id: string;
  name: string;
  capacity: number;
  location?: string;
  facilities?: string[];
  color?: string; // Optional custom brand color for room
}

export interface BookingEmployee {
  id: string;
  firstname: string;
  lastname: string;
  email?: string;
  department?: string;
  position?: string;
  phoneNumber?: string;
  profileImage?: string | null;
}

export interface MeetingBooking {
  id: string;
  topic: string;
  participant: number;
  note?: string;
  status: MeetingStatus;
  startTime: string; // ISO 8601 or Date string
  endTime: string;   // ISO 8601 or Date string
  createdAt?: string;
  updatedAt?: string;
  employeeId: string;
  employee?: BookingEmployee;
  roomId: string;
  room?: MeetingRoom;
}

export interface CurrentUser {
  id: string;
  firstname: string;
  lastname: string;
  email?: string;
  department?: string;
  position?: string;
  role?: "ADMIN" | "APPROVER" | "USER" | string;
}

export interface TimeSlot {
  hour: number;
  minute: number;
  label: string; // e.g. "08:00", "08:30"
  totalMinutes: number; // e.g. 510 for 08:30
}

export interface DragSelection {
  roomId: string;
  startMinutes: number;
  endMinutes: number;
  isDragging: boolean;
}

export interface SchedulerFilterState {
  search: string;
  roomId: string; // "ALL" or specific roomId
  status: string; // "ALL" or MeetingStatus
}

export interface MeetingRoomSchedulerProps {
  rooms?: MeetingRoom[];
  bookings?: MeetingBooking[];
  currentUser?: CurrentUser | null;
  initialDate?: Date | string;
  startHour?: number;          // Default: 8 (08:00)
  endHour?: number;            // Default: 18 (18:00)
  slotIntervalMinutes?: number;// Default: 30
  readOnly?: boolean;          // Default: false (for home page / public view)
  onAddBooking?: (booking: Omit<MeetingBooking, "id">) => Promise<boolean | void> | void;
  onUpdateBooking?: (id: string, booking: Partial<MeetingBooking>) => Promise<boolean | void> | void;
  onCancelBooking?: (id: string) => Promise<boolean | void> | void;
  className?: string;
}
