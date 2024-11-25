import { Users } from 'lucide-react';
import StudentTable from '@/components/StudentTable';

export default function StudentsTab({ students, loading, error }) {
  if (loading) {
    return (
      <div className="text-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
        <p className="mt-2 text-sm text-gray-500">Loading students...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <div className="rounded-full h-12 w-12 bg-red-100 flex items-center justify-center mx-auto">
          <Users className="h-6 w-6 text-red-600" />
        </div>
        <h3 className="mt-2 text-sm font-medium text-gray-900">Error Loading Students</h3>
        <p className="mt-1 text-sm text-gray-500">{error}</p>
      </div>
    );
  }

  if (!students?.length) {
    return (
      <div className="text-center py-12">
        <div className="rounded-full h-12 w-12 bg-gray-100 flex items-center justify-center mx-auto">
          <Users className="h-6 w-6 text-gray-400" />
        </div>
        <h3 className="mt-2 text-sm font-medium text-gray-900">No Students</h3>
        <p className="mt-1 text-sm text-gray-500">Get started by adding students to the club.</p>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-6">
        <div className="sm:flex sm:items-center sm:justify-between">
          <div>
            <h2 className="text-lg font-medium text-gray-900">Club Members</h2>
            <p className="mt-1 text-sm text-gray-500">
              A list of all students currently enrolled in the chess club.
            </p>
          </div>
          <div className="mt-4 sm:mt-0">
            <button
              type="button"
              onClick={() => window.location.href = '/registration'}
              className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              Add Student
            </button>
          </div>
        </div>
      </div>

      <StudentTable students={students} />
    </div>
  );
}