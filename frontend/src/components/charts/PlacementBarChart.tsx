import React, { useEffect, useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend } from 'recharts';
import apiClient from '../../services/apiClient';

interface PlacementBarChartProps {
  domainId: string;
}

export const PlacementBarChart: React.FC<PlacementBarChartProps> = ({ domainId }) => {
  const [data, setData] = useState<any[]>([]);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const { data: tests } = await apiClient.get(`/seed-tests/${domainId}`);
        // We need to aggregate the results of these tests
        const aggregateData = [
          { name: 'Gmail', Inbox: 0, Spam: 0, Promotions: 0 },
          { name: 'Outlook', Inbox: 0, Spam: 0, Promotions: 0 },
          { name: 'Yahoo', Inbox: 0, Spam: 0, Promotions: 0 }
        ];

        for (const test of tests) {
          try {
            const { data: result } = await apiClient.get(`/seed-tests/tests/${test.id}/result`);
            result.results.forEach((r: any) => {
              const providerRow = aggregateData.find(d => d.name.toLowerCase() === r.provider.toLowerCase());
              if (providerRow) {
                if (r.placement === 'inbox') providerRow.Inbox++;
                else if (r.placement === 'spam') providerRow.Spam++;
                else if (r.placement === 'promotions') providerRow.Promotions++;
              }
            });
          } catch (e) {
            // Ignore if test results not ready
          }
        }
        
        setData(aggregateData);
      } catch (error) {
        console.error(error);
      }
    };
    fetchStats();
  }, [domainId]);

  if (data.length === 0 || data.every(d => d.Inbox === 0 && d.Spam === 0 && d.Promotions === 0)) {
    return (
      <div className="h-64 flex items-center justify-center text-zinc-500 text-sm">
        No seed test placement data available yet.
      </div>
    );
  }

  return (
    <div>
      <h3 className="text-lg font-medium text-white mb-6">Historical Inbox Placement</h3>
      <div className="h-72">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#27272a" vertical={false} />
            <XAxis dataKey="name" stroke="#a1a1aa" fontSize={12} tickLine={false} axisLine={false} />
            <YAxis stroke="#a1a1aa" fontSize={12} tickLine={false} axisLine={false} />
            <Tooltip
              contentStyle={{ backgroundColor: '#18181b', borderColor: '#27272a', borderRadius: '0.5rem', color: '#fff' }}
              itemStyle={{ color: '#fff' }}
              cursor={{ fill: '#27272a', opacity: 0.4 }}
            />
            <Legend wrapperStyle={{ paddingTop: '15px' }} />
            <Bar dataKey="Inbox" stackId="a" fill="#10b981" radius={[0, 0, 4, 4]} />
            <Bar dataKey="Promotions" stackId="a" fill="#f59e0b" />
            <Bar dataKey="Spam" stackId="a" fill="#ef4444" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};
