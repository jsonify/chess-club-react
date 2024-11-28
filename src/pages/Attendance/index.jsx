// src/pages/Attendance/index.jsx
import { useState } from 'react';
import { isWednesday, formatDate, getNextWednesday } from '@/lib/utils';
import DashboardStats from '@/components/dashboard/DashboardStats';
import ClubDayAlert from '@/components/dashboard/alerts/ClubDayAlert';
import AttendanceTable from '@/components/attendance/AttendanceTable';
import AttendanceFilters from '@/components/attendance/AttendanceFilters';
import { useAttendance } from '@/hooks/useAttendance';

export default function AttendancePage() {  // Renamed to match naming convention
  const [searchQuery, setSearchQuery] = useState('');
  const [filterGrade, setFilterGrade] = useState('all');
  const [sortConfig, setSortConfig] = useState({
    key: 'first_name',
    direction: 'asc'
  });

  const {
    loading,
    error,
    students,
    attendance,
    currentSession,
    stats,
    toggleCheckIn,
    toggleCheckOut,
    isConnected
  } = useAttendance();

  // Filter and sort handlers
  const handleSearch = (query) => setSearchQuery(query);
  const handleGradeFilter = (grade) => setFilterGrade(grade);
  const handleSort = (key) => {
    setSortConfig(current => ({
      key,
      direction: current.key === key && current.direction === 'asc' ? 'desc' : 'asc',
    }));
  };

  const today = new Date();
  const displayDate = isWednesday(today) ? today : getNextWednesday();
  const formattedDisplayDate = formatDate(displayDate);

  return (
    <div className="space-y-6 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <h1 className="text-3xl font-bold tracking-tight text-gray-900">
        Attendance Dashboard
      </h1>

      {isWednesday(today) && <ClubDayAlert />}

      <DashboardStats stats={stats} />

      <div className="bg-white rounded-lg shadow">
        <AttendanceFilters
          searchQuery={searchQuery}
          filterGrade={filterGrade}
          onSearch={handleSearch}
          onGradeFilter={handleGradeFilter}
          isConnected={isConnected}
          displayDate={formattedDisplayDate}
        />

        <AttendanceTable
          loading={loading}
          error={error}
          students={students}
          attendance={attendance}
          currentSession={currentSession}
          sortConfig={sortConfig}
          onSort={handleSort}
          onCheckIn={toggleCheckIn}
          onCheckOut={toggleCheckOut}
          searchQuery={searchQuery}
          filterGrade={filterGrade}
        />
      </div>
    </div>
  );
}