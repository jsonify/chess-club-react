import { useState } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';

export default function MobileStandingCard({ player, rank }) {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <div className="bg-white shadow rounded-lg overflow-hidden">
      <div 
        className="p-4 cursor-pointer hover:bg-gray-50"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex justify-between items-start">
          <div>
            <div className="flex items-center">
              <span className="text-lg font-semibold text-gray-900 mr-2">
                #{rank}
              </span>
              <div>
                <h3 className="text-sm font-medium text-gray-900">{player.name}</h3>
                <p className="text-sm text-gray-500">Grade {player.grade}</p>
              </div>
            </div>
          </div>
          <div className="flex items-center">
            <div className="text-right mr-2">
              <p className="text-sm font-medium text-gray-900">{player.totalPoints} pts</p>
              <p className="text-sm text-gray-500">{player.gamesPlayed} games</p>
            </div>
            {isExpanded ? (
              <ChevronUp className="h-5 w-5 text-gray-400" />
            ) : (
              <ChevronDown className="h-5 w-5 text-gray-400" />
            )}
          </div>
        </div>
      </div>

      {isExpanded && (
        <div className="px-4 pb-4 border-t border-gray-100">
          <dl className="mt-2 divide-y divide-gray-100">
            <div className="flex justify-between py-2">
              <dt className="text-sm font-medium text-gray-500">Win Rate</dt>
              <dd className="text-sm text-gray-900">{player.winRate}%</dd>
            </div>
            <div className="flex justify-between py-2">
              <dt className="text-sm font-medium text-gray-500">Unique Opponents</dt>
              <dd className="text-sm text-gray-900">{player.uniqueOpponents}</dd>
            </div>
            {player.achievements.length > 0 && (
              <div className="py-2">
                <dt className="text-sm font-medium text-gray-500 mb-2">Achievements</dt>
                <dd className="flex flex-wrap gap-2">
                  {player.achievements.map((achievement, index) => (
                    <span
                      key={index}
                      className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800"
                    >
                      {achievement}
                    </span>
                  ))}
                </dd>
              </div>
            )}
          </dl>
        </div>
      )}
    </div>
  );
}