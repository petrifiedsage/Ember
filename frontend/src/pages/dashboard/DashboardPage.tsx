import React, { useEffect, useState } from 'react';
import { PageContainer } from '../../components/layout/PageContainer';
import { Card } from '../../components/common/Card';
import { Link } from 'react-router-dom';
import { Globe, ArrowRight } from 'lucide-react';

import apiClient from '../../services/apiClient';
import { ScoreRing } from '../../components/common/ScoreRing';
import { Badge } from '../../components/common/Badge';
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

  const avgScore = domains.length 
    ? Math.round(domains.reduce((acc, d) => acc + (d.health_score || 0), 0) / domains.length)
    : '--';

  return (
    <PageContainer>
      <div className="mb-8 flex justify-between items-end">
        <div>
          <h1 className="text-2xl font-bold text-white">Dashboard</h1>
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
            <Card 
              key={domain.id} 
              className="p-6 hover:border-zinc-700 cursor-pointer transition-colors group"
              onClick={() => navigate(`/domains/${domain.id}`)}
            >
              <div className="flex justify-between items-start mb-6">
                <div>
                  <h3 className="text-lg font-bold text-white mb-1 truncate max-w-[180px]" title={domain.domain}>
                    {domain.domain}
                  </h3>
                  <span className="text-xs text-zinc-500">
                    Last checked: {domain.last_checked_at ? new Date(domain.last_checked_at).toLocaleDateString() : 'Never'}
                  </span>
                </div>
                <div className="flex-shrink-0 group-hover:scale-105 transition-transform duration-300">
                  <ScoreRing score={domain.health_score} size={64} strokeWidth={6} />
                </div>
              </div>
              <div className="flex items-center space-x-2 text-xs">
                <Badge variant={domain.health_score >= 80 ? 'pass' : domain.health_score >= 40 ? 'warn' : 'fail'}>
                  {domain.health_score >= 80 ? 'HEALTHY' : domain.health_score >= 40 ? 'WARNING' : 'CRITICAL'}
                </Badge>
              </div>
            </Card>
          ))}
        </div>
      )}
    </PageContainer>
  );
};
