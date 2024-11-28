// src/components/students/StudentDirectoryCard.jsx
import { useState } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';

export default function StudentDirectoryCard({ student }) {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <div className="bg-white rounded-lg shadow overflow-hidden">
      <div 
        className="p-4 cursor-pointer hover:bg-gray-50"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex justify-between items-start">
          <div>
            <h3 className="text-lg font-medium text-gray-900">
              {student.first_name} {student.last_name}
            </h3>
            <p className="text-sm text-gray-600">
              Grade {student.grade} - {student.teacher}
            </p>
          </div>
          <div className="flex items-center">
            <span
              className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                student.active
                  ? 'bg-green-100 text-green-800'
                  : 'bg-gray-100 text-gray-800'
              }`}
            >
              {student.active ? 'Active' : 'Inactive'}
            </span>
            {isExpanded ? (
              <ChevronUp className="h-5 w-5 ml-2 text-gray-400" />
            ) : (
              <ChevronDown className="h-5 w-5 ml-2 text-gray-400" />
            )}
          </div>
        </div>
      </div>

      {isExpanded && (
        <div className="px-4 pb-4 border-t border-gray-100">
          <dl className="mt-2 divide-y divide-gray-100">
            <div className="flex justify-between py-2">
              <dt className="text-sm font-medium text-gray-500">Contact 1</dt>
              <dd className="text-sm text-gray-900">{student.contact1_name}</dd>
            </div>
            <div className="flex justify-between py-2">
              <dt className="text-sm font-medium text-gray-500">Phone</dt>
              <dd className="text-sm text-gray-900">{student.contact1_phone}</dd>
            </div>
            <div className="flex justify-between py-2">
              <dt className="text-sm font-medium text-gray-500">Email</dt>
              <dd className="text-sm text-gray-900">{student.contact1_email}</dd>
            </div>
            {student.contact2_name && (
              <>
                <div className="flex justify-between py-2">
                  <dt className="text-sm font-medium text-gray-500">Contact 2</dt>
                  <dd className="text-sm text-gray-900">{student.contact2_name}</dd>
                </div>
                <div className="flex justify-between py-2">
                  <dt className="text-sm font-medium text-gray-500">Phone</dt>
                  <dd className="text-sm text-gray-900">{student.contact2_phone}</dd>
                </div>
                <div className="flex justify-between py-2">
                  <dt className="text-sm font-medium text-gray-500">Email</dt>
                  <dd className="text-sm text-gray-900">{student.contact2_email}</dd>
                </div>
              </>
            )}
          </dl>
        </div>
      )}
    </div>
  );
}