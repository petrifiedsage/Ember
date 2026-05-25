import React, { useState, useEffect } from 'react';
import { PageContainer } from '../../components/layout/PageContainer';
import { Card } from '../../components/common/Card';
import { Button } from '../../components/common/Button';
import { ArrowLeft, Copy, Mail, Loader2, CheckCircle2 } from 'lucide-react';
import { Link, useParams } from 'react-router-dom';
import apiClient from '../../services/apiClient';
import { SeedResultGrid } from '../../components/seed/SeedResultGrid';

export const SeedTestPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [domain, setDomain] = useState<any>(null);
  const [subjectHint, setSubjectHint] = useState('');
  const [testId, setTestId] = useState<string | null>(null);
  const [seedAddresses, setSeedAddresses] = useState<string[]>([]);
  const [status, setStatus] = useState<string>('input'); // input | polling | complete
  const [results, setResults] = useState<any[]>([]);
  const [isStarting, setIsStarting] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    apiClient.get('/domains').then(res => {
      const current = res.data.find((d: any) => d.id === id);
      setDomain(current);
    });
  }, [id]);

  useEffect(() => {
    if (status !== 'polling' || !testId) return;

    const poll = setInterval(async () => {
      try {
        const { data } = await apiClient.get(`/seed-tests/tests/${testId}/result`);
        if (data.status === 'completed' || data.status === 'failed') {
          setResults(data.results);
          setStatus('completed');
          clearInterval(poll);
        }
      } catch (err) {
        console.error(err);
      }
    }, 3000);

    return () => clearInterval(poll);
  }, [status, testId]);

  const startTest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!subjectHint.trim()) return;
    
    setIsStarting(true);
    try {
      const { data } = await apiClient.post(`/seed-tests/${id}/run`, {
        subject_hint: subjectHint
      });
      setTestId(data.test_id);
      setSeedAddresses(data.seed_addresses);
      setStatus('polling');
    } catch (err) {
      console.error(err);
    } finally {
      setIsStarting(false);
    }
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(seedAddresses.join(', '));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <PageContainer>
      <Link to={`/domains/${id}`} className="inline-flex items-center text-sm text-zinc-400 hover:text-white mb-6 transition-colors">
        <ArrowLeft className="w-4 h-4 mr-1" />
        Back to Domain
      </Link>

      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white mb-2">Run Seed Test</h1>
        <p className="text-zinc-400">
          Find out exactly where your emails land across Gmail, Outlook, and Yahoo.
        </p>
      </div>

      <div className="max-w-3xl">
        {status === 'input' && (
          <Card className="p-8">
            <h2 className="text-xl font-semibold text-white mb-4">Step 1: Configure Test</h2>
            <form onSubmit={startTest} className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-zinc-300 mb-2">
                  What is the exact Subject line of the email you will send?
                </label>
                <input
                  type="text"
                  required
                  value={subjectHint}
                  onChange={e => setSubjectHint(e.target.value)}
                  className="w-full bg-zinc-900 border border-zinc-700 text-white rounded-md px-4 py-2 focus:outline-none focus:border-ember-500"
                  placeholder="e.g. Q4 Marketing Update"
                />
                <p className="text-xs text-zinc-500 mt-2">
                  We use this subject to uniquely identify your email in our seed inboxes.
                </p>
              </div>
              <Button type="submit" isLoading={isStarting} disabled={!subjectHint.trim()}>
                Start Test
              </Button>
            </form>
          </Card>
        )}

        {(status === 'polling' || status === 'completed') && (
          <div className="space-y-6">
            <Card className="p-8 border-ember-500/30 border">
              <div className="flex items-start justify-between">
                <div>
                  <h2 className="text-xl font-semibold text-white mb-2">Step 2: Send your email</h2>
                  <p className="text-zinc-400 text-sm mb-6 max-w-lg">
                    To accurately test <strong>your</strong> email infrastructure's deliverability, you must send this test from your own email client or marketing platform (e.g. Gmail, Mailchimp, SendGrid). 
                    <br/><br/>
                    Copy the email addresses below, add them as BCC recipients, and send an email with the exact subject: <span className="font-mono text-ember-400">"{subjectHint}"</span>.
                  </p>
                </div>
                {status === 'polling' ? (
                  <div className="flex items-center space-x-2 text-ember-500 bg-ember-500/10 px-4 py-2 rounded-full text-sm font-medium border border-ember-500/20">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Listening...</span>
                  </div>
                ) : (
                  <div className="flex items-center space-x-2 text-green-500 bg-green-500/10 px-4 py-2 rounded-full text-sm font-medium border border-green-500/20">
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Complete</span>
                  </div>
                )}
              </div>

              <div className="bg-zinc-900 rounded-lg border border-zinc-700 p-4 relative">
                <div className="font-mono text-sm text-zinc-300 break-all pr-12">
                  {seedAddresses.join(', ')}
                </div>
                <button
                  onClick={copyToClipboard}
                  className="absolute top-4 right-4 p-2 bg-zinc-800 hover:bg-zinc-700 rounded-md transition-colors text-zinc-400 hover:text-white"
                  title="Copy addresses"
                >
                  {copied ? <CheckCircle2 className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
                </button>
              </div>
            </Card>

            <Card className="p-8">
              <h2 className="text-xl font-semibold text-white mb-6">Step 3: Results</h2>
              {status === 'polling' ? (
                <div className="text-center py-12">
                  <Mail className="w-12 h-12 text-zinc-600 mx-auto mb-4 animate-bounce" />
                  <p className="text-zinc-400">Waiting to receive your email in our seed inboxes...</p>
                  <p className="text-sm text-zinc-500 mt-2">This may take up to 2 minutes. Feel free to leave this page, results will be saved.</p>
                </div>
              ) : (
                <SeedResultGrid results={results} />
              )}
            </Card>
          </div>
        )}
      </div>
    </PageContainer>
  );
};
