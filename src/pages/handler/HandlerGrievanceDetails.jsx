import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, MapPin, Calendar, Clock, AlertTriangle, Users, Activity, ClipboardList, Trash2 } from 'lucide-react';
import { grievanceService } from '../../services/grievanceService';
import { grievanceCategories, grievanceStatuses } from '../../data/grievanceCategories';
import { DeleteConfirmationModal } from '../../components/common/DeleteConfirmationModal';

const HandlerGrievanceDetails = () => {
  const { id } = useParams();
  const [grievance, setGrievance] = useState(null);
  const [statusInput, setStatusInput] = useState('');
  const [updateMessage, setUpdateMessage] = useState('');
  const [departmentInput, setDepartmentInput] = useState('');
  const [handlerInput, setHandlerInput] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const data = grievanceService.getGrievanceById(id);
    if (data) {
      setGrievance(data);
      setStatusInput(data.status);
      setDepartmentInput(data.assignedDepartment || '');
      setHandlerInput(data.assignedHandler || '');
    }
  }, [id]);

  if (!grievance) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 text-center">
        <h2 className="text-2xl font-bold text-gray-900">Grievance Not Found</h2>
        <Link to="/handler/grievances" className="mt-4 text-blue-600 hover:underline">Back to Grievances</Link>
      </div>
    );
  }

  const category = grievanceCategories.find(c => c.id === grievance.categoryId);
  const statusInfo = grievanceStatuses[grievance.status] || grievanceStatuses.SUBMITTED;

  const handleUpdateStatus = () => {
    if (statusInput === grievance.status && !updateMessage && departmentInput === (grievance.assignedDepartment || '') && handlerInput === (grievance.assignedHandler || '')) {
      return;
    }
    
    setSaving(true);
    // Simulate network delay
    setTimeout(() => {
      // If assignment changed
      if (departmentInput !== (grievance.assignedDepartment || '') || handlerInput !== (grievance.assignedHandler || '')) {
        grievanceService.addGrievanceUpdate(grievance.id, {
          type: 'assignment',
          assignedDepartment: departmentInput,
          assignedHandler: handlerInput,
          message: `Grievance has been assigned to ${handlerInput ? handlerInput + ' at ' : ''}${departmentInput || 'the appropriate department'}.`
        });
      }

      // If status changed or explicit message provided
      if (statusInput !== grievance.status || updateMessage) {
        grievanceService.addGrievanceUpdate(grievance.id, {
          type: statusInput !== grievance.status ? 'status' : 'message',
          status: statusInput,
          message: updateMessage || `Status changed to ${grievanceStatuses[statusInput]?.label || statusInput}`
        });
      }

      setGrievance(grievanceService.getGrievanceById(grievance.id));
      setUpdateMessage('');
      setSaving(false);
    }, 500);
  };

  const navigate = useNavigate();
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState(null);

  const handleDeleteConfirm = async () => {
    if (!grievance || isDeleting) return;
    setIsDeleting(true);
    setDeleteError(null);
    try {
      await grievanceService.deleteGrievance(grievance.id, { role: 'handler', id: 'HND-001' });
      navigate('/handler/grievances');
    } catch (err) {
      setDeleteError(err?.message || 'Failed to delete complaint.');
      setIsDeleting(false);
      setIsDeleteModalOpen(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex items-center justify-between mb-6">
        <Link to="/handler/priority-queue" className="inline-flex items-center text-sm font-medium text-slate-500 hover:text-slate-900">
          <ArrowLeft className="h-4 w-4 mr-1" /> Back to Queue
        </Link>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Main Details (Left Col) */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white shadow-sm border border-gray-200 rounded-lg overflow-hidden">
            <div className="px-6 py-5 border-b border-gray-200 bg-slate-50 flex justify-between items-start">
              <div>
                <div className="flex items-center gap-3 mb-2">
                  <span className="text-xs font-mono font-bold text-slate-500 bg-slate-200 px-2 py-0.5 rounded">{grievance.id}</span>
                  <span className={`px-2.5 py-0.5 inline-flex text-xs leading-5 font-bold rounded border ${statusInfo.color}`}>
                    {statusInfo.label}
                  </span>
                </div>
                <h1 className="text-2xl font-bold text-gray-900">{grievance.title}</h1>
              </div>
            </div>
            
            <div className="p-6">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
                <div>
                  <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Category</h3>
                  <p className="text-sm font-medium text-gray-900">{category?.name}</p>
                </div>
                <div>
                  <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Submitted</h3>
                  <p className="text-sm font-medium text-gray-900 flex items-center">
                    <Calendar className="w-3.5 h-3.5 mr-1 text-gray-400" />
                    {new Date(grievance.submittedAt).toLocaleDateString()}
                  </p>
                </div>
                <div>
                  <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Citizen</h3>
                  <div className="text-sm text-gray-900">
                    <p className="font-medium">{grievance.citizenName}</p>
                    <p className="text-gray-500 text-xs">{grievance.citizenEmail}</p>
                  </div>
                </div>
                <div>
                  <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Location</h3>
                  <p className="text-sm font-medium text-gray-900 flex items-center">
                    <MapPin className="w-3.5 h-3.5 mr-1 text-gray-400" />
                    {grievance.location}
                  </p>
                </div>
              </div>

              <div>
                <h3 className="text-sm font-bold text-gray-900 mb-2 border-b border-gray-100 pb-2">Description</h3>
                <p className="text-gray-700 whitespace-pre-wrap text-sm leading-relaxed bg-gray-50 p-4 rounded-md border border-gray-100">
                  {grievance.description}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white shadow-sm border border-gray-200 rounded-lg overflow-hidden">
             <div className="px-6 py-4 border-b border-gray-200 bg-slate-50">
               <h2 className="text-sm font-bold text-gray-900 flex items-center uppercase tracking-wider">
                 <ClipboardList className="w-4 h-4 mr-2" /> Operational Actions
               </h2>
             </div>
             <div className="p-6">
               <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                 <div>
                   <label className="block text-sm font-bold text-gray-700 mb-2">Assign Department</label>
                   <select 
                     value={departmentInput}
                     onChange={e => setDepartmentInput(e.target.value)}
                     className="block w-full pl-3 pr-10 py-2 text-base border border-gray-300 focus:outline-none focus:ring-slate-500 focus:border-slate-500 sm:text-sm rounded-md"
                   >
                     <option value="">Unassigned</option>
                     <option value="Municipal Services">Municipal Services</option>
                     <option value="Water & Sanitation">Water & Sanitation</option>
                     <option value="Public Works Department">Public Works Department</option>
                     <option value="Electricity Board">Electricity Board</option>
                   </select>
                 </div>
                 
                 <div>
                   <label className="block text-sm font-bold text-gray-700 mb-2">Assign Handler</label>
                   <input
                     type="text"
                     value={handlerInput}
                     onChange={e => setHandlerInput(e.target.value)}
                     placeholder="Name of handler..."
                     className="block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-slate-500 focus:outline-none focus:ring-slate-500 sm:text-sm"
                   />
                 </div>
               </div>

               <div className="mb-4 border-t border-gray-100 pt-4">
                 <label className="block text-sm font-bold text-gray-700 mb-2">Update Status</label>
                 <select 
                   value={statusInput}
                   onChange={e => setStatusInput(e.target.value)}
                   className="block w-full max-w-sm pl-3 pr-10 py-2 text-base border border-gray-300 focus:outline-none focus:ring-slate-500 focus:border-slate-500 sm:text-sm rounded-md"
                 >
                   {Object.values(grievanceStatuses).map(status => (
                     <option key={status.id} value={status.id}>{status.label}</option>
                   ))}
                 </select>
               </div>
               
               <div className="mb-4">
                 <label className="block text-sm font-bold text-gray-700 mb-2">Message to Citizen</label>
                 <textarea
                   value={updateMessage}
                   onChange={e => setUpdateMessage(e.target.value)}
                   placeholder="Describe what action was taken..."
                   rows={3}
                   className="block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-slate-500 focus:outline-none focus:ring-slate-500 sm:text-sm"
                 ></textarea>
               </div>

               <div className="mt-6 flex flex-wrap items-center justify-between gap-3 border-t border-gray-100 pt-6">
                  <button 
                    onClick={handleUpdateStatus}
                    disabled={saving || isDeleting}
                    className="px-4 py-2 bg-slate-800 text-white rounded-md text-sm font-bold shadow-sm hover:bg-slate-900 disabled:opacity-50"
                  >
                    {saving ? 'Updating...' : 'Save & Notify'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsDeleteModalOpen(true)}
                    disabled={saving || isDeleting}
                    className="px-4 py-2 border border-red-200 text-red-600 hover:bg-red-50 hover:border-red-300 rounded-md text-sm font-bold shadow-sm transition-colors inline-flex items-center gap-1.5"
                    title="Delete Complaint"
                  >
                    <Trash2 className="w-4 h-4" />
                    Delete Complaint
                  </button>
               </div>
             </div>
          </div>
        </div>
        
        {/* Urgency & Intel (Right Col) */}
        <div className="space-y-6">
          <div className="bg-slate-800 text-white shadow-sm rounded-lg overflow-hidden border border-slate-700">
            <div className="p-6">
              <h2 className="text-sm font-bold text-slate-300 uppercase tracking-wider mb-6 flex items-center">
                <AlertTriangle className="w-4 h-4 mr-2 text-amber-400" /> Prioritization Intel
              </h2>
              
              <div className="flex items-end justify-between mb-8 border-b border-slate-700 pb-6">
                <div>
                  <p className="text-xs font-medium text-slate-400 mb-1">Computed Urgency Score</p>
                  <div className="flex items-baseline">
                    <span className="text-5xl font-bold text-white">{grievance.urgencyScore}</span>
                    <span className="text-lg text-slate-500 ml-1">/100</span>
                  </div>
                </div>
                <div className={`px-3 py-1 rounded text-xs font-bold border ${
                  grievance.severity === 'Critical' ? 'bg-red-900/50 text-red-400 border-red-800' : 'bg-orange-900/50 text-orange-400 border-orange-800'
                }`}>
                  {grievance.severity} Severity
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex justify-between items-center bg-slate-900/50 p-3 rounded-md border border-slate-700/50">
                  <div className="flex items-center text-sm text-slate-300">
                    <Activity className="w-4 h-4 mr-2 text-blue-400" /> Concentration
                  </div>
                  <span className="font-bold text-white">{grievance.similarComplaints} similar</span>
                </div>
                
                <div className="flex justify-between items-center bg-slate-900/50 p-3 rounded-md border border-slate-700/50">
                  <div className="flex items-center text-sm text-slate-300">
                    <Users className="w-4 h-4 mr-2 text-emerald-400" /> Pop. Impact
                  </div>
                  <span className="font-bold text-white">{grievance.populationImpact}</span>
                </div>

                <div className="flex justify-between items-center bg-slate-900/50 p-3 rounded-md border border-slate-700/50">
                  <div className="flex items-center text-sm text-slate-300">
                    <Clock className="w-4 h-4 mr-2 text-amber-400" /> Recurrence
                  </div>
                  <span className="font-bold text-white">Level {grievance.similarComplaints > 0 ? 1 : 0}</span>
                </div>
              </div>

              <div className="mt-6 pt-4 border-t border-slate-700">
                <Link to="/handler/urgency-map" className="text-sm font-medium text-blue-400 hover:text-blue-300 flex items-center justify-center">
                  View area on Urgency Map &rarr;
                </Link>
              </div>
            </div>
          </div>
        </div>

      </div>

      <DeleteConfirmationModal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        onConfirm={handleDeleteConfirm}
        complaint={grievance}
        isDeleting={isDeleting}
      />
    </div>
  );
};

export default HandlerGrievanceDetails;
