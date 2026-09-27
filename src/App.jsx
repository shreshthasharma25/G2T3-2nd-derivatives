import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { ProtectedRoute } from './components/common/ProtectedRoute';
import Header from './components/layout/Header';
import Footer from './components/layout/Footer';

// Public
import LandingPage from './pages/LandingPage';
import CitizenSignIn from './pages/citizen/CitizenSignIn';
import CitizenRegistration from './pages/citizen/CitizenRegistration';
import HandlerSignIn from './pages/handler/HandlerSignIn';

// Citizen
import CitizenDashboard from './pages/citizen/CitizenDashboard';
import ReportGrievance from './pages/citizen/ReportGrievance';
import MyGrievances from './pages/citizen/MyGrievances';
import GrievanceDetails from './pages/citizen/GrievanceDetails';
import CitizenProfile from './pages/citizen/CitizenProfile';

// Handler
import HandlerDashboard from './pages/handler/HandlerDashboard';
import UrgencyMap from './pages/handler/UrgencyMap';
import AllGrievances from './pages/handler/AllGrievances';
import PriorityQueue from './pages/handler/PriorityQueue';
import HandlerGrievanceDetails from './pages/handler/HandlerGrievanceDetails';

const AppLayout = ({ children }) => (
  <div className="flex flex-col min-h-screen bg-gray-50">
    <Header />
    <main className="flex-grow">
      {children}
    </main>
    <Footer />
  </div>
);

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <AppLayout>
          <Routes>
            {/* Public Role Selection & Auth */}
            <Route path="/" element={<LandingPage />} />
            <Route path="/citizen/sign-in" element={<CitizenSignIn />} />
            <Route path="/citizen/register" element={<CitizenRegistration />} />
            <Route path="/handler/sign-in" element={<HandlerSignIn />} />
            
            {/* Citizen Protected Routes */}
            <Route path="/citizen/home" element={<ProtectedRoute requiredRole="citizen"><CitizenDashboard /></ProtectedRoute>} />
            <Route path="/citizen/report-grievance" element={<ProtectedRoute requiredRole="citizen"><ReportGrievance /></ProtectedRoute>} />
            <Route path="/citizen/grievances" element={<ProtectedRoute requiredRole="citizen"><MyGrievances /></ProtectedRoute>} />
            <Route path="/citizen/grievance/:id" element={<ProtectedRoute requiredRole="citizen"><GrievanceDetails /></ProtectedRoute>} />
            <Route path="/citizen/profile" element={<ProtectedRoute requiredRole="citizen"><CitizenProfile /></ProtectedRoute>} />
            
            {/* Handler Protected Routes */}
            <Route path="/handler/dashboard" element={<ProtectedRoute requiredRole="handler"><HandlerDashboard /></ProtectedRoute>} />
            <Route path="/handler/urgency-map" element={<ProtectedRoute requiredRole="handler"><UrgencyMap /></ProtectedRoute>} />
            <Route path="/handler/grievances" element={<ProtectedRoute requiredRole="handler"><AllGrievances /></ProtectedRoute>} />
            <Route path="/handler/priority-queue" element={<ProtectedRoute requiredRole="handler"><PriorityQueue /></ProtectedRoute>} />
            <Route path="/handler/grievance/:id" element={<ProtectedRoute requiredRole="handler"><HandlerGrievanceDetails /></ProtectedRoute>} />

            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </AppLayout>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
