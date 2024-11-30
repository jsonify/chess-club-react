// src/components/attendance/StudentAttendanceCard.jsx
import { CheckCircle } from 'lucide-react';

export default function StudentAttendanceCard({ 
  student, 
  attendance, 
  onCheckIn, 
  onCheckOut 
}) {
  return (
    <div className="bg-white rounded-lg shadow mb-4 overflow-hidden">
      <div className={`p-4 ${attendance?.checkedIn ? 'bg-blue-50' : ''}`}>
        <div className="flex justify-between items-start mb-2">
          <div>
            <h3 className="text-lg font-medium text-gray-900">
              {student.first_name} {student.last_name}
            </h3>
            <p className="text-sm text-gray-600">
              Grade {student.grade} - {student.teacher}
            </p>
          </div>
          <div className="flex flex-col gap-2">
            <button
              onClick={() => onCheckIn(student.id)}
              className={`flex items-center justify-center px-3 py-1 rounded-md text-sm transition-colors ${
                attendance?.checkedIn
                  ? 'bg-green-100 text-green-700'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              <CheckCircle className="h-4 w-4 mr-1" />
              In
            </button>
            <button
              onClick={() => onCheckOut(student.id)}
              disabled={!attendance?.checkedIn}
              className={`flex items-center justify-center px-3 py-1 rounded-md text-sm transition-colors ${
                attendance?.checkedOut
                  ? 'bg-green-100 text-green-700'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              } ${!attendance?.checkedIn ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              <CheckCircle className="h-4 w-4 mr-1" />
              Out
            </button>
          </div>
        </div>
        {attendance?.checkedIn && (
          <div className="mt-2">
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
              {attendance.checkedOut ? 'Checked Out' : 'Present'}
            </span>
          </div>
        )}
      </div>
    </div>
  );
}