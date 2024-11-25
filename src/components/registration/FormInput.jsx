// src/components/registration/FormInput.jsx
import React from 'react';

export default function FormInput({ 
  name, 
  label, 
  type = 'text', 
  required = false, 
  value, 
  onChange, 
  error 
}) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">
        {label}{required && '*'}
      </label>
      <input
        required={required}
        type={type}
        name={name}
        value={value}
        onChange={onChange}
        className={`w-full rounded-md shadow-sm px-3 py-2 
          ${error ? 'border-red-300 focus:border-red-500 focus:ring-red-500' 
                  : 'border-gray-300 focus:border-blue-500 focus:ring-blue-500'}`}
      />
      {error && (
        <p className="mt-1 text-sm text-red-600">{error}</p>
      )}
    </div>
  );
}