import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams, Navigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { PageContainer } from '../../components/layout/PageContainer';
import { Button } from '../../components/common/Button';
import apiClient from '../../services/apiClient';

export const OAuthCallback: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user, login } = useAuth();
  
  const [mfaRequired, setMfaRequired] = useState(false);
  const [tempToken, setTempToken] = useState('');
  const [mfaCode, setMfaCode] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const accessToken = searchParams.get('access_token');
    const refreshToken = searchParams.get('refresh_token');
    const tToken = searchParams.get('temp_token');

    if (accessToken) {
      // Normal OAuth login successful
      login(accessToken, refreshToken || "");
    } else if (tToken) {
      // MFA required
      setTempToken(tToken);
      setMfaRequired(true);
    } else {
      setError('Invalid OAuth callback parameters');
    }
  }, [searchParams, login, navigate]);

  const handleMfaSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    
    try {
      const { data } = await apiClient.post('/auth/login/mfa', { temp_token: tempToken, code: mfaCode });
      login(data.access_token, data.refresh_token);
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Invalid MFA code');
    } finally {
      setIsLoading(false);
    }
  };

  if (user) {
    return <Navigate to="/" replace />;
  }

  if (mfaRequired) {
    return (
      <div className="min-h-screen flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 bg-background relative overflow-hidden">
        <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] rounded-full bg-ember-600/20 blur-[120px]" />
        
        <div className="max-w-md w-full space-y-8 glass-panel p-8 rounded-2xl relative z-10 animate-fade-in-up">
          <div>
            <h2 className="mt-2 text-center text-3xl font-bold tracking-tight text-white">
              Two-Factor Authentication
            </h2>
            <p className="mt-2 text-center text-sm text-zinc-400">
              Enter the 6-digit code from your authenticator app
            </p>
          </div>
          
          <form className="mt-8 space-y-6" onSubmit={handleMfaSubmit}>
            {error && (
              <div className="p-3 rounded-lg bg-red-500/10 text-red-400 text-sm border border-red-500/20 text-center">
                {error}
              </div>
            )}
            
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
            </div>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="flex flex-col items-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-ember-500 mb-4"></div>
        <p className="text-zinc-400">Completing sign in...</p>
        {error && <p className="text-red-400 mt-4">{error}</p>}
      </div>
    </div>
  );
};
