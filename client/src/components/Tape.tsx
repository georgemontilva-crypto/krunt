import { cn } from "@/lib/utils";

/** Caution-tape marquee strip. `tilt` in degrees. */
export function Tape({
  words = ["Get Krunk'd", "Blue Lotus Infused", "Lab Tested", "21+ Only", "Premium Botanical", "Stay Legendary"],
  tilt = -2,
  reverse,
  className,
}: {
  words?: string[];
  tilt?: number;
  reverse?: boolean;
  className?: string;
}) {
  const row = (
    <div className="flex shrink-0 items-center">
      {words.map((w, i) => (
        <span key={i} className="flex items-center">
          <span className="font-display px-5 text-2xl md:text-4xl">{w}</span>
          <span className="text-xl">✕</span>
        </span>
      ))}
    </div>
  );
  return (
    // The strip is wider than the screen so its rotated ends never show a
    // gap; this wrapper clips that overhang so the page can't scroll sideways.
    <div className={cn("relative z-10 overflow-x-clip", className)}>
    <div className="relative -mx-6 overflow-hidden py-1.5" style={{ transform: `rotate(${tilt}deg)` }}>
      <div className="tape absolute inset-0" />
      <div className="tape-inner relative mx-0 my-1.5 overflow-hidden border-y-4 border-black py-2">
        <div className={cn("flex w-max will-change-transform", reverse ? "animate-marquee-rev" : "animate-marquee")}>
          {row}
          {row}
          {row}
          {row}
        </div>
      </div>
    </div>
    </div>
  );
}
