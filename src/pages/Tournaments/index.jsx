// src/pages/Tournaments/index.jsx
import { useState } from 'react';
import { Tabs, Tab, Box } from '@mui/material';
import TournamentMatchForm from '@/components/tournaments/TournamentMatchForm';
import TournamentStandings from '@/components/tournaments/TournamentStandings';
import { MatchList } from '@/components/tournaments/MatchList';

export default function TournamentsPage() {
  const [activeTab, setActiveTab] = useState('standings');

  const handleChange = (event, newValue) => {
    setActiveTab(newValue);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
        <header className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">
            Chess Club Tournaments
          </h1>
          <p className="mt-2 text-sm text-gray-600">
            Track matches, standings, and achievements
          </p>
        </header>

        <Box sx={{ width: '100%' }}>
          <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
            <Tabs value={activeTab} onChange={handleChange}>
              <Tab label="Standings" value="standings" />
              <Tab label="Recent Matches" value="matches" />
              <Tab label="Record Match" value="new" />
            </Tabs>
          </Box>

          {activeTab === 'standings' && (
            <TournamentStandings />
          )}

          {activeTab === 'matches' && (
            <div className="bg-white shadow rounded-lg p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">
                Recent Matches
              </h2>
              <MatchList />
            </div>
          )}

          {activeTab === 'new' && (
            <TournamentMatchForm />
          )}
        </Box>
      </div>
    </div>
  );
}