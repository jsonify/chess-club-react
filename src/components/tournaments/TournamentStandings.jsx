// src/components/tournaments/TournamentStandings.jsx
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Trophy, Users, Target, Award, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

export default function TournamentStandings() {
  const [standings, setStandings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchStandings();
  }, []);

  const calculateAchievements = (stats) => {
    const achievements = [];
    
    if (stats.totalPoints >= 5) achievements.push('5 Point Club');
    if (stats.totalPoints >= 10) achievements.push('10 Point Master');
    if (stats.uniqueOpponents >= 5) achievements.push('Social Player');
    if (stats.uniqueOpponents >= 10) achievements.push('Chess Ambassador');
    if (stats.gamesPlayed >= 10) achievements.push('Active Player');
    if (stats.winRate >= 70 && stats.gamesPlayed >= 5) achievements.push('Chess Champion');
    
    return achievements;
  };

  const fetchStandings = async () => {
    try {
      setLoading(true);
      
      // Fetch matches with player details
      const { data: matches, error: matchesError } = await supabase
        .from('matches')
        .select(`
          *,
          player1:player1_id(id, first_name, last_name, grade),
          player2:player2_id(id, first_name, last_name, grade)
        `)
        .not('result', 'eq', 'incomplete');

      if (matchesError) throw matchesError;

      // Process matches to calculate statistics
      const playerStats = {};

      matches.forEach(match => {
        const { player1, player2, result } = match;
        
        // Initialize player stats if needed
        [player1, player2].forEach(player => {
          if (!playerStats[player.id]) {
            playerStats[player.id] = {
              id: player.id,
              name: `${player.first_name} ${player.last_name}`,
              grade: player.grade,
              totalPoints: 0,
              gamesPlayed: 0,
              wins: 0,
              opponents: new Set(),
              winRate: 0
            };
          }
        });

        // Update stats based on match result
        const p1Stats = playerStats[player1.id];
        const p2Stats = playerStats[player2.id];

        // Increment games played
        p1Stats.gamesPlayed++;
        p2Stats.gamesPlayed++;

        // Add opponents
        p1Stats.opponents.add(player2.id);
        p2Stats.opponents.add(player1.id);

        // Update points and wins
        switch (result) {
          case 'player1_win':
            p1Stats.totalPoints += 1;
            p1Stats.wins += 1;
            break;
          case 'player2_win':
            p2Stats.totalPoints += 1;
            p2Stats.wins += 1;
            break;
          case 'draw':
            p1Stats.totalPoints += 0.5;
            p2Stats.totalPoints += 0.5;
            break;
        }
      });

      // Calculate final statistics and achievements
      const standingsData = Object.values(playerStats).map(player => ({
        ...player,
        uniqueOpponents: player.opponents.size,
        winRate: Math.round((player.wins / player.gamesPlayed) * 100) || 0,
        achievements: calculateAchievements({
          ...player,
          uniqueOpponents: player.opponents.size,
          winRate: Math.round((player.wins / player.gamesPlayed) * 100) || 0
        })
      }));

      // Sort by points (desc) then name (asc)
      standingsData.sort((a, b) => {
        if (b.totalPoints !== a.totalPoints) return b.totalPoints - a.totalPoints;
        return a.name.localeCompare(b.name);
      });

      setStandings(standingsData);
    } catch (error) {
      console.error('Error fetching standings:', error);
      setError('Failed to load tournament standings');
      toast.error('Failed to load tournament standings');
    } finally {
      setLoading(false);
    }
  };

  const StatCard = ({ icon: Icon, label, value }) => (
    <div className="bg-white overflow-hidden shadow rounded-lg">
      <div className="p-5">
        <div className="flex items-center">
          <div className="flex-shrink-0">
            <Icon className="h-6 w-6 text-gray-400" />
          </div>
          <div className="ml-5 w-0 flex-1">
            <dl>
              <dt className="text-sm font-medium text-gray-500 truncate">
                {label}
              </dt>
              <dd className="text-2xl font-semibold text-gray-900">
                {value}
              </dd>
            </dl>
          </div>
        </div>
      </div>
    </div>
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 bg-red-50 text-red-700 rounded-lg">
        <p className="font-medium">{error}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Stats Summary */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatCard 
          icon={Trophy} 
          label="Total Players"
          value={standings.length}
        />
        <StatCard 
          icon={Users} 
          label="Active Players"
          value={standings.filter(p => p.gamesPlayed > 0).length}
        />
        <StatCard 
          icon={Target} 
          label="5 Point Club"
          value={standings.filter(p => p.totalPoints >= 5).length}
        />
      </div>

      {/* Desktop View */}
      <div className="hidden md:block">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Player
              </th>
              <th scope="col" className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                Grade
              </th>
              <th scope="col" className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                Points
              </th>
              <th scope="col" className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                Games
              </th>
              <th scope="col" className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                Win Rate
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Achievements
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {standings.map((player, index) => (
              <tr key={player.id}>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center">
                    <span className="text-sm font-medium text-gray-900 w-6">
                      #{index + 1}
                    </span>
                    <span className="ml-2 text-sm font-medium text-gray-900">
                      {player.name}
                    </span>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-center text-sm text-gray-500">
                  {player.grade}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-center text-sm font-medium text-gray-900">
                  {player.totalPoints}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-center text-sm text-gray-500">
                  {player.gamesPlayed}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-center text-sm text-gray-500">
                  {player.winRate}%
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex flex-wrap gap-2">
                    {player.achievements.map((achievement, index) => (
                      <span
                        key={index}
                        className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800"
                      >
                        {achievement}
                      </span>
                    ))}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile View */}
      <div className="md:hidden space-y-4">
        {standings.map((player, index) => (
          <div key={player.id} className="bg-white rounded-lg shadow overflow-hidden">
            <div className="p-4">
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center">
                    <span className="text-lg font-semibold text-gray-900">
                      #{index + 1}
                    </span>
                    <h3 className="ml-2 text-lg font-medium text-gray-900">
                      {player.name}
                    </h3>
                  </div>
                  <p className="mt-1 text-sm text-gray-500">
                    Grade {player.grade}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-lg font-semibold text-gray-900">
                    {player.totalPoints} pts
                  </p>
                  <p className="text-sm text-gray-500">
                    {player.gamesPlayed} games
                  </p>
                </div>
              </div>

              <div className="mt-3 grid grid-cols-2 gap-2">
                <div className="flex justify-between px-3 py-2 bg-gray-50 rounded-lg">
                  <span className="text-sm text-gray-500">Win Rate</span>
                  <span className="text-sm font-medium text-gray-900">
                    {player.winRate}%
                  </span>
                </div>
                <div className="flex justify-between px-3 py-2 bg-gray-50 rounded-lg">
                  <span className="text-sm text-gray-500">Opponents</span>
                  <span className="text-sm font-medium text-gray-900">
                    {player.uniqueOpponents}
                  </span>
                </div>
              </div>

              {player.achievements.length > 0 && (
                <div className="mt-3">
                  <div className="flex flex-wrap gap-2">
                    {player.achievements.map((achievement, i) => (
                      <span
                        key={i}
                        className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800"
                      >
                        {achievement}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}