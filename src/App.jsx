// src/App.jsx
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Toaster } from 'sonner';
import RootLayout from '@/components/layout/RootLayout';
import AttendanceView from '@/pages/AttendanceView';
import Tournaments from '@/pages/Tournaments';
import StudentDirectory from '@/pages/StudentDirectory';
import Registration from '@/pages/Registration';
import DatabaseManagement from '@/pages/DatabaseManagement';
import NotFound from '@/pages/NotFound';

export default function App() {
  return (
    <Router>
      <Routes>
        <Route element={<RootLayout />}>
          <Route index element={<AttendanceView />} />
          <Route path="/tournaments" element={<Tournaments />} />
          <Route path="/students" element={<StudentDirectory />} />
          <Route path="/registration" element={<Registration />} />
          <Route path="/database" element={<DatabaseManagement />} />
        </Route>

        {/* 404 route */}
        <Route path="*" element={<NotFound />} />
      </Routes>
      <Toaster />
    </Router>
  );
}