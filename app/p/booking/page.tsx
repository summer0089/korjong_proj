import { Calendar, CalendarCheck } from "lucide-react";
import { MeetingRoomScheduler } from "@/components/scheduler";

export default function BookingPage() {
  return (
    <main className="min-h-screen bg-surface-raised py-6 sm:py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Page Header */}
        <div className="bg-surface p-5 sm:p-6 rounded-2xl border border-border shadow-xs flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-primary-600 font-semibold text-xs tracking-wider uppercase">
              <CalendarCheck className="w-4 h-4" />
              <span>การจองห้องประชุม</span>
            </div>
            <h1 className="text-xl sm:text-2xl font-bold text-text">
              ระบบจองและจัดการห้องประชุม
            </h1>
            <p className="text-xs sm:text-sm text-text-secondary">
              คลิกหรือลากเมาส์บนตารางเพื่อเลือกช่วงเวลาที่ต้องการจองห้องประชุม
            </p>
          </div>
        </div>

        {/* Meeting Room Scheduler Component (Interactive Mode) */}
        <section aria-label="Meeting Room Scheduler Interactive">
          <MeetingRoomScheduler readOnly={false} />
        </section>
      </div>
    </main>
  );
}
