export type ConfidenceLabel = 'High' | 'Medium' | 'Low';
export type MatchType = 'exact' | 'heuristic';

export interface Transaction {
  hash: string;
  from: string;
  to: string;
  valueWei: bigint;
  timestamp: number;
}

export interface VaspMatch {
  address: string;
  name: string;
  matchType: MatchType;
}

export interface TraceNode {
  id: string;
  address: string;
  kind: 'source' | 'wallet' | 'vasp';
  label: string;
  depth: number;
  vaspName?: string;
}

export interface TraceEdge {
  id: string;
  source: string;
  target: string;
  hash: string;
  valueWei: string;
}

export interface Candidate {
  name: string;
  address: string;
  confidence: number;
  label: ConfidenceLabel;
  valueShare: number;
  valueWei: string;
  hops: number;
  matchType: MatchType;
  scoreBreakdown: { hopScore: number; valueScore: number; matchScore: number };
}

export interface TraceResult {
  demo?: boolean;
  summary?: { text: string; source: 'ai' | 'template'; reason?: string };

  sourceAddress: string;
  nodes: TraceNode[];
  edges: TraceEdge[];
  candidates: Candidate[];
  hiddenTransactions: number;
  explanation: string;
  cached: boolean;
}


