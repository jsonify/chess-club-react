// src/components/registration/PhoneInput.jsx
import React from 'react';

export default function PhoneInput({ 
  name, 
  label, 
  required = false, 
  value, 
  onChange,
  error
}) {
  // Format phone number as user types
  const handlePhoneChange = (e) => {
    let input = e.target.value.replace(/\D/g, ''); // Remove non-digits
    let formatted = '';

    if (input.length <= 10) {
      // Format as (XXX) XXX-XXXX
      if (input.length > 0) {
        formatted += '(' + input.slice(0, 3);
      }
      if (input.length > 3) {
        formatted += ') ' + input.slice(3, 6);
      }
      if (input.length > 6) {
        formatted += '-' + input.slice(6, 10);
      }

      // Call parent's onChange with the event-like object
      onChange({
        target: {
          name,
          value: formatted || input
        }
      });
    }
  };

  // Validate phone number
  const validatePhone = (value) => {
    const phoneRegex = /^\(\d{3}\) \d{3}-\d{4}$/;
    return phoneRegex.test(value);
  };

  // Get validation state
  const isValid = value ? validatePhone(value) : true;
  const showError = error || (value && !isValid);

  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">
        {label}{required && '*'}
      </label>
      <div className="relative">
        <input
          type="tel"
          name={name}
          value={value}
          onChange={handlePhoneChange}
          required={required}
          placeholder="(555) 555-5555"
          className={`w-full rounded-md shadow-sm px-3 py-2 
            ${showError 
              ? 'border-red-300 focus:border-red-500 focus:ring-red-500' 
              : value && isValid
                ? 'border-green-300 focus:border-green-500 focus:ring-green-500'
                : 'border-gray-300 focus:border-blue-500 focus:ring-blue-500'
            }`}
        />
        {value && (
          <div className="absolute inset-y-0 right-0 flex items-center pr-3">
            {isValid ? (
              <svg className="h-5 w-5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            ) : (
              <svg className="h-5 w-5 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            )}
          </div>
        )}
      </div>
      {showError && (
        <p className="mt-1 text-sm text-red-600">
          {error || 'Please enter a valid phone number: (555) 555-5555'}
        </p>
      )}
    </div>
  );
}

