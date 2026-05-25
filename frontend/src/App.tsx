import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ProtectedRoute } from './router/ProtectedRoute';
import { LoginPage } from './pages/auth/LoginPage';
import { RegisterPage } from './pages/auth/RegisterPage';
import { OAuthCallback } from './pages/auth/OAuthCallback';
import { DashboardPage } from './pages/dashboard/DashboardPage';
import { DomainsListPage } from './pages/domains/DomainsListPage';
import { DomainDetailPage } from './pages/domains/DomainDetailPage';
import { SeedTestPage } from './pages/seed-tests/SeedTestPage';
import { AlertsPage } from './pages/alerts/AlertsPage';
import { ProfilePage } from './pages/settings/ProfilePage';
import { Toaster } from 'react-hot-toast';

const App: React.FC = () => {
  return (
    <AuthProvider>
      <Toaster 
        position="top-right" 
        toastOptions={{
          style: {
            background: '#18181b',
            color: '#fff',
            border: '1px solid #27272a',
          }
        }} 
      />
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/oauth/callback" element={<OAuthCallback />} />
          
          <Route element={<ProtectedRoute />}>
            <Route path="/" element={<DashboardPage />} />
            <Route path="/domains" element={<DomainsListPage />} />
            <Route path="/domains/:id" element={<DomainDetailPage />} />
            <Route path="/domains/:id/seed-test" element={<SeedTestPage />} />
            <Route path="/alerts" element={<AlertsPage />} />
            <Route path="/settings" element={<ProfilePage />} />
          </Route>
          
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
};

export default App;
