import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

export const ProtectedRoute = ({ children, requiredRole }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  }

  if (!user) {
    // Redirect to respective login based on requested path role
    return <Navigate to={requiredRole === 'handler' ? '/handler/sign-in' : '/citizen/sign-in'} replace />;
  }

  if (requiredRole && user.role !== requiredRole) {
    // Role mismatch
    return <Navigate to="/" replace />;
  }

  return children;
};
