// src/components/attendance/SessionHistory.jsx
import { useState, useEffect } from 'react';
import { ChevronDown, ChevronUp, ChevronRight, Calendar, Loader2 } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { formatDate } from '@/lib/utils';

const SessionHistory = ({ onSessionSelect }) => {
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isExpanded, setIsExpanded] = useState(false);

  useEffect(() => {
    loadSessions();
  }, []);

  const loadSessions = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('attendance_sessions')
        .select(`
          id,
          session_date,
          attendance_records:attendance_records(count)
        `)
        .order('session_date', { ascending: false })
        .limit(10);

      if (error) throw error;
      setSessions(data || []);
    } catch (err) {
      console.error('Error loading sessions:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow p-4 mb-6">
        <div className="flex justify-center">
          <Loader2 className="h-6 w-6 animate-spin text-blue-500" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white rounded-lg shadow p-4 mb-6">
        <p className="text-red-600 text-sm">{error}</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow mb-6">
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full px-4 py-3 flex items-center justify-between text-left hover:bg-gray-50"
      >
        <div className="flex items-center">
          <Calendar className="h-5 w-5 text-gray-400 mr-2" />
          <span className="font-medium text-gray-900">Previous Sessions</span>
        </div>
        {isExpanded ? (
          <ChevronUp className="h-5 w-5 text-gray-400" />
        ) : (
          <ChevronDown className="h-5 w-5 text-gray-400" />
        )}
      </button>

      {isExpanded && (
        <div className="divide-y">
          {sessions.map((session) => (
            <button
              key={session.id}
              onClick={() => onSessionSelect(session)}
              className="w-full px-4 py-3 flex items-center justify-between hover:bg-gray-50"
            >
              <div>
                <p className="font-medium text-gray-900">
                  {formatDate(session.session_date)}
                </p>
                <p className="text-sm text-gray-500">
                  {session.attendance_records[0].count} students attended
                </p>
              </div>
              <ChevronRight className="h-5 w-5 text-gray-400" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default SessionHistory;