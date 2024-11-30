// src/pages/Stats/index.jsx
import StatsDashboard from '@/components/stats/StatsDashboard';

export default function StatsPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">
            Chess Club Statistics
          </h1>
          <p className="mt-2 text-sm text-gray-600">
            Comprehensive overview of club performance and participation
          </p>
        </div>

        <StatsDashboard />
      </div>
    </div>
  );
}