// src/pages/AttendanceView.jsx
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { formatDate, isWednesday } from '@/lib/utils';
import { toast } from 'sonner';
import RealTimeAttendance from '@/components/attendance/RealTimeAttendance';
import DashboardStats from '@/components/dashboard/DashboardStats';
import ClubDayAlert from '@/components/dashboard/alerts/ClubDayAlert';

export default function AttendanceView() {
  const [stats, setStats] = useState({
    totalStudents: 0,
    presentToday: 0,
    attendanceRate: 0
  });

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      const { data: students } = await supabase
        .from('students')
        .select('*')
        .eq('active', true);

      const today = formatDate(new Date());
      const { data: session } = await supabase
        .from('attendance_sessions')
        .select('id')
        .eq('session_date', today)
        .single();

      if (session) {
        const { data: records } = await supabase
          .from('attendance_records')
          .select('*')
          .eq('session_id', session.id);

        const presentCount = records?.filter(r => r.check_in_time).length || 0;
        setStats({
          totalStudents: students?.length || 0,
          presentToday: presentCount,
          attendanceRate: Math.round((presentCount / (students?.length || 1)) * 100)
        });
      }
    } catch (error) {
      console.error('Error loading stats:', error);
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <h1 className="text-3xl font-bold tracking-tight text-gray-900">
        Attendance Dashboard
      </h1>

      {isWednesday(new Date()) && <ClubDayAlert />}

      <DashboardStats stats={stats} />

      <RealTimeAttendance onAttendanceChange={loadStats} />
    </div>
  );
}