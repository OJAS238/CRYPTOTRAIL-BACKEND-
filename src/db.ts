import { existsSync, mkdirSync, readFileSync, writeFileSync, renameSync, rmSync } from 'node:fs';
import { randomUUID } from 'node:crypto';
import { dirname } from 'node:path';
import { config } from './config.js';
import type { TraceResult, VaspMatch } from './types.js';

type Store = { vasps: Record<string, { address: string; name: string; source: string; verifiedAt: string }>; traces: Record<string, TraceResult & { cachedAt?: number }> };
mkdirSync(dirname(config.databasePath), { recursive: true });
const load = (): Store => existsSync(config.databasePath) ? JSON.parse(readFileSync(config.databasePath, 'utf8')) as Store : { vasps: {}, traces: {} };
const save = (store: Store) => {
  const temporaryPath = `${config.databasePath}.${randomUUID()}.tmp`;
  try {
    writeFileSync(temporaryPath, JSON.stringify(store, null, 2));
    renameSync(temporaryPath, config.databasePath);
  } finally {
    rmSync(temporaryPath, { force: true });
  }
};

export function findVasp(address: string): VaspMatch | undefined {
  const row = load().vasps[address.toLowerCase()];
  return row && { ...row, matchType: 'exact' };
}

export function getCachedTrace(address: string): TraceResult | undefined {
  const result = load().traces[address.toLowerCase()];
  if (!result?.cachedAt || Date.now() - result.cachedAt >= 15 * 60 * 1000 || result.cachedAt > Date.now()) return undefined;
  return result;
}

export function putCachedTrace(address: string, result: TraceResult): void {
  if (result.truncated) return;
  const store = load(); store.traces[address.toLowerCase()] = { ...result, cachedAt: Date.now() }; save(store);
}

export function seedVasps(rows: Array<{ address: string; name: string; source: string }>): void {
  const store = load();
  store.traces = {};
  rows.forEach((row) => { store.vasps[row.address.toLowerCase()] = { ...row, verifiedAt: new Date().toISOString() }; });
  save(store);
}

export function replaceVasps(rows: Array<{ address: string; name: string; source: string }>): void {
  const store = load();
  store.vasps = {};
  store.traces = {};
  rows.forEach((row) => { store.vasps[row.address.toLowerCase()] = { ...row, verifiedAt: new Date().toISOString() }; });
  save(store);
}

