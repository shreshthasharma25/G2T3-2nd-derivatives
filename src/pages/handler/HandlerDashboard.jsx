import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { grievanceService } from '../../services/grievanceService';
import { grievanceCategories } from '../../data/grievanceCategories';
import { clusterGrievances, getCategoryClusterStats } from '../../utils/problemClustering';
import { 
  ShieldAlert, 
  Layers, 
  MapPin, 
  Users, 
  AlertTriangle, 
  CheckCircle2, 
  ArrowRight, 
  Flame, 
  Navigation,
  CheckSquare
} from 'lucide-react';

const HandlerDashboard = () => {
  const navigate = useNavigate();
  const [clusters, setClusters] = useState([]);
  const [stats, setStats] = useState({});
  const [rawGrievancesCount, setRawGrievancesCount] = useState(0);

  useEffect(() => {
    const raw = grievanceService.getAllGrievances();
    setRawGrievancesCount(raw.length);
    const clustered = clusterGrievances(raw);
    setClusters(clustered);
    setStats(getCategoryClusterStats(clustered));
  }, []);

  const activeClusters = clusters.filter(c => c.status !== 'RESOLVED' && c.status !== 'CLOSED');
  const criticalClusters = activeClusters.filter(c => c.severity === 'Critical');
  const highPriorityClusters = activeClusters.filter(c => c.severity === 'High');
  const resolvedCount = clusters.filter(c => c.status === 'RESOLVED' || c.status === 'CLOSED').length;

  // Immediate Action List (top 5 by priority)
  const immediateActionProblems = activeClusters.slice(0, 5);

  return (
    <div className="min-h-screen bg-slate-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto space-y-8">
        
        {/* Welcome & Primary Philosophy Header */}
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-100 text-amber-900 text-xs font-bold uppercase tracking-wider mb-2">
              <ShieldAlert className="w-3.5 h-3.5" /> Civic Field Work Operations
            </div>
            <h1 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight">
              FIELD ACTION MANAGEMENT
            </h1>
            <p className="text-slate-600 text-sm mt-1 max-w-xl font-medium">
              Work on clustered civic problems rather than processing individual tickets. Choose a category to start your field dispatch.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-3">
            <Link
              to="/handler/categories"
              className="px-6 py-3.5 bg-amber-600 hover:bg-amber-500 text-white rounded-2xl text-xs font-black uppercase tracking-wider shadow-md transition-colors flex items-center justify-center gap-2"
            >
              <Layers className="w-4 h-4 text-white" />
              <span>Select Category &rarr;</span>
            </Link>

            <Link
              to="/handler/assigned"
              className="px-5 py-3.5 bg-slate-900 hover:bg-slate-800 text-white rounded-2xl text-xs font-black uppercase tracking-wider shadow-sm transition-colors flex items-center justify-center gap-2"
            >
              <CheckSquare className="w-4 h-4 text-amber-400" />
              <span>My Assigned</span>
            </Link>
          </div>
        </div>

        {/* Section 14: Design Philosophy Funnel Visualizer */}
        <div className="bg-slate-900 text-white rounded-3xl p-6 sm:p-8 shadow-md">
          <div className="text-xs font-bold uppercase tracking-wider text-amber-400 mb-2">
            Automated Field Hierarchy
          </div>
          <h2 className="text-xl sm:text-2xl font-black tracking-tight mb-6">
            HOW CIVIC COMPLAINTS BECOME FIELD ACTIONS
          </h2>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-slate-800/80 p-5 rounded-2xl border border-slate-700">
              <div className="text-xs font-bold text-slate-400 uppercase">1. Citizen Reports</div>
              <div className="text-3xl font-black text-white mt-1 font-mono">{rawGrievancesCount}</div>
              <div className="text-xs text-slate-400 mt-1">Individual submissions</div>
            </div>

            <div className="bg-slate-800/80 p-5 rounded-2xl border border-slate-700">
              <div className="text-xs font-bold text-slate-400 uppercase">2. Problem Clusters</div>
              <div className="text-3xl font-black text-amber-400 mt-1 font-mono">{clusters.length}</div>
              <div className="text-xs text-slate-400 mt-1">Spatially grouped</div>
            </div>

            <div className="bg-slate-800/80 p-5 rounded-2xl border border-slate-700">
              <div className="text-xs font-bold text-slate-400 uppercase">3. High Priority</div>
              <div className="text-3xl font-black text-orange-400 mt-1 font-mono">
                {criticalClusters.length + highPriorityClusters.length}
              </div>
              <div className="text-xs text-slate-400 mt-1">Urgent attention</div>
            </div>

            <div className="bg-amber-600/30 p-5 rounded-2xl border border-amber-500/50">
              <div className="text-xs font-black text-amber-300 uppercase">4. Immediate Action</div>
              <div className="text-3xl font-black text-amber-300 mt-1 font-mono">
                {immediateActionProblems.length}
              </div>
              <div className="text-xs text-amber-200 mt-1">Ready for field team</div>
            </div>
          </div>
        </div>

        {/* Top 5 Immediate Field Action Problems */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-xl font-black text-slate-900 uppercase tracking-tight">
                Immediate Field Action List (Top 5)
              </h2>
              <p className="text-xs text-slate-500">Ranked by severity, population impact, and safety risk.</p>
            </div>

            <Link
              to="/handler/categories"
              className="text-xs font-bold text-amber-600 hover:text-amber-700 uppercase tracking-wider"
            >
              Browse All Categories &rarr;
            </Link>
          </div>

          <div className="space-y-4">
            {immediateActionProblems.map((problem, idx) => (
              <div
                key={problem.id}
                onClick={() => navigate(`/handler/problem/${problem.id}`)}
                className="bg-white rounded-2xl border-2 border-slate-200 hover:border-slate-900 p-5 sm:p-6 shadow-sm hover:shadow-md cursor-pointer transition-all flex flex-col md:flex-row md:items-center justify-between gap-4"
              >
                <div className="space-y-1.5 flex-1">
                  <div className="flex items-center gap-2">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wider ${
                      problem.severity === 'Critical' ? 'bg-red-100 text-red-800' : 'bg-orange-100 text-orange-800'
                    }`}>
                      {problem.severity === 'Critical' ? '🔴 CRITICAL' : '🟠 HIGH'}
                    </span>
                    <span className="text-xs font-bold text-slate-500 uppercase">
                      {problem.category?.name}
                    </span>
                    <span className="text-xs text-slate-400 font-mono">
                      {problem.reportsCount} citizen reports
                    </span>
                  </div>

                  <h3 className="text-xl font-black text-slate-900 tracking-tight">
                    {problem.title}
                  </h3>

                  <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-600 font-medium">
                    <span className="flex items-center text-slate-900 font-bold">
                      <MapPin className="w-3.5 h-3.5 mr-1 text-amber-600" /> {problem.location}, {problem.ward}
                    </span>
                    <span>•</span>
                    <span>~{problem.populationImpact.toLocaleString()} population affected</span>
                    <span>•</span>
                    <span className="text-slate-500 italic">Action: "{problem.recommendedAction}"</span>
                  </div>
                </div>

                <div className="shrink-0 flex items-center gap-3">
                  <span className="px-4 py-2 bg-slate-900 text-white rounded-xl text-xs font-black uppercase tracking-wider flex items-center gap-1.5 group-hover:bg-slate-800">
                    <span>Action Card</span>
                    <ArrowRight className="w-3.5 h-3.5 text-amber-400" />
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Quick Category Launchers */}
        <div>
          <h2 className="text-xl font-black text-slate-900 uppercase tracking-tight mb-4">
            Select A Category To Dispatch
          </h2>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
            {grievanceCategories.slice(0, 6).map((cat) => {
              const catStat = stats[cat.id] || { activeProblemsCount: 0 };
              return (
                <div
                  key={cat.id}
                  onClick={() => navigate(`/handler/category/${cat.id}`)}
                  className="bg-white rounded-2xl border-2 border-slate-200 hover:border-slate-800 p-4 text-center cursor-pointer shadow-sm hover:shadow transition-all group"
                >
                  <div className="text-3xl mb-2">{cat.emoji}</div>
                  <div className="font-black text-sm text-slate-900 uppercase tracking-tight group-hover:text-amber-600">
                    {cat.name}
                  </div>
                  <div className="text-xs font-extrabold text-slate-500 mt-1">
                    {catStat.activeProblemsCount} problems
                  </div>
                </div>
              );
            })}
          </div>
        </div>

      </div>
    </div>
  );
};

export default HandlerDashboard;
