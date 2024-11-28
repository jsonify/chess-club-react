// src/components/tournaments/TournamentMatchCard.jsx
import { Trophy, Clock, Award } from 'lucide-react';

export default function TournamentMatchCard({ match }) {
  const getResultIcon = (result) => {
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
  };

  const getResultText = (match) => {
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
  };

  return (
    <div className="bg-white rounded-lg shadow p-4">
      <div className="flex items-start justify-between">
        <div className="flex items-start space-x-3">
          <div className="flex-shrink-0">
            {getResultIcon(match.result)}
          </div>
          <div>
            <h3 className="text-sm font-medium text-gray-900">
              {match.player1?.first_name} {match.player1?.last_name} vs.{' '}
              {match.player2?.first_name} {match.player2?.last_name}
            </h3>
            <p className="mt-1 text-sm text-gray-500">
              {getResultText(match)} • Grade {match.player1?.grade} vs. Grade {match.player2?.grade}
            </p>
            {match.notes && (
              <p className="mt-2 text-sm text-gray-500">{match.notes}</p>
            )}
          </div>
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
  );
}