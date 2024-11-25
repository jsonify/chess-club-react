// src/components/registration/EmailInput.jsx
export default function EmailInput({ 
  name, 
  label, 
  required = false, 
  value, 
  onChange,
  error
}) {
  // Validate email as user types
  const validateEmail = (email) => {
    // Basic email regex pattern
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    
    // Additional validation rules
    const hasValidDomain = email.split('@')[1]?.includes('.');
    const hasValidLength = email.length >= 5 && email.length <= 254;
    const hasValidCharacters = /^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/.test(email);
    
    return emailRegex.test(email) && hasValidDomain && hasValidLength && hasValidCharacters;
  };

  // Get validation state
  const isValid = value ? validateEmail(value) : true;
  const showError = error || (value && !isValid);

  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">
        {label}{required && '*'}
      </label>
      <div className="relative">
        <input
          type="email"
          name={name}
          value={value}
          onChange={onChange}
          required={required}
          placeholder="example@email.com"
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
          {error || 'Please enter a valid email address'}
        </p>
      )}
    </div>
  );
}