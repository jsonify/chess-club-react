// src/lib/attendanceHelpers.js
import { supabase } from './supabase-offline';

export async function getOrCreateSession(date) {
  const formattedDate = date.toISOString().split('T')[0];

  try {
    // Try to find existing session
    const { data: sessions } = await supabase
      .from('attendance_sessions')
      .select('*');

    const existingSession = sessions?.find(
      session => session.session_date === formattedDate
    );

    if (existingSession) {
      return existingSession;
    }

    // Create new session
    const newSession = {
      id: `temp_${Date.now()}`,
      session_date: formattedDate,
      start_time: '15:30',
      end_time: '16:30'
    };

    // Insert new session
    const { data: insertedSession } = await supabase
      .from('attendance_sessions')
      .insert(newSession);

    return insertedSession || newSession;

  } catch (error) {
    console.error('Error managing session:', error);
    
    // Return a temporary session in case of error
    return {
      id: `temp_${Date.now()}`,
      session_date: formattedDate,
      start_time: '15:30',
      end_time: '16:30'
    };
  }
}

export async function handleCheckIn(studentId, currentSession, attendance) {
  const isCheckedIn = attendance[studentId]?.checkedIn;

  if (isCheckedIn) {
    // Remove check-in
    const recordId = attendance[studentId].recordId;
    const { error: deleteError } = await supabase
      .from('attendance_records')
      .delete()
      .match({ id: recordId });

    if (deleteError) throw deleteError;

    return {
      type: 'remove',
      studentId
    };
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

    return {
      type: 'checkin',
      studentId,
      recordId: record.id
    };
  }
}

export async function handleCheckOut(studentId, recordId) {
  const { error: updateError } = await supabase
    .from('attendance_records')
    .update({ check_out_time: new Date().toISOString() })
    .match({ id: recordId });

  if (updateError) throw updateError;

  return {
    type: 'checkout',
    studentId
  };
}

export function updateAttendanceState(prevState, action) {
  switch (action.type) {
    case 'remove':
      const newState = { ...prevState };
      delete newState[action.studentId];
      return newState;

    case 'checkin':
      return {
        ...prevState,
        [action.studentId]: {
          checkedIn: true,
          checkedOut: false,
          recordId: action.recordId
        }
      };

    case 'checkout':
      return {
        ...prevState,
        [action.studentId]: {
          ...prevState[action.studentId],
          checkedOut: true
        }
      };

    default:
      return prevState;
  }
}

export function updateStatsState(prevStats, action, totalStudents) {
  switch (action.type) {
    case 'remove':
      const newPresentCount = Math.max(0, prevStats.presentToday - 1);
      return {
        ...prevStats,
        presentToday: newPresentCount,
        attendanceRate: Math.round((newPresentCount / totalStudents) * 100)
      };

    case 'checkin':
      const increasedCount = prevStats.presentToday + 1;
      return {
        ...prevStats,
        presentToday: increasedCount,
        attendanceRate: Math.round((increasedCount / totalStudents) * 100)
      };

    default:
      return prevStats;
  }
}