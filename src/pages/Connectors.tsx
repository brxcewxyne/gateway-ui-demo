import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import HubMap from '../components/HubMap';
import { PageHead, StatusDot } from '../components/ui';
import { useGateway } from '../lib/store';

export default function Connectors() {
  const nav = useNavigate();
  const { connectors, setConnector, notify } = useGateway();
  const [sel, setSel] = useState(connectors[2].id);
  const cur = connectors.find(c => c.id === sel)!;

  return (
    <div>
      <PageHead eyebrow="MCP" title="MCP / Connectors" sub="What can agents touch? The gateway decides: model requests, gateway allows. Click a node for tools + permissions."
        right={<><button className="btn" onClick={() => notify('Connector registry: paste MCP server URL to add')}>+ Add connector</button><button className="btn" onClick={() => nav('/security')}>Open policies →</button></>} />
      <div className="grid lg:grid-cols-[1.5fr_1fr] gap-3">
        <HubMap compact variant="connectors" nodes={[...connectors.map(c => ({ id: c.id, label: c.name, kind: 'connector' as const, status: c.status }))]} onPick={setSel} />
        <div className="card p-4">
          <div className="flex items-center justify-between"><div className="text-[#0E1626] font-medium">{cur.name}</div><span className="badge"><StatusDot s={cur.status} /> {cur.status}</span></div>
          <div className="text-[12px] text-[#5B6B82] mono mt-1">{cur.kind} · {cur.server} · {cur.calls.toLocaleString()} calls · err {cur.errRate}% · {cur.lastSeen}</div>
          <div className="kpi-label mt-3 mb-1">Tools available</div>
          {cur.tools.map(t => (
            <div key={t.name} className="card p-2.5 mb-1.5 flex items-center justify-between">
              <div><div className="mono text-[12.5px] text-[#0E1626]">{t.name} <span className="text-[#5B6B82]">{t.readWrite}</span></div>
                <div className="text-[11.5px] text-[#5B6B82]">risk {t.risk} · {t.access}</div></div>
              <Link className="text-[#2470D8] text-[12px]" to="/security">policy →</Link>
            </div>
          ))}
          <div className="flex flex-wrap gap-1.5 mt-2">
            <button className="btn !text-[12px]" onClick={() => notify(`Test call to ${cur.name}: OK (240ms)`)}>Test</button>
            <button className="btn !text-[12px]" onClick={() => setConnector(cur.id, 'connected')}>Connect</button>
            <button className="btn !text-[12px]" onClick={() => setConnector(cur.id, 'blocked')}>Revoke write</button>
            <button className="btn btn-danger !text-[12px]" onClick={() => setConnector(cur.id, 'disconnected')}>Disable</button>
          </div>
          <div className="text-[12px] text-[#5B6B82] mt-2">Permission change → <Link className="text-[#2470D8]" to="/security">Security</Link> + <Link className="text-[#2470D8]" to="/audit">Audit log</Link>.</div>
        </div>
      </div>
    </div>
  );
}
