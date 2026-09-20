import { useState } from 'react';
import { PageHead } from '../components/ui';
import { useGateway } from '../lib/store';

const TABS = ['Providers', 'API keys', 'Teams', 'Budgets', 'Routing', 'Policies', 'MCP servers', 'Notifications'];

export default function Settings() {
  const [tab, setTab] = useState('Providers');
  const { notify } = useGateway();
  return (
    <div>
      <PageHead title="Settings" sub="Config only — no daily ops here. Changes write to audit." right={<button className="btn btn-primary" onClick={() => notify(`${tab} saved`)}>Save {tab}</button>} />
      <div className="flex gap-1.5 flex-wrap mb-3">{TABS.map(t => <button key={t} className={`btn !py-1.5 ${tab === t ? '!border-blue-500 !text-white' : ''}`} onClick={() => setTab(t)}>{t}</button>)}</div>
      <div className="card p-4 min-h-[300px] text-[13px]">
        {tab === 'Providers' && <div className="grid md:grid-cols-2 gap-2">{['OpenAI ●', 'Anthropic ●', 'Google ●', 'Private VPC ●'].map(p => <div key={p} className="card p-3 flex justify-between">{p}<button className="text-blue-400" onClick={() => notify('Provider endpoint saved')}>Configure →</button></div>)}</div>}
        {tab === 'API keys' && <div className="flex flex-col gap-2">{['sk-…a1 (OpenAI)', 'claude-…9f (Anthropic)'].map(k => <div key={k} className="card p-3 flex justify-between mono text-[12.5px]">{k}<span className="flex gap-2"><button className="text-blue-400" onClick={() => notify('Key rotated')}>Rotate</button><button className="text-red-300" onClick={() => notify('Key revoked')}>Revoke</button></span></div>)}</div>}
        {tab === 'Teams' && <div className="text-[#8b94a3]">Manage members + allowed models per team. Budgets live in <b className="text-white">Resources →</b> (single source of truth).</div>}
        {tab === 'Budgets' && <div className="text-[#8b94a3]">Budgets are edited in Resources so spend + action stay together. This tab mirrors read-only totals.</div>}
        {tab === 'Routing' && <div className="text-[#8b94a3]">Default mode, JEV threshold slider, fallback chain. Live editor lives in <b className="text-white">Routing →</b>.</div>}
        {tab === 'Policies' && <div className="text-[#8b94a3]">Policy CRUD mirrors Security. Create there to keep approvals in context.</div>}
        {tab === 'MCP servers' && <div className="grid md:grid-cols-2 gap-2">{['mcp-crm-01 ●', 'mcp-drive-01 ●', 'mcp-pg-01 ●'].map(s => <div key={s} className="card p-3 flex justify-between">{s}<button className="text-blue-400" onClick={() => notify('MCP server saved')}>Edit →</button></div>)}</div>}
        {tab === 'Notifications' && <div className="max-w-[420px] flex flex-col gap-2"><label className="text-[12px] text-[#8b94a3]">Slack webhook<input className="input mt-1" placeholder="https://hooks.slack.com/…" /></label><label className="text-[12px] text-[#8b94a3]">Alert threshold %<input className="input mt-1" defaultValue={80} type="number" /></label></div>}
      </div>
    </div>
  );
}
