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
app.post('/api/trace', async (request, response) => {
  const address = normalizeAddress(request.body?.address);
  if (!address) return response.status(400).json({ error: 'Enter a valid Ethereum address.' });
  const cached = getCachedTrace(address);
  if (cached) return response.json({ ...cached, cached: true });
  try {
    const result = await traceWallet(address);
    putCachedTrace(address, result);
    return response.json(result);
  } catch (error) {
    return response.status(502).json({ error: error instanceof Error ? error.message : 'Trace failed.' });
  }
});

app.listen(config.port, () => console.log(`API listening on http://localhost:${config.port}`));

