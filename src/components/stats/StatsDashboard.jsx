// src/components/stats/StatsDashboard.jsx
import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase-offline";
import {
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import {
  Users,
  Trophy,
  Award,
  GraduationCap,
  Timer,
  CalendarCheck,
  Target,
  Swords,
} from "lucide-react";

const COLORS = ["#0088FE", "#00C49F", "#FFBB28", "#FF8042"];

const GradeDistributionChart = ({ data }) => (
  <ResponsiveContainer width="100%" height={250}>
    <BarChart data={data} margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
      <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={true} />
      <XAxis
        dataKey="name"
        scale="band"
        padding={{ left: 10, right: 10 }}
        tick={{ fill: "#666666", fontSize: 12 }}
        tickLine={{ stroke: "#666666" }}
        axisLine={{ stroke: "#666666" }}
        interval={0}
        height={60}
        minTickGap={5}
        orientation="bottom"
        type="category"
        allowDuplicatedCategory={false}
      />
      <YAxis
        scale="linear"
        domain={[0, "auto"]}
        padding={{ top: 20, bottom: 20 }}
        tick={{ fill: "#666666", fontSize: 12 }}
        tickLine={{ stroke: "#666666" }}
        axisLine={{ stroke: "#666666" }}
        orientation="left"
        type="number"
        allowDecimals={false}
        allowDataOverflow={false}
        minTickGap={5}
      />
      <Tooltip
        contentStyle={{ backgroundColor: "white", border: "1px solid #cccccc" }}
        cursor={{ fill: "rgba(0, 0, 0, 0.1)" }}
        active={true}
      />
      <Legend
        verticalAlign="top"
        align="center"
        height={36}
        iconType="circle"
        iconSize={10}
        margin={{ top: 10, bottom: 10 }}
      />
      <Bar
        dataKey="value"
        name="Students"
        fill="#0088FE"
        radius={[4, 4, 0, 0]}
        barSize={40}
        minPointSize={2}
        maxBarSize={100}
        background={false}
      />
    </BarChart>
  </ResponsiveContainer>
);

const MatchResultsChart = ({ data }) => (
  <ResponsiveContainer width="100%" height={250}>
    <PieChart margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
      <Pie
        data={data}
        dataKey="value"
        nameKey="name"
        cx="50%"
        cy="50%"
        innerRadius={60}
        outerRadius={80}
        paddingAngle={5}
        startAngle={90}
        endAngle={450}
        minAngle={15}
        label={{
          position: "outside",
          offset: 8,
          fill: "#666666",
          fontSize: 12,
        }}
        labelLine={{
          strokeWidth: 1,
          stroke: "#666666",
        }}
      >
        {data.map((entry, index) => (
          <Cell
            key={`cell-${entry.name}-${index}`}
            fill={COLORS[index % COLORS.length]}
            stroke="none"
          />
        ))}
      </Pie>
      <Tooltip
        contentStyle={{
          backgroundColor: "white",
          border: "1px solid #cccccc",
          borderRadius: "4px",
          padding: "8px",
        }}
        active={true}
      />
      <Legend
        verticalAlign="bottom"
        align="center"
        layout="horizontal"
        iconType="circle"
        iconSize={10}
        height={36}
        margin={{ top: 10, bottom: 10 }}
      />
    </PieChart>
  </ResponsiveContainer>
);

const StatCard = ({ icon: Icon, title, value, subtitle }) => (
  <div className="bg-white rounded-lg shadow p-6">
    <div className="flex items-center">
      <div className="flex-shrink-0">
        <Icon className="h-6 w-6 text-blue-500" />
      </div>
      <div className="ml-4">
        <h3 className="text-sm font-medium text-gray-500">{title}</h3>
        <p className="text-2xl font-semibold text-gray-900">{value}</p>
        {subtitle && <p className="text-sm text-gray-500">{subtitle}</p>}
      </div>
    </div>
  </div>
);

export default function StatsDashboard() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [stats, setStats] = useState({
    attendance: {
      totalSessions: 0,
      averageAttendance: 0,
      mostAttendedDate: null,
      byGrade: {},
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
        incomplete: 0,
      },
    },
    students: {
      total: 0,
      byGrade: {},
      byTeacher: {},
      active: 0,
    },
  });

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      setLoading(true);

      const { data: students } = await supabase.from("students").select("*");

      const { data: attendance } = await supabase
        .from("attendance_records")
        .select("*, attendance_sessions(session_date)");

      const { data: matches } = await supabase
        .from("matches")
        .select("*, player1:player1_id(*), player2:player2_id(*)");

      const studentStats = {
        total: students?.length || 0,
        active: students?.filter((s) => s.active).length || 0,
        byGrade: {},
        byTeacher: {},
      };

      students?.forEach((student) => {
        studentStats.byGrade[student.grade] =
          (studentStats.byGrade[student.grade] || 0) + 1;
        studentStats.byTeacher[student.teacher] =
          (studentStats.byTeacher[student.teacher] || 0) + 1;
      });

      const attendanceStats = {
        totalSessions: new Set(
          attendance?.map((r) => r.attendance_sessions?.session_date)
        ).size,
        averageAttendance: 0,
        mostAttendedDate: null,
        byGrade: {},
      };

      const attendanceByDate = {};
      attendance?.forEach((record) => {
        const date = record.attendance_sessions?.session_date;
        if (date) {
          attendanceByDate[date] = (attendanceByDate[date] || 0) + 1;
        }
      });

      if (Object.keys(attendanceByDate).length > 0) {
        attendanceStats.mostAttendedDate = Object.entries(
          attendanceByDate
        ).reduce((a, b) => (a[1] > b[1] ? a : b))[0];
        attendanceStats.averageAttendance = Math.round(
          Object.values(attendanceByDate).reduce((a, b) => a + b, 0) /
            Object.keys(attendanceByDate).length
        );
      }

      const tournamentStats = {
        totalMatches: matches?.length || 0,
        averageMatchesPerSession: 0,
        totalPlayers: new Set([
          ...(matches?.map((m) => m.player1_id) || []),
          ...(matches?.map((m) => m.player2_id) || []),
        ]).size,
        championCount: 0,
        fivePointClub: 0,
        results: {
          wins: matches?.filter((m) => m.result.includes("win")).length || 0,
          draws: matches?.filter((m) => m.result === "draw").length || 0,
          incomplete:
            matches?.filter((m) => m.result === "incomplete").length || 0,
        },
      };

      if (attendanceStats.totalSessions > 0) {
        tournamentStats.averageMatchesPerSession = Math.round(
          tournamentStats.totalMatches / attendanceStats.totalSessions
        );
      }

      setStats({
        students: studentStats,
        attendance: attendanceStats,
        tournaments: tournamentStats,
      });
    } catch (err) {
      console.error("Error fetching stats:", err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin h-8 w-8 border-b-2 border-blue-500 rounded-full" />
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

  const gradeDistributionData = Object.entries(stats.students.byGrade).map(
    ([grade, count]) => ({
      name: `Grade ${grade}`,
      value: count,
    })
  );

  const matchResultsData = [
    { name: "Wins", value: stats.tournaments.results.wins },
    { name: "Draws", value: stats.tournaments.results.draws },
    { name: "Incomplete", value: stats.tournaments.results.incomplete },
  ];

  return (
    <div className="space-y-8">
      {/* Student Statistics */}
      <section>
        <h2 className="text-lg font-medium text-gray-900 mb-4">
          Student Statistics
        </h2>
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
            subtitle={`${Math.round(
              (stats.students.active / stats.students.total) * 100
            )}% of total`}
          />
          <StatCard
            icon={GraduationCap}
            title="Average Grade Level"
            value={(
              Object.entries(stats.students.byGrade).reduce(
                (acc, [grade, count]) => acc + Number(grade) * count,
                0
              ) / stats.students.total
            ).toFixed(1)}
            subtitle="Weighted average"
          />
        </div>

        <div className="mt-6 bg-white rounded-lg shadow p-6">
          <h3 className="text-sm font-medium text-gray-500 mb-4">
            Grade Distribution
          </h3>
          <GradeDistributionChart data={gradeDistributionData} />
        </div>
      </section>

      {/* Attendance Statistics */}
      <section>
        <h2 className="text-lg font-medium text-gray-900 mb-4">
          Attendance Statistics
        </h2>
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
            icon={Timer}
            title="Most Attended"
            value={
              stats.attendance.mostAttendedDate
                ? new Date(
                    stats.attendance.mostAttendedDate
                  ).toLocaleDateString()
                : "N/A"
            }
          />
        </div>
      </section>

      {/* Tournament Statistics */}
      <section>
        <h2 className="text-lg font-medium text-gray-900 mb-4">
          Tournament Statistics
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <StatCard
            icon={Swords}
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
          <h3 className="text-sm font-medium text-gray-500 mb-4">
            Match Results Distribution
          </h3>
          <MatchResultsChart data={matchResultsData} />
        </div>
      </section>
    </div>
  );
}
