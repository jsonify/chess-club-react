// src/components/attendance/RealTimeAttendance.jsx
import { useState, useEffect } from 'react';
import { Search, CheckCircle, Loader2, Wifi, WifiOff, ChevronUp, ChevronDown } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { formatDate, getNextWednesday, isWednesday } from '@/lib/utils';
import { toast } from 'sonner';

export default function RealTimeAttendance() {
  const [students, setStudents] = useState([]);
  const [attendance, setAttendance] = useState({});
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentSession, setCurrentSession] = useState(null);
  const [isConnected, setIsConnected] = useState(true);
  const [sortConfig, setSortConfig] = useState({
    key: 'first_name',
    direction: 'asc'
  });

  const targetDate = isWednesday(new Date()) ? new Date() : getNextWednesday();
  const formattedTargetDate = formatDate(targetDate);

  async function loadInitialData() {
    try {
      setLoading(true);
      
      // Load active students
      const { data: activeStudents, error: studentsError } = await supabase
        .from('students')
        .select('*')
        .eq('active', true)
        .order('grade')
        .order('last_name');

      if (studentsError) throw studentsError;
      setStudents(activeStudents || []);

      // Get or create attendance session
      const session = await getOrCreateSession(targetDate);
      setCurrentSession(session);

      // Load attendance records
      if (session) {
        const { data: records, error: recordsError } = await supabase
          .from('attendance_records')
          .select('*')
          .eq('session_id', session.id);

        if (recordsError) throw recordsError;

        const attendanceMap = {};
        records?.forEach(record => {
          attendanceMap[record.student_id] = {
            checkedIn: !!record.check_in_time,
            checkedOut: !!record.check_out_time,
            recordId: record.id
          };
        });

        setAttendance(attendanceMap);
      }

    } catch (err) {
      console.error('Error loading data:', err);
      setError(err.message);
      toast.error('Failed to load attendance data');
    } finally {
      setLoading(false);
    }
  }

  async function getOrCreateSession(date) {
    const formattedDate = formatDate(date);
    
    // Try to get existing session
    let { data: existingSession } = await supabase
      .from('attendance_sessions')
      .select('*')
      .eq('session_date', formattedDate)
      .single();

    if (!existingSession) {
      // Create new session
      const { data: newSession, error: createError } = await supabase
        .from('attendance_sessions')
        .insert([{
          session_date: formattedDate,
          start_time: '15:30',
          end_time: '16:30'
        }])
        .select()
        .single();

      if (createError) throw createError;
      existingSession = newSession;
    }

    return existingSession;
  }

  async function handleRealtimeUpdate(payload) {
    try {
      console.log('Received real-time update:', payload);
      
      if (payload.eventType === 'DELETE') {
        setAttendance(prev => {
          const newState = { ...prev };
          delete newState[payload.old.student_id];
          return newState;
        });
        return;
      }

      const { data: record, error } = await supabase
        .from('attendance_records')
        .select('*')
        .eq('id', payload.new.id)
        .single();

      if (error) throw error;

      setAttendance(prev => ({
        ...prev,
        [record.student_id]: {
          checkedIn: !!record.check_in_time,
          checkedOut: !!record.check_out_time,
          recordId: record.id
        }
      }));

    } catch (err) {
      console.error('Error handling real-time update:', err);
      toast.error('Failed to process attendance update');
    }
  }

  async function toggleAttendance(studentId, action) {
    if (!currentSession) {
      toast.error('No active session found');
      return;
    }

    try {
      if (action === 'checkin') {
        const isCheckedIn = attendance[studentId]?.checkedIn;

        if (isCheckedIn) {
          // Remove check-in
          const recordId = attendance[studentId].recordId;
          const { error: deleteError } = await supabase
            .from('attendance_records')
            .delete()
            .eq('id', recordId);

          if (deleteError) throw deleteError;

          setAttendance(prev => {
            const newState = { ...prev };
            delete newState[studentId];
            return newState;
          });

        } else {
          // Create new check-in
          const { data: record, error: insertError } = await supabase
            .from('attendance_records')
            .insert([{
              student_id: studentId,
              session_id: currentSession.id,
              check_in_time: new Date().toISOString()
            }])
            .select()
            .single();

          if (insertError) throw insertError;

          setAttendance(prev => ({
            ...prev,
            [studentId]: {
              checkedIn: true,
              checkedOut: false,
              recordId: record.id
            }
          }));
        }

      } else if (action === 'checkout' && attendance[studentId]?.checkedIn) {
        const recordId = attendance[studentId].recordId;
        const { error: updateError } = await supabase
          .from('attendance_records')
          .update({ 
            check_out_time: new Date().toISOString() 
          })
          .eq('id', recordId);

        if (updateError) throw updateError;

        setAttendance(prev => ({
          ...prev,
          [studentId]: {
            ...prev[studentId],
            checkedOut: true
          }
        }));
      }

    } catch (err) {
      console.error('Error updating attendance:', err);
      toast.error('Failed to update attendance');
    }
  }

  useEffect(() => {
    loadInitialData();
  }, [formattedTargetDate]);

  useEffect(() => {
    const channel = supabase
      .channel('attendance-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'attendance_records'
        },
        handleRealtimeUpdate
      )
      .subscribe((status) => {
        setIsConnected(status === 'SUBSCRIBED');
      });

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const requestSort = (key) => {
    setSortConfig(current => ({
      key,
      direction: 
        current.key === key && current.direction === 'asc' 
          ? 'desc' 
          : 'asc',
    }));
  };

  const SortIcon = ({ columnKey }) => {
    if (sortConfig.key !== columnKey) {
      return <ChevronDown className="h-4 w-4 text-gray-400" />;
    }
    return sortConfig.direction === 'asc' 
      ? <ChevronUp className="h-4 w-4 text-blue-500" />
      : <ChevronDown className="h-4 w-4 text-blue-500" />;
  };

  const getSortedStudents = () => {
    const sorted = [...students].sort((a, b) => {
      let aValue, bValue;

      switch (sortConfig.key) {
        case 'grade':
          return sortConfig.direction === 'asc' 
            ? a.grade - b.grade
            : b.grade - a.grade;
        case 'first_name':
          aValue = a.first_name?.toLowerCase();
          bValue = b.first_name?.toLowerCase();
          break;
        case 'last_name':
          aValue = a.last_name?.toLowerCase();
          bValue = b.last_name?.toLowerCase();
          break;
        case 'teacher':
          aValue = a.teacher?.toLowerCase();
          bValue = b.teacher?.toLowerCase();
          break;
        default:
          aValue = a[sortConfig.key]?.toLowerCase();
          bValue = b[sortConfig.key]?.toLowerCase();
      }
      
      if (!aValue || !bValue) return 0;
      
      if (sortConfig.direction === 'asc') {
        return aValue.localeCompare(bValue);
      }
      return bValue.localeCompare(aValue);
    });

    return sorted.filter(student =>
      student.first_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      student.last_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      student.teacher?.toLowerCase().includes(searchQuery.toLowerCase())
    );
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
        <h3 className="font-medium">Error loading data: {error}</h3>
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
                  : "Next Wednesday's Attendance"} ({formattedTargetDate})
              </h2>
              {isConnected ? (
                <Wifi className="h-5 w-5 text-green-500" />
              ) : (
                <WifiOff className="h-5 w-5 text-red-500" />
              )}
            </div>
            <div className="flex items-center gap-4 mt-2">
              <button
                onClick={() => requestSort('first_name')}
                className="text-sm text-gray-500 flex items-center gap-1 hover:text-gray-700"
              >
                First Name
                <SortIcon columnKey="first_name" />
              </button>
              <button
                onClick={() => requestSort('last_name')}
                className="text-sm text-gray-500 flex items-center gap-1 hover:text-gray-700"
              >
                Last Name
                <SortIcon columnKey="last_name" />
              </button>
              <button
                onClick={() => requestSort('grade')}
                className="text-sm text-gray-500 flex items-center gap-1 hover:text-gray-700"
              >
                Grade
                <SortIcon columnKey="grade" />
              </button>
              <button
                onClick={() => requestSort('teacher')}
                className="text-sm text-gray-500 flex items-center gap-1 hover:text-gray-700"
              >
                Teacher
                <SortIcon columnKey="teacher" />
              </button>
            </div>
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
        {getSortedStudents().map(student => (
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