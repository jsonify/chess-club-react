import { useState, useEffect } from 'react';
import { CheckCircle, Search, Loader2 } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { formatDate, getNextWednesday, isWednesday } from '@/lib/utils';
import { toast } from 'sonner';

export default function AttendanceTracker() {
  const [students, setStudents] = useState([]);
  const [attendance, setAttendance] = useState({});
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [debug, setDebug] = useState({});

  const targetDate = isWednesday(new Date()) ? new Date() : getNextWednesday();
  const formattedTargetDate = formatDate(targetDate);

  useEffect(() => {
    async function fetchStudents() {
      try {
        setLoading(true);
        
        // First, get ALL students to verify data
        const { data: allStudents, error: allError } = await supabase
          .from('students')
          .select('*')
          .order('grade')
          .order('last_name');

        console.log('All students:', {
          count: allStudents?.length,
          sample: allStudents?.[0],
          activeCount: allStudents?.filter(s => s.active).length
        });

        if (allError) throw allError;

        // Then get only active students
        const { data: activeStudents, error: activeError } = await supabase
          .from('students')
          .select('*')
          .eq('active', true)
          .order('grade')
          .order('last_name');

        console.log('Active students:', {
          count: activeStudents?.length,
          sample: activeStudents?.[0]
        });

        if (activeError) throw activeError;

        setStudents(activeStudents || []);
        setDebug({
          totalStudents: allStudents?.length,
          activeStudents: activeStudents?.length,
          hasActiveField: allStudents?.[0]?.hasOwnProperty('active'),
          activeValues: [...new Set(allStudents?.map(s => s.active))]
        });

        // Get attendance session for target date
        const { data: sessionData } = await supabase
          .from('attendance_sessions')
          .select('id')
          .eq('session_date', formattedTargetDate)
          .single();

        console.log('Session data:', sessionData);

        if (sessionData) {
          const { data: attendanceData } = await supabase
            .from('attendance_records')
            .select('*')
            .eq('session_id', sessionData.id);

          console.log('Attendance data:', attendanceData);

          const attendanceMap = {};
          attendanceData?.forEach(record => {
            attendanceMap[record.student_id] = {
              checkedIn: !!record.check_in_time,
              checkedOut: !!record.check_out_time
            };
          });
          setAttendance(attendanceMap);
        }

      } catch (err) {
        console.error('Error fetching data:', err);
        setError(err.message);
        toast.error('Failed to load students');
      } finally {
        setLoading(false);
      }
    }

    fetchStudents();
  }, [formattedTargetDate]);

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
        <h3 className="font-medium">Error loading data: {error}</h3>
        <pre className="mt-2 text-xs overflow-auto">
          Debug Info:
          {JSON.stringify(debug, null, 2)}
        </pre>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow">
      <div className="p-4 border-b border-gray-200">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h2 className="text-lg font-medium">
              {isWednesday(new Date())
                ? "Today's Attendance"
                : "Next Wednesday's Attendance"} ({formattedTargetDate})
            </h2>
            <p className="text-gray-500 text-sm">
              Showing {students.length} of {debug.totalStudents} students
            </p>
            {process.env.NODE_ENV === 'development' && (
              <pre className="mt-2 text-xs text-gray-400">
                Debug: {JSON.stringify(debug, null, 2)}
              </pre>
            )}
          </div>
          <div className="relative w-full sm:w-auto">
            <input
              type="text"
              placeholder="Search students..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <Search className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
          </div>
        </div>
      </div>

      <div className="divide-y">
        {students.map(student => (
          <div
            key={student.id}
            className={`flex items-center justify-between p-4 hover:bg-gray-50 ${
              attendance[student.id]?.checkedIn ? 'bg-blue-50' : ''
            }`}
          >
            <div>
              <div className="font-medium text-gray-900">
                {student.first_name} {student.last_name}
              </div>
              <div className="text-sm text-gray-500">
                Grade {student.grade} - {student.teacher}
              </div>
              {process.env.NODE_ENV === 'development' && (
                <div className="text-xs text-gray-400">
                  ID: {student.id}, Active: {String(student.active)}
                </div>
              )}
            </div>
            <div className="flex items-center space-x-4">
              <button
                onClick={() => toggleAttendance(student.id, 'checkin')}
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
                onClick={() => toggleAttendance(student.id, 'checkout')}
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
          </div>
        ))}
      </div>
    </div>
  );
}