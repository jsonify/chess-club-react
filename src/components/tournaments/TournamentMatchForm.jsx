// src/components/tournaments/TournamentMatchForm.jsx
import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { formatDate } from '@/lib/utils';

const TournamentMatchForm = () => {
  const [loading, setLoading] = useState(false);
  const [students, setStudents] = useState([]);
  const [formData, setFormData] = useState({
    player1: '',
    player2: '',
    result: '',
    materialDiff: 0,
    notes: ''
  });

  const results = [
    { value: 'player1_win', label: 'Player 1 Win' },
    { value: 'player2_win', label: 'Player 2 Win' },
    { value: 'draw', label: 'Draw' },
    { value: 'incomplete', label: 'Incomplete' }
  ];

  useEffect(() => {
    loadActiveStudents();
  }, []);

  const loadActiveStudents = async () => {
    try {
      setLoading(true);
      const today = new Date().toISOString().split('T')[0];

      // Get today's attendance session
      const { data: sessionData, error: sessionError } = await supabase
        .from('attendance_sessions')
        .select('id')
        .eq('session_date', today)
        .single();

      if (sessionError) throw sessionError;

      // Get students who checked in today
      const { data: attendanceData, error: attendanceError } = await supabase
        .from('attendance_records')
        .select(`
          student_id,
          students (
            id,
            first_name,
            last_name,
            grade
          )
        `)
        .eq('session_id', sessionData.id)
        .not('check_in_time', 'is', null);

      if (attendanceError) throw attendanceError;

      // Update students' active status
      const checkedInStudentIds = attendanceData.map(record => record.student_id);
      
      if (checkedInStudentIds.length > 0) {
        // Update status to active for checked-in students
        const { error: updateError } = await supabase
          .from('students')
          .update({ status: 'active' })
          .in('id', checkedInStudentIds);

        if (updateError) throw updateError;
      }

      // Format students for dropdown
      const formattedStudents = attendanceData.map(record => ({
        id: record.students.id,
        name: `${record.students.first_name} ${record.students.last_name} (Grade ${record.students.grade})`
      }));

      setStudents(formattedStudents);

    } catch (error) {
      console.error('Error loading active students:', error);
      toast.error('Failed to load active students');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (formData.player1 === formData.player2) {
      toast.error('Players must be different');
      return;
    }

    setLoading(true);

    try {
      // Calculate points
      const points = calculatePoints(formData.result);

      // Get current session
      const today = new Date().toISOString().split('T')[0];
      const { data: session } = await supabase
        .from('attendance_sessions')
        .select('id')
        .eq('session_date', today)
        .single();

      // Insert match record
      const { data: matchData, error: matchError } = await supabase
        .from('matches')
        .insert([{
          session_id: session.id,
          player1_id: formData.player1,
          player2_id: formData.player2,
          result: formData.result,
          material_difference: formData.materialDiff,
          notes: formData.notes,
          points_player1: points.player1,
          points_player2: points.player2
        }])
        .select()
        .single();

      if (matchError) throw matchError;

      toast.success('Match recorded successfully');
      setFormData({
        player1: '',
        player2: '',
        result: '',
        materialDiff: 0,
        notes: ''
      });

    } catch (error) {
      console.error('Error recording match:', error);
      toast.error('Failed to record match');
    } finally {
      setLoading(false);
    }
  };

  // Calculate points based on result
  const calculatePoints = (result) => {
    switch (result) {
      case 'player1_win':
        return { player1: 1, player2: 0 };
      case 'player2_win':
        return { player1: 0, player2: 1 };
      case 'draw':
        return { player1: 0.5, player2: 0.5 };
      default:
        return { player1: 0, player2: 0 };
    }
  };

  const getFilteredPlayers = (currentPlayerId) => {
    return students.filter(student => student.id !== currentPlayerId);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6 bg-white p-6 rounded-lg shadow">
      <h3 className="text-lg font-medium">Record New Match</h3>
      
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        <div>
          <label className="block text-sm font-medium text-gray-700">
            Player 1
          </label>
          <select
            value={formData.player1}
            onChange={(e) => setFormData(prev => ({ ...prev, player1: e.target.value }))}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            required
          >
            <option value="">Select Player 1</option>
            {students.map(student => (
              <option key={student.id} value={student.id}>
                {student.name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">
            Player 2
          </label>
          <select
            value={formData.player2}
            onChange={(e) => setFormData(prev => ({ ...prev, player2: e.target.value }))}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            required
          >
            <option value="">Select Player 2</option>
            {getFilteredPlayers(formData.player1).map(student => (
              <option key={student.id} value={student.id}>
                {student.name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">
            Result
          </label>
          <select
            value={formData.result}
            onChange={(e) => setFormData(prev => ({ ...prev, result: e.target.value }))}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            required
          >
            <option value="">Select Result</option>
            {results.map(result => (
              <option key={result.value} value={result.value}>
                {result.label}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">
            Material Difference
          </label>
          <input
            type="number"
            value={formData.materialDiff}
            onChange={(e) => setFormData(prev => ({ ...prev, materialDiff: parseInt(e.target.value) }))}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">
          Notes
        </label>
        <textarea
          value={formData.notes}
          onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
          rows={3}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
        />
      </div>

      <button
        type="submit"
        disabled={loading}
        className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
      >
        {loading ? (
          <Loader2 className="h-5 w-5 animate-spin" />
        ) : (
          'Record Match'
        )}
      </button>
    </form>
  );
};

export default TournamentMatchForm;