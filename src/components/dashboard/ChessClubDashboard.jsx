// src/components/dashboard/ChessClubDashboard.jsx
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { formatDate, isWednesday, getNextWednesday } from '@/lib/utils';
import { toast } from 'sonner';
import ChessClubHeader from './_ChessClubHeader';
import DashboardStats from './DashboardStats';
import ClubDayAlert from './alerts/ClubDayAlert';
import AttendanceTab from './_tabs/AttendanceTab';
import StudentsTab from './_tabs/StudentsTab';
import TournamentTab from './_tabs/TournamentTab';

export default function ChessClubDashboard() {
  const [activeTab, setActiveTab] = useState('attendance');
  const [searchQuery, setSearchQuery] = useState('');
  const [students, setStudents] = useState([]);
  const [attendance, setAttendance] = useState({});
  const [currentSession, setCurrentSession] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isConnected, setIsConnected] = useState(true);
  const [stats, setStats] = useState({
    totalStudents: 0,
    presentToday: 0,
    attendanceRate: 0
  });

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
          table: 'attendance_records',
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

  const handleRealtimeUpdate = async (payload) => {
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
  };

  const loadInitialData = async () => {
    try {
      setLoading(true);
      
      const targetDate = isWednesday(new Date()) ? new Date() : getNextWednesday();
      const session = await getOrCreateSession(targetDate);
      setCurrentSession(session);

      // Load students and attendance in parallel
      const [studentsResponse, attendanceResponse] = await Promise.all([
        supabase
          .from('students')
          .select('*')
          .eq('active', true)
          .order('grade')
          .order('last_name'),
        supabase
          .from('attendance_records')
          .select('*')
          .eq('session_id', session.id)
      ]);

      if (studentsResponse.error) throw studentsResponse.error;
      if (attendanceResponse.error) throw attendanceResponse.error;

      setStudents(studentsResponse.data || []);

      const attendanceMap = {};
      attendanceResponse.data?.forEach(record => {
        attendanceMap[record.student_id] = {
          checkedIn: !!record.check_in_time,
          checkedOut: !!record.check_out_time,
          recordId: record.id
        };
      });
      setAttendance(attendanceMap);

      const presentCount = attendanceResponse.data?.filter(r => r.check_in_time).length || 0;
      setStats({
        totalStudents: studentsResponse.data.length,
        presentToday: presentCount,
        attendanceRate: Math.round((presentCount / studentsResponse.data.length) * 100) || 0
      });

    } catch (err) {
      console.error('Error loading data:', err);
      setError(err.message);
      toast.error('Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const getOrCreateSession = async (date) => {
    const formattedDate = formatDate(date);
    
    let { data: existingSession } = await supabase
      .from('attendance_sessions')
      .select('*')
      .eq('session_date', formattedDate)
      .single();

    if (!existingSession) {
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
  };

  const toggleAttendance = async (studentId, action) => {
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

          // Update local state
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

          // Update local state
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
        const { data: record, error: updateError } = await supabase
          .from('attendance_records')
          .update({ 
            check_out_time: new Date().toISOString() 
          })
          .eq('id', recordId)
          .select()
          .single();

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
  };

  return (
    <div className="space-y-6">
      <ChessClubHeader />

      {isWednesday(new Date()) && <ClubDayAlert />}

      <DashboardStats stats={stats} loading={loading} error={error} />

      <div className="space-y-4">
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-8" aria-label="Tabs">
            {['attendance', 'students', 'tournaments'].map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`
                  whitespace-nowrap border-b-2 py-4 px-1 text-sm font-medium
                  ${activeTab === tab
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
                  }
                `}
              >
                {tab.charAt(0).toUpperCase() + tab.slice(1)}
              </button>
            ))}
          </nav>
        </div>

        <div className="mt-4">
          {activeTab === 'attendance' && (
            <AttendanceTab 
              students={students}
              attendance={attendance}
              searchQuery={searchQuery}
              setSearchQuery={setSearchQuery}
              toggleAttendance={toggleAttendance}
              loading={loading}
              isConnected={isConnected}
            />
          )}
          {activeTab === 'students' && (
            <StudentsTab
              students={students}
              loading={loading}
              error={error}
            />
          )}
          {activeTab === 'tournaments' && (
            <TournamentTab />
          )}
        </div>
      </div>
    </div>
  );
}