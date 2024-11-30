// src/components/students/StudentDirectoryCard.jsx
import { useState } from 'react';
import { Mail, Phone, ChevronDown, ChevronUp } from 'lucide-react';

export default function StudentDirectoryCard({ student }) {
  const [isExpanded, setIsExpanded] = useState(false);

  const formatPhoneNumber = (phone) => {
    const cleaned = phone.replace(/\D/g, '');
    return `(${cleaned.slice(0,3)}) ${cleaned.slice(3,6)}-${cleaned.slice(6)}`;
  };

  const renderContactInfo = (name, phone, email, relationship) => {
    if (!name) return null;

    return (
      <div className="mt-3 space-y-1">
        <p className="text-sm font-medium text-gray-900">{name}</p>
        <p className="text-sm text-gray-500">{relationship}</p>
        <div className="flex flex-col space-y-1">
          {phone && (
            <a
              href={`tel:${phone.replace(/\D/g, '')}`}
              className="inline-flex items-center text-sm text-blue-600 hover:text-blue-800"
            >
              <Phone className="h-4 w-4 mr-1" />
              {formatPhoneNumber(phone)}
            </a>
          )}
          {email && (
            <a
              href={`mailto:${email}`}
              className="inline-flex items-center text-sm text-blue-600 hover:text-blue-800"
            >
              <Mail className="h-4 w-4 mr-1" />
              {email}
            </a>
          )}
        </div>
      </div>
    );
  };

  return (
    <div 
      className={`bg-white shadow rounded-lg transition-all duration-200 ${
        isExpanded ? 'p-6' : 'p-4'
      }`}
    >
      {/* Collapsed View - Always Visible */}
      <div 
        className="flex items-center justify-between cursor-pointer"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center space-x-4">
          <div>
            <h3 className="text-lg font-medium text-gray-900">
              {student.first_name} {student.last_name}
            </h3>
            <p className="text-sm text-gray-500">
              Grade {student.grade} • {student.teacher}
            </p>
          </div>
        </div>
        <div className="flex items-center space-x-3">
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
            <ChevronUp className="h-5 w-5 text-gray-400" />
          ) : (
            <ChevronDown className="h-5 w-5 text-gray-400" />
          )}
        </div>
      </div>

      {/* Expanded View - Contact Information */}
      {isExpanded && (
        <div className="mt-4 pt-4 border-t border-gray-200">
          {/* Primary Contact */}
          {renderContactInfo(
            student.contact1_name,
            student.contact1_phone,
            student.contact1_email,
            student.contact1_relationship
          )}

          {/* Secondary Contact */}
          {renderContactInfo(
            student.contact2_name,
            student.contact2_phone,
            student.contact2_email,
            student.contact2_relationship
          )}
        </div>
      )}
    </div>
  );
}