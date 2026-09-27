import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Landmark, Menu, X, User, ShieldAlert, LogOut } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';

const Header = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  
  const isCitizenRoute = location.pathname.startsWith('/citizen/');
  const isHandlerRoute = location.pathname.startsWith('/handler/');

  const handleSignOut = () => {
    logout();
    navigate('/');
  };

  return (
    <header className={`${isHandlerRoute ? 'bg-slate-900' : 'bg-white'} border-b ${isHandlerRoute ? 'border-slate-800' : 'border-gray-200'} sticky top-0 z-50`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <Link to={user?.role === 'handler' ? "/handler/dashboard" : user?.role === 'citizen' ? "/citizen/home" : "/"} className="flex items-center gap-2">
              <div className={isHandlerRoute ? "bg-amber-600 p-1.5 rounded-lg" : "bg-blue-900 p-1.5 rounded-lg"}>
                {isHandlerRoute ? <ShieldAlert className="h-6 w-6 text-white" /> : <Landmark className="h-6 w-6 text-white" />}
              </div>
              <span className={`font-semibold text-xl tracking-tight ${isHandlerRoute ? 'text-white' : 'text-gray-900'}`}>
                {isHandlerRoute ? 'Grievance Operations' : 'Citizen Portal'}
              </span>
            </Link>
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center space-x-8">
            {user?.role === 'handler' ? (
              <>
                <Link to="/handler/dashboard" className={`text-sm font-medium ${location.pathname === '/handler/dashboard' ? 'text-amber-500' : 'text-slate-300 hover:text-white'}`}>Overview</Link>
                <Link to="/handler/urgency-map" className={`text-sm font-medium ${location.pathname === '/handler/urgency-map' ? 'text-amber-500' : 'text-slate-300 hover:text-white'}`}>Urgency Map</Link>
                <Link to="/handler/priority-queue" className={`text-sm font-medium ${location.pathname === '/handler/priority-queue' ? 'text-amber-500' : 'text-slate-300 hover:text-white'}`}>Priority Queue</Link>
                <Link to="/handler/grievances" className={`text-sm font-medium ${location.pathname === '/handler/grievances' ? 'text-amber-500' : 'text-slate-300 hover:text-white'}`}>All Grievances</Link>
                <div className="h-6 border-l border-slate-700 mx-2"></div>
                <button onClick={handleSignOut} className="flex items-center gap-1 text-sm font-medium text-red-400 hover:text-red-300">
                  <LogOut className="h-4 w-4" /> Sign Out
                </button>
              </>
            ) : user?.role === 'citizen' ? (
              <>
                <Link to="/citizen/home" className={`text-sm font-medium ${location.pathname === '/citizen/home' ? 'text-blue-700' : 'text-gray-600 hover:text-gray-900'}`}>Dashboard</Link>
                <Link to="/citizen/report-grievance" className={`text-sm font-medium ${location.pathname === '/citizen/report-grievance' ? 'text-blue-700' : 'text-gray-600 hover:text-gray-900'}`}>Report Grievance</Link>
                <Link to="/citizen/grievances" className={`text-sm font-medium ${location.pathname === '/citizen/grievances' ? 'text-blue-700' : 'text-gray-600 hover:text-gray-900'}`}>Track Status</Link>
                <div className="h-6 border-l border-gray-300 mx-2"></div>
                <Link to="/citizen/profile" className="flex items-center gap-2 text-sm font-medium text-gray-700 hover:text-gray-900">
                  <User className="h-5 w-5" />
                  <span>Profile</span>
                </Link>
                <button onClick={handleSignOut} className="flex items-center gap-1 text-sm font-medium text-red-600 hover:text-red-800 ml-4">
                  <LogOut className="h-4 w-4" /> Sign Out
                </button>
              </>
            ) : (
              // Not logged in. Header is minimal on the selection/auth screens
              <Link to="/" className="text-sm font-medium text-gray-600 hover:text-gray-900">Home</Link>
            )}
          </nav>

          {/* Mobile menu button */}
          <div className="flex items-center md:hidden">
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className={`${isHandlerRoute ? 'text-slate-400 hover:text-white' : 'text-gray-500 hover:text-gray-700'} p-2`}
            >
              {isMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Navigation */}
      {isMenuOpen && (
        <div className={`md:hidden border-t ${isHandlerRoute ? 'border-slate-800 bg-slate-900' : 'border-gray-200 bg-white'}`}>
          <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3">
            {user?.role === 'handler' ? (
              <>
                <Link to="/handler/dashboard" className="block px-3 py-2 rounded-md text-base font-medium text-white hover:bg-slate-800">Overview</Link>
                <Link to="/handler/urgency-map" className="block px-3 py-2 rounded-md text-base font-medium text-white hover:bg-slate-800">Urgency Map</Link>
                <Link to="/handler/priority-queue" className="block px-3 py-2 rounded-md text-base font-medium text-white hover:bg-slate-800">Priority Queue</Link>
                <Link to="/handler/grievances" className="block px-3 py-2 rounded-md text-base font-medium text-white hover:bg-slate-800">All Grievances</Link>
                <button onClick={handleSignOut} className="block w-full text-left px-3 py-2 rounded-md text-base font-medium text-red-400 hover:bg-slate-800">Sign Out</button>
              </>
            ) : user?.role === 'citizen' ? (
              <>
                <Link to="/citizen/home" className="block px-3 py-2 rounded-md text-base font-medium text-gray-900 hover:bg-gray-50">Dashboard</Link>
                <Link to="/citizen/report-grievance" className="block px-3 py-2 rounded-md text-base font-medium text-gray-900 hover:bg-gray-50">Report Grievance</Link>
                <Link to="/citizen/grievances" className="block px-3 py-2 rounded-md text-base font-medium text-gray-900 hover:bg-gray-50">Track Status</Link>
                <Link to="/citizen/profile" className="block px-3 py-2 rounded-md text-base font-medium text-gray-900 hover:bg-gray-50">Profile</Link>
                <button onClick={handleSignOut} className="block w-full text-left px-3 py-2 rounded-md text-base font-medium text-red-600 hover:bg-red-50">Sign Out</button>
              </>
            ) : (
              <Link to="/" className="block px-3 py-2 rounded-md text-base font-medium text-gray-900 hover:bg-gray-50">Home</Link>
            )}
          </div>
        </div>
      )}
    </header>
  );
};

export default Header;
