import { NavLink, useNavigate } from 'react-router-dom';
import { useGateway } from '../lib/store';

const NAV = [
  { section: null as string | null, items: [{ to: '/overview', label: 'Overview' }] },
  { section: 'CORE', items: [
    { to: '/routing', label: 'Routing' },
    { to: '/models', label: 'Models' },
    { to: '/resources', label: 'Resources' },
  ]},
  { section: 'PLATFORM', items: [
    { to: '/connectors', label: 'MCP / Connectors' },
    { to: '/security', label: 'Security' },
    { to: '/keys', label: 'Keys' },
    { to: '/traces', label: 'Request Traces' },
    { to: '/audit', label: 'Audit Logs' },
  ]},
  { section: 'SYSTEM', items: [{ to: '/settings', label: 'Settings' }] },
];

export default function Shell({ children }: { children: React.ReactNode }) {
  const mode = useGateway(s => s.mode);
  const toast = useGateway(s => s.toast);
  const nav = useNavigate();
  return (
    <div className="flex h-full min-h-screen">
      <aside className="w-[228px] shrink-0 border-r border-[#1f2733] bg-[#0d1117] p-3 flex flex-col gap-1">
        <div className="flex items-center gap-2 px-2 py-2">
          <div className="w-8 h-8 rounded-[10px] bg-gradient-to-br from-blue-500 to-cyan-400 flex items-center justify-center font-bold text-white">◈</div>
          <div>
            <div className="text-[13px] font-semibold text-white leading-tight">AI Agent Gateway</div>
            <div className="text-[11px] text-[#5b6575]">USB-C hub for enterprise AI</div>
          </div>
        </div>
        {NAV.map((g, i) => (
          <div key={i} className="mt-1">
            {g.section && <div className="px-2 pt-2 pb-1 text-[10.5px] tracking-[0.12em] text-[#5b6575]">{g.section}</div>}
            {g.items.map(it => (
              <NavLink key={it.to} to={it.to} className={({isActive}) => `sidebar-link ${isActive ? 'active' : ''}`}>{it.label}</NavLink>
            ))}
          </div>
        ))}
        <div className="mt-auto card p-3">
          <div className="text-[11px] text-[#8b94a3]">JEV router</div>
          <div className="flex items-center gap-2 text-[13px] text-white"><span className="w-2 h-2 rounded-full bg-emerald-400 inline-block" /> Mock v2.3 · {mode}</div>
          <div className="text-[11px] text-[#5b6575] mt-1">Swappable API — UI stays stable</div>
        </div>
      </aside>
      <div className="flex-1 min-w-0 flex flex-col">
        <header className="h-[52px] border-b border-[#1f2733] bg-[#0d1117]/80 backdrop-blur flex items-center gap-3 px-4 sticky top-0 z-20">
          <form className="flex-1 max-w-[420px]" onSubmit={(e) => { e.preventDefault(); const f = new FormData(e.currentTarget); const q = String(f.get('q') || ''); const m = q.match(/#?(\d{3,5})/); nav(m ? `/traces/${m[1]}` : '/traces'); }}>
            <input name="q" placeholder="⌘K — search #request, model, tool… (e.g. #2841)" className="input" />
          </form>
          <span className="badge">prod</span>
          <span className="badge"><span className="w-1.5 h-1.5 rounded-full bg-emerald-400" /> gateway healthy</span>
          <button className="btn" onClick={() => nav('/audit')}>Alerts</button>
          <div className="w-8 h-8 rounded-full bg-[#1c2534] border border-[#2a3546] flex items-center justify-center text-[12px]">PM</div>
        </header>
        <main className="p-5 max-w-[1280px] w-full mx-auto">{children}</main>
        {toast && <div className="fixed bottom-5 left-1/2 -translate-x-1/2 bg-[#132030] border border-[#2a4a6f] text-[13px] px-4 py-2 rounded-[10px] shadow-xl z-50">{toast}</div>}
      </div>
    </div>
  );
}
