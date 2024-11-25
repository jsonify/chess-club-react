import { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';

// Create Supabase client
const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_ANON_KEY
);

export default function SupabaseTest() {
  const [status, setStatus] = useState('Testing connection...');
  const [error, setError] = useState(null);
  const [students, setStudents] = useState([]);

  useEffect(() => {
    async function testConnection() {
      try {
        // Test the connection by trying to read from the students table
        const { data, error } = await supabase
          .from('students')
          .select('*')
          .limit(5);

        if (error) throw error;

        setStudents(data || []);
        setStatus('Connection successful! ✅');
      } catch (err) {
        setError(err.message);
        setStatus('Connection failed! ❌');
      }
    }

    testConnection();
  }, []);

  return (
    <div className="p-6 max-w-2xl mx-auto">
      <div className="mb-6">
        <h2 className="text-2xl font-bold mb-4">Supabase Connection Test</h2>
        <div className={`p-4 rounded-md ${status.includes('successful') ? 'bg-green-100' : 'bg-red-100'}`}>
          <p className="font-medium">{status}</p>
          {error && (
            <p className="text-red-600 mt-2 text-sm">
              Error: {error}
            </p>
          )}
        </div>
      </div>

      {students.length > 0 && (
        <div>
          <h3 className="font-semibold mb-2">Found {students.length} students:</h3>
          <div className="bg-white rounded-lg shadow">
            {students.map((student) => (
              <div key={student.id} className="p-4 border-b last:border-b-0">
                <p className="font-medium">{student.first_name} {student.last_name}</p>
                <p className="text-sm text-gray-600">Grade {student.grade} - {student.teacher}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}