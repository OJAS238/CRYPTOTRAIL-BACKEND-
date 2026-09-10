import { toCryptoTrail } from './cryptotrail.js';
import { multiHopDemo } from './demos.js';
import { addSummary } from './summary.js';
import cors from 'cors';
import express from 'express';
import { config } from './config.js';
import { getCachedTrace, putCachedTrace } from './db.js';
import { traceWallet } from './tracer.js';
import { normalizeAddress } from './validation.js';

const app = express();
app.use(cors());
app.use(express.json());

app.get('/api/health', (_request, response) => response.json({ status: 'ok' }));
app.post('/api/validate', (request, response) => {
  const address = normalizeAddress(request.body?.address);
  response.status(address ? 200 : 400).json(address ? { valid: true, address } : { valid: false, error: 'Enter a valid Ethereum address.' });
});
app.post('/api/demo/multihop', async (_request, response) => {
  try { return response.json(await addSummary(await multiHopDemo())); }
  catch { return response.status(500).json({ error: 'Demo could not be loaded.' }); }
});
app.post(['/api/trace', '/api/trace-wallet'], async (request, response) => {
  const address = normalizeAddress(request.body?.address);
  if (!address) return response.status(400).json({ error: 'Enter a valid Ethereum address.' });
  try {
    const cached = getCachedTrace(address);
    if (cached) return response.json(await addSummary({ ...cached, cached: true }));
    const result = await addSummary(await traceWallet(address));
    putCachedTrace(address, result);
    return response.json(result);
  } catch (error) {
    return response.status(502).json({ error: error instanceof Error ? error.message : 'Trace failed.' });
  }
});

// Adapter endpoint for the restored CryptoTrail interface. Legacy endpoints stay unchanged.
app.post(['/api/cryptotrail/trace', '/v2/trace/deterministic'], async (request, response) => {
  const started = performance.now();
  const chain = request.body?.chain ?? 'ethereum';
  if (typeof chain !== 'string' || chain.toLowerCase() !== 'ethereum') return response.status(400).json({ error: 'Only Ethereum tracing is currently supported.' });
  if (request.body?.max_depth_hops !== undefined && request.body.max_depth_hops !== 4) return response.status(400).json({ error: 'The supported depth limit is 4 hops.' });
  if (request.body?.peel_threshold !== undefined || request.body?.detectMixers === true || request.body?.resolve_exchange_tags === false) return response.status(400).json({ error: 'Custom peel thresholds, mixer detection and disabling exchange matching are not supported.' });
  if (request.body?.demo !== undefined && request.body.demo !== 'multihop') return response.status(400).json({ error: 'Unknown demo. Use multihop.' });
  try {
    if (request.body?.demo === 'multihop') return response.json(toCryptoTrail(await addSummary(await multiHopDemo()), performance.now() - started));
    const address = normalizeAddress(request.body?.address);
    if (!address) return response.status(400).json({ error: 'Enter a valid Ethereum wallet address. Transaction hashes are not supported.' });
    const cached = getCachedTrace(address);
    const result = await addSummary(cached ? { ...cached, cached: true } : await traceWallet(address));
    if (!cached) putCachedTrace(address, result);
    return response.json(toCryptoTrail(result, performance.now() - started));
  } catch (error) { return response.status(502).json({ error: error instanceof Error ? error.message : 'Trace failed.' }); }
});
app.listen(config.port, () => console.log(`API listening on http://localhost:${config.port}`));



