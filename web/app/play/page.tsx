"use client";

import { useState, useEffect, useRef } from "react";
import { useWallet } from "@/lib/wallet";
import {
  getRun, getStats, startRun, act, claim,
  genFromWei, genToWei, hpPercent, hpColor,
  type Run, type Stats,
} from "@/lib/apex";
import { CONTRACT_CONFIGURED, TOP_FLOOR, MAX_HP } from "@/lib/config";
import { explorerTxUrl } from "@/lib/config";

function FloorTrack({ floor }: { floor: number }) {
  return (
    <div className="floor-track">
      {Array.from({ length: TOP_FLOOR }, (_, i) => {
        const f = i + 1;
        const cls = f < floor ? "reached" : f === floor ? "current" : "";
        return <div key={f} className={`floor-pip ${cls}`} />;
      })}
    </div>
  );
}

function HpBar({ hp, max }: { hp: number; max: number }) {
  const pct = hpPercent(hp, max);
  return (
    <div className="hp-bar">
      <div className="hp-bar-fill" style={{ width: `${pct}%`, background: hpColor(hp, max) }} />
    </div>
  );
}

function OutcomeBadge({ outcome }: { outcome: string }) {
  const colors: Record<string, string> = {
    SUCCESS: "text-hp",
    PARTIAL: "text-warning",
    FAIL: "text-danger",
    FATAL: "text-danger",
  };
  return <span className={`mono text-xs uppercase tracking-wider ${colors[outcome] || "text-muted"}`}>{outcome}</span>;
}

export default function PlayPage() {
  const { address, client, connect } = useWallet();
  const [run, setRun] = useState<Run | null>(null);
  const [stats, setStats] = useState<Stats | null>(null);
  const [stake, setStake] = useState("1");
  const [action, setAction] = useState("");
  const [busy, setBusy] = useState(false);
  const [busyLabel, setBusyLabel] = useState("");
  const [error, setError] = useState("");
  const [lastTx, setLastTx] = useState("");
  const logRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!CONTRACT_CONFIGURED || !address) return;
    getRun(address).then(setRun).catch(() => {});
    getStats().then(setStats).catch(() => {});
  }, [address]);

  useEffect(() => {
    if (logRef.current) logRef.current.scrollTop = logRef.current.scrollHeight;
  }, [run?.log]);

  async function onStartRun() {
    if (!client) return;
    setError(""); setBusy(true); setBusyLabel("Entering the tower…");
    try {
      const hash = await startRun(client, genToWei(stake));
      setLastTx(hash);
      const updated = await getRun(address);
      setRun(updated);
      const s = await getStats(); setStats(s);
    } catch (e) { setError(e instanceof Error ? e.message : String(e)); }
    finally { setBusy(false); setBusyLabel(""); }
  }

  async function onAct() {
    if (!client || !action.trim()) return;
    setError(""); setBusy(true); setBusyLabel("The AI Game Master adjudicates…");
    try {
      const hash = await act(client, action.trim());
      setLastTx(hash);
      setAction("");
      const updated = await getRun(address);
      setRun(updated);
    } catch (e) { setError(e instanceof Error ? e.message : String(e)); }
    finally { setBusy(false); setBusyLabel(""); }
  }

  async function onClaim() {
    if (!client) return;
    setError(""); setBusy(true); setBusyLabel("Claiming your reward…");
    try {
      const hash = await claim(client);
      setLastTx(hash);
      const updated = await getRun(address);
      setRun(updated);
      const s = await getStats(); setStats(s);
    } catch (e) { setError(e instanceof Error ? e.message : String(e)); }
    finally { setBusy(false); setBusyLabel(""); }
  }

  // not connected
  if (!address) {
    return (
      <div className="mx-auto max-w-xl px-5 py-24 text-center">
        <h1 className="display text-4xl">Enter the tower</h1>
        <p className="mt-4 text-body">Connect your wallet to stake GEN and begin your climb.</p>
        <button onClick={() => connect().catch(() => {})} className="btn-primary mt-7 !px-8 !py-3">Connect wallet</button>
      </div>
    );
  }

  const alive = run?.state === "ALIVE";
  const won = run?.state === "WON";
  const dead = run?.state === "DEAD";
  const canClaim = won && !run?.claimed;
  const noRun = !run || (!alive && !canClaim);

  // entry screen
  if (noRun) {
    return (
      <div className="mx-auto max-w-xl px-5 py-24">
        <h1 className="display text-4xl text-center">Enter the tower</h1>
        <p className="mt-4 text-body text-center">
          Stake GEN to begin. Your stake joins the pot — reach floor {TOP_FLOOR} to claim 2× back.
        </p>

        {stats && (
          <div className="mt-8 grid grid-cols-3 gap-4 text-center">
            <div className="card p-4">
              <div className="display text-xl">{stats.total_runs}</div>
              <div className="eyebrow mt-1">Runs</div>
            </div>
            <div className="card p-4">
              <div className="display text-xl">{stats.total_wins}</div>
              <div className="eyebrow mt-1">Summits</div>
            </div>
            <div className="card p-4">
              <div className="display text-xl">{genFromWei(stats.pot)}</div>
              <div className="eyebrow mt-1">Pot</div>
            </div>
          </div>
        )}

        {dead && run?.last && (
          <div className="card p-5 mt-8 border-danger/30">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-danger display text-lg">DEAD</span>
              <span className="text-muted mono text-xs">Floor {run.floor} · {run.turns} turns</span>
            </div>
            <p className="narrative">{run.last.narrative}</p>
            <p className="text-muted text-sm mt-3">Your {genFromWei(run.stake)} GEN stays in the pot. Try again?</p>
          </div>
        )}

        <div className="card p-6 mt-8">
          <label className="eyebrow">Stake (GEN)</label>
          <input
            value={stake}
            onChange={(e) => setStake(e.target.value.replace(/[^0-9.]/g, ""))}
            placeholder="1"
            inputMode="decimal"
            className="field mt-2 text-2xl display"
          />
          {error && <p className="text-sm text-danger mt-3 break-words">{error}</p>}
          <button onClick={onStartRun} disabled={busy || !Number(stake)} className="btn-primary w-full mt-6 !py-3">
            {busy ? busyLabel : `Stake ${Number(stake) ? stake : ""} GEN & enter`}
          </button>
        </div>
      </div>
    );
  }

  // game screen (alive or won-unclaimed)
  return (
    <div className="mx-auto max-w-2xl px-5 py-10">
      {/* status bar */}
      <div className="flex items-center justify-between mb-2">
        <span className="eyebrow">Floor {run!.floor} / {TOP_FLOOR}</span>
        <span className="eyebrow">
          HP {run!.hp}/{run!.max_hp}
        </span>
      </div>
      <FloorTrack floor={run!.floor} />
      <div className="mt-2">
        <HpBar hp={run!.hp} max={run!.max_hp} />
      </div>

      {/* inventory */}
      {run!.inventory.length > 0 && (
        <div className="mt-4 flex gap-2 flex-wrap">
          <span className="eyebrow">Inventory:</span>
          {run!.inventory.map((item, i) => (
            <span key={i} className="mono text-xs text-ink bg-elevated px-2 py-1">{item}</span>
          ))}
        </div>
      )}

      {/* narrative log */}
      <div ref={logRef} className="card p-5 mt-6 max-h-80 overflow-y-auto space-y-4">
        {run!.log.map((entry, i) => (
          <p key={i} className="narrative">{entry}</p>
        ))}
      </div>

      {/* last verdict badge */}
      {run!.last && (
        <div className="mt-3 flex items-center gap-3 flex-wrap">
          <OutcomeBadge outcome={run!.last.outcome} />
          {run!.last.climb === 1 && <span className="mono text-xs text-accent">+1 FLOOR</span>}
          {run!.last.hp_change !== 0 && (
            <span className={`mono text-xs ${run!.last.hp_change > 0 ? "text-hp" : "text-danger"}`}>
              {run!.last.hp_change > 0 ? "+" : ""}{run!.last.hp_change} HP
            </span>
          )}
          {run!.last.item && <span className="mono text-xs text-warning">+{run!.last.item}</span>}
        </div>
      )}

      {/* WON state */}
      {won && (
        <div className="card p-6 mt-6 border-won/30 text-center">
          <div className="display text-3xl text-won mb-2">SUMMIT REACHED</div>
          <p className="text-body">
            You conquered the tower in {run!.turns} turns.
            {canClaim && ` Claim your ${genFromWei(BigInt(Number(run!.stake)) * BigInt(2))} GEN reward.`}
            {run!.claimed && " Reward already claimed."}
          </p>
          {canClaim && (
            <button onClick={onClaim} disabled={busy} className="btn-primary mt-4 !px-8 !py-3">
              {busy ? busyLabel : "Claim 2× stake"}
            </button>
          )}
        </div>
      )}

      {/* action input (alive only) */}
      {alive && (
        <div className="mt-6">
          <label className="eyebrow">Your action</label>
          <textarea
            value={action}
            onChange={(e) => setAction(e.target.value)}
            placeholder="I grab the loose chain and haul myself up to the next platform…"
            rows={3}
            maxLength={500}
            className="field mt-2 resize-y"
            onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); onAct(); } }}
          />
          <div className="flex items-center justify-between mt-3">
            <span className="mono text-xs text-muted">{action.length}/500</span>
            <button onClick={onAct} disabled={busy || !action.trim()} className="btn-primary !px-8 !py-2.5">
              {busy ? busyLabel : "Act"}
            </button>
          </div>
        </div>
      )}

      {error && <p className="text-sm text-danger mt-4 break-words">{error}</p>}

      {lastTx && explorerTxUrl(lastTx) && (
        <div className="mt-4">
          <a href={explorerTxUrl(lastTx)} target="_blank" rel="noreferrer" className="link mono text-xs">
            View transaction ↗
          </a>
        </div>
      )}

      {/* meta */}
      <div className="mt-8 flex items-center justify-between text-muted">
        <span className="mono text-xs">Stake: {genFromWei(run!.stake)} GEN</span>
        <span className="mono text-xs">Turn {run!.turns}</span>
      </div>
    </div>
  );
}
