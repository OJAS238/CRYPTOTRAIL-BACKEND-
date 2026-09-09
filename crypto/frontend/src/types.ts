export interface Candidate { name: string; address: string; confidence: number; label: 'High' | 'Medium' | 'Low'; valueShare: number; valueWei: string; hops: number; matchType: string; scoreBreakdown: { hopScore: number; valueScore: number; matchScore: number } }
export interface TraceNode { id: string; address: string; kind: 'source' | 'wallet' | 'vasp'; label: string; depth: number; vaspName?: string }
export interface TraceEdge { id: string; source: string; target: string; hash: string; valueWei: string }
export interface TraceResult { sourceAddress: string; nodes: TraceNode[]; edges: TraceEdge[]; candidates: Candidate[]; hiddenTransactions: number; explanation: string; cached: boolean }
