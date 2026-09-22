import { Link } from 'react-router-dom';
import { fmt$ } from '../lib/format';

export function Kpi({ label, value, sub, to, accent }: { label: string; value: string; sub: string; to: string; accent?: string }) {
  return (
    <Link to={to} className="card card-hover p-3.5 block min-w-0">
      <div className="flex items-center gap-1.5">
        {accent && <span className="dot" style={{ background: accent, boxShadow: `0 0 8px ${accent}` }} />}
        <span className="kpi-label">{label}</span>
      </div>
      <div className="metric text-[22px] mt-1">{value}</div>
      <div className="text-[12px] text-[#5B6B82] mt-0.5">{sub}</div>
    </Link>
  );
}

export function StatusDot({ s }: { s: string }) {
  const c = s === 'healthy' || s === 'connected' || s === 'allow' || s === 'Active' || s === 'Approved' ? 'dot-ok'
    : s === 'degraded' || s === 'fallback' || s === 'warn' || s === 'Rotating' ? 'dot-warn'
    : s === 'blocked' || s === 'down' || s === 'block' || s === 'Disabled' || s === 'Denied' ? 'dot-bad'
    : s === 'model' ? 'dot-model' : s === 'route' ? 'dot-route' : s === 'mcp' ? 'dot-mcp' : 'dot-idle';
  return <span className={`dot ${c}`} />;
}

export function PageHead({ eyebrow, title, sub, right }: { eyebrow: string; title: string; sub: string; right?: React.ReactNode }) {
  return (
    <div className="flex items-start justify-between gap-3 mb-4 flex-wrap">
      <div>
        <div className="hud-label mb-1.5 flex items-center gap-2">
          <span className="w-4 h-px bg-[#3b82f6] inline-block" />{eyebrow}
        </div>
        <h1 className="text-[22px] font-semibold text-[#0E1626] m-0 tracking-[-0.01em]">{title}</h1>
        <p className="text-[13px] text-[#5B6B82] mt-1 max-w-[640px]">{sub}</p>
      </div>
      <div className="flex gap-2 flex-wrap">{right}</div>
    </div>
  );
}

export function SectionTitle({ title, sub, right }: { title: string; sub?: string; right?: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-2 mb-2.5">
      <div>
        <div className="section-title">{title}</div>
        {sub && <div className="section-sub mt-0.5">{sub}</div>}
      </div>
      {right && <div className="flex gap-2">{right}</div>}
    </div>
  );
}

export function Pipeline({ steps, active }: { steps: string[]; active?: number }) {
  return (
    <div className="flex items-center gap-1 flex-wrap">
      {steps.map((s, i) => (
        <span key={s} className="flex items-center gap-1">
          <span className={`text-[12px] px-2.5 py-1 rounded-full border ${i === (active ?? steps.length - 1) ? 'border-blue-500/60 bg-blue-500/10 text-[#0E1626]' : 'border-[#D3DDE9] text-[#5B6B82]'}`}>{s}</span>
          {i < steps.length - 1 && <span className="text-[#9DB0C7] mx-0.5">→</span>}
        </span>
      ))}
    </div>
  );
}

export function CostCell({ v }: { v: number }) {
  return <span className="mono">{v === 0 ? '—' : fmt$(v)}</span>;
}

/** Horizontal distribution bars — clearer than another pie chart. */
export function UsageBars({ rows }: { rows: { label: string; pct: number; color: string; meta?: string }[] }) {
  return (
    <div className="flex flex-col gap-2.5">
      {rows.map(r => (
        <div key={r.label}>
          <div className="flex justify-between text-[12px] mb-1">
            <span className="text-[#33415C] font-medium">{r.label} {r.meta && <span className="text-[#8FA0B5] font-normal">· {r.meta}</span>}</span>
            <span className="mono text-[#0E1626]">{r.pct}%</span>
          </div>
          <div className="ubar"><div style={{ width: `${r.pct}%`, background: `linear-gradient(90deg, ${r.color}99, ${r.color})`, boxShadow: `0 0 10px ${r.color}55` }} /></div>
        </div>
      ))}
    </div>
  );
}
