// src/components/attendance/RealTimeAttendance.jsx
import { useState, useEffect, useMemo } from 'react';
import { Search, CheckCircle, Loader2, Wifi, WifiOff, ChevronUp, ChevronDown } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { formatDate, formatDateForDB, getNextWednesday, isWednesday } from '@/lib/utils';
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
    key: 'last_name',
    direction: 'asc'
  });

  // Use useMemo for targetDate calculation
  const targetDate = useMemo(() => {
    const date = isWednesday(new Date()) ? new Date() : getNextWednesday();
    // Ensure we're working with a clean date (no time component)
    return new Date(date.toISOString().split('T')[0]);
  }, []); 

  const formattedTargetDate = formatDateForDB(targetDate);
  const displayDate = formatDate(targetDate);

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
      return sortConfig.direction === 'asc'
        ? aValue.localeCompare(bValue)
        : bValue.localeCompare(aValue);
    });

    return sorted.filter(student =>
      student.first_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      student.last_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      student.teacher?.toLowerCase().includes(searchQuery.toLowerCase())
    );
  };

  async function getOrCreateSession(date) {
    try {
      // Ensure we have a clean DATE format (YYYY-MM-DD)
      const targetDate = new Date(date);
      const formattedDate = targetDate.toISOString().split('T')[0];
      
      console.log('Querying for session date:', formattedDate); // Debug log
  
      // First try to get existing session
      const { data: existingSession, error: fetchError } = await supabase
        .from('attendance_sessions')
        .select('id, session_date')
        .eq('session_date', formattedDate)
        .single();
  
      if (fetchError && fetchError.code !== 'PGRST116') { // Not found error
        throw fetchError;
      }
  
      if (existingSession) {
        return existingSession;
      }
  
      // If no session exists, create one
      const { data: newSession, error: createError } = await supabase
        .from('attendance_sessions')
        .insert([
          {
            session_date: formattedDate,
            start_time: '15:30',
            end_time: '16:30'
          }
        ])
        .select()
        .single();
  
      if (createError) {
        throw createError;
      }
  
      return newSession;
    } catch (err) {
      console.error('Session management error:', err);
      throw new Error(`Failed to manage session: ${err.message}`);
    }
  }
  
  async function loadInitialData() {
    try {
      setLoading(true);
      
      // Get or create attendance session
      const session = await getOrCreateSession(targetDate);
      setCurrentSession(session);
  
      // Load active students
      const { data: activeStudents, error: studentsError } = await supabase
        .from('students')
        .select('*')
        .eq('active', true)
        .order('grade')
        .order('last_name');
  
      if (studentsError) throw studentsError;
      setStudents(activeStudents || []);
  
      // Load attendance records for current session
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
  
  // Add useEffect for initial load and realtime updates
  useEffect(() => {
    loadInitialData();
  
    // Set up real-time subscription
    const channel = supabase
      .channel('attendance-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'attendance_records'
        },
        async (payload) => {
          if (!currentSession) return;
  
          try {
            if (payload.eventType === 'DELETE') {
              setAttendance(prev => {
                const studentId = Object.keys(prev).find(
                  key => prev[key].recordId === payload.old.id
                );
                if (!studentId) return prev;
  
                const newState = { ...prev };
                delete newState[studentId];
                return newState;
              });
              return;
            }
  
            if (payload.new.session_id === currentSession.id) {
              setAttendance(prev => ({
                ...prev,
                [payload.new.student_id]: {
                  checkedIn: !!payload.new.check_in_time,
                  checkedOut: !!payload.new.check_out_time,
                  recordId: payload.new.id
                }
              }));
            }
          } catch (err) {
            console.error('Error handling realtime update:', err);
          }
        }
      )
      .subscribe((status) => {
        setIsConnected(status === 'SUBSCRIBED');
      });
  
    return () => {
      supabase.removeChannel(channel);
    };
  }, [formattedTargetDate]);

  async function toggleAttendance(studentId, action) {
    if (!currentSession) {
      toast.error('No active session found');
      return;
    }

    try {
      // First check if a record already exists
      const { data: existingRecord } = await supabase
        .from('attendance_records')
        .select('*')
        .eq('student_id', studentId)
        .eq('session_id', currentSession.id)
        .single();

      if (action === 'checkin') {
        if (existingRecord?.check_in_time) {
          // Remove check-in
          const { error: deleteError } = await supabase
            .from('attendance_records')
            .delete()
            .eq('id', existingRecord.id);

          if (deleteError) throw deleteError;

          // Update local state
          setAttendance(prev => {
            const newState = { ...prev };
            delete newState[studentId];
            return newState;
          });
        } else {
          // Create or update check-in
          const operation = existingRecord ? 'update' : 'insert';
          const checkInData = {
            student_id: studentId,
            session_id: currentSession.id,
            check_in_time: new Date().toISOString()
          };

          const { data: record, error: operationError } = await supabase
            .from('attendance_records')
            [operation === 'update' ? 'update' : 'insert'](
              operation === 'update' 
                ? { check_in_time: checkInData.check_in_time }
                : checkInData
            )
            [operation === 'update' ? 'eq' : 'select'](...(operation === 'update' 
              ? ['id', existingRecord.id]
              : ['*']
            ));

          if (operationError) throw operationError;

          // Update local state
          setAttendance(prev => ({
            ...prev,
            [studentId]: {
              checkedIn: true,
              checkedOut: false,
              recordId: operation === 'update' ? existingRecord.id : record[0].id
            }
          }));
        }
      } else if (action === 'checkout' && existingRecord) {
        // Update checkout time
        const { error: updateError } = await supabase
          .from('attendance_records')
          .update({ check_out_time: new Date().toISOString() })
          .eq('id', existingRecord.id);

        if (updateError) throw updateError;

        // Update local state
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
      {/* Header section */}
      <div className="p-4 border-b border-gray-200">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-medium">
                {isWednesday(new Date())
                  ? "Today's Attendance"
                  : "Next Wednesday's Attendance"} ({displayDate})
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

      {/* Student list */}
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