import React, { useEffect, useState } from 'react';
import { PageContainer } from '../../components/layout/PageContainer';
import { Card } from '../../components/common/Card';
import { Link } from 'react-router-dom';
import { Globe, ArrowRight } from 'lucide-react';

import apiClient from '../../services/apiClient';
import { ScoreRing } from '../../components/common/ScoreRing';
import { Badge } from '../../components/common/Badge';
import { EmptyState } from '../../components/common/EmptyState';
import { useNavigate } from 'react-router-dom';

export const DashboardPage: React.FC = () => {
  const [domains, setDomains] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchDomains = async () => {
      try {
        const { data } = await apiClient.get('/domains');
        setDomains(data);
      } catch (err) {
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchDomains();
  }, []);

  if (isLoading) {
    return (
      <PageContainer>
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-ember-500"></div>
        </div>
      </PageContainer>
    );
  }

  if (domains.length === 0) {
    return (
      <PageContainer>
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white">Dashboard</h1>
          <p className="text-zinc-400 mt-2">Overview of your sending infrastructure</p>
        </div>
        <Card>
          <EmptyState
            icon={Globe}
            title="No domains tracked"
            description="You haven't added any domains to Ember yet. Add your first domain to start monitoring its deliverability health."
            actionLabel="Add Domain"
            onAction={() => navigate('/domains', { state: { openAddModal: true } })}
          />
        </Card>
      </PageContainer>
    );
  }

  const avgScore = Math.round(domains.reduce((acc, d) => acc + (d.health_score || 0), 0) / domains.length) || 0;

  return (
    <PageContainer>
      <div className="mb-8 flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-bold text-white">Dashboard</h1>
          <p className="text-zinc-400 text-sm mt-1">Overview of your email deliverability</p>
        </div>
        <Link 
          to="/domains"
          className="bg-zinc-800 hover:bg-zinc-700 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors"
        >
          Manage Domains
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <Card className="p-6">
          <div className="text-sm font-medium text-zinc-400 mb-2">Tracked Domains</div>
          <div className="text-3xl font-bold text-white">{domains.length}</div>
        </Card>
        <Card className="p-6">
          <div className="text-sm font-medium text-zinc-400 mb-2">Average Health Score</div>
          <div className="text-3xl font-bold text-ember-500">{avgScore}</div>
        </Card>
        <Card className="p-6">
          <div className="text-sm font-medium text-zinc-400 mb-2">Active Alerts</div>
          <div className="text-3xl font-bold text-white">--</div>
        </Card>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-ember-500"></div>
        </div>
      ) : domains.length === 0 ? (
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
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {domains.map((domain) => (
            <div 
              key={domain.id} 
              className="bg-[#18181b] p-6 rounded-2xl border border-zinc-800 hover:border-zinc-700 cursor-pointer transition-colors group flex flex-col justify-between min-h-[160px]"
              onClick={() => navigate(`/domains/${domain.id}`)}
            >
              <div className="flex justify-between items-start">
                <div className="flex flex-col">
                  <h3 className="text-xl font-bold text-white mb-2 truncate max-w-[200px]" title={domain.domain}>
                    {domain.domain}
                  </h3>
                  <span className="text-sm text-zinc-500">
                    Last checked: {domain.last_checked_at ? new Date(domain.last_checked_at).toLocaleDateString() : 'Never'}
                  </span>
                </div>
                <div className="flex-shrink-0 group-hover:scale-105 transition-transform duration-300">
                  <ScoreRing score={domain.health_score} size={64} strokeWidth={6} />
                </div>
              </div>
              
              <div className="mt-6 flex items-center">
                <span className={`px-3 py-1 text-xs font-medium rounded-[10px] border ${
                  domain.health_score >= 80 ? 'border-emerald-500/50 text-emerald-400 bg-emerald-500/10' : 
                  domain.health_score >= 40 ? 'border-white text-white' : 
                  'border-red-500/50 text-red-400 bg-red-500/10'
                }`}>
                  {domain.health_score >= 80 ? 'HEALTHY' : domain.health_score >= 40 ? 'WARNING' : 'CRITICAL'}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </PageContainer>
  );
};
