import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { grievanceService } from '../../services/grievanceService';
import { AlertCircle, Clock, MapPin, Inbox } from 'lucide-react';
import { grievanceCategories } from '../../data/grievanceCategories';

const PriorityQueue = () => {
  const [grievances, setGrievances] = useState([]);

  useEffect(() => {
    setGrievances(grievanceService.getAllGrievances());
  }, []);

  // Sort by urgency score descending, filter out resolved
  const sortedGrievances = [...grievances]
    .filter(g => g.status !== 'RESOLVED' && g.status !== 'CLOSED')
    .sort((a, b) => b.urgencyScore - a.urgencyScore);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-6 flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Priority Queue</h1>
          <p className="text-gray-600 mt-1">Grievances ordered automatically by calculated urgency score.</p>
        </div>
        <div className="bg-blue-50 text-blue-700 px-4 py-2 rounded-md text-sm font-medium border border-blue-100 flex items-center">
          <AlertCircle className="w-4 h-4 mr-2" /> Action Required: {sortedGrievances.length}
        </div>
      </div>

      <div className="space-y-4">
        {sortedGrievances.length === 0 ? (
          <div className="bg-white rounded-lg border border-gray-200 p-12 text-center flex flex-col items-center">
            <div className="bg-gray-100 p-4 rounded-full mb-4">
              <Inbox className="w-8 h-8 text-gray-400" />
            </div>
            <h3 className="text-lg font-medium text-gray-900">Queue is empty</h3>
            <p className="text-gray-500 mt-1">There are no active grievances requiring attention.</p>
          </div>
        ) : (
          sortedGrievances.map((grievance, index) => {
            const category = grievanceCategories.find(c => c.id === grievance.categoryId);
            const isTopPriority = index === 0 && grievance.urgencyScore >= 60;

            return (
              <div 
                key={grievance.id} 
                className={`bg-white rounded-lg border shadow-sm overflow-hidden transition-all hover:shadow-md ${isTopPriority ? 'border-red-300 ring-1 ring-red-100' : 'border-gray-200'}`}
              >
                {isTopPriority && (
                  <div className="bg-red-600 text-white text-xs font-bold px-4 py-1.5 uppercase tracking-wider flex items-center">
                    <AlertCircle className="w-3.5 h-3.5 mr-1.5" /> Highest Priority Issue
                  </div>
                )}
                
                <div className="p-5 sm:p-6 flex flex-col md:flex-row gap-6">
                  
                  {/* Score Column */}
                  <div className="flex-shrink-0 flex md:flex-col items-center md:items-start justify-between md:justify-start gap-4 md:gap-0 md:w-32 md:border-r border-gray-100 md:pr-6">
                    <div>
                      <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Score</p>
                      <div className="flex items-baseline">
                        <span className={`text-3xl font-bold ${grievance.urgencyScore >= 80 ? 'text-red-600' : grievance.urgencyScore >= 60 ? 'text-orange-600' : 'text-gray-900'}`}>
                          {grievance.urgencyScore}
                        </span>
                        <span className="text-sm font-medium text-gray-400 ml-1">/100</span>
                      </div>
                    </div>
                    
                    <div className="md:mt-6">
                      <span className={`inline-flex px-2 py-1 rounded text-xs font-bold border ${
                        grievance.severity === 'Critical' ? 'bg-red-50 text-red-700 border-red-200' :
                        grievance.severity === 'High' ? 'bg-orange-50 text-orange-700 border-orange-200' : 'bg-gray-50 text-gray-700 border-gray-200'
                      }`}>
                        {grievance.severity}
                      </span>
                    </div>
                  </div>

                  {/* Content Column */}
                  <div className="flex-grow flex flex-col justify-center">
                    <div className="flex items-center gap-3 mb-1">
                      <span className="text-xs font-mono font-medium text-gray-500 bg-gray-100 px-2 py-0.5 rounded">{grievance.id}</span>
                      <span className="text-xs font-bold text-slate-500 uppercase">{category?.name}</span>
                    </div>
                    <h3 className="text-lg font-bold text-gray-900 mb-2">{grievance.title}</h3>
                    
                    <div className="flex flex-wrap gap-x-6 gap-y-2 mt-2 text-sm text-gray-600">
                      <span className="flex items-center font-medium">
                        <MapPin className="w-4 h-4 mr-1 text-gray-400" /> {grievance.location}
                      </span>
                      {grievance.similarComplaints > 0 && (
                        <span className="flex items-center text-orange-700 font-medium bg-orange-50 px-2 rounded">
                          {grievance.similarComplaints} similar complaints here
                        </span>
                      )}
                      <span className="flex items-center">
                        <Clock className="w-4 h-4 mr-1 text-gray-400" /> 
                        Reported {Math.round((Date.now() - new Date(grievance.submittedAt)) / 60000)} mins ago
                      </span>
                    </div>
                  </div>

                  {/* Action Column */}
                  <div className="flex-shrink-0 flex items-center justify-end md:pl-6 border-t md:border-t-0 md:border-l border-gray-100 pt-4 md:pt-0">
                    <Link 
                      to={`/handler/grievance/${grievance.id}`}
                      className="w-full md:w-auto px-5 py-2.5 bg-slate-800 text-white text-sm font-medium rounded-md hover:bg-slate-900 transition-colors text-center shadow-sm"
                    >
                      Assess Issue
                    </Link>
                  </div>
                  
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};

export default PriorityQueue;
