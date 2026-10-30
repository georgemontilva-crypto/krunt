import { motion, useMotionValue, useSpring } from "motion/react";
import { useEffect, useState } from "react";

type Mode = "default" | "link" | "spray" | "drag";

/**
 * Spray-can nozzle cursor for mouse users. Grows over links, turns into a
 * paint mist over the tag wall and says DRAG over the 3D viewer.
 * Touch devices never mount it.
 */
export function Cursor() {
  const [enabled, setEnabled] = useState(false);
  const [mode, setMode] = useState<Mode>("default");
  const [pressed, setPressed] = useState(false);
  const x = useMotionValue(-100);
  const y = useMotionValue(-100);
  const sx = useSpring(x, { stiffness: 600, damping: 40, mass: 0.4 });
  const sy = useSpring(y, { stiffness: 600, damping: 40, mass: 0.4 });

  useEffect(() => {
    const mq = window.matchMedia("(pointer: fine)");
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (!mq.matches || reduce) return;
    setEnabled(true);
    document.documentElement.classList.add("has-custom-cursor");
    const move = (e: PointerEvent) => {
      if (e.pointerType !== "mouse") return;
      x.set(e.clientX);
      y.set(e.clientY);
      const t = e.target as HTMLElement | null;
      const hint = t?.closest<HTMLElement>("[data-cursor]")?.dataset.cursor as Mode | undefined;
      if (t?.closest("a,button,[role=button],[role=tab],label,select,input,textarea,summary,[data-no-spray]")) setMode("link");
      else if (hint) setMode(hint);
      else setMode("default");
    };
    const dn = () => setPressed(true);
    const up = () => setPressed(false);
    const leave = () => {
      x.set(-100);
      y.set(-100);
    };
    window.addEventListener("pointermove", move);
    window.addEventListener("pointerdown", dn);
    window.addEventListener("pointerup", up);
    document.addEventListener("mouseleave", leave);
    return () => {
      document.documentElement.classList.remove("has-custom-cursor");
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerdown", dn);
      window.removeEventListener("pointerup", up);
      document.removeEventListener("mouseleave", leave);
    };
  }, [x, y]);

  if (!enabled) return null;
  const size = mode === "link" ? 54 : mode === "drag" ? 84 : mode === "spray" ? 46 : 22;

  return (
    <>
      <motion.div
        aria-hidden
        className="pointer-events-none fixed left-0 top-0 z-[999] flex items-center justify-center rounded-full mix-blend-difference"
        style={{ x: sx, y: sy, translateX: "-50%", translateY: "-50%" }}
        animate={{
          width: size,
          height: size,
          backgroundColor: mode === "link" ? "rgba(255,255,255,1)" : "rgba(255,255,255,0)",
          borderWidth: mode === "link" ? 0 : 2,
          scale: pressed ? 0.8 : 1,
        }}
        transition={{ type: "spring", stiffness: 400, damping: 28 }}
      >
        <div className="absolute inset-0 rounded-full border-2 border-white" style={{ opacity: mode === "link" ? 0 : 1 }} />
        {mode === "drag" && <span className="label text-[10px] text-white">◂ Drag ▸</span>}
        {mode === "spray" && (
          <span className="absolute -bottom-6 whitespace-nowrap label text-[9px] text-white">{pressed ? "Spraying" : "Hold to spray"}</span>
        )}
      </motion.div>
      <motion.div
        aria-hidden
        className="pointer-events-none fixed left-0 top-0 z-[999] h-1.5 w-1.5 rounded-full bg-[var(--flavor)]"
        style={{ x, y, translateX: "-50%", translateY: "-50%" }}
      />
    </>
  );
}
