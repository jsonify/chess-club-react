import { supabase } from './supabase';
import { isWednesday, getNextWednesday } from '@/lib/utils';

/**
 * Convert a date to Pacific time and return date string in YYYY-MM-DD format
 */
const toPacificDate = (date) => {
  return date.toLocaleDateString('en-US', {
    timeZone: 'America/Los_Angeles',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  }).split('/').reverse().join('-');
};

/**
 * Get current time in Pacific timezone in HH:mm:ss format
 */
const getPacificTime = () => {
  return new Date().toLocaleTimeString('en-US', {
    timeZone: 'America/Los_Angeles',
    hour12: false,
  });
};

export async function getOrCreateSession(date) {
  // Determine the appropriate session date (today if Wednesday, otherwise next Wednesday)
  const pacificDate = new Date(date.toLocaleString('en-US', {
    timeZone: 'America/Los_Angeles'
  }));
  
  // Get the session date based on whether today is Wednesday
  const sessionDate = isWednesday(pacificDate) ? pacificDate : getNextWednesday();
  
  // Format date for database (YYYY-MM-DD)
  const year = sessionDate.getFullYear();
  const month = String(sessionDate.getMonth() + 1).padStart(2, '0');
  const day = String(sessionDate.getDate()).padStart(2, '0');
  const formattedDate = `${year}-${month}-${day}`;

  try {
    // First try to get the existing session
    const { data, error } = await supabase
      .from('attendance_sessions')
      .select('*')
      .eq('session_date', formattedDate)
      .eq('cancelled', false);

    // If we found a session, return it
    if (data && data.length > 0) {
      return data[0];
    }

    // No session found, create one
    const { data: newSession, error: insertError } = await supabase
      .from('attendance_sessions')
      .insert([{
        session_date: formattedDate,
        start_time: '15:30',
        end_time: '16:30',
        timezone: 'America/Los_Angeles',
        cancelled: false
      }])
      .select()
      .single();

    if (insertError) {
      // If insert failed due to race condition, try fetching again
      if (insertError.code === '23505') {
        const { data: retryData, error: retryError } = await supabase
          .from('attendance_sessions')
          .select('*')
          .eq('session_date', formattedDate)
          .eq('cancelled', false);

        if (retryError) throw retryError;
        if (retryData && retryData.length > 0) {
          return retryData[0];
        }
      }
      throw insertError;
    }

    return newSession;
  } catch (error) {
    console.error('Error managing session:', error);
    throw error;
  }
}

/**
 * Handle check-in for a student
 */
export const handleCheckIn = async (supabase, studentId, currentSession, attendance) => {
  const isCheckedIn = attendance[studentId]?.checkedIn;
  const pacificTime = getPacificTime();

  try {
    if (isCheckedIn) {
      // Remove check-in
      const recordId = attendance[studentId].recordId;
      const { error: deleteError } = await supabase
        .from('attendance_records')
        .delete()
        .eq('id', recordId);

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
          check_in_time: new Date().toISOString(),
          pacific_check_in_time: pacificTime
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
  } catch (error) {
    console.error('Error handling check-in:', error);
    throw error;
  }
};

/**
 * Handle check-out for a student
 */
export const handleCheckOut = async (supabase, studentId, recordId) => {
  const pacificTime = getPacificTime();

  try {
    const { error: updateError } = await supabase
      .from('attendance_records')
      .update({
        check_out_time: new Date().toISOString(),
        pacific_check_out_time: pacificTime
      })
      .eq('id', recordId);

    if (updateError) throw updateError;

    return {
      type: 'checkout',
      studentId
    };
  } catch (error) {
    console.error('Error handling check-out:', error);
    throw error;
  }
};

/**
 * Update attendance state based on action results
 */
export const updateAttendanceState = (prevState, action) => {
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
};

/**
 * Update stats state based on action results
 */
export const updateStatsState = (prevStats, action, totalStudents) => {
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
};