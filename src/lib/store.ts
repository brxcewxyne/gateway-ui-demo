import { create } from 'zustand';
import { APPROVALS, CONNECTORS, MODELS, POLICIES, TEAMS } from '../mocks/data';
import { KEYS, KEY_AUDIT_SEED, KEY_REQUESTS, REVOKED_KEYS, maskOf, type KeyAuditEvent } from '../mocks/keys';

function load<T>(k: string, fb: T): T {
  try { const raw = localStorage.getItem(k); return raw ? { ...fb as object, ...JSON.parse(raw) } as T : fb; } catch { return fb; }
}
function loadArr<T>(k: string, fb: T[]): T[] {
  try { const raw = localStorage.getItem(k); return raw ? JSON.parse(raw) : fb; } catch { return fb; }
}

interface GatewayState {
  mode: 'auto' | 'manual';
  models: typeof MODELS;
  teams: typeof TEAMS;
  connectors: typeof CONNECTORS;
  policies: typeof POLICIES;
  approvals: typeof APPROVALS;
  routingRules: { id: string; cond: string; action: string; on: boolean }[];
  toast: string | null;
  keys: typeof KEYS;
  keyRequests: typeof KEY_REQUESTS;
  revokedKeys: typeof REVOKED_KEYS;
  keyAudit: KeyAuditEvent[];
  setMode: (m: 'auto'|'manual') => void;
  toggleModel: (id: string) => void;
  bumpPriority: (id: string, dir: 1|-1) => void;
  updateTeam: (id: string, patch: Partial<typeof TEAMS[number]>) => void;
  addRule: (cond: string, action: string) => void;
  toggleRule: (id: string) => void;
  setApproval: (id: string, s: 'approved'|'denied') => void;
  setConnector: (id: string, status: typeof CONNECTORS[number]['status']) => void;
  logKeyAudit: (action: string, detail: string, actor?: string) => void;
  createKeyMeta: (meta: typeof KEYS[number]) => void;
  setKeyStatus: (id: string, status: 'Active' | 'Disabled') => void;
  rotateKeyMeta: (id: string) => void;
  revokeKey: (id: string, reason: string, by?: string) => void;
  decideKeyRequest: (id: string, approve: boolean) => void;
  submitKeyRequest: (r: typeof KEY_REQUESTS[number]) => void;
  notify: (t: string) => void;
}

export const useGateway = create<GatewayState>((set) => ({
  mode: (load('gw-mode', { v: 'auto' } as never) as { v: string }).v as 'auto'|'manual' ?? 'auto',
  models: loadArr('gw-models', MODELS),
  teams: loadArr('gw-teams', TEAMS),
  connectors: loadArr('gw-conn', CONNECTORS),
  policies: loadArr('gw-pol', POLICIES),
  approvals: loadArr('gw-appr', APPROVALS),
  keys: loadArr('gw-keys', KEYS),
  keyRequests: loadArr('gw-keyreq', KEY_REQUESTS),
  revokedKeys: loadArr('gw-keyrev', REVOKED_KEYS),
  keyAudit: loadArr('gw-keyaudit', KEY_AUDIT_SEED),
  routingRules: loadArr('gw-rules', [
    { id: 'r1', cond: 'IF finance.* THEN model = llama-local', action: 'Enforce private', on: true },
    { id: 'r2', cond: 'IF difficulty = hard THEN prefer claude-sonnet', action: 'Quality first', on: true },
    { id: 'r3', cond: 'IF team budget > 90% THEN prefer cost < $1/1M', action: 'Budget-aware reroute', on: true },
  ]),
  toast: null,
  setMode: (mode) => { localStorage.setItem('gw-mode', JSON.stringify({ v: mode })); set({ mode }); },
  toggleModel: (id) => set((s) => {
    const models = s.models.map(m => m.id === id ? { ...m, status: m.status === 'disabled' ? 'healthy' as const : 'disabled' as const } : m);
    localStorage.setItem('gw-models', JSON.stringify(models)); return { models };
  }),
  bumpPriority: (id, dir) => set((s) => {
    const models = [...s.models].map(m => m.id === id ? { ...m, fallbackPriority: Math.max(1, Math.min(5, m.fallbackPriority + dir)) } : m);
    localStorage.setItem('gw-models', JSON.stringify(models)); return { models, toast: `Priority updated` };
  }),
  updateTeam: (id, patch) => set((s) => {
    const teams = s.teams.map(t => t.id === id ? { ...t, ...patch } : t);
    localStorage.setItem('gw-teams', JSON.stringify(teams)); return { teams, toast: 'Budget/quota updated — routing will reflect it' };
  }),
  addRule: (cond, action) => set((s) => {
    const routingRules = [...s.routingRules, { id: `r${Date.now()}`, cond, action, on: true }];
    localStorage.setItem('gw-rules', JSON.stringify(routingRules)); return { routingRules, toast: 'Routing rule created' };
  }),
  toggleRule: (id) => set((s) => {
    const routingRules = s.routingRules.map(r => r.id === id ? { ...r, on: !r.on } : r);
    localStorage.setItem('gw-rules', JSON.stringify(routingRules)); return { routingRules };
  }),
  setApproval: (id, st) => set((s) => {
    const approvals = s.approvals.map(a => a.id === id ? { ...a, status: st } : a);
    localStorage.setItem('gw-appr', JSON.stringify(approvals)); return { approvals, toast: `Request ${id} ${st}` };
  }),
  setConnector: (id, status) => set((s) => {
    const connectors = s.connectors.map(c => c.id === id ? { ...c, status } : c);
    localStorage.setItem('gw-conn', JSON.stringify(connectors)); return { connectors, toast: `Connector ${id} → ${status}` };
  }),
  // --- Keys: metadata only. Full secrets are NEVER written to the store or localStorage. ---
  logKeyAudit: (action: string, detail: string, actor = 'platform-manager') => set((s) => {
    const ev: KeyAuditEvent = { id: `ka${Date.now()}`, time: 'just now', actor, action, detail };
    const keyAudit = [ev, ...s.keyAudit];
    localStorage.setItem('gw-keyaudit', JSON.stringify(keyAudit)); return { keyAudit };
  }),
  createKeyMeta: (meta) => set((s) => {
    const keys = [meta, ...s.keys];
    const ev: KeyAuditEvent = { id: `ka${Date.now()}`, time: 'just now', actor: 'platform-manager', action: 'key.created', detail: `${meta.name} (${meta.owner}) · ${meta.provider} · ${meta.scope}` };
    localStorage.setItem('gw-keys', JSON.stringify(keys));
    const keyAudit = [ev, ...s.keyAudit];
    localStorage.setItem('gw-keyaudit', JSON.stringify(keyAudit));
    return { keys, keyAudit, toast: `Key ${meta.name} created` };
  }),
  setKeyStatus: (id, status) => set((s) => {
    const keys = s.keys.map(k => k.id === id ? { ...k, status } : k);
    const k = s.keys.find(x => x.id === id);
    const ev: KeyAuditEvent = { id: `ka${Date.now()}`, time: 'just now', actor: 'platform-manager', action: status === 'Active' ? 'key.enabled' : 'key.disabled', detail: `${k?.name} (${k?.owner})` };
    localStorage.setItem('gw-keys', JSON.stringify(keys));
    const keyAudit = [ev, ...s.keyAudit];
    localStorage.setItem('gw-keyaudit', JSON.stringify(keyAudit));
    return { keys, keyAudit, toast: `Key ${k?.name} → ${status}` };
  }),
  rotateKeyMeta: (id) => set((s) => {
    const keys = s.keys.map(k => k.id === id ? { ...k, status: 'Active' as const, fingerprint: maskOf(), lastUsed: 'grace period · old revokes in 24h' } : k);
    const k = s.keys.find(x => x.id === id);
    const ev: KeyAuditEvent = { id: `ka${Date.now()}`, time: 'just now', actor: 'platform-manager', action: 'key.rotated', detail: `${k?.name} — new fingerprint issued, 24h grace, old scheduled for revoke` };
    localStorage.setItem('gw-keys', JSON.stringify(keys));
    const keyAudit = [ev, ...s.keyAudit];
    localStorage.setItem('gw-keyaudit', JSON.stringify(keyAudit));
    return { keys, keyAudit, toast: `Key ${k?.name} rotated — 24h grace` };
  }),
  revokeKey: (id, reason, by = 'platform-manager') => set((s) => {
    const k = s.keys.find(x => x.id === id);
    if (!k) return {};
    const keys = s.keys.filter(x => x.id !== id);
    const revokedKeys = [{ id: k.id, name: k.name, owner: k.owner, provider: k.provider, revokedBy: by, revokedAt: 'just now', reason, lastUsed: k.lastUsed }, ...s.revokedKeys];
    const ev: KeyAuditEvent = { id: `ka${Date.now()}`, time: 'just now', actor: by, action: 'key.revoked', detail: `${k.name} (${k.owner}) — ${reason}. ${k.apps} app(s) affected` };
    localStorage.setItem('gw-keys', JSON.stringify(keys));
    localStorage.setItem('gw-keyrev', JSON.stringify(revokedKeys));
    const keyAudit = [ev, ...s.keyAudit];
    localStorage.setItem('gw-keyaudit', JSON.stringify(keyAudit));
    return { keys, revokedKeys, keyAudit, toast: `Key ${k.name} revoked — ${k.apps} app(s) affected` };
  }),
  decideKeyRequest: (id, approve) => set((s) => {
    const r = s.keyRequests.find(x => x.id === id);
    if (!r) return {};
    const keyRequests = s.keyRequests.map(x => x.id === id ? { ...x, status: (approve ? 'Approved' : 'Denied') as 'Approved' | 'Denied' } : x);
    localStorage.setItem('gw-keyreq', JSON.stringify(keyRequests));
    let keys = s.keys;
    if (approve) {
      const meta = { id: `k${Date.now()}`, name: `${r.team.toLowerCase().replace(/[^a-z]+/g, '-')}-${r.provider.toLowerCase().replace(/[^a-z]+/g, '')}`, provider: r.provider, owner: r.team, env: r.env as 'Production' | 'Staging' | 'Development', scope: r.scope, models: [r.model], fingerprint: maskOf(), created: 'just now', lastUsed: 'never', status: 'Active' as const, quota: r.usage, budget: r.budget, expires: '—', apps: 0 };
      keys = [meta, ...s.keys];
      localStorage.setItem('gw-keys', JSON.stringify(keys));
    }
    const ev: KeyAuditEvent = { id: `ka${Date.now()}a`, time: 'just now', actor: 'platform-manager', action: approve ? 'key.request.approved' : 'key.request.denied', detail: `${r.id} ${r.team} → ${r.provider} (${r.model})${approve ? ' — key created' : ''}` };
    const keyAudit = [ev, ...s.keyAudit];
    localStorage.setItem('gw-keyaudit', JSON.stringify(keyAudit));
    return { keyRequests, keys, keyAudit, toast: `Request ${id} ${approve ? 'approved — key created' : 'denied'}` };
  }),
  submitKeyRequest: (r) => set((s) => {
    const keyRequests = [r, ...s.keyRequests];
    localStorage.setItem('gw-keyreq', JSON.stringify(keyRequests));
    return { keyRequests, toast: `Key request ${r.id} submitted for approval` };
  }),
  notify: (toast) => set({ toast }),
}));
setTimeout(() => useGateway.setState({ toast: null }), 0);
