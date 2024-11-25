import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { formatDate } from '@/lib/utils';
import { Trophy, Clock, Award } from 'lucide-react';
import { toast } from 'sonner';

export function MatchList() {
  const [matches, setMatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchMatches();
  }, []);

  async function fetchMatches() {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('matches')
        .select(`
          *,
          player1:player1_id(
            id,
            first_name,
            last_name,
            grade
          ),
          player2:player2_id(
            id,
            first_name,
            last_name,
            grade
          )
        `)
        .order('created_at', { ascending: false })
        .limit(10);

      if (error) throw error;
      setMatches(data || []);
    } catch (err) {
      console.error('Error fetching matches:', err);
      setError('Failed to load matches');
      toast.error('Failed to load matches');
    } finally {
      setLoading(false);
    }
  }

  function getResultIcon(result) {
    switch (result) {
      case 'player1_win':
        return <Trophy className="h-5 w-5 text-yellow-500" />;
      case 'draw':
        return <Award className="h-5 w-5 text-blue-500" />;
      case 'incomplete':
        return <Clock className="h-5 w-5 text-gray-500" />;
      default:
        return <Trophy className="h-5 w-5 text-yellow-500" />;
    }
  }

  function getResultText(match) {
    if (!match.player1 || !match.player2) return 'Invalid match data';

    switch (match.result) {
      case 'player1_win':
        return `${match.player1.first_name} won`;
      case 'player2_win':
        return `${match.player2.first_name} won`;
      case 'draw':
        return 'Draw';
      case 'incomplete':
        return 'In Progress';
      default:
        return 'Unknown result';
    }
  }

  if (loading) {
    return (
      <div className="space-y-4">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="h-24 rounded-lg bg-gray-100 animate-pulse" />
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-lg border border-red-200 bg-red-50 p-4">
        <p className="text-sm text-red-600">{error}</p>
      </div>
    );
  }

  if (matches.length === 0) {
    return (
      <div className="text-center py-12">
        <Trophy className="mx-auto h-12 w-12 text-gray-400" />
        <h3 className="mt-2 text-sm font-semibold text-gray-900">No matches yet</h3>
        <p className="mt-1 text-sm text-gray-500">
          Get started by recording your first match!
        </p>
      </div>
    );
  }

  return (
    <div className="flow-root">
      <ul role="list" className="-my-5 divide-y divide-gray-200">
        {matches.map((match) => (
          <li key={match.id} className="py-5">
            <div className="flex items-center space-x-4">
              <div className="flex-shrink-0">
                {getResultIcon(match.result)}
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-gray-900">
                  {match.player1?.first_name} {match.player1?.last_name} vs.{' '}
                  {match.player2?.first_name} {match.player2?.last_name}
                </p>
                <p className="truncate text-sm text-gray-500">
                  {getResultText(match)} • Grade {match.player1?.grade} vs. Grade {match.player2?.grade}
                </p>
              </div>
              <div className="flex items-center space-x-2">
                <div className="text-sm text-gray-500">
                  {formatDate(match.created_at)}
                </div>
                {match.material_difference !== 0 && (
                  <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                    match.material_difference > 0 
                      ? 'bg-green-100 text-green-800' 
                      : 'bg-red-100 text-red-800'
                  }`}>
                    {Math.abs(match.material_difference)} point{Math.abs(match.material_difference) !== 1 ? 's' : ''} {
                      match.material_difference > 0 ? 'up' : 'down'
                    }
                  </span>
                )}
              </div>
            </div>
            {match.notes && (
              <div className="mt-2">
                <p className="text-sm text-gray-500">{match.notes}</p>
              </div>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}