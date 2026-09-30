import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { grievanceService } from '../../services/grievanceService';
import { clusterGrievances } from '../../utils/problemClustering';
import { 
  CheckCircle2, 
  MapPin, 
  Clock, 
  Camera, 
  FileText, 
  ArrowRight,
  Layers,
  Inbox
} from 'lucide-react';

const ResolvedProblems = () => {
  const navigate = useNavigate();
  const [resolvedClusters, setResolvedClusters] = useState([]);

  useEffect(() => {
    loadResolved();
  }, []);

  const loadResolved = () => {
    const rawGrievances = grievanceService.getAllGrievances();
    const clustered = clusterGrievances(rawGrievances);
    const resolved = clustered.filter(c => c.status === 'RESOLVED' || c.status === 'CLOSED');
    setResolvedClusters(resolved);
  };

  return (
    <div className="min-h-screen bg-slate-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-5xl mx-auto">
        
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-100 text-emerald-900 text-xs font-bold uppercase tracking-wider mb-2">
              <CheckCircle2 className="w-3.5 h-3.5" /> Field Work Completed
            </div>
            <h1 className="text-3xl font-black text-slate-900 tracking-tight uppercase">
              Resolved Civic Problems
            </h1>
            <p className="text-sm text-slate-600 mt-1">
              Audit log of civic problem clusters resolved on-site with completion records.
            </p>
          </div>

          <Link
            to="/handler/categories"
            className="px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-black uppercase tracking-wider shadow-sm transition-colors flex items-center gap-2 self-start sm:self-auto"
          >
            <Layers className="w-4 h-4 text-amber-400" />
            <span>Active Categories</span>
          </Link>
        </div>

        {/* Resolved List */}
        {resolvedClusters.length === 0 ? (
          <div className="bg-white rounded-3xl border border-slate-200 p-12 text-center shadow-sm">
            <div className="w-16 h-16 bg-slate-100 rounded-2xl flex items-center justify-center mx-auto mb-4 text-slate-400">
              <Inbox className="w-8 h-8" />
            </div>
            <h3 className="text-xl font-bold text-slate-900 mb-2">No resolved problems yet</h3>
            <p className="text-sm text-slate-500 max-w-md mx-auto mb-6">
              When problem clusters are resolved in the field, their completion records and photos will be cataloged here.
            </p>
            <Link
              to="/handler/categories"
              className="px-6 py-3 bg-amber-600 hover:bg-amber-500 text-white font-bold text-xs uppercase tracking-wider rounded-xl shadow-md transition-colors"
            >
              Browse Active Categories &rarr;
            </Link>
          </div>
        ) : (
          <div className="space-y-6">
            {resolvedClusters.map((cluster) => (
              <div
                key={cluster.id}
                className="bg-white rounded-2xl border-2 border-emerald-100 p-6 shadow-sm"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-3">
                  <div className="flex items-center gap-2">
                    <span className="px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider bg-emerald-100 text-emerald-800 flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5" /> Resolved
                    </span>
                    <span className="text-xs font-bold text-slate-500 uppercase">
                      {cluster.category?.name}
                    </span>
                  </div>

                  <span className="text-xs font-mono font-medium text-slate-400">
                    {cluster.id}
                  </span>
                </div>

                <h2 className="text-2xl font-black text-slate-900 tracking-tight mb-2">
                  {cluster.title}
                </h2>

                <div className="flex flex-wrap items-center gap-3 text-xs font-semibold text-slate-600 mb-4">
                  <span className="flex items-center text-slate-900 font-bold">
                    <MapPin className="w-3.5 h-3.5 mr-1 text-emerald-600" /> {cluster.location}, {cluster.ward}
                  </span>
                  <span>•</span>
                  <span>{cluster.reportsCount} citizen complaints addressed</span>
                  <span>•</span>
                  <span>~{cluster.populationImpact.toLocaleString()} population benefited</span>
                </div>

                {/* Resolution Record */}
                <div className="bg-emerald-50/60 border border-emerald-200 rounded-xl p-4 flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
                  <div>
                    <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-800 block mb-0.5">
                      Resolution Note:
                    </span>
                    <p className="text-sm font-bold text-slate-900 italic">
                      "{cluster.resolution?.note || 'Work completed and verified on-site.'}"
                    </p>
                    <span className="text-xs text-slate-500 mt-1 block">
                      Resolved by: {cluster.resolution?.resolvedBy || 'Field Operations Lead'}
                    </span>
                  </div>

                  {cluster.resolution?.photoUrl && (
                    <div className="w-24 h-16 rounded-lg overflow-hidden border border-emerald-300 shrink-0">
                      <img
                        src={cluster.resolution.photoUrl}
                        alt="Completion verification"
                        className="w-full h-full object-cover"
                      />
                    </div>
                  )}
                </div>

                <div className="mt-4 pt-4 border-t border-slate-100 flex justify-between items-center text-xs">
                  <span className="text-slate-500">
                    All {cluster.reportsCount} citizen tracking portals updated
                  </span>
                  <button
                    onClick={() => navigate(`/handler/problem/${cluster.id}`)}
                    className="font-bold text-slate-900 hover:text-amber-600 flex items-center gap-1"
                  >
                    <span>View Full Action Record</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

      </div>
    </div>
  );
};

export default ResolvedProblems;
