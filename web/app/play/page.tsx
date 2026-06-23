"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useWallet } from "@/lib/wallet";
import {
  getRun, getStats, startRun, act, claim,
  genFromWei, genToWei, hpPercent, hpColor,
  type Run, type Stats,
} from "@/lib/apex";
import { CONTRACT_CONFIGURED, TOP_FLOOR } from "@/lib/config";
import { explorerTxUrl } from "@/lib/config";

/* ─── Tower visualization ─── */
function Tower({ floor, state }: { floor: number; state: string }) {
  const floors = Array.from({ length: TOP_FLOOR }, (_, i) => TOP_FLOOR - i);
  return (
    <div className="flex flex-col items-center gap-1">
      {floors.map((f) => {
        const isCurrent = f === floor && state === "ALIVE";
        const isReached = f < floor || state === "WON";
        const isSummit = f === TOP_FLOOR;
        return (
          <div
            key={f}
            className="tower-floor"
            data-current={isCurrent || undefined}
            data-reached={isReached || undefined}
            data-summit={isSummit || undefined}
          >
            <span className="tower-floor-label">{isSummit ? "TOP" : f}</span>
            {isCurrent && <span className="tower-player">▲</span>}
          </div>
        );
      })}
    </div>
  );
}

/* ─── HP gauge ─── */
function HpGauge({ hp, max }: { hp: number; max: number }) {
  const pct = hpPercent(hp, max);
  const color = hpColor(hp, max);
  const critical = pct <= 30;
  return (
    <div className="hp-gauge">
      <div className="flex items-baseline gap-2">
        <span className="display text-3xl" style={{ color }}>{hp}</span>
        <span className="eyebrow">/ {max} HP</span>
      </div>
      <div className="hp-bar mt-2">
        <div
          className={`hp-bar-fill ${critical ? "hp-critical" : ""}`}
          style={{ width: `${pct}%`, background: color }}
        />
      </div>
    </div>
  );
}

/* ─── Verdict splash ─── */
function VerdictSplash({ verdict, visible }: {
  verdict: { outcome: string; hp_change: number; climb: number; item: string; narrative: string } | null;
  visible: boolean;
}) {
  if (!verdict || !visible) return null;
  const colors: Record<string, string> = {
    SUCCESS: "#22c55e", PARTIAL: "#f59e0b", FAIL: "#ef4444", FATAL: "#ef4444",
  };
  const bg = colors[verdict.outcome] || "#666";
  return (
    <div className="verdict-splash" style={{ "--verdict-color": bg } as React.CSSProperties}>
      <div className="verdict-outcome">{verdict.outcome}</div>
      <div className="verdict-stats">
        {verdict.climb === 1 && <span className="verdict-tag">+1 FLOOR</span>}
        {verdict.hp_change !== 0 && (
          <span className="verdict-tag" style={{ color: verdict.hp_change > 0 ? "#22c55e" : "#ef4444" }}>
            {verdict.hp_change > 0 ? "+" : ""}{verdict.hp_change} HP
          </span>
        )}
        {verdict.item && <span className="verdict-tag" style={{ color: "#f59e0b" }}>+{verdict.item}</span>}
      </div>
    </div>
  );
}

/* ─── Waiting overlay ─── */
function Adjudicating() {
  return (
    <div className="adjudicating-overlay">
      <div className="adjudicating-content">
        <div className="adjudicating-ring" />
        <p className="display text-lg mt-4">THE AI ADJUDICATES</p>
        <p className="text-muted text-sm mt-2">Validators reaching consensus…</p>
      </div>
    </div>
  );
}

/* ─── Full-screen death ─── */
function DeathScreen({ run, onRetry }: { run: Run; onRetry: () => void }) {
  return (
    <div className="endscreen endscreen-death">
      <div className="endscreen-inner">
        <div className="display text-6xl sm:text-8xl text-danger endscreen-title">DEAD</div>
        <p className="narrative text-lg mt-6 max-w-lg text-center">{run.last?.narrative}</p>
        <div className="mt-8 flex items-center gap-6 mono text-sm text-muted">
          <span>Floor {run.floor}/{TOP_FLOOR}</span>
          <span>{run.turns} turns</span>
          <span>{genFromWei(run.stake)} GEN lost</span>
        </div>
        <button onClick={onRetry} className="btn-primary mt-10 !px-10 !py-3 text-sm">
          Try again
        </button>
      </div>
    </div>
  );
}

/* ─── Full-screen win ─── */
function WinScreen({ run, onClaim, busy, claimed }: {
  run: Run; onClaim: () => void; busy: boolean; claimed: boolean;
}) {
  return (
    <div className="endscreen endscreen-win">
      <div className="endscreen-inner">
        <div className="display text-6xl sm:text-8xl text-won endscreen-title">SUMMIT</div>
        <p className="display text-xl mt-2 text-muted">YOU CONQUERED THE TOWER</p>
        <p className="narrative text-lg mt-6 max-w-lg text-center">{run.last?.narrative}</p>
        <div className="mt-8 flex items-center gap-6 mono text-sm text-muted">
          <span>{run.turns} turns</span>
          <span>{genFromWei(run.stake)} GEN staked</span>
        </div>
        {!claimed ? (
          <button onClick={onClaim} disabled={busy} className="btn-primary mt-10 !px-10 !py-3 text-sm">
            {busy ? "Claiming…" : `Claim ${genFromWei(BigInt(Number(run.stake)) * BigInt(2))} GEN`}
          </button>
        ) : (
          <div className="mt-10 mono text-sm text-won">Reward claimed ✓</div>
        )}
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════ MAIN ═══════════════════════════════════════════ */
export default function PlayPage() {
  const { address, client, connect } = useWallet();
  const [run, setRun] = useState<Run | null>(null);
  const [stats, setStats] = useState<Stats | null>(null);
  const [stake, setStake] = useState("1");
  const [action, setAction] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [lastTx, setLastTx] = useState("");
  const [showVerdict, setShowVerdict] = useState(false);
  const [showDeath, setShowDeath] = useState(false);
  const [showWin, setShowWin] = useState(false);
  const logRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (!CONTRACT_CONFIGURED || !address) return;
    getRun(address).then((r) => {
      setRun(r);
      if (r?.state === "DEAD") setShowDeath(true);
      if (r?.state === "WON") setShowWin(true);
    }).catch(() => {});
    getStats().then(setStats).catch(() => {});
  }, [address]);

  useEffect(() => {
    if (logRef.current) logRef.current.scrollTop = logRef.current.scrollHeight;
  }, [run?.log]);

  const refreshStats = useCallback(async () => {
    try { setStats(await getStats()); } catch {}
  }, []);

  async function onStartRun() {
    if (!client) return;
    setError(""); setBusy(true); setShowDeath(false); setShowWin(false);
    try {
      const hash = await startRun(client, genToWei(stake));
      setLastTx(hash);
      setRun(await getRun(address));
      await refreshStats();
    } catch (e) { setError(e instanceof Error ? e.message : String(e)); }
    finally { setBusy(false); }
  }

  async function onAct() {
    if (!client || !action.trim()) return;
    setError(""); setBusy(true); setShowVerdict(false);
    try {
      const hash = await act(client, action.trim());
      setLastTx(hash);
      setAction("");
      const updated = await getRun(address);
      setRun(updated);
      setShowVerdict(true);
      setTimeout(() => setShowVerdict(false), 2500);
      if (updated?.state === "DEAD") setTimeout(() => setShowDeath(true), 2800);
      if (updated?.state === "WON") setTimeout(() => setShowWin(true), 2800);
    } catch (e) { setError(e instanceof Error ? e.message : String(e)); }
    finally { setBusy(false); setTimeout(() => inputRef.current?.focus(), 100); }
  }

  async function onClaim() {
    if (!client) return;
    setError(""); setBusy(true);
    try {
      const hash = await claim(client);
      setLastTx(hash);
      setRun(await getRun(address));
      await refreshStats();
    } catch (e) { setError(e instanceof Error ? e.message : String(e)); }
    finally { setBusy(false); }
  }

  /* ─── Not connected ─── */
  if (!address) {
    return (
      <div className="gate-screen">
        <div className="gate-inner">
          <div className="display text-5xl sm:text-7xl">ENTER<br/>THE TOWER</div>
          <p className="mt-6 text-body text-lg max-w-md text-center">
            Connect your wallet. Stake GEN. Type your fate.
          </p>
          <button onClick={() => connect().catch(() => {})} className="btn-primary mt-8 !px-10 !py-3 text-sm">
            Connect wallet
          </button>
        </div>
      </div>
    );
  }

  const alive = run?.state === "ALIVE";
  const won = run?.state === "WON";
  const dead = run?.state === "DEAD";
  const canClaim = won && !run?.claimed;
  const noRun = !run || (!alive && !canClaim);

  /* ─── Death overlay ─── */
  if (showDeath && dead && run) {
    return <DeathScreen run={run} onRetry={() => setShowDeath(false)} />;
  }

  /* ─── Win overlay ─── */
  if (showWin && won && run) {
    return <WinScreen run={run} onClaim={onClaim} busy={busy} claimed={!!run.claimed} />;
  }

  /* ─── Entry screen ─── */
  if (noRun) {
    return (
      <div className="gate-screen">
        <div className="gate-inner">
          <div className="display text-5xl sm:text-6xl">ENTER<br/>THE TOWER</div>
          <p className="mt-4 text-body text-center max-w-md">
            Stake GEN to begin. Your stake joins the pot — reach floor {TOP_FLOOR} to claim 2× back.
          </p>

          {stats && (
            <div className="mt-8 flex items-center gap-6 mono text-sm">
              <span><span className="text-ink">{stats.total_runs}</span> <span className="text-muted">runs</span></span>
              <span><span className="text-ink">{stats.total_wins}</span> <span className="text-muted">summits</span></span>
              <span><span className="text-ink">{genFromWei(stats.pot)}</span> <span className="text-muted">GEN pot</span></span>
            </div>
          )}

          <div className="mt-10 w-full max-w-sm">
            <label className="eyebrow">Stake (GEN)</label>
            <input
              value={stake}
              onChange={(e) => setStake(e.target.value.replace(/[^0-9.]/g, ""))}
              placeholder="1"
              inputMode="decimal"
              className="field mt-2 text-3xl display text-center"
            />
            {error && <p className="text-sm text-danger mt-3 break-words text-center">{error}</p>}
            <button onClick={onStartRun} disabled={busy || !Number(stake)} className="btn-primary w-full mt-6 !py-3.5">
              {busy ? "Entering the tower…" : `Stake ${Number(stake) ? stake : ""} GEN & enter`}
            </button>
          </div>
        </div>
      </div>
    );
  }

  /* ─── GAME SCREEN ─── */
  const hpPct = hpPercent(run!.hp, run!.max_hp);
  const tension = hpPct <= 30 ? "critical" : hpPct <= 60 ? "danger" : "normal";

  return (
    <div className={`game-screen game-tension-${tension}`}>
      {/* Verdict splash */}
      <VerdictSplash verdict={run!.last || null} visible={showVerdict} />

      {/* Adjudicating overlay */}
      {busy && <Adjudicating />}

      <div className="game-layout">
        {/* Left: Tower */}
        <aside className="game-tower-col">
          <Tower floor={run!.floor} state={run!.state} />
          <div className="mt-4 text-center">
            <span className="display text-sm">FLOOR {run!.floor}</span>
            <span className="text-muted mono text-xs ml-2">/ {TOP_FLOOR}</span>
          </div>
        </aside>

        {/* Center: Narrative + Action */}
        <div className="game-main-col">
          {/* HP */}
          <HpGauge hp={run!.hp} max={run!.max_hp} />

          {/* Inventory */}
          {run!.inventory.length > 0 && (
            <div className="mt-4 flex gap-2 flex-wrap items-center">
              <span className="eyebrow">Inventory</span>
              {run!.inventory.map((item, i) => (
                <span key={i} className="inventory-tag">{item}</span>
              ))}
            </div>
          )}

          {/* Narrative log */}
          <div ref={logRef} className="narrative-log mt-5">
            {run!.log.map((entry, i) => {
              const isLatest = i === run!.log.length - 1;
              return (
                <p key={i} className={`narrative-entry ${isLatest ? "narrative-latest" : ""}`}>
                  {entry}
                </p>
              );
            })}
          </div>

          {/* Last verdict tags (persistent, below narrative) */}
          {run!.last && !showVerdict && (
            <div className="verdict-tags mt-3">
              <span className={`verdict-mini verdict-mini-${run!.last.outcome.toLowerCase()}`}>
                {run!.last.outcome}
              </span>
              {run!.last.climb === 1 && <span className="verdict-mini verdict-mini-climb">+1 FLOOR</span>}
              {run!.last.hp_change !== 0 && (
                <span className={`verdict-mini ${run!.last.hp_change > 0 ? "verdict-mini-heal" : "verdict-mini-damage"}`}>
                  {run!.last.hp_change > 0 ? "+" : ""}{run!.last.hp_change} HP
                </span>
              )}
              {run!.last.item && <span className="verdict-mini verdict-mini-item">+{run!.last.item}</span>}
            </div>
          )}

          {/* Action input */}
          {alive && (
            <div className="action-input mt-6">
              <textarea
                ref={inputRef}
                value={action}
                onChange={(e) => setAction(e.target.value)}
                placeholder="What do you do?"
                rows={2}
                maxLength={500}
                className="action-field"
                onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); onAct(); } }}
              />
              <div className="flex items-center justify-between mt-2">
                <span className="mono text-xs text-muted">{action.length}/500</span>
                <button onClick={onAct} disabled={busy || !action.trim()} className="btn-primary !px-8 !py-2.5">
                  Act
                </button>
              </div>
            </div>
          )}

          {error && <p className="text-sm text-danger mt-4 break-words">{error}</p>}

          {/* Meta footer */}
          <div className="mt-6 flex items-center justify-between text-muted">
            <span className="mono text-xs">Stake: {genFromWei(run!.stake)} GEN · Turn {run!.turns}</span>
            {lastTx && explorerTxUrl(lastTx) && (
              <a href={explorerTxUrl(lastTx)} target="_blank" rel="noreferrer" className="link mono text-xs">
                tx ↗
              </a>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
