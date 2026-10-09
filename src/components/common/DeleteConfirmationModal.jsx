import React, { useEffect } from 'react';
import { Trash2, AlertTriangle, Loader2 } from 'lucide-react';

/**
 * Reusable Confirmation Dialog for Complaint Deletion.
 * 
 * Complies with strict system requirements:
 * - Dialog text: "Are you sure you want to delete this complaint? This action cannot be undone."
 * - Actions: "Cancel" and "Confirm Delete"
 * - Does not delete anything if cancelled.
 * - Loading indicator during deletion to prevent duplicate requests.
 */
export const DeleteConfirmationModal = ({
  isOpen,
  onClose,
  onConfirm,
  complaint,
  isDeleting = false,
}) => {
  // Close on Escape key press
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && !isDeleting) {
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, isDeleting, onClose]);

  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-150"
      aria-modal="true"
      role="dialog"
      aria-labelledby="delete-dialog-title"
    >
      <div 
        className="relative bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 transform transition-all"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start gap-4">
          <div className="shrink-0 w-12 h-12 rounded-full bg-red-100 flex items-center justify-center text-red-600">
            <Trash2 className="w-6 h-6 text-red-600" />
          </div>

          <div className="flex-1">
            <h3 id="delete-dialog-title" className="text-lg font-bold text-slate-900">
              Delete Complaint
            </h3>
            <p className="mt-2 text-sm text-slate-600 leading-relaxed">
              Are you sure you want to delete this complaint? This action cannot be undone.
            </p>

            {complaint && (
              <div className="mt-4 p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs text-slate-600 space-y-1">
                <div className="flex items-center justify-between">
                  <span className="font-mono font-bold text-slate-700">{complaint.id}</span>
                  {complaint.severity && (
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-200 text-slate-700">
                      {complaint.severity}
                    </span>
                  )}
                </div>
                <div className="font-semibold text-slate-900 truncate">
                  {complaint.title || complaint.description}
                </div>
                {complaint.location && (
                  <div className="text-slate-500 truncate">
                    📍 {complaint.location}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        <div className="mt-6 flex flex-col-reverse sm:flex-row sm:justify-end gap-3 pt-4 border-t border-slate-100">
          <button
            type="button"
            onClick={onClose}
            disabled={isDeleting}
            className="w-full sm:w-auto px-4 py-2.5 border border-slate-300 rounded-lg text-sm font-semibold text-slate-700 bg-white hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-slate-400 disabled:opacity-50 transition-colors"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={isDeleting}
            className="w-full sm:w-auto px-5 py-2.5 bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 text-white rounded-lg text-sm font-bold shadow-sm disabled:opacity-50 transition-colors inline-flex items-center justify-center gap-2"
          >
            {isDeleting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Deleting...</span>
              </>
            ) : (
              <span>Confirm Delete</span>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default DeleteConfirmationModal;
