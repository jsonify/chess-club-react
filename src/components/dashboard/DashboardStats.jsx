// src/components/dashboard/DashboardStats.jsx
import { useEffect, useState } from 'react';
import { Users, CheckCircle, Award } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { isDuringClubHours, formatDateForDB } from '@/lib/utils';

export default function DashboardStats() {
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
      const { data: students, error: studentsError } = await supabase
        .from('students')
        .select('id')
        .eq('active', true);

      if (studentsError) throw studentsError;

      const totalStudents = students?.length || 0;

      if (isDuringClubHours(new Date())) {
        const today = formatDateForDB(new Date());
        const { data: session } = await supabase
          .from('attendance_sessions')
          .select('id')
          .eq('session_date', today)
          .single();

        if (session) {
          const { data: attendance } = await supabase
            .from('attendance_records')
            .select('id')
            .eq('session_id', session.id)
            .not('check_in_time', 'is', null);

          const presentToday = attendance?.length || 0;
          
          setStats({
            totalStudents,
            presentToday,
            attendanceRate: totalStudents ? Math.round((presentToday / totalStudents) * 100) : 0
          });
        }
      } else {
        setStats({
          totalStudents,
          presentToday: 0,
          attendanceRate: 0
        });
      }
    } catch (error) {
      console.error('Error loading stats:', error);
    }
  };

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-3 mb-6 hidden md:grid">
      <StatCard
        icon={<Users className="h-6 w-6" />}
        title="Total Students"
        value={stats.totalStudents}
      />
      <StatCard
        icon={<CheckCircle className="h-6 w-6" />}
        title="Present Today"
        value={stats.presentToday}
      />
      <StatCard
        icon={<Award className="h-6 w-6" />}
        title="Attendance Rate"
        value={`${stats.attendanceRate}%`}
      />
    </div>
  );
}

const StatCard = ({ icon, title, value }) => {
  return (
    <div className="bg-white p-6 rounded-lg shadow">
      <div className="flex items-center gap-2">
        {icon}
        <h3 className="text-sm font-medium text-gray-600">{title}</h3>
      </div>
      <p className="mt-2 text-3xl font-semibold">{value}</p>
    </div>
  );
}