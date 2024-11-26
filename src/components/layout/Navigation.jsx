// src/components/layout/Navigation.jsx
import { Link, useLocation } from 'react-router-dom';
import { Menu, Swords, LogOut } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/lib/supabase';

export default function Navigation({ onMenuClick }) {
  const location = useLocation();
  
  const links = [
    { href: '/admin', label: 'Dashboard' },
    { href: '/admin/registration', label: 'Registration' },
    { href: '/admin/tournaments', label: 'Tournaments' },
    { href: '/admin/students', label: 'Students' }
  ];

  const handleLinkClick = (href) => {
    toast.success(`Navigated to ${href}`);
  };

  const handleLogout = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      
      toast.success('Logged out successfully');
    } catch (error) {
      toast.error('Error signing out');
      console.error('Error:', error);
    }
  };

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-white border-b">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          {/* Left section */}
          <div className="flex items-center">
            <button
              type="button"
              className="-m-2.5 p-2.5 text-gray-700 lg:hidden"
              onClick={onMenuClick}
            >
              <Menu className="h-6 w-6" />
            </button>
            
            <Link to="/admin" className="flex items-center gap-2 ml-4 lg:ml-0">
              <Swords className="h-8 w-8 text-blue-600" />
              <span className="font-bold text-xl">Chess Club</span>
            </Link>
          </div>

          {/* Center section - Navigation links */}
          <div className="hidden lg:flex lg:gap-x-6">
            {links.map(link => (
              <Link
                key={link.href}
                to={link.href}
                className={`px-3 py-2 text-sm font-medium rounded-md ${
                  location.pathname === link.href 
                    ? 'bg-gray-100 text-gray-900' 
                    : 'text-gray-600 hover:bg-gray-50'
                }`}
                onClick={() => handleLinkClick(link.href)}
              >
                {link.label}
              </Link>
            ))}
          </div>

          {/* Right section - Logout button */}
          <div className="flex items-center">
            <button
              onClick={handleLogout}
              className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-gray-600 hover:bg-gray-50 rounded-md"
            >
              <LogOut className="h-4 w-4" />
              <span className="hidden sm:inline">Sign out</span>
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
}