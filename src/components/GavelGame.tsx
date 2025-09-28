"use client";

import dynamic from "next/dynamic";

const Game = dynamic(() => import("./_gavel/GameClient"), { ssr: false, loading: () => null });

export default function GavelGame() {
  return (
    <section className="mx-auto max-w-6xl px-4 pb-12 sm:px-6">
      <div className="rounded-lg border p-4">
        <Game />
      </div>
    </section>
  );
}


