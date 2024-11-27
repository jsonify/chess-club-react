// src/components/attendance/RealTimeAttendance.jsx
import { useState, useEffect } from 'react';
import { Search, CheckCircle, Loader2, Wifi, WifiOff } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { formatDate, getNextWednesday, isWednesday } from '@/lib/utils';
import { toast } from 'sonner';

async function fetchAttendance(sessionId) {
  try {
    // First fetch active students
    const { data: students, error: studentsError } = await supabase
      .from('students')
      .select('*')
      .eq('active', true)
      .order('grade')
      .order('last_name');

    if (studentsError) throw studentsError;

    // Then fetch attendance records for the session
    const { data: attendanceRecords, error: attendanceError } = await supabase
      .from('student_attendance')
      .select('*')
      .eq('session_id', sessionId);

    if (attendanceError) throw attendanceError;

    // Map attendance records by student ID
    const attendanceMap = {};
    attendanceRecords?.forEach(record => {
      attendanceMap[record.student_id] = {
        checkedIn: !!record.check_in_time,
        checkedOut: !!record.check_out_time,
        recordId: record.id
      };
    });

    return {
      students: students || [],
      attendance: attendanceMap
    };
  } catch (error) {
    console.error('Error fetching data:', error);
    throw error;
  }
}

async function getOrCreateSession(date) {
  const formattedDate = formatDate(date);
  
  try {
    // Check for existing session
    const { data: existingSession } = await supabase
      .from('attendance_sessions')
      .select('*')
      .eq('session_date', formattedDate)
      .single();

    if (existingSession) return existingSession;

    // Create new session
    const { data: newSession, error } = await supabase
      .from('attendance_sessions')
      .insert([{
        session_date: formattedDate,
        start_time: '15:30',
        end_time: '16:30'
      }])
      .select()
      .single();

    if (error) throw error;
    return newSession;
  } catch (error) {
    console.error('Error managing session:', error);
    throw error;
  }
}

export default function RealTimeAttendance() {
  const [students, setStudents] = useState([]);
  const [attendance, setAttendance] = useState({});
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentSession, setCurrentSession] = useState(null);
  const [isConnected, setIsConnected] = useState(true);

  useEffect(() => {
    loadInitialData();

    const channel = supabase
      .channel('attendance-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'student_attendance'
        },
        handleAttendanceChange
      )
      .subscribe((status) => {
        setIsConnected(status === 'SUBSCRIBED');
      });

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const handleAttendanceChange = (payload) => {
    if (!currentSession) return;

    if (payload.new && payload.new.session_id === currentSession.id) {
      setAttendance(prev => ({
        ...prev,
        [payload.new.student_id]: {
          checkedIn: !!payload.new.check_in_time,
          checkedOut: !!payload.new.check_out_time,
          recordId: payload.new.id
        }
      }));
    }
  };

  const loadInitialData = async () => {
    try {
      setLoading(true);
      
      const targetDate = isWednesday(new Date()) ? new Date() : getNextWednesday();
      const session = await getOrCreateSession(targetDate);
      setCurrentSession(session);

      const { students: loadedStudents, attendance: loadedAttendance } = 
        await fetchAttendance(session.id);

      setStudents(loadedStudents);
      setAttendance(loadedAttendance);
    } catch (err) {
      console.error('Error loading data:', err);
      setError(err.message);
      toast.error('Failed to load attendance data');
    } finally {
      setLoading(false);
    }
  };

  const toggleCheckIn = async (studentId) => {
    if (!currentSession) {
      toast.error('No active session found');
      return;
    }

    try {
      const existingRecord = attendance[studentId];
      
      if (existingRecord?.checkedIn) {
        // Remove check-in by deleting the record
        const { error } = await supabase
          .from('student_attendance')
          .delete()
          .eq('id', existingRecord.recordId);

        if (error) throw error;

        setAttendance(prev => {
          const newState = { ...prev };
          delete newState[studentId];
          return newState;
        });

        toast.success('Check-in removed');
      } else {
        // Create new check-in record
        const { data: record, error } = await supabase
          .from('student_attendance')
          .insert([{
            session_id: currentSession.id,
            student_id: studentId,
            check_in_time: new Date().toISOString()
          }])
          .select()
          .single();

        if (error) throw error;

        setAttendance(prev => ({
          ...prev,
          [studentId]: {
            checkedIn: true,
            checkedOut: false,
            recordId: record.id
          }
        }));

        toast.success('Student checked in');
      }
    } catch (err) {
      console.error('Error toggling check-in:', err);
      toast.error('Failed to update attendance');
    }
  };

  const toggleCheckOut = async (studentId) => {
    if (!currentSession) {
      toast.error('No active session found');
      return;
    }

    const existingRecord = attendance[studentId];
    if (!existingRecord?.checkedIn) {
      toast.error('Student must be checked in first');
      return;
    }

    try {
      if (existingRecord.checkedOut) {
        // Remove check-out by setting check_out_time to null
        const { data: record, error } = await supabase
          .from('student_attendance')
          .update({ check_out_time: null })
          .eq('id', existingRecord.recordId)
          .select()
          .single();

        if (error) throw error;

        setAttendance(prev => ({
          ...prev,
          [studentId]: {
            ...prev[studentId],
            checkedOut: false
          }
        }));

        toast.success('Check-out removed');
      } else {
        // Add check-out time
        const { data: record, error } = await supabase
          .from('student_attendance')
          .update({ check_out_time: new Date().toISOString() })
          .eq('id', existingRecord.recordId)
          .select()
          .single();

        if (error) throw error;

        setAttendance(prev => ({
          ...prev,
          [studentId]: {
            ...prev[studentId],
            checkedOut: true
          }
        }));

        toast.success('Student checked out');
      }
    } catch (err) {
      console.error('Error toggling check-out:', err);
      toast.error('Failed to update check-out status');
    }
  };

  // Filter students based on search query
  const filteredStudents = students.filter(student =>
    student.first_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    student.last_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    student.teacher?.toLowerCase().includes(searchQuery.toLowerCase())
  );

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
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-medium">
                {isWednesday(new Date())
                  ? "Today's Attendance"
                  : "Next Wednesday's Attendance"} ({formatDate(currentSession?.session_date)})
              </h2>
              {isConnected ? (
                <Wifi className="h-5 w-5 text-green-500" title="Real-time updates connected" />
              ) : (
                <WifiOff className="h-5 w-5 text-red-500" title="Real-time updates disconnected" />
              )}
            </div>
            <p className="text-sm text-gray-500 mt-1">
              Showing {filteredStudents.length} students
            </p>
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
        {filteredStudents.map(student => (
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
            </div>
            <div className="flex items-center space-x-4">
              <button
                onClick={() => toggleCheckIn(student.id)}
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
                onClick={() => toggleCheckOut(student.id)}
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
        {filteredStudents.length === 0 && (
          <div className="p-4 text-center text-gray-500">
            No students found matching your search
          </div>
        )}
      </div>
    </div>
  );
}