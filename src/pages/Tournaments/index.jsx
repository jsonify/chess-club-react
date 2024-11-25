import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { MatchList } from '@/components/tournaments/MatchList';
import { toast } from 'sonner';

export default function TournamentsPage() {
  const [loading, setLoading] = useState(false);

  const recordMatch = async (matchData) => {
    try {
      setLoading(true);
      const { error } = await supabase
        .from('matches')
        .insert([matchData]);

      if (error) throw error;
      toast.success('Match recorded successfully');
    } catch (error) {
      console.error('Error recording match:', error);
      toast.error('Failed to record match');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
        <header className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">
            Chess Club Tournaments
          </h1>
          <p className="mt-2 text-sm text-gray-600">
            Record matches and track tournament progress
          </p>
        </header>

        <div className="space-y-6">
          <div className="bg-white shadow rounded-lg p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              Record New Match
            </h2>
            {/* TODO: Add match recording form */}
          </div>

          <div className="bg-white shadow rounded-lg p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              Recent Matches
            </h2>
            <MatchList />
          </div>
        </div>
      </div>
    </div>
  );
}