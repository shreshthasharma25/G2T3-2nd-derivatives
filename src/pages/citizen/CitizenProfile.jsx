import React, { useState } from 'react';
import { User, Mail, Phone, MapPin, Save, LogOut } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';

const CitizenProfile = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [isEditing, setIsEditing] = useState(false);
  const [profile, setProfile] = useState(user || {});
  const [saved, setSaved] = useState(false);

  // In a real app, we'd update user context via authService. 
  // For this prototype, we're just reading the user context.

  if (!user) return null;

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8 flex justify-between items-end">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">My Profile</h1>
          <p className="text-gray-600 mt-1">Manage your personal information and contact details.</p>
        </div>
        <button 
          onClick={() => { logout(); navigate('/'); }}
          className="flex items-center gap-2 px-4 py-2 border border-red-200 text-red-600 rounded-md hover:bg-red-50 text-sm font-medium transition-colors"
        >
          <LogOut className="h-4 w-4" /> Sign Out
        </button>
      </div>

      <div className="bg-white shadow-sm border border-gray-200 rounded-lg overflow-hidden">
        <form onSubmit={(e) => { e.preventDefault(); setIsEditing(false); setSaved(true); setTimeout(() => setSaved(false), 3000); }}>
          <div className="p-6 sm:p-8 space-y-8">
            
            {/* Profile Header */}
            <div className="flex items-center">
              <div className="h-20 w-20 rounded-full bg-blue-100 flex items-center justify-center border-4 border-white shadow-sm">
                <span className="text-3xl font-bold text-blue-700">{profile.name?.charAt(0)}</span>
              </div>
              <div className="ml-6 flex-1">
                <h2 className="text-2xl font-bold text-gray-900">{profile.name}</h2>
                <p className="text-gray-500">Citizen ID: {profile.id} • Joined {new Date(profile.joinDate || Date.now()).getFullYear()}</p>
              </div>
            </div>

            <div className="border-t border-gray-200 pt-8 grid grid-cols-1 md:grid-cols-2 gap-8">
              {/* Personal Information */}
              <div className="space-y-6">
                <h3 className="text-lg font-medium text-gray-900 flex items-center">
                  <User className="h-5 w-5 text-gray-400 mr-2" /> Personal Information
                </h3>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700">Full Name</label>
                  <p className="mt-1 text-gray-900 font-medium">{profile.name}</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Email Address</label>
                  <div className="mt-1 flex items-center text-gray-900 font-medium">
                    <Mail className="h-4 w-4 text-gray-400 mr-2" />
                    {profile.email}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Mobile Number</label>
                  <div className="mt-1 flex items-center text-gray-900 font-medium">
                    <Phone className="h-4 w-4 text-gray-400 mr-2" />
                    {profile.mobile}
                  </div>
                </div>
              </div>

              {/* Address Information */}
              <div className="space-y-6">
                <h3 className="text-lg font-medium text-gray-900 flex items-center">
                  <MapPin className="h-5 w-5 text-gray-400 mr-2" /> Default Address
                </h3>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700">Address Line</label>
                  <p className="mt-1 text-gray-900 font-medium">{profile.address}</p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">City</label>
                    <p className="mt-1 text-gray-900 font-medium">{profile.city}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">PIN Code</label>
                    <p className="mt-1 text-gray-900 font-medium">{profile.pinCode}</p>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">State</label>
                  <p className="mt-1 text-gray-900 font-medium">{profile.state}</p>
                </div>
              </div>
            </div>
          </div>
          
        </form>
      </div>
    </div>
  );
};

export default CitizenProfile;
