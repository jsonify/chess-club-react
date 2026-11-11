// src/pages/Teachers/index.jsx
import TeacherManager from '@/components/teachers/TeacherManager';

export default function TeachersPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8 py-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">Teachers</h1>
        <TeacherManager />
      </div>
    </div>
  );
}
