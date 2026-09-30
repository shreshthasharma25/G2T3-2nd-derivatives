import React, { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { grievanceService } from '../../services/grievanceService';
import { clusterGrievances } from '../../utils/problemClustering';
import { 
  CheckSquare, 
  MapPin, 
  ArrowRight, 
  Layers,
  Inbox
} from 'lucide-react';

const MyAssignedProblems = () => {
  const navigate = useNavigate();
  const [assignedClusters, setAssignedClusters] = useState([]);

  const loadAssigned = useCallback(() => {
    const rawGrievances = grievanceService.getAllGrievances();
    const clustered = clusterGrievances(rawGrievances);
    const assigned = clustered.filter(c => 
      c.status === 'IN_PROGRESS' || 
      c.status === 'ASSIGNED'
    );
    setAssignedClusters(assigned);
  }, []);

  useEffect(() => {
    loadAssigned();
  }, [loadAssigned]);

  return (
    <div className="min-h-screen bg-slate-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-5xl mx-auto">
        
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-100 text-amber-900 text-xs font-bold uppercase tracking-wider mb-2">
              <CheckSquare className="w-3.5 h-3.5" /> Field Operations Roster
            </div>
            <h1 className="text-3xl font-black text-slate-900 tracking-tight uppercase">
              My Assigned Problems
            </h1>
            <p className="text-sm text-slate-600 mt-1">
              Active field work tasks currently assigned or in progress by your team.
            </p>
          </div>

          <Link
            to="/handler/categories"
            className="px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-black uppercase tracking-wider shadow-sm transition-colors flex items-center gap-2 self-start sm:self-auto"
          >
            <Layers className="w-4 h-4 text-amber-400" />
            <span>Pick From Categories</span>
          </Link>
        </div>

        {/* Assigned Problems List */}
        {assignedClusters.length === 0 ? (
          <div className="bg-white rounded-3xl border border-slate-200 p-12 text-center shadow-sm">
            <div className="w-16 h-16 bg-slate-100 rounded-2xl flex items-center justify-center mx-auto mb-4 text-slate-400">
              <Inbox className="w-8 h-8" />
            </div>
            <h3 className="text-xl font-bold text-slate-900 mb-2">No active tasks in your queue</h3>
            <p className="text-sm text-slate-500 max-w-md mx-auto mb-6">
              You do not have any tasks currently marked "In Progress" or "Assigned". Browse categories to pick high-priority civic problems to solve.
            </p>
            <Link
              to="/handler/categories"
              className="px-6 py-3 bg-amber-600 hover:bg-amber-500 text-white font-bold text-xs uppercase tracking-wider rounded-xl shadow-md transition-colors"
            >
              Browse Category Problems &rarr;
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {assignedClusters.map((cluster) => {
              const isCritical = cluster.severity === 'Critical';
              return (
                <div
                  key={cluster.id}
                  className="bg-white rounded-2xl border-2 border-slate-200 hover:border-slate-800 p-6 shadow-sm transition-all"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-2">
                    <div className="flex items-center gap-2">
                      <span className={`px-2.5 py-0.5 rounded text-xs font-black uppercase tracking-wider ${
                        isCritical ? 'bg-red-100 text-red-800' : 'bg-orange-100 text-orange-800'
                      }`}>
                        {cluster.severity}
                      </span>
                      <span className="text-xs font-bold text-slate-500 uppercase">
                        {cluster.category?.name}
                      </span>
                      <span className="text-xs font-mono font-medium text-slate-400 bg-slate-100 px-2 py-0.5 rounded">
                        {cluster.id}
                      </span>
                    </div>

                    <span className="px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider bg-indigo-100 text-indigo-800 self-start sm:self-auto">
                      {cluster.status}
                    </span>
                  </div>

                  <h2 className="text-2xl font-black text-slate-900 tracking-tight mb-2">
                    {cluster.title}
                  </h2>

                  <div className="flex flex-wrap items-center gap-4 text-xs font-semibold text-slate-600 mb-4">
                    <span className="flex items-center text-slate-900 font-bold">
                      <MapPin className="w-3.5 h-3.5 mr-1 text-amber-600" /> {cluster.location}, {cluster.ward}
                    </span>
                    <span>•</span>
                    <span>{cluster.reportsCount} citizen reports</span>
                    <span>•</span>
                    <span>~{cluster.populationImpact.toLocaleString()} people affected</span>
                  </div>

                  <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-100 mb-4">
                    <div className="text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-0.5">
                      Required Action:
                    </div>
                    <div className="text-sm font-bold text-slate-900">
                      {cluster.recommendedAction}
                    </div>
                  </div>

                  <div className="flex justify-end pt-3 border-t border-slate-100">
                    <button
                      onClick={() => navigate(`/handler/problem/${cluster.id}`)}
                      className="px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-black uppercase tracking-wider flex items-center gap-1.5 transition-colors"
                    >
                      <span>Open Field Action Card</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}

      </div>
    </div>
  );
};

export default MyAssignedProblems;
