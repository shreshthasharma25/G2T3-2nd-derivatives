import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Search, Filter, SlidersHorizontal, MapPin } from 'lucide-react';
import { grievanceService } from '../../services/grievanceService';
import { grievanceCategories, grievanceStatuses } from '../../data/grievanceCategories';
import * as Icons from 'lucide-react';

const AllGrievances = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('ACTIVE');
  const [sortOrder, setSortOrder] = useState('URGENCY_DESC');
  const [grievances, setGrievances] = useState([]);

  useEffect(() => {
    setGrievances(grievanceService.getAllGrievances());
  }, []);

  let filteredGrievances = grievances.filter(g => {
    const matchesSearch = g.id.toLowerCase().includes(searchTerm.toLowerCase()) || 
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

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-6 flex justify-between items-end">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">All Grievances</h1>
          <p className="text-gray-600 mt-1">Operational view of all reported civic issues.</p>
        </div>
      </div>

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
              className={`px-4 py-1.5 text-sm font-medium rounded-md transition-colors ${statusFilter === 'ACTIVE' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
            >
              Active Issues
            </button>
            <button
              onClick={() => setStatusFilter('RESOLVED')}
              className={`px-4 py-1.5 text-sm font-medium rounded-md transition-colors ${statusFilter === 'RESOLVED' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
            >
              Resolved Issues
            </button>
            <button
              onClick={() => setStatusFilter('ALL')}
              className={`px-4 py-1.5 text-sm font-medium rounded-md transition-colors ${statusFilter === 'ALL' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
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

      <div className="bg-white shadow-sm border border-gray-200 rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-slate-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Reference ID</th>
                <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Issue</th>
                <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Location</th>
                <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Urgency</th>
                <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Status</th>
                <th className="px-6 py-3 text-right text-xs font-bold text-gray-500 uppercase tracking-wider">Action</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredGrievances.map((grievance) => {
                const category = grievanceCategories.find(c => c.id === grievance.categoryId);
                const statusInfo = grievanceStatuses[grievance.status] || grievanceStatuses.SUBMITTED;
                const IconComp = category && Icons[category.icon] ? Icons[category.icon] : Icons.FileQuestion;
                
                return (
                  <tr key={grievance.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-mono font-medium text-gray-500">
                      {grievance.id}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-col">
                        <span className="text-sm font-bold text-gray-900 line-clamp-1">{grievance.title}</span>
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
                        <span className={`inline-flex px-2 py-0.5 rounded text-xs font-bold ${grievance.urgencyScore >= 80 ? 'bg-red-100 text-red-800' : grievance.urgencyScore >= 60 ? 'bg-orange-100 text-orange-800' : 'bg-yellow-100 text-yellow-800'}`}>
                          {grievance.urgencyScore}
                        </span>
                        <span className="text-xs text-gray-500 font-medium">{grievance.severity}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2.5 py-1 inline-flex text-xs leading-5 font-bold rounded-md border ${statusInfo.color}`}>
                        {statusInfo.label}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <Link to={`/handler/grievance/${grievance.id}`} className="text-slate-700 hover:text-slate-900 font-bold bg-slate-100 hover:bg-slate-200 px-3 py-1.5 rounded-md transition-colors">
                        Manage
                      </Link>
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
    </div>
  );
};

export default AllGrievances;
