// src/App.jsx
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Toaster } from 'sonner';
import RootLayout from '@/components/layout/RootLayout';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import AttendanceView from '@/pages/AttendanceView';
import Tournaments from '@/pages/Tournaments';
import StudentDirectory from '@/pages/StudentDirectory';
import Registration from '@/pages/Registration';
import Login from '@/pages/Login';
import NotFound from '@/pages/NotFound';
import PublicDashboard from '@/pages/PublicDashboard';

export default function App() {
  return (
    <Router>
      <Routes>
        {/* Public routes */}
        <Route path="/" element={<PublicDashboard />} />
        <Route path="/login" element={<Login />} />

        {/* Protected admin routes */}
        <Route path="/admin" element={<ProtectedRoute />}>
          <Route element={<RootLayout />}>
            <Route index element={<AttendanceView />} />
            <Route path="tournaments" element={<Tournaments />} />
            <Route path="students" element={<StudentDirectory />} />
            <Route path="registration" element={<Registration />} />
          </Route>
        </Route>

        {/* 404 route */}
        <Route path="*" element={<NotFound />} />
      </Routes>
      <Toaster />
    </Router>
  );
}
