import { useState } from 'react';
import { PageHead, StatusDot } from '../components/ui';
import { useGateway } from '../lib/store';
import { fmt$ } from '../lib/format';

export default function Models() {
  const { models, toggleModel, bumpPriority, notify } = useGateway();
  const [q, setQ] = useState('');
  const [open, setOpen] = useState<string | null>(null);
  const rows = models.filter(m => m.name.toLowerCase().includes(q.toLowerCase()));

  return (
    <div>
      <PageHead eyebrow="Providers" title="Models — supporting the routing layer" sub="Registry, health and kill-switches. Priority here drives Routing fallback order."
        right={<><input className="input !w-[220px]" placeholder="Filter models…" value={q} onChange={e => setQ(e.target.value)} /><button className="btn btn-primary" onClick={() => notify('Add model: paste provider endpoint in Settings → Providers')}>+ Add model</button></>} />
      <div className="card overflow-hidden">
        <table className="w-full text-[13px]">
          <thead><tr className="text-left text-[#8d99ae] text-[11.5px] uppercase tracking-wider border-b border-[#1c2740]"><th className="p-3">Model</th><th>Cost/1M</th><th>p95</th><th>Req</th><th>Health</th><th>Priority</th><th>Status</th><th className="text-right pr-3">Actions</th></tr></thead>
          <tbody>
            {rows.map(m => (
              <>
                <tr key={m.id} className="table-row border-b border-[#1a2440]">
                  <td className="p-3"><button className="text-white font-medium hover:text-blue-300" onClick={() => setOpen(open === m.id ? null : m.id)}>{m.name}</button><div className="text-[11.5px] text-[#8d99ae]">{m.provider} · {m.capabilities.join(' · ')}</div></td>
                  <td className="mono">{fmt$(m.costPer1M)}/1M</td>
                  <td className="mono">{m.p95}s</td>
                  <td className="mono">{m.requests.toLocaleString()}</td>
                  <td><div className="flex items-center gap-1.5"><StatusDot s={m.status} /><span className="mono text-[12px]">{m.health}%</span></div></td>
                  <td className="mono">#{m.fallbackPriority}</td>
                  <td className="capitalize text-[12px]">{m.status}</td>
                  <td className="p-3"><div className="flex justify-end gap-1.5">
                    <button className="btn !py-1 !text-[12px]" onClick={() => toggleModel(m.id)}>{m.status === 'disabled' ? 'Enable' : 'Disable'}</button>
                    <button className="btn !py-1 !text-[12px]" onClick={() => bumpPriority(m.id, -1)}>↑</button>
                    <button className="btn !py-1 !text-[12px]" onClick={() => setOpen(m.id)}>Config</button>
                  </div></td>
                </tr>
                {open === m.id && (
                  <tr key={m.id + '-d'} className="border-b border-[#1a2440] bg-[#0a0f1c]">
                    <td colSpan={8} className="p-3">
                      <div className="grid md:grid-cols-4 gap-2 text-[12.5px]">
                        <div className="card p-2.5"><div className="kpi-label">Allowed teams</div><div className="text-white">{m.allowedTeams.join(', ')}</div><button className="text-blue-400 mt-1" onClick={() => notify('Restriction editor: pick teams allowed for ' + m.name)}>Set restriction →</button></div>
                        <div className="card p-2.5"><div className="kpi-label">Fallback priority</div><div className="mono text-white">#{m.fallbackPriority}</div><div className="flex gap-1 mt-1"><button className="btn !py-0.5" onClick={() => bumpPriority(m.id, -1)}>↑ promote</button><button className="btn !py-0.5" onClick={() => bumpPriority(m.id, 1)}>↓ demote</button></div></div>
                        <div className="card p-2.5"><div className="kpi-label">Rate / quota</div><div className="mono">2k rpm · 50M tok/mo</div><button className="text-blue-400 mt-1" onClick={() => notify('Model limit saved')}>Set model limit →</button></div>
                        <div className="card p-2.5"><div className="kpi-label">Quality vs cost</div><div className="text-white">{'★'.repeat(m.quality)}{'☆'.repeat(5 - m.quality)} · {fmt$(m.costPer1M)}/1M</div><div className="text-[#8d99ae] text-[12px]">Routing prefers this when difficulty justifies it.</div></div>
                      </div>
                    </td>
                  </tr>
                )}
              </>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
