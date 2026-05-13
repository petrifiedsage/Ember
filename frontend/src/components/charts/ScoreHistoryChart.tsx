import React, { useEffect, useState } from 'react';
import {
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Area, AreaChart
} from 'recharts';
import apiClient from '../../services/apiClient';

interface ScoreHistoryChartProps {
  domainId: string;
}

export const ScoreHistoryChart: React.FC<ScoreHistoryChartProps> = ({ domainId }) => {
  const [data, setData] = useState([]);
  const [days, setDays] = useState(30);

  useEffect(() => {
    const fetchHistory = async () => {
      try {
        const to = new Date().toISOString().split('T')[0];
        const fromDate = new Date();
        fromDate.setDate(fromDate.getDate() - days);
        const from = fromDate.toISOString().split('T')[0];
        const res = await apiClient.get(`/metrics/${domainId}/score-history?from=${from}&to=${to}`);
        // sort chronologically
        const sorted = res.data.sort((a: any, b: any) => new Date(a.date).getTime() - new Date(b.date).getTime());
        setData(sorted);
      } catch (error) {
        console.error("Failed to fetch score history", error);
      }
    };
    fetchHistory();
  }, [domainId, days]);

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-zinc-800 border border-zinc-700 p-3 rounded-lg shadow-lg">
          <p className="text-zinc-400 text-sm mb-1">{label}</p>
          <p className="text-white font-bold">
            Score: <span className="text-ember-500">{payload[0].value}</span>
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="w-full h-80">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-semibold text-white">Score History</h3>
        <select 
          className="bg-zinc-800 border border-zinc-700 text-zinc-300 rounded-md px-3 py-1.5 text-sm focus:outline-none focus:border-ember-500 transition-colors"
          value={days}
          onChange={(e) => setDays(Number(e.target.value))}
        >
          <option value={7}>Last 7 Days</option>
          <option value={30}>Last 30 Days</option>
          <option value={90}>Last 90 Days</option>
        </select>
      </div>
      
      {data.length === 0 ? (
        <div className="h-64 flex items-center justify-center text-zinc-500 text-sm bg-zinc-900/50 rounded-lg border border-zinc-800/50">
          No history data available yet.
        </div>
      ) : (
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
            <defs>
              <linearGradient id="colorScore" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#f97316" stopOpacity={0.3}/>
                <stop offset="95%" stopColor="#f97316" stopOpacity={0}/>
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#27272a" vertical={false} />
            <XAxis 
              dataKey="date" 
              stroke="#a1a1aa" 
              fontSize={12} 
              tickLine={false} 
              axisLine={false}
              tickFormatter={(val) => {
                const d = new Date(val);
                return `${d.getMonth()+1}/${d.getDate()}`;
              }}
            />
            <YAxis 
              stroke="#a1a1aa" 
              fontSize={12} 
              tickLine={false} 
              axisLine={false} 
              domain={[0, 100]} 
            />
            <Tooltip content={<CustomTooltip />} />
            <Area 
              type="monotone" 
              dataKey="health_score" 
              stroke="#f97316" 
              fillOpacity={1} 
              fill="url(#colorScore)" 
              strokeWidth={3}
              activeDot={{ r: 6, fill: '#f97316', stroke: '#18181b', strokeWidth: 2 }}
            />
          </AreaChart>
        </ResponsiveContainer>
      )}
    </div>
  );
};
