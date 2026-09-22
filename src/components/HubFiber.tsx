// HubFiber — calm enterprise gateway visualization.
// Architecture:
//   useFrame  -> continuous only: anchored drift, hover damping, camera parallax,
//                particle progress (eased), edge following, gateway breathing.
//   GSAP      -> discrete only: entry sequence, caption fades, scenario scheduling.
// Never animate the same property with both systems.
import { useEffect, useMemo, useRef, useState } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Html } from '@react-three/drei';
import gsap from 'gsap';
import * as THREE from 'three';
import type { HubNode } from './HubMap';

export interface Scenario { from: string; to: string; title: string; sub: string; trace: string; }

const SCENARIOS: Scenario[] = [
  { from: 'apps', to: 'gpt-4o-mini', title: '“Summarize customer feedback”', sub: 'Easy · Summarization → GPT-4o-mini · low complexity → lower-cost model', trace: '/traces/2840' },
  { from: 'drive', to: 'claude-sonnet', title: '“Analyze conflicting clauses”', sub: 'Hard · Document reasoning → Claude · high complexity → stronger model', trace: '/traces/2841' },
  { from: 'slack', to: 'gemini-flash', title: '“Classify support tickets”', sub: 'Budget pressure → rerouted to Gemini · cheaper suitable model', trace: '/traces/2838' },
];

const STATUS_COLOR: Record<string, string> = {
  healthy: '#34d399', connected: '#34d399', gateway: '#3b82f6',
  degraded: '#fbbf24', fallback: '#fbbf24',
  blocked: '#f87171', down: '#f87171', disabled: '#475569',
};
const colorFor = (s: string) => STATUS_COLOR[s] ?? '#64748b';

// Stable hash -> deterministic per-node drift seeds (no re-random on re-render).
function hash(id: string) {
  let h = 2166136261;
  for (let i = 0; i < id.length; i++) { h ^= id.charCodeAt(i); h = Math.imul(h, 16777619); }
  return (h >>> 0) / 4294967295;
}

// LEFT = inputs/tools/data, CENTER = gateway, RIGHT = model providers.
function layout(nodes: HubNode[]): Map<string, THREE.Vector3> {
  const map = new Map<string, THREE.Vector3>();
  const left = nodes.filter(n => n.kind === 'app' || n.kind === 'connector');
  const right = nodes.filter(n => n.kind === 'model');
  const solo = nodes.filter(n => n.kind !== 'gateway' && n.kind !== 'app' && n.kind !== 'connector' && n.kind !== 'model');
  map.set('gw', new THREE.Vector3(0, 0.1, 0));
  const place = (list: HubNode[], x: number) => {
    list.forEach((n, i) => {
      const y = (i - (list.length - 1) / 2) * -1.15; // top-to-bottom order
      const z = ((i % 3) - 1) * 0.55 + (hash(n.id) - 0.5) * 0.3;
      map.set(n.id, new THREE.Vector3(x + (i % 2) * 0.28, y, z));
    });
  };
  if (right.length === 0) {
    // Connectors page: split across both sides for readability.
    place(left.slice(0, Math.ceil(left.length / 2)), -3.1);
    place(left.slice(Math.ceil(left.length / 2)), 3.1);
  } else {
    place(left, -3.1);
    place(right, 3.1);
  }
  solo.forEach((n, i) => map.set(n.id, new THREE.Vector3(0, -2 + -i * 0.2, -1)));
  return map;
}

interface Drift { fx: number; fy: number; fz: number; ax: number; ay: number; az: number; px: number; py: number; pz: number; }
function driftFor(n: HubNode): Drift {
  const h1 = hash(n.id), h2 = hash(n.id + ':2'), h3 = hash(n.id + ':3');
  // Motion hierarchy: gateway most stable, models stable, connectors/apps freer.
  const amp = n.kind === 'gateway' ? 0.016 : n.kind === 'model' ? 0.032 : 0.052;
  return {
    fx: 0.10 + h1 * 0.09, fy: 0.13 + h2 * 0.11, fz: 0.08 + h3 * 0.08,
    ax: amp * (0.5 + h2 * 0.5), ay: amp * (0.8 + h3 * 0.6), az: amp * 0.8,
    px: h1 * Math.PI * 2, py: h2 * Math.PI * 2, pz: h3 * Math.PI * 2,
  };
}

const easeInOut = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);

function NodeView({ n, base, live, drift, entry, hovered, selected, dimmed, onHover, onPick, timeScale }:
  { n: HubNode; base: THREE.Vector3; live: THREE.Vector3; drift: Drift; entry: { v: number };
    hovered: boolean; selected: boolean; dimmed: boolean;
    onHover: (id: string | null) => void; onPick?: (id: string) => void; timeScale: number }) {
  const group = useRef<THREE.Group>(null);
  const mat = useRef<THREE.MeshStandardMaterial>(null);
  const hoverZ = useRef(0);
  const label = n.kind === 'gateway' ? 'AI GATEWAY' : n.label;

  useFrame(({ clock }) => {
    if (!animActive.v) return;
    const g = group.current; if (!g) return;
    const t = clock.getElapsedTime() * timeScale;
    // Anchored drift: base + tiny independent offsets. Never orbital.
    const x = base.x + Math.sin(t * drift.fx + drift.px) * drift.ax;
    const y = base.y + Math.sin(t * drift.fy + drift.py) * drift.ay;
    hoverZ.current += (((hovered || selected) ? 0.5 : 0) - hoverZ.current) * 0.08;
    const z = base.z + Math.sin(t * drift.fz + drift.pz) * drift.az + hoverZ.current;
    g.position.set(x, y, z);
    live.copy(g.position);
    const breathe = n.kind === 'gateway' ? 1 + Math.sin(t * 0.6) * 0.008 : 1;
    const target = entry.v * breathe * (hovered || selected ? 1.035 : 1);
    const s = g.scale.x + (target - g.scale.x) * 0.12;
    g.scale.setScalar(Math.max(0.0001, s));
    if (mat.current) {
      const baseE = n.kind === 'gateway' ? 0.5 : 0.22;
      mat.current.emissiveIntensity = baseE + (hovered || selected ? 0.35 : 0) + (n.kind === 'gateway' ? pulseRef.v * 0.9 : 0);
      mat.current.opacity = dimmed ? 0.45 : 1;
    }
  });

  const r = n.kind === 'gateway' ? 0.5 : 0.3;
  return (
    <group ref={group} position={base} scale={0.0001}>
      <mesh
        onPointerOver={(e) => { e.stopPropagation(); onHover(n.id); document.body.style.cursor = 'pointer'; }}
        onPointerOut={() => { onHover(null); document.body.style.cursor = 'auto'; }}
        onClick={(e) => { e.stopPropagation(); onPick?.(n.id); }}
      >
        <sphereGeometry args={[r, 28, 28]} />
        <meshStandardMaterial ref={mat} color={colorFor(n.kind === 'gateway' ? 'gateway' : n.status)}
          emissive={colorFor(n.kind === 'gateway' ? 'gateway' : n.status)} emissiveIntensity={0.4}
          roughness={0.45} metalness={0.15} transparent opacity={1} />
      </mesh>
      {n.kind === 'gateway' && (
        <mesh>
          <sphereGeometry args={[r * 0.45, 20, 20]} />
          <meshBasicMaterial color="#dbeafe" transparent opacity={0.85} />
        </mesh>
      )}
      <Html center distanceFactor={9} position={[0, n.kind === 'gateway' ? -0.85 : -0.58, 0]} zIndexRange={[10, 0]}
        style={{ pointerEvents: n.kind === 'gateway' ? 'none' : 'auto' }}>
        <button onClick={() => onPick?.(n.id)}
          onMouseEnter={() => onHover(n.id)} onMouseLeave={() => onHover(null)}
          style={{
            pointerEvents: n.kind === 'gateway' ? 'none' : 'auto',
            background: selected ? 'rgba(59,130,246,.24)' : 'rgba(13,18,32,.85)',
            backdropFilter: 'blur(8px)',
            border: `1px solid ${selected ? 'rgba(147,183,255,.7)' : 'rgba(125,155,225,.22)'}`,
            boxShadow: selected ? '0 0 16px rgba(59,130,246,.45)' : '0 6px 18px rgba(0,0,0,.5)',
            color: n.kind === 'gateway' ? '#fff' : '#d4dbe7',
            fontSize: n.kind === 'gateway' ? 12 : 11, fontWeight: n.kind === 'gateway' ? 700 : 500,
            letterSpacing: n.kind === 'gateway' ? '0.08em' : 'normal',
            padding: '3px 9px', borderRadius: 99, whiteSpace: 'nowrap', cursor: n.kind === 'gateway' ? 'default' : 'pointer',
            opacity: dimmed ? 0.55 : 1,
          }}>
          {label}
        </button>
      </Html>
    </group>
  );
}

// Shared gateway pulse written by particle arrivals (GSAP-free decay in useFrame).
const pulseRef = { v: 0 };
// Set by Scene each frame: false when tab hidden or scene offscreen -> all motion skips.
const animActive = { v: true };

function Edges({ pairs, live, entry, hoveredId, selectedId }: {
  pairs: { a: string; b: string; status: string }[]; live: Map<string, THREE.Vector3>;
  entry: { v: number }; hoveredId: string | null; selectedId: string | null }) {
  const SEG = 28;
  const group = useRef<THREE.Group>(null);
  const geoms = useRef<THREE.BufferGeometry[]>([]);
  const mats = useRef<THREE.LineBasicMaterial[]>([]);
  const tmpA = useRef(new THREE.Vector3());
  const tmpB = useRef(new THREE.Vector3());
  const tmpC = useRef(new THREE.Vector3());
  const tmpP = useRef(new THREE.Vector3());

  const built = useMemo(() => pairs.map(() => {
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.BufferAttribute(new Float32Array((SEG + 1) * 3), 3));
    return g;
  }), [pairs]);
  useEffect(() => { geoms.current = built; }, [built]);

  useFrame(() => {
    if (!animActive.v || !group.current) return;
    const focus = hoveredId ?? selectedId;
    pairs.forEach((p, i) => {
      const A = live.get(p.a) ?? tmpA.current.set(0, 0, 0);
      const B = live.get(p.b) ?? tmpB.current.set(0, 0, 0);
      tmpC.current.copy(A).add(B).multiplyScalar(0.5); tmpC.current.y += 0.4; tmpC.current.z += 0.25;
      const attr = geoms.current[i]?.getAttribute('position') as THREE.BufferAttribute | undefined;
      if (!attr) return;
      for (let s = 0; s <= SEG; s++) {
        const t = s / SEG;
        const it = 1 - t;
        tmpP.current.set(
          it * it * A.x + 2 * it * t * tmpC.current.x + t * t * B.x,
          it * it * A.y + 2 * it * t * tmpC.current.y + t * t * B.y,
          it * it * A.z + 2 * it * t * tmpC.current.z + t * t * B.z,
        );
        attr.setXYZ(s, tmpP.current.x, tmpP.current.y, tmpP.current.z);
      }
      attr.needsUpdate = true;
      const m = mats.current[i]; if (!m) return;
      const related = !focus || p.a === focus || p.b === focus;
      m.opacity = entry.v * (related ? (focus ? 0.85 : p.status === 'blocked' ? 0.25 : 0.4) : 0.1);
    });
  });

  return (
    <group ref={group}>
      {pairs.map((p, i) => (
        // @ts-expect-error R3F line element
        <line key={`${p.a}-${p.b}`} geometry={built[i]}>
          <lineBasicMaterial ref={(m) => { if (m) mats.current[i] = m; }} color={colorFor(p.status)} transparent opacity={0} />
        </line>
      ))}
    </group>
  );
}

function Particle({ curve, active }: { curve: React.MutableRefObject<THREE.QuadraticBezierCurve3 | null>; active: React.MutableRefObject<boolean> }) {
  const mesh = useRef<THREE.Mesh>(null);
  const prog = useRef(0);
  useFrame((_, dt) => {
    if (!animActive.v) return;
    const m = mesh.current; const c = curve.current;
    if (!m || !c || !active.current) { if (m) m.visible = false; return; }
    m.visible = true;
    prog.current = Math.min(1, prog.current + dt / 1.6); // ~1.6s eased traverse
    const t = easeInOut(prog.current);
    c.getPoint(t, m.position);
    const s = 0.6 + Math.sin(prog.current * Math.PI) * 0.5;
    m.scale.setScalar(Math.max(0.001, s));
  });
  return (
    <mesh ref={mesh} visible={false}>
      <sphereGeometry args={[0.075, 14, 14]} />
      <meshBasicMaterial color="#bfdbfe" transparent opacity={0.95} />
    </mesh>
  );
}

function CameraRig({ pointer, enabled }: { pointer: React.MutableRefObject<{ x: number; y: number }>; enabled: boolean }) {
  const look = useRef(new THREE.Vector3(0, 0, 0));
  useFrame(({ camera }) => {
    if (!enabled) { camera.lookAt(look.current.set(0, 0, 0)); return; }
    camera.position.x += (pointer.current.x * 0.4 - camera.position.x) * 0.035; // ~1-2deg feel
    camera.position.y += ((1.45 + pointer.current.y * 0.24) - camera.position.y) * 0.035;
    camera.lookAt(look.current.set(0, 0, 0));
  });
  return null;
}

function Scene({ nodes, onPick, story, visibleRef, timeScale, onCaption }:
  { nodes: HubNode[]; onPick?: (id: string) => void; story: boolean;
    visibleRef: React.MutableRefObject<boolean>; timeScale: number;
    onCaption: (s: (Scenario & { phase: string; idx: number }) | null) => void }) {
  const [hovered, setHovered] = useState<string | null>(null);
  const [selected, setSelected] = useState<string | null>(null);
  const pointer = useRef({ x: 0, y: 0 });
  const base = useMemo(() => layout(nodes), [nodes]);
  const live = useMemo(() => {
    const m = new Map<string, THREE.Vector3>();
    base.forEach((v, k) => m.set(k, v.clone()));
    m.set('gw', (base.get('gw') ?? new THREE.Vector3()).clone());
    return m;
  }, [base]);
  const drifts = useMemo(() => {
    const m = new Map<string, Drift>();
    nodes.forEach(n => m.set(n.id, driftFor(n)));
    m.set('gw', driftFor({ id: 'gw', label: '', kind: 'gateway', status: 'gateway' }));
    return m;
  }, [nodes]);
  const entry = useRef({ v: 0 });
  const nodeEntry = useRef(new Map<string, { v: number }>());
  nodes.forEach(n => { if (!nodeEntry.current.has(n.id)) nodeEntry.current.set(n.id, { v: 0 }); });
  if (!nodeEntry.current.has('gw')) nodeEntry.current.set('gw', { v: 0 });

  const pairs = useMemo(() => nodes.filter(n => n.kind !== 'gateway').map(n => ({
    a: n.kind === 'model' ? 'gw' : n.id, b: n.kind === 'model' ? n.id : 'gw', status: n.status, id: n.id,
  })), [nodes]);

  // Curves for particles: rebuilt from LIVE positions when a leg starts (follow drift).
  const curve = useRef<THREE.QuadraticBezierCurve3 | null>(null);
  const particleOn = useRef(false);
  const sched = useRef<{ kill: () => void } | null>(null);

  useEffect(() => {
    // Entry: gateway -> lines -> left -> right -> first request. ~1s total.
    const tl = gsap.timeline();
    tl.to(entry.current, { v: 1, duration: 0.35, ease: 'power2.out' }, 0);
    tl.to(nodeEntry.current.get('gw')!, { v: 1, duration: 0.4, ease: 'power2.out' }, 0);
    nodes.filter(n => n.kind !== 'gateway' && n.kind !== 'model').forEach((n, i) =>
      tl.to(nodeEntry.current.get(n.id)!, { v: 1, duration: 0.35, ease: 'power2.out' }, 0.2 + i * 0.06));
    nodes.filter(n => n.kind === 'model').forEach((n, i) =>
      tl.to(nodeEntry.current.get(n.id)!, { v: 1, duration: 0.35, ease: 'power2.out' }, 0.45 + i * 0.06));
    return () => { tl.kill(); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!story) { onCaption(null); return; }
    let dead = false;
    const timers: ReturnType<typeof setTimeout>[] = [];
    const later = (fn: () => void, ms: number) => { const id = setTimeout(() => { if (!dead) fn(); }, ms); timers.push(id); };
    const leg = (fromId: string, toId: string, holdMs: number, done: () => void) => {
      const A = (live.get(fromId) ?? new THREE.Vector3(-3, 0, 0)).clone();
      const G = (live.get('gw') ?? new THREE.Vector3()).clone();
      const B = (live.get(toId) ?? new THREE.Vector3(3, 0, 0)).clone();
      const mk = (p0: THREE.Vector3, p2: THREE.Vector3) => {
        const mid = p0.clone().add(p2).multiplyScalar(0.5); mid.y += 0.4; mid.z += 0.25;
        return new THREE.QuadraticBezierCurve3(p0.clone(), mid, p2.clone());
      };
      curve.current = mk(A, G); particleOn.current = true;
      later(() => { // arrived at gateway: glow pulse + "decision"
        pulseRef.v = 1; particleOn.current = false;
        later(() => { curve.current = mk(G.clone().copy(live.get('gw') ?? G), B); particleOn.current = true; }, holdMs);
      }, 1750);
      later(() => { particleOn.current = false; done(); }, 1750 + holdMs + 1750);
    };
    const resolve = (id: string, fb: string) => (nodes.some(n => n.id === id) ? id : fb);
    const left0 = nodes.find(n => n.kind === 'app' || n.kind === 'connector')?.id ?? nodes[0]?.id;
    const right0 = nodes.find(n => n.kind === 'model')?.id ?? nodes[0]?.id;
    const seq = SCENARIOS.map(s => ({ ...s, from: resolve(s.from, left0), to: resolve(s.to, right0) }));
    let i = 0;
    const play = () => {
      const s = seq[i % seq.length];
      onCaption({ ...s, phase: 'request', idx: i % seq.length });
      leg(s.from, s.to, 900, () => { onCaption({ ...s, phase: 'routed', idx: i % seq.length }); later(() => { i++; play(); }, 1400); });
    };
    const kick = setTimeout(() => { if (!dead) play(); }, 900); timers.push(kick);
    sched.current = { kill: () => { dead = true; timers.forEach(clearTimeout); } };
    return () => { dead = true; timers.forEach(clearTimeout); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [story]);

  // Gateway pulse decay + visibility gate (continuous side of the split).
  useFrame(() => {
    animActive.v = visibleRef.current && !document.hidden;
    pulseRef.v *= 0.95;
  });

  const focus = hovered ?? selected;
  return (
    <>
      <CameraRig pointer={pointer} enabled={timeScale > 0} />
      <ambientLight intensity={0.9} />
      <hemisphereLight args={['#8fb4ff', '#0b0e13', 0.35]} />
      <directionalLight position={[4, 5, 4]} intensity={0.9} />
      <NodeView n={{ id: 'gw', label: 'AI Gateway', kind: 'gateway', status: 'gateway' }}
        base={base.get('gw')!} live={live.get('gw')!} drift={drifts.get('gw')!} entry={nodeEntry.current.get('gw')!}
        hovered={hovered === 'gw'} selected={selected === 'gw'} dimmed={!!focus && focus !== 'gw'}
        onHover={setHovered} onPick={(id) => { setSelected(id); onPick?.(id); }} timeScale={timeScale} />
      {nodes.filter(n => n.kind !== 'gateway').map(n => (
        <NodeView key={n.id} n={n} base={base.get(n.id)!} live={live.get(n.id)!} drift={drifts.get(n.id)!}
          entry={nodeEntry.current.get(n.id)!} hovered={hovered === n.id} selected={selected === n.id}
          dimmed={!!focus && focus !== n.id} onHover={setHovered}
          onPick={(id) => { setSelected(id); onPick?.(id); }} timeScale={timeScale} />
      ))}
      <Edges pairs={pairs} live={live} entry={entry.current} hoveredId={hovered} selectedId={selected} />
      {story && <Particle curve={curve} active={particleOn} />}
      {/* Expose pointer to rig */}
      <mesh visible={false} position={[0, 0, -3]} onPointerMove={(e) => {
        pointer.current.x = THREE.MathUtils.clamp(e.point.x / 4, -1, 1);
        pointer.current.y = THREE.MathUtils.clamp(e.point.y / 3, -1, 1);
      }}>
        <planeGeometry args={[12, 8]} />
        <meshBasicMaterial transparent opacity={0} depthWrite={false} />
      </mesh>
      <mesh visible={false} onClick={() => { setSelected(null); onPick?.('gw'); }}
        onPointerMove={(e) => {
          const v = e.ray?.direction; void v;
        }}>
        <sphereGeometry args={[9, 8, 8]} />
        <meshBasicMaterial transparent opacity={0} depthWrite={false} side={THREE.BackSide} />
      </mesh>
    </>
  );
}

export default function HubFiber({ nodes, onPick, height, story = false }:
  { nodes: HubNode[]; onPick?: (id: string) => void; height: number; story?: boolean }) {
  const [caption, setCaption] = useState<(Scenario & { phase: string; idx: number }) | null>(null);
  const wrap = useRef<HTMLDivElement>(null);
  const visibleRef = useRef(true);
  const pointerRef = useRef({ x: 0, y: 0 });

  const { reduced, mobile } = useMemo(() => {
    try {
      return {
        reduced: matchMedia('(prefers-reduced-motion: reduce)').matches,
        mobile: matchMedia('(pointer: coarse)').matches || window.innerWidth < 720,
      };
    } catch { return { reduced: false, mobile: false }; }
  }, []);
  const timeScale = reduced ? 0 : mobile ? 0.6 : 1;

  useEffect(() => {
    const el = wrap.current; if (!el || !('IntersectionObserver' in window)) return;
    const io = new IntersectionObserver(([e]) => { visibleRef.current = e.isIntersecting; }, { threshold: 0.05 });
    io.observe(el); return () => io.disconnect();
  }, []);

  return (
    <div ref={wrap} style={{ height, position: 'relative' }}
      onPointerMove={(e) => {
        const r = e.currentTarget.getBoundingClientRect();
        pointerRef.current = { x: ((e.clientX - r.left) / r.width) * 2 - 1, y: -(((e.clientY - r.top) / r.height) * 2 - 1) };
      }}>
      <Canvas dpr={mobile ? 1 : [1, 1.5]} gl={{ antialias: true, alpha: true, powerPreference: 'high-performance' }}
        camera={{ position: [0, 1.45, 7.6], fov: 46 }} frameloop="always"
        onPointerMissed={() => { /* empty-space click clears via overlay dblclick-safe no-op */ }}>
        <Scene nodes={nodes} onPick={onPick} story={story && !reduced} visibleRef={visibleRef} timeScale={timeScale} onCaption={setCaption} />
      </Canvas>
      {/* Scenario caption: DOM overlay (stable, readable, no 3D text overlap). */}
      {story && (
        <div className="absolute left-3 bottom-3 right-3 flex items-end justify-between gap-2 pointer-events-none">
          <div key={caption ? `${caption.idx}-${caption.phase}` : 'idle'}
            className="glass pointer-events-auto max-w-[430px] px-3.5 py-2.5"
            style={{ animation: 'gw-fade .45s ease-out' }}>
            <div className="hud-label !text-[10px] flex items-center gap-2">
              <span className="dot dot-ok live-ring text-emerald-400" />
              Live routing {caption ? `· ${caption.idx + 1}/3` : ''} {caption?.phase === 'routed' ? '· decided ✓' : caption ? '· analyzing…' : ''}
            </div>
            <div className="text-[13px] text-white font-medium mt-0.5">{caption?.title ?? 'Waiting for first request…'}</div>
            <div className="text-[11.5px] text-[#8d99ae]">{caption?.sub ?? 'Apps → Gateway → model'}</div>
          </div>
          <div className="hidden sm:flex gap-1.5 pointer-events-auto">
            {[0, 1, 2].map(i => (
              <span key={i} className="w-6 h-1 rounded-full" style={{ background: caption?.idx === i ? '#3b82f6' : '#1a2440' }} />
            ))}
          </div>
        </div>
      )}
      <style>{`@keyframes gw-fade { from { opacity: 0; transform: translateY(4px); } to { opacity: 1; transform: none; } }`}</style>
    </div>
  );
}
