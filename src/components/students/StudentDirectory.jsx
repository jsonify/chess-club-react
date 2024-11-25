import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Users, AlertCircle } from 'lucide-react';
import StudentTable from '@/components/StudentTable';

export default function StudentDirectory() {
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [stats, setStats] = useState({
    totalActive: 0,
    byGrade: {},
  });

  useEffect(() => {
    async function fetchStudents() {
      try {
        setLoading(true);
        const { data, error: fetchError } = await supabase
          .from('students')
          .select('*')
          .order('grade')
          .order('last_name');

        if (fetchError) throw fetchError;

        setStudents(data || []);
        
        // Calculate stats
        const stats = data.reduce((acc, student) => {
          // Count active students
          if (student.active) {
            acc.totalActive++;
          }
          // Group by grade
          acc.byGrade[student.grade] = (acc.byGrade[student.grade] || 0) + 1;
          return acc;
        }, { totalActive: 0, byGrade: {} });
        
        setStats(stats);
        
      } catch (err) {
        console.error('Error:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }

    fetchStudents();
  }, []);

  return (
    <div className="py-6">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8">
        <h1 className="text-2xl font-semibold text-gray-900">Student Directory</h1>
      </div>
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8">
        {/* Stats Cards */}
        <div className="mt-8 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <Users className="h-6 w-6 text-gray-400" />
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">
                      Total Students
                    </dt>
                    <dd className="text-lg font-medium text-gray-900">
                      {students.length}
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>
          
          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <Users className="h-6 w-6 text-green-400" />
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">
                      Active Members
                    </dt>
                    <dd className="text-lg font-medium text-gray-900">
                      {stats.totalActive}
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>
          
          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <Users className="h-6 w-6 text-blue-400" />
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">
                      Grade Distribution
                    </dt>
                    <dd className="text-sm mt-1">
                      {Object.entries(stats.byGrade)
                        .sort(([a], [b]) => a - b)
                        .map(([grade, count]) => (
                          <span key={grade} className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 mr-2">
                            Grade {grade}: {count}
                          </span>
                        ))}
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Student Table */}
        <div className="mt-8">
          <StudentTable students={students} />
        </div>
      </div>
    </div>
  );
}