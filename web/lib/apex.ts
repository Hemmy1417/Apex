"use client";

import { createClient, createAccount, generatePrivateKey } from "genlayer-js";
import { CONTRACT_ADDRESS, CHAIN } from "./config";

export type LastVerdict = {
  outcome: "SUCCESS" | "PARTIAL" | "FAIL" | "FATAL";
  hp_change: number;
  climb: number;
  item: string;
  narrative: string;
};

export type Run = {
  player: string;
  stake: string;
  floor: number;
  hp: number;
  max_hp: number;
  inventory: string[];
  log: string[];
  state: "ALIVE" | "WON" | "DEAD";
  claimed: boolean;
  turns: number;
  seq: number;
  last?: LastVerdict;
};

export type Stats = {
  total_runs: number;
  total_wins: number;
  pot: string;
  top_floor: number;
};

export type LeaderboardEntry = {
  player: string;
  best_floor: number;
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Client = any;

let _read: Client = null;
function readClient(): Client {
  if (!_read) {
    _read = createClient({ chain: CHAIN, account: createAccount(generatePrivateKey()) });
  }
  return _read;
}

function asString(v: unknown): string {
  return typeof v === "string" ? v : v == null ? "" : String(v);
}

async function read(functionName: string, args: unknown[] = []): Promise<string> {
  let lastErr: unknown;
  for (let i = 0; i < 4; i++) {
    try {
      const raw = await readClient().readContract({ address: CONTRACT_ADDRESS, functionName, args });
      return asString(raw);
    } catch (e) {
      lastErr = e;
      const msg = e instanceof Error ? e.message : String(e);
      if (i < 3 && /rate limit|429|too many|temporarily/i.test(msg)) {
        await new Promise((r) => setTimeout(r, 700 * (i + 1)));
        continue;
      }
      throw e;
    }
  }
  throw lastErr;
}

// Studionet: wait for FINALIZED (instant). Bradbury: wait for ACCEPTED (seconds, not minutes).
async function writeAndWait(client: Client, functionName: string, args: unknown[], value?: bigint) {
  const params: Record<string, unknown> = { address: CONTRACT_ADDRESS, functionName, args };
  if (value !== undefined) params.value = value;
  const hash = await client.writeContract(params);
  await client.waitForTransactionReceipt({ hash, status: "ACCEPTED", interval: 4000, retries: 45 });
  return asString(hash);
}

// ---- reads ----
export async function getStats(): Promise<Stats> {
  const raw = await read("get_stats");
  return raw ? JSON.parse(raw) : { total_runs: 0, total_wins: 0, pot: "0", top_floor: 6 };
}

export async function getRun(address: string): Promise<Run | null> {
  const raw = await read("get_run", [address]);
  return raw ? (JSON.parse(raw) as Run) : null;
}

export async function getLeaderboard(n = 20): Promise<LeaderboardEntry[]> {
  const raw = await read("get_leaderboard", [n]);
  return raw ? JSON.parse(raw) : [];
}

// ---- writes ----
export async function startRun(client: Client, stakeWei: bigint): Promise<string> {
  return writeAndWait(client, "start_run", [], stakeWei);
}

export async function act(client: Client, action: string): Promise<string> {
  return writeAndWait(client, "act", [action]);
}

export async function claim(client: Client): Promise<string> {
  return writeAndWait(client, "claim", []);
}

// ---- helpers ----
export function genFromWei(wei: string | bigint): string {
  const n = Number(BigInt(wei || "0")) / 1e18;
  return n === 0 ? "0" : n.toLocaleString(undefined, { maximumFractionDigits: 4 });
}

export function genToWei(gen: string): bigint {
  const n = Number(gen);
  if (!isFinite(n) || n <= 0) return 0n;
  const [whole, frac = ""] = gen.trim().split(".");
  const fracPad = (frac + "0".repeat(18)).slice(0, 18);
  return BigInt(whole || "0") * 10n ** 18n + BigInt(fracPad || "0");
}

export function hpPercent(hp: number, max: number): number {
  return max > 0 ? Math.round((hp / max) * 100) : 0;
}

export function hpColor(hp: number, max: number): string {
  const pct = hpPercent(hp, max);
  if (pct > 60) return "var(--color-hp)";
  if (pct > 30) return "var(--color-warning)";
  return "var(--color-danger)";
}
