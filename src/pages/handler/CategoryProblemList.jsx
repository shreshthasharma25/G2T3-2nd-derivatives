import React, { useState, useEffect, useCallback } from 'react';
import { useParams, Link, useSearchParams } from 'react-router-dom';
import { grievanceService } from '../../services/grievanceService';
import { grievanceCategories } from '../../data/grievanceCategories';
import { clusterGrievances, getSolveTogetherGroups, HANDLER_BASE_LOCATION } from '../../utils/problemClustering';
import { MapContainer, TileLayer, CircleMarker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import { 
  ArrowLeft, 
  MapPin, 
  Users, 
  Clock, 
  AlertTriangle, 
  CheckCircle, 
  ChevronDown, 
  ChevronUp, 
  Map as MapIcon, 
  List, 
  Navigation, 
  FileText, 
  Sparkles
} from 'lucide-react';

const CategoryProblemList = () => {
  const { categoryId } = useParams();
  const [searchParams] = useSearchParams();
  const initialAreaFilter = searchParams.get('area') || '';

  const [allClusters, setAllClusters] = useState([]);
  const [selectedSubCategory, setSelectedSubCategory] = useState('ALL');
  const [filterMode, setFilterMode] = useState('ALL'); // 'ALL' | 'NEARBY' | 'HIGH_PRIORITY'
  const [viewMode, setViewMode] = useState('LIST'); // 'LIST' | 'MAP'
  const [expandedReports, setExpandedReports] = useState({});
  const [expandedPriority, setExpandedPriority] = useState({});
  const [areaFilter, setAreaFilter] = useState(initialAreaFilter);

  const currentCategory = grievanceCategories.find(c => c.id === categoryId) || {
    id: categoryId,
    name: 'Civic Category',
    fullName: 'Civic Issues',
    emoji: '🛡',
    subCategories: []
  };

  const loadCategoryProblems = useCallback(() => {
    const rawGrievances = grievanceService.getAllGrievances();
    const clustered = clusterGrievances(rawGrievances);
    setAllClusters(clustered);
  }, []);

  useEffect(() => {
    loadCategoryProblems();
  }, [loadCategoryProblems]);

  // Filter clusters for this category
  let categoryClusters = allClusters.filter(c => c.categoryId === categoryId);

  // If category is public_safety, we also include street_lighting if desired
  if (categoryId === 'public_safety') {
    const lightingClusters = allClusters.filter(c => c.categoryId === 'street_lighting');
    categoryClusters = [...categoryClusters, ...lightingClusters];
  }

  // Active only
  const activeCategoryClusters = categoryClusters.filter(c => c.status !== 'RESOLVED' && c.status !== 'CLOSED');

  // Subcategory filter
  let filteredClusters = activeCategoryClusters;
  if (selectedSubCategory !== 'ALL') {
    filteredClusters = filteredClusters.filter(c => 
      c.subCategory?.toLowerCase() === selectedSubCategory.toLowerCase() ||
      c.title.toLowerCase().includes(selectedSubCategory.toLowerCase())
    );
  }

  // Area filter from query or selection
  if (areaFilter) {
    filteredClusters = filteredClusters.filter(c => 
      c.location.toLowerCase().includes(areaFilter.toLowerCase()) || 
      c.ward.toLowerCase().includes(areaFilter.toLowerCase())
    );
  }

  // Filter mode (Nearby vs High Priority vs All)
  if (filterMode === 'NEARBY') {
    filteredClusters = [...filteredClusters].sort((a, b) => a.distanceKm - b.distanceKm);
  } else if (filterMode === 'HIGH_PRIORITY') {
    filteredClusters = filteredClusters.filter(c => c.severity === 'Critical' || c.severity === 'High');
    filteredClusters = [...filteredClusters].sort((a, b) => b.priorityScore - a.priorityScore);
  } else {
    // Default composite priority ranking
    filteredClusters = [...filteredClusters].sort((a, b) => b.priorityScore - a.priorityScore);
  }

  // Solve Together detection for this category
  const solveTogetherGroups = getSolveTogetherGroups(activeCategoryClusters);

  const toggleReports = (clusterId) => {
    setExpandedReports(prev => ({ ...prev, [clusterId]: !prev[clusterId] }));
  };

  const togglePriority = (clusterId) => {
    setExpandedPriority(prev => ({ ...prev, [clusterId]: !prev[clusterId] }));
  };

  return (
    <div className="min-h-screen bg-slate-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto">
        
        {/* Back Link & Navigation Breadcrumb */}
        <div className="flex items-center justify-between mb-6">
          <Link
            to="/handler/categories"
            className="inline-flex items-center text-sm font-bold text-slate-600 hover:text-slate-900 transition-colors"
          >
            <ArrowLeft className="w-4 h-4 mr-1.5" /> Back to All Categories
          </Link>

          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Base Location:</span>
            <span className="text-xs font-semibold text-slate-800 bg-white px-2.5 py-1 rounded-md border border-slate-200 flex items-center gap-1 shadow-sm">
              <MapPin className="w-3 h-3 text-amber-600" /> {HANDLER_BASE_LOCATION.name}
            </span>
          </div>
        </div>

        {/* Section Header */}
        <div className="bg-white rounded-2xl p-6 sm:p-8 border border-slate-200 shadow-sm mb-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-3xl shrink-0">
                {currentCategory.emoji}
              </div>
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-amber-600">
                  Category Focused Field Ops
                </span>
                <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight uppercase">
                  {currentCategory.name} PROBLEMS REQUIRING ACTION
                </h1>
                <p className="text-sm text-slate-600 mt-1">
                  Viewing clustered civic problems. Handlers resolve aggregated civic problems, not isolated complaint tickets.
                </p>
              </div>
            </div>

            {/* View Mode Toggle: [LIST] [MAP] */}
            <div className="flex bg-slate-100 p-1 rounded-xl self-start md:self-center border border-slate-200">
              <button
                onClick={() => setViewMode('LIST')}
                className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-wider transition-all ${
                  viewMode === 'LIST' ? 'bg-slate-900 text-white shadow-sm' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <List className="w-3.5 h-3.5" /> List View
              </button>
              <button
                onClick={() => setViewMode('MAP')}
                className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-wider transition-all ${
                  viewMode === 'MAP' ? 'bg-slate-900 text-white shadow-sm' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <MapIcon className="w-3.5 h-3.5" /> Map View
              </button>
            </div>
          </div>

          {/* Smart Subcategories Filter Chips */}
          <div className="mt-6 pt-6 border-t border-slate-100">
            <div className="flex items-center gap-2 mb-3">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Sub-Categories:</span>
              {selectedSubCategory !== 'ALL' && (
                <button
                  onClick={() => setSelectedSubCategory('ALL')}
                  className="text-xs text-amber-600 hover:underline font-bold"
                >
                  Clear filter
                </button>
              )}
            </div>

            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => setSelectedSubCategory('ALL')}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  selectedSubCategory === 'ALL'
                    ? 'bg-slate-900 text-white shadow-sm'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                All Subcategories ({activeCategoryClusters.length})
              </button>

              {currentCategory.subCategories.map((sub) => {
                const count = activeCategoryClusters.filter(c => 
                  c.subCategory?.toLowerCase() === sub.toLowerCase() ||
                  c.title.toLowerCase().includes(sub.toLowerCase())
                ).length;

                return (
                  <button
                    key={sub}
                    onClick={() => setSelectedSubCategory(sub)}
                    className={`px-3.5 py-1.5 rounded-lg text-xs font-medium transition-all flex items-center gap-1.5 ${
                      selectedSubCategory === sub
                        ? 'bg-amber-600 text-white font-bold shadow-sm'
                        : count > 0 
                          ? 'bg-slate-100 text-slate-800 hover:bg-slate-200' 
                          : 'bg-slate-50 text-slate-400 opacity-60 hover:opacity-100'
                    }`}
                  >
                    <span>{sub}</span>
                    <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono font-bold ${
                      selectedSubCategory === sub ? 'bg-amber-700 text-white' : 'bg-slate-200 text-slate-600'
                    }`}>
                      {count}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Operational Filter Tabs: [ALL AREAS] [NEARBY] [HIGH PRIORITY] */}
          <div className="mt-4 pt-4 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Field Mode:</span>
              <div className="inline-flex rounded-lg bg-slate-100 p-1">
                <button
                  onClick={() => setFilterMode('ALL')}
                  className={`px-3 py-1 rounded-md text-xs font-bold transition-colors ${
                    filterMode === 'ALL' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  All Areas
                </button>
                <button
                  onClick={() => setFilterMode('NEARBY')}
                  className={`px-3 py-1 rounded-md text-xs font-bold transition-colors flex items-center gap-1 ${
                    filterMode === 'NEARBY' ? 'bg-white text-amber-600 shadow-sm' : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <Navigation className="w-3 h-3" /> Nearby First
                </button>
                <button
                  onClick={() => setFilterMode('HIGH_PRIORITY')}
                  className={`px-3 py-1 rounded-md text-xs font-bold transition-colors flex items-center gap-1 ${
                    filterMode === 'HIGH_PRIORITY' ? 'bg-white text-red-600 shadow-sm' : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <AlertTriangle className="w-3 h-3" /> High Priority
                </button>
              </div>
            </div>

            {areaFilter && (
              <div className="flex items-center gap-2 bg-amber-50 px-3 py-1 rounded-lg border border-amber-200 text-xs text-amber-800 font-medium">
                <span>Filtering by area: <strong>{areaFilter}</strong></span>
                <button onClick={() => setAreaFilter('')} className="font-bold hover:underline">×</button>
              </div>
            )}
          </div>
        </div>

        {/* Solve Together Cluster Alert (Section 8) */}
        {solveTogetherGroups.length > 0 && !areaFilter && (
          <div className="mb-6 bg-gradient-to-r from-amber-500 to-orange-500 text-white rounded-2xl p-5 shadow-sm">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="flex items-start sm:items-center gap-3">
                <div className="p-2.5 bg-white/20 backdrop-blur-sm rounded-xl">
                  <Sparkles className="w-5 h-5 text-white" />
                </div>
                <div>
                  <div className="text-xs font-black uppercase tracking-wider text-amber-100">
                    Operational Solve Together Cluster
                  </div>
                  <h3 className="text-base font-bold">
                    {solveTogetherGroups[0].count} {currentCategory.name.toLowerCase()} problems within this area ({solveTogetherGroups[0].areaKey})
                  </h3>
                  <div className="flex flex-wrap gap-2 mt-1.5 text-xs text-amber-100">
                    {solveTogetherGroups[0].clusters.map(c => (
                      <span key={c.id} className="bg-black/20 px-2 py-0.5 rounded">
                        {c.severity === 'Critical' ? '🔴' : c.severity === 'High' ? '🟠' : '🟡'} {c.title}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
              <button
                onClick={() => setAreaFilter(solveTogetherGroups[0].location)}
                className="px-4 py-2 bg-white text-amber-900 hover:bg-amber-50 font-bold text-xs uppercase tracking-wider rounded-lg shadow-sm transition-colors whitespace-nowrap self-stretch sm:self-auto text-center"
              >
                View Area ({solveTogetherGroups[0].count}) &rarr;
              </button>
            </div>
          </div>
        )}

        {/* MAP VIEW */}
        {viewMode === 'MAP' && (
          <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm mb-6">
            <div className="p-4 bg-slate-900 text-white flex justify-between items-center text-xs">
              <div className="flex items-center gap-2">
                <MapIcon className="w-4 h-4 text-amber-400" />
                <span className="font-bold">Kolkata {currentCategory.name} Problem Clusters</span>
              </div>
              <span className="text-slate-400">Click circle markers to inspect civic tasks</span>
            </div>

            <div className="h-[450px] w-full">
              <MapContainer
                center={HANDLER_BASE_LOCATION.coordinates}
                zoom={12}
                style={{ height: '100%', width: '100%' }}
              >
                <TileLayer
                  attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                  url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />

                {filteredClusters.map((cluster) => {
                  let color = '#f59e0b';
                  if (cluster.severity === 'Critical') color = '#dc2626';
                  else if (cluster.severity === 'High') color = '#ea580c';
                  else if (cluster.severity === 'Moderate') color = '#ca8a04';

                  return (
                    <CircleMarker
                      key={cluster.id}
                      center={cluster.coordinates}
                      pathOptions={{ color, fillColor: color, fillOpacity: 0.8 }}
                      radius={Math.max(16, Math.min(28, cluster.reportsCount * 4 + 10))}
                    >
                      <Popup>
                        <div className="p-1">
                          <div className="text-[10px] font-bold uppercase tracking-wider text-red-600 mb-0.5">
                            {cluster.severity} • {cluster.category?.name}
                          </div>
                          <div className="font-extrabold text-sm text-slate-900 mb-1">
                            {cluster.title}
                          </div>
                          <div className="text-xs text-slate-600 mb-1 flex items-center gap-1">
                            <MapPin className="w-3 h-3 text-slate-400" /> {cluster.location}, {cluster.ward}
                          </div>
                          <div className="text-xs font-semibold text-slate-700 mb-2">
                            {cluster.reportsCount} citizen reports • {cluster.populationImpactLabel}
                          </div>
                          <Link
                            to={`/handler/problem/${cluster.id}`}
                            className="block text-center py-1.5 px-3 bg-slate-900 text-white text-xs font-bold rounded hover:bg-slate-800 transition-colors"
                          >
                            Open Action Card &rarr;
                          </Link>
                        </div>
                      </Popup>
                    </CircleMarker>
                  );
                })}
              </MapContainer>
            </div>
          </div>
        )}

        {/* LIST VIEW: Clustered Problem Cards */}
        {filteredClusters.length === 0 ? (
          <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center shadow-sm">
            <CheckCircle className="w-12 h-12 text-emerald-500 mx-auto mb-3" />
            <h3 className="text-lg font-bold text-slate-900">No active {currentCategory.name.toLowerCase()} problems found</h3>
            <p className="text-slate-500 text-sm mt-1 max-w-md mx-auto">
              All reported complaints in this category have been addressed or no active clusters match the selected filter.
            </p>
            <button
              onClick={() => {
                setSelectedSubCategory('ALL');
                setAreaFilter('');
                setFilterMode('ALL');
              }}
              className="mt-4 px-4 py-2 bg-slate-900 text-white rounded-lg text-xs font-bold uppercase tracking-wider hover:bg-slate-800 transition-colors"
            >
              Reset Filters
            </button>
          </div>
        ) : (
          <div className="space-y-6">
            {filteredClusters.map((cluster) => {
              const isCritical = cluster.severity === 'Critical';
              const isHigh = cluster.severity === 'High';

              const severityBadgeColor = isCritical 
                ? 'bg-red-100 text-red-800 border-red-200' 
                : isHigh 
                  ? 'bg-orange-100 text-orange-800 border-orange-200' 
                  : 'bg-yellow-100 text-yellow-800 border-yellow-200';

              const severityDot = isCritical ? '🔴 CRITICAL' : isHigh ? '🟠 HIGH' : '🟡 MODERATE';

              return (
                <div
                  key={cluster.id}
                  className={`
                    bg-white rounded-2xl border-2 shadow-sm overflow-hidden transition-all duration-200
                    hover:shadow-md hover:border-slate-800
                    ${isCritical ? 'border-red-300 ring-2 ring-red-50' : 'border-slate-200'}
                  `}
                >
                  {/* Card Header & Status Bar */}
                  <div className="p-6 sm:p-7">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-3">
                      <div className="flex items-center gap-2">
                        <span className={`px-2.5 py-1 rounded-md text-xs font-black uppercase tracking-wider border ${severityBadgeColor}`}>
                          {severityDot}
                        </span>
                        <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                          {cluster.category?.name}
                        </span>
                        <span className="text-xs font-mono font-medium text-slate-400 bg-slate-100 px-2 py-0.5 rounded">
                          {cluster.id}
                        </span>
                      </div>

                      {/* Distance pill for Nearby mode */}
                      <div className="flex items-center gap-2 self-start sm:self-auto">
                        <span className="inline-flex items-center text-xs font-bold text-slate-700 bg-slate-100 px-2.5 py-1 rounded-md">
                          <Navigation className="w-3 h-3 mr-1 text-slate-500" />
                          {cluster.distanceKm} km from base
                        </span>
                      </div>
                    </div>

                    {/* Problem Title & Location */}
                    <div className="mb-4">
                      <h2 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight mb-2">
                        {cluster.title}
                      </h2>
                      
                      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-slate-600 font-medium">
                        <span className="flex items-center text-slate-900 font-bold">
                          <MapPin className="w-4 h-4 mr-1 text-amber-600" /> {cluster.location}, {cluster.ward}
                        </span>
                        <span className="text-slate-400">•</span>
                        <span>📌 Pincode: {cluster.pinCode}</span>
                        <span className="text-slate-400">•</span>
                        <span className="flex items-center text-slate-600">
                          <Clock className="w-3.5 h-3.5 mr-1 text-slate-400" /> Unresolved: {cluster.unresolvedDuration}
                        </span>
                      </div>
                    </div>

                    {/* Operational Metrics Pill Box */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-slate-50 rounded-xl p-4 border border-slate-100 mb-5">
                      <div>
                        <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-0.5">
                          Citizen Demand
                        </span>
                        <span className="text-base font-extrabold text-slate-900 flex items-center">
                          <Users className="w-4 h-4 mr-1.5 text-blue-600" />
                          {cluster.reportsCount} related citizen reports
                        </span>
                      </div>

                      <div>
                        <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-0.5">
                          Estimated Impact
                        </span>
                        <span className="text-base font-extrabold text-slate-900">
                          ~{cluster.populationImpact.toLocaleString()} population affected
                        </span>
                      </div>
                    </div>

                    {/* Recommended Action Quote */}
                    <div className="bg-amber-50/80 border-l-4 border-amber-500 p-4 rounded-r-xl mb-6">
                      <div className="text-xs font-bold uppercase tracking-wider text-amber-800 mb-1">
                        Recommended Action:
                      </div>
                      <p className="text-sm sm:text-base font-bold text-slate-900 italic">
                        "{cluster.recommendedAction}"
                      </p>
                    </div>

                    {/* Action Buttons Row */}
                    <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-4 border-t border-slate-100">
                      
                      {/* Secondary Expanders: [View Reports] & [Why Priority] */}
                      <div className="flex items-center gap-3">
                        <button
                          type="button"
                          onClick={() => toggleReports(cluster.id)}
                          className="text-xs font-bold text-slate-600 hover:text-slate-900 flex items-center gap-1 py-1.5 px-2 rounded hover:bg-slate-100 transition-colors"
                        >
                          <FileText className="w-3.5 h-3.5 text-slate-500" />
                          <span>{cluster.reportsCount} Supporting Reports</span>
                          {expandedReports[cluster.id] ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                        </button>

                        <button
                          type="button"
                          onClick={() => togglePriority(cluster.id)}
                          className="text-xs font-bold text-slate-600 hover:text-slate-900 flex items-center gap-1 py-1.5 px-2 rounded hover:bg-slate-100 transition-colors"
                        >
                          <span>Priority Intel</span>
                          {expandedPriority[cluster.id] ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                        </button>
                      </div>

                      {/* Primary CTA: [VIEW LOCATION / ACTION] */}
                      <Link
                        to={`/handler/problem/${cluster.id}`}
                        className="px-6 py-3 bg-slate-900 hover:bg-slate-800 text-white rounded-xl font-black text-xs uppercase tracking-wider shadow-sm transition-all flex items-center justify-center gap-2 hover:shadow-lg"
                      >
                        <MapPin className="w-4 h-4 text-amber-400" />
                        <span>VIEW LOCATION & ACTION &rarr;</span>
                      </Link>
                    </div>

                    {/* Collapsible: "Why This Priority?" Transparent Explanation */}
                    {expandedPriority[cluster.id] && (
                      <div className="mt-4 p-4 bg-slate-900 text-white rounded-xl text-xs space-y-2 animate-in fade-in duration-200">
                        <div className="font-bold uppercase tracking-wider text-amber-400 border-b border-slate-700 pb-1 flex justify-between">
                          <span>WHY IS THIS HIGH PRIORITY?</span>
                          <span>Composite Score: {cluster.priorityScore}/100</span>
                        </div>
                        <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 pt-1">
                          <div>
                            <span className="text-slate-400 block text-[10px]">Severity</span>
                            <span className="font-bold text-white">{cluster.severity}</span>
                          </div>
                          <div>
                            <span className="text-slate-400 block text-[10px]">Safety Risk</span>
                            <span className="font-bold text-red-400">{cluster.safetyRisk}</span>
                          </div>
                          <div>
                            <span className="text-slate-400 block text-[10px]">Related Reports</span>
                            <span className="font-bold text-white">{cluster.reportsCount}</span>
                          </div>
                          <div>
                            <span className="text-slate-400 block text-[10px]">Pop. Impact</span>
                            <span className="font-bold text-white">{cluster.populationImpact.toLocaleString()}</span>
                          </div>
                          <div>
                            <span className="text-slate-400 block text-[10px]">Unresolved</span>
                            <span className="font-bold text-amber-300">{cluster.unresolvedDuration}</span>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Collapsible: Individual Citizen Reports As Secondary Evidence */}
                    {expandedReports[cluster.id] && (
                      <div className="mt-4 pt-4 border-t border-slate-200 animate-in fade-in duration-200">
                        <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-3">
                          Constituent Citizen Reports ({cluster.reports.length})
                        </h4>
                        <div className="space-y-3">
                          {cluster.reports.map((report) => (
                            <div key={report.id} className="bg-slate-50 p-3.5 rounded-lg border border-slate-200 text-xs">
                              <div className="flex justify-between items-start mb-1.5">
                                <div className="flex items-center gap-2">
                                  <span className="font-mono font-bold text-slate-700">{report.id}</span>
                                  <span className="text-slate-500 font-medium">— {report.citizenName}</span>
                                </div>
                                <span className="text-slate-400 font-mono">
                                  {new Date(report.submittedAt).toLocaleString()}
                                </span>
                              </div>
                              <p className="text-slate-800 font-medium mb-1">
                                "{report.description}"
                              </p>
                              <div className="text-[11px] text-slate-500">
                                Specific spot: {report.title}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

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

export default CategoryProblemList;
