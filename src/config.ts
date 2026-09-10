import dotenv from 'dotenv';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

// The backend is executed from backend/, while the shared secrets file lives at the repository root.
dotenv.config({ path: resolve(dirname(fileURLToPath(import.meta.url)), '../../.env') });

export const config = {
  port: Number(process.env.PORT ?? 3001),
  etherscanApiKey: process.env.ETHERSCAN_API_KEY ?? '',
  databasePath: process.env.VASP_DB_PATH ?? resolve(dirname(fileURLToPath(import.meta.url)), '../data/vasp-store.json'),
  maxDepth: 4,
  maxTransactionsPerWallet: 12,
  minValueWei: 1_000_000_000_000_000n
};

