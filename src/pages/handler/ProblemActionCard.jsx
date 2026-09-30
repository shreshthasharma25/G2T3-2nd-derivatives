import React, { useState, useEffect, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import { grievanceService } from '../../services/grievanceService';
import { clusterGrievances } from '../../utils/problemClustering';
import { 
  ArrowLeft, 
  MapPin, 
  CheckCircle2, 
  Navigation, 
  Camera, 
  FileText, 
  Zap, 
  Check, 
  ChevronDown, 
  ChevronUp, 
  Compass
} from 'lucide-react';

const ProblemActionCard = () => {
  const { clusterId } = useParams();

  const [cluster, setCluster] = useState(null);
  const [fieldActionMode, setFieldActionMode] = useState(false);
  const [showResolveModal, setShowResolveModal] = useState(false);
  const [showReportsDrawer, setShowReportsDrawer] = useState(false);
  const [showPriorityIntel, setShowPriorityIntel] = useState(false);
  const [currentStatus, setCurrentStatus] = useState('SUBMITTED');

  // Completion Form State
  const [resolutionNote, setResolutionNote] = useState('');
  const [photoPreview, setPhotoPreview] = useState(null);
  const [locationConfirmed, setLocationConfirmed] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const loadCluster = useCallback(() => {
    const rawGrievances = grievanceService.getAllGrievances();
    const clustered = clusterGrievances(rawGrievances);
    const target = clustered.find(c => c.id === clusterId);

    if (target) {
      setCluster(target);
      setCurrentStatus(target.status);
    }
  }, [clusterId]);

  useEffect(() => {
    loadCluster();
  }, [loadCluster]);

  if (!cluster) {
    return (
      <div className="min-h-[calc(100vh-4rem)] flex flex-col items-center justify-center p-8 bg-slate-50 text-center">
        <h2 className="text-2xl font-bold text-slate-900 mb-2">Problem Cluster Not Found</h2>
        <p className="text-slate-500 mb-6">This problem cluster may have already been resolved or does not exist.</p>
        <Link
          to="/handler/categories"
          className="px-6 py-2.5 bg-slate-900 text-white rounded-xl text-xs font-bold uppercase tracking-wider hover:bg-slate-800"
        >
          Back to Categories
        </Link>
      </div>
    );
  }

  const reportIds = cluster.reports.map(r => r.id);

  // Handle Start Work
  const handleStartWork = () => {
    grievanceService.updateClusterStatus(
      reportIds,
      'IN_PROGRESS',
      'Field team has reached location and started work on the hazard.',
      'Field Operations Team'
    );
    setCurrentStatus('IN_PROGRESS');
    loadCluster();
  };

  // Handle Status Change
  const handleStatusChange = (newStatus) => {
    if (newStatus === 'RESOLVED') {
      setShowResolveModal(true);
      return;
    }
    grievanceService.updateClusterStatus(
      reportIds,
      newStatus,
      `Status changed to ${newStatus} by field handler.`,
      'Field Operations Team'
    );
    setCurrentStatus(newStatus);
    loadCluster();
  };

  // Handle Photo Selection
  const handlePhotoUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setPhotoPreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  // Submit Resolution
  const handleResolveSubmit = (e) => {
    e.preventDefault();
    if (!resolutionNote.trim()) return;

    setSubmitting(true);
    setTimeout(() => {
      grievanceService.resolveProblemCluster(reportIds, {
        note: resolutionNote.trim(),
        photoUrl: photoPreview || 'https://images.unsplash.com/photo-1584467735871-8e85353a8413?w=500&auto=format&fit=crop&q=60',
        handlerName: 'Field Operations Lead'
      });

      setSubmitting(false);
      setShowResolveModal(false);
      loadCluster();
    }, 600);
  };

  // Maps navigation URL
  const googleMapsUrl = `https://www.google.com/maps/search/?api=1&query=${cluster.coordinates[0]},${cluster.coordinates[1]}`;

  return (
    <div className={`min-h-screen py-8 px-4 sm:px-6 lg:px-8 transition-colors ${fieldActionMode ? 'bg-zinc-950 text-white' : 'bg-slate-50 text-slate-900'}`}>
      <div className="max-w-4xl mx-auto">
        
        {/* Navigation Bar */}
        <div className="flex items-center justify-between mb-6">
          <Link
            to={`/handler/category/${cluster.categoryId}`}
            className={`inline-flex items-center text-xs font-bold uppercase tracking-wider transition-colors ${fieldActionMode ? 'text-zinc-400 hover:text-white' : 'text-slate-600 hover:text-slate-900'}`}
          >
            <ArrowLeft className="w-4 h-4 mr-1.5" /> Back to {cluster.category?.name} List
          </Link>

          {/* Toggle: "JUST TELL ME WHAT TO DO" (FIELD ACTION) */}
          <button
            onClick={() => setFieldActionMode(!fieldActionMode)}
            className={`
              flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all shadow-sm
              ${fieldActionMode 
                ? 'bg-amber-500 text-black ring-4 ring-amber-500/20' 
                : 'bg-slate-900 text-white hover:bg-slate-800'}
            `}
          >
            <Zap className={`w-3.5 h-3.5 ${fieldActionMode ? 'text-black fill-black' : 'text-amber-400'}`} />
            <span>{fieldActionMode ? 'Exit Field Mode' : '⚡ Field Action Mode'}</span>
          </button>
        </div>

        {/* ============================================================== */}
        {/* 5. "JUST TELL ME WHAT TO DO" (FIELD ACTION MODE) */}
        {/* ============================================================== */}
        {fieldActionMode ? (
          <div className="space-y-6 animate-in fade-in duration-200">
            
            {/* Field Mode Banner */}
            <div className="bg-amber-500 text-black px-4 py-2 rounded-xl font-black text-xs uppercase tracking-widest flex items-center justify-between">
              <span>FIELD ACTION • ON-SITE DISPATCH</span>
              <span>{cluster.reportsCount} CITIZEN REPORTS</span>
            </div>

            {/* Core Card: Minimal Field Checklist */}
            <div className="bg-zinc-900 border-2 border-zinc-700 rounded-3xl p-6 sm:p-8 space-y-6">
              
              {/* Severity & Title */}
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <span className={`px-3 py-1 rounded text-xs font-black uppercase tracking-wider ${
                    cluster.severity === 'Critical' ? 'bg-red-600 text-white' : 'bg-orange-500 text-white'
                  }`}>
                    {cluster.severity === 'Critical' ? '🔴 CRITICAL' : '🟠 HIGH'}
                  </span>
                  <span className="text-zinc-400 text-xs font-bold uppercase tracking-wider">
                    {cluster.category?.name}
                  </span>
                </div>
                <h1 className="text-3xl sm:text-4xl font-black tracking-tight text-white uppercase">
                  {cluster.title}
                </h1>
              </div>

              {/* Location */}
              <div className="bg-zinc-800/80 p-4 rounded-2xl border border-zinc-700 flex items-center justify-between">
                <div>
                  <div className="text-xs text-zinc-400 font-bold uppercase tracking-wider">LOCATION</div>
                  <div className="text-xl font-bold text-white flex items-center gap-2 mt-0.5">
                    <MapPin className="w-5 h-5 text-amber-400 shrink-0" />
                    <span>{cluster.location}, {cluster.ward}</span>
                  </div>
                  <div className="text-xs text-zinc-400 mt-1">Pincode: {cluster.pinCode}</div>
                </div>
                <a
                  href={googleMapsUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-3 bg-amber-500 hover:bg-amber-400 text-black font-bold rounded-xl flex items-center gap-1.5 text-xs uppercase tracking-wider shrink-0"
                >
                  <Navigation className="w-4 h-4" /> Go
                </a>
              </div>

              {/* People Affected & Risk */}
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-zinc-800/50 p-4 rounded-2xl border border-zinc-700/60">
                  <div className="text-xs text-zinc-400 font-bold uppercase">People Affected</div>
                  <div className="text-2xl font-black text-amber-400 mt-1">
                    ~{cluster.populationImpact.toLocaleString()}
                  </div>
                </div>
                <div className="bg-zinc-800/50 p-4 rounded-2xl border border-zinc-700/60">
                  <div className="text-xs text-zinc-400 font-bold uppercase">Safety Risk</div>
                  <div className="text-2xl font-black text-red-400 mt-1 uppercase">
                    {cluster.safetyRisk}
                  </div>
                </div>
              </div>

              {/* Action Required */}
              <div className="bg-amber-500/10 border-2 border-amber-500/40 p-6 rounded-2xl">
                <div className="text-xs font-black text-amber-400 uppercase tracking-widest mb-2 flex items-center gap-1.5">
                  <Zap className="w-4 h-4 text-amber-400 fill-amber-400" /> ACTION REQUIRED:
                </div>
                <div className="text-xl sm:text-2xl font-black text-white uppercase leading-snug">
                  {cluster.recommendedAction}
                </div>
              </div>

              {/* Quick Field Action Buttons */}
              <div className="pt-2 flex flex-col sm:flex-row gap-4">
                {currentStatus !== 'IN_PROGRESS' && currentStatus !== 'RESOLVED' && (
                  <button
                    onClick={handleStartWork}
                    className="flex-1 py-4 px-6 bg-zinc-800 hover:bg-zinc-700 text-white font-black text-sm uppercase tracking-wider rounded-2xl border border-zinc-600 transition-colors flex items-center justify-center gap-2"
                  >
                    <Check className="w-5 h-5 text-amber-400" />
                    <span>START WORK</span>
                  </button>
                )}

                {currentStatus !== 'RESOLVED' ? (
                  <button
                    onClick={() => setShowResolveModal(true)}
                    className="flex-1 py-4 px-6 bg-emerald-600 hover:bg-emerald-500 text-white font-black text-sm uppercase tracking-wider rounded-2xl transition-colors shadow-lg flex items-center justify-center gap-2"
                  >
                    <CheckCircle2 className="w-5 h-5" />
                    <span>MARK RESOLVED</span>
                  </button>
                ) : (
                  <div className="w-full py-4 bg-emerald-950 border border-emerald-600 text-emerald-300 font-bold rounded-2xl text-center flex items-center justify-center gap-2">
                    <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                    <span>PROBLEM RESOLVED & CITIZENS NOTIFIED</span>
                  </div>
                )}
              </div>

            </div>
          </div>
        ) : (
          /* ============================================================== */
          /* 4. STANDARD LOCATION-FIRST ACTION CARD (WITH PROGRESSIVE DISCLOSURE) */
          /* ============================================================== */
          <div className="space-y-6">
            
            {/* Main Action Card */}
            <div className="bg-white rounded-3xl border-2 border-slate-200 overflow-hidden shadow-sm">
              
              {/* Header Banner */}
              <div className="p-6 sm:p-8 border-b border-slate-200 bg-slate-50">
                <div className="flex flex-wrap items-center justify-between gap-3 mb-3">
                  <div className="flex items-center gap-2">
                    <span className={`px-3 py-1 rounded-md text-xs font-black uppercase tracking-wider border ${
                      cluster.severity === 'Critical'
                        ? 'bg-red-100 text-red-800 border-red-200'
                        : 'bg-orange-100 text-orange-800 border-orange-200'
                    }`}>
                      {cluster.severity === 'Critical' ? '🔴 CRITICAL' : '🟠 HIGH'} • {cluster.category?.name}
                    </span>

                    <span className="text-xs font-mono font-bold text-slate-500 bg-white px-2.5 py-0.5 rounded border border-slate-200">
                      {cluster.id}
                    </span>
                  </div>

                  {/* Status Tag */}
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Status:</span>
                    <select
                      value={currentStatus}
                      onChange={(e) => handleStatusChange(e.target.value)}
                      className="text-xs font-bold rounded-lg border border-slate-300 bg-white px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-slate-900"
                    >
                      <option value="SUBMITTED">Submitted</option>
                      <option value="ASSIGNED">Assigned</option>
                      <option value="IN_PROGRESS">In Progress</option>
                      <option value="AWAITING_RESOURCES">Awaiting Resources</option>
                      <option value="RESOLVED">Resolved</option>
                    </select>
                  </div>
                </div>

                <h1 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight uppercase mb-2">
                  {cluster.title}
                </h1>
                <p className="text-xs text-slate-500 font-medium">
                  Coalesced from {cluster.reportsCount} citizen reports • Unresolved for {cluster.unresolvedDuration}
                </p>
              </div>

              {/* Section 1: WHERE? (Location) */}
              <div className="p-6 sm:p-8 border-b border-slate-200">
                <div className="text-xs font-black uppercase tracking-wider text-amber-600 mb-2 flex items-center gap-1.5">
                  <MapPin className="w-4 h-4" /> 1. WHERE IS THE PROBLEM?
                </div>

                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-50 p-5 rounded-2xl border border-slate-200">
                  <div>
                    <h2 className="text-2xl font-black text-slate-900">
                      {cluster.location}
                    </h2>
                    <div className="text-sm font-semibold text-slate-600 mt-0.5">
                      {cluster.ward} • Pincode: {cluster.pinCode}
                    </div>
                    <div className="text-xs text-slate-500 font-mono mt-1">
                      Coordinates: {cluster.coordinates[0].toFixed(4)}°N, {cluster.coordinates[1].toFixed(4)}°E ({cluster.distanceKm} km from base)
                    </div>
                  </div>

                  <a
                    href={googleMapsUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-5 py-3 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2 shadow-sm transition-colors whitespace-nowrap"
                  >
                    <Compass className="w-4 h-4 text-amber-400" />
                    <span>Navigate to Location</span>
                  </a>
                </div>
              </div>

              {/* Section 2: WHAT IS THE PROBLEM? */}
              <div className="p-6 sm:p-8 border-b border-slate-200">
                <div className="text-xs font-black uppercase tracking-wider text-amber-600 mb-2">
                  2. WHAT IS THE PROBLEM?
                </div>
                <div className="text-base text-slate-800 font-medium leading-relaxed bg-amber-50/50 p-5 rounded-2xl border border-amber-100">
                  <p>
                    An issue regarding <strong>{cluster.title.toLowerCase()}</strong> has been reported repeatedly by multiple citizens in <strong>{cluster.location} ({cluster.ward})</strong>.
                  </p>
                  <p className="mt-2 text-sm text-slate-600">
                    Primary citizen description: <em>"{cluster.reports[0]?.description}"</em>
                  </p>
                </div>
              </div>

              {/* Section 3: WHY IS IT IMPORTANT? */}
              <div className="p-6 sm:p-8 border-b border-slate-200">
                <div className="text-xs font-black uppercase tracking-wider text-amber-600 mb-3">
                  3. WHY IS IT IMPORTANT?
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
                    <span className="text-xs font-bold text-slate-500 uppercase block mb-1">Citizen Reports</span>
                    <span className="text-2xl font-black text-slate-900">{cluster.reportsCount}</span>
                    <span className="text-xs text-slate-500 block mt-1">Confirmed reports in area</span>
                  </div>

                  <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
                    <span className="text-xs font-bold text-slate-500 uppercase block mb-1">Population Impact</span>
                    <span className="text-2xl font-black text-slate-900">~{cluster.populationImpact.toLocaleString()}</span>
                    <span className="text-xs text-slate-500 block mt-1">High pedestrian density zone</span>
                  </div>

                  <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
                    <span className="text-xs font-bold text-slate-500 uppercase block mb-1">Safety Risk</span>
                    <span className="text-2xl font-black text-red-600 uppercase">{cluster.safetyRisk}</span>
                    <span className="text-xs text-slate-500 block mt-1">Public welfare & traffic hazard</span>
                  </div>
                </div>

                {/* Section 10: "Why This Priority?" Transparent Explanation */}
                <div className="mt-4">
                  <button
                    onClick={() => setShowPriorityIntel(!showPriorityIntel)}
                    className="text-xs font-bold text-slate-600 hover:text-slate-900 flex items-center gap-1.5"
                  >
                    <span>{showPriorityIntel ? 'Hide Priority Reasoning' : 'Show "Why This Priority?" Calculation'}</span>
                    {showPriorityIntel ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                  </button>

                  {showPriorityIntel && (
                    <div className="mt-3 p-4 bg-slate-900 text-white rounded-xl text-xs space-y-2 animate-in fade-in duration-200">
                      <div className="font-bold uppercase tracking-wider text-amber-400 border-b border-slate-800 pb-1">
                        Priority Calculation Matrix (Score: {cluster.priorityScore}/100)
                      </div>
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-1">
                        <div>
                          <span className="text-slate-400 block text-[10px]">Severity Rating</span>
                          <span className="font-bold text-white">{cluster.severity} (45 pts)</span>
                        </div>
                        <div>
                          <span className="text-slate-400 block text-[10px]">Public Risk</span>
                          <span className="font-bold text-red-400">{cluster.safetyRisk} (25 pts)</span>
                        </div>
                        <div>
                          <span className="text-slate-400 block text-[10px]">Pop. Density</span>
                          <span className="font-bold text-white">{cluster.populationImpact.toLocaleString()} (18 pts)</span>
                        </div>
                        <div>
                          <span className="text-slate-400 block text-[10px]">Time Elapsed</span>
                          <span className="font-bold text-amber-300">{cluster.unresolvedDuration} (5 pts)</span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Section 4: WHAT DO I NEED TO DO? */}
              <div className="p-6 sm:p-8 border-b border-slate-200">
                <div className="text-xs font-black uppercase tracking-wider text-amber-600 mb-3">
                  4. WHAT DO I NEED TO DO?
                </div>

                <div className="space-y-3">
                  {cluster.actionChecklist.map((step, idx) => (
                    <div key={idx} className="flex items-start gap-3 bg-slate-50 p-3.5 rounded-xl border border-slate-200">
                      <div className="w-6 h-6 rounded-full bg-slate-900 text-white font-bold text-xs flex items-center justify-center shrink-0 mt-0.5">
                        {idx + 1}
                      </div>
                      <span className="text-sm font-bold text-slate-800">{step}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Section 12: Supporting Citizen Reports Drawer */}
              <div className="p-6 sm:p-8 bg-slate-50 border-b border-slate-200">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <FileText className="w-4 h-4 text-slate-500" />
                    <span className="text-xs font-bold uppercase tracking-wider text-slate-600">
                      Individual Reports ({cluster.reportsCount})
                    </span>
                  </div>
                  <button
                    onClick={() => setShowReportsDrawer(!showReportsDrawer)}
                    className="text-xs font-bold text-amber-700 hover:text-amber-800 flex items-center gap-1"
                  >
                    <span>{showReportsDrawer ? 'Hide Details' : `View ${cluster.reportsCount} Reports`}</span>
                    {showReportsDrawer ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                  </button>
                </div>

                {showReportsDrawer && (
                  <div className="mt-4 space-y-3 animate-in fade-in duration-200">
                    {cluster.reports.map((report) => (
                      <div key={report.id} className="bg-white p-4 rounded-xl border border-slate-200 text-xs shadow-sm">
                        <div className="flex justify-between items-center mb-1 font-mono text-slate-500">
                          <span className="font-bold text-slate-800">{report.id}</span>
                          <span>{new Date(report.submittedAt).toLocaleString()}</span>
                        </div>
                        <div className="font-bold text-slate-900 mb-1">{report.title}</div>
                        <p className="text-slate-700 mb-2 italic">"{report.description}"</p>
                        <div className="flex items-center gap-3 text-[11px] text-slate-500">
                          <span>Reported by: {report.citizenName}</span>
                          <span>•</span>
                          <span>Contact: {report.citizenEmail}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Primary Action Buttons */}
              <div className="p-6 sm:p-8 bg-white flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
                <a
                  href={googleMapsUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-6 py-3.5 border-2 border-slate-300 hover:border-slate-800 text-slate-700 hover:text-slate-900 rounded-xl font-bold text-xs uppercase tracking-wider transition-colors flex items-center justify-center gap-2"
                >
                  <Navigation className="w-4 h-4" />
                  <span>Navigate to Location</span>
                </a>

                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                  {currentStatus !== 'IN_PROGRESS' && currentStatus !== 'RESOLVED' && (
                    <button
                      onClick={handleStartWork}
                      className="px-6 py-3.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl font-black text-xs uppercase tracking-wider transition-colors flex items-center justify-center gap-2"
                    >
                      <Check className="w-4 h-4 text-amber-400" />
                      <span>Start Work</span>
                    </button>
                  )}

                  {currentStatus !== 'RESOLVED' ? (
                    <button
                      onClick={() => setShowResolveModal(true)}
                      className="px-8 py-3.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-black text-xs uppercase tracking-wider transition-all shadow-md flex items-center justify-center gap-2"
                    >
                      <CheckCircle2 className="w-4 h-4" />
                      <span>Mark Resolved</span>
                    </button>
                  ) : (
                    <div className="px-6 py-3.5 bg-emerald-50 text-emerald-800 border border-emerald-200 rounded-xl font-bold text-xs flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                      <span>Problem Resolved</span>
                    </div>
                  )}
                </div>
              </div>

            </div>

          </div>
        )}

        {/* ============================================================== */}
        {/* 13. COMPLETION WORKFLOW MODAL */}
        {/* ============================================================== */}
        {showResolveModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-white rounded-3xl max-w-lg w-full overflow-hidden shadow-2xl border border-slate-200 text-slate-900">
              
              {/* Modal Header */}
              <div className="p-6 bg-slate-900 text-white flex items-center justify-between">
                <div>
                  <span className="text-xs font-bold uppercase tracking-wider text-amber-400">Completion Workflow</span>
                  <h3 className="text-xl font-black tracking-tight">Resolve Civic Problem</h3>
                </div>
                <button
                  onClick={() => setShowResolveModal(false)}
                  className="text-slate-400 hover:text-white font-bold text-lg"
                >
                  ✕
                </button>
              </div>

              {/* Form */}
              <form onSubmit={handleResolveSubmit} className="p-6 space-y-5">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">
                    Problem Being Resolved
                  </label>
                  <div className="text-sm font-bold text-slate-900 bg-slate-100 p-3 rounded-xl">
                    {cluster.title} at {cluster.location} ({cluster.reportsCount} citizen complaints)
                  </div>
                </div>

                {/* Short Resolution Note */}
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                    Short Resolution Note *
                  </label>
                  <textarea
                    required
                    rows={3}
                    value={resolutionNote}
                    onChange={(e) => setResolutionNote(e.target.value)}
                    placeholder="e.g. Fixed and secured manhole cover, removed temporary barricades, tested surface."
                    className="w-full rounded-xl border border-slate-300 p-3 text-sm focus:border-slate-900 focus:outline-none focus:ring-1 focus:ring-slate-900"
                  />
                  <p className="text-[11px] text-slate-500 mt-1">
                    This note will be transmitted to all {cluster.reportsCount} reporting citizens.
                  </p>
                </div>

                {/* Completion Photo Upload */}
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                    Upload Completion Photo
                  </label>
                  
                  <div className="mt-1 flex items-center gap-4">
                    <label className="cursor-pointer px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold rounded-xl border border-slate-300 flex items-center gap-2">
                      <Camera className="w-4 h-4 text-slate-600" />
                      <span>Take / Upload Photo</span>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handlePhotoUpload}
                        className="hidden"
                      />
                    </label>

                    {photoPreview && (
                      <span className="text-xs font-semibold text-emerald-600 flex items-center gap-1">
                        <Check className="w-3.5 h-3.5" /> Photo attached
                      </span>
                    )}
                  </div>

                  {photoPreview && (
                    <div className="mt-3 relative w-32 h-20 rounded-xl overflow-hidden border border-slate-300">
                      <img src={photoPreview} alt="Resolution evidence" className="w-full h-full object-cover" />
                    </div>
                  )}
                </div>

                {/* Confirm Location Checkbox */}
                <div className="flex items-center gap-3 pt-2">
                  <input
                    type="checkbox"
                    id="confirmLocation"
                    checked={locationConfirmed}
                    onChange={(e) => setLocationConfirmed(e.target.checked)}
                    className="w-4 h-4 text-emerald-600 rounded border-slate-300 focus:ring-slate-900"
                  />
                  <label htmlFor="confirmLocation" className="text-xs font-bold text-slate-700 cursor-pointer">
                    I confirm work has been completed on-site at {cluster.location}, {cluster.ward}
                  </label>
                </div>

                {/* Submit Buttons */}
                <div className="pt-4 border-t border-slate-200 flex justify-end gap-3">
                  <button
                    type="button"
                    onClick={() => setShowResolveModal(false)}
                    className="px-5 py-2.5 border border-slate-300 rounded-xl text-xs font-bold uppercase tracking-wider text-slate-700 hover:bg-slate-50"
                  >
                    Cancel
                  </button>

                  <button
                    type="submit"
                    disabled={submitting || !locationConfirmed || !resolutionNote.trim()}
                    className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white rounded-xl text-xs font-black uppercase tracking-wider shadow-md transition-colors flex items-center gap-1.5"
                  >
                    {submitting ? 'Submitting...' : 'Confirm & Resolve'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};

export default ProblemActionCard;
