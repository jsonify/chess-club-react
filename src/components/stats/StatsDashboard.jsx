// src/components/stats/StatsDashboard.jsx
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from 'recharts';
import { 
  Users, 
  Trophy,
  Award,
  GraduationCap,
  Timer,  // instead of Clock
  CalendarCheck,
  Target,
  Swords,  // instead of Chess
  Loader2
} from 'lucide-react';

export default function StatsDashboard() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [stats, setStats] = useState({
    attendance: {
      totalSessions: 0,
      averageAttendance: 0,
      mostAttendedDate: null,
      byGrade: {}
    },
    tournaments: {
      totalMatches: 0,
      averageMatchesPerSession: 0,
      totalPlayers: 0,
      championCount: 0,
      fivePointClub: 0,
      results: {
        wins: 0,
        draws: 0,
        incomplete: 0
      }
    },
    students: {
      total: 0,
      byGrade: {},
      byTeacher: {},
      active: 0
    }
  });

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      setLoading(true);

      // Fetch student stats
      const { data: students } = await supabase
        .from('students')
        .select('*');

      // Fetch attendance records
      const { data: attendance } = await supabase
        .from('attendance_records')
        .select('*, attendance_sessions(session_date)');

      // Fetch tournament matches
      const { data: matches } = await supabase
        .from('matches')
        .select('*, player1:player1_id(*), player2:player2_id(*)');

      // Process student statistics
      const studentStats = {
        total: students?.length || 0,
        active: students?.filter(s => s.active).length || 0,
        byGrade: {},
        byTeacher: {}
      };

      students?.forEach(student => {
        // Count by grade
        studentStats.byGrade[student.grade] = (studentStats.byGrade[student.grade] || 0) + 1;
        // Count by teacher
        studentStats.byTeacher[student.teacher] = (studentStats.byTeacher[student.teacher] || 0) + 1;
      });

      // Process attendance statistics
      const attendanceStats = {
        totalSessions: new Set(attendance?.map(r => r.attendance_sessions?.session_date)).size,
        averageAttendance: 0,
        mostAttendedDate: null,
        byGrade: {}
      };

      // Group attendance by date
      const attendanceByDate = {};
      attendance?.forEach(record => {
        const date = record.attendance_sessions?.session_date;
        if (date) {
          attendanceByDate[date] = (attendanceByDate[date] || 0) + 1;
        }
      });

      // Find most attended date and calculate average
      if (Object.keys(attendanceByDate).length > 0) {
        attendanceStats.mostAttendedDate = Object.entries(attendanceByDate)
          .reduce((a, b) => a[1] > b[1] ? a : b)[0];
        attendanceStats.averageAttendance = Math.round(
          Object.values(attendanceByDate)
            .reduce((a, b) => a + b, 0) / Object.keys(attendanceByDate).length
        );
      }

      // Process tournament statistics
      const tournamentStats = {
        totalMatches: matches?.length || 0,
        averageMatchesPerSession: 0,
        totalPlayers: new Set([
          ...(matches?.map(m => m.player1_id) || []),
          ...(matches?.map(m => m.player2_id) || [])
        ]).size,
        championCount: 0,
        fivePointClub: 0,
        results: {
          wins: matches?.filter(m => m.result.includes('win')).length || 0,
          draws: matches?.filter(m => m.result === 'draw').length || 0,
          incomplete: matches?.filter(m => m.result === 'incomplete').length || 0
        }
      };

      // Calculate average matches per session
      if (attendanceStats.totalSessions > 0) {
        tournamentStats.averageMatchesPerSession = Math.round(
          tournamentStats.totalMatches / attendanceStats.totalSessions
        );
      }

      setStats({
        students: studentStats,
        attendance: attendanceStats,
        tournaments: tournamentStats
      });

    } catch (err) {
      console.error('Error fetching stats:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 bg-red-50 text-red-700 rounded-lg">
        <p className="font-medium">Error loading statistics: {error}</p>
      </div>
    );
  }

  // Prepare data for charts
  const gradeDistributionData = Object.entries(stats.students.byGrade)
    .map(([grade, count]) => ({
      name: `Grade ${grade}`,
      value: count
    }));

  const matchResultsData = [
    { name: 'Wins', value: stats.tournaments.results.wins },
    { name: 'Draws', value: stats.tournaments.results.draws },
    { name: 'Incomplete', value: stats.tournaments.results.incomplete }
  ];

  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042'];

  const StatCard = ({ icon: Icon, title, value, subtitle }) => (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex items-center">
        <div className="flex-shrink-0">
          <Icon className="h-6 w-6 text-blue-500" />
        </div>
        <div className="ml-4">
          <h3 className="text-sm font-medium text-gray-500">{title}</h3>
          <p className="text-2xl font-semibold text-gray-900">{value}</p>
          {subtitle && (
            <p className="text-sm text-gray-500">{subtitle}</p>
          )}
        </div>
      </div>
    </div>
  );

  return (
    <div className="space-y-8">
      {/* Student Statistics */}
      <section>
        <h2 className="text-lg font-medium text-gray-900 mb-4">Student Statistics</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <StatCard
            icon={Users}
            title="Total Students"
            value={stats.students.total}
          />
          <StatCard
            icon={Users}
            title="Active Students"
            value={stats.students.active}
            subtitle={`${Math.round((stats.students.active / stats.students.total) * 100)}% of total`}
          />
          <StatCard
            icon={GraduationCap}
            title="Average Grade Level"
            value={Object.entries(stats.students.byGrade)
              .reduce((acc, [grade, count]) => acc + (grade * count), 0) / stats.students.total}
            subtitle="Weighted average"
          />
        </div>
        
        <div className="mt-6 bg-white rounded-lg shadow p-6">
          <h3 className="text-sm font-medium text-gray-500 mb-4">Grade Distribution</h3>
          <div className="h-64">
            <BarChart
              width={600}
              height={250}
              data={gradeDistributionData}
              margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="value" fill="#0088FE" name="Students" />
            </BarChart>
          </div>
        </div>
      </section>

      {/* Attendance Statistics */}
      <section>
        <h2 className="text-lg font-medium text-gray-900 mb-4">Attendance Statistics</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <StatCard
            icon={CalendarCheck}
            title="Total Sessions"
            value={stats.attendance.totalSessions}
          />
          <StatCard
            icon={Users}
            title="Average Attendance"
            value={stats.attendance.averageAttendance}
            subtitle="Students per session"
          />
          <StatCard
            icon={Clock}
            title="Most Attended"
            value={new Date(stats.attendance.mostAttendedDate).toLocaleDateString()}
          />
        </div>
      </section>

      {/* Tournament Statistics */}
      <section>
        <h2 className="text-lg font-medium text-gray-900 mb-4">Tournament Statistics</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <StatCard
            icon={Chess}
            title="Total Matches"
            value={stats.tournaments.totalMatches}
          />
          <StatCard
            icon={Trophy}
            title="Active Players"
            value={stats.tournaments.totalPlayers}
          />
          <StatCard
            icon={Target}
            title="Matches per Session"
            value={stats.tournaments.averageMatchesPerSession}
          />
        </div>

        <div className="mt-6 bg-white rounded-lg shadow p-6">
          <h3 className="text-sm font-medium text-gray-500 mb-4">Match Results Distribution</h3>
          <div className="h-64 flex justify-center">
            <PieChart width={400} height={250}>
              <Pie
                data={matchResultsData}
                cx={200}
                cy={125}
                innerRadius={60}
                outerRadius={80}
                fill="#8884d8"
                paddingAngle={5}
                dataKey="value"
                label
              >
                {matchResultsData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
              <Legend />
            </PieChart>
          </div>
        </div>
      </section>
    </div>
  );
}