// src/pages/StudentDirectory/index.jsx
import StudentDirectory from '@/components/students/StudentDirectory';

export default function StudentDirectoryPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">Student Directory</h1>
        <StudentDirectory />
      </div>
    </div>
  );
}