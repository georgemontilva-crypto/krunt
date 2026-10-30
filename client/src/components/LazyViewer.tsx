import { Component, lazy, Suspense, useMemo, type ReactNode } from "react";
import type { ViewerProps } from "@/three/Viewer3D";
import { packImage } from "@/lib/store";
import { cn } from "@/lib/utils";

const Viewer3D = lazy(() => import("@/three/Viewer3D"));

function hasWebGL() {
  try {
    const c = document.createElement("canvas");
    return Boolean(c.getContext("webgl2") || c.getContext("webgl"));
  } catch {
    return false;
  }
}

class Boundary extends Component<{ fallback: ReactNode; children: ReactNode }, { failed: boolean }> {
  state = { failed: false };
  static getDerivedStateFromError() {
    return { failed: true };
  }
  componentDidCatch(err: unknown) {
    console.warn("[3D] viewer failed, showing the photo instead:", err);
  }
  render() {
    return this.state.failed ? this.props.fallback : this.props.children;
  }
}

/**
 * The 3D viewer loads in its own chunk (three.js is the heaviest thing on the
 * site). Until it arrives, or on a device without WebGL, the pack photo stands
 * in at the same size so nothing jumps.
 */
export function LazyViewer(props: ViewerProps) {
  const webgl = useMemo(hasWebGL, []);
  const still = (
    <div className={cn(props.className, "flex items-center justify-center")}>
      <img src={packImage(props.slug, props.flavor)} alt="" className="h-[78%] w-auto object-contain drop-shadow-[0_30px_40px_rgba(0,0,0,.6)]" />
    </div>
  );
  if (!webgl) return still;
  return (
    <Boundary fallback={still}>
      <Suspense fallback={still}>
        <Viewer3D {...props} />
      </Suspense>
    </Boundary>
  );
}
