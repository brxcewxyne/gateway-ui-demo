import { Link } from 'react-router-dom';
import { PageHead, StatusDot } from '../components/ui';
import { useGateway } from '../lib/store';

export default function Security() {
  const { policies, approvals, setApproval, notify } = useGateway();
  const pending = approvals.filter(a => a.status === 'pending');

  return (
    <div>
      <PageHead eyebrow="Governance" title="Security / Governance — supporting layer" sub="Model may request an action. Gateway decides. Keep this lean in MVP; Routing + Resources stay primary."
        right={<button className="btn btn-primary" onClick={() => notify('Policy editor: pick scope → effect → save')}>+ New policy</button>} />
      <div className="grid lg:grid-cols-3 gap-3">
        <div className="card p-4">
          <div className="text-[13px] font-medium text-[#0E1626] mb-2">Policies ({policies.length})</div>
          {policies.map(p => (
            <div key={p.id} className="border-t border-[#E8EDF4] py-2 first:border-0">
              <div className="text-[#0E1626] text-[13px]">{p.name}</div>
              <div className="mono text-[11.5px] text-[#5B6B82]">{p.rule}</div>
              <div className="text-[11.5px] text-[#5B6B82]">{p.scope} · {p.effect}</div>
            </div>
          ))}
        </div>
        <div className="card p-4">
          <div className="text-[13px] font-medium text-[#0E1626] mb-2">Violations & blocked</div>
          {[['11:42 BLOCK finance→GPT (finance must use private)', '2839'], ['11:10 BLOCK pii→external', '2839'], ['10:58 BLOCK sql.write (high risk)', '2838']].map(([t, id]) => (
            <div key={t} className="border-t border-[#E8EDF4] py-2 first:border-0 flex items-center justify-between gap-2">
              <span className="text-[12.5px] flex items-center gap-2"><StatusDot s="blocked" /> {t}</span>
              <Link className="text-[#2470D8] text-[12px] shrink-0" to={`/traces/${id}`}>trace →</Link>
            </div>
          ))}
          <div className="text-[12px] text-[#5B6B82] mt-2">Every block links to its trace for proof.</div>
        </div>
        <div className="card p-4">
          <div className="text-[13px] font-medium text-[#0E1626] mb-2">Approvals ({pending.length} pending)</div>
          {approvals.map(a => (
            <div key={a.id} className="border-t border-[#E8EDF4] py-2 first:border-0">
              <div className="flex items-center justify-between"><span className="mono text-[12.5px] text-[#0E1626]">#{a.id} {a.tool}</span><span className={`text-[11px] ${a.status === 'pending' ? 'text-[#B45309]' : a.status === 'approved' ? 'text-[#047857]' : 'text-[#DC2626]'}`}>{a.status}</span></div>
              <div className="text-[12px] text-[#5B6B82]">{a.app} · {a.risk} risk · {a.detail}</div>
              {a.status === 'pending' && <div className="flex gap-1.5 mt-1.5"><button className="btn !py-1 !text-[12px]" onClick={() => setApproval(a.id, 'approved')}>Approve once</button><button className="btn btn-danger !py-1 !text-[12px]" onClick={() => setApproval(a.id, 'denied')}>Deny</button></div>}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
