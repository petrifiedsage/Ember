import React from 'react';
import { PageContainer } from '../../components/layout/PageContainer';
import { Card } from '../../components/common/Card';
import { Link } from 'react-router-dom';
import { Globe, ArrowRight } from 'lucide-react';

export const DashboardPage: React.FC = () => {
  return (
    <PageContainer>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-white">Dashboard</h1>
        <p className="text-zinc-400 text-sm mt-1">Overview of your email deliverability</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <Card className="p-6">
          <div className="text-sm font-medium text-zinc-400 mb-2">Tracked Domains</div>
          <div className="text-3xl font-bold text-white">0</div>
        </Card>
        <Card className="p-6">
          <div className="text-sm font-medium text-zinc-400 mb-2">Average Health Score</div>
          <div className="text-3xl font-bold text-ember-500">--</div>
        </Card>
        <Card className="p-6">
          <div className="text-sm font-medium text-zinc-400 mb-2">Active Alerts</div>
          <div className="text-3xl font-bold text-white">0</div>
        </Card>
      </div>

      <div className="mt-12 glass-panel p-8 rounded-2xl border-dashed text-center">
        <div className="w-16 h-16 rounded-full bg-ember-500/10 flex items-center justify-center mx-auto mb-4">
          <Globe className="w-8 h-8 text-ember-400" />
        </div>
        <h2 className="text-xl font-semibold text-white mb-2">Ready to monitor your reputation?</h2>
        <p className="text-zinc-400 mb-6 max-w-md mx-auto">
          Add your first domain to run an instant DNS check and start tracking your email deliverability over time.
        </p>
        <Link 
          to="/domains"
          className="inline-flex items-center justify-center rounded-lg font-medium transition-all duration-200 bg-ember-500 text-white hover:bg-ember-600 px-6 py-3 shadow-lg shadow-ember-500/20"
        >
          Go to Domains
          <ArrowRight className="w-4 h-4 ml-2" />
        </Link>
      </div>
    </PageContainer>
  );
};
