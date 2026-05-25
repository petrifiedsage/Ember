import React, { useState } from 'react';
import { Navigate, useLocation, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import apiClient from '../../services/apiClient';
import { Button } from '../../components/common/Button';

export const LoginPage: React.FC = () => {
  const { user, login } = useAuth();
  const location = useLocation();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // MFA State
  const [mfaRequired, setMfaRequired] = useState(false);
  const [tempToken, setTempToken] = useState('');
  const [mfaCode, setMfaCode] = useState('');

  if (user) {
    return <Navigate to="/" state={{ from: location }} replace />;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      if (mfaRequired) {
        const { data } = await apiClient.post('/auth/login/mfa', { temp_token: tempToken, code: mfaCode });
        login(data.access_token, data.refresh_token);
      } else {
        const { data } = await apiClient.post('/auth/login', { email, password });
        if (data.mfa_required) {
          setMfaRequired(true);
          setTempToken(data.temp_token);
        } else {
          login(data.access_token, data.refresh_token);
        }
      }
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to login');
    } finally {
      setIsLoading(false);
    }
  };

  const handleOAuth = (provider: 'google' | 'github') => {
    window.location.href = `${import.meta.env.VITE_API_URL || 'http://localhost:8000/api/v1'}/auth/${provider}/login`;
  };

  return (
    <div className="min-h-screen flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 bg-background relative overflow-hidden">
      {/* Decorative gradients */}
      <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] rounded-full bg-ember-600/20 blur-[120px]" />
      
      <div className="max-w-md w-full space-y-8 glass-panel p-8 rounded-2xl relative z-10 animate-fade-in-up">
        <div>
          <h2 className="mt-2 text-center text-3xl font-bold tracking-tight text-white">
            Sign in to Ember
          </h2>
          <p className="mt-2 text-center text-sm text-zinc-400">
            Monitor your domain reputation
          </p>
        </div>
        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          {error && (
            <div className="p-3 rounded-lg bg-red-500/10 text-red-400 text-sm border border-red-500/20 text-center">
              {error}
            </div>
          )}
          
          {mfaRequired ? (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-zinc-300 mb-1 text-center">Enter 2FA Code</label>
                <input
                  type="text"
                  required
                  className="block w-full rounded-lg border-white/10 bg-surface/50 text-white focus:border-ember-500 focus:ring-ember-500 sm:text-sm px-3 py-2 text-center tracking-[0.5em] text-lg font-mono"
                  placeholder="000000"
                  value={mfaCode}
                  onChange={(e) => setMfaCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                />
              </div>
              <Button type="submit" className="w-full" isLoading={isLoading}>
                Verify Code
              </Button>
              <button 
                type="button" 
                onClick={() => setMfaRequired(false)}
                className="w-full text-sm text-zinc-400 hover:text-white transition-colors"
              >
                Back to login
              </button>
            </div>
          ) : (
            <>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-zinc-300 mb-1">Email address</label>
                  <input
                    type="email"
                    required
                    className="block w-full rounded-lg border-white/10 bg-surface/50 text-white focus:border-ember-500 focus:ring-ember-500 sm:text-sm px-3 py-2 placeholder-zinc-500"
                    placeholder="you@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-zinc-300 mb-1">Password</label>
                  <input
                    type="password"
                    required
                    className="block w-full rounded-lg border-white/10 bg-surface/50 text-white focus:border-ember-500 focus:ring-ember-500 sm:text-sm px-3 py-2 placeholder-zinc-500"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                </div>
              </div>

              <Button type="submit" className="w-full" isLoading={isLoading}>
                Sign in
              </Button>

              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-zinc-800" />
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="bg-[#18181b] px-2 text-zinc-500">Or continue with</span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => handleOAuth('google')}
                  className="flex justify-center items-center px-4 py-2 border border-zinc-800 rounded-lg shadow-sm bg-zinc-900/50 hover:bg-zinc-800 transition-colors"
                >
                  <span className="text-sm font-medium text-white">Google</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleOAuth('github')}
                  className="flex justify-center items-center px-4 py-2 border border-zinc-800 rounded-lg shadow-sm bg-zinc-900/50 hover:bg-zinc-800 transition-colors"
                >
                  <span className="text-sm font-medium text-white">GitHub</span>
                </button>
              </div>

              <p className="text-center text-sm text-zinc-400">
                Don't have an account?{' '}
                <Link to="/register" className="font-medium text-ember-400 hover:text-ember-300 transition-colors">
                  Sign up
                </Link>
              </p>
            </>
          )}
        </form>
      </div>
    </div>
  );
};
