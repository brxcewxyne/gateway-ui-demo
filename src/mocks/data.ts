// Central mock data. Swap with API later; shapes are UI-stable.
export type ModelStatus = 'healthy' | 'degraded' | 'down' | 'disabled';
export interface AIModel {
  id: string; name: string; provider: string;
  costPer1M: number; p50: number; p95: number;
  requests: number; tokensM: number;
  capabilities: string[]; health: number;
  status: ModelStatus; fallbackPriority: number;
  allowedTeams: string[]; quality: number; // 1-5
}
export interface Team { id: string; name: string; budget: number; spent: number; quotaTokensM: number; usedTokensM: number; reqLimit: number; reqUsed: number; throttleAt: number; }
export interface Connector { id: string; name: string; kind: string; server: string; status: 'connected' | 'degraded' | 'blocked' | 'disconnected'; tools: { name: string; risk: 'low'|'medium'|'high'; access: 'allow'|'approval'|'blocked'; readWrite: 'R'|'W'|'RW' }[]; calls: number; errRate: number; lastSeen: string; }
export interface TraceStep { label: string; detail: string; state: 'ok'|'warn'|'block'|'info'; }
export interface Trace { id: string; app: string; team: string; input: string; task: string; difficulty: 'Easy'|'Medium'|'Hard'; confidence: number; policy: string; policyPass: boolean; budgetPass: boolean; candidates: { model: string; cost: number; lat: number; score: string }[]; selected: string; reason: string; cost: number; latency: number; decision: 'allow'|'blocked'|'fallback'; tool?: string; time: string; }
export interface Policy { id: string; name: string; scope: string; rule: string; effect: string; }
export interface Approval { id: string; tool: string; app: string; risk: 'high'|'medium'; detail: string; status: 'pending'|'approved'|'denied'; time: string; }

export const MODELS: AIModel[] = [
  { id: 'gpt-4o-mini', name: 'GPT-4o mini', provider: 'OpenAI', costPer1M: 0.6, p50: 0.6, p95: 1.2, requests: 18240, tokensM: 148, capabilities: ['chat','summarization','680M ctx'], health: 99.9, status: 'healthy', fallbackPriority: 2, allowedTeams: ['all'], quality: 3 },
  { id: 'claude-sonnet', name: 'Claude Sonnet 4', provider: 'Anthropic', costPer1M: 9.0, p50: 1.8, p95: 3.1, requests: 9410, tokensM: 122, capabilities: ['reasoning','long-ctx','contracts'], health: 99.9, status: 'healthy', fallbackPriority: 1, allowedTeams: ['all'], quality: 5 },
  { id: 'gemini-flash', name: 'Gemini 2.0 Flash', provider: 'Google', costPer1M: 0.8, p50: 0.7, p95: 1.5, requests: 12180, tokensM: 96, capabilities: ['multimodal','fast','search-grounded'], health: 99.2, status: 'healthy', fallbackPriority: 3, allowedTeams: ['all'], quality: 4 },
  { id: 'llama-local', name: 'Llama 3.1 Private', provider: 'Private VPC', costPer1M: 0.2, p50: 0.9, p95: 2.0, requests: 8210, tokensM: 46, capabilities: ['private','pii-safe','finance-only'], health: 98.4, status: 'degraded', fallbackPriority: 4, allowedTeams: ['finance'], quality: 3 },
];

export const TEAMS: Team[] = [
  { id: 'ai-platform', name: 'AI Team A', budget: 1000, spent: 800, quotaTokensM: 200, usedTokensM: 164, reqLimit: 100000, reqUsed: 78200, throttleAt: 80 },
  { id: 'marketing', name: 'Marketing AI', budget: 500, spent: 400, quotaTokensM: 80, usedTokensM: 52, reqLimit: 40000, reqUsed: 21400, throttleAt: 80 },
  { id: 'research', name: 'Research', budget: 1000, spent: 950, quotaTokensM: 150, usedTokensM: 141, reqLimit: 60000, reqUsed: 55800, throttleAt: 85 },
  { id: 'finance', name: 'Finance', budget: 2000, spent: 610, quotaTokensM: 120, usedTokensM: 44, reqLimit: 50000, reqUsed: 18200, throttleAt: 90 },
];

export const CONNECTORS: Connector[] = [
  { id: 'drive', name: 'Google Drive', kind: 'Files', server: 'mcp-drive-01', status: 'connected', calls: 8420, errRate: 0.2, lastSeen: '12s ago', tools: [{name:'drive.read',risk:'low',access:'allow',readWrite:'R'},{name:'drive.write',risk:'medium',access:'approval',readWrite:'W'}] },
  { id: 'slack', name: 'Slack', kind: 'Comms', server: 'mcp-slack-01', status: 'connected', calls: 6210, errRate: 0.1, lastSeen: '8s ago', tools: [{name:'slack.post',risk:'medium',access:'allow',readWrite:'W'},{name:'slack.read',risk:'low',access:'allow',readWrite:'R'}] },
  { id: 'sfdc', name: 'Salesforce', kind: 'CRM', server: 'mcp-crm-01', status: 'degraded', calls: 2140, errRate: 2.8, lastSeen: '44s ago', tools: [{name:'customer.read',risk:'low',access:'allow',readWrite:'R'},{name:'customer.delete',risk:'high',access:'approval',readWrite:'W'}] },
  { id: 'pg', name: 'PostgreSQL', kind: 'Database', server: 'mcp-pg-01', status: 'connected', calls: 12880, errRate: 0.05, lastSeen: '5s ago', tools: [{name:'sql.select',risk:'low',access:'allow',readWrite:'R'},{name:'sql.write',risk:'high',access:'blocked',readWrite:'W'}] },
  { id: 'api', name: 'Internal API', kind: 'API', server: 'mcp-api-01', status: 'blocked', calls: 310, errRate: 0, lastSeen: '12m ago', tools: [{name:'billing.refund',risk:'high',access:'blocked',readWrite:'W'}] },
  { id: 'mcp-ops', name: 'Ops MCP Server', kind: 'MCP', server: 'mcp-ops-01', status: 'disconnected', calls: 0, errRate: 0, lastSeen: '2h ago', tools: [{name:'deploy.trigger',risk:'high',access:'blocked',readWrite:'W'}] },
];

export const TRACES: Trace[] = [
  { id: '2841', app: 'billing-api', team: 'AI Team A', input: 'Analyze these contracts and detect conflicting clauses', task: 'Document reasoning', difficulty: 'Hard', confidence: 0.93, policy: 'Standard', policyPass: true, budgetPass: true, candidates: [{model:'Claude Sonnet 4',cost:0.018,lat:3.1,score:'quality 5/5, fits hard reasoning'},{model:'GPT-4o mini',cost:0.001,lat:0.6,score:'too weak for contracts'}], selected: 'Claude Sonnet 4', reason: 'Hard reasoning + high confidence → quality outweighs cost. Fallback: GPT-4o mini.', cost: 0.018, latency: 3.1, decision: 'allow', time: '12:01:22' },
  { id: '2840', app: 'support-bot', team: 'Marketing AI', input: 'Summarize customer feedback (200 words)', task: 'Summarization', difficulty: 'Easy', confidence: 0.97, policy: 'Standard', policyPass: true, budgetPass: true, candidates: [{model:'GPT-4o mini',cost:0.001,lat:0.6,score:'good enough, 94% cheaper'},{model:'Claude Sonnet 4',cost:0.018,lat:3.1,score:'overkill'}], selected: 'GPT-4o mini', reason: 'Easy summarization → cheapest model with sufficient quality. Saved $0.017.', cost: 0.001, latency: 0.6, decision: 'allow', time: '12:01:04' },
  { id: '2839', app: 'finance-etl', team: 'Finance', input: 'Summarize Q3 ledger via external model', task: 'Summarization', difficulty: 'Easy', confidence: 0.91, policy: 'Finance data → private only', policyPass: false, budgetPass: true, candidates: [{model:'Llama 3.1 Private',cost:0.0004,lat:0.9,score:'only allowed for finance'}], selected: '— blocked —', reason: 'Policy blocked external model for finance data. Reroute to Llama Private required.', cost: 0, latency: 0, decision: 'blocked', tool: 'ledger.read', time: '12:00:47' },
  { id: '2838', app: 'research-agent', team: 'Research', input: 'Cross-document QA over 40 papers', task: 'Research QA', difficulty: 'Hard', confidence: 0.88, policy: 'Standard', policyPass: true, budgetPass: false, candidates: [{model:'Gemini 2.0 Flash',cost:0.004,lat:1.5,score:'budget-aware pick: team at 95% budget'},{model:'Claude Sonnet 4',cost:0.021,lat:3.2,score:'best quality but over budget'}], selected: 'Gemini 2.0 Flash (fallback from Claude)', reason: 'Team Research at 95% budget → gateway preferred cheaper capable model.', cost: 0.004, latency: 1.5, decision: 'fallback', time: '12:00:12' },
];

export const POLICIES: Policy[] = [
  { id: 'p1', name: 'Finance data → private only', scope: 'team=finance, data=ledger/*', rule: 'IF finance.* THEN model=llama-local ONLY', effect: 'Block external models' },
  { id: 'p2', name: 'customer.delete needs approval', scope: 'tool=customer.delete', rule: 'IF tool risk=high THEN require approval', effect: 'Queue approval' },
  { id: 'p3', name: 'Research budget guardrail', scope: 'team=research', rule: 'IF budget>90% THEN prefer cost<$1/1M', effect: 'Reroute to cheap' },
  { id: 'p4', name: 'PII → no external training', scope: 'data=pii', rule: 'IF pii detected THEN block external + log', effect: 'Block + audit' },
];

export const APPROVALS: Approval[] = [
  { id: 'A12', tool: 'customer.delete', app: 'billing-api', risk: 'high', detail: 'Delete customer C-8812 requested by agent', status: 'pending', time: '11:58' },
  { id: 'A11', tool: 'drive.write', app: 'support-bot', risk: 'medium', detail: 'Write summary to shared folder', status: 'pending', time: '11:52' },
  { id: 'A10', tool: 'sql.write', app: 'research-agent', risk: 'high', detail: 'Bulk update experiment table', status: 'pending', time: '11:40' },
];

export const COST_SERIES = [
  { d: 'Mon', gpt: 180, claude: 320, gemini: 140, local: 20 },
  { d: 'Tue', gpt: 210, claude: 380, gemini: 160, local: 24 },
  { d: 'Wed', gpt: 190, claude: 410, gemini: 150, local: 22 },
  { d: 'Thu', gpt: 260, claude: 350, gemini: 190, local: 30 },
  { d: 'Fri', gpt: 300, claude: 390, gemini: 210, local: 34 },
  { d: 'Sat', gpt: 140, claude: 180, gemini: 110, local: 14 },
  { d: 'Sun', gpt: 160, claude: 220, gemini: 120, local: 16 },
];

export const LIVE_FEED = [
  { id: '2841', text: '#2841 Claude $0.018 ✓', kind: 'ok' },
  { id: '2840', text: '#2840 GPT-4o-mini $0.001 ✓', kind: 'ok' },
  { id: '2839', text: '#2839 BLOCKED finance→external ✕', kind: 'block' },
  { id: '2838', text: '#2838 fallback Claude→Gemini ↪', kind: 'warn' },
];
