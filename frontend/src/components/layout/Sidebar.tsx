import React from 'react';
import { NavLink } from 'react-router-dom';
import { LayoutDashboard, Globe, ShieldAlert, Settings } from 'lucide-react';
import { cn } from '../../utils/cn';

const navigation = [
  { name: 'Dashboard', href: '/', icon: LayoutDashboard },
  { name: 'Domains', href: '/domains', icon: Globe },
  { name: 'Alerts', href: '/alerts', icon: ShieldAlert },
  { name: 'Settings', href: '/settings', icon: Settings },
];

export const Sidebar: React.FC = () => {
  return (
    <div className="flex flex-col w-64 glass border-r border-white/5 h-screen sticky top-0">
      <div className="flex items-center justify-center h-16 px-6 border-b border-white/5">
        <div className="flex items-center gap-2 text-ember-500 font-bold text-xl tracking-tight">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-ember-400 to-ember-600 flex items-center justify-center text-white">
            <Globe className="w-5 h-5" />
          </div>
          Ember
        </div>
      </div>
      <div className="flex-1 overflow-y-auto py-4 px-3 space-y-1">
        {navigation.map((item) => (
          <NavLink
            key={item.name}
            to={item.href}
            className={({ isActive }) =>
              cn(
                'group flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-colors',
                isActive
                  ? 'bg-ember-500/10 text-ember-400'
                  : 'text-zinc-400 hover:bg-white/5 hover:text-zinc-100'
              )
            }
          >
            <item.icon className="flex-shrink-0 -ml-1 mr-3 h-5 w-5" aria-hidden="true" />
            <span className="truncate">{item.name}</span>
          </NavLink>
        ))}
      </div>
    </div>
  );
};
