// Key metadata ONLY. No real secrets here or in localStorage — masked fingerprints only.
// A full secret exists transiently in component state at creation time and is never persisted.
export interface ApiKeyMeta {
  id: string; name: string; provider: string; owner: string;
  env: 'Production' | 'Staging' | 'Development';
  scope: string; models: string[];
  fingerprint: string; // e.g. sk-...8F2A (masked)
  created: string; lastUsed: string;
  status: 'Active' | 'Disabled' | 'Rotating';
  quota: string; budget: string; expires: string;
  apps: number; // affected apps count (for revoke impact)
}

export interface KeyRequest {
  id: string; requester: string; team: string; provider: string;
  model: string; purpose: string; env: string; scope: string;
  usage: string; budget: string; date: string;
  status: 'Pending' | 'Approved' | 'Denied';
}

export interface RevokedKey {
  id: string; name: string; owner: string; provider: string;
  revokedBy: string; revokedAt: string; reason: string; lastUsed: string;
}

export interface KeyAuditEvent {
  id: string; time: string; actor: string; action: string; detail: string;
}

export const KEYS: ApiKeyMeta[] = [
  { id: 'k1', name: 'prod-openai', provider: 'OpenAI', owner: 'AI Team A', env: 'Production', scope: 'model.invoke', models: ['GPT-4o mini'], fingerprint: 'sk-…8F2A', created: 'Sep 10', lastUsed: '2 min ago', status: 'Active', quota: '50M tok/mo', budget: '$500/mo', expires: 'Dec 31', apps: 3 },
  { id: 'k2', name: 'crm-agent', provider: 'Internal', owner: 'Sales', env: 'Production', scope: 'crm.read', models: ['Internal API'], fingerprint: 'sk-…C41D', created: 'Sep 4', lastUsed: '1 day ago', status: 'Active', quota: '10k req/day', budget: '$50/mo', expires: 'Nov 30', apps: 1 },
  { id: 'k3', name: 'staging-anthropic', provider: 'Anthropic', owner: 'Research', env: 'Staging', scope: 'model.invoke', models: ['Claude Sonnet 4'], fingerprint: 'sk-…77BE', created: 'Aug 28', lastUsed: '3 h ago', status: 'Active', quota: '20M tok/mo', budget: '$300/mo', expires: 'Dec 31', apps: 2 },
  { id: 'k4', name: 'support-embeddings', provider: 'OpenAI', owner: 'Support', env: 'Production', scope: 'embeddings.read', models: ['text-embed-3'], fingerprint: 'sk-…09AA', created: 'Aug 12', lastUsed: '6 days ago', status: 'Disabled', quota: '5M tok/mo', budget: '$40/mo', expires: 'Oct 31', apps: 1 },
];

export const KEY_REQUESTS: KeyRequest[] = [
  { id: 'KR-118', requester: 'M. Chen', team: 'Marketing AI', provider: 'OpenAI', model: 'GPT model access', purpose: 'Feedback summarization', env: 'Production', scope: 'model.invoke', usage: '~2M tok/mo', budget: '$200/month', date: 'Sep 18', status: 'Pending' },
  { id: 'KR-117', requester: 'J. Okafor', team: 'Finance', provider: 'Private VPC', model: 'Llama Private', purpose: 'Ledger summarization (private only)', env: 'Production', scope: 'model.invoke', usage: '~5M tok/mo', budget: '$100/month', date: 'Sep 17', status: 'Pending' },
  { id: 'KR-116', requester: 'A. Ruiz', team: 'Support', provider: 'Google', model: 'Gemini 2.0 Flash', purpose: 'Ticket triage pilot', env: 'Staging', scope: 'model.invoke', usage: '~1M tok/mo', budget: '$80/month', date: 'Sep 15', status: 'Approved' },
];

export const REVOKED_KEYS: RevokedKey[] = [
  { id: 'k0', name: 'legacy-support', owner: 'Support', provider: 'OpenAI', revokedBy: 'platform-manager', revokedAt: 'Sep 02', reason: 'Unused for 45 days', lastUsed: 'Aug 01' },
];

export const KEY_AUDIT_SEED: KeyAuditEvent[] = [
  { id: 'ka0', time: 'Sep 02 10:14', actor: 'platform-manager', action: 'key.revoked', detail: 'legacy-support (Support) — unused 45 days' },
];

export function maskOf(): string {
  const h = Math.floor(Math.random() * 0xffff).toString(16).toUpperCase().padStart(4, '0');
  return `sk-…${h}`;
}

// Mock one-time secret. Generated in component state, shown once, NEVER persisted.
export function mockSecret(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789';
  let s = '';
  for (let i = 0; i < 24; i++) s += chars[Math.floor(Math.random() * chars.length)];
  return `sk-live-${s}`;
}
