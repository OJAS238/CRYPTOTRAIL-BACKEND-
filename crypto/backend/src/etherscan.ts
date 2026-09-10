import { config } from './config.js';
import type { Transaction } from './types.js';

type EtherscanRow = { hash: string; from: string; to: string; value: string; timeStamp: string; isError: string };

export async function getOutgoingTransactions(address: string): Promise<Transaction[]> {
  if (!config.etherscanApiKey || config.etherscanApiKey === 'replace_me') {
    throw new Error('ETHERSCAN_API_KEY is not configured. Add it to .env before tracing live addresses.');
  }
  const url = new URL('https://api.etherscan.io/v2/api');
  url.search = new URLSearchParams({ chainid: '1', module: 'account', action: 'txlist', address, startblock: '0', endblock: '99999999', sort: 'desc', apikey: config.etherscanApiKey }).toString();
  const response = await fetch(url);
  if (!response.ok) throw new Error(`Etherscan request failed (${response.status}).`);
  const payload = await response.json() as { status: string; message: string; result: EtherscanRow[] | string };
  if (!Array.isArray(payload.result)) {
    if (payload.message.toLowerCase().includes('no transactions')) return [];
    throw new Error(`Etherscan: ${typeof payload.result === 'string' ? payload.result : payload.message}`);
  }
  return payload.result
    .filter((tx) => tx.isError === '0' && tx.to && tx.from.toLowerCase() === address.toLowerCase())
    .map((tx) => ({ hash: tx.hash, from: tx.from, to: tx.to, valueWei: BigInt(tx.value), timestamp: Number(tx.timeStamp) }));
}

