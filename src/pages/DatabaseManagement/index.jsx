// src/pages/DatabaseManagement/index.jsx
import { useState } from 'react';
import { AlertTriangle, Trash2, RefreshCcw } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/lib/supabase';
import ScheduledResetManager from '@/components/database/ScheduledResetManager';
import StudentDataReset from '@/components/database/StudentDataReset';
import DatabaseConfirmationModal from '@/components/database/DatabaseConfirmationModal';

export default function DatabaseManagement() {
  const [isResetting, setIsResetting] = useState(false);
  const [showSessionResetModal, setShowSessionResetModal] = useState(false);
  const [showTournamentResetModal, setShowTournamentResetModal] = useState(false);

  const handleSessionReset = async () => {
    try {
      setIsResetting(true);
      const today = new Date().toISOString().split('T')[0];
      
      const { data: sessionData, error: sessionError } = await supabase
        .from('attendance_sessions')
        .select('id')
        .eq('session_date', today)
        .single();

      if (sessionError) throw sessionError;

      if (!sessionData) {
        toast.error('No session found for today');
        return;
      }

      const { error: attendanceError } = await supabase
        .from('attendance_records')
        .delete()
        .eq('session_id', sessionData.id);
      
      if (attendanceError) throw attendanceError;
      
      toast.success("Today's session data has been reset");
      setShowSessionResetModal(false);
    } catch (error) {
      console.error('Error resetting session:', error);
      toast.error('Failed to reset session data');
    } finally {
      setIsResetting(false);
    }
  };

  const handleTournamentReset = async () => {
    try {
      setIsResetting(true);
      const { error } = await supabase.rpc('reset_tournament_data');
      
      if (error) throw error;
      
      toast.success('Tournament data has been reset successfully');
      setShowTournamentResetModal(false);
    } catch (error) {
      console.error('Error resetting tournament data:', error);
      toast.error('Failed to reset tournament data');
    } finally {
      setIsResetting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Database Management</h1>
          <p className="mt-2 text-sm text-gray-600">
            Manage and reset database records safely
          </p>
        </div>

        <div className="space-y-6">
          {/* Automated Reset Schedule */}
          <ScheduledResetManager />

          {/* Student Data Management */}
          <StudentDataReset />

          {/* Tournament Data Management */}
          <div className="bg-white shadow rounded-lg p-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-medium text-gray-900">Tournament Data</h2>
                <p className="mt-1 text-sm text-gray-500">
                  Reset all tournament-related data including matches and standings
                </p>
              </div>
              <button
                onClick={() => setShowTournamentResetModal(true)}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Reset Tournament Data
              </button>
            </div>
          </div>

          {/* Session Data Management */}
          <div className="bg-white shadow rounded-lg p-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-medium text-gray-900">Current Session</h2>
                <p className="mt-1 text-sm text-gray-500">
                  Reset attendance data for today's session only
                </p>
              </div>
              <button
                onClick={() => setShowSessionResetModal(true)}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-yellow-600 hover:bg-yellow-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-yellow-500"
              >
                <RefreshCcw className="h-4 w-4 mr-2" />
                Reset Today's Session
              </button>
            </div>
          </div>
        </div>

        {/* Session Reset Modal */}
        <DatabaseConfirmationModal
          isOpen={showSessionResetModal}
          icon={AlertTriangle}
          iconColor="text-yellow-600"
          iconBgColor="bg-yellow-100"
          title="Reset Today's Session"
          description="This will remove all attendance records for today's session. This action cannot be undone."
          confirmButtonText="Reset Session"
          confirmButtonColor="bg-yellow-600 hover:bg-yellow-700 focus:ring-yellow-500"
          isProcessing={isResetting}
          processingText="Resetting..."
          onConfirm={handleSessionReset}
          onCancel={() => setShowSessionResetModal(false)}
        />

        {/* Tournament Reset Modal */}
        <DatabaseConfirmationModal
          isOpen={showTournamentResetModal}
          icon={AlertTriangle}
          iconColor="text-red-600"
          iconBgColor="bg-red-100"
          title="Reset Tournament Data"
          description="This will permanently delete all matches, standings, and achievements. This action cannot be undone."
          confirmButtonText="Reset Tournament Data"
          confirmButtonColor="bg-red-600 hover:bg-red-700 focus:ring-red-500"
          isProcessing={isResetting}
          processingText="Resetting..."
          onConfirm={handleTournamentReset}
          onCancel={() => setShowTournamentResetModal(false)}
        />
      </div>
    </div>
  );
}