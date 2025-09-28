"use client";

import { useEffect, useRef, useState } from "react";

export default function GameClient() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [score, setScore] = useState<number>(0);

  useEffect(() => {
    const saved = localStorage.getItem("gavel_score");
    if (saved) setScore(Number(saved));
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const canvasEl: HTMLCanvasElement = canvas;
    const maybeCtx = canvasEl.getContext("2d");
    if (!maybeCtx) return;
    const ctx: CanvasRenderingContext2D = maybeCtx;

    // let frame = 0;
    let animationId = 0;
    function loop() {
      // frame++;
      ctx.clearRect(0, 0, canvasEl.width, canvasEl.height);
      ctx.fillStyle = "#111";
      ctx.fillRect(0, 0, canvasEl.width, canvasEl.height);
      ctx.fillStyle = "#39FF14"; // neon green
      ctx.font = "16px monospace";
      ctx.fillText(`Gavel Smash — Neon Justice`, 12, 24);
      ctx.fillText(`Score: ${score}`, 12, 48);
      animationId = requestAnimationFrame(loop);
    }
    animationId = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(animationId);
  }, [score]);

  function smash() {
    setScore((s) => {
      const next = s + 1;
      localStorage.setItem("gavel_score", String(next));
      return next;
    });
  }

  return (
    <div className="flex flex-col items-start gap-3">
      <canvas ref={canvasRef} width={640} height={360} className="w-full rounded bg-black" />
      <button onClick={smash} className="rounded border px-3 py-1 text-sm hover:bg-muted">
        Smash the gavel
      </button>
    </div>
  );
}


