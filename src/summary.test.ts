import { afterEach, expect, it, vi } from 'vitest';
import { addSummary } from './summary.js';
import { multiHopDemo } from './demos.js';
afterEach(() => { vi.unstubAllEnvs(); vi.unstubAllGlobals(); });
it('labels the unconfigured fallback honestly', async () => {
  vi.stubEnv('GROQ_API_KEY', '');
  const result = await addSummary(await multiHopDemo());
  expect(result.summary?.source).toBe('template');
  expect(result.summary?.text).toContain('illustrative');
});
it('extracts an AI response and falls back on provider failure', async () => {
  vi.stubEnv('GROQ_API_KEY', 'test'); vi.stubEnv('GROQ_MODEL', 'test');
  const fetcher = vi.fn().mockResolvedValue({ ok: true, json: async () => ({ choices: [{ finish_reason: 'stop', message: { content: 'An illustrative two-hop lead.' } }] }) });
  vi.stubGlobal('fetch', fetcher);
  expect((await addSummary(await multiHopDemo())).summary?.source).toBe('ai');
  expect(fetcher.mock.calls[0][0]).toBe('https://api.groq.com/openai/v1/chat/completions');
  fetcher.mockRejectedValue(new Error('offline'));
  expect((await addSummary(await multiHopDemo())).summary?.source).toBe('template');
});

it('includes source, hop graph, addresses and scoring evidence in the LLM input', async () => {
  vi.stubEnv('GROQ_API_KEY', 'test'); vi.stubEnv('GROQ_MODEL', 'test');
  const fetcher = vi.fn().mockResolvedValue({ ok: true, json: async () => ({ choices: [{ finish_reason: 'stop', message: { content: 'A two-transfer illustrative trace.' } }] }) });
  vi.stubGlobal('fetch', fetcher);
  const original = await multiHopDemo();
  const result = await addSummary(original);
  const body = JSON.parse(fetcher.mock.calls[0][1].body);
  const input = JSON.parse(body.messages[1].content);
  expect(input.sourceAddress).toBe(original.sourceAddress);
  expect(input.nodes).toEqual(original.nodes);
  expect(input.edges).toEqual(original.edges);
  expect(input.candidates).toEqual(original.candidates);
  expect(result.explanation).toBe('A two-transfer illustrative trace.');
  expect(result.summary?.text).toBe(result.explanation);
});

it.each(['timeout', 'http', 'malformed', 'incomplete'])('preserves trace data on %s failure', async failure => {
  vi.stubEnv('GROQ_API_KEY', 'test'); vi.stubEnv('GROQ_MODEL', 'test');
  const fetcher = vi.fn();
  if (failure === 'timeout') fetcher.mockRejectedValue(new DOMException('Timed out', 'TimeoutError'));
  else if (failure === 'http') fetcher.mockResolvedValue({ ok: false });
  else if (failure === 'malformed') fetcher.mockResolvedValue({ ok: true, json: async () => { throw new Error('bad JSON'); } });
  else fetcher.mockResolvedValue({ ok: true, json: async () => ({ choices: [{ finish_reason: 'length', message: { content: 'Partial text' } }] }) });
  vi.stubGlobal('fetch', fetcher);
  const original = await multiHopDemo();
  const result = await addSummary(original);
  expect(result.explanation).toBe('Summary unavailable');
  expect(result.nodes).toEqual(original.nodes);
  expect(result.edges).toEqual(original.edges);
  expect(result.candidates).toEqual(original.candidates);
});

