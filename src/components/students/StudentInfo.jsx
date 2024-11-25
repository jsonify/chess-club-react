// src/components/registration/StudentInfo.jsx
import FormInput from '@/components/registration/FormInput';
import FormSelect from '@/components/registration/FormSelect';

export function StudentInfo({ formData, handleChange, errors }) {
    const TEACHERS = [
      'Unruh', 'Alderson', 'Otterlee', 'Chapin', 'Larson',
      'Wildenhaus', 'Parsons', 'Pawling', 'Gregerson', 'Mindt',
      'Hanson', 'DeLoma', 'Holt', 'Chase', 'Bonnell'
    ].sort();
  
    return (
      <div className="bg-white p-6 rounded-lg shadow">
        <h2 className="text-lg font-semibold mb-4">Student Information</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormInput
            name="first_name"
            label="First Name"
            required
            value={formData.first_name}
            onChange={handleChange}
            error={errors.first_name}
          />
          <FormInput
            name="last_name"
            label="Last Name"
            required
            value={formData.last_name}
            onChange={handleChange}
            error={errors.last_name}
          />
          <FormSelect
            name="grade"
            label="Grade"
            options={['2', '3', '4', '5', '6']}
            required
            value={formData.grade}
            onChange={handleChange}
          />
          <FormSelect
            name="teacher"
            label="Teacher"
            options={TEACHERS}
            required
            value={formData.teacher}
            onChange={handleChange}
          />
        </div>
      </div>
    );
  }
  
  