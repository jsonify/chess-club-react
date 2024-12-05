import { useState, useEffect } from 'react';
import { ChevronRight, ChevronDown } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { formatDate } from '@/lib/utils';

export default function SessionHistory({ onSessionSelect }) {
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    loadSessions();
  }, []);

  const loadSessions = async () => {
    try {
      setLoading(true);
      
      const { data: sessions, error: sessionsError } = await supabase
        .from('attendance_sessions')
        .select(`
          id,
          session_date,
          timezone,
          attendance_records(count)
        `)
        .eq('cancelled', false)
        .order('session_date', { ascending: false })
        .limit(10);

      if (sessionsError) throw sessionsError;

      const processedSessions = sessions?.map(session => ({
        ...session,
        attendanceCount: session.attendance_records[0]?.count || 0
      }));

      setSessions(processedSessions || []);
      
    } catch (err) {
      console.error('Error loading sessions:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSessionClick = (session) => {
    onSessionSelect(session);
    setIsOpen(false); // Close the dropdown after selection
  };

  if (!sessions.length) return null;

  return (
    <div className="border rounded-lg">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full px-4 py-3 flex items-center justify-between hover:bg-gray-50"
      >
        <span className="font-medium text-gray-900">Previous Sessions</span>
        {isOpen ? (
          <ChevronDown className="h-5 w-5 text-gray-400" />
        ) : (
          <ChevronRight className="h-5 w-5 text-gray-400" />
        )}
      </button>

      {isOpen && (
        <div className="divide-y">
          {sessions.map((session) => (
            <button
              key={session.id}
              onClick={() => handleSessionClick(session)}
              className="w-full px-4 py-3 flex items-center justify-between hover:bg-gray-50"
            >
              <div>
                <p className="font-medium text-gray-900">
                  {formatDate(session.session_date)}
                </p>
                <p className="text-sm text-gray-500">
                  {session.attendanceCount} student{session.attendanceCount === 1 ? '' : 's'} attended
                </p>
              </div>
              <ChevronRight className="h-5 w-5 text-gray-400" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}