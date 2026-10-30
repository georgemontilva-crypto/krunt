import { ContactShadows, Environment, Float, Lightformer } from "@react-three/drei";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { Suspense, useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { Cone, Device, Pouch, Tube } from "./models";

export type ViewerView = "pack" | "device" | "cone" | "open";

export type ViewerProps = {
  slug: string;
  flavor: string;
  color: string;
  view?: ViewerView;
  mode?: "hero" | "studio";
  /** Change `nonce` to swing the model to `angle` (radians). */
  turn?: { angle: number; nonce: number };
  zoom?: number;
  className?: string;
};

/** Studio lighting built from light cards: no HDR file to download. */
function Lights({ color }: { color: string }) {
  return (
    <>
      <ambientLight intensity={0.55} />
      <directionalLight position={[3, 5, 6]} intensity={1.5} />
      <directionalLight position={[-4, 3, -5]} intensity={1.3} />
      <directionalLight position={[-5, 0, 2]} intensity={0.7} color={color} />
      <Environment resolution={256} frames={1}>
        <Lightformer form="rect" intensity={3} position={[0, 4, 3]} scale={[6, 2, 1]} />
        <Lightformer form="rect" intensity={1.6} position={[0, 2, -5]} scale={[6, 4, 1]} />
        <Lightformer form="rect" intensity={2.2} position={[-4, 0, 2]} rotation-y={Math.PI / 3} scale={[2, 6, 1]} />
        <Lightformer form="rect" intensity={2.2} color={color} position={[4, 0, -1]} rotation-y={-Math.PI / 2.5} scale={[2, 6, 1]} />
        <Lightformer form="ring" intensity={1.2} position={[0, -3, 4]} scale={3} />
      </Environment>
    </>
  );
}

function Model({ slug, flavor, color, view }: { slug: string; flavor: string; color: string; view: ViewerView }) {
  if (view === "device") return <Device accent={color} />;
  if (view === "cone")
    return (
      <group position={[0, -1.25, 0]}>
        <group position={[-0.32, 0, 0]} rotation={[0, 0, 0.08]}>
          <Cone scale={1.08} />
        </group>
        <group position={[0.32, 0, 0.1]} rotation={[0, 1.2, -0.08]}>
          <Cone scale={1.08} />
        </group>
      </group>
    );
  if (slug === "preroll-tube") return <Tube slug={slug} flavor={flavor} open={view === "open"} />;
  return <Pouch slug={slug} flavor={flavor} />;
}

/** How far the product may turn away from the camera, in radians (~30°). */
const MAX_TURN = 0.52;

/**
 * Front-facing rig. The pack always faces the viewer: it sways gently on its
 * own, leans toward the pointer, and can be tilted by dragging, but never
 * turns past ~30°, so its thin side never shows. Touch screens keep vertical
 * scrolling (touch-action: pan-y).
 */
function Rig({
  children,
  mode,
  flavor,
  turn,
  lift,
}: {
  children: React.ReactNode;
  mode: "hero" | "studio";
  flavor: string;
  turn?: { angle: number; nonce: number };
  lift: number;
}) {
  const group = useRef<THREE.Group>(null);
  const { gl, pointer } = useThree();
  const s = useRef({ y: 0, x: 0, dragging: false, lastX: 0, lastY: 0, idle: 10, kick: 0 });

  // New flavour or view: a quick wiggle-and-pop instead of a spin.
  const first = useRef(true);
  useEffect(() => {
    if (first.current) {
      first.current = false;
      return;
    }
    s.current.kick = 1;
  }, [flavor]);

  // Reset button: back to straight-on.
  useEffect(() => {
    if (!turn) return;
    s.current.y = 0;
    s.current.x = 0;
    s.current.idle = 10;
  }, [turn?.nonce]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (mode !== "studio") return;
    const el = gl.domElement;
    el.style.touchAction = "pan-y";
    const st = s.current;
    const down = (e: PointerEvent) => {
      st.dragging = true;
      st.lastX = e.clientX;
      st.lastY = e.clientY;
      el.style.cursor = "grabbing";
    };
    const move = (e: PointerEvent) => {
      if (!st.dragging) return;
      const dx = e.clientX - st.lastX;
      const dy = e.clientY - st.lastY;
      st.lastX = e.clientX;
      st.lastY = e.clientY;
      st.y = THREE.MathUtils.clamp(st.y + dx * 0.006, -MAX_TURN, MAX_TURN);
      if (e.pointerType === "mouse") st.x = THREE.MathUtils.clamp(st.x + dy * 0.004, -0.3, 0.3);
      st.idle = 0;
    };
    const up = () => {
      st.dragging = false;
      el.style.cursor = "grab";
    };
    el.style.cursor = "grab";
    el.addEventListener("pointerdown", down);
    window.addEventListener("pointermove", move);
    window.addEventListener("pointerup", up);
    window.addEventListener("pointercancel", up);
    return () => {
      el.removeEventListener("pointerdown", down);
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerup", up);
      window.removeEventListener("pointercancel", up);
    };
  }, [gl, mode]);

  useFrame(({ clock }, dt) => {
    const g = group.current;
    if (!g) return;
    const st = s.current;
    const t = clock.elapsedTime;
    const sway = Math.sin(t * 0.6) * 0.22;
    st.kick = Math.max(0, st.kick - dt * 1.8);
    const wiggle = st.kick * Math.sin(t * 16) * 0.25;

    let ty: number;
    let tx: number;
    if (mode === "hero") {
      ty = sway + pointer.x * 0.25;
      tx = -pointer.y * 0.15;
    } else {
      if (!st.dragging) {
        st.idle += dt;
        // After letting go, ease back to centre and resume the idle sway.
        if (st.idle > 1.5) {
          st.y = THREE.MathUtils.damp(st.y, 0, 1.2, dt);
          st.x = THREE.MathUtils.damp(st.x, 0, 1.2, dt);
        }
      }
      const idleSway = st.dragging ? 0 : sway * Math.min(1, Math.max(0, st.idle - 1.5));
      ty = st.y + idleSway;
      tx = st.x;
    }
    ty = THREE.MathUtils.clamp(ty, -MAX_TURN, MAX_TURN) + wiggle;
    g.rotation.y = THREE.MathUtils.damp(g.rotation.y, ty, 5, dt);
    g.rotation.x = THREE.MathUtils.damp(g.rotation.x, tx, 5, dt);
    const sc = 1 - st.kick * 0.1 * Math.sin(st.kick * Math.PI);
    g.scale.setScalar(sc);
    g.position.y = THREE.MathUtils.damp(g.position.y, lift, 4, dt);
  });

  return <group ref={group}>{children}</group>;
}

function CameraZoom({ zoom }: { zoom: number }) {
  const { camera, size } = useThree();
  useFrame((_, dt) => {
    // Narrow screens: pull back so the full pack always fits.
    const fit = size.width / size.height < 0.75 ? 1.12 : 1;
    const target = (8.6 * fit) / zoom;
    camera.position.z = THREE.MathUtils.damp(camera.position.z, target, 4, dt);
  });
  return null;
}

export default function Viewer3D({
  slug,
  flavor,
  color,
  view = "pack",
  mode = "studio",
  turn,
  zoom = 1,
  className,
}: ViewerProps) {
  const wrap = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(true);

  // Don't burn battery rendering a canvas that's scrolled away.
  useEffect(() => {
    const el = wrap.current;
    if (!el) return;
    const io = new IntersectionObserver(([e]) => setVisible(e.isIntersecting), { rootMargin: "100px" });
    io.observe(el);
    return () => io.disconnect();
  }, []);

  const lift = slug === "preroll-tube" && view === "open" ? -0.85 : 0;
  const shadowY = slug === "preroll-tube" ? -1.85 : view === "device" ? -1.65 : -1.75;
  const model = <Model slug={slug} flavor={flavor} color={color} view={view} />;

  return (
    <div ref={wrap} className={className}>
      <Canvas
        frameloop={visible ? "always" : "never"}
        dpr={[1, 1.75]}
        camera={{ position: [0, 0, 8.6], fov: 30 }}
        gl={{ antialias: true, alpha: true, powerPreference: "high-performance", toneMapping: THREE.NeutralToneMapping, toneMappingExposure: 1.05 }}

      >
        <Lights color={color} />
        <Suspense fallback={null}>
          <Rig mode={mode} flavor={`${flavor}-${view}`} turn={turn} lift={lift}>
            {mode === "hero" ? (
              <Float speed={2} rotationIntensity={0.08} floatIntensity={0.6}>
                {model}
              </Float>
            ) : (
              model
            )}
          </Rig>
        </Suspense>
        <ContactShadows position={[0, shadowY + lift, 0]} opacity={0.55} scale={6} blur={2.6} far={3} color="#000" />
        <CameraZoom zoom={zoom * (view === "open" ? 0.74 : 1)} />
      </Canvas>
    </div>
  );
}
