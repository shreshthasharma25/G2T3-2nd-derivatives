import React from 'react';
import { Link } from 'react-router-dom';
import { Landmark } from 'lucide-react';

const Footer = () => {
  return (
    <footer className="bg-gray-900 text-white mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div className="col-span-1 md:col-span-2">
            <div className="flex items-center gap-2 mb-4">
              <Landmark className="h-6 w-6 text-blue-400" />
              <span className="font-semibold text-xl tracking-tight">Citizen Grievance Portal</span>
            </div>
            <p className="text-gray-400 text-sm max-w-sm">
              The official portal for citizens to report, track, and resolve civic issues in their locality. Working together for a better community.
            </p>
          </div>
          
          <div>
            <h3 className="text-sm font-semibold uppercase tracking-wider text-gray-300 mb-4">Quick Links</h3>
            <ul className="space-y-2">
              <li><Link to="/" className="text-gray-400 hover:text-white text-sm">Home</Link></li>
              <li><Link to="/citizen/sign-in" className="text-gray-400 hover:text-white text-sm">Sign In</Link></li>
              <li><Link to="/citizen/register" className="text-gray-400 hover:text-white text-sm">Register</Link></li>
              <li><Link to="#" className="text-gray-400 hover:text-white text-sm">Help & Support</Link></li>
            </ul>
          </div>
          
          <div>
            <h3 className="text-sm font-semibold uppercase tracking-wider text-gray-300 mb-4">Legal</h3>
            <ul className="space-y-2">
              <li><Link to="#" className="text-gray-400 hover:text-white text-sm">Privacy Policy</Link></li>
              <li><Link to="#" className="text-gray-400 hover:text-white text-sm">Terms of Service</Link></li>
              <li><Link to="#" className="text-gray-400 hover:text-white text-sm">Accessibility Statement</Link></li>
            </ul>
          </div>
        </div>
        <div className="border-t border-gray-800 mt-12 pt-8 flex flex-col md:flex-row justify-between items-center">
          <p className="text-gray-400 text-sm">
            &copy; {new Date().getFullYear()} Civic Services Department. All rights reserved.
          </p>
          <p className="text-gray-500 text-xs mt-2 md:mt-0">
            For emergencies, please dial your local emergency numbers.
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
