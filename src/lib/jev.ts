// JEV abstraction: mock today, real API later without UI changes.
export interface JEVInput { text: string; app?: string; team?: string; }
export interface JEVCandidate { modelId: string; modelName: string; estCost: number; estLatency: number; note: string; }
export interface JEVOutput {
  task: string; difficulty: 'Easy' | 'Medium' | 'Hard'; confidence: number;
  recommendation: string; candidates: JEVCandidate[]; reason: string;
  policy: string; budgetNote: string;
}
export interface JEVClient { analyze(input: JEVInput): Promise<JEVOutput>; }

const KEYWORDS_HARD = ['contract', 'clause', 'conflict', 'analyze', 'research', 'diagnos', 'legal', 'audit'];
const KEYWORDS_EASY = ['summariz', 'short email', 'feedback', 'translate', 'title', 'subject'];

export const mockJEV: JEVClient = {
  async analyze({ text, team }) {
    await new Promise(r => setTimeout(r, 450));
    const t = text.toLowerCase();
    const hard = KEYWORDS_HARD.some(k => t.includes(k));
    const easy = KEYWORDS_EASY.some(k => t.includes(k)) && !hard;
    const nearBudget = team === 'Research';
    if (hard && !nearBudget) return {
      task: t.includes('contract') ? 'Document reasoning' : 'Complex reasoning',
      difficulty: 'Hard', confidence: 0.92, recommendation: 'claude-sonnet',
      policy: 'Standard ✓', budgetNote: 'Budget OK ✓',
      candidates: [
        { modelId: 'claude-sonnet', modelName: 'Claude Sonnet 4', estCost: 0.018, estLatency: 3.1, note: 'quality 5/5 for hard reasoning' },
        { modelId: 'gpt-4o-mini', modelName: 'GPT-4o mini', estCost: 0.001, estLatency: 0.6, note: 'too weak for this difficulty' },
      ],
      reason: 'Hard reasoning + high confidence → strongest model justified. Fallback: GPT-4o mini.',
    };
    if (hard && nearBudget) return {
      task: 'Research QA', difficulty: 'Hard', confidence: 0.87, recommendation: 'gemini-flash',
      policy: 'Standard ✓', budgetNote: 'Team at 95% budget → prefer cheap ⚠',
      candidates: [
        { modelId: 'gemini-flash', modelName: 'Gemini 2.0 Flash', estCost: 0.004, estLatency: 1.5, note: 'budget-aware: capable + 5× cheaper' },
        { modelId: 'claude-sonnet', modelName: 'Claude Sonnet 4', estCost: 0.021, estLatency: 3.2, note: 'best quality but over budget' },
      ],
      reason: 'Resource state influenced routing: near budget limit → cheaper capable model.',
    };
    if (t.includes('ledger') || t.includes('finance')) return {
      task: 'Summarization', difficulty: 'Easy', confidence: 0.91, recommendation: 'llama-local',
      policy: 'Finance data → private only', budgetNote: 'Budget OK ✓',
      candidates: [{ modelId: 'llama-local', modelName: 'Llama 3.1 Private', estCost: 0.0004, estLatency: 0.9, note: 'only allowed for finance' }],
      reason: 'Policy overrides cost: finance data must stay on private model.',
    };
    return {
      task: easy ? 'Summarization' : 'General chat', difficulty: easy ? 'Easy' : 'Medium', confidence: 0.96, recommendation: 'gpt-4o-mini',
      policy: 'Standard ✓', budgetNote: 'Budget OK ✓',
      candidates: [
        { modelId: 'gpt-4o-mini', modelName: 'GPT-4o mini', estCost: 0.001, estLatency: 0.6, note: 'good enough, 94% cheaper' },
        { modelId: 'claude-sonnet', modelName: 'Claude Sonnet 4', estCost: 0.018, estLatency: 3.1, note: 'overkill for easy task' },
      ],
      reason: 'Easy task → cheapest sufficient model. Strong enough quality at lower cost.',
    };
  }
};

// To go live later: `export const jev: JEVClient = new HttpJEV(API_URL)` — same interface.
export const jev: JEVClient = mockJEV;
