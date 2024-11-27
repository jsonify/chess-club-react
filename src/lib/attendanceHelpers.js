// src/lib/attendanceHelpers.js
import { supabase } from './supabase';

export async function fetchStudentsWithAttendance(sessionId) {
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
}

export async function getOrCreateSession(date) {
  const formattedDate = date.toISOString().split('T')[0];

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

export async function updateAttendanceRecord(sessionId, studentId, status) {
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
}