import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import ProtectedRoute from './components/common/ProtectedRoute';
import AppLayout from './components/layout/AppLayout';
import Dashboard from './pages/Dashboard';
import RepositoryAnalysis from './pages/RepositoryAnalysis';
import History from './pages/History';
import Settings from './pages/Settings';
import Login from './pages/Login';
import Signup from './pages/Signup';

export function App() {
  return (
    <Routes>
      {/* Public routes */}
      <Route path="/login" element={<Login />} />
      <Route path="/signup" element={<Signup />} />

      {/* Protected routes — require login */}
      <Route
        path="/"
        element={
          <ProtectedRoute>
            <AppLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<Dashboard />} />
        <Route path="analysis" element={<RepositoryAnalysis />} />
        <Route path="analysis/:repoId" element={<RepositoryAnalysis />} />
        <Route path="history" element={<History />} />
        <Route path="settings" element={<Settings />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  );
}

export default App;
