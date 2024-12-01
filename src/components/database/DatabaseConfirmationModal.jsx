// src/components/database/DatabaseConfirmationModal.jsx
import { Loader2 } from 'lucide-react';

export default function DatabaseConfirmationModal({ 
  isOpen,
  icon: Icon,
  iconColor = "text-red-600",
  iconBgColor = "bg-red-100",
  title,
  description,
  children,
  confirmButtonText = "Confirm",
  isProcessing = false,
  processingText = "Processing...",
  onConfirm,
  onCancel,
  confirmButtonColor = "bg-red-600 hover:bg-red-700 focus:ring-red-500",
}) {
  if (!isOpen) return null;

  return (
    <div className="fixed z-50 inset-0 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
        <div 
          className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity"
          onClick={onCancel}
        />

        <div className="inline-block align-bottom bg-white rounded-lg px-4 pt-5 pb-4 text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full sm:p-6">
          <div className="sm:flex sm:items-start">
            {Icon && (
              <div className={`mx-auto flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full ${iconBgColor} sm:mx-0 sm:h-10 sm:w-10`}>
                <Icon className={`h-6 w-6 ${iconColor}`} />
              </div>
            )}
            <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left w-full">
              <h3 className="text-lg leading-6 font-medium text-gray-900">
                {title}
              </h3>
              {description && (
                <div className="mt-2">
                  <p className="text-sm text-gray-500">{description}</p>
                </div>
              )}
              {children}
            </div>
          </div>

          <div className="mt-5 sm:mt-4 sm:flex sm:flex-row-reverse">
            <button
              type="button"
              disabled={isProcessing}
              onClick={onConfirm}
              className={`w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 text-base font-medium text-white ${confirmButtonColor} sm:ml-3 sm:w-auto sm:text-sm disabled:opacity-50`}
            >
              {isProcessing ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  {processingText}
                </>
              ) : (
                confirmButtonText
              )}
            </button>
            <button
              type="button"
              disabled={isProcessing}
              onClick={onCancel}
              className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:mt-0 sm:w-auto sm:text-sm disabled:opacity-50"
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}