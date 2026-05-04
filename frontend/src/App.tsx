import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ProtectedRoute } from './router/ProtectedRoute';
import { LoginPage } from './pages/auth/LoginPage';
import { RegisterPage } from './pages/auth/RegisterPage';
import { DashboardPage } from './pages/dashboard/DashboardPage';
import { DomainsListPage } from './pages/domains/DomainsListPage';
import { DomainDetailPage } from './pages/domains/DomainDetailPage';

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
            {/* Fallback for undeveloped pages */}
            <Route path="/alerts" element={<div className="p-8 text-center text-zinc-400">Alerts coming soon</div>} />
            <Route path="/settings" element={<div className="p-8 text-center text-zinc-400">Settings coming soon</div>} />
          </Route>
          
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
};

export default App;
