// AttendanceStats.jsx
import React from 'react';
import { Users, CheckCircle, Trophy } from 'lucide-react';
import { StatsCard } from './_StatsCard';

export function AttendanceStats({ totalStudents, presentCount, attendanceRate }) {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-3 mb-6">
      <StatsCard 
        icon={Users} 
        title="Total Students" 
        value={totalStudents} 
        color="blue" 
      />
      <StatsCard 
        icon={CheckCircle} 
        title="Present Today" 
        value={presentCount} 
        color="green" 
      />
      <StatsCard 
        icon={Trophy} 
        title="Attendance Rate" 
        value={`${attendanceRate}%`} 
        color="yellow" 
      />
    </div>
  );
}