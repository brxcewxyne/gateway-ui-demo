import { Suspense, lazy, useState } from 'react';
import { Link } from 'react-router-dom';

const FiberMap = lazy(() => import('./HubFiber'));

// Props: variant overview | connectors; click node -> callback
export interface HubNode { id: string; label: string; kind: 'gateway'|'model'|'app'|'connector'; status: string; }

function colColor(s: string) {
  return s === 'connected' || s === 'healthy' || s === 'gateway' ? '#34d399'
    : s === 'degraded' || s === 'fallback' ? '#fbbf24'
    : s === 'blocked' || s === 'down' ? '#f87171' : '#64748b';
}

// 2D fallback mirrors the 3D spatial hierarchy: inputs LEFT, gateway CENTER, models RIGHT.
function Fallback2D({ nodes, onPick }: { nodes: HubNode[]; onPick?: (id: string) => void }) {
  const left = nodes.filter(n => n.kind === 'app' || n.kind === 'connector');
  const right = nodes.filter(n => n.kind === 'model');
  const split = right.length === 0;
  const L = split ? left.slice(0, Math.ceil(left.length / 2)) : left;
  const R = split ? left.slice(Math.ceil(left.length / 2)) : right;
  const yFor = (i: number, n: number) => 40 + (i - (n - 1) / 2) * -0 + 60 + i * (180 / Math.max(1, n)) - 90 / Math.max(1, n);
  return (
    <div className="p-4">
      <svg viewBox="0 0 640 300" className="w-full h-[300px]">
        <rect x={285} y={125} width={70} height={50} rx={10} fill="#DCE8FB" stroke="#3b82f6" />
        <text x={320} y={153} textAnchor="middle" fill="#14489B" fontSize={10}>GATEWAY</text>
        {L.map((n, i) => {
          const y = yFor(i, L.length); const x = 110;
          return (
            <g key={n.id} onClick={() => onPick?.(n.id)} style={{ cursor: 'pointer' }}>
              <path d={`M ${x + 34} ${y} Q 220 ${y} 285 150`} stroke={colColor(n.status)} fill="none" strokeOpacity={0.55} strokeDasharray={n.status === 'blocked' ? '4 4' : undefined} />
              <rect x={x - 34} y={y - 15} width={68} height={30} rx={8} fill="#FFFFFF" stroke={colColor(n.status)} />
              <text x={x} y={y + 4} textAnchor="middle" fill="#33415C" fontSize={9}>{n.label.slice(0, 12)}</text>
            </g>
          );
        })}
        {R.map((n, i) => {
          const y = yFor(i, R.length); const x = 530;
          return (
            <g key={n.id} onClick={() => onPick?.(n.id)} style={{ cursor: 'pointer' }}>
              <path d={`M 355 150 Q 430 ${y} ${x - 34} ${y}`} stroke={colColor(n.status)} fill="none" strokeOpacity={0.55} strokeDasharray={n.status === 'blocked' ? '4 4' : undefined} />
              <rect x={x - 34} y={y - 15} width={68} height={30} rx={8} fill="#FFFFFF" stroke={colColor(n.status)} />
              <text x={x} y={y + 4} textAnchor="middle" fill="#33415C" fontSize={9}>{n.label.slice(0, 12)}</text>
            </g>
          );
        })}
        <text x={110} y={22} fill="#8FA0B5" fontSize={10} textAnchor="middle">INPUTS / TOOLS</text>
        <text x={530} y={22} fill="#8FA0B5" fontSize={10} textAnchor="middle">MODELS</text>
      </svg>
      <div className="flex gap-2 flex-wrap mt-1">
        {nodes.filter(n => n.kind !== 'gateway').map(n => (
          <button key={n.id} className="badge hover:text-[#0E1626]" onClick={() => onPick?.(n.id)}>● {n.label}</button>
        ))}
      </div>
    </div>
  );
}

export default function HubMap({ nodes, onPick, compact, variant = 'overview' }: {
  nodes: HubNode[]; onPick?: (id: string) => void; compact?: boolean; variant?: 'overview' | 'connectors';
}) {
  const [use3d, setUse3d] = useState(true);
  const [webglOk] = useState(() => {
    try {
      const c = document.createElement('canvas');
      return !!(c.getContext('webgl') || c.getContext('experimental-webgl'));
    } catch { return false; }
  });
  const show3d = use3d && webglOk;
  return (
    <div className="card p-0 overflow-hidden">
      <div className="flex items-center justify-between px-4 py-2.5 border-b border-[#E3E9F2]">
        <div className="text-[12px] text-[#5B6B82]">
          <span className="hud-label !text-[10px] mr-2">Routing topology</span>
          inputs → gateway → models · hover to inspect, click to open
        </div>
        <button className="btn !py-1 !px-2 !text-[11px]" onClick={() => setUse3d(v => !v)}>{show3d ? '2D fallback' : '3D view'}</button>
      </div>
      {show3d ? (
        <Suspense fallback={<div className="p-8 text-[13px] text-[#5B6B82]">Loading 3D…</div>}>
          <FiberMap nodes={nodes} onPick={onPick} height={compact ? 320 : 380} story={variant === 'overview'} />
        </Suspense>
      ) : (
        <Fallback2D nodes={nodes} onPick={onPick} />
      )}
      <div className="px-4 py-2 border-t border-[#E3E9F2] text-[11px] text-[#8FA0B5]">
        3D only here + Connectors. Charts, routing, security stay 2D. <Link className="text-[#2470D8]" to="/traces">Open live trace →</Link>
      </div>
    </div>
  );
}
