import { useState } from "react";
import { ChevronDown, ChevronUp, Search } from "lucide-react";
import StudentDetailModal from "./students/StudentDetailModal";

export default function StudentTable({
  students: initialStudents,
  loading,
  error,
}) {
  const [searchTerm, setSearchTerm] = useState("");
  const [filterGrade, setFilterGrade] = useState("all");
  const [filterStatus, setFilterStatus] = useState("all");
  const [sortConfig, setSortConfig] = useState({
    key: "first_name",
    direction: "asc",
  });
  const [students, setStudents] = useState(initialStudents);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Filter function
  const filteredStudents = students.filter((student) => {
    const matchesSearch =
      student.first_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      student.last_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      student.teacher?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesGrade =
      filterGrade === "all" || student.grade.toString() === filterGrade;
    const matchesStatus =
      filterStatus === "all" ||
      (filterStatus === "active" && student.active) ||
      (filterStatus === "inactive" && !student.active);

    return matchesSearch && matchesGrade && matchesStatus;
  });

  // Sort function
  const sortedStudents = [...filteredStudents].sort((a, b) => {
    const direction = sortConfig.direction === "asc" ? 1 : -1;

    switch (sortConfig.key) {
      case "first_name":
        return direction * a.first_name.localeCompare(b.first_name);
      case "last_name":
        return direction * a.last_name.localeCompare(b.last_name);
      case "grade":
        return direction * (a.grade - b.grade);
      case "teacher":
        return direction * a.teacher.localeCompare(b.teacher);
      case "status":
        return direction * (a.active === b.active ? 0 : a.active ? -1 : 1);
      default:
        return 0;
    }
  });

  const requestSort = (key) => {
    setSortConfig((current) => ({
      key,
      direction:
        current.key === key && current.direction === "asc" ? "desc" : "asc",
    }));
  };

  const handleRowClick = (student) => {
    setSelectedStudent(student);
    setIsModalOpen(true);
  };

  const handleDeleteStudent = (studentId) => {
    setStudents((prev) => prev.filter((student) => student.id !== studentId));
  };

  const SortIcon = ({ columnKey }) => {
    if (sortConfig.key !== columnKey) {
      return <ChevronDown className="inline h-4 w-4 text-gray-400" />;
    }
    return sortConfig.direction === "asc" ? (
      <ChevronUp className="inline h-4 w-4 text-gray-700" />
    ) : (
      <ChevronDown className="inline h-4 w-4 text-gray-700" />
    );
  };

  return (
    <>
      <div className="bg-white shadow rounded-lg">
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
            <div className="flex flex-wrap gap-4">
              <select
                value={filterGrade}
                onChange={(e) => setFilterGrade(e.target.value)}
                className="border rounded-lg px-3 py-2"
              >
                <option value="all">All Grades</option>
                {[2, 3, 4, 5, 6].map((grade) => (
                  <option key={grade} value={grade.toString()}>
                    Grade {grade}
                  </option>
                ))}
              </select>
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="border rounded-lg px-3 py-2"
              >
                <option value="all">All Statuses</option>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
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
                  onClick={() => requestSort("first_name")}
                >
                  First Name <SortIcon columnKey="first_name" />
                </th>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                  onClick={() => requestSort("last_name")}
                >
                  Last Name <SortIcon columnKey="last_name" />
                </th>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                  onClick={() => requestSort("grade")}
                >
                  Grade <SortIcon columnKey="grade" />
                </th>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                  onClick={() => requestSort("teacher")}
                >
                  Teacher <SortIcon columnKey="teacher" />
                </th>
                <th
                  scope="col"
                  className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                  onClick={() => requestSort("status")}
                >
                  Status <SortIcon columnKey="status" />
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {sortedStudents.length > 0 ? (
                sortedStudents.map((student) => (
                  <tr
                    key={student.id}
                    className="hover:bg-gray-50 cursor-pointer"
                    onClick={() => handleRowClick(student)}
                  >
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        {student.first_name}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        {student.last_name}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {student.grade}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {student.teacher}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right">
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          student.active
                            ? "bg-green-100 text-green-800"
                            : "bg-gray-100 text-gray-800"
                        }`}
                      >
                        {student.active ? "Active" : "Inactive"}
                      </span>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td
                    colSpan="5"
                    className="px-6 py-4 text-center text-gray-500"
                  >
                    No students found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Student Detail Modal */}
      <StudentDetailModal
        student={selectedStudent}
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setSelectedStudent(null);
        }}
        onDelete={handleDeleteStudent}
      />
    </>
  );
}
