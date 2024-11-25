// src/App.jsx
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Toaster } from 'sonner';
import RootLayout from '@/components/layout/RootLayout';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import Dashboard from '@/pages/Dashboard';
import Registration from '@/pages/Registration';
import Tournaments from '@/pages/Tournaments';
import StudentDirectory from '@/pages/StudentDirectory';
import Login from '@/pages/Login';
import NotFound from '@/pages/NotFound';

export default function App() {
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