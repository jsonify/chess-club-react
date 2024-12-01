// src/components/layout/Sidebar.jsx
import { Link, useLocation } from 'react-router-dom';
import { X, Database } from 'lucide-react';

export default function Sidebar({ open, onClose }) {
  const location = useLocation();

  const links = [
    { href: '/', label: 'Dashboard' },
    { href: '/registration', label: 'Registration' },
    { href: '/tournaments', label: 'Tournaments' },
    { href: '/students', label: 'Students' },
    { href: '/database', label: 'Database', className: 'text-yellow-600' }
  ];

  const handleLinkClick = () => {
    onClose();
  };

  return (
    <div
      className={`fixed inset-0 z-50 lg:hidden ${open ? 'visible' : 'invisible'}`}
    >
      {/* Backdrop */}
      <div
        className={`fixed inset-0 bg-gray-900/80 transition-opacity duration-300 ${
          open ? 'opacity-100' : 'opacity-0'
        }`}
        onClick={onClose}
      />

      {/* Sidebar panel */}
      <div
        className={`fixed inset-y-0 left-0 w-64 bg-white transform transition-transform duration-300 ${
          open ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Close button */}
        <div className="flex h-16 items-center justify-between px-6 border-b">
          <span className="font-semibold">Menu</span>
          <button
            type="button"
            className="-m-2.5 p-2.5 text-gray-700"
            onClick={onClose}
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        {/* Navigation links */}
        <nav className="flex flex-col gap-1 p-4">
          {links.map(link => (
            <Link
              key={link.href}
              to={link.href}
              className={`px-4 py-2 text-sm font-medium rounded-md ${
                location.pathname === link.href 
                  ? 'bg-gray-100 text-gray-900' 
                  : `text-gray-600 hover:bg-gray-50 ${link.className || ''}`
              }`}
              onClick={handleLinkClick}
            >
              {link.label}
            </Link>
          ))}
        </nav>
      </div>
    </div>
  );
}