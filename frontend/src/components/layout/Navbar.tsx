import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { LogOut, LayoutDashboard, Globe, ShieldAlert, Settings } from 'lucide-react';
import { cn } from '../../utils/cn';

const navigation = [
  { name: 'Dashboard', href: '/', icon: LayoutDashboard },
  { name: 'Domains', href: '/domains', icon: Globe },
  { name: 'Alerts', href: '/alerts', icon: ShieldAlert },
  { name: 'Settings', href: '/settings', icon: Settings },
];

export const Navbar: React.FC = () => {
  const { user, logout } = useAuth();
  const location = useLocation();

  return (
    <header className="fixed top-6 left-1/2 -translate-x-1/2 w-[95%] max-w-5xl z-50 glass-panel rounded-2xl shadow-2xl">
      <div className="flex items-center justify-between px-4 sm:px-6 h-16">
        
        {/* Logo */}
        <div className="flex items-center gap-2 text-white font-bold text-xl tracking-tight">
          <img src="/ember-logo.svg" alt="Ember Logo" className="w-8 h-8 rounded-lg shadow-inner" />
          <span className="hidden md:inline">Ember</span>
        </div>
        
        {/* Navigation Tabs */}
        <nav className="flex items-center gap-1 sm:gap-2">
          {navigation.map((item) => (
            <NavLink
              key={item.name}
              to={item.href}
              className={({ isActive }) =>
                cn(
                  'flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-all duration-200',
                  isActive
                    ? 'bg-ember-500/10 text-ember-400 shadow-sm'
                    : 'text-zinc-400 hover:bg-white/5 hover:text-zinc-100'
                )
              }
            >
              <item.icon className="w-4 h-4 sm:mr-2" />
              <span className="hidden sm:inline">{item.name}</span>
            </NavLink>
          ))}
        </nav>

        {/* User Actions */}
        <div className="flex items-center gap-3">
          <div className="text-sm text-zinc-400 hidden lg:block">
            {user?.email}
          </div>
          <button 
            onClick={logout}
            title="Log out"
            className="p-2 text-zinc-400 hover:text-red-400 hover:bg-red-500/10 rounded-full transition-colors"
          >
            <LogOut className="w-5 h-5" />
          </button>
        </div>

      </div>
    </header>
  );
};
