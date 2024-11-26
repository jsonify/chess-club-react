import { useEffect, useState } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Toaster } from 'sonner';
import { checkConnection, SUPABASE_PROJECT } from '@/lib/supabase';
import RootLayout from '@/components/layout/RootLayout';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import Dashboard from '@/pages/Dashboard';
import Registration from '@/pages/Registration';
import Tournaments from '@/pages/Tournaments';
import StudentDirectory from '@/pages/StudentDirectory';
import Login from '@/pages/Login';
import NotFound from '@/pages/NotFound';

function ConnectionError() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="max-w-md w-full text-center">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">
          Connection Error
        </h1>
        <p className="text-gray-600 mb-4">
          Unable to connect to the database. Please check your configuration or try again later.
        </p>
        <button
          onClick={() => window.location.reload()}
          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
        >
          Retry Connection
        </button>
      </div>
    </div>
  );
}

export default function App() {
  const [connectionError, setConnectionError] = useState(false);

  useEffect(() => {
    async function verifyConnection() {
      if (!SUPABASE_PROJECT.isConfigured) {
        setConnectionError(true);
        return;
      }

      const isConnected = await checkConnection();
      setConnectionError(!isConnected);
    }

    verifyConnection();
  }, []);

  if (connectionError) {
    return <ConnectionError />;
  }

  return (
    <Router>
      <Routes>
        {/* Public route */}
        <Route path="/login" element={<Login />} />

        {/* Protected routes */}
        <Route element={<ProtectedRoute />}>
          <Route element={<RootLayout />}>
            <Route index element={<Dashboard />} />
            <Route path="registration" element={<Registration />} />
            <Route path="tournaments" element={<Tournaments />} />
            <Route path="students" element={<StudentDirectory />} />
          </Route>
        </Route>

        {/* 404 route */}
        <Route path="*" element={<NotFound />} />
      </Routes>
      <Toaster />
    </Router>
  );
}