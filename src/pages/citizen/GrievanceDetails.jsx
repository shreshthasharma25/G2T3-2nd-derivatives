import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, MapPin, Calendar, CheckCircle2, Clock, AlertCircle } from 'lucide-react';
import { grievanceService } from '../../services/grievanceService';
import { grievanceCategories, grievanceStatuses } from '../../data/grievanceCategories';

const GrievanceDetails = () => {
  const { id } = useParams();
  const [grievance, setGrievance] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setGrievance(grievanceService.getGrievanceById(id));
    setLoading(false);
  }, [id]);

  if (loading) return null;

  if (!grievance) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 text-center">
        <div className="mx-auto w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mb-4">
          <AlertCircle className="h-8 w-8 text-red-500" />
        </div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Grievance Not Found</h2>
        <p className="mt-2 text-gray-600 max-w-md mx-auto">The grievance reference ID you provided does not exist or has been removed.</p>
        <Link to="/citizen/grievances" className="mt-8 inline-flex items-center text-blue-700 font-medium hover:text-blue-900 bg-blue-50 px-4 py-2 rounded-md transition-colors">
          <ArrowLeft className="h-4 w-4 mr-2" /> Back to My Grievances
        </Link>
      </div>
    );
  }

  const category = grievanceCategories.find(c => c.id === grievance.categoryId);
  const statusInfo = grievanceStatuses[grievance.status] || grievanceStatuses.SUBMITTED;

  // Timeline statuses in order are dynamically mapped from updates array
  
  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <Link to="/citizen/grievances" className="inline-flex items-center text-sm font-medium text-gray-500 hover:text-gray-900 mb-6">
        <ArrowLeft className="h-4 w-4 mr-1" /> Back to tracking
      </Link>
      
      <div className="bg-white shadow-sm border border-gray-200 rounded-xl overflow-hidden">
        {/* Header */}
        <div className="px-6 sm:px-8 py-6 border-b border-gray-200 bg-gray-50 flex flex-col md:flex-row md:items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-3 mb-3">
              <span className="text-sm font-mono font-medium text-gray-500">{grievance.id}</span>
              <span className={`px-2.5 py-1 inline-flex text-xs leading-5 font-bold rounded-md border ${statusInfo.color}`}>
                {statusInfo.label}
              </span>
              {grievance.severity && (
                <span className="px-2.5 py-1 inline-flex text-xs leading-5 font-bold rounded-md border bg-gray-100 text-gray-700 border-gray-200">
                  {grievance.severity} Severity
                </span>
              )}
            </div>
            <h1 className="text-2xl font-bold text-gray-900">{grievance.title}</h1>
          </div>
          <div className="text-sm font-medium text-gray-500 flex items-center shrink-0">
            <Calendar className="h-4 w-4 mr-1.5" />
            Submitted on {new Date(grievance.submittedAt).toLocaleDateString()}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 divide-y md:divide-y-0 md:divide-x divide-gray-200">
          {/* Details Section */}
          <div className="col-span-2 p-6 sm:p-8">
            <h2 className="text-lg font-bold text-gray-900 mb-6 uppercase tracking-wider text-sm">Grievance Details</h2>
            
            <div className="space-y-8">
              <div>
                <h3 className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-2">Category</h3>
                <p className="text-gray-900 font-medium">{category?.name}</p>
              </div>
              
              <div>
                <h3 className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-2">Description</h3>
                <p className="text-gray-700 whitespace-pre-wrap leading-relaxed">{grievance.description}</p>
              </div>
              
              <div>
                <h3 className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-2">Location</h3>
                <div className="flex items-start text-gray-900 bg-gray-50 p-4 rounded-lg border border-gray-100">
                  <MapPin className="h-5 w-5 text-gray-400 mr-3 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-medium block">{grievance.location}</span>
                    <span className="text-gray-600 text-sm block mt-1">{grievance.city} {grievance.pinCode && `- ${grievance.pinCode}`}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          {/* Timeline Section */}
          <div className="p-6 sm:p-8 bg-gray-50">
            <h2 className="text-lg font-bold text-gray-900 mb-8 uppercase tracking-wider text-sm">Updates from Grievance Handler</h2>
            
            <div className="flow-root">
              <ul role="list" className="-mb-8">
                {[...grievance.updates].sort((a,b) => new Date(b.timestamp) - new Date(a.timestamp)).map((update, stepIdx, arr) => {
                  const isLatest = stepIdx === 0;
                  
                  return (
                    <li key={update.id}>
                      <div className="relative pb-8">
                        {stepIdx !== arr.length - 1 ? (
                          <span className="absolute top-4 left-4 -ml-px h-full w-0.5 bg-gray-200" aria-hidden="true" />
                        ) : null}
                        <div className="relative flex space-x-3">
                          <div>
                            <span className={`
                              h-8 w-8 rounded-full flex items-center justify-center ring-8 ring-gray-50
                              ${isLatest ? 'bg-blue-600' : 'bg-white border-2 border-gray-200'}
                            `}>
                              {isLatest ? (
                                <CheckCircle2 className="h-5 w-5 text-white" aria-hidden="true" />
                              ) : (
                                <Clock className="h-4 w-4 text-gray-400" aria-hidden="true" />
                              )}
                            </span>
                          </div>
                          <div className="flex min-w-0 flex-1 justify-between space-x-4 pt-1.5">
                            <div>
                              <p className={`text-sm font-bold ${isLatest ? 'text-blue-700' : 'text-gray-900'}`}>
                                {update.type === 'status' ? `Status: ${grievanceStatuses[update.status]?.label || update.status}` : 
                                 update.type === 'assignment' ? 'Assigned' : 'Message from Handler'}
                              </p>
                              <p className={`mt-1 text-sm ${update.type === 'message' ? 'italic text-gray-800' : 'text-gray-600'}`}>
                                {update.type === 'message' ? `"${update.message}"` : update.message}
                              </p>
                            </div>
                            <div className="whitespace-nowrap text-right text-xs text-gray-500 font-medium flex flex-col items-end">
                              <span>{new Date(update.timestamp).toLocaleDateString()}</span>
                              <span>{new Date(update.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </li>
                  );
                })}
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default GrievanceDetails;
