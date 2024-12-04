// src/lib/attendanceHelpers.js
import { supabase } from './supabase';

export const fetchStudentsWithAttendance = async (sessionId) => {
  try {
    // First, get all active students
    const { data: students, error: studentsError } = await supabase
      .from('students')
      .select('*')
      .eq('active', true)
      .order('grade')
      .order('last_name');

    if (studentsError) throw studentsError;

    // Then get attendance records for the session
    const { data: attendanceRecords, error: attendanceError } = await supabase
      .from('student_attendance')
      .select('*')
      .eq('session_id', sessionId);

    if (attendanceError) throw attendanceError;

    // Create a map of attendance records by student ID
    const attendanceMap = (attendanceRecords || []).reduce((acc, record) => {
      acc[record.student_id] = record;
      return acc;
    }, {});

    // Return both students and their attendance records
    return {
      students: students || [],
      attendance: attendanceMap
    };
  } catch (error) {
    console.error('Error fetching students with attendance:', error);
    throw error;
  }
};

export const getOrCreateSession = async (date) => {
  const getNextWednesday = (from) => {
    const result = new Date(from);
    result.setDate(result.getDate() + ((3 + 7 - result.getDay()) % 7));
    return result;
  };

  try {
    // Determine the correct session date
    const targetDate = new Date(date);
    const sessionDate = targetDate.getDay() === 3 
      ? targetDate 
      : getNextWednesday(targetDate);

    // Format the date as YYYY-MM-DD for database
    const formattedDate = sessionDate.toISOString().split('T')[0];

    // Check for existing session
    const { data: existingSession } = await supabase
      .from('attendance_sessions')
      .select('*')
      .eq('session_date', formattedDate)
      .single();

    if (existingSession) return existingSession;

    // Create new session if one doesn't exist
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
};

export const updateAttendanceRecord = async (sessionId, studentId, status) => {
  try {
    // Check for existing record
    const { data: existingRecord } = await supabase
      .from('student_attendance')
      .select('*')
      .eq('session_id', sessionId)
      .eq('student_id', studentId)
      .single();

    if (existingRecord) {
      // Update existing record
      const { data: updatedRecord, error } = await supabase
        .from('student_attendance')
        .update({ attendance_status: status })
        .eq('id', existingRecord.id)
        .select()
        .single();

      if (error) throw error;
      return updatedRecord;
    }

    // Create new record
    const { data: newRecord, error } = await supabase
      .from('student_attendance')
      .insert([{
        session_id: sessionId,
        student_id: studentId,
        attendance_status: status
      }])
      .select()
      .single();

    if (error) throw error;
    return newRecord;
  } catch (error) {
    console.error('Error updating attendance record:', error);
    throw error;
  }
};