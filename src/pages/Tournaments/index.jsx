// src/pages/Tournaments/index.jsx
import { useState } from 'react';
import TournamentMatchForm from '@/components/tournaments/TournamentMatchForm';
import TournamentStandings from '@/components/tournaments/TournamentStandings';
import { MatchList } from '@/components/tournaments/MatchList';

export default function TournamentsPage() {
  const [activeTab, setActiveTab] = useState('standings');
  const [key, setKey] = useState(0);

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8 space-y-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              Chess Club Tournaments
            </h1>
            <p className="mt-2 text-sm text-gray-600">
              Track matches, standings, and achievements
            </p>
          </div>

          {/* Mobile Navigation */}
          <div className="md:hidden">
            <select
              value={activeTab}
              onChange={(e) => setActiveTab(e.target.value)}
              className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            >
              <option value="standings">Standings</option>
              <option value="new">Record Match</option>
              <option value="matches">Recent Matches</option>
            </select>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:block">
            <nav className="flex space-x-4">
              {[
                { id: 'standings', label: 'Standings' },
                { id: 'new', label: 'Record Match' },
                { id: 'matches', label: 'Recent Matches' }
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`px-3 py-2 text-sm font-medium rounded-md ${
                    activeTab === tab.id
                      ? 'bg-blue-100 text-blue-700'
                      : 'text-gray-500 hover:text-gray-700'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </nav>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow mb-8">
          <div className="p-6">
            {activeTab === 'standings' && (
              <TournamentStandings key={`standings-${key}`} />
            )}

            {activeTab === 'new' && (
              <TournamentMatchForm key={`form-${key}`} />
            )}

            {activeTab === 'matches' && (
              <div>
                <h2 className="text-xl font-semibold text-gray-900 mb-4">
                  Recent Matches
                </h2>
                <MatchList key={`matches-${key}`} />
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}