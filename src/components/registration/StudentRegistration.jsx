import { useState } from 'react';
import { createClient } from '@supabase/supabase-js';
import { StudentInfo } from '@/components/students/StudentInfo';
import { ContactInfo } from './ContactInfo';
import { formatPhoneNumber, validatePhoneNumber, validateEmail } from '@/lib/validationUtils';

const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY
);

export default function StudentRegistration() {
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState(null);
  const [errors, setErrors] = useState({});
  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    grade: '',
    teacher: '',
    contact1_name: '',
    contact1_phone: '',
    contact1_relationship: '',
    contact1_email: '',
    contact2_name: '',
    contact2_phone: '',
    contact2_relationship: '',
    contact2_email: ''
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    
    // Clear error when field is edited
    setErrors(prev => ({
      ...prev,
      [name]: undefined
    }));

    // Handle phone number formatting
    if (name.includes('phone')) {
      setFormData(prev => ({
        ...prev,
        [name]: formatPhoneNumber(value)
      }));
      return;
    }

    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const validateForm = () => {
    const newErrors = {};

    // Required fields validation
    const requiredFields = [
      'first_name',
      'last_name',
      'grade',
      'teacher',
      'contact1_name',
      'contact1_phone',
      'contact1_relationship',
      'contact1_email'
    ];

    requiredFields.forEach(field => {
      if (!formData[field]) {
        newErrors[field] = 'This field is required';
      }
    });

    // Primary contact validations
    if (formData.contact1_phone && !validatePhoneNumber(formData.contact1_phone)) {
      newErrors.contact1_phone = 'Please enter a valid 10-digit phone number';
    }

    if (formData.contact1_email && !validateEmail(formData.contact1_email)) {
      newErrors.contact1_email = 'Please enter a valid email address';
    }

    // Secondary contact validations (only if any field is filled)
    const hasSecondaryContact = formData.contact2_name || 
                               formData.contact2_phone || 
                               formData.contact2_email || 
                               formData.contact2_relationship;

    if (hasSecondaryContact) {
      if (!formData.contact2_name) {
        newErrors.contact2_name = 'Name is required if adding a secondary contact';
      }
      if (!formData.contact2_relationship) {
        newErrors.contact2_relationship = 'Relationship is required if adding a secondary contact';
      }
      if (formData.contact2_phone && !validatePhoneNumber(formData.contact2_phone)) {
        newErrors.contact2_phone = 'Please enter a valid 10-digit phone number';
      }
      if (formData.contact2_email && !validateEmail(formData.contact2_email)) {
        newErrors.contact2_email = 'Please enter a valid email address';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      setMessage({
        type: 'error',
        text: 'Please correct the errors before submitting'
      });
      // Scroll to the first error
      const firstError = document.querySelector('.text-red-600');
      if (firstError) {
        firstError.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
      return;
    }
  
    setLoading(true);
    setMessage(null);
  
    try {
      // Prepare the data for submission
      const submissionData = {
        first_name: formData.first_name,
        last_name: formData.last_name,
        grade: formData.grade,
        teacher: formData.teacher,
        contact1_name: formData.contact1_name,
        contact1_phone: formData.contact1_phone.replace(/\D/g, ''),
        contact1_email: formData.contact1_email,
        contact1_relationship: formData.contact1_relationship,
        // Handle optional fields
        contact2_name: formData.contact2_name || null,
        contact2_phone: formData.contact2_phone ? formData.contact2_phone.replace(/\D/g, '') : null,
        contact2_email: formData.contact2_email || null,
        contact2_relationship: formData.contact2_relationship || null,
        // Set active status
        active: true
      };
  
      const { error } = await supabase
        .from('students')
        .insert([submissionData]);
  
      if (error) throw error;
  
      setMessage({
        type: 'success',
        text: `Successfully registered ${formData.first_name} ${formData.last_name}`
      });
  
      // Clear form
      setFormData({
        first_name: '',
        last_name: '',
        grade: '',
        teacher: '',
        contact1_name: '',
        contact1_phone: '',
        contact1_relationship: '',
        contact1_email: '',
        contact2_name: '',
        contact2_phone: '',
        contact2_relationship: '',
        contact2_email: ''
      });
  
      // Scroll to top to show success message
      window.scrollTo({ top: 0, behavior: 'smooth' });
  
    } catch (error) {
      setMessage({
        type: 'error',
        text: error.message
      });
      console.error('Registration error:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-6">
      {/* <h1 className="text-2xl font-bold mb-6">Chess Club Registration</h1> */}

      {message && (
        <div 
          className={`p-4 mb-6 rounded-md ${
            message.type === 'success' 
              ? 'bg-green-50 text-green-800 border border-green-200' 
              : 'bg-red-50 text-red-800 border border-red-200'
          }`}
        >
          {message.text}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        <StudentInfo 
          formData={formData} 
          handleChange={handleChange} 
          errors={errors} 
        />
        
        <ContactInfo 
          formData={formData} 
          handleChange={handleChange} 
          errors={errors}
          contactNum={1}
          required={true}
        />
        
        <ContactInfo 
          formData={formData} 
          handleChange={handleChange} 
          errors={errors}
          contactNum={2}
          required={false}
        />

        <button
          type="submit"
          disabled={loading}
          className={`w-full py-3 px-4 rounded-md text-white font-medium
            ${loading 
              ? 'bg-blue-300 cursor-not-allowed' 
              : 'bg-blue-600 hover:bg-blue-700 active:bg-blue-800 transition-colors'
            }`}
        >
          {loading ? (
            <span className="flex items-center justify-center">
              <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Registering...
            </span>
          ) : (
            'Register Student'
          )}
        </button>
      </form>
    </div>
  );
}