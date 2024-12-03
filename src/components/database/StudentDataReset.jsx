import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { UserX } from 'lucide-react';
import { toast } from 'sonner';
import DatabaseConfirmationModal from './DatabaseConfirmationModal';

export default function StudentDataReset() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isPurging, setIsPurging] = useState(false);
  const [verificationText, setVerificationText] = useState('');
  const [showFinalConfirmation, setShowFinalConfirmation] = useState(false);

  const VERIFICATION_PHRASE = "PURGE ALL STUDENT DATA";

  const handlePurge = async () => {
    try {
      setIsPurging(true);

      // Delete all related records first (due to foreign key constraints)
      const { error: matchesError } = await supabase
        .from('matches')
        .delete()
        .not('id', 'is', null); // Changed from neq.0

      if (matchesError) throw matchesError;

      const { error: attendanceError } = await supabase
        .from('attendance_records')
        .delete()
        .not('id', 'is', null);

      if (attendanceError) throw attendanceError;

      // Finally, delete all students
      const { error: studentsError } = await supabase
        .from('students')
        .delete()
        .not('id', 'is', null);

      if (studentsError) throw studentsError;

      toast.success('All student data has been permanently deleted');
      handleModalClose();
    } catch (error) {
      console.error('Error purging student data:', error);
      toast.error('Failed to purge student data: ' + error.message);
    } finally {
      setIsPurging(false);
    }
  };

  const handleModalClose = () => {
    setIsModalOpen(false);
    setShowFinalConfirmation(false);
    setVerificationText('');
  };

  return (
    <div className="bg-white shadow rounded-lg p-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-medium text-gray-900">Student Data</h2>
          <p className="mt-1 text-sm text-gray-500">
            Permanently delete all student records and related data
          </p>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
        >
          <UserX className="h-4 w-4 mr-2" />
          Purge Student Data
        </button>
      </div>

      {/* Verification Modal */}
      <DatabaseConfirmationModal
        isOpen={isModalOpen && !showFinalConfirmation}
        icon={UserX}
        iconColor="text-red-600"
        iconBgColor="bg-red-100"
        title="Verify Student Data Purge"
        description={`Type "${VERIFICATION_PHRASE}" to proceed with deletion:`}
        confirmButtonText="Verify"
        confirmButtonColor="bg-red-600 hover:bg-red-700 focus:ring-red-500"
        onConfirm={() => {
          if (verificationText === VERIFICATION_PHRASE) {
            setShowFinalConfirmation(true);
          } else {
            toast.error('Verification phrase does not match');
          }
        }}
        onCancel={handleModalClose}
      >
        <input
          type="text"
          value={verificationText}
          onChange={(e) => setVerificationText(e.target.value)}
          className="mt-4 block w-full rounded-md border-gray-300 shadow-sm focus:border-red-500 focus:ring-red-500"
          placeholder="Type verification phrase"
        />
      </DatabaseConfirmationModal>

      {/* Final Confirmation Modal */}
      <DatabaseConfirmationModal
        isOpen={showFinalConfirmation}
        icon={UserX}
        iconColor="text-red-600"
        iconBgColor="bg-red-100"
        title="Final Warning"
        description="You are about to permanently delete all student data. This includes:"
        confirmButtonText="Purge All Data"
        confirmButtonColor="bg-red-600 hover:bg-red-700 focus:ring-red-500"
        isProcessing={isPurging}
        processingText="Purging Data..."
        onConfirm={handlePurge}
        onCancel={handleModalClose}
      >
        <ul className="mt-2 text-sm text-gray-500 list-disc list-inside">
          <li>All student records</li>
          <li>All attendance history</li>
          <li>All tournament matches and achievements</li>
          <li>All related contact information</li>
        </ul>
        <p className="mt-2 text-sm text-red-600 font-medium">
          This action cannot be undone.
        </p>
      </DatabaseConfirmationModal>
    </div>
  );
}