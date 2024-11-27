// src/hooks/useAttendance.js
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { 
  fetchStudentsWithAttendance, 
  getOrCreateSession, 
  updateAttendanceRecord 
} from '@/lib/attendanceHelpers';

export function useAttendance(date) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [data, setData] = useState({
    session: null,
    students: [],
    attendance: {}
  });

  useEffect(() => {
    loadAttendanceData();

    // Set up realtime subscription
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
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [date]);

  const handleAttendanceChange = (payload) => {
    if (payload.new && payload.new.session_id === data.session?.id) {
      setData(prev => ({
        ...prev,
        attendance: {
          ...prev.attendance,
          [payload.new.student_id]: payload.new
        }
      }));
    }
  };

  const loadAttendanceData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Get or create session for the date
      const session = await getOrCreateSession(date);
      
      // Fetch students and their attendance records
      const { students, attendance } = await fetchStudentsWithAttendance(session.id);

      setData({
        session,
        students,
        attendance
      });
    } catch (err) {
      console.error('Error loading attendance data:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const updateAttendance = async (studentId, status) => {
    try {
      if (!data.session) throw new Error('No active session');

      const updatedRecord = await updateAttendanceRecord(
        data.session.id,
        studentId,
        status
      );

      setData(prev => ({
        ...prev,
        attendance: {
          ...prev.attendance,
          [studentId]: updatedRecord
        }
      }));

      return updatedRecord;
    } catch (err) {
      console.error('Error updating attendance:', err);
      throw err;
    }
  };

  return {
    loading,
    error,
    session: data.session,
    students: data.students,
    attendance: data.attendance,
    updateAttendance,
    refresh: loadAttendanceData
  };
}