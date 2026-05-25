import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { PageContainer } from '../../components/layout/PageContainer';
import { Card } from '../../components/common/Card';
import { Button } from '../../components/common/Button';
import { Plus, Globe, Trash2 } from 'lucide-react';
import apiClient from '../../services/apiClient';
import { AddDomainModal } from '../../components/domains/AddDomainModal';
import { EmptyState } from '../../components/common/EmptyState';
import toast from 'react-hot-toast';

export const DomainsListPage: React.FC = () => {
  const [domains, setDomains] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const fetchDomains = async () => {
    try {
      const { data } = await apiClient.get('/domains');
      setDomains(data);
    } catch (error) {
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchDomains();
  }, []);

  const deleteDomain = async (id: string, e: React.MouseEvent) => {
    e.preventDefault();
    if (!confirm('Are you sure you want to delete this domain?')) return;
    try {
      await apiClient.delete(`/domains/${id}`);
      toast.success('Domain deleted successfully');
      fetchDomains();
    } catch (error: any) {
      toast.error(error.response?.data?.detail || 'Failed to delete domain');
      console.error(error);
    }
  };

  return (
    <PageContainer>
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-white">Domains</h1>
          <p className="text-zinc-400 text-sm mt-1">Manage your tracked sending domains</p>
        </div>
        <Button onClick={() => setIsModalOpen(true)}>
          <Plus className="w-4 h-4 mr-2" />
          Add Domain
        </Button>
      </div>

      {isLoading ? (
        <div className="flex justify-center p-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-ember-500"></div>
        </div>
      ) : domains.length === 0 ? (
        <Card>
          <EmptyState
            icon={Globe}
            title="No domains found"
            description="Get started by tracking a new domain."
            actionLabel="Add Domain"
            onAction={() => setIsModalOpen(true)}
          />
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {domains.map((domain) => (
            <Link key={domain.id} to={`/domains/${domain.id}`} className="block group">
              <Card className="p-6 transition-all duration-200 hover:border-ember-500/50 hover:shadow-lg hover:shadow-ember-500/10">
                <div className="flex justify-between items-start mb-4">
                  <div className="font-medium text-lg truncate pr-4">{domain.domain}</div>
                  <button 
                    onClick={(e) => deleteDomain(domain.id, e)}
                    className="text-zinc-500 hover:text-red-400 transition-colors p-1"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
                <div className="flex items-end justify-between mt-6">
                  <div>
                    <div className="text-sm text-zinc-400 mb-1">Health Score</div>
                    <div className="text-3xl font-bold text-white">
                      {domain.health_score !== null ? domain.health_score : '--'}
                    </div>
                  </div>
                  <div className={`px-2.5 py-1 rounded-md text-xs font-medium ${domain.status === 'active' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-zinc-800 text-zinc-400'}`}>
                    {domain.status}
                  </div>
                </div>
              </Card>
            </Link>
          ))}
        </div>
      )}

      <AddDomainModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        onSuccess={fetchDomains}
      />
    </PageContainer>
  );
};
