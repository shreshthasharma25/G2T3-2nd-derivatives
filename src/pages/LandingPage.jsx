import React from 'react';
import { Link, Navigate } from 'react-router-dom';
import { User, ShieldAlert, ChevronRight } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

const LandingPage = () => {
  const { user } = useAuth();

  // If already logged in, redirect to correct dashboard
  if (user) {
    if (user.role === 'handler') {
      return <Navigate to="/handler/dashboard" replace />;
    } else if (user.role === 'citizen') {
      return <Navigate to="/citizen/home" replace />;
    }
  }

  return (
    <div className="min-h-[calc(100vh-4rem)] flex flex-col items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl w-full space-y-12 text-center">
        
        <div>
          <h1 className="mt-2 text-4xl font-extrabold text-gray-900 tracking-tight sm:text-5xl">
            Select your portal
          </h1>
          <p className="mt-4 text-xl text-gray-500 max-w-2xl mx-auto">
            Welcome to the unified Civic Grievance Management System. Please choose how you would like to continue.
          </p>
        </div>

        <div className="mt-10 grid grid-cols-1 gap-8 sm:grid-cols-2 max-w-3xl mx-auto">
          
          {/* Citizen Portal Option */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-shadow group flex flex-col">
            <div className="p-8 flex-grow">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform">
                <User className="w-8 h-8 text-blue-700" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-3">Citizen</h2>
              <p className="text-gray-600 text-center">
                Report civic issues, track your grievances, and stay updated on resolutions.
              </p>
            </div>
            <div className="px-8 pb-8 pt-4">
              <Link 
                to="/citizen/sign-in" 
                className="w-full flex items-center justify-center px-8 py-4 border border-transparent text-base font-medium rounded-lg text-white bg-blue-700 hover:bg-blue-800 transition-colors"
              >
                Continue as Citizen
                <ChevronRight className="ml-2 w-5 h-5" />
              </Link>
              <div className="mt-3 text-center">
                <Link 
                  to="/citizen/register" 
                  className="text-xs font-semibold text-blue-700 hover:text-blue-900 hover:underline"
                >
                  New citizen? Register an account
                </Link>
              </div>
            </div>
          </div>

          {/* Handler Portal Option */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-shadow group flex flex-col">
            <div className="p-8 flex-grow">
              <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform">
                <ShieldAlert className="w-8 h-8 text-slate-700" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-3">Grievance Handler</h2>
              <p className="text-gray-600 text-center">
                Review, prioritize, and manage citizen grievances across the operational dashboard.
              </p>
            </div>
            <div className="px-8 pb-8 pt-4">
              <Link 
                to="/handler/sign-in" 
                className="w-full flex items-center justify-center px-8 py-4 border border-transparent text-base font-medium rounded-lg text-white bg-slate-800 hover:bg-slate-900 transition-colors"
              >
                Continue as Handler
                <ChevronRight className="ml-2 w-5 h-5" />
              </Link>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};

export default LandingPage;
