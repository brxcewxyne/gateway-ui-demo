import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Line, LineChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis, Bar, BarChart } from 'recharts';
import { CostCell, PageHead, StatusDot } from '../components/ui';
import { COST_SERIES } from '../mocks/data';
import { useGateway } from '../lib/store';
import { fmt$, fmtNum, pct } from '../lib/format';

export default function Resources() {
  const nav = useNavigate();
  const { teams, updateTeam, addRule, notify } = useGateway();
  const [editing, setEditing] = useState<string | null>(null);
  const [form, setForm] = useState({ budget: 1000, quotaTokensM: 100, throttleAt: 80 });

  const total = teams.reduce((a, t) => a + t.spent, 0);
  const budget = teams.reduce((a, t) => a + t.budget, 0);

  const openEdit = (id: string) => {
    const t = teams.find(x => x.id === id)!;
    setEditing(id); setForm({ budget: t.budget, quotaTokensM: t.quotaTokensM, throttleAt: t.throttleAt });
  };

  return (
    <div>
      <PageHead eyebrow="Resource Management" title="Resources — control spend, not just watch it" sub="Resource state feeds routing: near-budget teams get rerouted to cheaper capable models. Act here, see effect in Routing."
        right={<><button className="btn" onClick={() => nav('/routing')}>Open routing →</button><button className="btn btn-primary" onClick={() => notify('Alert rule saved: notify at 80%')}>+ Alert rule</button></>} />
      <div className="grid grid-cols-2 md:grid-cols-5 gap-2.5">
        {[['Total cost', fmt$(total * 5), `${pct(total, budget)}% of budget`], ['Budget left', fmt$((budget - total) * 5), 'across 4 teams'], ['Tokens', '412M', 'quota 550M'], ['Requests', fmtNum(312400), '7 days'], ['Avg latency', '1.8s p95', 'per model below']].map(([l, v, s]) => (
          <div key={l} className="card p-3.5"><div className="kpi-label">{l}</div><div className="text-[20px] font-semibold text-[#0E1626] mt-1">{v}</div><div className="text-[12px] text-[#5B6B82]">{s}</div></div>
        ))}
      </div>

      <div className="grid lg:grid-cols-2 gap-3 mt-3">
        <div className="card p-3"><div className="text-[13px] text-[#0E1626] font-medium mb-1">Cost over time ($)</div>
          <div className="h-[190px]"><ResponsiveContainer><LineChart data={COST_SERIES}><CartesianGrid stroke="#E4EAF3" /><XAxis dataKey="d" tick={{ fill: '#5B6B82', fontSize: 11 }} /><YAxis tick={{ fill: '#5B6B82', fontSize: 11 }} /><Tooltip contentStyle={{ background: '#FFFFFF', border: '1px solid #E0E7F2' }} /><Line dataKey="gpt" stroke="#22d3ee" dot={false} strokeWidth={2} /><Line dataKey="claude" stroke="#a78bfa" dot={false} strokeWidth={2} /><Line dataKey="gemini" stroke="#3b82f6" dot={false} strokeWidth={2} /></LineChart></ResponsiveContainer></div>
        </div>
        <div className="card p-3"><div className="text-[13px] text-[#0E1626] font-medium mb-1">Latency by model (p50 / p95, s)</div>
          <div className="h-[190px]"><ResponsiveContainer><BarChart data={[{ m: 'GPT', p50: 0.6, p95: 1.2 }, { m: 'Claude', p50: 1.8, p95: 3.1 }, { m: 'Gemini', p50: 0.7, p95: 1.5 }, { m: 'Local', p50: 0.9, p95: 2.0 }]}><CartesianGrid stroke="#E4EAF3" /><XAxis dataKey="m" tick={{ fill: '#5B6B82', fontSize: 11 }} /><YAxis tick={{ fill: '#5B6B82', fontSize: 11 }} /><Tooltip contentStyle={{ background: '#FFFFFF', border: '1px solid #E0E7F2' }} /><Bar dataKey="p50" fill="#3b82f6" radius={[4, 4, 0, 0]} /><Bar dataKey="p95" fill="#22d3ee" opacity={0.45} radius={[4, 4, 0, 0]} /></BarChart></ResponsiveContainer></div>
        </div>
      </div>

      <div className="card p-4 mt-3" id="budgets">
        <div className="flex items-center justify-between mb-2"><div className="text-[14px] font-medium text-[#0E1626]">Budgets, quotas & actions</div><div className="text-[12px] text-[#5B6B82]">edits persist + influence routing</div></div>
        {teams.map(t => {
          const p = pct(t.spent, t.budget);
          const hot = p >= 90;
          return (
            <div key={t.id} className="border-t border-[#E8EDF4] py-3 first:border-0">
              <div className="flex flex-wrap items-center gap-3 justify-between">
                <div className="min-w-[220px]">
                  <div className="text-[#0E1626] text-[13.5px] font-medium flex items-center gap-2">{t.name} <StatusDot s={hot ? 'warn' : 'allow'} /> {hot && <span className="badge !text-[#B45309] !border-amber-500/40">near limit — reroute active</span>}</div>
                  <div className="text-[12px] text-[#5B6B82] mono">${t.spent} / ${t.budget} · {t.usedTokensM}/{t.quotaTokensM}M tokens · {fmtNum(t.reqUsed)}/{fmtNum(t.reqLimit)} req</div>
                  <div className="ubar mt-1.5 w-[280px] max-w-full"><div style={{ width: `${p}%`, background: hot ? '#fbbf24' : '#3b82f6' }} /></div>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  <button className="btn !text-[12px]" onClick={() => openEdit(t.id)}>Set budget / quota</button>
                  <button className="btn !text-[12px]" onClick={() => { updateTeam(t.id, { throttleAt: 70 }); }}>Throttle</button>
                  <button className="btn !text-[12px]" onClick={() => { addRule(`IF team=${t.id} AND budget>90% THEN prefer gpt-4o-mini`, 'Budget-aware reroute'); nav('/routing'); }}>Reroute to cheap →</button>
                  <button className="btn !text-[12px]" onClick={() => notify(`Alert at ${t.throttleAt}% saved for ${t.name}`)}>Alert @ {t.throttleAt}%</button>
                </div>
              </div>
              {editing === t.id && (
                <div className="grid md:grid-cols-4 gap-2 mt-3 card p-3 !bg-[#EDF2F8]">
                  <label className="text-[12px] text-[#5B6B82]">Budget $<input type="number" className="input mt-1" value={form.budget} onChange={e => setForm({ ...form, budget: +e.target.value })} /></label>
                  <label className="text-[12px] text-[#5B6B82]">Token quota (M)<input type="number" className="input mt-1" value={form.quotaTokensM} onChange={e => setForm({ ...form, quotaTokensM: +e.target.value })} /></label>
                  <label className="text-[12px] text-[#5B6B82]">Alert threshold %<input type="number" className="input mt-1" value={form.throttleAt} onChange={e => setForm({ ...form, throttleAt: +e.target.value })} /></label>
                  <div className="flex items-end gap-2"><button className="btn btn-primary" onClick={() => { updateTeam(t.id, form); setEditing(null); }}>Save</button><button className="btn" onClick={() => setEditing(null)}>Cancel</button></div>
                </div>
              )}
            </div>
          );
        })}
        <div className="text-[12px] text-[#5B6B82] mt-2">Example: Research at 95% → <Link className="text-[#2470D8] mono" to="/traces/2838">trace #2838</Link> shows Claude → Gemini fallback to protect budget.</div>
      </div>

      <div className="card p-3 mt-3 overflow-x-auto">
        <div className="text-[13px] text-[#0E1626] font-medium mb-2">Usage by team × model</div>
        <table className="w-full text-[12.5px]"><thead><tr className="text-left text-[#5B6B82]"><th className="py-1">Team</th><th>Top model</th><th>Req</th><th>Cost/req</th><th>Latency</th><th></th></tr></thead>
          <tbody>{[['AI Team A', 'Claude', '78.2k', 0.012, '2.4s'], ['Marketing AI', 'GPT-4o mini', '21.4k', 0.001, '0.7s'], ['Research', 'Gemini', '55.8k', 0.004, '1.5s'], ['Finance', 'Llama Private', '18.2k', 0.0004, '0.9s']].map(r => (
            <tr key={r[0] as string} className="table-row border-t border-[#E8EDF4]"><td className="py-2 text-[#0E1626]">{r[0]}</td><td>{r[1]}</td><td className="mono">{r[2]}</td><td><CostCell v={r[3] as number} /></td><td className="mono">{r[4]}</td><td><button className="text-[#2470D8]" onClick={() => nav('/traces')}>traces →</button></td></tr>
          ))}</tbody></table>
      </div>
    </div>
  );
}
