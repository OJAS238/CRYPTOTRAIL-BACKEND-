import { seedVasps } from './db.js';

// Illustrative seed records. Replace with a verified curated dataset before operational use.
seedVasps([
  { address: '0x0000000000000000000000000000000000000001', name: 'Demo Exchange Alpha', source: 'illustrative seed' },
  { address: '0x0000000000000000000000000000000000000002', name: 'Demo Exchange Beta', source: 'illustrative seed' }
]);
console.log('VASP dataset seeded.');

