import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Landmark, Menu, X, User, ShieldAlert, LogOut, CheckSquare, Layers, MapPin, CheckCircle, BarChart3, Home } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';

const Header = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  
  const isHandlerRoute = location.pathname.startsWith('/handler/');

  const handleSignOut = () => {
    logout();
    navigate('/');
  };

  const isHandlerActive = (path) => {
    if (path === '/handler/categories' && (location.pathname === '/handler/categories' || location.pathname.startsWith('/handler/category/'))) {
      return true;
    }
    return location.pathname === path;
  };

  return (
    <header className={`${isHandlerRoute ? 'bg-slate-900' : 'bg-white'} border-b ${isHandlerRoute ? 'border-slate-800' : 'border-gray-200'} sticky top-0 z-50`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <Link to={user?.role === 'handler' ? "/handler/categories" : user?.role === 'citizen' ? "/citizen/home" : "/"} className="flex items-center gap-2">
              <div className={isHandlerRoute ? "bg-amber-600 p-1.5 rounded-lg" : "bg-blue-900 p-1.5 rounded-lg"}>
                {isHandlerRoute ? <ShieldAlert className="h-6 w-6 text-white" /> : <Landmark className="h-6 w-6 text-white" />}
              </div>
              <div className="flex flex-col">
                <span className={`font-semibold text-lg leading-tight tracking-tight ${isHandlerRoute ? 'text-white' : 'text-gray-900'}`}>
                  {isHandlerRoute ? 'Civic Field Ops' : 'Citizen Portal'}
                </span>
                {isHandlerRoute && (
                  <span className="text-[10px] font-bold uppercase tracking-wider text-amber-400">Action Management</span>
                )}
              </div>
            </Link>
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center space-x-6">
            {user?.role === 'handler' ? (
              <>
                <Link 
                  to="/handler/dashboard" 
                  className={`text-sm font-medium transition-colors flex items-center gap-1.5 ${isHandlerActive('/handler/dashboard') ? 'text-amber-400 font-bold' : 'text-slate-300 hover:text-white'}`}
                >
                  <Home className="w-4 h-4" /> Home
                </Link>
                
                <Link 
                  to="/handler/categories" 
                  className={`text-sm font-medium transition-colors flex items-center gap-1.5 px-3 py-1.5 rounded-md ${isHandlerActive('/handler/categories') ? 'bg-amber-600 text-white font-bold shadow-sm' : 'text-slate-200 hover:text-white hover:bg-slate-800'}`}
                >
                  <Layers className="w-4 h-4" /> Categories
                </Link>
                
                <Link 
                  to="/handler/assigned" 
                  className={`text-sm font-medium transition-colors flex items-center gap-1.5 ${isHandlerActive('/handler/assigned') ? 'text-amber-400 font-bold' : 'text-slate-300 hover:text-white'}`}
                >
                  <CheckSquare className="w-4 h-4" /> My Assigned
                </Link>
                
                <Link 
                  to="/handler/urgency-map" 
                  className={`text-sm font-medium transition-colors flex items-center gap-1.5 ${isHandlerActive('/handler/urgency-map') ? 'text-amber-400 font-bold' : 'text-slate-300 hover:text-white'}`}
                >
                  <MapPin className="w-4 h-4" /> Map
                </Link>
                
                <Link 
                  to="/handler/resolved" 
                  className={`text-sm font-medium transition-colors flex items-center gap-1.5 ${isHandlerActive('/handler/resolved') ? 'text-amber-400 font-bold' : 'text-slate-300 hover:text-white'}`}
                >
                  <CheckCircle className="w-4 h-4" /> Resolved
                </Link>
                
                <Link 
                  to="/handler/priority-queue" 
                  className={`text-sm font-medium transition-colors flex items-center gap-1.5 ${isHandlerActive('/handler/priority-queue') ? 'text-amber-400 font-bold' : 'text-slate-300 hover:text-white'}`}
                >
                  <BarChart3 className="w-4 h-4" /> Analytics
                </Link>

                <div className="h-5 border-l border-slate-700 mx-1"></div>
                
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
                <Link to="/handler/dashboard" onClick={() => setIsMenuOpen(false)} className="block px-3 py-2 rounded-md text-base font-medium text-white hover:bg-slate-800">Home</Link>
                <Link to="/handler/categories" onClick={() => setIsMenuOpen(false)} className="block px-3 py-2 rounded-md text-base font-bold text-amber-400 bg-slate-800">Categories</Link>
                <Link to="/handler/assigned" onClick={() => setIsMenuOpen(false)} className="block px-3 py-2 rounded-md text-base font-medium text-white hover:bg-slate-800">My Assigned Problems</Link>
                <Link to="/handler/urgency-map" onClick={() => setIsMenuOpen(false)} className="block px-3 py-2 rounded-md text-base font-medium text-white hover:bg-slate-800">Map</Link>
                <Link to="/handler/resolved" onClick={() => setIsMenuOpen(false)} className="block px-3 py-2 rounded-md text-base font-medium text-white hover:bg-slate-800">Resolved</Link>
                <Link to="/handler/priority-queue" onClick={() => setIsMenuOpen(false)} className="block px-3 py-2 rounded-md text-base font-medium text-white hover:bg-slate-800">Analytics</Link>
                <button onClick={handleSignOut} className="block w-full text-left px-3 py-2 rounded-md text-base font-medium text-red-400 hover:bg-slate-800">Sign Out</button>
              </>
            ) : user?.role === 'citizen' ? (
              <>
                <Link to="/citizen/home" onClick={() => setIsMenuOpen(false)} className="block px-3 py-2 rounded-md text-base font-medium text-gray-900 hover:bg-gray-50">Dashboard</Link>
                <Link to="/citizen/report-grievance" onClick={() => setIsMenuOpen(false)} className="block px-3 py-2 rounded-md text-base font-medium text-gray-900 hover:bg-gray-50">Report Grievance</Link>
                <Link to="/citizen/grievances" onClick={() => setIsMenuOpen(false)} className="block px-3 py-2 rounded-md text-base font-medium text-gray-900 hover:bg-gray-50">Track Status</Link>
                <Link to="/citizen/profile" onClick={() => setIsMenuOpen(false)} className="block px-3 py-2 rounded-md text-base font-medium text-gray-900 hover:bg-gray-50">Profile</Link>
                <button onClick={handleSignOut} className="block w-full text-left px-3 py-2 rounded-md text-base font-medium text-red-600 hover:bg-red-50">Sign Out</button>
              </>
            ) : (
              <Link to="/" onClick={() => setIsMenuOpen(false)} className="block px-3 py-2 rounded-md text-base font-medium text-gray-900 hover:bg-gray-50">Home</Link>
            )}
          </div>
        </div>
      )}
    </header>
  );
};

export default Header;
