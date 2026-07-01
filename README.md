# Apex — an AI-adjudicated tower climb on GenLayer

> Stake GEN, then type your way up a 6-floor tower an ape guards. An AI-validator panel — not a
> server — decides what happens on every move and writes your fate on-chain.

**Status:** **Live on Studionet** · Contract `0x08CeEd3e1C88D7666D08828a8d4212e3244A80f6`

## Why GenLayer (the whole point)
There's no central game server deciding outcomes. The player types a free-text action; an
**AI-validator panel adjudicates it by consensus**, and the canonical game state (floor, HP,
inventory, story) lives on-chain. The AI judgement *is* the gameplay — the strongest possible
"why GenLayer." It's pure-LLM (no web fetch), so there's no fragile data source to break.

## How it works
1. **Enter** — `start_run` (payable): stake GEN to begin at floor 1 with full HP. Your stake joins
   the shared **pot**.
2. **Climb** — `act("grab the loose girder and swing up")`: the AI Game Master narrates the outcome
   and returns a structured verdict; the contract applies it (HP, climb a floor, find an item, or die).
3. **Summit or fall** — reach floor 6 → **WON**; HP hits 0 → **DEAD**.
4. **Claim** — a winner claims **2× their stake, capped at the pot**. A death leaves your stake in
   the pot, funding the next climber.

**The contract holds the line:** the AI narrates, but hard caps (one floor per turn, bounded HP, no
instant-win) are enforced deterministically — so no player can prompt-inject their way to the top.

## Tech stack
- **Intelligent Contract:** Python + GenVM — the Game Master, run state, stake pot, payouts.
- **Frontend:** Next.js 16 + GenLayerJS + viem; injected-wallet only (EIP-6963).
- **Backend:** none.

## Repo layout
```
docs/        PRD.md
contracts/   apex.py      (the Intelligent Contract — the Game Master)
web/         frontend     (Next.js + Tailwind + SpaceX-inspired design)
```

_Sibling projects:_ [Credence](https://github.com/Hemmy1417/Credence) (identity) ·
[Aegis](https://github.com/Hemmy1417/Aegis) (AI escrow) ·
[Delphi](https://github.com/Hemmy1417/Delphi) (AI prediction markets).
