// src/components/students/StudentDirectory.jsx
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Users, AlertCircle } from 'lucide-react';
import StudentTable from '@/components/StudentTable';

export default function StudentDirectory() {
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [stats, setStats] = useState({
    totalCount: 0,
    activeCount: 0,
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
          // Count total and active students
          acc.totalCount++;
          if (student.active) {
            acc.activeCount++;
          }
          
          // Group by grade
          if (!acc.byGrade[student.grade]) {
            acc.byGrade[student.grade] = {
              total: 0,
              active: 0
            };
          }
          acc.byGrade[student.grade].total++;
          if (student.active) {
            acc.byGrade[student.grade].active++;
          }
          
          return acc;
        }, { 
          totalCount: 0, 
          activeCount: 0, 
          byGrade: {} 
        });
        
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
                      {stats.totalCount}
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
                      Active Students
                    </dt>
                    <dd className="text-lg font-medium text-gray-900">
                      {stats.activeCount}
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
                        .map(([grade, counts]) => (
                          <span key={grade} className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 mr-2">
                            Grade {grade}: {counts.active}/{counts.total}
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
          {error ? (
            <div className="rounded-md bg-red-50 p-4">
              <div className="flex">
                <div className="flex-shrink-0">
                  <AlertCircle className="h-5 w-5 text-red-400" />
                </div>
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-red-800">
                    Error loading students
                  </h3>
                  <div className="mt-2 text-sm text-red-700">
                    <p>{error}</p>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <StudentTable students={students} />
          )}
        </div>
      </div>
    </div>
  );
}