# Automated VASP Wallet Attribution

An Ethereum-only investigative-lead prototype that traces outgoing transfers, matches known VASP addresses, ranks candidates, and presents an evidence-based visual result.

## Scope

This hackathon prototype uses Etherscan transaction history, a local SQLite VASP-label dataset, four-hop bounded tracing, transparent heuristic confidence scoring, and an optional LLM summary. Results are investigative leads only, not legal proof.

## Local development

1. Copy `.env.example` to `.env` and add an Etherscan API key.
2. Run `npm install`.
3. Import the supplied VASP dataset: `npm run import-dataset -- C:\\path\\to\\accounts.json`.
4. Run `npm run dev`.
5. Open `http://localhost:5173`.

If no Etherscan key is configured, the API returns an actionable configuration error. The dataset importer selects only its explicit centralized-exchange allowlist; it deliberately excludes labels such as `bybit-exploit` and `wazirx-exploit`, which are not evidence of VASP ownership. The default JSON store is created at `backend/data/vasp-store.json` when the backend runs.
