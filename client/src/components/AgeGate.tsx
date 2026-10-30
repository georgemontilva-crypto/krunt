import { AnimatePresence, motion } from "motion/react";
import { useEffect, useState } from "react";
import { Mark } from "./Brand";

const KEY = "krunkd_age_ok";

/** 21+ gate. Remembered on this device once answered yes. */
export function AgeGate() {
  const [ok, setOk] = useState(true);
  const [nope, setNope] = useState(false);

  useEffect(() => {
    try {
      setOk(window.localStorage.getItem(KEY) === "1");
    } catch {
      setOk(false);
    }
  }, []);

  useEffect(() => {
    if (ok) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [ok]);

  const yes = () => {
    try {
      window.localStorage.setItem(KEY, "1");
    } catch {
      /* asked again next time */
    }
    setOk(true);
  };

  return (
    <AnimatePresence>
      {!ok && (
        <motion.div
          role="dialog"
          aria-modal="true"
          aria-labelledby="age-title"
          className="wall fixed inset-0 z-[200] flex items-center justify-center overflow-y-auto p-5"
          exit={{ clipPath: "inset(0 0 100% 0)" }}
          transition={{ duration: 0.6, ease: [0.7, 0, 0.2, 1] }}
        >
          <div className="pointer-events-none absolute inset-0 overflow-hidden">
            <p className="font-display absolute -left-6 top-6 rotate-[-8deg] text-[30vw] leading-none text-white/[0.03]">21+</p>
          </div>
          <motion.div
            initial={{ scale: 0.8, rotate: -6, opacity: 0 }}
            animate={{ scale: 1, rotate: 0, opacity: 1 }}
            transition={{ type: "spring", stiffness: 200, damping: 16 }}
            className="relative w-full max-w-md text-center"
          >
            <Mark className="mx-auto w-40 animate-wobble drop-shadow-[0_0_30px_rgba(196,218,69,0.35)]" />
            {nope ? (
              <>
                <h1 id="age-title" className="font-display mt-6 text-6xl">Not yet, kid.</h1>
                <p className="mt-3 text-smoke">Krunk'd is for adults 21 and older. Come back when you're legal.</p>
                <button type="button" onClick={() => setNope(false)} className="btn btn-ghost mt-8">
                  Go back
                </button>
              </>
            ) : (
              <>
                <p className="label mt-6 text-[var(--flavor)]">Hold up</p>
                <h1 id="age-title" className="font-display mt-2 text-6xl md:text-7xl">
                  Are you <span className="text-blood">21+</span>?
                </h1>
                <p className="mt-3 text-smoke">This site sells botanical products for adults only.</p>
                <div className="mt-8 flex flex-col gap-4 sm:flex-row sm:justify-center">
                  <button type="button" onClick={yes} className="btn btn-spray">
                    Hell yes, I'm 21+
                  </button>
                  <button type="button" onClick={() => setNope(true)} className="btn btn-ghost">
                    Nope
                  </button>
                </div>
              </>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
