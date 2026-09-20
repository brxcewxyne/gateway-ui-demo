import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import HubMap from '../components/HubMap';
import { Kpi, PageHead, StatusDot } from '../components/ui';
import { COST_SERIES, LIVE_FEED, TRACES } from '../mocks/data';
import { useGateway } from '../lib/store';
import { pct } from '../lib/format';

export default function Overview() {
  const nav = useNavigate();
  const teams = useGateway(s => s.teams);
  const models = useGateway(s => s.models);
  const connectors = useGateway(s => s.connectors);
  const [feedFilter, setFeedFilter] = useState<string | null>(null);

  // Spatial hierarchy: LEFT = inputs/tools/data, CENTER = gateway, RIGHT = models.
  const hubNodes = [
    { id: 'apps', label: 'Apps ×12', kind: 'app' as const, status: 'connected' },
    ...connectors.slice(0, 3).map(c => ({ id: c.id, label: c.name, kind: 'connector' as const, status: c.status })),
    ...models.slice(0, 4).map(m => ({ id: m.id, label: m.name, kind: 'model' as const, status: m.status })),
  ];

  return (
    <div>
      <PageHead title="Overview — Control Center" sub="Applications connect once. The gateway chooses the model, manages resources, controls tools, and logs every decision."
        right={<><button className="btn" onClick={() => nav('/resources')}>Manage budgets</button><button className="btn btn-primary" onClick={() => nav('/routing')}>Test routing →</button></>} />
      <div className="grid grid-cols-2 md:grid-cols-4 xl:grid-cols-8 gap-2.5">
        <Kpi label="Requests" value="48.2k" sub="+12% · → traces" to="/traces" />
        <Kpi label="Total cost" value="$1,842" sub="→ resources" to="/resources" />
        <Kpi label="Saved by routing" value="$612" sub="33% via cheap picks" to="/routing" />
        <Kpi label="Avg latency" value="1.8s p95" sub="per model →" to="/models" />
        <Kpi label="Models" value={`${models.filter(m=>m.status!=='disabled').length}/${models.length}`} sub="registry →" to="/models" />
        <Kpi label="Connectors" value={`${connectors.filter(c=>c.status==='connected').length}/${connectors.length}`} sub="map →" to="/connectors" />
        <Kpi label="Fallback" value="1.2%" sub="why? → trace" to="/traces/2838" />
        <Kpi label="Compliance" value="99.1%" sub="violations →" to="/security" />
      </div>

      <div className="grid lg:grid-cols-[1.6fr_1fr] gap-3 mt-3">
        <HubMap variant="overview" nodes={hubNodes} onPick={(id) => {
          if (id.startsWith('gpt') || id.includes('claude') || id.includes('gemini') || id.includes('llama')) nav('/models');
          else if (id === 'gw') setFeedFilter(null);
          else nav('/connectors');
        }} />
        <div className="card p-3">
          <div className="flex items-center justify-between mb-2">
            <div className="text-[13px] font-medium text-white">Live decisions</div>
            <Link to="/traces" className="text-[12px] text-blue-400">View all traces →</Link>
          </div>
          <div className="flex flex-col gap-1.5">
            {(feedFilter ? LIVE_FEED.filter(f => f.id === feedFilter) : LIVE_FEED).map(f => (
              <button key={f.id} onClick={() => nav(`/traces/${f.id}`)} className="card card-hover p-2.5 text-left flex items-center gap-2">
                <StatusDot s={f.kind === 'block' ? 'blocked' : f.kind === 'warn' ? 'fallback' : 'allow'} />
                <span className="mono text-[12.5px]">{f.text}</span>
              </button>
            ))}
          </div>
          <div className="mt-3 text-[12px] text-[#8b94a3]">Story: App → <b className="text-white">Gateway</b> → JEV → Policy → Budget → Model → log. <Link className="text-blue-400" to="/routing">See routing →</Link></div>
          <div className="grid grid-cols-2 gap-2 mt-3">
            <div className="card p-2.5">
              <div className="kpi-label">Cost by model (today)</div>
              <div className="h-[110px] mt-1">
                <ResponsiveContainer><BarChart data={[{ m: 'GPT', v: 420 }, { m: 'Claude', v: 890 }, { m: 'Gemini', v: 380 }, { m: 'Local', v: 60 }]}><XAxis dataKey="m" tick={{ fill: '#8b94a3', fontSize: 10 }} /><YAxis hide /><Tooltip contentStyle={{ background: '#12161d', border: '1px solid #2a3546' }} /><Bar dataKey="v" fill="#3b82f6" radius={[4, 4, 0, 0]} /></BarChart></ResponsiveContainer>
              </div>
            </div>
            <div className="card p-2.5">
              <div className="kpi-label">Teams near budget</div>
              {teams.slice(0, 3).map(t => (
                <button key={t.id} onClick={() => nav('/resources')} className="w-full text-left mt-2">
                  <div className="flex justify-between text-[12px]"><span>{t.name}</span><span className={pct(t.spent, t.budget) >= 90 ? 'text-amber-300' : 'text-[#8b94a3]'}>{pct(t.spent, t.budget)}%</span></div>
                  <div className="h-1.5 rounded bg-[#1b2330] mt-1"><div className={`h-1.5 rounded ${pct(t.spent, t.budget) >= 90 ? 'bg-amber-400' : 'bg-blue-500'}`} style={{ width: `${pct(t.spent, t.budget)}%` }} /></div>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="card p-3 mt-3">
        <div className="text-[13px] font-medium text-white mb-2">Cost this week (stacked by model) → <Link className="text-blue-400" to="/resources">Resources</Link></div>
        <div className="h-[180px]">
          <ResponsiveContainer><BarChart data={COST_SERIES}><CartesianGrid stroke="#1b2330" /><XAxis dataKey="d" tick={{ fill: '#8b94a3', fontSize: 11 }} /><YAxis tick={{ fill: '#8b94a3', fontSize: 11 }} /><Tooltip contentStyle={{ background: '#12161d', border: '1px solid #2a3546' }} /><Bar dataKey="gpt" stackId="a" fill="#3b82f6" /><Bar dataKey="claude" stackId="a" fill="#8b5cf6" /><Bar dataKey="gemini" stackId="a" fill="#22c55e" /><Bar dataKey="local" stackId="a" fill="#64748b" /></BarChart></ResponsiveContainer>
        </div>
        <div className="text-[12px] text-[#8b94a3] mt-2">Recent explainable picks: {TRACES.slice(0, 2).map(t => <Link key={t.id} className="text-blue-400 mono mr-3" to={`/traces/${t.id}`}>#{t.id} → {t.selected}</Link>)}</div>
      </div>
    </div>
  );
}
