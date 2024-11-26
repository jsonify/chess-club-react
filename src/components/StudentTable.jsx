// src/components/StudentTable.jsx
import { useState } from 'react';
import { ChevronDown, ChevronUp, Search, X, Phone, Mail, Loader2 } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';

export default function StudentTable({ students: initialStudents }) {
  const [students, setStudents] = useState(initialStudents);
  const [sortConfig, setSortConfig] = useState({
    key: 'last_name',
    direction: 'asc'
  });
  const [searchTerm, setSearchTerm] = useState('');
  const [filterGrade, setFilterGrade] = useState('all');
  const [showInactive, setShowInactive] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [updatingStatus, setUpdatingStatus] = useState(null);

  // Function to toggle student active status
  const toggleStudentStatus = async (studentId, currentStatus) => {
    try {
      setUpdatingStatus(studentId);
      
      const { data, error } = await supabase
        .from('students')
        .update({ active: !currentStatus })
        .eq('id', studentId)
        .select()
        .single();

      if (error) throw error;

      // Update local state
      setStudents(prevStudents =>
        prevStudents.map(student =>
          student.id === studentId 
            ? { ...student, active: !currentStatus }
            : student
        )
      );

      toast.success(`Student ${data.active ? 'activated' : 'deactivated'} successfully`);
    } catch (error) {
      console.error('Error updating student status:', error);
      toast.error('Failed to update student status');
    } finally {
      setUpdatingStatus(null);
    }
  };

  // Sort function
  const sortedStudents = [...students].sort((a, b) => {
    if (sortConfig.key === 'name') {
      const nameA = `${a.last_name}, ${a.first_name}`.toLowerCase();
      const nameB = `${b.last_name}, ${b.first_name}`.toLowerCase();
      return sortConfig.direction === 'asc' 
        ? nameA.localeCompare(nameB)
        : nameB.localeCompare(nameA);
    }
    
    if (a[sortConfig.key] < b[sortConfig.key]) {
      return sortConfig.direction === 'asc' ? -1 : 1;
    }
    if (a[sortConfig.key] > b[sortConfig.key]) {
      return sortConfig.direction === 'asc' ? 1 : -1;
    }
    return 0;
  });

  // Filter function
  const filteredStudents = sortedStudents.filter(student => {
    const matchesSearch = (
      student.first_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      student.last_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      student.teacher?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      student.contact1_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      student.contact2_name?.toLowerCase().includes(searchTerm.toLowerCase())
    );
    const matchesGrade = filterGrade === 'all' || student.grade.toString() === filterGrade;
    const matchesActive = showInactive || student.active;
    return matchesSearch && matchesGrade && matchesActive;
  });

  const requestSort = (key) => {
    setSortConfig(current => ({
      key,
      direction: 
        current.key === key && current.direction === 'asc' 
          ? 'desc' 
          : 'asc',
    }));
  };

  const SortIcon = ({ columnKey }) => {
    if (sortConfig.key !== columnKey) {
      return <ChevronDown className="h-4 w-4 text-gray-400" />;
    }
    return sortConfig.direction === 'asc' 
      ? <ChevronUp className="h-4 w-4 text-blue-500" />
      : <ChevronDown className="h-4 w-4 text-blue-500" />;
  };

  const ContactModal = ({ student, onClose }) => {
    if (!student) return null;

    return (
      <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4">
          {/* Modal Header */}
          <div className="border-b px-6 py-4 flex items-center justify-between">
            <h3 className="text-lg font-medium text-gray-900">
              Student Contact Information
            </h3>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-500"
            >
              <X className="h-6 w-6" />
            </button>
          </div>

          {/* Modal Content */}
          <div className="px-6 py-4">
            {/* Student Info */}
            <div className="mb-6">
              <h4 className="text-xl font-medium text-gray-900">
                {student.first_name} {student.last_name}
              </h4>
              <p className="text-sm text-gray-500">
                Grade {student.grade} - {student.teacher}
              </p>
            </div>

            {/* Primary Contact */}
            <div className="mb-6">
              <h5 className="text-sm font-medium text-gray-900 mb-2">
                Primary Contact
              </h5>
              <div className="bg-gray-50 rounded-lg p-4">
                <div className="font-medium">{student.contact1_name}</div>
                <div className="text-sm text-gray-500">{student.contact1_relationship}</div>
                <div className="mt-2 space-y-1">
                  <div className="flex items-center gap-2 text-sm">
                    <Phone className="h-4 w-4 text-gray-400" />
                    <a href={`tel:${student.contact1_phone}`} className="text-blue-600 hover:underline">
                      {student.contact1_phone}
                    </a>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <Mail className="h-4 w-4 text-gray-400" />
                    <a href={`mailto:${student.contact1_email}`} className="text-blue-600 hover:underline">
                      {student.contact1_email}
                    </a>
                  </div>
                </div>
              </div>
            </div>

            {/* Secondary Contact */}
            {student.contact2_name && (
              <div>
                <h5 className="text-sm font-medium text-gray-900 mb-2">
                  Secondary Contact
                </h5>
                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="font-medium">{student.contact2_name}</div>
                  <div className="text-sm text-gray-500">{student.contact2_relationship}</div>
                  <div className="mt-2 space-y-1">
                    {student.contact2_phone && (
                      <div className="flex items-center gap-2 text-sm">
                        <Phone className="h-4 w-4 text-gray-400" />
                        <a href={`tel:${student.contact2_phone}`} className="text-blue-600 hover:underline">
                          {student.contact2_phone}
                        </a>
                      </div>
                    )}
                    {student.contact2_email && (
                      <div className="flex items-center gap-2 text-sm">
                        <Mail className="h-4 w-4 text-gray-400" />
                        <a href={`mailto:${student.contact2_email}`} className="text-blue-600 hover:underline">
                          {student.contact2_email}
                        </a>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Modal Footer */}
          <div className="border-t px-6 py-4">
            <button
              onClick={onClose}
              className="w-full bg-gray-100 text-gray-700 py-2 px-4 rounded-md hover:bg-gray-200 transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="bg-white rounded-lg shadow">
      <div className="p-4 border-b border-gray-200">
        <div className="flex flex-col sm:flex-row gap-4 justify-between">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search students..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9 pr-4 py-2 border rounded-lg w-full sm:w-64"
            />
          </div>
          <div className="flex gap-4">
            <select
              value={filterGrade}
              onChange={(e) => setFilterGrade(e.target.value)}
              className="border rounded-lg px-3 py-2"
            >
              <option value="all">All Grades</option>
              {[2, 3, 4, 5, 6].map(grade => (
                <option key={grade} value={grade.toString()}>
                  Grade {grade}
                </option>
              ))}
            </select>
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={showInactive}
                onChange={(e) => setShowInactive(e.target.checked)}
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <span className="text-sm text-gray-600">Show Inactive</span>
            </label>
          </div>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th 
                scope="col"
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                onClick={() => requestSort('name')}
              >
                <div className="flex items-center gap-1">
                  Name
                  <SortIcon columnKey="name" />
                </div>
              </th>
              <th 
                scope="col"
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                onClick={() => requestSort('grade')}
              >
                <div className="flex items-center gap-1">
                  Grade
                  <SortIcon columnKey="grade" />
                </div>
              </th>
              <th 
                scope="col"
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                onClick={() => requestSort('teacher')}
              >
                <div className="flex items-center gap-1">
                  Teacher
                  <SortIcon columnKey="teacher" />
                </div>
              </th>
              <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                Status
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {filteredStudents.map((student) => (
              <tr 
                key={student.id} 
                className="hover:bg-gray-50"
              >
                <td 
                  className="px-6 py-4 whitespace-nowrap cursor-pointer"
                  onClick={() => setSelectedStudent(student)}
                >
                  <div className="text-sm font-medium text-gray-900">
                    {student.last_name}, {student.first_name}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-900">{student.grade}</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-900">{student.teacher}</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right">
                  <button
                    onClick={() => toggleStudentStatus(student.id, student.active)}
                    disabled={updatingStatus === student.id}
                    className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      student.active
                        ? 'bg-green-100 text-green-800 hover:bg-green-200'
                        : 'bg-gray-100 text-gray-800 hover:bg-gray-200'
                    }`}
                  >
                    {updatingStatus === student.id ? (
                      <Loader2 className="h-3 w-3 animate-spin" />
                    ) : (
                      student.active ? 'Active' : 'Inactive'
                    )}
                  </button>
                </td>
              </tr>
            ))}
            {filteredStudents.length === 0 && (
              <tr>
                <td colSpan="4" className="px-6 py-4 text-center text-gray-500">
                  No students found
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {selectedStudent && (
        <ContactModal 
          student={selectedStudent} 
          onClose={() => setSelectedStudent(null)} 
        />
      )}
    </div>
  );
}