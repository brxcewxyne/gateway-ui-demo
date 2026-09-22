import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { CostCell, PageHead, StatusDot } from '../components/ui';
import { TRACES } from '../mocks/data';
import { useGateway } from '../lib/store';

export default function Audit() {
  const nav = useNavigate();
  const notify = useGateway(s => s.notify);
  const keyAudit = useGateway(s => s.keyAudit);
  const [f, setF] = useState({ q: '', decision: 'all' });
  const rows = TRACES.filter(t => (f.decision === 'all' || t.decision === f.decision) && (!f.q || (t.id + t.app + t.selected).toLowerCase().includes(f.q.toLowerCase())));
  const keyRows = keyAudit.filter(e => !f.q || (e.action + e.detail + e.actor).toLowerCase().includes(f.q.toLowerCase()));

  return (
    <div>
      <PageHead eyebrow="Observability" title="Audit Logs" sub="Flat compliance record. Every row links back to its trace."
        right={<button className="btn" onClick={() => notify('CSV exported (filtered rows)')}>Export CSV</button>} />
      <div className="card p-3 mb-3 flex flex-wrap gap-2">
        <input className="input !w-[260px]" placeholder="Filter app, model, #id…" value={f.q} onChange={e => setF({ ...f, q: e.target.value })} />
        {['all', 'allow', 'blocked', 'fallback'].map(d => (
          <button key={d} className={`btn !py-1 ${f.decision === d ? '!border-blue-500 !text-[#0E1626]' : ''}`} onClick={() => setF({ ...f, decision: d })}>{d}</button>
        ))}
        <span className="badge">model ▾</span><span className="badge">team ▾</span><span className="badge">connector ▾</span><span className="badge">date ▾</span>
      </div>
      <div className="card overflow-hidden">
        <table className="w-full text-[12.5px]">
          <thead><tr className="text-left text-[#5B6B82] text-[11px] uppercase border-b border-[#E3E9F2]"><th className="p-2.5">Time</th><th>App</th><th>Request</th><th>Model</th><th>Tool</th><th>Decision</th><th>Cost</th><th>Latency</th><th>Status</th></tr></thead>
          <tbody>{rows.map(t => (
            <tr key={t.id} className="table-row border-b border-[#E8EDF4] cursor-pointer" onClick={() => nav(`/traces/${t.id}`)}>
              <td className="p-2.5 mono">{t.time}</td><td>{t.app}</td><td className="mono">#{t.id}</td><td>{t.selected}</td><td className="mono">{t.tool ?? '—'}</td>
              <td><span className="flex items-center gap-1.5"><StatusDot s={t.decision} />{t.decision}</span></td>
              <td><CostCell v={t.cost} /></td><td className="mono">{t.latency ? `${t.latency}s` : '—'}</td><td className="text-[#047857]">✓</td>
            </tr>
          ))}</tbody>
        </table>
      </div>

      <div className="card p-3 mt-3">
        <div className="flex items-center justify-between mb-2">
          <div className="text-[13px] text-[#0E1626] font-medium">Key & governance events ({keyRows.length})</div>
          <Link to="/keys" className="text-[12px] text-[#2470D8]">Open Keys →</Link>
        </div>
        {keyRows.map(e => (
          <div key={e.id} className="flex flex-wrap items-center gap-x-3 gap-y-1 py-2 border-t border-[#E8EDF4] text-[12.5px]">
            <span className="mono text-[#5B6B82] w-[110px]">{e.time}</span>
            <span className="mono text-[#2F7DE1]">{e.action}</span>
            <span className="text-[#33415C] flex-1 min-w-[200px]">{e.detail}</span>
            <span className="text-[#8FA0B5]">by {e.actor}</span>
          </div>
        ))}
        {keyRows.length === 0 && <div className="text-[12.5px] text-[#8FA0B5] py-2">No key events match the filter.</div>}
      </div>
    </div>
  );
}
