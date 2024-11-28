// src/pages/Tournaments/index.jsx
import { useState, useCallback } from 'react';
import TournamentMatchForm from '@/components/tournaments/TournamentMatchForm';
import TournamentStandings from '@/components/tournaments/TournamentStandings';
import { MatchList } from '@/components/tournaments/MatchList';
import { toast } from 'sonner';
import { Trash2, Loader2, AlertTriangle } from 'lucide-react';
import { supabase } from '@/lib/supabase';

export default function TournamentsPage() {
  const [activeTab, setActiveTab] = useState('standings');
  const [key, setKey] = useState(0);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isResetting, setIsResetting] = useState(false);
  const [mathProblem, setMathProblem] = useState({ num1: 0, num2: 0, answer: '' });
  const [showFinalConfirmation, setShowFinalConfirmation] = useState(false);
  const [verificationError, setVerificationError] = useState('');

  const generateMathProblem = useCallback(() => {
    const num1 = Math.floor(Math.random() * 900) + 100; // Random 3-digit number
    const num2 = Math.floor(Math.random() * 900) + 100;
    setMathProblem({
      num1,
      num2,
      answer: ''
    });
    setVerificationError('');
  }, []);

  const handleModalOpen = () => {
    setIsModalOpen(true);
    generateMathProblem();
    setShowFinalConfirmation(false);
  };

  const handleModalClose = () => {
    setIsModalOpen(false);
    setShowFinalConfirmation(false);
    setVerificationError('');
    setMathProblem({ num1: 0, num2: 0, answer: '' });
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
      const { error: deleteError } = await supabase.rpc('reset_tournament_data');

      if (deleteError) throw deleteError;

      toast.success('Tournament data has been reset successfully');
      handleModalClose();
      setKey(prevKey => prevKey + 1);
    } catch (error) {
      console.error('Error resetting tournament data:', error);
      toast.error('Failed to reset tournament data');
    } finally {
      setIsResetting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8 space-y-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                Chess Club Tournaments
              </h1>
              <p className="mt-2 text-sm text-gray-600">
                Track matches, standings, and achievements
              </p>
            </div>
            <div className="w-full sm:w-auto">
              <button
                onClick={handleModalOpen}
                className="w-full sm:w-auto inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Reset Tournament Data
              </button>
            </div>
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

        <div className="bg-white rounded-lg shadow">
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

      {/* Reset Confirmation Modal */}
      {isModalOpen && (
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
                        Reset Tournament Data
                      </h3>
                      <div className="mt-2">
                        <p className="text-sm text-gray-500">
                          Are you sure you want to reset all tournament data? This will permanently delete all matches, standings, and achievements. This action cannot be undone.
                        </p>
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
      )}
    </div>
  );
}