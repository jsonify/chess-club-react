import { CalendarClock } from 'lucide-react';

export default function ClubDayAlert() {
  return (
    <div className="bg-blue-50 border-l-4 border-blue-400 p-4">
      <div className="flex items-center">
        <div className="flex-shrink-0">
          <CalendarClock className="h-5 w-5 text-blue-400" />
        </div>
        <div className="ml-3">
          <p className="text-sm text-blue-700">
            Today is Chess Club day! Don't forget to take attendance.
          </p>
        </div>
      </div>
    </div>
  );
}