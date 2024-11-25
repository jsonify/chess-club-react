import React from 'react';
import { Card, CardHeader, CardContent, Typography } from '@mui/material';

export default function TournamentTab({ achievementStats, recentMatches }) {
  return (
    <Card sx={{ backgroundColor: 'white', borderRadius: 2, boxShadow: 3 }}>
      <CardHeader
        title="Recent Matches"
        subheader="Track tournament progress and achievements"
        sx={{ backgroundColor: 'grey.50', borderBottom: 1, borderColor: 'grey.200' }}
      />
      <CardContent>
        <div className="space-y-4">
          {/* Achievement Summary */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-blue-50 p-4 rounded-lg">
              <Typography variant="body1" color="blue.600" fontWeight="medium">
                5 Point Club
              </Typography>
              <Typography variant="h4" fontWeight="bold">
                {achievementStats.fivePointClub || 0}
              </Typography>
            </div>
            {/* Rest of the achievement stats */}
          </div>

          {/* Recent Matches List */}
          <div className="bg-white rounded-lg border">
            <div className="p-4 border-b">
              <Typography variant="subtitle1" fontWeight="bold">
                Latest Matches
              </Typography>
            </div>
            <div className="divide-y">
              {recentMatches.map((match, index) => (
                <div key={index} className="p-4 flex items-center justify-between">
                  {/* Match details */}
                </div>
              ))}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}