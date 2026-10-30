import { cn } from "@/lib/utils";

/** Full lockup (bunny + wordmark), traced to vector from the brand artwork. */
export function Logo({ className, white }: { className?: string; white?: boolean }) {
  return (
    <img
      src={white ? "/brand/logo-white.svg" : "/brand/logo.svg"}
      alt="Krunk'd"
      width={2579}
      height={1018}
      className={cn("h-auto select-none", className)}
      draggable={false}
    />
  );
}

export function Mark({ className, white }: { className?: string; white?: boolean }) {
  return (
    <img
      src={white ? "/brand/mark-white.svg" : "/brand/mark.svg"}
      alt=""
      aria-hidden
      width={856}
      height={1018}
      className={cn("h-auto select-none", className)}
      draggable={false}
    />
  );
}

/** Paint drips hanging off the bottom of a block. Decorative. */
export function Drips({ className, count = 9, seed = 3 }: { className?: string; count?: number; seed?: number }) {
  const rnd = (i: number) => {
    const x = Math.sin(i * 999 + seed * 77) * 10000;
    return x - Math.floor(x);
  };
  return (
    <svg className={cn("pointer-events-none block w-full", className)} viewBox="0 0 100 20" preserveAspectRatio="none" aria-hidden>
      {Array.from({ length: count }).map((_, i) => {
        const x = (i + 0.5) * (100 / count) + (rnd(i) - 0.5) * 6;
        const len = 4 + rnd(i + 11) * 15;
        const w = 0.8 + rnd(i + 5) * 1.6;
        return (
          <g key={i} fill="currentColor">
            <rect x={x - w / 2} y={-1} width={w} height={len} rx={w / 2} />
            <circle cx={x} cy={len - 0.4} r={w * 0.85} />
          </g>
        );
      })}
    </svg>
  );
}

/** Spray-paint splat used behind headings and badges. */
export function Splat({ className, seed = 1 }: { className?: string; seed?: number }) {
  const pts = Array.from({ length: 22 }).map((_, i) => {
    const a = (i / 22) * Math.PI * 2;
    const r = 34 + Math.abs(Math.sin(i * 3.3 + seed)) * 14 + (i % 3 === 0 ? 8 : 0);
    return `${50 + Math.cos(a) * r},${50 + Math.sin(a) * r * 0.8}`;
  });
  return (
    <svg className={cn("pointer-events-none", className)} viewBox="0 0 100 100" aria-hidden>
      <polygon points={pts.join(" ")} fill="currentColor" />
      {Array.from({ length: 10 }).map((_, i) => (
        <circle
          key={i}
          cx={50 + Math.cos(i * 1.7 + seed) * (44 + (i % 4) * 4)}
          cy={50 + Math.sin(i * 1.7 + seed) * (38 + (i % 3) * 5)}
          r={1 + (i % 3)}
          fill="currentColor"
        />
      ))}
    </svg>
  );
}
