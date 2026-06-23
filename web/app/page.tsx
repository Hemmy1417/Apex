"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { getStats, genFromWei, type Stats } from "@/lib/apex";
import { CONTRACT_CONFIGURED, TOP_FLOOR } from "@/lib/config";

const steps = [
  { num: "01", title: "Stake", desc: "Send GEN to enter the tower. Your stake joins the shared pot." },
  { num: "02", title: "Climb", desc: "Type what you do. The AI Game Master adjudicates every move on-chain." },
  { num: "03", title: "Survive", desc: `Reach floor ${TOP_FLOOR} alive to win. Die and your stake feeds the next climber.` },
  { num: "04", title: "Claim", desc: "Summit the tower and claim 2× your stake from the pot." },
];

export default function HomePage() {
  const [stats, setStats] = useState<Stats | null>(null);

  useEffect(() => {
    if (CONTRACT_CONFIGURED) getStats().then(setStats).catch(() => {});
  }, []);

  return (
    <div className="flex flex-col">
      {/* hero */}
      <section className="mx-auto max-w-6xl px-5 py-28 sm:py-40 text-center">
        <p className="eyebrow mb-6">AI-adjudicated tower climb on GenLayer</p>
        <h1 className="display text-5xl sm:text-7xl lg:text-8xl">
          The AI decides<br />your fate.
        </h1>
        <p className="mt-6 text-body text-lg max-w-2xl mx-auto">
          Stake GEN and type your way up a {TOP_FLOOR}-floor tower. An AI-validator panel — not a server —
          judges every move and writes your fate on-chain. No one can rig it.
        </p>
        <div className="mt-10 flex items-center justify-center gap-4">
          <Link href="/play" className="btn-primary !px-8 !py-3 text-sm">
            Enter the tower
          </Link>
          <Link href="/leaderboard" className="btn-ghost !px-8 !py-3 text-sm">
            Leaderboard
          </Link>
        </div>
      </section>

      {/* stats strip */}
      {stats && (
        <section className="border-y border-hairline">
          <div className="mx-auto max-w-6xl px-5 py-6 grid grid-cols-3 gap-4 text-center">
            <div>
              <div className="display text-2xl sm:text-3xl">{stats.total_runs}</div>
              <div className="eyebrow mt-1">Runs</div>
            </div>
            <div>
              <div className="display text-2xl sm:text-3xl">{stats.total_wins}</div>
              <div className="eyebrow mt-1">Summits</div>
            </div>
            <div>
              <div className="display text-2xl sm:text-3xl">{genFromWei(stats.pot)}</div>
              <div className="eyebrow mt-1">GEN in pot</div>
            </div>
          </div>
        </section>
      )}

      {/* how it works */}
      <section className="mx-auto max-w-6xl px-5 py-24">
        <h2 className="display text-3xl sm:text-4xl text-center mb-16">How it works</h2>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-8">
          {steps.map((s) => (
            <div key={s.num} className="card p-6">
              <div className="display text-4xl text-accent mb-4">{s.num}</div>
              <h3 className="display text-xl mb-2">{s.title}</h3>
              <p className="text-body text-sm">{s.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* why GenLayer */}
      <section className="border-t border-hairline">
        <div className="mx-auto max-w-3xl px-5 py-24 text-center">
          <h2 className="display text-3xl sm:text-4xl mb-6">Why GenLayer</h2>
          <p className="text-body text-lg leading-relaxed">
            There is no central game server deciding outcomes. The player types a free-text action;
            an <strong className="text-ink">AI-validator panel adjudicates it by consensus</strong>,
            and the canonical game state — floor, HP, inventory, story — lives on-chain.
            The AI judgement <em>is</em> the gameplay.
          </p>
        </div>
      </section>
    </div>
  );
}
