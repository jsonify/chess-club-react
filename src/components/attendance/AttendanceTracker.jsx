// src/components/attendance/AttendanceTracker.jsx
import { useState } from 'react';
import { Search, Loader2 } from 'lucide-react';
import { useAttendance } from '@/hooks/useAttendance';
import { AttendanceStatus } from './AttendanceStatus';
import { AttendanceControls } from './AttendanceControls';
import { toast } from 'sonner';

export default function AttendanceTracker() {
  const [searchQuery, setSearchQuery] = useState('');
  const [filterGrade, setFilterGrade] = useState('all');
  
  const today = new Date();
  const { 
    loading, 
    error, 
    students, 
    records, 
    updateAttendance 
  } = useAttendance(today);

  const handleStatusUpdate = async (studentId, status) => {
    try {
      await updateAttendance(studentId, status);
      toast.success('Attendance updated successfully');
    } catch (error) {
      toast.error('Failed to update attendance');
    }
  };

  const filteredStudents = students.filter(student => {
    const matchesSearch = (
      student.first_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      student.last_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      student.teacher?.toLowerCase().includes(searchQuery.toLowerCase())
    );
    const matchesGrade = filterGrade === 'all' || student.grade.toString() === filterGrade;
    return matchesSearch && matchesGrade;
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

  return (
    <div className="bg-white rounded-lg shadow">
      <div className="p-4 border-b border-gray-200">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search students..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border rounded-lg"
            />
          </div>
          <select
            value={filterGrade}
            onChange={(e) => setFilterGrade(e.target.value)}
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

      <div className="divide-y">
        {filteredStudents.map(student => (
          <div
            key={student.id}
            className="flex items-center justify-between p-4 hover:bg-gray-50"
          >
            <div>
              <div className="font-medium text-gray-900">
                {student.first_name} {student.last_name}
              </div>
              <div className="text-sm text-gray-500">
                Grade {student.grade} - {student.teacher}
              </div>
              <div className="mt-1">
                <AttendanceStatus 
                  status={records[student.id]?.attendance_status} 
                />
              </div>
            </div>
            <AttendanceControls
              currentStatus={records[student.id]?.attendance_status}
              onUpdateStatus={(status) => handleStatusUpdate(student.id, status)}
            />
          </div>
        ))}
      </div>
    </div>
  );
}