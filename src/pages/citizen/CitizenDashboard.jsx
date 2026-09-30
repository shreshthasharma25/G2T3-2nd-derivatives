import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { PlusCircle, FileText, Activity, Clock } from 'lucide-react';
import { grievanceService } from '../../services/grievanceService';
import { grievanceCategories, grievanceStatuses } from '../../data/grievanceCategories';
import { useAuth } from '../../contexts/AuthContext';
import * as Icons from 'lucide-react';

const CitizenDashboard = () => {
  const { user } = useAuth();
  const [grievances, setGrievances] = useState([]);

  useEffect(() => {
    if (user) {
      setGrievances(grievanceService.getGrievancesForCitizen(user.id));
    }
  }, [user]);

  const hasGrievances = grievances.length > 0;
  
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      
      {/* Welcome Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Good morning, {user?.name.split(' ')[0]}.</h1>
          <p className="text-gray-600 mt-1 text-lg">Stay updated on the civic issues you've reported.</p>
        </div>
        <Link 
          to="/citizen/report-grievance" 
          className="inline-flex items-center justify-center px-6 py-3 border border-transparent rounded-md shadow-sm text-base font-medium text-white bg-blue-700 hover:bg-blue-800 transition-colors"
        >
          <PlusCircle className="mr-2 -ml-1 h-5 w-5" />
          Report a Grievance
        </Link>
      </div>

      {!hasGrievances ? (
        <div className="bg-white border border-gray-200 rounded-lg p-12 text-center shadow-sm">
          <div className="mx-auto w-16 h-16 bg-blue-50 rounded-full flex items-center justify-center mb-4">
            <FileText className="h-8 w-8 text-blue-600" />
          </div>
          <h2 className="text-xl font-bold text-gray-900 mb-2">No grievances yet</h2>
          <p className="text-gray-600 mb-6 max-w-md mx-auto">
            You haven't submitted a grievance. Report a civic issue in your locality and track its progress here.
          </p>
          <Link 
            to="/citizen/report-grievance" 
            className="inline-flex items-center justify-center px-5 py-2.5 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-700 hover:bg-blue-800"
          >
            Report a Grievance
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-6">
            <h2 className="text-xl font-bold text-gray-900">Recent Activity <span className="text-sm font-normal text-gray-500">({grievances.length})</span></h2>
            <div className="max-h-[70vh] lg:max-h-[calc(100vh-16rem)] overflow-y-auto pr-2 p-1 space-y-6">
            {[...grievances].sort((a, b) => {
              const timeA = a.submittedAt ? new Date(a.submittedAt).getTime() : 0;
              const timeB = b.submittedAt ? new Date(b.submittedAt).getTime() : 0;
              return (Number.isNaN(timeB) ? 0 : timeB) - (Number.isNaN(timeA) ? 0 : timeA);
            }).map((grievance) => {
              const category = grievanceCategories.find(c => c.id === grievance.categoryId);
              const statusInfo = grievanceStatuses[grievance.status] || grievanceStatuses.SUBMITTED;
              const IconComp = category && Icons[category.icon] ? Icons[category.icon] : Icons.FileQuestion;
              
              return (
                <div key={grievance.id} className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm hover:shadow-md transition-shadow">
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex items-center gap-2">
                      <IconComp className="h-5 w-5 text-gray-400" />
                      <span className="text-sm font-medium text-gray-500">{category?.name}</span>
                    </div>
                    <span className={`px-2.5 py-1 inline-flex text-xs leading-5 font-semibold rounded-full border ${statusInfo.color}`}>
                      {statusInfo.label}
                    </span>
                  </div>
                  <h3 className="text-lg font-bold text-gray-900 mb-2">{grievance.title}</h3>
                  <div className="flex items-center gap-4 text-sm text-gray-500 mb-4">
                    <span className="flex items-center gap-1"><FileText className="h-4 w-4" /> ID: {grievance.id}</span>
                    <span className="flex items-center gap-1"><Clock className="h-4 w-4" /> {new Date(grievance.submittedAt).toLocaleDateString()}</span>
                  </div>
                  <div className="pt-4 border-t border-gray-100 flex justify-between items-center">
                    <span className="text-sm text-gray-600">
                      {grievance.updates && grievance.updates.length > 0 
                        ? `Last update: ${new Date(grievance.updates[grievance.updates.length - 1].date).toLocaleDateString()}` 
                        : 'No updates yet'}
                    </span>
                    <Link to={`/citizen/grievance/${grievance.id}`} className="text-blue-600 font-medium hover:text-blue-800 text-sm">
                      Track Status →
                    </Link>
                  </div>
                </div>
              );
            })}
            </div>
          </div>
          
          <div className="space-y-6">
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-6">
              <h3 className="text-lg font-bold text-gray-900 mb-4">Quick Actions</h3>
              <div className="space-y-3">
                <Link to="/citizen/report-grievance" className="flex items-center p-3 bg-white border border-gray-200 rounded-md hover:bg-gray-50 transition-colors">
                  <PlusCircle className="h-5 w-5 text-blue-600 mr-3" />
                  <span className="font-medium text-gray-900">Report a Grievance</span>
                </Link>
                <Link to="/citizen/grievances" className="flex items-center p-3 bg-white border border-gray-200 rounded-md hover:bg-gray-50 transition-colors">
                  <Activity className="h-5 w-5 text-blue-600 mr-3" />
                  <span className="font-medium text-gray-900">Track all Grievances</span>
                </Link>
              </div>
            </div>
            
            <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
              <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider mb-4">Summary</h3>
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Total Submitted</span>
                  <span className="font-bold text-gray-900">{grievances.length}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">In Progress</span>
                  <span className="font-bold text-gray-900">
                    {grievances.filter(g => ['ASSIGNED', 'IN_PROGRESS', 'UNDER_REVIEW'].includes(g.status)).length}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Resolved</span>
                  <span className="font-bold text-green-600">
                    {grievances.filter(g => g.status === 'RESOLVED' || g.status === 'CLOSED').length}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CitizenDashboard;
