// src/components/attendance/AttendanceFilters.jsx
import { Search, Wifi, WifiOff } from 'lucide-react';

export default function AttendanceFilters({
  searchQuery,
  filterGrade,
  onSearch,
  onGradeFilter,
  isConnected
}) {
  return (
    <div className="p-4 border-b border-gray-200">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-medium">Today's Attendance</h2>
            {isConnected ? (
              <Wifi className="h-5 w-5 text-green-500" title="Real-time updates connected" />
            ) : (
              <WifiOff className="h-5 w-5 text-red-500" title="Real-time updates disconnected" />
            )}
          </div>
        </div>
        <div className="flex flex-wrap gap-4 w-full sm:w-auto">
          <div className="relative flex-grow sm:flex-grow-0">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search students..."
              value={searchQuery}
              onChange={(e) => onSearch(e.target.value)}
              className="pl-9 pr-4 py-2 border rounded-lg w-full"
            />
          </div>
          <select
            value={filterGrade}
            onChange={(e) => onGradeFilter(e.target.value)}
            className="border rounded-lg px-3 py-2"
          >
            <option value="all">All Grades</option>
            {[2, 3, 4, 5, 6].map(grade => (
              <option key={grade} value={grade.toString()}>
                Grade {grade}
              </option>
            ))}
          </select>
        </div>
      </div>
    </div>
  );
}

