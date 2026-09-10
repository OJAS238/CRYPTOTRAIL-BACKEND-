# Automated VASP Wallet Attribution

An Ethereum-only investigative-lead prototype that traces outgoing transfers, matches known VASP addresses, ranks candidates, and presents an evidence-based visual result.

## Scope

This hackathon prototype uses Etherscan transaction history, a local JSON VASP-label dataset, four-hop bounded tracing, transparent heuristic confidence scoring, and an optional LLM summary. Results are investigative leads only, not legal proof.

## Local development

1. Copy `.env.example` to `.env` and add an Etherscan API key.
2. Run `npm install`.
3. Import the supplied VASP dataset: `npm run import-dataset -- C:\\path\\to\\accounts.json`.
4. Run `npm run dev`.
5. Open `http://localhost:5173`.

If no Etherscan key is configured, the API returns an actionable configuration error. The dataset importer selects only its explicit centralized-exchange allowlist; it deliberately excludes labels such as `bybit-exploit` and `wazirx-exploit`, which are not evidence of VASP ownership. The default JSON store is created at `backend/data/vasp-store.json` when the backend runs.

## Backend reliability notes

Trace cache entries expire after 15 minutes and are invalidated when VASP labels are seeded or replaced. Legacy cache entries without timestamps are ignored. Store updates use a temporary file and rename; run only one backend process against a store to avoid concurrent writers losing updates.

Downstream candidate amounts use a proportional allocation bounded by the incoming path amount. This is a heuristic, not proof that the same funds moved. Only transfers strictly later than the incoming transfer are followed; same-second transfers are excluded because transaction ordering is unavailable. Each wallet is expanded once, so converging paths can be undercounted. Scores are heuristic rankings, not probabilities. Etherscan requests time out after 15 seconds.

## Final demo

The third demo button runs the real tracing algorithm over an illustrative two-transfer fixture: source sends 2 ETH to an intermediate wallet, which sends 1.8 ETH to Demo Exchange. Expected result: two hops, 90% estimated share, 86/100 heuristic score. It uses `/api/demo/multihop`, requires no Etherscan connection or seeding, and is not a verified on-chain claim. Existing direct demo buttons still use the seeded cache.

Optional AI summaries use the Groq Chat Completions API. Set `GROQ_API_KEY` and `GROQ_MODEL` to a Groq model available in your account, then restart the backend. Selected candidate data is sent server-side to Groq; the key never goes to the browser. Without configuration or on provider failure, the UI shows a clearly labelled rule-based Trace Summary instead of claiming it is AI-generated. The old LLM_API_KEY / LLM_API_URL placeholders are unused. Documentation: https://console.groq.com/docs/text-chat

POST /api/trace-wallet is an alias of /api/trace and accepts { address }. generateExplanation(traceResult) sends the source address, nodes, edges and candidate scoring evidence to the configured model. Both endpoints return explanation as an AI-generated string, or Summary unavailable on missing configuration, provider failure or a 12-second timeout. The existing summary metadata supplies an honestly labelled rule-based UI fallback.


GROQ_MODEL defaults to openai/gpt-oss-20b when omitted. OPENAI_API_KEY is no longer used. Set GROQ_API_KEY in .env and restart npm run dev.



## Restored CryptoTrail frontend adapter

POST http://localhost:3001/api/cryptotrail/trace (alias /v2/trace/deterministic) with {"address":"0x...","chain":"Ethereum"}; for the fixture use {"demo":"multihop","chain":"Ethereum"}. It returns queryAddress, confidenceScore, totalHops, attributionExchange, nodes, explanation and summary. Full evidence is retained in rawTrace. The node list is one connected path to the top candidate, not all branches flattened into a false path. avgLatencyMs is total request duration, not RPC latency. receivingHotWallet is the matched address, not an assertion about wallet role.

Frontend files were left unchanged. NewTraceView still calls buildDetailedTrace and App still generates mock history. These calls must be replaced with asynchronous requests to this endpoint for integration to be complete. Nullable unavailable fields (USD, risk, verification, block/gas/time) require N/A formatting, not numeric toFixed/toLocaleString calls. The original UI also needs to treat confidence as a score and mixer status as unassessed. Keep existing layout and CSS during this data-binding work. No invented telemetry is supplied to satisfy the mock schema.

Run backend separately: cd C:\Users\Lenovo\OneDrive\Documents\codex then npm run dev -w backend. Run frontend separately in C:\Users\Lenovo\Downloads\cryptotrail with npm run dev. The frontend does not connect automatically until its mock calls are replaced; backend CORS already permits local frontend requests.
