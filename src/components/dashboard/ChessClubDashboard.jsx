import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { formatDate, isWednesday, getNextWednesday } from '@/lib/utils';
import { toast } from 'sonner';
import ChessClubHeader from './ChessClubHeader';
import DashboardStats from './DashboardStats';
import ClubDayAlert from './alerts/ClubDayAlert';
import AttendanceTab from './tabs/AttendanceTab';
import StudentsTab from './tabs/StudentsTab';
import TournamentTab from './tabs/TournamentTab';
import { 
  handleCheckIn, 
  handleCheckOut, 
  updateAttendanceState, 
  updateStatsState 
} from '@/lib/attendanceHelpers';

export default function ChessClubDashboard() {
  const [activeTab, setActiveTab] = useState('attendance');
  const [searchQuery, setSearchQuery] = useState('');
  const [students, setStudents] = useState([]);
  const [attendance, setAttendance] = useState({});
  const [currentSession, setCurrentSession] = useState(null);
  const [achievementStats, setAchievementStats] = useState([]);
  const [recentMatches, setRecentMatches] = useState([]);
  const [stats, setStats] = useState({
    totalStudents: 0,
    presentToday: 0,
    attendanceRate: 0
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const getOrCreateSession = async (date) => {
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
          end_time: '16:00'
        }])
        .select()
        .single();

      if (createError) throw createError;
      existingSession = newSession;
    }

    return existingSession;
  };

  const loadAttendanceData = async () => {
    try {
      console.log('Loading attendance data...');
      setLoading(true);
      
      const targetDate = isWednesday(new Date()) ? new Date() : getNextWednesday();
      console.log('Target date:', targetDate);
      
      // Get or create the session first
      const session = await getOrCreateSession(targetDate);
      console.log('Current session:', session);
      setCurrentSession(session);
  
      // Get attendance records for this session
      const { data: records, error: recordsError } = await supabase
        .from('attendance_records')
        .select('*')
        .eq('session_id', session.id);
  
      if (recordsError) throw recordsError;
  
      console.log('Fetched attendance records:', records);
  
      // Create attendance map
      const attendanceMap = {};
      records?.forEach(record => {
        attendanceMap[record.student_id] = {
          checkedIn: Boolean(record.check_in_time),
          checkedOut: Boolean(record.check_out_time),
          recordId: record.id
        };
      });
  
      console.log('Created attendance map:', attendanceMap);
      setAttendance(attendanceMap);
      
      // Update stats
      const presentCount = records?.filter(r => r.check_in_time).length || 0;
      console.log('Present count:', presentCount);
      
      setStats(prev => ({
        ...prev,
        presentToday: presentCount,
        attendanceRate: prev.totalStudents
          ? Math.round((presentCount / prev.totalStudents) * 100)
          : 0
      }));
  
    } catch (err) {
      console.error('Error loading attendance:', err);
      toast.error('Failed to load attendance data');
    } finally {
      setLoading(false);
    }
  };

  // Initial data load
  useEffect(() => {
    async function fetchInitialData() {
      try {
        setLoading(true);

        // Fetch students first
        const { data: studentsData, error: studentsError } = await supabase
          .from('students')
          .select('*')
          .eq('active', true)
          .order('grade')
          .order('last_name');

        if (studentsError) throw studentsError;
        setStudents(studentsData || []);
        
        // Set initial stats
        setStats(prev => ({
          ...prev,
          totalStudents: studentsData.length
        }));

        // Load attendance data
        await loadAttendanceData();

        // Load tournament data if available
        try {
          const { data: matches, error: matchesError } = await supabase
            .from('matches')
            .select(`
              *,
              player1:students!player1_id(first_name, last_name),
              player2:students!player2_id(first_name, last_name)
            `)
            .order('created_at', { ascending: false })
            .limit(5);

          if (!matchesError) {
            setRecentMatches(matches || []);
          }
        } catch (matchError) {
          console.log('Matches table not available:', matchError);
        }

      } catch (err) {
        console.error('Error fetching initial data:', err);
        setError(err);
        toast.error('Failed to load data');
      } finally {
        setLoading(false);
      }
    }

    fetchInitialData();
  }, []);

  // Reload attendance when switching back to attendance tab
  useEffect(() => {
    if (activeTab === 'attendance') {
      loadAttendanceData();
    }
  }, [activeTab]);

  const toggleAttendance = async (studentId, action) => {
    if (!currentSession) {
      toast.error('No active session found');
      return;
    }
  
    try {
      if (action === 'checkin') {
        const isCheckedIn = attendance[studentId]?.checkedIn;
        console.log('Current check-in status:', isCheckedIn);
  
        if (isCheckedIn) {
          // Delete the existing record
          const recordId = attendance[studentId].recordId;
          console.log('Attempting to delete record:', recordId);
          
          const { error: deleteError } = await supabase
            .from('attendance_records')
            .delete()
            .eq('id', recordId);
  
          if (deleteError) {
            console.error('Delete error:', deleteError);
            throw deleteError;
          }
  
          console.log('Record deleted successfully');
  
          // Update local state
          setAttendance(prev => {
            const newAttendance = { ...prev };
            delete newAttendance[studentId];
            return newAttendance;
          });
  
          setStats(prev => ({
            ...prev,
            presentToday: Math.max(0, prev.presentToday - 1),
            attendanceRate: Math.round((Math.max(0, prev.presentToday - 1) / prev.totalStudents) * 100)
          }));
  
          toast.success('Attendance removed');
  
        } else {
          // Create new attendance record
          console.log('Creating new attendance record');
          
          const { data: record, error: insertError } = await supabase
            .from('attendance_records')
            .insert([{
              student_id: studentId,
              session_id: currentSession.id,
              check_in_time: new Date().toISOString()
            }])
            .select()
            .single();
  
          if (insertError) {
            console.error('Insert error:', insertError);
            throw insertError;
          }
  
          console.log('New record created:', record);
  
          // Update local state
          setAttendance(prev => ({
            ...prev,
            [studentId]: {
              checkedIn: true,
              checkedOut: false,
              recordId: record.id
            }
          }));
  
          setStats(prev => ({
            ...prev,
            presentToday: prev.presentToday + 1,
            attendanceRate: Math.round(((prev.presentToday + 1) / prev.totalStudents) * 100)
          }));
  
          toast.success('Student checked in');
        }
      } else if (action === 'checkout' && attendance[studentId]?.checkedIn) {
        const recordId = attendance[studentId].recordId;
        console.log('Checking out student:', {
          studentId,
          recordId,
          currentAttendance: attendance[studentId]
        });
  
        const { error: updateError } = await supabase
          .from('attendance_records')
          .update({ 
            check_out_time: new Date().toISOString() 
          })
          .eq('id', recordId);
  
        if (updateError) {
          console.error('Update error:', updateError);
          throw updateError;
        }
  
        console.log('Checkout successful');
  
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
      console.error('Error toggling attendance:', err);
      toast.error(`Failed to update attendance: ${err.message}`);
      // Reload attendance data to ensure consistency
      await loadAttendanceData();
    }
  };

  return (
    <div className="space-y-6">
      <ChessClubHeader />

      {isWednesday(new Date()) && <ClubDayAlert />}

      <DashboardStats
        stats={stats}
        loading={loading}
        error={error}
      />

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
            />
          )}
          {activeTab === 'students' && (
            <StudentsTab
              students={students}
              searchQuery={searchQuery}
              setSearchQuery={setSearchQuery}
              loading={loading}
            />
          )}
          {activeTab === 'tournaments' && (
            <TournamentTab
              achievementStats={achievementStats}
              recentMatches={recentMatches}
              loading={loading}
            />
          )}
        </div>
      </div>
    </div>
  );
}