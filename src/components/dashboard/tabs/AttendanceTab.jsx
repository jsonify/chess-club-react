// src/components/tabs/AttendanceTab.jsx
import { Search, CheckCircle, Loader2, ChevronUp, ChevronDown, Wifi, WifiOff } from 'lucide-react';
import { formatDate, getNextWednesday, isWednesday } from '@/lib/utils';
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';
import { Wifi, WifiOff } from 'lucide-react';

export default function AttendanceTab({
  students,
  attendance,
  searchQuery,
  setSearchQuery,
  toggleAttendance,
  loading,
  connectionStatus
}) {
  const [sortConfig, setSortConfig] = useState({
    key: 'last_name',
    direction: 'asc'
  });
  const [isConnected, setIsConnected] = useState(true);
  
  const ConnectionStatus = () => (
    <div className="flex items-center gap-2">
      {connectionStatus.isConnected ? (
        <Wifi 
          className="h-5 w-5 text-green-500" 
          title="Real-time updates connected"
        />
      ) : (
        <div className="flex items-center gap-2">
          <WifiOff 
            className="h-5 w-5 text-red-500" 
            title={`Connection lost: ${connectionStatus.lastError}`}
          />
          {connectionStatus.reconnectAttempts > 0 && (
            <span className="text-xs text-red-500">
              Reconnecting... ({connectionStatus.reconnectAttempts})
            </span>
          )}
        </div>
      )}
    </div>
  );

  // Set up real-time subscription
  useEffect(() => {
    const channel = supabase
      .channel('attendance-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'attendance_records'
        },
        (payload) => {
          console.log('Received real-time update:', payload);
          // The parent component (ChessClubDashboard) should handle the attendance state updates
          // This subscription is mainly for connection status
        }
      )
      .subscribe((status) => {
        console.log('Subscription status:', status);
        setIsConnected(status === 'SUBSCRIBED');
        if (status === 'SUBSCRIBED') {
          toast.success('Real-time updates connected');
        } else if (status === 'CLOSED') {
          toast.error('Real-time updates disconnected');
        }
      });

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

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

  const targetDate = isWednesday(new Date()) ? new Date() : getNextWednesday();
  const displayDate = formatDate(targetDate);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
      </div>
    );
  }

  const sortedStudents = [...students].sort((a, b) => {
    if (sortConfig.key === 'first_name') {
      return sortConfig.direction === 'asc'
        ? a.first_name.localeCompare(b.first_name)
        : b.first_name.localeCompare(a.first_name);
    }
    // Default to last_name
    return sortConfig.direction === 'asc'
      ? a.last_name.localeCompare(b.last_name)
      : b.last_name.localeCompare(a.last_name);
  });

  const filteredStudents = sortedStudents.filter(student =>
    student.first_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    student.last_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    student.teacher?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="bg-white rounded-lg shadow">
      <div className="p-4 border-b border-gray-200">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-medium">
                {isWednesday(new Date())
                  ? "Today's Attendance"
                  : "Next Wednesday's Attendance"} ({displayDate})
              </h2>
              <ConnectionStatus />
            </div>
            <div className="flex items-center gap-4 mt-2">
              <p className="text-sm text-gray-500">
                Active Students: {students.length}
              </p>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => requestSort('first_name')}
                  className="text-sm text-gray-500 flex items-center gap-1 hover:text-gray-700"
                >
                  First Name
                  <SortIcon columnKey="first_name" />
                </button>
                <button
                  onClick={() => requestSort('last_name')}
                  className="text-sm text-gray-500 flex items-center gap-1 hover:text-gray-700"
                >
                  Last Name
                  <SortIcon columnKey="last_name" />
                </button>
              </div>
            </div>
          </div>
          <div className="relative w-full sm:w-auto">
            <input
              type="text"
              placeholder="Search by name or teacher..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <Search className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
          </div>
        </div>
      </div>

      <div className="divide-y">
        {filteredStudents.length === 0 ? (
          <div className="p-4 text-center text-gray-500">
            {searchQuery 
              ? 'No students found matching your search'
              : 'No active students found'}
          </div>
        ) : (
          filteredStudents.map(student => (
            <div
              key={student.id}
              className={`flex items-center justify-between p-4 hover:bg-gray-50 ${
                attendance[student.id]?.checkedIn ? 'bg-blue-50' : ''
              }`}
            >
              <div>
                <div className="font-medium text-gray-900">
                  {student.first_name} {student.last_name}
                </div>
                <div className="text-sm text-gray-500">
                  Grade {student.grade} - {student.teacher}
                </div>
              </div>
              <div className="flex items-center space-x-4">
                <button
                  onClick={() => toggleAttendance(student.id, 'checkin')}
                  className={`flex items-center space-x-1 px-3 py-1 rounded-md transition-colors ${
                    attendance[student.id]?.checkedIn
                      ? 'bg-green-100 text-green-700'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  <CheckCircle className="h-4 w-4" />
                  <span>In</span>
                </button>
                <button
                  onClick={() => toggleAttendance(student.id, 'checkout')}
                  className={`flex items-center space-x-1 px-3 py-1 rounded-md transition-colors ${
                    attendance[student.id]?.checkedOut
                      ? 'bg-green-100 text-green-700'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                  disabled={!attendance[student.id]?.checkedIn}
                >
                  <CheckCircle className="h-4 w-4" />
                  <span>Out</span>
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}