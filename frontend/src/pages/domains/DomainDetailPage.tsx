import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { PageContainer } from '../../components/layout/PageContainer';
import { Card } from '../../components/common/Card';
import { Button } from '../../components/common/Button';
import { ArrowLeft, RefreshCw, Mail } from 'lucide-react';
import apiClient from '../../services/apiClient';
import { DnsCheckRow } from '../../components/dns/DnsCheckRow';
import { ScoreRing } from '../../components/common/ScoreRing';
import { ScoreHistoryChart } from '../../components/charts/ScoreHistoryChart';
import { PlacementBarChart } from '../../components/charts/PlacementBarChart';
import { Badge } from '../../components/common/Badge';

export const DomainDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [domain, setDomain] = useState<any>(null);
  const [dnsLatest, setDnsLatest] = useState<any>(null);
  const [blacklistLatest, setBlacklistLatest] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isChecking, setIsChecking] = useState(false);
  const [isCheckingBl, setIsCheckingBl] = useState(false);

  const [smtpHost, setSmtpHost] = useState('');
  const [smtpPort, setSmtpPort] = useState('');
  const [smtpUser, setSmtpUser] = useState('');
  const [smtpPass, setSmtpPass] = useState('');
  const [isSavingSmtp, setIsSavingSmtp] = useState(false);
  const [smtpSaved, setSmtpSaved] = useState(false);

  const fetchDetails = async () => {
    try {
      const [domainRes, dnsRes, blRes] = await Promise.all([
        apiClient.get('/domains'),
        apiClient.get(`/dns/${id}/latest`).catch(() => ({ data: null })),
        apiClient.get(`/blacklists/${id}/latest`).catch(() => ({ data: null }))
      ]);
      const currentDomain = domainRes.data.find((d: any) => d.id === id);
      setDomain(currentDomain);
      if (currentDomain) {
        setSmtpHost(currentDomain.smtp_host || '');
        setSmtpPort(currentDomain.smtp_port ? String(currentDomain.smtp_port) : '');
        setSmtpUser(currentDomain.smtp_username || '');
      }
      if (dnsRes.data && dnsRes.data.spf) {
        setDnsLatest(dnsRes.data);
      }
      if (blRes.data) {
        setBlacklistLatest(blRes.data);
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

  const runBlacklistCheck = async () => {
    setIsCheckingBl(true);
    try {
      await apiClient.post(`/blacklists/${id}/run`);
      const oldDate = blacklistLatest?.checked_at;
      
      for (let i = 0; i < 15; i++) {
        await new Promise(resolve => setTimeout(resolve, 2000));
        const { data } = await apiClient.get(`/blacklists/${id}/latest`);
        if (data && data.checked_at !== oldDate) {
          setBlacklistLatest(data);
          const domainRes = await apiClient.get('/domains');
          const currentDomain = domainRes.data.find((d: any) => d.id === id);
          setDomain(currentDomain);
          break;
        }
      }
    } catch (error) {
      console.error(error);
    } finally {
      setIsCheckingBl(false);
    }
  };

  const saveSmtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSavingSmtp(true);
    try {
      await apiClient.patch(`/domains/${id}/smtp`, {
        smtp_host: smtpHost || null,
        smtp_port: smtpPort ? parseInt(smtpPort) : null,
        smtp_username: smtpUser || null,
        smtp_password: smtpPass || null
      });
      setSmtpSaved(true);
      setTimeout(() => setSmtpSaved(false), 3000);
      setSmtpPass(''); // clear password for security
      
      const domainRes = await apiClient.get('/domains');
      const currentDomain = domainRes.data.find((d: any) => d.id === id);
      setDomain(currentDomain);
    } catch (error) {
      console.error(error);
    } finally {
      setIsSavingSmtp(false);
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
        <div className="flex-1">
          <h1 className="text-3xl font-bold text-white mb-2">{domain.domain}</h1>
          <div className="flex items-center space-x-4">
            <p className="text-zinc-400 text-sm">
              Added on {new Date(domain.added_at).toLocaleDateString()}
            </p>
            <Link 
              to={`/domains/${id}/seed-test`}
              className="inline-flex items-center justify-center bg-ember-500/10 text-ember-500 hover:bg-ember-500/20 px-3 py-1.5 rounded-md text-sm font-medium transition-colors border border-ember-500/20"
            >
              <Mail className="w-4 h-4 mr-2" />
              Run Seed Test
            </Link>
          </div>
        </div>
        <div className="flex-shrink-0 mr-4">
          <ScoreRing score={domain.health_score} size={80} strokeWidth={6} />
        </div>
      </div>

      <div className="space-y-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card className="p-6">
            <ScoreHistoryChart domainId={id as string} />
          </Card>
          <Card className="p-6">
            <PlacementBarChart domainId={id as string} />
          </Card>
        </div>
        
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

        <Card className="p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-semibold text-white">Blacklist Results</h2>
            <Button size="sm" variant="secondary" onClick={runBlacklistCheck} isLoading={isCheckingBl}>
              <RefreshCw className={`w-4 h-4 mr-2 ${isCheckingBl ? 'animate-spin' : ''}`} />
              Run Check
            </Button>
          </div>

          {blacklistLatest ? (
            <div className="flex flex-col">
              {blacklistLatest.hits && blacklistLatest.hits.map((hit: any, i: number) => (
                <div key={i} className="flex items-center justify-between py-3 border-b border-zinc-800/50 last:border-0">
                  <div className="flex items-center space-x-3">
                    <span className="text-white font-medium">{hit.list}</span>
                    {hit.detail && <span className="text-sm text-zinc-500">{hit.detail}</span>}
                  </div>
                  <Badge variant={hit.listed ? 'fail' : 'pass'}>
                    {hit.listed ? 'LISTED' : 'CLEAN'}
                  </Badge>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-zinc-400 text-sm">
              No blacklist checks run yet. Click "Run Check" to scan this domain.
            </div>
          )}
        </Card>

        <Card className="p-6">
          <div className="mb-6">
            <h2 className="text-xl font-semibold text-white">SMTP Integration</h2>
            <p className="text-zinc-400 text-sm mt-1">Configure your SMTP credentials to enable 1-Click Automated Seed Testing.</p>
          </div>
          
          <form onSubmit={saveSmtp} className="space-y-4 max-w-2xl">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-zinc-300 mb-1">SMTP Host</label>
                <input
                  type="text"
                  value={smtpHost}
                  onChange={e => setSmtpHost(e.target.value)}
                  placeholder="smtp.sendgrid.net"
                  className="w-full bg-zinc-900 border border-zinc-700 text-white rounded-md px-3 py-2 text-sm focus:outline-none focus:border-ember-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-zinc-300 mb-1">Port</label>
                <input
                  type="text"
                  value={smtpPort}
                  onChange={e => setSmtpPort(e.target.value)}
                  placeholder="587"
                  className="w-full bg-zinc-900 border border-zinc-700 text-white rounded-md px-3 py-2 text-sm focus:outline-none focus:border-ember-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-zinc-300 mb-1">Username</label>
                <input
                  type="text"
                  value={smtpUser}
                  onChange={e => setSmtpUser(e.target.value)}
                  placeholder="apikey"
                  className="w-full bg-zinc-900 border border-zinc-700 text-white rounded-md px-3 py-2 text-sm focus:outline-none focus:border-ember-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-zinc-300 mb-1">Password</label>
                <input
                  type="password"
                  value={smtpPass}
                  onChange={e => setSmtpPass(e.target.value)}
                  placeholder={domain?.smtp_host ? "(Leave blank to keep existing)" : "••••••••"}
                  className="w-full bg-zinc-900 border border-zinc-700 text-white rounded-md px-3 py-2 text-sm focus:outline-none focus:border-ember-500"
                />
              </div>
            </div>
            <div className="flex items-center space-x-4 pt-2">
              <Button type="submit" isLoading={isSavingSmtp}>
                Save Settings
              </Button>
              {smtpSaved && <span className="text-emerald-500 text-sm font-medium">Settings saved!</span>}
            </div>
          </form>
        </Card>
      </div>
    </PageContainer>
  );
};
