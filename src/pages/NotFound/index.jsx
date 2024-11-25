// src/pages/NotFound.jsx
import { Link } from 'react-router-dom';

export default function NotFound() {
  return (
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center">
      <div className="text-center">
        <h1 className="text-4xl font-bold text-gray-900">404</h1>
        <p className="mt-2 text-lg text-gray-600">Page not found</p>
        <Link
          to="/"
          className="mt-4 inline-block px-4 py-2 rounded-md bg-blue-600 text-white hover:bg-blue-700"
        >
          Return to Dashboard
        </Link>
      </div>
    </div>
  );
}