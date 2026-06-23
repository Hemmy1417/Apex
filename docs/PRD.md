# Apex — Product Requirements (PRD v0.1)

## Pitch
Climb a 6-floor tower an ape guards by typing what you do. An AI-validator panel — not a server —
judges every move and writes your fate on-chain. Stake to enter; reach the summit to win the pot.

## Problem / why it's interesting
Online games trust a central server to decide outcomes. Apex makes the **referee decentralized**:
the contract is the Game Master, and an AI-validator panel adjudicates free-text actions by
consensus. No server can rig it; the canonical state is on-chain.

## Why GenLayer (core decision)
Given the on-chain run state (floor, HP, inventory, recent events) and the player's free-text action,
the AI returns a structured verdict — `outcome`, `climb` (0/1), `hp_change`, `item`, `narrative` —
which the contract applies deterministically. The **judgement is the gameplay**. Pure-LLM, no web.

## Users
Anyone who wants a quick, replayable, provably-fair text adventure with real stakes.

## Economic model (stake + pot, insolvency-proof)
- `start_run` is payable: the stake joins a shared **pot**.
- Win (reach floor 6) → claim `2 × stake`, **capped at the pot**.
- Die → stake stays in the pot, funding future climbers.
- No central treasury, no insolvency (rewards can never exceed the pot).

## Anti-cheat
The AI narrates, but the **contract enforces hard caps**: ≤1 floor climbed per turn, HP bounded
(`hp_change` clamped to −60..+15), `FATAL` → death. Player action text is treated strictly as an
in-world attempt; the prompt and the deterministic clamps defeat prompt-injection ("I instantly win").

## Verdict JSON
```json
{ "outcome": "SUCCESS|PARTIAL|FAIL|FATAL", "climb": 0, "hp_change": 0, "item": "", "narrative": "..." }
```

## Methods
`start_run()` payable · `act(action)` · `claim()` · views `get_run(address)`, `get_stats`,
`get_leaderboard(n)`.

## MVP scope / out of scope
**In:** single-player run loop, stake pot + payout, leaderboard, views.
**Out:** multiplayer, NFT loot, persistent shared world, procedural map persistence beyond the log.

## Risks
LLM variance on outcomes (consensus + the equivalence principle bucket the structured fields);
player prompt-injection (mitigated as above); on a real testnet, write latency + RPC limits (handle
in the frontend as Delphi did: wait for ACCEPTED, retry reads).
