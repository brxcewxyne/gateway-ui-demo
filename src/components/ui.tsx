import { Link } from 'react-router-dom';
import { fmt$ } from '../lib/format';

export function Kpi({ label, value, sub, to }: { label: string; value: string; sub: string; to: string }) {
  return (
    <Link to={to} className="card card-hover p-3.5 block min-w-0">
      <div className="kpi-label">{label}</div>
      <div className="text-[20px] font-semibold text-white mt-1">{value}</div>
      <div className="text-[12px] text-[#8b94a3] mt-0.5">{sub}</div>
    </Link>
  );
}

export function StatusDot({ s }: { s: string }) {
  const c = s === 'healthy' || s === 'connected' || s === 'allow' ? 'bg-emerald-400'
    : s === 'degraded' || s === 'fallback' || s === 'warn' ? 'bg-amber-400'
    : s === 'blocked' || s === 'down' || s === 'block' ? 'bg-red-400' : 'bg-slate-500';
  return <span className={`w-2 h-2 rounded-full inline-block ${c}`} />;
}

export function PageHead({ title, sub, right }: { title: string; sub: string; right?: React.ReactNode }) {
  return (
    <div className="flex items-start justify-between gap-3 mb-4">
      <div>
        <h1 className="text-[22px] font-semibold text-white m-0">{title}</h1>
        <p className="text-[13px] text-[#8b94a3] mt-1">{sub}</p>
      </div>
      <div className="flex gap-2">{right}</div>
    </div>
  );
}

export function Pipeline({ steps, active }: { steps: string[]; active?: number }) {
  return (
    <div className="flex items-center gap-1 flex-wrap">
      {steps.map((s, i) => (
        <span key={s} className="flex items-center gap-1">
          <span className={`text-[12px] px-2.5 py-1 rounded-full border ${i === (active ?? steps.length - 1) ? 'border-blue-500/60 bg-blue-500/10 text-white' : 'border-[#2a3546] text-[#8b94a3]'}`}>{s}</span>
          {i < steps.length - 1 && <span className="text-[#3a4658] mx-0.5">→</span>}
        </span>
      ))}
    </div>
  );
}

export function CostCell({ v }: { v: number }) {
  return <span className="mono">{v === 0 ? '—' : fmt$(v)}</span>;
}
