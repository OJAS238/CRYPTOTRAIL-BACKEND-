import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname } from 'node:path';
import { config } from './config.js';
import type { TraceResult, VaspMatch } from './types.js';

type Store = { vasps: Record<string, { address: string; name: string; source: string; verifiedAt: string }>; traces: Record<string, TraceResult> };
mkdirSync(dirname(config.databasePath), { recursive: true });
const load = (): Store => existsSync(config.databasePath) ? JSON.parse(readFileSync(config.databasePath, 'utf8')) as Store : { vasps: {}, traces: {} };
const save = (store: Store) => writeFileSync(config.databasePath, JSON.stringify(store, null, 2));

export function findVasp(address: string): VaspMatch | undefined {
  const row = load().vasps[address.toLowerCase()];
  return row && { ...row, matchType: 'exact' };
}

export function getCachedTrace(address: string): TraceResult | undefined {
  return load().traces[address.toLowerCase()];
}

export function putCachedTrace(address: string, result: TraceResult): void {
  const store = load(); store.traces[address.toLowerCase()] = result; save(store);
}

export function seedVasps(rows: Array<{ address: string; name: string; source: string }>): void {
  const store = load();
  rows.forEach((row) => { store.vasps[row.address.toLowerCase()] = { ...row, verifiedAt: new Date().toISOString() }; });
  save(store);
}

export function replaceVasps(rows: Array<{ address: string; name: string; source: string }>): void {
  const store = load();
  store.vasps = {};
  rows.forEach((row) => { store.vasps[row.address.toLowerCase()] = { ...row, verifiedAt: new Date().toISOString() }; });
  save(store);
}
