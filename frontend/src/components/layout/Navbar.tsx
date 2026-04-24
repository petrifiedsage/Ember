import { useAuth } from "../../hooks/useAuth";

export function Navbar() {
  const { isAuthenticated, logout } = useAuth();
  return (
    <header className="flex h-14 items-center justify-between border-b border-slate-200 px-6">
      <p className="text-sm text-slate-600">Deliverability Monitoring</p>
      {isAuthenticated && (
        <button
          className="rounded bg-slate-900 px-3 py-1.5 text-sm text-white"
          onClick={logout}
          type="button"
        >
          Logout
        </button>
      )}
    </header>
  );
}
