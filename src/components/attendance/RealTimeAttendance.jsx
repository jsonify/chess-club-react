// src/components/attendance/RealTimeAttendance.jsx
import { useState, useEffect, useMemo } from 'react';
import { Search, CheckCircle, Loader2, Wifi, WifiOff, ChevronDown, ChevronUp } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { formatDate, getNextWednesday, isWednesday } from '@/lib/utils';
import { getOrCreateSession } from '@/lib/attendanceHelpers';
import { toast } from 'sonner';
import StudentAttendanceCard from './_StudentAttendanceCard';

export default function RealTimeAttendance({ onStatsChange = () => {} }) {
  const [students, setStudents] = useState([]);
  const [attendance, setAttendance] = useState({});
  const [searchQuery, setSearchQuery] = useState('');
  const [filterGrade, setFilterGrade] = useState('all');
  const [sortConfig, setSortConfig] = useState({
    key: 'first_name',
    direction: 'asc'
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentSession, setCurrentSession] = useState(null);
  const [isConnected, setIsConnected] = useState(true);

  const today = new Date();
  const displayDate = isWednesday(today) ? today : getNextWednesday();
  const formattedDisplayDate = formatDate(displayDate);

  // Filter and sort students
  const filteredAndSortedStudents = useMemo(() => {
    // First, filter the students
    let filtered = students.filter(student => {
      const matchesSearch = (
        student.first_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        student.last_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        student.teacher?.toLowerCase().includes(searchQuery.toLowerCase())
      );
      const matchesGrade = filterGrade === 'all' || student.grade.toString() === filterGrade;
      
      return matchesSearch && matchesGrade;
    });

    // Then sort them
    return [...filtered].sort((a, b) => {
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
  }, [students, searchQuery, filterGrade, sortConfig]);

  // Calculate stats
  const stats = useMemo(() => {
    const presentCount = Object.values(attendance).filter(record => record.checkedIn).length;
    return {
      totalStudents: students.length,
      presentToday: presentCount,
      attendanceRate: students.length ? Math.round((presentCount / students.length) * 100) : 0
    };
  }, [students.length, attendance]);

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

  const loadInitialData = async () => {
    try {
      setLoading(true);
        
      // Remove the .eq('active', true) filter to get ALL students
      const { data: allStudents, error: studentsError } = await supabase
        .from('students')
        .select('*')
        .order('grade')
        .order('last_name');
  
      if (studentsError) throw studentsError;
  
      const session = await getOrCreateSession(today);
      setCurrentSession(session);
  
      const { data: attendanceRecords, error: attendanceError } = await supabase
        .from('attendance_records')
        .select('*')
        .eq('session_id', session.id);
  
      if (attendanceError) throw attendanceError;
  
      const attendanceMap = {};
      attendanceRecords?.forEach(record => {
        attendanceMap[record.student_id] = {
          checkedIn: !!record.check_in_time,
          checkedOut: !!record.check_out_time,
          recordId: record.id
        };
      });
  
      setStudents(allStudents || []);
      setAttendance(attendanceMap);
  
    } catch (err) {
      console.error('Error loading data:', err);
      setError(err.message);
      toast.error('Failed to load attendance data');
    } finally {
      setLoading(false);
    }
  };

  const handleRealtimeUpdate = (payload) => {
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
      } else if (payload.new.session_id === currentSession.id) {
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
  };

  const toggleCheckIn = async (studentId) => {
    if (!currentSession) {
      toast.error('No active session found');
      return;
    }

    try {
      const existingRecord = attendance[studentId];
      
      if (existingRecord?.checkedIn) {
        const { error: deleteError } = await supabase
          .from('attendance_records')
          .delete()
          .eq('id', existingRecord.recordId);

        if (deleteError) throw deleteError;

        setAttendance(prev => {
          const newState = { ...prev };
          delete newState[studentId];
          return newState;
        });

        toast.success('Check-in removed');
      } else {
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
      const { error: updateError } = await supabase
        .from('attendance_records')
        .update({ check_out_time: new Date().toISOString() })
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

  const requestSort = (key) => {
    setSortConfig(current => ({
      key,
      direction: current.key === key && current.direction === 'asc' ? 'desc' : 'asc',
    }));
  };

  const SortIcon = ({ columnKey }) => {
    if (sortConfig.key !== columnKey) {
      return <ChevronDown className="inline h-4 w-4 text-gray-400" />;
    }
    return sortConfig.direction === 'asc' 
      ? <ChevronUp className="inline h-4 w-4 text-gray-700" />
      : <ChevronDown className="inline h-4 w-4 text-gray-700" />;
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
              {
              // isConnected ? (
              //   <Wifi className="h-5 w-5 text-green-500" title="Real-time updates connected" />
              // ) : (
              //   <WifiOff className="h-5 w-5 text-red-500" title="Real-time updates disconnected" />
              // )
              }
            </div>
          </div>
          <div className="flex flex-wrap gap-4 w-full sm:w-auto">
            <div className="relative flex-grow sm:flex-grow-0">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search students..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 pr-4 py-2 border rounded-lg w-full"
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
      </div>

      <div>
        {/* Desktop view */}
        <div className="hidden md:block">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th 
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                  onClick={() => requestSort('first_name')}
                >
                  First Name <SortIcon columnKey="first_name" />
                </th>
                <th 
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                  onClick={() => requestSort('last_name')}
                >
                  Last Name <SortIcon columnKey="last_name" />
                </th>
                <th 
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                  onClick={() => requestSort('grade')}
                >
                  Grade <SortIcon columnKey="grade" />
                </th>
                <th 
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                  onClick={() => requestSort('teacher')}
                >
                  Teacher <SortIcon columnKey="teacher" />
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Attendance
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredAndSortedStudents.map((student) => (
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
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile view */}
      <div className="md:hidden p-4 space-y-4">
        {filteredAndSortedStudents.map((student) => (
          <StudentAttendanceCard
            key={student.id}
            student={student}
            attendance={attendance[student.id]}
            onCheckIn={toggleCheckIn}
            onCheckOut={toggleCheckOut}
          />
        ))}
        
        {filteredAndSortedStudents.length === 0 && (
          <div className="text-center py-6 text-gray-500">
            No students found matching your search criteria
          </div>
        )}
      </div>
    </div>
  </div>
);
}