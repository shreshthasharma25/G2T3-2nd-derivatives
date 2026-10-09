import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Search, Filter, SlidersHorizontal, MapPin, Download, Trash2, CheckCircle2, AlertCircle } from 'lucide-react';
import { grievanceService } from '../../services/grievanceService';
import { grievanceCategories, grievanceStatuses } from '../../data/grievanceCategories';
import { DeleteConfirmationModal } from '../../components/common/DeleteConfirmationModal';
import * as Icons from 'lucide-react';

const AllGrievances = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('ACTIVE');
  const [sortOrder, setSortOrder] = useState('URGENCY_DESC');
  const [grievances, setGrievances] = useState([]);

  // Deletion modal & feedback state
  const [complaintToDelete, setComplaintToDelete] = useState(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [feedback, setFeedback] = useState(null);

  useEffect(() => {
    setGrievances(grievanceService.getAllGrievances());
  }, []);

  // Auto-dismiss success notification after 5 seconds
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
      // Execute deletion with authorized handler role
      const result = await grievanceService.deleteGrievance(complaintToDelete.id, {
        role: 'handler',
        id: 'HND-001',
      });

      // Update state immediately without requiring a manual page refresh
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

  let filteredGrievances = grievances.filter((g) => {
    const matchesSearch =
      g.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      g.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      g.location.toLowerCase().includes(searchTerm.toLowerCase());

    let matchesStatus = true;
    if (statusFilter === 'ACTIVE') {
      matchesStatus = g.status !== 'RESOLVED' && g.status !== 'CLOSED';
    } else if (statusFilter !== 'ALL') {
      matchesStatus = g.status === statusFilter;
    }

    return matchesSearch && matchesStatus;
  });

  filteredGrievances.sort((a, b) => {
    if (sortOrder === 'URGENCY_DESC') return b.urgencyScore - a.urgencyScore;
    if (sortOrder === 'DATE_DESC') return new Date(b.submittedAt) - new Date(a.submittedAt);
    return 0;
  });

  const handleExportCSV = () => {
    const csvContent = grievanceService.exportGrievancesAsCSV();
    if (!csvContent) {
      alert('No grievances available to export yet. Please submit a grievance first.');
      return;
    }
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', 'user_complaints.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-6 flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">All Grievances</h1>
          <p className="text-gray-600 mt-1">Operational view of all reported civic issues.</p>
        </div>
        <button
          onClick={handleExportCSV}
          className="inline-flex items-center px-4 py-2 border border-slate-300 rounded-lg shadow-sm text-sm font-semibold text-slate-700 bg-white hover:bg-slate-50 transition-colors"
          title="Export grievances as CSV for Python Data Science analysis"
        >
          <Download className="w-4 h-4 mr-2 text-slate-500" />
          Export CSV for Analysis
        </button>
      </div>

      {/* Feedback Banner (Success / Error notification) */}
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

      {/* Filters and Search Bar */}
      <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200 mb-6 flex flex-col lg:flex-row gap-4 items-center">
        <div className="relative w-full lg:flex-1">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search className="h-5 w-5 text-gray-400" />
          </div>
          <input
            type="text"
            className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-slate-500 focus:border-slate-500 sm:text-sm"
            placeholder="Search by ID, title, or area..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <div className="flex flex-col sm:flex-row w-full lg:w-auto gap-4">
          <div className="flex bg-gray-100 p-1 rounded-lg">
            <button
              onClick={() => setStatusFilter('ACTIVE')}
              className={`px-4 py-1.5 text-sm font-medium rounded-md transition-colors ${
                statusFilter === 'ACTIVE'
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              Active Issues
            </button>
            <button
              onClick={() => setStatusFilter('RESOLVED')}
              className={`px-4 py-1.5 text-sm font-medium rounded-md transition-colors ${
                statusFilter === 'RESOLVED'
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              Resolved Issues
            </button>
            <button
              onClick={() => setStatusFilter('ALL')}
              className={`px-4 py-1.5 text-sm font-medium rounded-md transition-colors ${
                statusFilter === 'ALL'
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              All
            </button>
          </div>

          <div className="flex items-center gap-2">
            <SlidersHorizontal className="h-4 w-4 text-gray-500" />
            <select
              className="block w-full sm:w-48 pl-3 pr-8 py-2 text-base border border-gray-300 focus:outline-none focus:ring-slate-500 focus:border-slate-500 sm:text-sm rounded-md"
              value={sortOrder}
              onChange={(e) => setSortOrder(e.target.value)}
            >
              <option value="URGENCY_DESC">Highest Urgency First</option>
              <option value="DATE_DESC">Newest First</option>
            </select>
          </div>
        </div>
      </div>

      {/* Grievances Table */}
      <div className="bg-white shadow-sm border border-gray-200 rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-slate-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">
                  Reference ID
                </th>
                <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">
                  Issue
                </th>
                <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">
                  Location
                </th>
                <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">
                  Urgency
                </th>
                <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-right text-xs font-bold text-gray-500 uppercase tracking-wider">
                  Action
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredGrievances.map((grievance) => {
                const category = grievanceCategories.find((c) => c.id === grievance.categoryId);
                const statusInfo =
                  grievanceStatuses[grievance.status] || grievanceStatuses.SUBMITTED;
                const IconComp =
                  category && Icons[category.icon] ? Icons[category.icon] : Icons.FileQuestion;

                return (
                  <tr key={grievance.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-mono font-medium text-gray-500">
                      {grievance.id}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-col">
                        <span className="text-sm font-bold text-gray-900 line-clamp-1">
                          {grievance.title}
                        </span>
                        <div className="flex items-center gap-1 mt-1 text-xs text-gray-500">
                          <IconComp className="h-3 w-3" />
                          <span>{category?.name}</span>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center text-sm text-gray-900">
                        <MapPin className="h-3.5 w-3.5 mr-1 text-gray-400" />
                        {grievance.location}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <span
                          className={`inline-flex px-2 py-0.5 rounded text-xs font-bold ${
                            grievance.urgencyScore >= 80
                              ? 'bg-red-100 text-red-800'
                              : grievance.urgencyScore >= 60
                              ? 'bg-orange-100 text-orange-800'
                              : 'bg-yellow-100 text-yellow-800'
                          }`}
                        >
                          {grievance.urgencyScore}
                        </span>
                        <span className="text-xs text-gray-500 font-medium">
                          {grievance.severity}
                        </span>
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
                          to={`/handler/grievance/${grievance.id}`}
                          className="text-slate-700 hover:text-slate-900 font-bold bg-slate-100 hover:bg-slate-200 px-3 py-1.5 rounded-md transition-colors text-xs"
                        >
                          Manage
                        </Link>
                        <button
                          type="button"
                          onClick={() => handleOpenDelete(grievance)}
                          disabled={isDeleting}
                          className="text-red-600 hover:text-red-800 font-bold bg-red-50 hover:bg-red-100 p-1.5 rounded-md transition-colors disabled:opacity-50"
                          title="Delete Complaint"
                          aria-label={`Delete complaint ${grievance.id}`}
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        {filteredGrievances.length === 0 && (
          <div className="text-center py-12">
            <p className="text-gray-500 text-sm">No grievances found matching the criteria.</p>
          </div>
        )}
      </div>

      {/* Confirmation Dialog Component */}
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

export default AllGrievances;
