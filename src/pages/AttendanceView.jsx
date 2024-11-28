// src/pages/AttendanceView.jsx
import { useState } from 'react';
import { isWednesday } from '@/lib/utils';
import DashboardStats from '@/components/dashboard/DashboardStats';
import ClubDayAlert from '@/components/dashboard/alerts/ClubDayAlert';
import RealTimeAttendance from '@/components/attendance/RealTimeAttendance';

export default function AttendanceView() {
  const [stats, setStats] = useState({
    totalStudents: 0,
    presentToday: 0,
    attendanceRate: 0
  });

  const handleStatsUpdate = (newStats) => {
    setStats(newStats);
  };

  const today = new Date();

  return (
    <div className="space-y-6 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <h1 className="text-3xl font-bold tracking-tight text-gray-900">
        Attendance Dashboard
      </h1>

      {isWednesday(today) && <ClubDayAlert />}

      <DashboardStats stats={stats} />

      <RealTimeAttendance onStatsChange={handleStatsUpdate} />
    </div>
  );
}