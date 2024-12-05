import { supabase } from './supabase';

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
  // First convert the date to Pacific time to ensure correct date matching
  const pacificDate = new Date(date).toLocaleDateString('en-US', {
    timeZone: 'America/Los_Angeles',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  });
  
  // Parse the Pacific time date parts
  const [month, day, year] = pacificDate.split('/');
  const formattedDate = `${year}-${month}-${day}`;

  try {
    // Check for existing session
    const { data: existingSession } = await supabase
      .from('attendance_sessions')
      .select('*')
      .eq('session_date', formattedDate)
      .single();

    if (existingSession) return existingSession;

    // Only create a new session if it's for today or a past date
    const today = new Date();
    const sessionDate = new Date(formattedDate);
    
    if (sessionDate > today) {
      throw new Error('Cannot create sessions for future dates');
    }

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