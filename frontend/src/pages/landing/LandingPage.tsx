import React from 'react';
import { Link, Navigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Globe, ShieldAlert, Mail, ArrowRight } from 'lucide-react';

export const LandingPage: React.FC = () => {
  const { user } = useAuth();


  return (
    <div className="min-h-screen bg-background text-white relative overflow-hidden flex flex-col justify-between">
      {/* Decorative gradients */}
      <div className="absolute top-[-10%] right-[-10%] w-[60%] h-[60%] rounded-full bg-ember-600/10 blur-[150px] pointer-events-none" />
      <div className="absolute bottom-[-10%] left-[-10%] w-[60%] h-[60%] rounded-full bg-ember-600/10 blur-[150px] pointer-events-none" />

      {/* Header */}
      <header className="max-w-7xl mx-auto w-full px-6 py-6 flex items-center justify-between relative z-10">
        <div className="flex items-center gap-2 text-white font-bold text-xl tracking-tight">
          <img src="/ember-logo.svg" alt="Ember Logo" className="w-8 h-8 rounded-lg shadow-inner" />
          <span>Ember</span>
        </div>
        <div className="flex items-center gap-4">
          {user ? (
            <Link 
              to="/dashboard" 
              className="px-4 py-2 bg-ember-500 hover:bg-ember-600 text-white rounded-lg text-sm font-medium transition-colors shadow-lg shadow-ember-500/20"
            >
              Go to Dashboard
            </Link>
          ) : (
            <>
              <Link 
                to="/login" 
                className="text-zinc-400 hover:text-white transition-colors text-sm font-medium"
              >
                Sign In
              </Link>
              <Link 
                to="/register" 
                className="px-4 py-2 bg-ember-500 hover:bg-ember-600 text-white rounded-lg text-sm font-medium transition-colors shadow-lg shadow-ember-500/20"
              >
                Get Started
              </Link>
            </>
          )}
        </div>
      </header>

      {/* Main Hero & Features */}
      <main className="max-w-7xl mx-auto w-full px-6 py-12 md:py-24 relative z-10 flex flex-col items-center">
        
        {/* Animated Glowing Logo Hero Element */}
        <div className="mb-10 animate-float">
          <div className="relative group">
            {/* Pulsing neon background glow */}
            <div className="absolute inset-0 bg-ember-500 rounded-3xl blur-2xl opacity-30 group-hover:opacity-50 transition-opacity duration-500" />
            
            {/* Glowing Logo Wrapper */}
            <div className="relative w-28 h-28 sm:w-36 sm:h-36 bg-zinc-950/80 rounded-3xl border border-ember-500/40 flex items-center justify-center p-6 animate-glow-pulse backdrop-blur-xl">
              <img 
                src="/ember-logo.svg" 
                alt="Ember Logo" 
                className="w-full h-full object-contain filter drop-shadow-[0_0_10px_rgba(249,115,22,0.5)]" 
              />
            </div>
          </div>
        </div>

        {/* Hero Copy */}
        <div className="text-center max-w-3xl space-y-6">
          <h1 className="text-4xl sm:text-6xl font-extrabold tracking-tight text-white leading-tight">
            Stop landing in{' '}
            <span className="bg-gradient-to-r from-ember-400 to-amber-500 bg-clip-text text-transparent">
              Spam
            </span>
          </h1>
          <p className="text-lg sm:text-xl text-zinc-400 max-w-2xl mx-auto leading-relaxed">
            Ember monitors your domain deliverability, audits SPF/DKIM/DMARC records, tracks public blocklists, and runs automated seed inbox tests.
          </p>

          <div className="pt-4 flex flex-col sm:flex-row justify-center items-center gap-4">
            {user ? (
              <Link 
                to="/dashboard" 
                className="w-full sm:w-auto px-8 py-3.5 bg-ember-500 hover:bg-ember-600 text-white rounded-xl font-medium transition-all shadow-xl shadow-ember-500/20 hover:shadow-ember-500/30 flex items-center justify-center gap-2 group text-base"
              >
                Go to Dashboard
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </Link>
            ) : (
              <Link 
                to="/register" 
                className="w-full sm:w-auto px-8 py-3.5 bg-ember-500 hover:bg-ember-600 text-white rounded-xl font-medium transition-all shadow-xl shadow-ember-500/20 hover:shadow-ember-500/30 flex items-center justify-center gap-2 group text-base"
              >
                Start Monitoring Free
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </Link>
            )}
          </div>
        </div>

        {/* Features Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-20 w-full max-w-5xl">
          
          {/* Card 1 */}
          <div className="glass-panel p-8 rounded-2xl border border-white/5 hover:border-ember-500/30 transition-all duration-300 group hover:-translate-y-1">
            <div className="w-12 h-12 rounded-xl bg-ember-500/10 border border-ember-500/20 flex items-center justify-center text-ember-400 mb-6 group-hover:bg-ember-500/20 group-hover:scale-110 transition-all">
              <Globe className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-semibold text-white mb-2">DNS Reputation Audit</h3>
            <p className="text-zinc-400 text-sm leading-relaxed">
              Verify SPF, DKIM, and DMARC setups instantly. Receive continuous verification and alerts if your configuration deviates.
            </p>
          </div>

          {/* Card 2 */}
          <div className="glass-panel p-8 rounded-2xl border border-white/5 hover:border-ember-500/30 transition-all duration-300 group hover:-translate-y-1">
            <div className="w-12 h-12 rounded-xl bg-ember-500/10 border border-ember-500/20 flex items-center justify-center text-ember-400 mb-6 group-hover:bg-ember-500/20 group-hover:scale-110 transition-all">
              <ShieldAlert className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-semibold text-white mb-2">Blacklist Monitoring</h3>
            <p className="text-zinc-400 text-sm leading-relaxed">
              Track your IP and domain status across major blacklists like Spamhaus, Barracuda, and SORBS to prevent mail blockages.
            </p>
          </div>

          {/* Card 3 */}
          <div className="glass-panel p-8 rounded-2xl border border-white/5 hover:border-ember-500/30 transition-all duration-300 group hover:-translate-y-1">
            <div className="w-12 h-12 rounded-xl bg-ember-500/10 border border-ember-500/20 flex items-center justify-center text-ember-400 mb-6 group-hover:bg-ember-500/20 group-hover:scale-110 transition-all">
              <Mail className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-semibold text-white mb-2">Seed Inbox Testing</h3>
            <p className="text-zinc-400 text-sm leading-relaxed">
              Automated 1-click test delivery to real Gmail, Yahoo, and Outlook inboxes to check your actual spam and inbox placement.
            </p>
          </div>

        </div>
      </main>

      {/* Footer */}
      <footer className="max-w-7xl mx-auto w-full px-6 py-8 border-t border-zinc-900 text-center text-zinc-500 text-sm relative z-10">
        <p>© {new Date().getFullYear()} Ember. All rights reserved.</p>
      </footer>
    </div>
  );
};
