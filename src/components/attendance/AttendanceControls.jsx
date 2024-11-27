// src/components/attendance/AttendanceControls.jsx
export function AttendanceControls({ currentStatus, onUpdateStatus }) {
    const statuses = ['present', 'absent', 'excused'];
  
    return (
      <div className="flex items-center space-x-2">
        {statuses.map(status => (
          <button
            key={status}
            onClick={() => onUpdateStatus(status)}
            className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${
              currentStatus === status
                ? 'bg-blue-100 text-blue-800'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            {status.charAt(0).toUpperCase() + status.slice(1)}
          </button>
        ))}
      </div>
    );
  }