// src/pages/AttendanceView.jsx
import { useState } from 'react';
import { isDuringClubHours, getNextSessionDate, formatDate } from '@/lib/utils';
import DashboardStats from '@/components/dashboard/DashboardStats';
import ClubDayAlert from '@/components/dashboard/alerts/ClubDayAlert';
import RealTimeAttendance from '@/components/attendance/RealTimeAttendance';

export default function AttendanceView() {
  const [stats, setStats] = useState({
    totalStudents: 0,
    presentToday: 0,
    attendanceRate: 0
  });

  // Get the current or next session date
  const now = new Date();
  const isActiveSession = isDuringClubHours(now);
  const sessionDate = isActiveSession ? now : getNextSessionDate();
  const formattedSessionDate = formatDate(sessionDate);

  const handleStatsUpdate = (newStats) => {
    setStats(newStats);
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <h1 className="text-3xl font-bold tracking-tight text-gray-900">
        Attendance Dashboard
      </h1>

      {isActiveSession && <ClubDayAlert />}

      <DashboardStats stats={stats} />

      <RealTimeAttendance 
        date={isActiveSession ? sessionDate : null}
        onStatsChange={handleStatsUpdate}
        nextSessionDate={!isActiveSession ? formattedSessionDate : null}
      />
    </div>
  );
}