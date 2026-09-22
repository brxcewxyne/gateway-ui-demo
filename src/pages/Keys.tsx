import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { PageHead, StatusDot } from '../components/ui';
import { maskOf, mockSecret, type ApiKeyMeta } from '../mocks/keys';
import { useGateway } from '../lib/store';

type Tab = 'keys' | 'requests' | 'revoked';

const PROVIDERS = ['OpenAI', 'Anthropic', 'Google', 'Private VPC', 'Internal'];
const TEAMS = ['AI Team A', 'Marketing AI', 'Research', 'Finance', 'Sales', 'Support'];
const ENVS = ['Production', 'Staging', 'Development'] as const;
const SCOPES = ['model.invoke', 'embeddings.read', 'crm.read', 'crm.write', 'drive.read'];

function Modal({ children, onClose, wide }: { children: React.ReactNode; onClose: () => void; wide?: boolean }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="absolute inset-0 bg-black/60" />
      <div className={`relative card !bg-[#10151d] p-5 w-full ${wide ? 'max-w-[560px]' : 'max-w-[440px]'} max-h-[88vh] overflow-y-auto`} onClick={e => e.stopPropagation()}>
        {children}
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return <label className="block text-[12px] text-[#8d99ae]">{label}<div className="mt-1">{children}</div></label>;
}

// ---- Create wizard: secret exists ONLY in this component's state, shown once, never stored ----
function CreateWizard({ onClose }: { onClose: () => void }) {
  const createKeyMeta = useGateway(s => s.createKeyMeta);
  const [step, setStep] = useState(1);
  const [form, setForm] = useState({ name: '', provider: 'OpenAI', team: 'AI Team A', env: 'Production' as string, models: 'GPT-4o mini', scope: 'model.invoke', quota: '10M tok/mo', budget: '$200/mo', expires: '90 days' });
  const [secret, setSecret] = useState<string | null>(null);
  const set = (k: keyof typeof form, v: string) => setForm(f => ({ ...f, [k]: v }));

  const finish = () => {
    const oneTime = mockSecret(); // transient — never persisted
    createKeyMeta({
      id: `k${Date.now()}`, name: form.name || `${form.team.toLowerCase().replace(/[^a-z]+/g, '-')}-${form.provider.toLowerCase()}`,
      provider: form.provider, owner: form.team, env: form.env as ApiKeyMeta['env'],
      scope: form.scope, models: [form.models], fingerprint: maskOf(),
      created: 'just now', lastUsed: 'never', status: 'Active',
      quota: form.quota, budget: form.budget, expires: form.expires, apps: 0,
    });
    setSecret(oneTime);
    setStep(5);
  };

  return (
    <Modal onClose={onClose} wide>
      <div className="text-white font-medium text-[15px]">Create key {step <= 4 && <span className="text-[#8d99ae] font-normal">· step {step}/4</span>}</div>
      {step <= 4 && <div className="flex gap-1 mt-2">{[1, 2, 3, 4].map(i => <div key={i} className={`h-1 flex-1 rounded ${i <= step ? 'bg-blue-500' : 'bg-[#1a2440]'}`} />)}</div>}

      {step === 1 && <div className="grid gap-3 mt-4">
        <Field label="Key name (optional — auto-generated)"><input className="input" value={form.name} onChange={e => set('name', e.target.value)} placeholder="prod-openai" /></Field>
        <div className="grid grid-cols-3 gap-2">
          <Field label="Provider"><select className="input" value={form.provider} onChange={e => set('provider', e.target.value)}>{PROVIDERS.map(p => <option key={p}>{p}</option>)}</select></Field>
          <Field label="Team"><select className="input" value={form.team} onChange={e => set('team', e.target.value)}>{TEAMS.map(p => <option key={p}>{p}</option>)}</select></Field>
          <Field label="Environment"><select className="input" value={form.env} onChange={e => set('env', e.target.value)}>{ENVS.map(p => <option key={p}>{p}</option>)}</select></Field>
        </div>
      </div>}

      {step === 2 && <div className="grid gap-3 mt-4">
        <Field label="Models"><input className="input" value={form.models} onChange={e => set('models', e.target.value)} placeholder="GPT-4o mini" /></Field>
        <Field label="Scope"><select className="input" value={form.scope} onChange={e => set('scope', e.target.value)}>{SCOPES.map(p => <option key={p}>{p}</option>)}</select></Field>
        <div className="grid grid-cols-3 gap-2">
          <Field label="Quota"><input className="input" value={form.quota} onChange={e => set('quota', e.target.value)} /></Field>
          <Field label="Budget"><input className="input" value={form.budget} onChange={e => set('budget', e.target.value)} /></Field>
          <Field label="Expiration"><select className="input" value={form.expires} onChange={e => set('expires', e.target.value)}>{['30 days', '90 days', '1 year', 'No expiry'].map(p => <option key={p}>{p}</option>)}</select></Field>
        </div>
      </div>}

      {step === 3 && <div className="card p-3 mt-4 text-[13px]">
        {[['Name', form.name || '(auto)'], ['Provider', form.provider], ['Team', form.team], ['Environment', form.env], ['Models', form.models], ['Scope', form.scope], ['Quota', form.quota], ['Budget', form.budget], ['Expires', form.expires]].map(([k, v]) => (
          <div key={k} className="flex justify-between py-1 border-b border-[#1a2230] last:border-0"><span className="text-[#8d99ae]">{k}</span><span className="text-white">{v}</span></div>
        ))}
      </div>}

      {step === 4 && <div className="card p-3 mt-4 text-[13px] text-[#8d99ae]">
        Ready to create. The full secret will be shown <b className="text-white">once</b> — copy it now, it cannot be viewed again. Only the masked fingerprint is stored.
        <div className="flex gap-2 mt-3"><button className="btn btn-primary" onClick={finish}>Create key</button></div>
      </div>}

      {step === 5 && secret && <div className="mt-4">
        <div className="card p-3 !border-amber-500/50 bg-amber-500/[0.07]">
          <div className="text-amber-200 text-[13px] font-medium">Copy this key now. You will not be able to view it again.</div>
          <div className="mono text-white text-[14px] mt-2 break-all select-all">{secret}</div>
          <button className="btn mt-2" onClick={() => navigator.clipboard?.writeText(secret)}>Copy to clipboard</button>
        </div>
        <button className="btn btn-primary mt-3 w-full justify-center" onClick={onClose}>I copied it — close</button>
      </div>}

      {step <= 4 && <div className="flex justify-between mt-4">
        <button className="btn" onClick={() => step === 1 ? onClose() : setStep(step - 1)}>Back</button>
        {step < 4 && <button className="btn btn-primary" onClick={() => setStep(step + 1)}>Continue →</button>}
      </div>}
    </Modal>
  );
}

function RotateModal({ k, onClose }: { k: ApiKeyMeta; onClose: () => void }) {
  const rotateKeyMeta = useGateway(s => s.rotateKeyMeta);
  const [done, setDone] = useState(false);
  return (
    <Modal onClose={onClose}>
      <div className="text-white font-medium">Rotate key</div>
      {!done ? <>
        <div className="card p-3 mt-3 text-[13px]">
          <div className="flex justify-between py-1"><span className="text-[#8d99ae]">Current</span><span className="mono text-white">{k.fingerprint}</span></div>
          <div className="flex justify-between py-1"><span className="text-[#8d99ae]">New key</span><span className="text-white">created on confirm (masked)</span></div>
          <div className="flex justify-between py-1"><span className="text-[#8d99ae]">Grace period</span><span className="text-white">24h</span></div>
          <div className="flex justify-between py-1"><span className="text-[#8d99ae]">Old key</span><span className="text-amber-300">scheduled for revoke</span></div>
        </div>
        <div className="flex gap-2 mt-3"><button className="btn btn-primary" onClick={() => { rotateKeyMeta(k.id); setDone(true); }}>Rotate now</button><button className="btn" onClick={onClose}>Cancel</button></div>
      </> : <>
        <div className="card p-3 mt-3 text-[13px] text-[#8d99ae]">New fingerprint issued. Old key stays valid for <b className="text-white">24h</b>, then auto-revokes. Rotation logged to Audit.</div>
        <button className="btn btn-primary mt-3 w-full justify-center" onClick={onClose}>Done</button>
      </>}
    </Modal>
  );
}

function RevokeModal({ k, onClose }: { k: ApiKeyMeta; onClose: () => void }) {
  const revokeKey = useGateway(s => s.revokeKey);
  const [reason, setReason] = useState('');
  const [confirm, setConfirm] = useState('');
  const ok = reason.trim().length > 0 && confirm === k.name;
  return (
    <Modal onClose={onClose}>
      <div className="text-white font-medium">Revoke key <span className="mono text-[#8d99ae]">{k.name}</span></div>
      <div className="card p-3 mt-3 text-[13px]">
        {[['Owner', k.owner], ['Provider', k.provider], ['Affected apps', String(k.apps)], ['Last used', k.lastUsed]].map(([a, b]) => (
          <div key={a} className="flex justify-between py-1 border-b border-[#1a2230] last:border-0"><span className="text-[#8d99ae]">{a}</span><span className="text-white">{b}</span></div>
        ))}
      </div>
      <div className="card p-3 mt-2 !border-red-500/50 bg-red-500/[0.07] text-[13px] text-red-200">Requests using this key will stop immediately.</div>
      <Field label="Reason (required)"><input className="input mt-1" value={reason} onChange={e => setReason(e.target.value)} placeholder="e.g. key leaked in logs" /></Field>
      <div className="mt-2"><Field label={`Type "${k.name}" to confirm`}><input className="input mt-1 mono" value={confirm} onChange={e => setConfirm(e.target.value)} /></Field></div>
      <div className="flex gap-2 mt-3">
        <button className="btn btn-danger" disabled={!ok} style={{ opacity: ok ? 1 : 0.4 }} onClick={() => { revokeKey(k.id, reason); onClose(); }}>Revoke permanently</button>
        <button className="btn" onClick={onClose}>Cancel</button>
      </div>
    </Modal>
  );
}

function RequestKeyModal({ onClose }: { onClose: () => void }) {
  const submitKeyRequest = useGateway(s => s.submitKeyRequest);
  const [f, setF] = useState({ requester: '', team: 'Marketing AI', provider: 'OpenAI', model: 'GPT model access', purpose: '', env: 'Production', scope: 'model.invoke', usage: '~2M tok/mo', budget: '$200/month' });
  const set = (k: keyof typeof f, v: string) => setF(p => ({ ...p, [k]: v }));
  const valid = f.requester.trim() && f.purpose.trim();
  return (
    <Modal onClose={onClose} wide>
      <div className="text-white font-medium">Request key</div>
      <div className="grid gap-3 mt-3">
        <div className="grid grid-cols-2 gap-2">
          <Field label="Requester"><input className="input" value={f.requester} onChange={e => set('requester', e.target.value)} placeholder="Your name" /></Field>
          <Field label="Team"><select className="input" value={f.team} onChange={e => set('team', e.target.value)}>{TEAMS.map(t => <option key={t}>{t}</option>)}</select></Field>
        </div>
        <div className="grid grid-cols-2 gap-2">
          <Field label="Provider"><select className="input" value={f.provider} onChange={e => set('provider', e.target.value)}>{PROVIDERS.map(t => <option key={t}>{t}</option>)}</select></Field>
          <Field label="Requested model"><input className="input" value={f.model} onChange={e => set('model', e.target.value)} /></Field>
        </div>
        <Field label="Purpose"><input className="input" value={f.purpose} onChange={e => set('purpose', e.target.value)} placeholder="e.g. feedback summarization" /></Field>
        <div className="grid grid-cols-3 gap-2">
          <Field label="Environment"><select className="input" value={f.env} onChange={e => set('env', e.target.value)}>{ENVS.map(t => <option key={t}>{t}</option>)}</select></Field>
          <Field label="Scope"><select className="input" value={f.scope} onChange={e => set('scope', e.target.value)}>{SCOPES.map(t => <option key={t}>{t}</option>)}</select></Field>
          <Field label="Expected usage"><input className="input" value={f.usage} onChange={e => set('usage', e.target.value)} /></Field>
        </div>
        <Field label="Budget / quota"><input className="input" value={f.budget} onChange={e => set('budget', e.target.value)} /></Field>
      </div>
      <div className="flex gap-2 mt-4">
        <button className="btn btn-primary" disabled={!valid} style={{ opacity: valid ? 1 : 0.4 }} onClick={() => {
          submitKeyRequest({ id: `KR-${Math.floor(100 + Math.random() * 900)}`, requester: f.requester, team: f.team, provider: f.provider, model: f.model, purpose: f.purpose, env: f.env, scope: f.scope, usage: f.usage, budget: f.budget, date: 'just now', status: 'Pending' });
          onClose();
        }}>Submit for approval</button>
        <button className="btn" onClick={onClose}>Cancel</button>
      </div>
    </Modal>
  );
}

export default function Keys() {
  const { keys, keyRequests, revokedKeys, setKeyStatus, decideKeyRequest } = useGateway();
  const [tab, setTab] = useState<Tab>('keys');
  const [q, setQ] = useState('');
  const [wizard, setWizard] = useState(false);
  const [reqModal, setReqModal] = useState(false);
  const [rotate, setRotate] = useState<ApiKeyMeta | null>(null);
  const [revoke, setRevoke] = useState<ApiKeyMeta | null>(null);
  const [view, setView] = useState<ApiKeyMeta | null>(null);
  const [viewReq, setViewReq] = useState<string | null>(null);

  const rows = useMemo(() => keys.filter(k => !q || (k.name + k.provider + k.owner + k.scope).toLowerCase().includes(q.toLowerCase())), [keys, q]);
  const pending = keyRequests.filter(r => r.status === 'Pending').length;

  return (
    <div>
      <PageHead eyebrow="Access" title="Keys" sub="Application and provider access. Secrets shown once at creation — only masked fingerprints are stored."
        right={<>{tab === 'requests'
          ? <button className="btn btn-primary" onClick={() => setReqModal(true)}>+ Request key</button>
          : <button className="btn btn-primary" onClick={() => setWizard(true)}>+ Create key</button>}</>} />

      <div className="flex gap-1.5 mb-3">
        {([['keys', `Keys (${keys.length})`], ['requests', `Requests${pending ? ` (${pending} pending)` : ''}`], ['revoked', `Revoked (${revokedKeys.length})`]] as [Tab, string][]).map(([t, l]) => (
          <button key={t} className={`btn ${tab === t ? '!border-blue-500 !text-white' : ''}`} onClick={() => setTab(t)}>{l}</button>
        ))}
        {tab === 'keys' && <input className="input !w-[240px] ml-auto" placeholder="Filter keys…" value={q} onChange={e => setQ(e.target.value)} />}
      </div>

      {tab === 'keys' && (
        <div className="card overflow-hidden">
          <table className="w-full text-[12.5px]">
            <thead><tr className="text-left text-[#8d99ae] text-[11px] uppercase border-b border-[#1c2740]">
              <th className="p-2.5">Key name</th><th>Provider</th><th>Owner / Team</th><th>Env</th><th>Scope</th><th>Created</th><th>Last used</th><th>Status</th><th className="text-right pr-2.5">Actions</th>
            </tr></thead>
            <tbody>{rows.map(k => (
              <tr key={k.id} className="table-row border-b border-[#1a2440]">
                <td className="p-2.5"><span className="mono text-white">{k.name}</span><div className="mono text-[11px] text-[#5a6578]">{k.fingerprint}</div></td>
                <td>{k.provider}</td><td>{k.owner}</td><td><span className="badge">{k.env}</span></td><td className="mono">{k.scope}</td>
                <td className="text-[#8d99ae]">{k.created}</td><td className="text-[#8d99ae]">{k.lastUsed}</td>
                <td><span className="flex items-center gap-1.5"><StatusDot s={k.status === 'Active' ? 'allow' : 'warn'} />{k.status}</span></td>
                <td className="p-2.5"><div className="flex justify-end gap-1">
                  <button className="btn !py-0.5 !px-2 !text-[11.5px]" onClick={() => setView(k)}>View</button>
                  <button className="btn !py-0.5 !px-2 !text-[11.5px]" onClick={() => setRotate(k)}>Rotate</button>
                  <button className="btn !py-0.5 !px-2 !text-[11.5px]" onClick={() => setKeyStatus(k.id, k.status === 'Active' ? 'Disabled' : 'Active')}>{k.status === 'Active' ? 'Disable' : 'Enable'}</button>
                  <button className="btn btn-danger !py-0.5 !px-2 !text-[11.5px]" onClick={() => setRevoke(k)}>Revoke</button>
                </div></td>
              </tr>
            ))}</tbody>
          </table>
          {rows.length === 0 && <div className="p-6 text-center text-[13px] text-[#8d99ae]">No keys match. <button className="text-blue-400" onClick={() => setWizard(true)}>Create one →</button></div>}
        </div>
      )}

      {tab === 'requests' && (
        <div className="card overflow-hidden">
          <table className="w-full text-[12.5px]">
            <thead><tr className="text-left text-[#8d99ae] text-[11px] uppercase border-b border-[#1c2740]">
              <th className="p-2.5">Request</th><th>Team</th><th>Provider / Model</th><th>Purpose</th><th>Scope · Env</th><th>Budget</th><th>Status</th><th className="text-right pr-2.5">Actions</th>
            </tr></thead>
            <tbody>{keyRequests.map(r => (
              <>
                <tr key={r.id} className="table-row border-b border-[#1a2440]">
                  <td className="p-2.5"><span className="mono text-white">{r.id}</span><div className="text-[11px] text-[#5a6578]">{r.requester} · {r.date}</div></td>
                  <td>{r.team}</td><td>{r.provider}<div className="text-[11px] text-[#5a6578]">{r.model}</div></td>
                  <td className="max-w-[220px]">{r.purpose}</td><td className="mono">{r.scope} · {r.env}</td><td>{r.budget}</td>
                  <td><span className={`text-[12px] ${r.status === 'Pending' ? 'text-amber-300' : r.status === 'Approved' ? 'text-emerald-300' : 'text-red-300'}`}>{r.status}</span></td>
                  <td className="p-2.5"><div className="flex justify-end gap-1">
                    <button className="btn !py-0.5 !px-2 !text-[11.5px]" onClick={() => setViewReq(viewReq === r.id ? null : r.id)}>Details</button>
                    {r.status === 'Pending' && <>
                      <button className="btn !py-0.5 !px-2 !text-[11.5px]" onClick={() => decideKeyRequest(r.id, true)}>Approve</button>
                      <button className="btn btn-danger !py-0.5 !px-2 !text-[11.5px]" onClick={() => decideKeyRequest(r.id, false)}>Deny</button>
                    </>}
                  </div></td>
                </tr>
                {viewReq === r.id && (
                  <tr key={r.id + '-d'} className="border-b border-[#1a2440] bg-[#0a0f1c]">
                    <td colSpan={8} className="p-3 text-[12.5px]">
                      <div className="grid md:grid-cols-4 gap-2">
                        {[['Expected usage', r.usage], ['Budget / quota', r.budget], ['Environment', r.env], ['Requested', r.date]].map(([a, b]) => (
                          <div key={a} className="card p-2.5"><div className="kpi-label">{a}</div><div className="text-white mt-0.5">{b}</div></div>
                        ))}
                      </div>
                      <div className="text-[#8d99ae] mt-2">Approval creates a key + audit event. Flow: team request → manager approval → key → audit.</div>
                    </td>
                  </tr>
                )}
              </>
            ))}</tbody>
          </table>
        </div>
      )}

      {tab === 'revoked' && (
        <div className="card overflow-hidden">
          <table className="w-full text-[12.5px]">
            <thead><tr className="text-left text-[#8d99ae] text-[11px] uppercase border-b border-[#1c2740]">
              <th className="p-2.5">Key name</th><th>Owner</th><th>Provider</th><th>Revoked by</th><th>Revoked</th><th>Reason</th><th>Last used</th>
            </tr></thead>
            <tbody>{revokedKeys.map(k => (
              <tr key={k.id} className="table-row border-b border-[#1a2440]">
                <td className="p-2.5 mono text-white">{k.name}</td><td>{k.owner}</td><td>{k.provider}</td>
                <td className="text-[#8d99ae]">{k.revokedBy}</td><td className="text-[#8d99ae]">{k.revokedAt}</td>
                <td>{k.reason}</td><td className="text-[#8d99ae]">{k.lastUsed}</td>
              </tr>
            ))}</tbody>
          </table>
          <div className="px-3 py-2 text-[11.5px] text-[#5a6578]">No restore by default — create a new key instead. Every revocation is in <Link className="text-blue-400" to="/audit">Audit Logs →</Link></div>
        </div>
      )}

      {wizard && <CreateWizard onClose={() => setWizard(false)} />}
      {reqModal && <RequestKeyModal onClose={() => setReqModal(false)} />}
      {rotate && <RotateModal k={rotate} onClose={() => setRotate(null)} />}
      {revoke && <RevokeModal k={revoke} onClose={() => setRevoke(null)} />}
      {view && (
        <Modal onClose={() => setView(null)}>
          <div className="text-white font-medium mono">{view.name}</div>
          <div className="card p-3 mt-3 text-[13px]">
            {[['Fingerprint', view.fingerprint], ['Provider', view.provider], ['Owner', view.owner], ['Environment', view.env], ['Scope', view.scope], ['Models', view.models.join(', ')], ['Quota', view.quota], ['Budget', view.budget], ['Expires', view.expires], ['Status', view.status], ['Affected apps', String(view.apps)]].map(([a, b]) => (
              <div key={a} className="flex justify-between py-1 border-b border-[#1a2230] last:border-0"><span className="text-[#8d99ae]">{a}</span><span className="text-white mono">{b}</span></div>
            ))}
          </div>
          <div className="text-[12px] text-[#5a6578] mt-2">Full secret never displayed after creation — rotate if lost.</div>
          <button className="btn mt-3" onClick={() => setView(null)}>Close</button>
        </Modal>
      )}
    </div>
  );
}
