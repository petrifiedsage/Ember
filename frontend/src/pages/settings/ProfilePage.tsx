import React, { useState } from 'react';
import { PageContainer } from '../../components/layout/PageContainer';
import { Card } from '../../components/common/Card';
import { Button } from '../../components/common/Button';
import { useAuth } from '../../context/AuthContext';
import { User, Trash2, KeyRound, ShieldCheck, Copy, ShieldAlert } from 'lucide-react';
import apiClient from '../../services/apiClient';
import toast from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';
import { QRCodeSVG } from 'qrcode.react';

export const ProfilePage: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [isChangingPassword, setIsChangingPassword] = useState(false);

  const [isSettingUpMfa, setIsSettingUpMfa] = useState(false);
  const [mfaSecret, setMfaSecret] = useState('');
  const [mfaQrUri, setMfaQrUri] = useState('');
  const [mfaCode, setMfaCode] = useState('');
  const [isVerifyingMfa, setIsVerifyingMfa] = useState(false);

  const handleDeleteAccount = async () => {
    if (!confirm('Are you absolutely sure you want to delete your account? This action cannot be undone and all your domains, tests, and alerts will be permanently removed.')) {
      return;
    }

    try {
      await apiClient.delete('/users/me');
      toast.success('Account deleted successfully');
      logout();
      navigate('/login');
    } catch (error) {
      toast.error('Failed to delete account');
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsChangingPassword(true);
    try {
      await apiClient.patch('/users/me/password', {
        current_password: currentPassword,
        new_password: newPassword
      });
      toast.success('Password changed successfully');
      setCurrentPassword('');
      setNewPassword('');
    } catch (error) {
      // toast is handled by interceptor
    } finally {
      setIsChangingPassword(false);
    }
  };

  const handleStartMfaSetup = async () => {
    try {
      const { data } = await apiClient.post('/auth/mfa/setup');
      setMfaSecret(data.secret);
      setMfaQrUri(data.qr_code_uri);
      setIsSettingUpMfa(true);
    } catch (error) {
      // toast handled
    }
  };

  const handleVerifyMfa = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsVerifyingMfa(true);
    try {
      await apiClient.post('/auth/mfa/verify', { code: mfaCode });
      toast.success('Two-Factor Authentication enabled!');
      setIsSettingUpMfa(false);
      setMfaCode('');
      // Optimistically update the context if we could, but forcing a refresh or just showing UI is fine
      window.location.reload(); 
    } catch (error) {
      // toast handled
    } finally {
      setIsVerifyingMfa(false);
    }
  };

  const copySecret = () => {
    navigator.clipboard.writeText(mfaSecret);
    toast.success('Secret copied to clipboard');
  };

  return (
    <PageContainer>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white">Profile Settings</h1>
        <p className="text-zinc-400 mt-2">Manage your account preferences and security</p>
      </div>

      <div className="space-y-6 max-w-2xl">
        <Card className="p-6">
          <h2 className="text-xl font-semibold text-white mb-6">Account Details</h2>
          <div className="flex items-center p-4 bg-zinc-900 rounded-lg border border-zinc-800">
            <div className="w-12 h-12 rounded-full bg-ember-500/20 text-ember-500 flex items-center justify-center mr-4 border border-ember-500/30">
              <User className="w-6 h-6" />
            </div>
            <div>
              <div className="text-white font-medium text-lg">{user?.name || 'User'}</div>
              <div className="text-zinc-400">{user?.email}</div>
            </div>
          </div>
        </Card>

        {/* Change Password Card */}
        <Card className="p-6">
          <h2 className="text-xl font-semibold text-white mb-2 flex items-center">
            <KeyRound className="w-5 h-5 mr-2 text-ember-500" />
            Change Password
          </h2>
          <p className="text-sm text-zinc-400 mb-6">Update your password to keep your account secure.</p>
          
          <form onSubmit={handleChangePassword} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-zinc-300 mb-1">Current Password</label>
              <input
                type="password"
                required
                className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-ember-500"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-zinc-300 mb-1">New Password</label>
              <input
                type="password"
                required
                className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-ember-500"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
              />
            </div>
            <Button type="submit" isLoading={isChangingPassword}>
              Update Password
            </Button>
          </form>
        </Card>

        {/* Two-Factor Authentication Card */}
        <Card className="p-6">
          <h2 className="text-xl font-semibold text-white mb-2 flex items-center">
            <ShieldCheck className="w-5 h-5 mr-2 text-ember-500" />
            Two-Factor Authentication (2FA)
          </h2>
          <p className="text-sm text-zinc-400 mb-6">
            Add an extra layer of security to your account by enabling 2FA.
          </p>
          
          {user?.mfa_enabled ? (
            <div className="p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-lg flex items-start">
              <ShieldCheck className="w-5 h-5 text-emerald-400 mr-3 mt-0.5" />
              <div>
                <h4 className="text-emerald-400 font-medium">2FA is enabled</h4>
                <p className="text-sm text-zinc-400 mt-1">Your account is secured with multi-factor authentication.</p>
              </div>
            </div>
          ) : isSettingUpMfa ? (
            <div className="p-6 bg-zinc-900 rounded-lg border border-zinc-800">
              <h3 className="text-lg font-medium text-white mb-4">Set up Authenticator App</h3>
              <p className="text-sm text-zinc-400 mb-6">
                Scan the QR code below using an authenticator app like Google Authenticator or Authy.
              </p>
              <div className="flex justify-center mb-6 p-4 bg-white rounded-lg inline-block mx-auto">
                <QRCodeSVG value={mfaQrUri} size={200} />
              </div>
              <div className="mb-6 text-center">
                <p className="text-sm text-zinc-400 mb-2">Or enter this setup key manually:</p>
                <code className="bg-zinc-800 px-3 py-1.5 rounded text-ember-400 font-mono tracking-widest cursor-pointer hover:bg-zinc-700" onClick={copySecret}>
                  {mfaSecret} <Copy className="inline w-3 h-3 ml-1" />
                </code>
              </div>
              
              <form onSubmit={handleVerifyMfa} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-zinc-300 mb-1">Verify Code</label>
                  <input
                    type="text"
                    required
                    placeholder="000000"
                    className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-ember-500 text-center tracking-[0.5em] text-lg font-mono"
                    value={mfaCode}
                    onChange={(e) => setMfaCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  />
                </div>
                <div className="flex gap-3">
                  <Button type="button" variant="secondary" onClick={() => setIsSettingUpMfa(false)} className="flex-1">
                    Cancel
                  </Button>
                  <Button type="submit" isLoading={isVerifyingMfa} className="flex-1">
                    Verify & Enable
                  </Button>
                </div>
              </form>
            </div>
          ) : (
            <Button onClick={handleStartMfaSetup}>
              Enable 2FA
            </Button>
          )}
        </Card>

        {/* Danger Zone */}
        <Card className="p-6 border-red-500/20 bg-red-500/5">
          <h2 className="text-xl font-semibold text-red-400 mb-2 flex items-center">
            <ShieldAlert className="w-5 h-5 mr-2" />
            Danger Zone
          </h2>
          <p className="text-zinc-400 text-sm mb-6">
            Permanently delete your account and all associated data. This action is irreversible.
          </p>
          
          <button
            onClick={handleDeleteAccount}
            className="inline-flex items-center justify-center px-4 py-2 rounded-md font-medium text-sm transition-colors border border-red-500/50 text-red-400 hover:bg-red-500 hover:text-white"
          >
            <Trash2 className="w-4 h-4 mr-2" />
            Delete Account
          </button>
        </Card>
      </div>
    </PageContainer>
  );
};
