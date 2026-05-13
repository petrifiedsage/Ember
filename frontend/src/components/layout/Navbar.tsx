import React from 'react';
import { useAuth } from '../../context/AuthContext';
import { LogOut } from 'lucide-react';

export const Navbar: React.FC = () => {
  const { user, logout } = useAuth();

  return (
    <header className="glass sticky top-0 z-10 border-b border-white/5">
      <div className="flex items-center justify-between px-6 h-16">
        <h1 className="text-lg font-medium">Dashboard</h1>
        
        <div className="flex items-center gap-4">
          <div className="text-sm text-zinc-400 hidden sm:block">
            {user?.email}
          </div>
          <button 
            onClick={logout}
            className="p-2 text-zinc-400 hover:text-white hover:bg-white/5 rounded-full transition-colors"
          >
            <LogOut className="w-5 h-5" />
          </button>
        </div>
      </div>
    </header>
  );
};
