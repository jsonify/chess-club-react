// src/components/StudentDetailModal.jsx
import { useState } from 'react';
import { X, Trash2, Loader2, Mail, Phone, User, GraduationCap, School } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/lib/supabase';

export default function StudentDetailModal({ student, isOpen, onClose, onDelete }) {
  const [isDeleting, setIsDeleting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  if (!isOpen || !student) return null;

  const handleDelete = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    
    try {
      setIsDeleting(true);
      console.log('Starting deletion process for student:', student.id);

      // 1. Delete attendance records first
      const { error: attendanceError } = await supabase
        .from('attendance_records')
        .delete()
        .eq('student_id', student.id);

      if (attendanceError) throw attendanceError;

      // 2. Delete any tournament matches
      const { error: matchesError } = await supabase
        .from('matches')
        .delete()
        .or(`player1_id.eq.${student.id},player2_id.eq.${student.id}`);

      if (matchesError) throw matchesError;

      // 3. Finally delete the student
      const { error: studentError } = await supabase
        .from('students')
        .delete()
        .eq('id', student.id);

      if (studentError) throw studentError;

      toast.success('Student deleted successfully');
      onDelete(student.id);
      onClose();
      
    } catch (error) {
      console.error('Delete operation failed:', error);
      toast.error(`Failed to delete student: ${error.message}`);
    } finally {
      setIsDeleting(false);
      setShowDeleteConfirm(false);
    }
  };

  const ContactSection = ({ title, name, phone, email, relationship }) => {
    if (!name && !phone && !email) return null;
    
    return (
      <div className="border-t border-gray-200 pt-4 mt-4">
        <h4 className="text-sm font-medium text-gray-900 mb-3">{title}</h4>
        <div className="space-y-2">
          {name && (
            <div className="flex items-center gap-2">
              <User className="h-4 w-4 text-gray-400" />
              <p className="text-sm text-gray-900">{name}</p>
            </div>
          )}
          {relationship && (
            <p className="text-sm text-gray-500 ml-6">({relationship})</p>
          )}
          {phone && (
            <div className="flex items-center gap-2">
              <Phone className="h-4 w-4 text-gray-400" />
              <a 
                href={`tel:${phone}`}
                className="text-sm text-blue-600 hover:text-blue-800"
              >
                {phone}
              </a>
            </div>
          )}
          {email && (
            <div className="flex items-center gap-2">
              <Mail className="h-4 w-4 text-gray-400" />
              <a 
                href={`mailto:${email}`}
                className="text-sm text-blue-600 hover:text-blue-800"
              >
                {email}
              </a>
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex min-h-screen items-center justify-center p-4 text-center">
        <div 
          className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity"
          onClick={() => !isDeleting && onClose()}
        />

        <div className="relative transform overflow-hidden rounded-lg bg-white text-left shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-lg">
          {/* Modal Header */}
          <div className="px-4 py-4 sm:px-6 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-medium text-gray-900">
                Student Details
              </h3>
              {!isDeleting && (
                <button
                  onClick={onClose}
                  className="rounded-md text-gray-400 hover:text-gray-500 focus:outline-none"
                >
                  <X className="h-6 w-6" />
                </button>
              )}
            </div>
          </div>

          {/* Student Information */}
          <div className="px-4 py-5 sm:p-6">
            <div className="space-y-4">
              {/* Basic Information */}
              <div>
                <h4 className="text-sm font-medium text-gray-900 mb-3">Basic Information</h4>
                <div className="grid grid-cols-2 gap-4">
                  <div className="flex items-center gap-2">
                    <User className="h-4 w-4 text-gray-400" />
                    <div>
                      <p className="text-sm text-gray-900">
                        {student.first_name} {student.last_name}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <GraduationCap className="h-4 w-4 text-gray-400" />
                    <div>
                      <p className="text-sm text-gray-900">Grade {student.grade}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <School className="h-4 w-4 text-gray-400" />
                    <div>
                      <p className="text-sm text-gray-900">{student.teacher}</p>
                    </div>
                  </div>
                  <div>
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      student.active
                        ? 'bg-green-100 text-green-800'
                        : 'bg-gray-100 text-gray-800'
                    }`}>
                      {student.active ? 'Active' : 'Inactive'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Contact Information */}
              <ContactSection
                title="Primary Contact"
                name={student.contact1_name}
                phone={student.contact1_phone}
                email={student.contact1_email}
                relationship={student.contact1_relationship}
              />

              <ContactSection
                title="Secondary Contact"
                name={student.contact2_name}
                phone={student.contact2_phone}
                email={student.contact2_email}
                relationship={student.contact2_relationship}
              />

              {/* Additional Settings */}
              <div className="border-t border-gray-200 pt-4 mt-4">
                <h4 className="text-sm font-medium text-gray-900 mb-3">Additional Settings</h4>
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="self-release"
                    checked={student.self_release || false}
                    disabled
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <label htmlFor="self-release" className="text-sm text-gray-900">
                    Self Release Approved
                  </label>
                </div>
              </div>
            </div>
          </div>

          {/* Modal Footer */}
          <div className="bg-gray-50 px-4 py-3 sm:flex sm:flex-row-reverse sm:px-6">
            {showDeleteConfirm ? (
              <>
                <button
                  type="button"
                  className="inline-flex w-full justify-center rounded-md border border-transparent bg-red-600 px-4 py-2 text-base font-medium text-white shadow-sm hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 sm:ml-3 sm:w-auto sm:text-sm disabled:opacity-50"
                  onClick={handleDelete}
                  disabled={isDeleting}
                >
                  {isDeleting ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Deleting...
                    </>
                  ) : (
                    'Confirm Delete'
                  )}
                </button>
                {!isDeleting && (
                  <button
                    type="button"
                    className="mt-3 inline-flex w-full justify-center rounded-md border border-gray-300 bg-white px-4 py-2 text-base font-medium text-gray-700 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
                    onClick={() => setShowDeleteConfirm(false)}
                  >
                    Cancel
                  </button>
                )}
              </>
            ) : (
              <button
                type="button"
                className="inline-flex w-full justify-center rounded-md border border-transparent bg-red-600 px-4 py-2 text-base font-medium text-white shadow-sm hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 sm:ml-3 sm:w-auto sm:text-sm"
                onClick={() => setShowDeleteConfirm(true)}
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Delete Student
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}