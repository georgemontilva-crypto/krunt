import { useEffect, useRef } from "react";
import { cn } from "@/lib/utils";

type Drip = { x: number; y: number; len: number; max: number; w: number; color: string };

/**
 * A wall you can tag. Hold the mouse (or drag a finger when `armed`) to spray
 * in the current flavour colour; heavy spots run into drips; paint slowly
 * weathers away so the wall is always ready for the next tag.
 */
export function SprayCanvas({ color, armed, className }: { color: string; armed: boolean; className?: string }) {
  const canvas = useRef<HTMLCanvasElement>(null);
  const colorRef = useRef(color);
  colorRef.current = color;
  const armedRef = useRef(armed);
  armedRef.current = armed;

  useEffect(() => {
    const c = canvas.current!;
    const ctx = c.getContext("2d")!;
    let raf = 0;
    let down = false;
    let last: { x: number; y: number } | null = null;
    const drips: Drip[] = [];
    let dpr = 1;
    let frame = 0;

    const resize = () => {
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      const r = c.getBoundingClientRect();
      c.width = Math.max(1, Math.round(r.width * dpr));
      c.height = Math.max(1, Math.round(r.height * dpr));
    };
    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(c);

    const spray = (x: number, y: number, speed: number) => {
      const radius = (22 + Math.min(speed, 40) * 0.5) * dpr;
      ctx.fillStyle = colorRef.current;
      const n = 95;
      for (let i = 0; i < n; i++) {
        const a = Math.random() * Math.PI * 2;
        // Gaussian-ish falloff: dense core, fine overspray.
        const d = radius * Math.pow(Math.random(), 1.8);
        const s = (Math.random() < 0.9 ? 1.1 : 2.4) * dpr;
        ctx.globalAlpha = 0.18 + Math.random() * 0.5;
        ctx.fillRect(x + Math.cos(a) * d, y + Math.sin(a) * d, s, s);
      }
      ctx.globalAlpha = 0.2;
      ctx.beginPath();
      ctx.arc(x, y, radius * 0.45, 0, Math.PI * 2);
      ctx.fill();
      ctx.globalAlpha = 1;
      // Lingering slowly = too much paint = drip.
      if (speed < 4 && Math.random() < 0.06 && drips.length < 60) {
        drips.push({ x: x + (Math.random() - 0.5) * radius * 0.6, y, len: 0, max: (40 + Math.random() * 140) * dpr, w: (2 + Math.random() * 3) * dpr, color: colorRef.current });
      }
    };

    const pos = (e: PointerEvent) => {
      const r = c.getBoundingClientRect();
      return { x: (e.clientX - r.left) * dpr, y: (e.clientY - r.top) * dpr };
    };
    const onDown = (e: PointerEvent) => {
      if (e.pointerType !== "mouse" && !armedRef.current) return;
      if (e.button !== 0) return;
      // Buttons, links and stickers keep their own clicks.
      if ((e.target as HTMLElement).closest("a,button,input,select,textarea,[role=tab],[data-no-spray]")) return;
      down = true;
      last = pos(e);
      spray(last.x, last.y, 0);
    };
    const onMove = (e: PointerEvent) => {
      if (!down) return;
      const p = pos(e);
      if (last) {
        const dx = p.x - last.x;
        const dy = p.y - last.y;
        const dist = Math.hypot(dx, dy);
        const steps = Math.max(1, Math.floor(dist / (8 * dpr)));
        for (let i = 1; i <= steps; i++) spray(last.x + (dx * i) / steps, last.y + (dy * i) / steps, dist / dpr);
      }
      last = p;
    };
    const onUp = () => {
      down = false;
      last = null;
    };

    const tick = () => {
      frame++;
      for (let i = drips.length - 1; i >= 0; i--) {
        const d = drips[i];
        const step = Math.max(0.25, (1 - d.len / d.max) * 2.2) * dpr;
        ctx.fillStyle = d.color;
        ctx.globalAlpha = 0.85;
        ctx.beginPath();
        ctx.arc(d.x, d.y + d.len, d.w * (1 - d.len / d.max / 2), 0, Math.PI * 2);
        ctx.fill();
        d.len += step;
        if (d.len >= d.max) drips.splice(i, 1);
      }
      // Weathering.
      if (frame % 3 === 0) {
        ctx.globalCompositeOperation = "destination-out";
        ctx.globalAlpha = 0.012;
        ctx.fillRect(0, 0, c.width, c.height);
        ctx.globalCompositeOperation = "source-over";
      }
      ctx.globalAlpha = 1;
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);

    // Listen on the whole section: the hero's content sits above the canvas.
    const surface = c.parentElement ?? c;
    surface.addEventListener("pointerdown", onDown);
    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);
    window.addEventListener("pointercancel", onUp);
    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
      surface.removeEventListener("pointerdown", onDown);
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
      window.removeEventListener("pointercancel", onUp);
    };
  }, []);

  // While tagging on a phone, the finger paints instead of scrolling.
  useEffect(() => {
    const surface = canvas.current?.parentElement;
    if (!surface) return;
    surface.style.touchAction = armed ? "none" : "";
    if (armed) surface.dataset.cursor = "spray";
  }, [armed]);

  return (
    <canvas
      ref={canvas}
      className={cn("pointer-events-none", className)}
      aria-hidden
    />
  );
}
