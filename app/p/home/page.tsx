import Link from "next/link";
import { PlusCircle, Calendar } from "lucide-react";
import { MeetingRoomScheduler } from "@/components/scheduler";

export default function HomePage() {
  return (
    <main className="min-h-screen bg-surface-raised py-6 sm:py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Hero / Header Section */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-surface p-5 sm:p-6 rounded-2xl border border-border shadow-xs">
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-primary-600 font-semibold text-xs tracking-wider uppercase">
              <Calendar className="w-4 h-4" />
              <span>Korjong Meeting System</span>
            </div>
            <h1 className="text-xl sm:text-2xl font-bold text-text">
              ตารางการใช้งานห้องประชุม
            </h1>
            <p className="text-xs sm:text-sm text-text-secondary">
              ตรวจสอบสถานะห้องประชุมแบบเรียลไทม์ และวางแผนการใช้งานได้อย่างมีประสิทธิภาพ
            </p>
          </div>

          <div className="flex items-center gap-2.5 shrink-0">
            <Link
              href="/p/booking"
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-primary-600 hover:bg-primary-700 text-white font-semibold text-sm shadow-sm transition-all focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2"
            >
              <PlusCircle className="w-4 h-4" />
              <span>เข้าสู่หน้าจอจองห้อง</span>
            </Link>
          </div>
        </div>

        {/* Meeting Room Scheduler Component in Read-Only Mode (Requirement 9) */}
        <section aria-label="Meeting Room Schedule">
          <MeetingRoomScheduler readOnly={true} />
        </section>
      </div>
    </main>
  );
}