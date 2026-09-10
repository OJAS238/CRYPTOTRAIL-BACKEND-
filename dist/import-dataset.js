import { readFileSync } from 'node:fs';
import { replaceVasps } from './db.js';
import { normalizeAddress } from './validation.js';
const VASP_LABELS = {
    'bilaxy': 'Bilaxy', 'binance-charity': 'Binance', 'bitfinex': 'Bitfinex', 'bitget': 'Bitget',
    'bitstamp': 'Bitstamp', 'bittrex': 'Bittrex', 'coinbase': 'Coinbase', 'coinbit': 'Coinbit',
    'coinex': 'CoinEx', 'coinone': 'Coinone', 'crypto-com': 'Crypto.com', 'deribit': 'Deribit',
    'fairdesk': 'Fairdesk', 'fiat-gateway': 'Fiat Gateway', 'gate-io': 'Gate.io', 'gemini': 'Gemini',
    'kraken': 'Kraken', 'kucoin': 'KuCoin', 'mexc': 'MEXC', 'nexo': 'Nexo', 'okx': 'OKX', 'upbit': 'Upbit'
};
const datasetPath = process.argv[2];
if (!datasetPath)
    throw new Error('Usage: npm run import-dataset -- <path-to-accounts.json>');
const records = JSON.parse(readFileSync(datasetPath, 'utf8'));
if (!Array.isArray(records))
    throw new Error('Dataset must be a JSON array.');
const unique = new Map();
let skipped = 0;
for (const record of records) {
    const label = typeof record.label === 'string' ? record.label.toLowerCase() : '';
    if (record.chainId !== 1 || !VASP_LABELS[label]) {
        skipped++;
        continue;
    }
    const address = normalizeAddress(record.address);
    if (!address) {
        skipped++;
        continue;
    }
    unique.set(address.toLowerCase(), { address, name: VASP_LABELS[label], source: `accounts.json:${label}` });
}
replaceVasps([...unique.values()]);
console.log(JSON.stringify({ imported: unique.size, skipped, labels: Object.keys(VASP_LABELS) }, null, 2));
