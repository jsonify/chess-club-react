// src/components/attendance/AttendanceTable.jsx
import { CheckCircle, ChevronDown, ChevronUp, Loader2 } from 'lucide-react';

export default function AttendanceTable({
  loading,
  error,
  students,
  attendance,
  sortConfig,
  onSort,
  onCheckIn,
  onCheckOut,
  searchQuery,
  filterGrade
}) {
  const filteredStudents = students.filter(student => {
    const matchesSearch = (
      student.first_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      student.last_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      student.teacher?.toLowerCase().includes(searchQuery.toLowerCase())
    );
    const matchesGrade = filterGrade === 'all' || student.grade.toString() === filterGrade;
    return matchesSearch && matchesGrade;
  });

  const sortedStudents = [...filteredStudents].sort((a, b) => {
    const direction = sortConfig.direction === 'asc' ? 1 : -1;
    switch (sortConfig.key) {
      case 'first_name':
        return direction * a.first_name.localeCompare(b.first_name);
      case 'last_name':
        return direction * a.last_name.localeCompare(b.last_name);
      case 'grade':
        return direction * (a.grade - b.grade);
      case 'teacher':
        return direction * a.teacher.localeCompare(b.teacher);
      default:
        return 0;
    }
  });

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
        <h3 className="font-medium">Error loading attendance data: {error}</h3>
      </div>
    );
  }

  const SortIcon = ({ columnKey }) => {
    if (sortConfig.key !== columnKey) {
      return <ChevronDown className="inline h-4 w-4 text-gray-400" />;
    }
    return sortConfig.direction === 'asc' 
      ? <ChevronUp className="inline h-4 w-4 text-gray-700" />
      : <ChevronDown className="inline h-4 w-4 text-gray-700" />;
  };

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-gray-200">
        {/* Table header */}
        <thead className="bg-gray-50">
          <tr>
            {[
              { key: 'first_name', label: 'First Name' },
              { key: 'last_name', label: 'Last Name' },
              { key: 'grade', label: 'Grade' },
              { key: 'teacher', label: 'Teacher' }
            ].map(column => (
              <th
                key={column.key}
                onClick={() => onSort(column.key)}
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
              >
                {column.label} <SortIcon columnKey={column.key} />
              </th>
            ))}
            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
              Attendance
            </th>
          </tr>
        </thead>

        {/* Table body */}
        <tbody className="bg-white divide-y divide-gray-200">
          {sortedStudents.map((student) => (
            <tr
              key={student.id}
              className={`hover:bg-gray-50 ${
                attendance[student.id]?.checkedIn ? 'bg-blue-50' : ''
              }`}
            >
              <td className="px-6 py-4 whitespace-nowrap">
                <div className="text-sm font-medium text-gray-900">
                  {student.first_name}
                </div>
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                <div className="text-sm font-medium text-gray-900">
                  {student.last_name}
                </div>
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                <div className="text-sm text-gray-900">{student.grade}</div>
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                <div className="text-sm text-gray-900">{student.teacher}</div>
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-right">
                <div className="flex items-center justify-end space-x-4">
                  <button
                    onClick={() => onCheckIn(student.id)}
                    className={`flex items-center space-x-1 px-3 py-1 rounded-md transition-colors ${
                      attendance[student.id]?.checkedIn
                        ? 'bg-green-100 text-green-700'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    <CheckCircle className="h-4 w-4" />
                    <span>In</span>
                  </button>
                  <button
                    onClick={() => onCheckOut(student.id)}
                    className={`flex items-center space-x-1 px-3 py-1 rounded-md transition-colors ${
                      attendance[student.id]?.checkedOut
                        ? 'bg-green-100 text-green-700'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                    disabled={!attendance[student.id]?.checkedIn}
                  >
                    <CheckCircle className="h-4 w-4" />
                    <span>Out</span>
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}