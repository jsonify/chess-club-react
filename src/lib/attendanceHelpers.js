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
      .from('attendance_records')
      .select('*')
      .eq('session_id', sessionId);

    if (attendanceError) throw attendanceError;

    // Create a map of attendance records by student ID
    const attendanceMap = (attendanceRecords || []).reduce((acc, record) => {
      acc[record.student_id] = {
        checkedIn: !!record.check_in_time,
        checkedOut: !!record.check_out_time,
        recordId: record.id
      };
      return acc;
    }, {});

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
    const { data: existingSessions, error: queryError } = await supabase
      .from('attendance_sessions')
      .select('*')
      .eq('session_date', formattedDate);

    if (queryError) throw queryError;

    // If we found an existing session, return the first one
    if (existingSessions && existingSessions.length > 0) {
      return existingSessions[0];
    }

    // Create new session
    const { data: newSession, error: insertError } = await supabase
      .from('attendance_sessions')
      .insert([{
        session_date: formattedDate,
        start_time: '15:30',
        end_time: '16:30'
      }])
      .select()
      .single();

    if (insertError) {
      // If insert fails due to concurrent creation, try to fetch again
      const { data: retrySession, error: retryError } = await supabase
        .from('attendance_sessions')
        .select('*')
        .eq('session_date', formattedDate)
        .single();

      if (retryError) throw retryError;
      return retrySession;
    }

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
      const { data: updatedRecord, error: updateError } = await supabase
        .from('student_attendance')
        .update({ attendance_status: status })
        .eq('id', existingRecord.id)
        .select()
        .single();

      if (updateError) throw updateError;
      return updatedRecord;
    }

    // Create new record
    const { data: newRecord, error: insertError } = await supabase
      .from('student_attendance')
      .insert([{
        session_id: sessionId,
        student_id: studentId,
        attendance_status: status
      }])
      .select()
      .single();

    if (insertError) throw insertError;
    return newRecord;
  } catch (error) {
    console.error('Error updating attendance record:', error);
    throw error;
  }
}