// src/components/registration/ContactInfo.jsx
import FormInput from './FormInput';
import FormSelect from './FormSelect';
import EmailInput from './EmailInput';
import PhoneInput from './PhoneInput';

export function ContactInfo({ 
    formData, 
    handleChange, 
    errors, 
    contactNum, 
    required = false 
  }) {
    const RELATIONSHIPS = ['Mom', 'Dad', 'Guardian', 'Other'];
    const prefix = `contact${contactNum}`;
  
    return (
      <div className="bg-white p-6 rounded-lg shadow">
        <h2 className="text-lg font-semibold mb-4">
          {contactNum === 1 ? 'Primary Contact' : 'Secondary Contact (Optional)'}
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormInput
            name={`${prefix}_name`}
            label="Name"
            required={required}
            value={formData[`${prefix}_name`]}
            onChange={handleChange}
            error={errors[`${prefix}_name`]}
          />
          <PhoneInput
            name={`${prefix}_phone`}
            label="Phone"
            required={required}
            value={formData[`${prefix}_phone`]}
            onChange={handleChange}
            error={errors[`${prefix}_phone`]}
          />
          <FormSelect
            name={`${prefix}_relationship`}
            label="Relationship"
            options={RELATIONSHIPS}
            required={required}
            value={formData[`${prefix}_relationship`]}
            onChange={handleChange}
          />
          <EmailInput
            name={`${prefix}_email`}
            label="Email"
            required={required}
            value={formData[`${prefix}_email`]}
            onChange={handleChange}
            error={errors[`${prefix}_email`]}
          />
        </div>
      </div>
    );
  }