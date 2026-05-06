import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { PageContainer } from '../../components/layout/PageContainer';
import { Card } from '../../components/common/Card';
import { Button } from '../../components/common/Button';
import { ArrowLeft, RefreshCw } from 'lucide-react';
import apiClient from '../../services/apiClient';
import { DnsCheckRow } from '../../components/dns/DnsCheckRow';

export const DomainDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [domain, setDomain] = useState<any>(null);
  const [dnsLatest, setDnsLatest] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isChecking, setIsChecking] = useState(false);

  const fetchDetails = async () => {
    try {
      const [domainRes, dnsRes] = await Promise.all([
        apiClient.get('/domains'),
        apiClient.get(`/dns/${id}/latest`).catch(() => ({ data: null }))
      ]);
      const currentDomain = domainRes.data.find((d: any) => d.id === id);
      setDomain(currentDomain);
      if (dnsRes.data && dnsRes.data.spf) {
        setDnsLatest(dnsRes.data);
      }
    } catch (error) {
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchDetails();
  }, [id]);

  const runCheck = async () => {
    setIsChecking(true);
    try {
      await apiClient.post(`/dns/${id}/run`);
      const oldDate = dnsLatest?.checked_at;
      
      for (let i = 0; i < 15; i++) {
        await new Promise(resolve => setTimeout(resolve, 2000));
        const { data } = await apiClient.get(`/dns/${id}/latest`);
        if (data && data.spf && data.checked_at !== oldDate) {
          setDnsLatest(data);
          // Also refresh domain to get updated score
          const domainRes = await apiClient.get('/domains');
          const currentDomain = domainRes.data.find((d: any) => d.id === id);
          setDomain(currentDomain);
          break;
        }
      }
    } catch (error) {
      console.error(error);
    } finally {
      setIsChecking(false);
    }
  };

  if (isLoading) {
    return (
      <PageContainer>
        <div className="flex justify-center p-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-ember-500"></div>
        </div>
      </PageContainer>
    );
  }

  if (!domain) {
    return (
      <PageContainer>
        <div className="text-center py-12">Domain not found</div>
      </PageContainer>
    );
  }

  return (
    <PageContainer>
      <Link to="/domains" className="inline-flex items-center text-sm text-zinc-400 hover:text-white mb-6 transition-colors">
        <ArrowLeft className="w-4 h-4 mr-1" />
        Back to domains
      </Link>

      <div className="flex justify-between items-start mb-8">
        <div>
          <h1 className="text-3xl font-bold text-white">{domain.domain}</h1>
          <p className="text-zinc-400 text-sm mt-1">
            Added on {new Date(domain.added_at).toLocaleDateString()}
          </p>
        </div>
        <div className="text-right">
          <div className="text-sm text-zinc-400 mb-1">Health Score</div>
          <div className="text-4xl font-bold text-ember-500">
            {domain.health_score !== null ? domain.health_score : '--'}
          </div>
        </div>
      </div>

      <div className="space-y-6">
        <Card className="p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-semibold text-white">DNS Records</h2>
            <Button size="sm" variant="secondary" onClick={runCheck} isLoading={isChecking}>
              <RefreshCw className={`w-4 h-4 mr-2 ${isChecking ? 'animate-spin' : ''}`} />
              Run Check
            </Button>
          </div>

          {dnsLatest && dnsLatest.spf ? (
            <div className="flex flex-col">
              <DnsCheckRow 
                title="SPF" 
                status={dnsLatest.spf.status} 
                note={dnsLatest.spf.note} 
                record={dnsLatest.spf.record} 
              />
              <DnsCheckRow 
                title="DKIM" 
                status={dnsLatest.dkim.status} 
                note={dnsLatest.dkim.note} 
                record={dnsLatest.dkim.record} 
              />
              <DnsCheckRow 
                title="DMARC" 
                status={dnsLatest.dmarc.status} 
                note={dnsLatest.dmarc.note} 
                record={dnsLatest.dmarc.record} 
              />
              <DnsCheckRow 
                title="MX" 
                status={dnsLatest.mx.status} 
                note={dnsLatest.mx.records.length > 0 ? `Found ${dnsLatest.mx.records.length} records` : 'No MX records found'} 
                record={dnsLatest.mx.records.join('\n')} 
              />
            </div>
          ) : (
            <div className="text-center py-8 text-zinc-400 text-sm">
              No DNS checks run yet. Click "Run Check" to scan this domain.
            </div>
          )}
        </Card>
      </div>
    </PageContainer>
  );
};
