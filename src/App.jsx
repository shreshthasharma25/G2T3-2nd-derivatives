import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { ProtectedRoute } from './components/common/ProtectedRoute';
import Header from './components/layout/Header';
import Footer from './components/layout/Footer';
import CitizenBottomNav from './components/layout/CitizenBottomNav';

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

// Handler (Field Action Workflow)
import HandlerDashboard from './pages/handler/HandlerDashboard';
import HandlerCategoriesHome from './pages/handler/HandlerCategoriesHome';
import CategoryProblemList from './pages/handler/CategoryProblemList';
import ProblemActionCard from './pages/handler/ProblemActionCard';
import MyAssignedProblems from './pages/handler/MyAssignedProblems';
import ResolvedProblems from './pages/handler/ResolvedProblems';
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
    <CitizenBottomNav />
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
            
            {/* Handler Protected Routes (Field Action Redesign) */}
            <Route path="/handler/dashboard" element={<ProtectedRoute requiredRole="handler"><HandlerDashboard /></ProtectedRoute>} />
            <Route path="/handler/categories" element={<ProtectedRoute requiredRole="handler"><HandlerCategoriesHome /></ProtectedRoute>} />
            <Route path="/handler/category/:categoryId" element={<ProtectedRoute requiredRole="handler"><CategoryProblemList /></ProtectedRoute>} />
            <Route path="/handler/problem/:clusterId" element={<ProtectedRoute requiredRole="handler"><ProblemActionCard /></ProtectedRoute>} />
            <Route path="/handler/assigned" element={<ProtectedRoute requiredRole="handler"><MyAssignedProblems /></ProtectedRoute>} />
            <Route path="/handler/resolved" element={<ProtectedRoute requiredRole="handler"><ResolvedProblems /></ProtectedRoute>} />
            <Route path="/handler/urgency-map" element={<ProtectedRoute requiredRole="handler"><UrgencyMap /></ProtectedRoute>} />
            <Route path="/handler/map" element={<Navigate to="/handler/urgency-map" replace />} />
            <Route path="/handler/priority-queue" element={<ProtectedRoute requiredRole="handler"><PriorityQueue /></ProtectedRoute>} />
            <Route path="/handler/grievances" element={<ProtectedRoute requiredRole="handler"><AllGrievances /></ProtectedRoute>} />
            <Route path="/handler/grievance/:id" element={<ProtectedRoute requiredRole="handler"><HandlerGrievanceDetails /></ProtectedRoute>} />

            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </AppLayout>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
