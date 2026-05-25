import React from 'react';
import { PageContainer } from '../../components/layout/PageContainer';
import { Card } from '../../components/common/Card';
import { Button } from '../../components/common/Button';
import { useAuth } from '../../context/AuthContext';
import { LogOut, User, Trash2 } from 'lucide-react';
import apiClient from '../../services/apiClient';
import toast from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';

export const ProfilePage: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

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

  return (
    <PageContainer>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white">Profile Settings</h1>
        <p className="text-zinc-400 mt-2">Manage your account preferences</p>
      </div>

      <div className="space-y-6 max-w-2xl">
        <Card className="p-6">
          <h2 className="text-xl font-semibold text-white mb-6">Account Details</h2>
          
          <div className="space-y-4">
            <div className="flex items-center p-4 bg-zinc-900 rounded-lg border border-zinc-800">
              <div className="w-12 h-12 rounded-full bg-ember-500/20 text-ember-500 flex items-center justify-center mr-4 border border-ember-500/30">
                <User className="w-6 h-6" />
              </div>
              <div>
                <div className="text-white font-medium text-lg">{user?.name}</div>
                <div className="text-zinc-400">{user?.email}</div>
              </div>
            </div>
            
            <div className="pt-4 flex items-center">
              <Button onClick={logout} variant="secondary">
                <LogOut className="w-4 h-4 mr-2" />
                Sign Out
              </Button>
            </div>
          </div>
        </Card>

        <Card className="p-6 border-red-500/20">
          <h2 className="text-xl font-semibold text-red-400 mb-2">Danger Zone</h2>
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
