import { NavLink, useNavigate } from 'react-router-dom';
import { useGateway } from '../lib/store';

const NAV = [
  { section: null as string | null, items: [{ to: '/overview', label: 'Overview' }] },
  { section: 'Core', items: [
    { to: '/routing', label: 'Routing' },
    { to: '/models', label: 'Models' },
    { to: '/resources', label: 'Resources' },
  ]},
  { section: 'Platform', items: [
    { to: '/connectors', label: 'MCP / Connectors' },
    { to: '/security', label: 'Security' },
    { to: '/keys', label: 'Keys' },
    { to: '/traces', label: 'Request Traces' },
    { to: '/audit', label: 'Audit Logs' },
  ]},
  { section: 'System', items: [{ to: '/settings', label: 'Settings' }] },
];

function NavGroups() {
  return (
    <>
      {NAV.map((g, i) => (
        <div key={i} className={i > 0 ? 'mt-1.5' : ''}>
          {g.section && <div className="hud-label px-2.5 pt-2.5 pb-1">{g.section}</div>}
          {g.items.map(it => (
            <NavLink key={it.to} to={it.to} className={({isActive}) => `sidebar-link ${isActive ? 'active' : ''}`}>{it.label}</NavLink>
          ))}
        </div>
      ))}
    </>
  );
}

export default function Shell({ children }: { children: React.ReactNode }) {
  const mode = useGateway(s => s.mode);
  const toast = useGateway(s => s.toast);
  const pendingKeys = useGateway(s => s.keyRequests.filter(r => r.status === 'Pending').length);
  const nav = useNavigate();
  return (
    <div className="flex min-h-screen gap-4 p-4 max-lg:p-3 max-lg:gap-3">
      {/* Floating glass sidebar — desktop */}
      <aside className="glass w-[232px] shrink-0 p-3.5 flex-col gap-1 hidden lg:flex sticky top-4 h-[calc(100vh-2rem)] overflow-y-auto">
        <div className="flex items-center gap-2.5 px-1.5 py-2">
          <div className="w-9 h-9 rounded-[11px] bg-gradient-to-br from-blue-500 via-cyan-400 to-violet-500 flex items-center justify-center font-bold text-white shadow-[0_0_20px_rgba(59,130,246,0.45)]">◈</div>
          <div>
            <div className="text-[13.5px] font-semibold text-white leading-tight tracking-[-0.01em]">AI Agent Gateway</div>
            <div className="hud-label !text-[9.5px] mt-0.5">Enterprise AI Hub</div>
          </div>
        </div>
        <nav className="mt-1"><NavGroups /></nav>
        <div className="mt-auto card p-3 !rounded-[12px]">
          <div className="hud-label !text-[9.5px]">JEV Router</div>
          <div className="flex items-center gap-2 text-[13px] text-white mt-1">
            <span className="dot dot-ok live-ring text-emerald-400" /> Mock v2.3 · {mode}
          </div>
          {pendingKeys > 0 && (
            <button onClick={() => nav('/keys')} className="mt-2 text-[12px] text-amber-300 hover:text-amber-200">
              {pendingKeys} key request{pendingKeys > 1 ? 's' : ''} pending →
            </button>
          )}
          <div className="text-[11px] text-[#5a6578] mt-1">Swappable API — UI stays stable</div>
        </div>
      </aside>

      <div className="flex-1 min-w-0 flex flex-col gap-4 max-lg:gap-3">
        {/* Floating HUD topbar */}
        <header className="glass flex items-center gap-3 px-4 h-[56px] sticky top-4 max-lg:top-3 z-20">
          <div className="lg:hidden flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-blue-500 via-cyan-400 to-violet-500 flex items-center justify-center text-white text-[13px] font-bold">◈</div>
          </div>
          <form className="flex-1 max-w-[420px]" onSubmit={(e) => { e.preventDefault(); const f = new FormData(e.currentTarget); const q = String(f.get('q') || ''); const m = q.match(/#?(\d{3,5})/); nav(m ? `/traces/${m[1]}` : '/traces'); }}>
            <input name="q" placeholder="Search #request, model, tool… (e.g. #2841)" className="input !bg-[#0a0f1c]/70" />
          </form>
          <span className="badge max-sm:hidden">prod</span>
          <span className="badge !text-emerald-300 !border-emerald-500/30 max-sm:hidden">
            <span className="dot dot-ok live-ring text-emerald-400" /> Gateway healthy
          </span>
          <button className="btn !py-1.5" onClick={() => nav('/audit')}>Alerts</button>
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#24345a] to-[#141d33] border border-[#2b3b5e] flex items-center justify-center text-[12px] font-semibold">PM</div>
        </header>

        {/* Mobile nav rail */}
        <nav className="lg:hidden glass px-3 py-2 flex gap-1 overflow-x-auto">
          {NAV.flatMap(g => g.items).map(it => (
            <NavLink key={it.to} to={it.to} className={({isActive}) => `sidebar-link whitespace-nowrap !py-1.5 ${isActive ? 'active' : ''}`}>{it.label}</NavLink>
          ))}
        </nav>

        <main className="max-w-[1280px] w-full mx-auto pb-6">{children}</main>
        {toast && <div className="glass fixed bottom-5 left-1/2 -translate-x-1/2 text-[13px] px-4 py-2.5 z-50 !rounded-[12px]">{toast}</div>}
      </div>
    </div>
  );
}
