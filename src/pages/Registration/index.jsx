import StudentRegistration from '@/components/registration/StudentRegistration';

export default function RegistrationPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
        <header className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">
            Chess Club Registration
          </h1>
          <p className="mt-2 text-sm text-gray-600">
            Register new students for the Sherwood Elementary Chess Club
          </p>
        </header>

        <div className="bg-white shadow rounded-lg">
          <StudentRegistration />
        </div>
      </div>
    </div>
  );
}