import React, { useState, useEffect } from 'react';
import { PageContainer } from '../../components/layout/PageContainer';
import { Card } from '../../components/common/Card';
import { Button } from '../../components/common/Button';
import { Trash2, Plus, Bell } from 'lucide-react';
import apiClient from '../../services/apiClient';

export const AlertsPage: React.FC = () => {
  const [domains, setDomains] = useState<any[]>([]);
  const [selectedDomainId, setSelectedDomainId] = useState<string>('');
  const [alerts, setAlerts] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  
  // New rule form
  const [condition, setCondition] = useState('score_below');
  const [threshold, setThreshold] = useState('80');
  const [channel, setChannel] = useState('email');
  const [target, setTarget] = useState('');
  const [isAdding, setIsAdding] = useState(false);

  useEffect(() => {
    apiClient.get('/domains').then(res => {
      setDomains(res.data);
      if (res.data.length > 0) {
        setSelectedDomainId(res.data[0].id);
      }
    });
  }, []);

  useEffect(() => {
    if (!selectedDomainId) return;
    setIsLoading(true);
    apiClient.get(`/alerts/${selectedDomainId}`)
      .then(res => setAlerts(res.data))
      .catch(console.error)
      .finally(() => setIsLoading(false));
  }, [selectedDomainId]);

  const addRule = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedDomainId || !target.trim()) return;
    
    setIsAdding(true);
    try {
      const { data } = await apiClient.post(`/alerts/${selectedDomainId}`, {
        condition,
        threshold: parseInt(threshold),
        channel,
        target,
        is_active: true
      });
      setAlerts([...alerts, data]);
      setTarget('');
    } catch (err) {
      console.error(err);
    } finally {
      setIsAdding(false);
    }
  };

  const deleteRule = async (alertId: string) => {
    if (!confirm('Are you sure you want to delete this alert rule?')) return;
    try {
      await apiClient.delete(`/alerts/${alertId}`);
      setAlerts(alerts.filter(a => a.id !== alertId));
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <PageContainer>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-white mb-2">Alert Rules</h1>
        <p className="text-zinc-400">
          Get notified when your domain health changes or hits a blacklist.
        </p>
      </div>

      <div className="flex items-center space-x-4 mb-8">
        <label className="text-sm font-medium text-zinc-300">Select Domain:</label>
        <select
          value={selectedDomainId}
          onChange={(e) => setSelectedDomainId(e.target.value)}
          className="bg-zinc-900 border border-zinc-700 text-white rounded-md px-4 py-2 focus:outline-none focus:border-ember-500 min-w-[200px]"
        >
          {domains.map(d => (
            <option key={d.id} value={d.id}>{d.domain}</option>
          ))}
          {domains.length === 0 && <option value="">No domains added</option>}
        </select>
      </div>

      {selectedDomainId && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-4">
            <h2 className="text-xl font-semibold text-white mb-4 flex items-center">
              <Bell className="w-5 h-5 mr-2 text-ember-500" />
              Active Rules
            </h2>
            
            {isLoading ? (
              <div className="flex justify-center p-8"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-ember-500"></div></div>
            ) : alerts.length === 0 ? (
              <Card className="p-8 text-center text-zinc-500">
                No alert rules configured for this domain yet.
              </Card>
            ) : (
              alerts.map(alert => (
                <Card key={alert.id} className="p-4 flex items-center justify-between border border-zinc-800/80 hover:border-zinc-700 transition-colors">
                  <div>
                    <div className="flex items-center space-x-2 mb-1">
                      <span className="font-semibold text-white">
                        {alert.condition === 'score_below' ? 'Health Score Drops Below' : 'Blacklist Hit'}
                      </span>
                      {alert.condition === 'score_below' && (
                        <span className="text-ember-500 font-mono bg-ember-500/10 px-2 py-0.5 rounded text-sm font-bold">
                          {alert.threshold}
                        </span>
                      )}
                    </div>
                    <div className="text-sm text-zinc-400 flex items-center">
                      <span className="capitalize mr-2 bg-zinc-800 px-2 py-0.5 rounded text-xs text-zinc-300">{alert.channel}</span>
                      {alert.target}
                    </div>
                  </div>
                  <button
                    onClick={() => deleteRule(alert.id)}
                    className="p-2 text-zinc-500 hover:text-red-500 hover:bg-red-500/10 rounded-md transition-colors"
                    title="Delete rule"
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                </Card>
              ))
            )}
          </div>

          <div>
            <Card className="p-6 sticky top-24">
              <h2 className="text-lg font-semibold text-white mb-4">Add New Rule</h2>
              <form onSubmit={addRule} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-zinc-400 mb-1">Trigger Condition</label>
                  <select 
                    value={condition} 
                    onChange={e => setCondition(e.target.value)}
                    className="w-full bg-zinc-900 border border-zinc-700 text-white rounded-md px-3 py-2 focus:border-ember-500 focus:outline-none"
                  >
                    <option value="score_below">Health score drops below</option>
                    <option value="blacklist_hit">Any blacklist hit</option>
                  </select>
                </div>
                
                {condition === 'score_below' && (
                  <div>
                    <label className="block text-sm font-medium text-zinc-400 mb-1">Threshold Score</label>
                    <input 
                      type="number" 
                      min="0" max="100"
                      value={threshold}
                      onChange={e => setThreshold(e.target.value)}
                      className="w-full bg-zinc-900 border border-zinc-700 text-white rounded-md px-3 py-2 focus:border-ember-500 focus:outline-none"
                    />
                  </div>
                )}

                <div>
                  <label className="block text-sm font-medium text-zinc-400 mb-1">Notification Channel</label>
                  <select 
                    value={channel} 
                    onChange={e => setChannel(e.target.value)}
                    className="w-full bg-zinc-900 border border-zinc-700 text-white rounded-md px-3 py-2 focus:border-ember-500 focus:outline-none"
                  >
                    <option value="email">Email</option>
                    <option value="slack">Slack Webhook</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-zinc-400 mb-1">
                    {channel === 'email' ? 'Email Address' : 'Webhook URL'}
                  </label>
                  <input 
                    type={channel === 'email' ? 'email' : 'url'}
                    required
                    value={target}
                    onChange={e => setTarget(e.target.value)}
                    placeholder={channel === 'email' ? 'team@company.com' : 'https://hooks.slack.com/...'}
                    className="w-full bg-zinc-900 border border-zinc-700 text-white rounded-md px-3 py-2 focus:border-ember-500 focus:outline-none"
                  />
                </div>

                <Button type="submit" isLoading={isAdding} className="w-full mt-2">
                  <Plus className="w-4 h-4 mr-2" />
                  Save Rule
                </Button>
              </form>
            </Card>
          </div>
        </div>
      )}
    </PageContainer>
  );
};
