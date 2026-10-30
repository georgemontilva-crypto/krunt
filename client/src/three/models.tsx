import { RoundedBox, useTexture } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import { useEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import { tex } from "@/lib/store";

/* ─── Helpers ────────────────────────────────────────────────────────────── */

const smooth = (e0: number, e1: number, x: number) => {
  const t = Math.min(1, Math.max(0, (x - e0) / (e1 - e0)));
  return t * t * (3 - 2 * t);
};

function prepTexture(t: THREE.Texture) {
  t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = 16;
  t.needsUpdate = true;
  return t;
}

/** Canvas texture, drawn once. Used for the paper and the crutch print. */
function useCanvasTexture(w: number, h: number, draw: (ctx: CanvasRenderingContext2D) => void, deps: unknown[] = []) {
  return useMemo(() => {
    const c = document.createElement("canvas");
    c.width = w;
    c.height = h;
    draw(c.getContext("2d")!);
    const t = new THREE.CanvasTexture(c);
    t.colorSpace = THREE.SRGBColorSpace;
    t.wrapS = t.wrapT = THREE.RepeatWrapping;
    t.anisotropy = 8;
    return t;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);
}

/* ─── Mylar pouch ────────────────────────────────────────────────────────── */

const POUCH_W = 1.34;
const POUCH_H = 3.2;

/**
 * A stand-up mylar pouch. The middle is puffed out by the product, the top
 * and bottom are flat crimped heat seals, and the sides pull in slightly as
 * the film stretches over the belly, like a real filled bag. The outline
 * (tear notches included) comes from the alpha of the printed artwork.
 */
function usePouchGeometry() {
  return useMemo(() => {
    const g = new THREE.PlaneGeometry(POUCH_W, POUCH_H, 64, 150);
    const p = g.attributes.position;
    for (let i = 0; i < p.count; i++) {
      const x = p.getX(i);
      const u = x / POUCH_W + 0.5;
      const v = p.getY(i) / POUCH_H + 0.5;
      const across = Math.pow(Math.max(0, Math.sin(Math.PI * u)), 0.42);
      // Flat seals: bottom 6%, top 10%; soft shoulders into the belly.
      const along = smooth(0.04, 0.2, v) * smooth(0.92, 0.74, v);
      const belly = 1 + 0.3 * (1 - v);
      let z = 0.24 * across * along * belly;
      // Crimp texture on the seals: fine vertical ridges catch the light.
      const seal = v > 0.9 || v < 0.055 ? 1 : 0;
      z += seal * 0.0045 * Math.sin(u * POUCH_W * 260);
      // Film shrinks sideways where it bulges.
      p.setX(i, x * (1 - 0.05 * along * across));
      p.setZ(i, z);
    }
    g.computeVertexNormals();
    return g;
  }, []);
}

export function Pouch({ slug, flavor }: { slug: string; flavor: string }) {
  const geo = usePouchGeometry();
  const [front, back] = useTexture([tex(slug, flavor, "front"), tex(slug, flavor, "back")]);
  useMemo(() => [front, back].forEach(prepTexture), [front, back]);

  // Glossy laminated mylar: clear coat over a slightly satin print, with a
  // touch of self-illumination so the art stays readable when turned away.
  const mat = (map: THREE.Texture) => (
    <meshPhysicalMaterial
      map={map}
      emissiveMap={map}
      emissive="#ffffff"
      emissiveIntensity={0.12}
      alphaTest={0.5}
      roughness={0.42}
      metalness={0.15}
      clearcoat={1}
      clearcoatRoughness={0.12}
      sheen={0.4}
      sheenColor="#ffffff"
      side={THREE.FrontSide}
    />
  );
  return (
    <group>
      <mesh geometry={geo}>{mat(front)}</mesh>
      <mesh geometry={geo} rotation={[0, Math.PI, 0]}>
        {mat(back)}
      </mesh>
    </group>
  );
}

/* ─── Pre-roll cone ──────────────────────────────────────────────────────── */

/** Profile of a cone pre-roll, filter at y=0, twisted tip at the top. */
const CONE_PROFILE: [number, number][] = [
  [0.0, 0.0],
  [0.068, 0.0],
  [0.072, 0.02],
  [0.074, 0.5],
  [0.078, 0.56],
  [0.1, 1.2],
  [0.122, 1.85],
  [0.13, 2.1],
  [0.126, 2.2],
  [0.1, 2.28],
  [0.05, 2.33],
  [0.022, 2.36],
  [0.012, 2.44],
  [0.0, 2.47],
];
const FILTER_TOP = 0.5;

export function Cone({ scale = 1 }: { scale?: number }) {
  const { body, crutch } = useMemo(() => {
    const pts = CONE_PROFILE.map(([r, y]) => new THREE.Vector2(r, y));
    const split = CONE_PROFILE.findIndex(([, y]) => y >= FILTER_TOP);
    return {
      crutch: new THREE.LatheGeometry(pts.slice(0, split + 1), 48),
      body: new THREE.LatheGeometry(pts.slice(split), 48),
    };
  }, []);

  // Hemp paper flecked with ground flower showing through.
  const paper = useCanvasTexture(512, 512, ctx => {
    ctx.fillStyle = "#c9b98c";
    ctx.fillRect(0, 0, 512, 512);
    const tones = ["#7f8a3a", "#5f6b28", "#9c9150", "#b8a76c", "#6d5a2c", "#a3b04a"];
    for (let i = 0; i < 5200; i++) {
      ctx.fillStyle = tones[i % tones.length];
      ctx.globalAlpha = 0.25 + Math.random() * 0.6;
      const s = 1 + Math.random() * 5;
      ctx.fillRect(Math.random() * 512, Math.random() * 512, s, s * (0.4 + Math.random()));
    }
    ctx.globalAlpha = 0.12;
    ctx.strokeStyle = "#fff";
    for (let y = 0; y < 512; y += 9) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(512, y + 30);
      ctx.stroke();
    }
  });

  // Black crutch with the wordmark printed down it.
  const print = useCanvasTexture(512, 256, ctx => {
    ctx.fillStyle = "#0b0b0b";
    ctx.fillRect(0, 0, 512, 256);
    ctx.save();
    ctx.translate(128, 128);
    ctx.rotate(-Math.PI / 2);
    ctx.fillStyle = "#fff";
    ctx.font = "bold 46px 'Permanent Marker', sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText("KRUNK'D", 0, 0);
    ctx.restore();
  });

  return (
    <group scale={scale}>
      <mesh geometry={body} >
        <meshStandardMaterial map={paper} roughness={0.92} bumpMap={paper} bumpScale={0.6} />
      </mesh>
      <mesh geometry={crutch} >
        <meshStandardMaterial map={print} roughness={0.5} />
      </mesh>
    </group>
  );
}

/* ─── Pre-roll tube (opens) ──────────────────────────────────────────────── */

const TUBE_R = 0.28;
const LABEL_H = TUBE_R * 2 * 5.46;
const CAP_H = 0.25;
const BASE_H = 0.13;

/**
 * Crush-proof tube. `open` lifts the cap off and slides the pre-roll out:
 * the move the real thing makes in your hand.
 */
export function Tube({ slug, flavor, open }: { slug: string; flavor: string; open: boolean }) {
  const wrap = useTexture(tex(slug, flavor, "wrap"));
  useMemo(() => {
    prepTexture(wrap);
    wrap.wrapS = THREE.RepeatWrapping;
    // The wrap is [front photo, 150°][back label, 210°]. The cylinder's u=0
    // faces the camera, so shift the front's centre (75° in) onto it.
    wrap.offset.x = 75 / 360;
  }, [wrap]);

  const cap = useRef<THREE.Group>(null);
  const cone = useRef<THREE.Group>(null);
  const t = useRef(0);
  const total = LABEL_H + CAP_H + BASE_H;
  const y0 = -total / 2;

  useFrame((_, dt) => {
    t.current = THREE.MathUtils.damp(t.current, open ? 1 : 0, 4, dt);
    const k = t.current;
    if (cap.current) {
      cap.current.position.y = y0 + BASE_H + LABEL_H + CAP_H / 2 + k * 1.15;
      cap.current.position.x = k * 0.55;
      cap.current.rotation.z = -k * 0.9;
    }
    if (cone.current) {
      cone.current.position.y = y0 + 0.4 + smooth(0.15, 1, k) * 2.2;
      cone.current.visible = k > 0.02;
    }
  });

  const black = <meshPhysicalMaterial color="#070707" roughness={0.18} metalness={0.2} clearcoat={1} clearcoatRoughness={0.08} />;

  return (
    <group>
      <mesh position={[0, y0 + BASE_H / 2, 0]} >
        <cylinderGeometry args={[TUBE_R * 1.01, TUBE_R * 1.01, BASE_H, 64]} />
        {black}
      </mesh>
      <mesh position={[0, y0 + BASE_H + LABEL_H / 2, 0]} >
        <cylinderGeometry args={[TUBE_R, TUBE_R, LABEL_H, 96, 1, true]} />
        <meshPhysicalMaterial map={wrap} emissiveMap={wrap} emissive="#ffffff" emissiveIntensity={0.1} roughness={0.4} clearcoat={0.9} clearcoatRoughness={0.15} side={THREE.FrontSide} />
      </mesh>
      {/* Inner wall, seen when the cap is off. */}
      <mesh position={[0, y0 + BASE_H + LABEL_H / 2, 0]}>
        <cylinderGeometry args={[TUBE_R * 0.97, TUBE_R * 0.97, LABEL_H, 48, 1, true]} />
        <meshStandardMaterial color="#050505" side={THREE.BackSide} />
      </mesh>
      <group ref={cap}>
        <mesh >
          <cylinderGeometry args={[TUBE_R * 1.06, TUBE_R * 1.06, CAP_H, 64]} />
          {black}
        </mesh>
        {/* Grip ridges */}
        {Array.from({ length: 3 }).map((_, i) => (
          <mesh key={i} position={[0, -CAP_H / 2 + 0.05 + i * 0.07, 0]} rotation={[Math.PI / 2, 0, 0]}>
            <torusGeometry args={[TUBE_R * 1.065, 0.008, 6, 64]} />
            {black}
          </mesh>
        ))}
      </group>
      <group ref={cone} visible={false}>
        <Cone scale={1.1} />
      </group>
    </group>
  );
}

/* ─── Disposable device ──────────────────────────────────────────────────── */

const DEV_W = 0.92;
const DEV_H = 2.45;
const DEV_D = 0.42;

/** The 1 g disposable that ships inside the pouch, rebuilt from the pack shot. */
export function Device({ accent }: { accent: string }) {
  const [mark, word] = useTexture(["/brand/mark-white.svg", "/brand/wordmark-white.svg"]);
  const decal = useMemo(() => {
    const c = document.createElement("canvas");
    c.width = 512;
    c.height = 512;
    const ctx = c.getContext("2d")!;
    const mi = mark.image as HTMLImageElement;
    const wi = word.image as HTMLImageElement;
    const mw = 250;
    const mh = (mw * (mi.height || 1018)) / (mi.width || 856);
    ctx.drawImage(mi, (512 - mw) / 2, 20, mw, mh);
    const ww = 440;
    const wh = (ww * (wi.height || 376)) / (wi.width || 1723);
    ctx.drawImage(wi, (512 - ww) / 2, 40 + mh, ww, wh);
    const t = new THREE.CanvasTexture(c);
    t.colorSpace = THREE.SRGBColorSpace;
    return t;
  }, [mark, word]);

  const liquid = useRef<THREE.MeshPhysicalMaterial>(null);
  useFrame(({ clock }) => {
    if (liquid.current) liquid.current.emissiveIntensity = 0.18 + Math.sin(clock.elapsedTime * 2) * 0.06;
  });
  useEffect(() => () => decal.dispose(), [decal]);

  const shell = <meshPhysicalMaterial color="#141416" roughness={0.6} metalness={0.25} clearcoat={0.3} clearcoatRoughness={0.6} />;
  return (
    <group>
      <RoundedBox args={[DEV_W, DEV_H, DEV_D]} radius={0.13} smoothness={6} >
        {shell}
      </RoundedBox>
      {/* Mouthpiece */}
      <RoundedBox args={[DEV_W * 0.78, 0.5, DEV_D * 0.86]} radius={0.12} smoothness={6} position={[0, DEV_H / 2 + 0.2, 0]} >
        <meshPhysicalMaterial color="#0a0a0a" roughness={0.25} clearcoat={1} />
      </RoundedBox>
      <mesh position={[0, DEV_H / 2 + 0.455, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <capsuleGeometry args={[0.035, 0.2, 4, 12]} />
        <meshStandardMaterial color="#000" />
      </mesh>
      {/* Oil window */}
      <group position={[DEV_W * 0.2, DEV_H / 2 - 0.62, DEV_D / 2 - 0.02]}>
        <mesh>
          <boxGeometry args={[0.36, 0.95, 0.06]} />
          <meshPhysicalMaterial
            ref={liquid}
            color="#b86e08"
            emissive="#ff7a00"
            emissiveIntensity={0.35}
            roughness={0.08}
            metalness={0.1}
            clearcoat={1}
            transparent
            opacity={0.94}
          />
        </mesh>
        <mesh position={[0, 0, 0.035]}>
          <cylinderGeometry args={[0.06, 0.06, 0.9, 24]} />
          <meshStandardMaterial color="#d8b25a" metalness={1} roughness={0.25} />
        </mesh>
      </group>
      {/* Logo print */}
      <mesh position={[-0.02, -0.38, DEV_D / 2 + 0.002]}>
        <planeGeometry args={[0.66, 0.66]} />
        <meshStandardMaterial map={decal} transparent roughness={0.6} />
      </mesh>
      {/* Status light: the flavour colour, the only colour on the device */}
      <mesh position={[0, -DEV_H / 2 + 0.2, DEV_D / 2 + 0.003]}>
        <planeGeometry args={[0.3, 0.035]} />
        <meshStandardMaterial color={accent} emissive={accent} emissiveIntensity={1.4} toneMapped={false} />
      </mesh>
    </group>
  );
}
