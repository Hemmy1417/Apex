"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { getLeaderboard, getStats, genFromWei, type LeaderboardEntry, type Stats } from "@/lib/apex";
import { CONTRACT_CONFIGURED, TOP_FLOOR } from "@/lib/config";

function short(a: string) {
  return a ? `${a.slice(0, 6)}…${a.slice(-4)}` : "";
}

export default function LeaderboardPage() {
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!CONTRACT_CONFIGURED) { setLoading(false); return; }
    Promise.all([getLeaderboard(20), getStats()])
      .then(([lb, s]) => { setEntries(lb); setStats(s); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="mx-auto max-w-3xl px-5 py-16">
      <h1 className="display text-4xl sm:text-5xl text-center">Leaderboard</h1>
      <p className="mt-3 text-body text-center">Players who conquered the tower.</p>

      {stats && (
        <div className="mt-10 grid grid-cols-3 gap-4 text-center">
          <div className="card p-4">
            <div className="display text-xl">{stats.total_runs}</div>
            <div className="eyebrow mt-1">Total runs</div>
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

      <div className="mt-10">
        {loading ? (
          <p className="text-center text-muted mono text-sm">Loading…</p>
        ) : entries.length === 0 ? (
          <div className="text-center py-16">
            <p className="text-muted text-lg">No one has summited yet.</p>
            <Link href="/play" className="btn-primary mt-6 !px-8 !py-3 inline-flex">Be the first</Link>
          </div>
        ) : (
          <div className="space-y-2">
            <div className="grid grid-cols-[3rem_1fr_5rem] gap-4 px-4 py-2">
              <span className="eyebrow">#</span>
              <span className="eyebrow">Player</span>
              <span className="eyebrow text-right">Best</span>
            </div>
            {entries.map((e, i) => (
              <div key={e.player} className="card grid grid-cols-[3rem_1fr_5rem] gap-4 px-4 py-3 items-center">
                <span className="display text-lg">{i + 1}</span>
                <span className="mono text-sm text-ink">{short(e.player)}</span>
                <span className="mono text-sm text-right">
                  {e.best_floor >= TOP_FLOOR ? (
                    <span className="text-won">Summit</span>
                  ) : (
                    <span>F{e.best_floor}</span>
                  )}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
