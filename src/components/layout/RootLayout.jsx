// src/components/layout/RootLayout.jsx
import { Outlet } from 'react-router-dom';
import { useState } from 'react';
import Navigation from './Navigation';
import Sidebar from './Sidebar';

export default function RootLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation onMenuClick={() => setSidebarOpen(true)} />
      
      <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      
      <main className="pt-16"> {/* Add padding for fixed navbar */}
        <Outlet />
      </main>
    </div>
  );
}