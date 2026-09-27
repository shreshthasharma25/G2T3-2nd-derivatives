import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { grievanceService } from '../../services/grievanceService';
import { mockAreas } from '../../data/mockAreas';
import { Map, AlertTriangle, ArrowUpRight, FileText, CheckCircle, Database } from 'lucide-react';
import { grievanceCategories } from '../../data/grievanceCategories';

const HandlerDashboard = () => {
  const [grievances, setGrievances] = useState([]);
  
  useEffect(() => {
    setGrievances(grievanceService.getAllGrievances());
  }, []);

  const activeCount = grievances.filter(g => g.status !== 'RESOLVED' && g.status !== 'CLOSED').length;
  const criticalCount = grievances.filter(g => g.severity === 'Critical' && g.status !== 'RESOLVED').length;
  const highPriorityCount = grievances.filter(g => g.urgencyScore >= 70 && g.status !== 'RESOLVED').length;
  const resolvedCount = grievances.filter(g => g.status === 'RESOLVED' || g.status === 'CLOSED').length;
  
  // Calculate dynamic areas based on actual grievances
  const areaStats = {};
  grievances.forEach(g => {
    if (g.status === 'RESOLVED' || g.status === 'CLOSED') return;
    if (!areaStats[g.location]) {
      areaStats[g.location] = { name: g.location, total: 0, critical: 0, scores: [] };
    }
    areaStats[g.location].total++;
    if (g.severity === 'Critical') areaStats[g.location].critical++;
    areaStats[g.location].scores.push(g.urgencyScore);
  });

  const sortedAreas = Object.values(areaStats).map(a => ({
    ...a,
    maxScore: Math.max(...a.scores)
  })).sort((a, b) => b.maxScore - a.maxScore);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8 flex justify-between items-end">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Operations Overview</h1>
          <p className="text-gray-600 mt-1">Monitor civic issues and prioritize responses based on urgency and impact.</p>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500 uppercase tracking-wider">Active Issues</p>
              <p className="mt-1 text-3xl font-semibold text-gray-900">{activeCount}</p>
            </div>
            <div className="p-3 bg-blue-50 rounded-md">
              <FileText className="h-6 w-6 text-blue-600" />
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow-sm border border-red-200 p-5 ring-1 ring-red-50">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-red-600 uppercase tracking-wider">Critical Severity</p>
              <p className="mt-1 text-3xl font-semibold text-red-700">{criticalCount}</p>
            </div>
            <div className="p-3 bg-red-100 rounded-md">
              <AlertTriangle className="h-6 w-6 text-red-600" />
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow-sm border border-amber-200 p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-amber-600 uppercase tracking-wider">High Priority</p>
              <p className="mt-1 text-3xl font-semibold text-amber-700">{highPriorityCount}</p>
            </div>
            <div className="p-3 bg-amber-100 rounded-md">
              <ArrowUpRight className="h-6 w-6 text-amber-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500 uppercase tracking-wider">Resolved</p>
              <p className="mt-1 text-3xl font-semibold text-gray-900">{resolvedCount}</p>
            </div>
            <div className="p-3 bg-green-50 rounded-md">
              <CheckCircle className="h-6 w-6 text-green-600" />
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Content Area */}
        <div className="lg:col-span-2 space-y-8">
          
          {/* Map Teaser */}
          <div className="bg-white shadow-sm border border-gray-200 rounded-lg overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200 bg-gray-50 flex justify-between items-center">
              <h2 className="text-lg font-bold text-gray-900 flex items-center">
                <Map className="h-5 w-5 mr-2 text-slate-600" /> Urgency Map Overview
              </h2>
              <Link to="/handler/urgency-map" className="text-sm font-medium text-blue-600 hover:text-blue-800">
                View full map &rarr;
              </Link>
            </div>
            <div className="p-6 bg-slate-100 relative min-h-[300px] flex items-center justify-center border-b border-gray-200">
              <div className="absolute inset-0 opacity-20 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] mix-blend-multiply"></div>
              <div className="relative z-10 text-center">
                <Map className="h-12 w-12 text-slate-400 mx-auto mb-3" />
                <p className="text-slate-600 font-medium">Interactive Kolkata Urgency Map available in detailed view</p>
                <Link to="/handler/urgency-map" className="mt-4 inline-block px-4 py-2 bg-white shadow-sm border border-gray-300 rounded-md text-sm font-medium text-slate-700 hover:bg-gray-50">
                  Open Urgency Map
                </Link>
              </div>
            </div>
          </div>

          {/* Priority Queue Teaser */}
          <div className="bg-white shadow-sm border border-gray-200 rounded-lg overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200 bg-gray-50 flex justify-between items-center">
              <h2 className="text-lg font-bold text-gray-900">Priority Grievances</h2>
              <Link to="/handler/priority-queue" className="text-sm font-medium text-blue-600 hover:text-blue-800">
                View all &rarr;
              </Link>
            </div>
            
            {grievances.length === 0 ? (
              <div className="p-8 text-center text-gray-500">
                No grievances in the system.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-white">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Ref ID</th>
                      <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Issue</th>
                      <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Area</th>
                      <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Urgency</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {[...grievances].filter(g => g.status !== 'RESOLVED' && g.status !== 'CLOSED').sort((a,b) => b.urgencyScore - a.urgencyScore).slice(0, 4).map(g => (
                      <tr key={g.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-mono text-gray-500">
                          <Link to={`/handler/grievance/${g.id}`} className="text-blue-600 hover:underline">{g.id}</Link>
                        </td>
                        <td className="px-6 py-4 text-sm font-medium text-gray-900 truncate max-w-xs">{g.title}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{g.location}</td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="w-16 bg-gray-200 rounded-full h-2 mr-2">
                              <div className={`h-2 rounded-full ${g.urgencyScore >= 80 ? 'bg-red-500' : g.urgencyScore >= 60 ? 'bg-orange-500' : 'bg-yellow-500'}`} style={{ width: `${g.urgencyScore}%` }}></div>
                            </div>
                            <span className="text-xs font-bold text-gray-700">{g.urgencyScore}</span>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-8">
          {/* Hotspots */}
          <div className="bg-white shadow-sm border border-gray-200 rounded-lg overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200 bg-slate-800 text-white">
              <h2 className="text-lg font-bold">Complaint Hotspots</h2>
            </div>
            
            {sortedAreas.length === 0 ? (
              <div className="p-6 text-center text-sm text-gray-500">
                No hotspot data available.
              </div>
            ) : (
              <div className="divide-y divide-gray-200">
                {sortedAreas.slice(0, 4).map((area, idx) => {
                  return (
                    <div key={area.name} className="p-4 hover:bg-gray-50">
                      <div className="flex justify-between items-start mb-1">
                        <h3 className="font-bold text-gray-900">{area.name}</h3>
                        <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-bold ${
                          area.maxScore >= 80 ? 'bg-red-100 text-red-800' : 
                          area.maxScore >= 60 ? 'bg-orange-100 text-orange-800' : 'bg-amber-100 text-amber-800'
                        }`}>
                          Max Score: {area.maxScore}
                        </span>
                      </div>
                      <p className="text-sm text-gray-500 mb-2">{area.total} active grievances</p>
                      {area.critical > 0 && (
                        <div className="text-xs text-red-700 bg-red-50 p-2 rounded font-medium border border-red-100">
                          {area.critical} Critical Incidents
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
            
            <div className="px-4 py-3 bg-gray-50 border-t border-gray-200 text-center">
              <Link to="/handler/urgency-map" className="text-sm font-medium text-blue-600 hover:text-blue-800">
                Analyze all areas &rarr;
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HandlerDashboard;
