import { createBrowserRouter, Navigate, Outlet } from "react-router-dom";

import App from "../App";
import { Navbar } from "../components/layout/Navbar";
import { PageContainer } from "../components/layout/PageContainer";
import { Sidebar } from "../components/layout/Sidebar";
import { useAuth } from "../hooks/useAuth";
import LoginPage from "../pages/auth/LoginPage";
import RegisterPage from "../pages/auth/RegisterPage";
import AddDomainPage from "../pages/domains/AddDomainPage";
import DomainDetailPage from "../pages/domains/DomainDetailPage";
import DomainsListPage from "../pages/domains/DomainsListPage";

function ProtectedLayout() {
  const { isAuthenticated } = useAuth();
  if (!isAuthenticated) return <Navigate to="/auth/login" replace />;
  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar />
      <div className="flex">
        <Sidebar />
        <PageContainer>
          <Outlet />
        </PageContainer>
      </div>
    </div>
  );
}

export const router = createBrowserRouter([
  {
    path: "/",
    element: <App />,
    children: [
      { index: true, element: <Navigate to="/domains" replace /> },
      { path: "/auth/login", element: <LoginPage /> },
      { path: "/auth/register", element: <RegisterPage /> },
      {
        element: <ProtectedLayout />,
        children: [
          { path: "/domains", element: <DomainsListPage /> },
          { path: "/domains/new", element: <AddDomainPage /> },
          { path: "/domains/:domainId", element: <DomainDetailPage /> }
        ]
      }
    ]
  }
]);
