// src/components/registration/FormSelect.jsx
export default function FormSelect({ 
    name, 
    label, 
    options, 
    required = false, 
    value, 
    onChange 
  }) {
    return (
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          {label}{required && '*'}
        </label>
        <select
          required={required}
          name={name}
          value={value}
          onChange={onChange}
          className="w-full rounded-md border-gray-300 shadow-sm px-3 py-2"
        >
          <option value="">Select {label}</option>
          {options.map((option) => (
            <option key={option} value={option}>
              {option}
            </option>
          ))}
        </select>
      </div>
    );
  }
  
  