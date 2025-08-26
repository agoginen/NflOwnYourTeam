import React, { useEffect } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';

// Layout Components
import Layout from './components/layout/Layout';
import AuthLayout from './components/layout/AuthLayout';

// Page Components
import HomePage from './pages/HomePage';
import LoginPage from './pages/auth/LoginPage';
import RegisterPage from './pages/auth/RegisterPage';
import DashboardPage from './pages/DashboardPage';
import LeaguesPage from './pages/leagues/LeaguesPage';
import LeagueDetailPage from './pages/leagues/LeagueDetailPage';
import CreateLeaguePage from './pages/leagues/CreateLeaguePage';
import JoinLeaguePage from './pages/leagues/JoinLeaguePage';
import AuctionPage from './pages/auction/AuctionPage';
import TeamsPage from './pages/TeamsPage';
import StandingsPage from './pages/StandingsPage';
import ProfilePage from './pages/ProfilePage';
import RulesPage from './pages/RulesPage';
import NotFoundPage from './pages/NotFoundPage';

// Admin Pages
import AdminDashboard from './pages/admin/AdminDashboard';
import AdminUsers from './pages/admin/AdminUsers';
import AdminLeagues from './pages/admin/AdminLeagues';
import AdminNFLData from './pages/admin/AdminNFLData';

// Protected Route Component
import ProtectedRoute from './components/auth/ProtectedRoute';
import AdminRoute from './components/auth/AdminRoute';

// Services
import { checkAuthStatus } from './store/slices/authSlice';
import { socketService } from './services/socketService';
import { store } from './store';

function App() {
  const dispatch = useDispatch();
  const { isAuthenticated, user } = useSelector(state => state.auth);

  useEffect(() => {
    // Initialize socket service with store
    socketService.initializeStore(store);
    
    // Check authentication status on app load
    dispatch(checkAuthStatus());
  }, [dispatch]);

  useEffect(() => {
    // Initialize socket connection if authenticated
    if (isAuthenticated && user) {
      socketService.connect(user.id);
    } else {
      socketService.disconnect();
    }

    return () => {
      socketService.disconnect();
    };
  }, [isAuthenticated, user]);

  return (
    <div className="App min-h-screen bg-gray-50">
      <Routes>
        {/* Public Routes */}
        <Route path="/" element={<Layout />}>
          <Route index element={<HomePage />} />
          <Route path="rules" element={<RulesPage />} />
          <Route path="teams" element={<TeamsPage />} />
        </Route>

        {/* Auth Routes */}
        <Route path="/auth" element={<AuthLayout />}>
          <Route path="login" element={<LoginPage />} />
          <Route path="register" element={<RegisterPage />} />
        </Route>

        {/* Protected Routes */}
        <Route path="/app" element={
          <ProtectedRoute>
            <Layout />
          </ProtectedRoute>
        }>
          <Route index element={<Navigate to="/app/dashboard" replace />} />
          <Route path="dashboard" element={<DashboardPage />} />
          <Route path="profile" element={<ProfilePage />} />
          
          {/* League Routes */}
          <Route path="leagues" element={<LeaguesPage />} />
          <Route path="leagues/create" element={<CreateLeaguePage />} />
          <Route path="leagues/join" element={<JoinLeaguePage />} />
          <Route path="leagues/:id" element={<LeagueDetailPage />} />
          <Route path="leagues/:id/standings" element={<StandingsPage />} />
          
          {/* Auction Routes */}
          <Route path="auctions/:id" element={<AuctionPage />} />
        </Route>

        {/* Admin Routes */}
        <Route path="/admin" element={
          <AdminRoute>
            <Layout />
          </AdminRoute>
        }>
          <Route index element={<Navigate to="/admin/dashboard" replace />} />
          <Route path="dashboard" element={<AdminDashboard />} />
          <Route path="users" element={<AdminUsers />} />
          <Route path="leagues" element={<AdminLeagues />} />
          <Route path="nfl-data" element={<AdminNFLData />} />
        </Route>

        {/* Catch all route */}
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </div>
  );
}

export default App;
