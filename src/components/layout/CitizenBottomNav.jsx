import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Home, PlusCircle, Activity } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';

const CitizenBottomNav = () => {
  const { user } = useAuth();
  const location = useLocation();

  const isCitizen = user?.role === 'citizen';
  const isCitizenPath = location.pathname.startsWith('/citizen/');
  const isAuthPath = location.pathname === '/citizen/sign-in' || location.pathname === '/citizen/register';

  if (!isCitizen || !isCitizenPath || isAuthPath) {
    return null;
  }

  const isDashboardActive = location.pathname === '/citizen/home';
  const isReportActive = location.pathname === '/citizen/report-grievance';
  const isTrackActive =
    location.pathname === '/citizen/grievances' || location.pathname.startsWith('/citizen/grievance/');

  return (
    <>
      <nav
        aria-label="Primary"
        className="fixed bottom-4 left-1/2 -translate-x-1/2 z-[1200] max-w-[calc(100vw-2rem)] select-none"
        style={{ bottom: 'calc(1rem + env(safe-area-inset-bottom, 0px))' }}
      >
        <div className="bg-white/95 backdrop-blur-md border border-gray-200 shadow-lg rounded-full p-1.5 flex items-center gap-1 sm:gap-2">
          {/* Dashboard */}
          <Link
            to="/citizen/home"
            aria-current={isDashboardActive ? 'page' : undefined}
            className={`min-h-[44px] px-3 sm:px-4 py-1.5 rounded-full flex flex-col sm:flex-row items-center justify-center gap-1 sm:gap-2 text-xs sm:text-sm transition-colors ${
              isDashboardActive
                ? 'text-blue-700 bg-blue-50 font-semibold'
                : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100 font-medium'
            }`}
          >
            <Home className="h-4 w-4 shrink-0" />
            <span className="leading-tight">Dashboard</span>
          </Link>

          {/* Report Grievance (Primary Item) */}
          <Link
            to="/citizen/report-grievance"
            aria-current={isReportActive ? 'page' : undefined}
            className={`min-h-[44px] px-3.5 sm:px-5 py-1.5 rounded-full flex flex-col sm:flex-row items-center justify-center gap-1 sm:gap-2 text-xs sm:text-sm font-semibold transition-all shadow-sm ${
              isReportActive
                ? 'bg-blue-800 text-white ring-2 ring-blue-500 ring-offset-1'
                : 'bg-blue-700 text-white hover:bg-blue-800'
            }`}
          >
            <PlusCircle className="h-4 w-4 shrink-0" />
            <span className="leading-tight whitespace-nowrap">Report Grievance</span>
          </Link>

          {/* Track Status */}
          <Link
            to="/citizen/grievances"
            aria-current={isTrackActive ? 'page' : undefined}
            className={`min-h-[44px] px-3 sm:px-4 py-1.5 rounded-full flex flex-col sm:flex-row items-center justify-center gap-1 sm:gap-2 text-xs sm:text-sm transition-colors ${
              isTrackActive
                ? 'text-blue-700 bg-blue-50 font-semibold'
                : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100 font-medium'
            }`}
          >
            <Activity className="h-4 w-4 shrink-0" />
            <span className="leading-tight whitespace-nowrap">Track Status</span>
          </Link>
        </div>
      </nav>
      <div aria-hidden="true" className="h-24 bg-gray-900" />
    </>
  );
};

export default CitizenBottomNav;
