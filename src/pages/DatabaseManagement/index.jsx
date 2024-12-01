// src/pages/DatabaseManagement/index.jsx
import { useState, useCallback } from 'react';
import { toast } from 'sonner';
import { Trash2, Loader2, AlertTriangle, RefreshCcw } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import ScheduledResetManager from '@/components/database/ScheduledResetManager';

export default function DatabaseManagement() {
  const [isResetModalOpen, setIsResetModalOpen] = useState(false);
  const [isSessionModalOpen, setIsSessionModalOpen] = useState(false);
  const [isResetting, setIsResetting] = useState(false);
  const [mathProblem, setMathProblem] = useState({ num1: 0, num2: 0, answer: '' });
  const [showFinalConfirmation, setShowFinalConfirmation] = useState(false);
  const [verificationError, setVerificationError] = useState('');
  const [resetType, setResetType] = useState(null);

  const generateMathProblem = useCallback(() => {
    const num1 = Math.floor(Math.random() * 90) + 10;
    const num2 = Math.floor(Math.random() * 90) + 10;
    setMathProblem({
      num1,
      num2,
      answer: ''
    });
    setVerificationError('');
  }, []);

  const handleModalOpen = (type) => {
    setResetType(type);
    if (type === 'tournament') {
      setIsResetModalOpen(true);
    } else {
      setIsSessionModalOpen(true);
    }
    generateMathProblem();
    setShowFinalConfirmation(false);
  };

  const handleModalClose = () => {
    setIsResetModalOpen(false);
    setIsSessionModalOpen(false);
    setShowFinalConfirmation(false);
    setVerificationError('');
    setMathProblem({ num1: 0, num2: 0, answer: '' });
    setResetType(null);
  };

  const handleAnswerSubmit = (e) => {
    e.preventDefault();
    const correctAnswer = mathProblem.num1 * mathProblem.num2;
    if (parseInt(mathProblem.answer) === correctAnswer) {
      setShowFinalConfirmation(true);
      setVerificationError('');
    } else {
      setVerificationError('Incorrect answer. Please try again.');
      generateMathProblem();
    }
  };

  const handleReset = async () => {
    try {
      setIsResetting(true);

      if (resetType === 'tournament') {
        const { error: deleteError } = await supabase.rpc('reset_tournament_data');
        if (deleteError) throw deleteError;
        toast.success('Tournament data has been reset successfully');
      } else if (resetType === 'session') {
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
        
        toast.success("Today's session data has been reset successfully");
      }

      handleModalClose();
    } catch (error) {
      console.error('Error resetting data:', error);
      toast.error(`Failed to reset ${resetType} data: ${error.message}`);
    } finally {
      setIsResetting(false);
    }
  };

  const ResetModal = ({ isOpen, title, description }) => {
    if (!isOpen) return null;

    return (
      <div className="fixed z-50 inset-0 overflow-y-auto">
        <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
          <div 
            className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity"
            onClick={handleModalClose}
          />

          <div className="inline-block align-bottom bg-white rounded-lg px-4 pt-5 pb-4 text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full sm:p-6">
            {!showFinalConfirmation ? (
              <div className="sm:flex sm:items-start">
                <div className="mx-auto flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full bg-yellow-100 sm:mx-0 sm:h-10 sm:w-10">
                  <AlertTriangle className="h-6 w-6 text-yellow-600" />
                </div>
                <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left">
                  <h3 className="text-lg leading-6 font-medium text-gray-900">
                    Verify Reset Request
                  </h3>
                  <div className="mt-2">
                    <p className="text-sm text-gray-500">
                      To proceed, please solve this multiplication problem:
                    </p>
                    <div className="mt-4 text-lg font-medium text-gray-900">
                      {mathProblem.num1} × {mathProblem.num2} = ?
                    </div>
                    <form onSubmit={handleAnswerSubmit} className="mt-4">
                      <input
                        type="number"
                        value={mathProblem.answer}
                        onChange={(e) => setMathProblem(prev => ({ ...prev, answer: e.target.value }))}
                        className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                        placeholder="Enter your answer"
                      />
                      {verificationError && (
                        <p className="mt-2 text-sm text-red-600">{verificationError}</p>
                      )}
                      <div className="mt-5 sm:mt-4 sm:flex sm:flex-row-reverse">
                        <button
                          type="submit"
                          className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-yellow-600 text-base font-medium text-white hover:bg-yellow-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-yellow-500 sm:ml-3 sm:w-auto sm:text-sm"
                        >
                          Verify Answer
                        </button>
                        <button
                          type="button"
                          onClick={handleModalClose}
                          className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:mt-0 sm:w-auto sm:text-sm"
                        >
                          Cancel
                        </button>
                      </div>
                    </form>
                  </div>
                </div>
              </div>
            ) : (
              <>
                <div className="sm:flex sm:items-start">
                  <div className="mx-auto flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full bg-red-100 sm:mx-0 sm:h-10 sm:w-10">
                    <Trash2 className="h-6 w-6 text-red-600" />
                  </div>
                  <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left">
                    <h3 className="text-lg leading-6 font-medium text-gray-900">
                      {title}
                    </h3>
                    <div className="mt-2">
                      <p className="text-sm text-gray-500">{description}</p>
                    </div>
                  </div>
                </div>
                <div className="mt-5 sm:mt-4 sm:flex sm:flex-row-reverse">
                  <button
                    type="button"
                    disabled={isResetting}
                    onClick={handleReset}
                    className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-red-600 text-base font-medium text-white hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 sm:ml-3 sm:w-auto sm:text-sm disabled:opacity-50"
                  >
                    {isResetting ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Resetting...
                      </>
                    ) : (
                      'Reset Data'
                    )}
                  </button>
                  <button
                    type="button"
                    disabled={isResetting}
                    onClick={handleModalClose}
                    className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:mt-0 sm:w-auto sm:text-sm disabled:opacity-50"
                  >
                    Cancel
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    );
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

          {/* Reset Tournament Data */}
          <div className="bg-white shadow rounded-lg p-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-medium text-gray-900">Tournament Data</h2>
                <p className="mt-1 text-sm text-gray-500">
                  Reset all tournament-related data including matches, standings, and achievements
                </p>
              </div>
              <button
                onClick={() => handleModalOpen('tournament')}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Reset Tournament Data
              </button>
            </div>
          </div>

          {/* Reset Current Session */}
          <div className="bg-white shadow rounded-lg p-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-medium text-gray-900">Current Session</h2>
                <p className="mt-1 text-sm text-gray-500">
                  Reset attendance data for the current session only
                </p>
              </div>
              <button
                onClick={() => handleModalOpen('session')}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-yellow-600 hover:bg-yellow-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-yellow-500"
              >
                <RefreshCcw className="h-4 w-4 mr-2" />
                Reset Current Session
              </button>
            </div>
          </div>
        </div>

        {/* Reset Modals */}
        <ResetModal
          isOpen={isResetModalOpen}
          title="Reset Tournament Data"
          description="Are you sure you want to reset all tournament data? This will permanently delete all matches, standings, and achievements. This action cannot be undone."
        />

        <ResetModal
          isOpen={isSessionModalOpen}
          title="Reset Current Session"
          description="Are you sure you want to reset today's session data? This will remove all attendance records for today only. This action cannot be undone."
        />
      </div>
    </div>
  );
}