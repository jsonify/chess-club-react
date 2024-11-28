// src/components/students/StudentDirectory.jsx
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Users } from 'lucide-react';
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

  const updateStats = (studentsData) => {
    const newStats = studentsData.reduce((acc, student) => {
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

    setStats(newStats);
  };

  useEffect(() => {
    async function fetchStudents() {
      try {
        setLoading(true);
        
        const { data: allStudents, error: studentsError } = await supabase
          .from('students')
          .select('*')
          .order('grade')
          .order('last_name');  // Removed the .eq('active', true) filter

        if (studentsError) throw studentsError;

        if (allStudents) {
          setStudents(allStudents);
          updateStats(allStudents);
        }
        
      } catch (err) {
        console.error('Error:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }

    fetchStudents();

    // Set up realtime subscription
    const channel = supabase
      .channel('student-directory-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'students'
        },
        (payload) => {
          console.log('Students table changed:', payload);
          
          if (payload.eventType === 'UPDATE') {
            setStudents(currentStudents => {
              const updatedStudents = currentStudents.map(student => 
                student.id === payload.new.id ? { ...student, ...payload.new } : student
              );
              updateStats(updatedStudents);
              return updatedStudents;
            });
          } else if (payload.eventType === 'INSERT') {
            setStudents(currentStudents => {
              const newStudents = [...currentStudents, payload.new].sort((a, b) => {
                if (a.grade !== b.grade) return a.grade - b.grade;
                return a.last_name.localeCompare(b.last_name);
              });
              updateStats(newStudents);
              return newStudents;
            });
          } else if (payload.eventType === 'DELETE') {
            setStudents(currentStudents => {
              const filteredStudents = currentStudents.filter(student => student.id !== payload.old.id);
              updateStats(filteredStudents);
              return filteredStudents;
            });
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 bg-red-50 text-red-700 rounded-lg">
        <h3 className="font-medium">Error loading students: {error}</h3>
      </div>
    );
  }

  return (
    <div className="py-6">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8">
        <div className="mt-8 grid grid-cols-1 gap-5 sm:grid-cols-3">
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

        <div className="mt-8">
          <StudentTable 
            students={students} 
            loading={loading}
            error={error}
          />
        </div>
      </div>
    </div>
  );
}