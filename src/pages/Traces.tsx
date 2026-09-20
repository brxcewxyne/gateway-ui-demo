import { Link, useNavigate, useParams } from 'react-router-dom';
import { CostCell, PageHead, Pipeline, StatusDot } from '../components/ui';
import { TRACES } from '../mocks/data';
import { fmt$ } from '../lib/format';

export function Traces() {
  const nav = useNavigate();
  return (
    <div>
      <PageHead title="Request Traces" sub="Why did the gateway choose this model? Click any row for the visual timeline."
        right={<button className="btn btn-primary" onClick={() => nav('/routing')}>Replay in routing →</button>} />
      <div className="card overflow-hidden">
        <table className="w-full text-[13px]">
          <thead><tr className="text-left text-[#8b94a3] text-[11.5px] uppercase border-b border-[#1f2733]"><th className="p-3">Request</th><th>App / Team</th><th>Task</th><th>Selected</th><th>Cost</th><th>Latency</th><th>Decision</th></tr></thead>
          <tbody>{TRACES.map(t => (
            <tr key={t.id} className="table-row border-b border-[#161d28] cursor-pointer" onClick={() => nav(`/traces/${t.id}`)}>
              <td className="p-3 mono text-white">#{t.id}</td>
              <td className="text-[12px]">{t.app}<br /><span className="text-[#8b94a3]">{t.team}</span></td>
              <td className="text-[12px]">{t.task} · {t.difficulty}</td>
              <td className="text-[12px] text-white">{t.selected}</td>
              <td><CostCell v={t.cost} /></td>
              <td className="mono">{t.latency ? `${t.latency}s` : '—'}</td>
              <td><span className="flex items-center gap-1.5 text-[12px]"><StatusDot s={t.decision} /> {t.decision}</span></td>
            </tr>
          ))}</tbody>
        </table>
      </div>
    </div>
  );
}

export function TraceDetail() {
  const { id } = useParams();
  const nav = useNavigate();
  const t = TRACES.find(x => x.id === id) ?? TRACES[0];
  const steps = [
    { l: `Application: ${t.app} (${t.team})`, d: `"${t.input}"`, s: 'info' as const },
    { l: 'Gateway received', d: `${t.time} · id #${t.id}`, s: 'info' as const },
    { l: `JEV: ${t.task} / ${t.difficulty}`, d: `confidence ${(t.confidence * 100).toFixed(0)}% (mock, swappable API)`, s: 'info' as const },
    { l: `Policy: ${t.policy}`, d: t.policyPass ? 'Passed ✓' : 'BLOCKED ✕', s: t.policyPass ? 'ok' as const : 'block' as const },
    { l: 'Resource / budget check', d: t.budgetPass ? 'Passed ✓' : 'Over budget ⚠ → prefer cheap', s: t.budgetPass ? 'ok' as const : 'warn' as const },
    ...t.candidates.map(c => ({ l: `Candidate: ${c.model}`, d: `${fmt$(c.cost)} · ${c.lat}s · ${c.score}`, s: 'info' as const })),
    { l: `Selected: ${t.selected}`, d: t.reason, s: t.decision === 'blocked' ? 'block' as const : 'ok' as const },
    { l: `Response logged`, d: `${t.latency ? `${t.latency}s · ` : ''}${fmt$(t.cost)} · audit written`, s: 'info' as const },
  ];
  return (
    <div>
      <PageHead title={`Request #${t.id}`} sub={`${t.app} · ${t.team} · ${t.time}`}
        right={<><button className="btn" onClick={() => { navigator.clipboard?.writeText(`curl gateway/api -d '${t.input}'`); }}>Copy curl</button><button className="btn" onClick={() => nav('/routing')}>Replay</button><button className="btn btn-primary" onClick={() => nav('/audit')}>Open audit →</button></>} />
      <div className="card p-3 mb-3"><Pipeline steps={['App', 'Gateway', 'JEV', 'Policy', 'Budget', 'Selected', 'Logged']} /></div>
      <div className="grid lg:grid-cols-[1.4fr_1fr] gap-3">
        <div className="card p-4">
          {steps.map((s, i) => (
            <div key={i} className="flex gap-3">
              <div className="flex flex-col items-center"><div className="step-dot">{s.s === 'ok' ? '✓' : s.s === 'block' ? '✕' : s.s === 'warn' ? '!' : '·'}</div>{i < steps.length - 1 && <div className="w-px flex-1 bg-[#243044]" />}</div>
              <div className="pb-4"><div className="text-[13.5px] text-white">{s.l}</div><div className="text-[12.5px] text-[#8b94a3]">{s.d}</div></div>
            </div>
          ))}
        </div>
        <div className="flex flex-col gap-3">
          <div className="card p-4"><div className="kpi-label">Decision summary</div><div className="text-white text-[15px] mt-1">{t.selected}</div><div className="text-[13px] text-[#8b94a3] mt-1">{t.reason}</div>
            <div className="flex gap-4 mt-2 mono text-[12px] text-[#8b94a3]"><span>cost {fmt$(t.cost)}</span><span>lat {t.latency}s</span><span className="flex items-center gap-1"><StatusDot s={t.decision} />{t.decision}</span></div></div>
          <div className="card p-4 text-[12.5px] text-[#8b94a3]">Next: <Link className="text-blue-400" to="/audit">see in audit →</Link> · <Link className="text-blue-400" to="/resources">check team budget →</Link> · <Link className="text-blue-400" to="/routing">tune routing →</Link></div>
        </div>
      </div>
    </div>
  );
}
