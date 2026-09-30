import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { grievanceService } from '../../services/grievanceService';
import { grievanceCategories } from '../../data/grievanceCategories';
import { clusterGrievances, getCategoryClusterStats, getSolveTogetherGroups } from '../../utils/problemClustering';
import { 
  ShieldAlert, 
  Droplet, 
  Trash2, 
  Map, 
  Zap, 
  CloudRain, 
  Lightbulb, 
  Bus, 
  HelpCircle, 
  ArrowRight, 
  Layers, 
  MapPin, 
  Flame 
} from 'lucide-react';

const ICON_MAP = {
  ShieldAlert,
  Droplet,
  Trash2,
  Map,
  Zap,
  CloudRain,
  Lightbulb,
  Bus,
  HelpCircle
};

const HandlerCategoriesHome = () => {
  const navigate = useNavigate();
  const [clusters, setClusters] = useState([]);
  const [stats, setStats] = useState({});
  const [solveTogetherList, setSolveTogetherList] = useState([]);

  const loadData = useCallback(() => {
    const rawGrievances = grievanceService.getAllGrievances();
    const clustered = clusterGrievances(rawGrievances);
    setClusters(clustered);
    setStats(getCategoryClusterStats(clustered));
    setSolveTogetherList(getSolveTogetherGroups(clustered));
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const activeClusters = clusters.filter(c => c.status !== 'RESOLVED' && c.status !== 'CLOSED');
  const criticalClusters = activeClusters.filter(c => c.severity === 'Critical');

  // Primary categories featured in specification
  const featuredCategoryIds = ['public_safety', 'water', 'sanitation', 'roads', 'electricity', 'drainage'];
  
  const featuredCategories = grievanceCategories.filter(c => featuredCategoryIds.includes(c.id));
  const otherCategories = grievanceCategories.filter(c => !featuredCategoryIds.includes(c.id));

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-slate-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto">
        
        {/* Header / Workflow Banner */}
        <div className="mb-8">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200 pb-6">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-100 text-amber-900 text-xs font-bold uppercase tracking-wider mb-2">
                <Layers className="w-3.5 h-3.5" /> Step 1: Select Category
              </div>
              <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
                WHAT TYPE OF PROBLEM DO YOU WANT TO HANDLE?
              </h1>
              <p className="text-slate-600 mt-2 text-base max-w-2xl font-medium">
                Choose a civic department below. The system automatically clusters individual citizen reports into field-actionable civic tasks.
              </p>
            </div>

            {/* Quick Status Pill */}
            <div className="flex items-center gap-3 bg-white p-3 rounded-xl border border-slate-200 shadow-sm shrink-0">
              <div className="w-10 h-10 rounded-lg bg-amber-500/10 flex items-center justify-center text-amber-600 font-bold text-lg">
                {activeClusters.length}
              </div>
              <div>
                <div className="text-xs font-bold text-slate-500 uppercase tracking-wider">Active Problems</div>
                <div className="text-sm font-bold text-slate-800">Across Kolkata</div>
              </div>
            </div>
          </div>

          {/* Operational Highlight: Critical Alert Banner if any */}
          {criticalClusters.length > 0 && (
            <div className="mt-6 bg-red-600 text-white rounded-xl p-4 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-red-700 rounded-lg">
                  <Flame className="w-6 h-6 text-white animate-pulse" />
                </div>
                <div>
                  <h3 className="font-bold text-base leading-tight">
                    {criticalClusters.length} CRITICAL HAZARD{criticalClusters.length > 1 ? 'S' : ''} REQUIRE IMMEDIATE FIELD DISPATCH
                  </h3>
                  <p className="text-red-100 text-xs mt-0.5">
                    Highest priority: {criticalClusters[0].title} at {criticalClusters[0].location} ({criticalClusters[0].reportsCount} citizen reports)
                  </p>
                </div>
              </div>
              <button
                onClick={() => navigate(`/handler/problem/${criticalClusters[0].id}`)}
                className="px-4 py-2 bg-white text-red-700 hover:bg-red-50 font-bold text-xs uppercase tracking-wider rounded-lg transition-colors shadow-sm whitespace-nowrap self-stretch sm:self-auto text-center"
              >
                Go to Critical Problem &rarr;
              </button>
            </div>
          )}
        </div>

        {/* 6 Core Category Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-10">
          {featuredCategories.map((cat) => {
            const catStats = stats[cat.id] || { activeProblemsCount: 0, criticalCount: 0, totalReports: 0 };
            const count = catStats.activeProblemsCount;
            const hasCritical = catStats.criticalCount > 0;

            return (
              <div
                key={cat.id}
                onClick={() => navigate(`/handler/category/${cat.id}`)}
                className={`
                  group relative bg-white rounded-2xl border-2 p-6 cursor-pointer shadow-sm transition-all duration-200
                  hover:shadow-xl hover:-translate-y-1 hover:border-slate-800
                  ${hasCritical ? 'border-red-300 ring-2 ring-red-100' : 'border-slate-200'}
                `}
              >
                {/* Top Badge */}
                <div className="flex items-start justify-between mb-6">
                  <div className="flex items-center gap-3">
                    <span className="text-3xl" role="img" aria-label={cat.name}>
                      {cat.emoji}
                    </span>
                    <div>
                      <h2 className="text-2xl font-black text-slate-900 tracking-tight group-hover:text-amber-600 transition-colors uppercase">
                        {cat.name}
                      </h2>
                      <span className="text-xs text-slate-500 font-medium">{cat.fullName}</span>
                    </div>
                  </div>

                  {hasCritical && (
                    <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-bold bg-red-100 text-red-700 border border-red-200 animate-pulse">
                      🔴 Critical
                    </span>
                  )}
                </div>

                {/* Main Problem Counter */}
                <div className="bg-slate-50 rounded-xl p-5 border border-slate-100 mb-6 group-hover:bg-amber-50/50 group-hover:border-amber-200 transition-colors">
                  <div className="flex items-baseline gap-2">
                    <span className="text-4xl font-black text-slate-900 font-mono tracking-tight">
                      {count}
                    </span>
                    <span className="text-base font-bold text-slate-600">
                      active {count === 1 ? 'problem' : 'problems'}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 mt-1">
                    aggregated from {catStats.totalReports} citizen {catStats.totalReports === 1 ? 'report' : 'reports'}
                  </p>
                </div>

                {/* Subcategory Preview Chips */}
                <div className="flex flex-wrap gap-1.5 mb-6">
                  {cat.subCategories.slice(0, 3).map((sub) => (
                    <span
                      key={sub}
                      className="text-[11px] font-medium bg-slate-100 text-slate-600 px-2 py-0.5 rounded-md"
                    >
                      {sub}
                    </span>
                  ))}
                  {cat.subCategories.length > 3 && (
                    <span className="text-[11px] text-slate-400 font-medium px-1">
                      +{cat.subCategories.length - 3} more
                    </span>
                  )}
                </div>

                {/* CTA Button */}
                <div className="flex items-center justify-between pt-4 border-t border-slate-100">
                  <span className="text-sm font-bold text-slate-800 group-hover:text-amber-600 transition-colors">
                    See Civic Problems
                  </span>
                  <div className="w-8 h-8 rounded-full bg-slate-100 group-hover:bg-slate-900 group-hover:text-white flex items-center justify-center transition-colors">
                    <ArrowRight className="w-4 h-4 text-slate-600 group-hover:text-white" />
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Additional Secondary Categories (Transport, Lighting, Other) */}
        {otherCategories.length > 0 && (
          <div className="mb-12">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-4">
              Other Public Categories
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {otherCategories.map((cat) => {
                const catStats = stats[cat.id] || { activeProblemsCount: 0 };
                return (
                  <div
                    key={cat.id}
                    onClick={() => navigate(`/handler/category/${cat.id}`)}
                    className="bg-white border border-slate-200 hover:border-slate-800 p-4 rounded-xl cursor-pointer flex items-center justify-between shadow-sm hover:shadow transition-all"
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-xl">{cat.emoji}</span>
                      <div>
                        <div className="text-sm font-bold text-slate-900">{cat.name}</div>
                        <div className="text-xs text-slate-500">{catStats.activeProblemsCount} active</div>
                      </div>
                    </div>
                    <ArrowRight className="w-4 h-4 text-slate-400" />
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Operational "Solve Together" Callout Banner */}
        {solveTogetherList.length > 0 && (
          <div className="bg-amber-50 border border-amber-200 rounded-2xl p-6 shadow-sm">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-amber-500 text-white rounded-xl shadow-sm">
                  <MapPin className="w-6 h-6" />
                </div>
                <div>
                  <div className="text-xs font-bold uppercase tracking-wider text-amber-800">
                    Field Efficiency Alert • Solve Together
                  </div>
                  <h3 className="text-lg font-bold text-slate-900">
                    {solveTogetherList[0].count} civic problems are co-located in {solveTogetherList[0].areaKey}
                  </h3>
                  <p className="text-sm text-slate-600">
                    Resolve multiple adjacent tasks during a single field visit.
                  </p>
                </div>
              </div>
              <button
                onClick={() => navigate(`/handler/category/public_safety?area=${encodeURIComponent(solveTogetherList[0].location)}`)}
                className="px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold uppercase tracking-wider rounded-lg shadow-sm transition-colors whitespace-nowrap"
              >
                View Area Problems &rarr;
              </button>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};

export default HandlerCategoriesHome;
