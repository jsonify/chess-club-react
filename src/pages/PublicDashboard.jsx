import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import { Users, Calendar, Clock, ChevronRight } from 'lucide-react';

export default function PublicDashboard() {
  const [stats, setStats] = useState({
    totalStudents: 0,
    activeStudents: 0,
    grades: {}
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchPublicStats() {
      try {
        const { data: students } = await supabase
          .from('students')
          .select('grade, active')
          .eq('active', true);

        if (students) {
          const gradeDistribution = students.reduce((acc, student) => {
            acc[student.grade] = (acc[student.grade] || 0) + 1;
            return acc;
          }, {});

          setStats({
            totalStudents: students.length,
            activeStudents: students.filter(s => s.active).length,
            grades: gradeDistribution
          });
        }
      } catch (error) {
        console.error('Error fetching public stats:', error);
      } finally {
        setLoading(false);
      }
    }

    fetchPublicStats();
  }, []);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section */}
      <div className="bg-white">
        <div className="max-w-7xl mx-auto py-16 px-4 sm:py-24 sm:px-6 lg:px-8">
          <div className="text-center">
            <h1 className="text-4xl font-extrabold text-gray-900 sm:text-5xl sm:tracking-tight lg:text-6xl">
              Sherwood Elementary Chess Club
            </h1>
            <p className="mt-4 text-xl text-gray-500">
              Join us every Wednesday after school for chess, learning, and fun!
            </p>
          </div>
        </div>
      </div>

      {/* Stats Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-3">
          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <Users className="h-6 w-6 text-gray-400" />
                </div>
                <div className="ml-5">
                  <p className="text-sm font-medium text-gray-500 truncate">
                    Active Members
                  </p>
                  <p className="mt-1 text-3xl font-semibold text-gray-900">
                    {loading ? '-' : stats.activeStudents}
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <Calendar className="h-6 w-6 text-gray-400" />
                </div>
                <div className="ml-5">
                  <p className="text-sm font-medium text-gray-500 truncate">
                    Meeting Day
                  </p>
                  <p className="mt-1 text-3xl font-semibold text-gray-900">
                    Wednesday
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <Clock className="h-6 w-6 text-gray-400" />
                </div>
                <div className="ml-5">
                  <p className="text-sm font-medium text-gray-500 truncate">
                    Meeting Time
                  </p>
                  <p className="mt-1 text-3xl font-semibold text-gray-900">
                    3:30 PM
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Info Cards */}
        <div className="mt-12 grid gap-8 sm:grid-cols-2">
          <div className="bg-white shadow rounded-lg overflow-hidden">
            <div className="p-6">
              <h3 className="text-lg font-medium text-gray-900">Club Details</h3>
              <div className="mt-4 space-y-4">
                <div className="flex justify-between">
                  <span className="text-gray-600">Grades:</span>
                  <span className="text-gray-900">2nd through 6th</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Duration:</span>
                  <span className="text-gray-900">30 minutes</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Season:</span>
                  <span className="text-gray-900">November - March</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Cost:</span>
                  <span className="text-gray-900">Free</span>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white shadow rounded-lg overflow-hidden">
            <div className="p-6">
              <h3 className="text-lg font-medium text-gray-900">Grade Distribution</h3>
              <div className="mt-4 space-y-4">
                {Object.entries(stats.grades).sort().map(([grade, count]) => (
                  <div key={grade} className="flex justify-between items-center">
                    <span className="text-gray-600">Grade {grade}:</span>
                    <div className="flex items-center">
                      <div className="w-32 bg-gray-200 rounded-full h-2.5 mr-2">
                        <div 
                          className="bg-blue-600 h-2.5 rounded-full"
                          style={{ width: `${(count / stats.activeStudents) * 100}%` }}
                        ></div>
                      </div>
                      <span className="text-gray-900">{count} students</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Admin Link */}
        <div className="mt-12 text-center">
          <Link
            to="/login"
            className="inline-flex items-center px-4 py-2 border border-transparent text-base font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
          >
            Admin Login
            <ChevronRight className="ml-2 h-5 w-5" />
          </Link>
        </div>
      </div>
    </div>
  );
}