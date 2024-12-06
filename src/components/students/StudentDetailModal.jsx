// src/components/StudentDetailModal.jsx
import { useState, useEffect } from "react";
import {
  X,
  Trash2,
  Loader2,
  Mail,
  Phone,
  User,
  GraduationCap,
  School,
} from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/lib/supabase";

export default function StudentDetailModal({
  student,
  isOpen,
  onClose,
  onDelete,
}) {
  const [isDeleting, setIsDeleting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [notes, setNotes] = useState(student?.notes || "");
  const [isSavingNotes, setIsSavingNotes] = useState(false);

  useEffect(() => {
    setNotes(student?.notes || "");
  }, [student]);

  if (!isOpen || !student) return null;

  const handleSaveNotes = async () => {
    try {
      setIsSavingNotes(true);
      const timestamp = new Date().toLocaleString("en-US", {
        timeZone: "America/Los_Angeles",
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
        hour12: true,
      });

      const formattedNote = notes.trim()
        ? `[${timestamp}] ${notes}\n\n${student.notes || ""}`
        : student.notes || "";

      const { error } = await supabase
        .from("students")
        .update({ notes: formattedNote })
        .eq("id", student.id);

      if (error) throw error;
      setNotes(formattedNote);
      toast.success("Notes saved successfully");
    } catch (error) {
      console.error("Error saving notes:", error);
      toast.error("Failed to save notes");
    } finally {
      setIsSavingNotes(false);
    }
  };

  const handleDelete = async (e) => {
    e.preventDefault();
    e.stopPropagation();

    try {
      setIsDeleting(true);

      const { error: attendanceError } = await supabase
        .from("attendance_records")
        .delete()
        .eq("student_id", student.id);

      if (attendanceError) throw attendanceError;

      const { error: matchesError } = await supabase
        .from("matches")
        .delete()
        .or(`player1_id.eq.${student.id},player2_id.eq.${student.id}`);

      if (matchesError) throw matchesError;

      const { error: studentError } = await supabase
        .from("students")
        .delete()
        .eq("id", student.id);

      if (studentError) throw studentError;

      toast.success("Student deleted successfully");
      onDelete(student.id);
      onClose();
    } catch (error) {
      console.error("Delete operation failed:", error);
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
                <h4 className="text-sm font-medium text-gray-900 mb-3">
                  Basic Information
                </h4>
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
                      <p className="text-sm text-gray-900">
                        Grade {student.grade}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <School className="h-4 w-4 text-gray-400" />
                    <div>
                      <p className="text-sm text-gray-900">{student.teacher}</p>
                    </div>
                  </div>
                  <div>
                    <span
                      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        student.active
                          ? "bg-green-100 text-green-800"
                          : "bg-gray-100 text-gray-800"
                      }`}
                    >
                      {student.active ? "Active" : "Inactive"}
                    </span>
                  </div>
                </div>
              </div>

              {/* Notes Section */}
              <div className="border-t border-gray-200 pt-4 mt-4">
                <h4 className="text-sm font-medium text-gray-900 mb-3">
                  Notes
                </h4>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={4}
                  className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-sm text-red-600"
                  placeholder="Add notes about the student..."
                />
                <div className="mt-2 flex justify-end space-x-2">
                  <button
                    onClick={async () => {
                      try {
                        setIsSavingNotes(true);
                        const { error } = await supabase
                          .from("students")
                          .update({ notes: "" })
                          .eq("id", student.id);

                        if (error) throw error;
                        setNotes("");
                        toast.success("Notes cleared successfully");
                      } catch (error) {
                        console.error("Error clearing notes:", error);
                        toast.error("Failed to clear notes");
                      } finally {
                        setIsSavingNotes(false);
                      }
                    }}
                    disabled={isSavingNotes || !notes}
                    className="inline-flex items-center px-3 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-red-600 hover:bg-red-700 disabled:opacity-50"
                  >
                    Clear
                  </button>
                  <button
                    onClick={handleSaveNotes}
                    disabled={isSavingNotes}
                    className="inline-flex items-center px-3 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50"
                  >
                    {isSavingNotes ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Saving...
                      </>
                    ) : (
                      "Save Notes"
                    )}
                  </button>
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
                <h4 className="text-sm font-medium text-gray-900 mb-3">
                  Additional Settings
                </h4>
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="self-release"
                    checked={student.self_release || false}
                    disabled
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <label
                    htmlFor="self-release"
                    className="text-sm text-gray-900"
                  >
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
                    "Confirm Delete"
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
