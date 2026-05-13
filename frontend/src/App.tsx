import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ProtectedRoute } from './router/ProtectedRoute';
import { LoginPage } from './pages/auth/LoginPage';
import { RegisterPage } from './pages/auth/RegisterPage';
import { DashboardPage } from './pages/dashboard/DashboardPage';
import { DomainsListPage } from './pages/domains/DomainsListPage';
import { DomainDetailPage } from './pages/domains/DomainDetailPage';
import { SeedTestPage } from './pages/seed-tests/SeedTestPage';
import { AlertsPage } from './pages/alerts/AlertsPage';

const App: React.FC = () => {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          
          <Route element={<ProtectedRoute />}>
            <Route path="/" element={<DashboardPage />} />
            <Route path="/domains" element={<DomainsListPage />} />
            <Route path="/domains/:id" element={<DomainDetailPage />} />
            <Route path="/domains/:id/seed-test" element={<SeedTestPage />} />
            <Route path="/alerts" element={<AlertsPage />} />
            <Route path="/settings" element={<div className="p-8 text-center text-zinc-400">Settings coming soon</div>} />
          </Route>
          
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
};

export default App;
