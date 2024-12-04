import { AlertTriangle } from 'lucide-react';

export default function DangerZone({ children }) {
  return (
    <div className="mt-10">
      <div className="flex items-center gap-2 mb-4">
        <AlertTriangle className="h-5 w-5 text-red-600" />
        <h2 className="text-lg font-medium text-gray-900">Danger Zone</h2>
      </div>
      <div className="border-2 border-red-200 rounded-lg divide-y divide-red-200">
        {children}
      </div>
    </div>
  );
}