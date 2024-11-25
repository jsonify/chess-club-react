import { Users, CheckCircle, Award } from 'lucide-react';

export default function DashboardStats({ stats, loading }) {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-3 mb-6">
      <StatCard
        icon={<Users className="h-6 w-6" />}
        title="Total Students"
        value={loading ? '-' : stats.totalStudents}
      />
      <StatCard
        icon={<CheckCircle className="h-6 w-6" />}
        title="Present Today"
        value={loading ? '-' : stats.presentToday}
      />
      <StatCard
        icon={<Award className="h-6 w-6" />}
        title="Attendance Rate"
        value={loading ? '-' : `${stats.attendanceRate}%`}
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
      <p className="mt-2 text-2xl font-semibold">{value}</p>
    </div>
  );
};