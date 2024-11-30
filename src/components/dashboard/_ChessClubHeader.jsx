import React from 'react';
import { Swords, Clock, CalendarDays } from 'lucide-react';

export default function ChessClubHeader() {
  return (
    <div className="border-b border-gray-200 pb-5">
      <h1 className="text-3xl font-bold tracking-tight text-gray-900">
        Sherwood Chess Club Dashboarddd
      </h1>
      <p className="mt-2 text-sm text-gray-500">
        {new Date().toLocaleDateString('en-US', {
          weekday: 'long',
          year: 'numeric',
          month: 'long',
          day: 'numeric'
        })}
      </p>
    </div>
  );
}