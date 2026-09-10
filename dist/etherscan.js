import { config } from './config.js';
export async function getOutgoingTransactions(address) {
    if (!config.etherscanApiKey || config.etherscanApiKey === 'replace_me') {
        throw new Error('ETHERSCAN_API_KEY is not configured. Add it to .env before tracing live addresses.');
    }
    const url = new URL('https://api.etherscan.io/v2/api');
    url.search = new URLSearchParams({ chainid: '1', module: 'account', action: 'txlist', address, startblock: '0', endblock: '99999999', sort: 'desc', apikey: config.etherscanApiKey }).toString();
    let response;
    try {
        response = await fetch(url, { signal: AbortSignal.timeout(15_000) });
    }
    catch (error) {
        const failure = error;
        const code = failure.cause?.code;
        if (failure.name === 'TimeoutError' || code === 'UND_ERR_CONNECT_TIMEOUT') {
            throw new Error('Etherscan timed out. Please try again shortly.');
        }
        if (code === 'EACCES' || code === 'EPERM') {
            throw new Error('The backend is blocked from accessing Etherscan. Allow Node.js network access and restart npm run dev in your terminal.');
        }
        throw new Error('Cannot connect to Etherscan. Check your internet connection, VPN or proxy, then try again.');
    }
    if (!response.ok)
        throw new Error(`Etherscan request failed (${response.status}).`);
    const payload = await response.json();
    if (!Array.isArray(payload.result)) {
        if (typeof payload.message === 'string' && payload.message.toLowerCase().includes('no transactions'))
            return [];
        throw new Error(`Etherscan: ${typeof payload.result === 'string' ? payload.result : payload.message}`);
    }
    return payload.result
        .filter((tx) => tx.isError === '0' && tx.to && tx.from.toLowerCase() === address.toLowerCase())
        .map((tx) => ({ hash: tx.hash, from: tx.from, to: tx.to, valueWei: BigInt(tx.value), timestamp: Number(tx.timeStamp) }));
}
