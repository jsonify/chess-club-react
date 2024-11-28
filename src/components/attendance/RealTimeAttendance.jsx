// src/components/attendance/RealTimeAttendance.jsx
import { useState, useEffect, useMemo } from 'react';
import { Search, CheckCircle, Loader2, Wifi, WifiOff } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { formatDate, getNextWednesday, isWednesday } from '@/lib/utils';
import { getOrCreateSession } from '@/lib/attendanceHelpers';
import { toast } from 'sonner';

export default function RealTimeAttendance({ onStatsChange = () => {} }) {
  const [students, setStudents] = useState([]);
  const [attendance, setAttendance] = useState({});
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentSession, setCurrentSession] = useState(null);
  const [isConnected, setIsConnected] = useState(true);

  const today = new Date();
  const displayDate = isWednesday(today) ? today : getNextWednesday();
  const formattedDisplayDate = formatDate(displayDate);

  // Calculate stats using memo to prevent unnecessary recalculations
  const stats = useMemo(() => {
    const presentCount = Object.values(attendance).filter(record => record.checkedIn).length;
    return {
      totalStudents: students.length,
      presentToday: presentCount,
      attendanceRate: students.length ? Math.round((presentCount / students.length) * 100) : 0
    };
  }, [students.length, attendance]);

  // Notify parent of stats changes
  useEffect(() => {
    onStatsChange(stats);
  }, [stats, onStatsChange]);

  useEffect(() => {
    loadInitialData();

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

  // Filter students based on search query
  const filteredStudents = useMemo(() => 
    students.filter(student =>
      student.first_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      student.last_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      student.teacher?.toLowerCase().includes(searchQuery.toLowerCase())
    ),
    [students, searchQuery]
  );
  // Modify loadInitialData to set state in the correct order
  const loadInitialData = async () => {
    try {
      setLoading(true);
      console.log('Loading initial data');
  
      // Get ALL students without any filters
      const { data: allStudents, error: studentsError } = await supabase
        .from('students')
        .select('*')
        .order('grade')
        .order('last_name');
  
      if (studentsError) throw studentsError;
  
      // Get session immediately after students
      const today = new Date();
      const session = await getOrCreateSession(today);
      setCurrentSession(session);
  
      // Get attendance records
      const { data: attendanceRecords, error: attendanceError } = await supabase
        .from('attendance_records')
        .select('*')
        .eq('session_id', session.id);
  
      if (attendanceError) throw attendanceError;
  
      // Process attendance records
      const attendanceMap = {};
      attendanceRecords?.forEach(record => {
        attendanceMap[record.student_id] = {
          checkedIn: !!record.check_in_time,
          checkedOut: !!record.check_out_time,
          recordId: record.id
        };
      });
  
      // Important: Set both states at once to prevent multiple rerenders
      setStudents(allStudents || []);
      setAttendance(attendanceMap);
  
    } catch (err) {
      console.error('Error loading data:', err);
      setError(err.message);
      toast.error('Failed to load data');
    } finally {
      setLoading(false);
    }
  };
  
  // Update the toggleCheckIn function to handle stats correctly
  const toggleCheckIn = async (studentId) => {
    if (!currentSession) {
      toast.error('No active session found');
      return;
    }
  
    try {
      const existingRecord = attendance[studentId];
      
      if (existingRecord?.checkedIn) {
        // Remove check-in
        const { error: deleteError } = await supabase
          .from('attendance_records')
          .delete()
          .eq('id', existingRecord.recordId);
  
        if (deleteError) throw deleteError;
  
        // Update attendance state directly
        setAttendance(prev => {
          const newState = { ...prev };
          delete newState[studentId];
          return newState;
        });
  
        toast.success('Check-in removed');
      } else {
        // Create new check-in
        const { data: record, error: insertError } = await supabase
          .from('attendance_records')
          .insert([{
            session_id: currentSession.id,
            student_id: studentId,
            check_in_time: new Date().toISOString()
          }])
          .select()
          .single();
  
        if (insertError) throw insertError;
  
        // Update attendance state directly
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
      console.log('Toggling check-out for student:', studentId);

      const { error: updateError } = await supabase
        .from('attendance_records')
        .update({ 
          check_out_time: new Date().toISOString() 
        })
        .eq('id', existingRecord.recordId);

      if (updateError) throw updateError;

      setAttendance(prev => ({
        ...prev,
        [studentId]: {
          ...prev[studentId],
          checkedOut: true
        }
      }));

      toast.success('Student checked out');
    } catch (err) {
      console.error('Error toggling check-out:', err);
      toast.error('Failed to update attendance');
    }
  };

  const handleRealtimeUpdate = (payload) => {
    if (!currentSession) return;

    console.log('Realtime update received:', payload);

    try {
      if (payload.eventType === 'DELETE') {
        console.log('Processing delete event');
        setAttendance(prev => {
          const studentId = Object.keys(prev).find(
            key => prev[key].recordId === payload.old.id
          );
          if (!studentId) return prev;

          const newState = { ...prev };
          delete newState[studentId];
          console.log('New state after delete:', newState);
          return newState;
        });
      } else if (payload.new.session_id === currentSession.id) {
        console.log('Processing update/insert event');
        setAttendance(prev => {
          const newState = {
            ...prev,
            [payload.new.student_id]: {
              checkedIn: !!payload.new.check_in_time,
              checkedOut: !!payload.new.check_out_time,
              recordId: payload.new.id
            }
          };
          console.log('New state after update:', newState);
          return newState;
        });
      }
    } catch (err) {
      console.error('Error handling realtime update:', err);
    }
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
                {isWednesday(today)
                  ? "Today's Attendance"
                  : "Next Wednesday's Attendance"} ({formattedDisplayDate})
              </h2>
              {isConnected ? (
                <Wifi className="h-5 w-5 text-green-500" title="Real-time updates connected" />
              ) : (
                <WifiOff className="h-5 w-5 text-red-500" title="Real-time updates disconnected" />
              )}
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
        {filteredStudents.length > 0 ? (
          filteredStudents.map(student => (
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
          ))
        ) : (
          <div className="p-4 text-center text-gray-500">
            {searchQuery 
              ? 'No students found matching your search'
              : 'No students available'}
          </div>
        )}
      </div>
    </div>
  );
}