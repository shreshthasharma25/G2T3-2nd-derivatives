import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Search, Filter, Clock, FileText, Trash2, CheckCircle2, AlertCircle } from 'lucide-react';
import { grievanceService } from '../../services/grievanceService';
import { grievanceCategories, grievanceStatuses } from '../../data/grievanceCategories';
import { useAuth } from '../../contexts/AuthContext';
import { DeleteConfirmationModal } from '../../components/common/DeleteConfirmationModal';
import * as Icons from 'lucide-react';

const MyGrievances = () => {
  const { user } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [grievances, setGrievances] = useState([]);

  // Deletion state
  const [complaintToDelete, setComplaintToDelete] = useState(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [feedback, setFeedback] = useState(null);

  useEffect(() => {
    if (user) {
      setGrievances(grievanceService.getGrievancesForCitizen(user.id));
    }
  }, [user]);

  // Auto-dismiss success notification
  useEffect(() => {
    if (feedback?.type === 'success') {
      const timer = setTimeout(() => setFeedback(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [feedback]);

  const handleOpenDelete = (complaint) => {
    setComplaintToDelete(complaint);
    setIsDeleteModalOpen(true);
  };

  const handleCloseDelete = () => {
    if (isDeleting) return;
    setIsDeleteModalOpen(false);
    setComplaintToDelete(null);
  };

  const handleConfirmDelete = async () => {
    if (!complaintToDelete || isDeleting) return;

    setIsDeleting(true);
    try {
      const result = await grievanceService.deleteGrievance(complaintToDelete.id, user);

      // Update UI immediately without requiring a manual page refresh
      setGrievances((prev) => prev.filter((g) => g.id !== complaintToDelete.id));

      setFeedback({
        type: 'success',
        text: result?.message || 'Complaint deleted successfully.',
      });
      setIsDeleteModalOpen(false);
      setComplaintToDelete(null);
    } catch (err) {
      setFeedback({
        type: 'error',
        text: err?.message || 'Failed to delete complaint. Please try again.',
      });
    } finally {
      setIsDeleting(false);
    }
  };

  const filteredGrievances = grievances.filter((g) => {
    const matchesSearch =
      g.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      g.title.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'ALL' || g.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">My Grievances</h1>
        <p className="text-gray-600 mt-2 text-lg">Track the status of your submitted civic issues.</p>
      </div>

      {/* Feedback Banner */}
      {feedback && (
        <div
          role="alert"
          className={`mb-6 p-4 rounded-xl border flex items-center justify-between animate-in fade-in duration-200 ${
            feedback.type === 'success'
              ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
              : 'bg-red-50 border-red-200 text-red-800'
          }`}
        >
          <div className="flex items-center gap-2 text-sm font-semibold">
            {feedback.type === 'success' ? (
              <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
            ) : (
              <AlertCircle className="w-5 h-5 text-red-600 shrink-0" />
            )}
            <span>{feedback.text}</span>
          </div>
          <button
            onClick={() => setFeedback(null)}
            className="text-xs font-bold uppercase tracking-wider hover:underline ml-4"
          >
            Dismiss
          </button>
        </div>
      )}

      {grievances.length === 0 ? (
        <div className="bg-white border border-gray-200 rounded-lg p-12 text-center shadow-sm">
          <div className="mx-auto w-16 h-16 bg-blue-50 rounded-full flex items-center justify-center mb-4">
            <FileText className="h-8 w-8 text-blue-600" />
          </div>
          <h2 className="text-xl font-bold text-gray-900 mb-2">No history found</h2>
          <p className="text-gray-600 mb-6 max-w-md mx-auto">
            You haven't submitted any grievances yet. Once you report an issue, it will appear here.
          </p>
          <Link
            to="/citizen/report-grievance"
            className="inline-flex items-center justify-center px-5 py-2.5 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-700 hover:bg-blue-800"
          >
            Report a Grievance
          </Link>
        </div>
      ) : (
        <>
          {/* Filters */}
          <div className="bg-white p-5 rounded-lg shadow-sm border border-gray-200 mb-6 flex flex-col sm:flex-row gap-4 justify-between items-center">
            <div className="relative w-full sm:w-96">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search className="h-5 w-5 text-gray-400" />
              </div>
              <input
                type="text"
                className="block w-full pl-10 pr-3 py-2.5 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                placeholder="Search by Reference ID or title"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto">
              <Filter className="h-5 w-5 text-gray-500" />
              <select
                className="block w-full sm:w-48 pl-3 pr-10 py-2.5 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
              >
                <option value="ALL">All Statuses</option>
                {Object.values(grievanceStatuses).map((status) => (
                  <option key={status.id} value={status.id.toUpperCase()}>
                    {status.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Grievances List */}
          <div className="bg-white shadow-sm border border-gray-200 rounded-lg overflow-hidden">
            {filteredGrievances.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th
                        scope="col"
                        className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider"
                      >
                        Reference ID
                      </th>
                      <th
                        scope="col"
                        className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider"
                      >
                        Category
                      </th>
                      <th
                        scope="col"
                        className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider"
                      >
                        Title
                      </th>
                      <th
                        scope="col"
                        className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider"
                      >
                        Date
                      </th>
                      <th
                        scope="col"
                        className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider"
                      >
                        Status
                      </th>
                      <th
                        scope="col"
                        className="px-6 py-4 text-right text-xs font-bold text-gray-500 uppercase tracking-wider"
                      >
                        Action
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {filteredGrievances.map((grievance) => {
                      const category = grievanceCategories.find(
                        (c) => c.id === grievance.categoryId
                      );
                      const statusInfo =
                        grievanceStatuses[grievance.status] || grievanceStatuses.SUBMITTED;
                      const IconComp =
                        category && Icons[category.icon]
                          ? Icons[category.icon]
                          : Icons.FileQuestion;

                      return (
                        <tr key={grievance.id} className="hover:bg-gray-50 transition-colors">
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                            {grievance.id}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            <div className="flex items-center gap-2">
                              <IconComp className="h-4 w-4 text-gray-400" />
                              <span>{category?.name || 'Other'}</span>
                            </div>
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-900 max-w-xs truncate font-medium">
                            {grievance.title}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            <div className="flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              {new Date(grievance.submittedAt).toLocaleDateString()}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span
                              className={`px-2.5 py-1 inline-flex text-xs leading-5 font-bold rounded-md border ${statusInfo.color}`}
                            >
                              {statusInfo.label}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                            <div className="flex items-center justify-end gap-2">
                              <Link
                                to={`/citizen/grievance/${grievance.id}`}
                                className="text-blue-700 hover:text-blue-900 font-bold bg-blue-50 px-3 py-1.5 rounded-md hover:bg-blue-100 transition-colors text-xs"
                              >
                                View Details
                              </Link>
                              <button
                                type="button"
                                onClick={() => handleOpenDelete(grievance)}
                                disabled={isDeleting}
                                className="text-red-600 hover:text-red-800 font-bold bg-red-50 p-1.5 rounded-md hover:bg-red-100 transition-colors disabled:opacity-50"
                                title="Delete Complaint"
                                aria-label={`Delete complaint ${grievance.id}`}
                              >
                                <Trash2 className="h-4 w-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="text-center py-16 px-4">
                <Search className="mx-auto h-12 w-12 text-gray-300" />
                <h3 className="mt-2 text-sm font-medium text-gray-900">
                  No matching grievances found
                </h3>
                <p className="mt-1 text-sm text-gray-500">Try adjusting your search or filters.</p>
              </div>
            )}
          </div>
        </>
      )}

      {/* Confirmation Dialog */}
      <DeleteConfirmationModal
        isOpen={isDeleteModalOpen}
        onClose={handleCloseDelete}
        onConfirm={handleConfirmDelete}
        complaint={complaintToDelete}
        isDeleting={isDeleting}
      />
    </div>
  );
};

export default MyGrievances;
