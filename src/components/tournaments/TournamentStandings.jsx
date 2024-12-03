import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Trophy, Users, Target, Award, Loader2, ChevronDown, ChevronUp } from 'lucide-react';
import { toast } from 'sonner';
import MobileStandingCard from './MobileStandingCard';

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

const GradeStandings = ({ players, grade }) => (
  <div className="mb-8">
    <h3 className="text-lg font-medium text-gray-900 mb-4">
      Grade {grade} Rankings
    </h3>
    
    {/* Desktop View */}
    <div className="hidden md:block bg-white rounded-lg shadow overflow-hidden">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Rank
            </th>
            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Player
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
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {players.map((player, index) => (
            <tr key={player.id}>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                #{index + 1}
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                <div className="text-sm font-medium text-gray-900">{player.name}</div>
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
            </tr>
          ))}
        </tbody>
      </table>
    </div>

    {/* Mobile View */}
    <div className="md:hidden space-y-4">
      {players.map((player, index) => (
        <MobileStandingCard key={player.id} player={player} rank={index + 1} />
      ))}
    </div>
  </div>
);

export default function TournamentStandings() {
  const [standings, setStandings] = useState({
    byGrade: {},
    overall: []
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('byGrade');

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
      
      const { data: matches, error: matchesError } = await supabase
        .from('matches')
        .select(`
          *,
          player1:player1_id(id, first_name, last_name, grade),
          player2:player2_id(id, first_name, last_name, grade)
        `)
        .not('result', 'eq', 'incomplete');

      if (matchesError) throw matchesError;

      const playerStats = {};

      matches?.forEach(match => {
        const { player1, player2, result } = match;
        if (!player1 || !player2) return;

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

        const p1Stats = playerStats[player1.id];
        const p2Stats = playerStats[player2.id];

        p1Stats.gamesPlayed++;
        p2Stats.gamesPlayed++;
        
        p1Stats.opponents.add(player2.id);
        p2Stats.opponents.add(player1.id);

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

      const byGrade = {};
      const overall = [];

      Object.values(playerStats).forEach(player => {
        const finalStats = {
          ...player,
          uniqueOpponents: player.opponents.size,
          winRate: Math.round((player.wins / player.gamesPlayed) * 100) || 0,
          achievements: calculateAchievements({
            ...player,
            uniqueOpponents: player.opponents.size,
            winRate: Math.round((player.wins / player.gamesPlayed) * 100) || 0
          })
        };

        if (!byGrade[player.grade]) {
          byGrade[player.grade] = [];
        }
        byGrade[player.grade].push(finalStats);
        overall.push(finalStats);
      });

      Object.keys(byGrade).forEach(grade => {
        byGrade[grade].sort((a, b) => {
          if (b.totalPoints !== a.totalPoints) return b.totalPoints - a.totalPoints;
          return a.name.localeCompare(b.name);
        });
      });
      
      overall.sort((a, b) => {
        if (b.totalPoints !== a.totalPoints) return b.totalPoints - a.totalPoints;
        return a.name.localeCompare(b.name);
      });

      setStandings({ byGrade, overall });
    } catch (error) {
      console.error('Error fetching standings:', error);
      setError('Failed to load tournament standings');
      toast.error('Failed to load tournament standings');
    } finally {
      setLoading(false);
    }
  };

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
    <div className="space-y-8">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard 
          icon={Trophy} 
          label="Total Players"
          value={standings.overall.length}
        />
        <StatCard 
          icon={Users} 
          label="Active Players"
          value={standings.overall.filter(p => p.gamesPlayed > 0).length}
        />
        <StatCard 
          icon={Target} 
          label="5 Point Club"
          value={standings.overall.filter(p => p.totalPoints >= 5).length}
        />
        <StatCard 
          icon={Award} 
          label="Chess Champions"
          value={standings.overall.filter(p => p.winRate >= 70 && p.gamesPlayed >= 5).length}
        />
      </div>

      {/* Mobile Tab Selector */}
      <div className="md:hidden flex rounded-lg bg-gray-100 p-1">
        <button
          className={`flex-1 py-2 px-4 rounded-md text-sm font-medium ${
            activeTab === 'byGrade' 
              ? 'bg-white shadow text-gray-900' 
              : 'text-gray-500'
          }`}
          onClick={() => setActiveTab('byGrade')}
        >
          By Grade
        </button>
        <button
          className={`flex-1 py-2 px-4 rounded-md text-sm font-medium ${
            activeTab === 'overall' 
              ? 'bg-white shadow text-gray-900' 
              : 'text-gray-500'
          }`}
          onClick={() => setActiveTab('overall')}
        >
          Overall
        </button>
      </div>

      {/* Grade-based Rankings */}
      <div className={activeTab === 'byGrade' ? 'block' : 'hidden md:block'}>
        {Object.entries(standings.byGrade)
          .sort(([gradeA], [gradeB]) => parseInt(gradeA) - parseInt(gradeB))
          .map(([grade, players]) => (
            <GradeStandings key={grade} grade={grade} players={players} />
          ))}
      </div>

      {/* Overall Rankings */}
      <div className={activeTab === 'overall' ? 'block' : 'hidden md:block'}>
        <h3 className="text-lg font-medium text-gray-900 mb-4">
          Overall Rankings
        </h3>
        
        {/* Desktop View */}
        <div className="hidden md:block bg-white rounded-lg shadow overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Rank
                </th>
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
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Achievements
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {standings.overall.map((player, index) => (
                <tr key={player.id}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    #{index + 1}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">{player.name}</div>
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
          {standings.overall.map((player, index) => (
            <MobileStandingCard key={player.id} player={player} rank={index + 1} />
          ))}
        </div>
      </div>
    </div>
  );
}