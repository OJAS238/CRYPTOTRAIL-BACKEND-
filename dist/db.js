import { existsSync, mkdirSync, readFileSync, writeFileSync, renameSync, rmSync } from 'node:fs';
import { randomUUID } from 'node:crypto';
import { dirname } from 'node:path';
import { config } from './config.js';
mkdirSync(dirname(config.databasePath), { recursive: true });
const load = () => existsSync(config.databasePath) ? JSON.parse(readFileSync(config.databasePath, 'utf8')) : { vasps: {}, traces: {} };
const save = (store) => {
    const temporaryPath = `${config.databasePath}.${randomUUID()}.tmp`;
    try {
        writeFileSync(temporaryPath, JSON.stringify(store, null, 2));
        renameSync(temporaryPath, config.databasePath);
    }
    finally {
        rmSync(temporaryPath, { force: true });
    }
};
export function findVasp(address) {
    const row = load().vasps[address.toLowerCase()];
    return row && { ...row, matchType: 'exact' };
}
export function getCachedTrace(address) {
    const result = load().traces[address.toLowerCase()];
    if (!result?.cachedAt || Date.now() - result.cachedAt >= 15 * 60 * 1000 || result.cachedAt > Date.now())
        return undefined;
    return result;
}
export function putCachedTrace(address, result) {
    if (result.truncated)
        return;
    const store = load();
    store.traces[address.toLowerCase()] = { ...result, cachedAt: Date.now() };
    save(store);
}
export function seedVasps(rows) {
    const store = load();
    store.traces = {};
    rows.forEach((row) => { store.vasps[row.address.toLowerCase()] = { ...row, verifiedAt: new Date().toISOString() }; });
    save(store);
}
export function replaceVasps(rows) {
    const store = load();
    store.vasps = {};
    store.traces = {};
    rows.forEach((row) => { store.vasps[row.address.toLowerCase()] = { ...row, verifiedAt: new Date().toISOString() }; });
    save(store);
}
