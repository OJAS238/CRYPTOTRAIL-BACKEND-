import { useState } from 'react';
import { ReactFlow, Background, Controls, MarkerType, type Edge, type Node } from '@xyflow/react';
import type { TraceResult } from './types';

const demoAddresses = [
  { address: '0xb5d85cbf7cb3ee0d56b3bb207d5fc4b82f43f511', label: 'Coinbase · direct path' },
  { address: '0x4523462420065fd01e883f713a22df0876747fd5', label: 'Bitget · direct path' }
];
const eth = (wei: string) => `${(Number(BigInt(wei)) / 1e18).toLocaleString(undefined, { maximumFractionDigits: 4 })} ETH`;

function graph(result: TraceResult): { nodes: Node[]; edges: Edge[] } {
  const byDepth = new Map<number, number>();
  const nodes = result.nodes.map((node) => {
    const row = byDepth.get(node.depth) ?? 0;
    byDepth.set(node.depth, row + 1);
    return { id: node.id, position: { x: node.depth * 240, y: row * 110 }, data: { label: node.label }, className: `flow-node ${node.kind}` };
  });
  return { nodes, edges: result.edges.map((edge) => ({ id: edge.id, source: edge.source, target: edge.target, label: eth(edge.valueWei), markerEnd: { type: MarkerType.ArrowClosed } })) };
}

export default function App() {
  const [address, setAddress] = useState('');
  const [result, setResult] = useState<TraceResult>();
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const submit = async (value = address) => {
    setAddress(value); setError(''); setResult(undefined); setLoading(true);
    try {
      const response = await fetch('/api/trace', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ address: value }) });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error ?? 'Unable to trace this wallet.');
      setResult(data);
    } catch (err) { setError(err instanceof Error ? err.message : 'Unable to trace this wallet.'); }
    finally { setLoading(false); }
  };
  const flow = result ? graph(result) : undefined;
  return <main>
    <header><p className="eyebrow">Investigative lead-generation tool</p><h1>VASP Wallet Attribution</h1><p>Trace outgoing Ethereum fund flows to known exchange addresses.</p></header>
    <section className="search"><label htmlFor="wallet">Ethereum wallet address</label><div className="search-row"><input id="wallet" value={address} onChange={(e) => setAddress(e.target.value)} placeholder="0x…" /><button disabled={loading} onClick={() => submit()}>{loading ? 'Tracing…' : 'Trace wallet'}</button></div><div className="samples">Verified demo: {demoAddresses.map((demo) => <button key={demo.address} onClick={() => submit(demo.address)}>{demo.label}</button>)}</div></section>
    {error && <section className="message error">{error}</section>}
    {!result && !loading && !error && <section className="message">Enter an address or select a verified demo address to begin.</section>}
    {result && <><section className="summary"><div><p className="eyebrow">Trace result {result.cached ? '· cached' : ''}</p><h2>{result.candidates[0] ? `Nearest known VASP: ${result.candidates[0].name}` : 'No known VASP found'}</h2><p>{result.explanation}</p></div></section>
      {result.candidates.length > 0 && <section><h2>Ranked candidates</h2><div className="cards">{result.candidates.map((candidate) => <article className="card" key={candidate.address}><span className={`badge ${candidate.label.toLowerCase()}`}>{candidate.label} confidence</span><h3>{candidate.name}</h3><strong>{candidate.confidence}/100</strong><p>{candidate.hops} hop(s) · {(candidate.valueShare * 100).toFixed(1)}% of traced source value</p><small>Score: {candidate.scoreBreakdown.hopScore} hop + {candidate.scoreBreakdown.valueScore} value + {candidate.scoreBreakdown.matchScore} exact match</small></article>)}</div></section>}
      <section><div className="graph-title"><h2>Fund-flow graph</h2><span><i className="source-dot" /> source <i className="wallet-dot" /> wallet <i className="vasp-dot" /> VASP</span></div><div className="graph">{flow && <ReactFlow nodes={flow.nodes} edges={flow.edges} fitView><Background /><Controls /></ReactFlow>}</div>{result.hiddenTransactions > 0 && <p className="muted">{result.hiddenTransactions} smaller or excess transactions hidden by trace limits.</p>}</section></>}
    <footer>Results are investigative leads only. Final attribution requires independent verification and the VASP’s KYC/AML records.</footer>
  </main>;
}
