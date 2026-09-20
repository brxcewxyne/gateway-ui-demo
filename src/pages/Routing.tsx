import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { PageHead, Pipeline } from '../components/ui';
import { jev, type JEVOutput } from '../lib/jev';
import { fmt$ } from '../lib/format';
import { useGateway } from '../lib/store';

export default function Routing() {
  const nav = useNavigate();
  const { mode, setMode, routingRules, toggleRule, addRule, models, notify } = useGateway();
  const [input, setInput] = useState('Summarize customer feedback (200 words)');
  const [team, setTeam] = useState('Marketing AI');
  const [loading, setLoading] = useState(false);
  const [out, setOut] = useState<JEVOutput | null>(null);
  const [newCond, setNewCond] = useState('');

  const run = async () => {
    setLoading(true);
    const r = await jev.analyze({ text: input, team });
    setOut(r); setLoading(false);
  };

  return (
    <div>
      <PageHead title="Routing — why this model?" sub="JEV classifies task + difficulty (mocked, swappable API). Gateway applies policy + budget, then picks the model. Every step is explainable."
        right={<>
          <div className="flex items-center gap-1 card px-2 py-1">
            <button className={`text-[12px] px-2 py-1 rounded ${mode === 'auto' ? 'bg-blue-600 text-white' : 'text-[#8b94a3]'}`} onClick={() => setMode('auto')}>● Auto</button>
            <button className={`text-[12px] px-2 py-1 rounded ${mode === 'manual' ? 'bg-blue-600 text-white' : 'text-[#8b94a3]'}`} onClick={() => setMode('manual')}>○ Manual</button>
          </div>
          <span className="badge"><span className="w-1.5 h-1.5 rounded-full bg-emerald-400" /> JEV mock v2.3</span>
        </>} />
      <div className="card p-3 mb-3"><Pipeline steps={['Incoming', 'JEV task', 'Difficulty', 'Policy', 'Budget', 'Candidates', 'Selected']} active={6} /></div>

      <div className="grid lg:grid-cols-[1.2fr_1fr] gap-3">
        <div className="card p-4">
          <div className="kpi-label mb-1">Incoming request (try it)</div>
          <textarea className="input min-h-[76px]" value={input} onChange={e => setInput(e.target.value)} />
          <div className="flex gap-2 mt-2">
            <select className="input !w-[200px]" value={team} onChange={e => setTeam(e.target.value)}>
              <option>Marketing AI</option><option>AI Team A</option><option>Research</option><option>Finance</option>
            </select>
            <button className="btn btn-primary" onClick={run} disabled={loading}>{loading ? 'JEV analyzing…' : 'Run routing ▶'}</button>
            <button className="btn" onClick={() => { setInput('Analyze these contracts and detect conflicting clauses'); setTeam('AI Team A'); }}>Hard example</button>
            <button className="btn" onClick={() => { setInput('Summarize Q3 ledger'); setTeam('Finance'); }}>Finance example</button>
          </div>

          {out ? (
            <div className="mt-4 border-t border-[#1f2733] pt-3">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                <div className="card p-2.5"><div className="kpi-label">Task</div><div className="text-white text-[14px]">{out.task}</div></div>
                <div className="card p-2.5"><div className="kpi-label">Difficulty</div><div className="text-white text-[14px]">{out.difficulty} <span className="text-[#8b94a3] text-[12px]">conf {(out.confidence * 100).toFixed(0)}%</span></div></div>
                <div className="card p-2.5"><div className="kpi-label">Policy</div><div className="text-[13px] text-white">{out.policy}</div></div>
                <div className="card p-2.5"><div className="kpi-label">Budget</div><div className="text-[13px] text-white">{out.budgetNote}</div></div>
              </div>
              <div className="mt-3">
                <div className="kpi-label mb-1">Candidate models</div>
                {out.candidates.map(c => (
                  <div key={c.modelId} className={`card p-2.5 mb-1.5 flex items-center justify-between ${c.modelId === out.recommendation ? 'border-blue-500/60' : ''}`}>
                    <div><div className="text-white text-[13.5px]">{c.modelName} {c.modelId === out.recommendation && <span className="badge !text-blue-300 !border-blue-500/50 ml-1">✓ selected</span>}</div>
                      <div className="text-[12px] text-[#8b94a3]">{c.note}</div></div>
                    <div className="text-right text-[12px] mono text-[#8b94a3]">{fmt$(c.estCost)} · {c.estLatency}s</div>
                  </div>
                ))}
              </div>
              <div className="card p-3 mt-2 !border-blue-500/40 bg-blue-500/[0.06]">
                <div className="text-[13px] text-white font-medium">Reason: {out.reason}</div>
                <div className="flex gap-2 mt-2">
                  <button className="btn" onClick={() => nav('/traces/2840')}>View full trace →</button>
                  <button className="btn" onClick={() => nav('/models')}>Open model detail →</button>
                </div>
              </div>
            </div>
          ) : (
            <div className="mt-4 text-[13px] text-[#8b94a3]">Run routing to see Task → Difficulty → Policy → Budget → Candidates → Selected + reason. This panel is the CORE explainability loop.</div>
          )}
        </div>

        <div className="flex flex-col gap-3">
          <div className="card p-4">
            <div className="text-[13px] font-medium text-white mb-2">Model priority & fallback ({mode})</div>
            {[...models].sort((a, b) => a.fallbackPriority - b.fallbackPriority).map(m => (
              <div key={m.id} className="flex items-center justify-between py-1.5 border-b border-[#161d28] last:border-0">
                <span className="text-[13px]"><span className="mono text-[#8b94a3]">#{m.fallbackPriority}</span> <Link className="text-white hover:text-blue-300" to="/models">{m.name}</Link></span>
                <span className="flex gap-1">
                  <button className="btn !px-2 !py-0.5" onClick={() => useGateway.getState().bumpPriority(m.id, -1)}>↑</button>
                  <button className="btn !px-2 !py-0.5" onClick={() => useGateway.getState().bumpPriority(m.id, 1)}>↓</button>
                </span>
              </div>
            ))}
            <div className="text-[12px] text-[#8b94a3] mt-2">Fallback chain auto-applies on error/latency. Manual mode pins the top-priority allowed model.</div>
          </div>
          <div className="card p-4">
            <div className="text-[13px] font-medium text-white mb-2">Routing rules</div>
            {routingRules.map(r => (
              <div key={r.id} className="flex items-center justify-between gap-2 py-1.5 border-b border-[#161d28] last:border-0">
                <div><div className="mono text-[12px] text-white">{r.cond}</div><div className="text-[11px] text-[#8b94a3]">{r.action}</div></div>
                <button className={`text-[11px] px-2 py-1 rounded border ${r.on ? 'border-emerald-500/50 text-emerald-300' : 'border-[#2a3546] text-[#8b94a3]'}`} onClick={() => toggleRule(r.id)}>{r.on ? 'ON' : 'OFF'}</button>
              </div>
            ))}
            <div className="flex gap-2 mt-2">
              <input className="input" placeholder="IF team=research AND budget>90% THEN prefer gemini…" value={newCond} onChange={e => setNewCond(e.target.value)} />
              <button className="btn btn-primary shrink-0" onClick={() => { if (!newCond.trim()) return notify('Describe the condition first'); addRule(newCond, 'Custom'); setNewCond(''); }}>Add</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
