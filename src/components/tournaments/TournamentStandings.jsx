import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Trophy, Users, Target, Award } from 'lucide-react';

const TournamentStandings = () => {
  const [standings, setStandings] = useState([]);
  const [loading, setLoading] = useState(true);

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
      
      // Fetch all matches with player details
      const { data: matches, error } = await supabase
        .from('matches')
        .select(`
          *,
          player1:player1_id(id, first_name, last_name, grade),
          player2:player2_id(id, first_name, last_name, grade)
        `)
        .not('result', 'eq', 'incomplete');

      if (error) throw error;

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
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="animate-pulse space-y-4">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="h-20 bg-gray-100 rounded-lg" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Stats Summary */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
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
        <StatCard 
          icon={Award} 
          label="Chess Champions"
          value={standings.filter(p => p.winRate >= 70 && p.gamesPlayed >= 5).length}
        />
      </div>

      {/* Standings Table */}
      <div className="bg-white shadow rounded-lg">
        <div className="px-4 py-5 sm:px-6 border-b">
          <h3 className="text-lg font-medium">Tournament Standings</h3>
        </div>
        
        <div className="overflow-x-auto">
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
              {standings.map((player) => (
                <tr key={player.id}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {player.name}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-center text-gray-500">
                    {player.grade}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-center text-gray-900">
                    {player.totalPoints}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-center text-gray-500">
                    {player.gamesPlayed}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-center text-gray-500">
                    {player.winRate}%
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
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
      </div>
    </div>
  );
};

// Stats Card subcomponent
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
            <dd className="text-lg font-medium text-gray-900">
              {value}
            </dd>
          </dl>
        </div>
      </div>
    </div>
  </div>
);

export default TournamentStandings;