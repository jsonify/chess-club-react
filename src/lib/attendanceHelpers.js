// src/lib/attendanceHelpers.js
export const handleCheckIn = async (supabase, studentId, currentSession, attendance) => {
    const isCheckedIn = attendance[studentId]?.checkedIn;
  
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
  };
  
  export const handleCheckOut = async (supabase, studentId, recordId) => {
    const { error: updateError } = await supabase
      .from('attendance_records')
      .update({
        check_out_time: new Date().toISOString()
      })
      .eq('id', recordId);
  
    if (updateError) throw updateError;
  
    return {
      type: 'checkout',
      studentId
    };
  };
  
  // Update the attendance state based on action results
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