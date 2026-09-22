import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import HubMap from '../components/HubMap';
import { Kpi, PageHead, SectionTitle, StatusDot, UsageBars } from '../components/ui';
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

  const totalReq = models.reduce((a, m) => a + m.requests, 0);

  return (
    <div>
      <PageHead eyebrow="Control Center" title="Overview" sub="Applications connect once. The gateway chooses the model, manages resources, controls tools, and logs every decision."
        right={<><button className="btn" onClick={() => nav('/resources')}>Manage budgets</button><button className="btn btn-primary" onClick={() => nav('/routing')}>Test routing →</button></>} />

      {/* Primary layer — what is happening right now */}
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-3">
        <Kpi label="Active requests" value="48.2k" sub="+12% this week · → traces" to="/traces" accent="#3b82f6" />
        <Kpi label="Total cost" value="$1,842" sub="33% saved by routing · → resources" to="/resources" accent="#22d3ee" />
        <Kpi label="Avg latency" value="1.8s p95" sub="slowest: Claude 3.1s · → models" to="/models" accent="#a78bfa" />
        <Kpi label="Fallback rate" value="1.2%" sub="99.1% policy compliance · → trace" to="/traces/2838" accent="#fbbf24" />
      </div>

      {/* Hero — routing visualization + operations rail */}
      <div className="grid lg:grid-cols-[1.65fr_1fr] gap-3 mt-3 items-stretch">
        <HubMap variant="overview" nodes={hubNodes} onPick={(id) => {
          if (id.startsWith('gpt') || id.includes('claude') || id.includes('gemini') || id.includes('llama')) nav('/models');
          else if (id === 'gw') setFeedFilter(null);
          else nav('/connectors');
        }} />
        <div className="flex flex-col gap-3">
          <div className="card p-4">
            <SectionTitle title="Gateway status" sub="Live infrastructure state" right={<Link to="/traces" className="text-[12px] text-[#2470D8]">Live →</Link>} />
            <div className="grid grid-cols-2 gap-2 mt-1">
              {[
                ['Models online', `${models.filter(m => m.status !== 'disabled').length}/${models.length}`, '/models'],
                ['Connectors', `${connectors.filter(c => c.status === 'connected').length}/${connectors.length}`, '/connectors'],
                ['JEV router', 'Mock v2.3', '/routing'],
                ['Compliance', '99.1%', '/security'],
              ].map(([l, v, to]) => (
                <button key={l} onClick={() => nav(to)} className="card card-hover p-2.5 text-left">
                  <div className="kpi-label">{l}</div>
                  <div className="metric text-[17px] mt-0.5">{v}</div>
                </button>
              ))}
            </div>
          </div>
          <div className="card p-4 flex-1">
            <SectionTitle title="Live decisions" right={<Link to="/traces" className="text-[12px] text-[#2470D8]">All traces →</Link>} />
            <div className="flex flex-col gap-1.5">
              {(feedFilter ? LIVE_FEED.filter(f => f.id === feedFilter) : LIVE_FEED).map(f => (
                <button key={f.id} onClick={() => nav(`/traces/${f.id}`)} className="card card-hover p-2.5 text-left flex items-center gap-2">
                  <StatusDot s={f.kind === 'block' ? 'blocked' : f.kind === 'warn' ? 'fallback' : 'allow'} />
                  <span className="mono text-[12.5px]">{f.text}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Secondary layer — distribution, budget pressure, cost history */}
      <div className="grid lg:grid-cols-3 gap-3 mt-3 items-stretch">
        <div className="card p-4">
          <SectionTitle title="Model distribution" sub={`${totalReq.toLocaleString()} requests · 7d`} right={<Link to="/models" className="text-[12px] text-[#2470D8]">Models →</Link>} />
          <UsageBars rows={[
            { label: 'GPT-4o mini', pct: 38, color: '#22d3ee', meta: '18.2k req' },
            { label: 'Claude Sonnet 4', pct: 27, color: '#a78bfa', meta: '9.4k req' },
            { label: 'Gemini Flash', pct: 24, color: '#3b82f6', meta: '12.2k req' },
            { label: 'Llama Private', pct: 11, color: '#34d399', meta: '8.2k req' },
          ]} />
        </div>
        <div className="card p-4">
          <SectionTitle title="Budget pressure" sub="Routing reroutes hot teams" right={<Link to="/resources" className="text-[12px] text-[#2470D8]">Resources →</Link>} />
          {teams.slice(0, 3).map(t => (
            <button key={t.id} onClick={() => nav('/resources')} className="w-full text-left mt-2.5 first:mt-1">
              <div className="flex justify-between text-[12px]"><span className="text-[#33415C] font-medium">{t.name}</span><span className={pct(t.spent, t.budget) >= 90 ? 'text-[#B45309] mono' : 'text-[#5B6B82] mono'}>${t.spent} / ${t.budget}</span></div>
              <div className="ubar mt-1.5"><div style={{ width: `${pct(t.spent, t.budget)}%`, background: pct(t.spent, t.budget) >= 90 ? '#fbbf24' : '#3b82f6' }} /></div>
            </button>
          ))}
        </div>
        <div className="card p-4">
          <SectionTitle title="Cost this week" sub="Stacked by model" right={<Link to="/resources" className="text-[12px] text-[#2470D8]">Detail →</Link>} />
          <div className="h-[168px]">
            <ResponsiveContainer><BarChart data={COST_SERIES} margin={{ top: 4, right: 4, bottom: 0, left: -18 }}><CartesianGrid stroke="#E4EAF3" vertical={false} /><XAxis dataKey="d" tick={{ fill: '#8FA0B5', fontSize: 11 }} axisLine={false} tickLine={false} /><YAxis tick={{ fill: '#8FA0B5', fontSize: 11 }} axisLine={false} tickLine={false} /><Tooltip contentStyle={{ background: '#FFFFFF', border: '1px solid #E0E7F2', borderRadius: 10 }} /><Bar dataKey="gpt" stackId="a" fill="#22d3ee" /><Bar dataKey="claude" stackId="a" fill="#a78bfa" /><Bar dataKey="gemini" stackId="a" fill="#3b82f6" /><Bar dataKey="local" stackId="a" fill="#34d399" radius={[3, 3, 0, 0]} /></BarChart></ResponsiveContainer>
          </div>
          <div className="text-[12px] text-[#5B6B82] mt-1">Recent picks: {TRACES.slice(0, 2).map(t => <Link key={t.id} className="text-[#2470D8] mono mr-3" to={`/traces/${t.id}`}>#{t.id} → {t.selected}</Link>)}</div>
        </div>
      </div>
    </div>
  );
}
