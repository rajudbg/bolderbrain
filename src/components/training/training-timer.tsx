"use client";

import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";

export function TrainingTimer({
  endsAt,
  onExpire,
}: {
  endsAt: Date | string;
  onExpire?: () => void;
}) {
  const end = typeof endsAt === "string" ? new Date(endsAt).getTime() : endsAt.getTime();
  const [left, setLeft] = useState(() => Math.max(0, Math.floor((end - Date.now()) / 1000)));
  const expiredRef = useRef(false);

  useEffect(() => {
    expiredRef.current = false;
    let id: number | undefined;
    const fire = () => {
      if (expiredRef.current) return;
      expiredRef.current = true;
      if (id !== undefined) window.clearInterval(id);
      onExpire?.();
    };

    const tick = () => {
      const s = Math.max(0, Math.floor((end - Date.now()) / 1000));
      setLeft(s);
      if (s <= 0) fire();
    };

    tick();
    id = window.setInterval(tick, 1000);
    return () => {
      if (id !== undefined) window.clearInterval(id);
    };
  }, [end, onExpire]);

  const m = Math.floor(left / 60);
  const s = left % 60;
  const label = `${m}:${s.toString().padStart(2, "0")}`;

  return (
    <div
      className={cn(
        "rounded-full border px-3 py-1 font-mono text-sm tabular-nums",
        left < 60 && "border-red-500/50 bg-red-500/10 text-red-200",
        left >= 60 && left < 300 && "border-amber-500/40 bg-amber-500/10 text-amber-100",
        left >= 300 && "border-white/15 bg-white/[0.06] text-white/85",
      )}
    >
      {label} left
    </div>
  );
}
