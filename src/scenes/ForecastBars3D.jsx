import React, { useMemo, useRef, useState } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { Html, OrbitControls } from "@react-three/drei";
import { EffectComposer, Bloom } from "@react-three/postprocessing";

/* Interactive 3D comparison of next-month forecast vs. each category's own
   recent average — bar height is "% of typical" so wildly different units
   (km, MT, units) are comparable at a glance. Click a bar to select that
   category, driving the 2D chart above it — real functional integration,
   not a decorative extra. */

const TONE = { under: "#5FB489", near: "#5AB2C9", over: "#E0A458", spike: "#D9705F" };
function toneFor(pct) {
  if (pct > 130) return TONE.spike;
  if (pct > 112) return TONE.over;
  if (pct < 88) return TONE.under;
  return TONE.near;
}

function Bar({ x, height, color, label, pct, active, onClick, hovered, onHover }) {
  const ref = useRef(null);
  useFrame((state, delta) => {
    if (!ref.current) return;
    const target = Math.max(0.05, height * (active ? 1.08 : 1) * (hovered ? 1.05 : 1));
    ref.current.scale.y += (target - ref.current.scale.y) * Math.min(1, delta * 6);
    ref.current.position.y = ref.current.scale.y / 2;
    const mat = ref.current.material;
    mat.emissiveIntensity = (active ? 1.1 : 0.4) + (hovered ? 0.6 : 0) + Math.sin(state.clock.elapsedTime * 2 + x) * 0.08;
  });
  return (
    <group position={[x, 0, 0]}>
      <mesh
        ref={ref} scale={[0.62, 0.05, 0.62]} position={[0, 0.025, 0]}
        onPointerOver={(e) => { e.stopPropagation(); onHover(true); }}
        onPointerOut={(e) => { e.stopPropagation(); onHover(false); }}
        onClick={(e) => { e.stopPropagation(); onClick(); }}
      >
        <boxGeometry args={[1, 1, 1]} />
        <meshStandardMaterial color={color} emissive={color} emissiveIntensity={0.4} toneMapped={false} />
      </mesh>
      {(hovered || active) && (
        <Html position={[0, height + 0.5, 0]} center distanceFactor={7} style={{ pointerEvents: "none" }}>
          <div style={{
            background: "#151B23", border: "1px solid #2A3341", borderRadius: 6, padding: "5px 9px",
            fontSize: 10.5, color: "#E8ECF2", whiteSpace: "nowrap", fontFamily: "'JetBrains Mono',ui-monospace,monospace", textAlign: "center",
          }}>
            <div style={{ fontWeight: 600 }}>{label}</div>
            <div style={{ color: pct > 100 ? "#E0A458" : "#5AB2C9" }}>{pct.toFixed(0)}% of typical</div>
          </div>
        </Html>
      )}
    </group>
  );
}

function Scene({ bars, cat, onSelect }) {
  const [hoveredIdx, setHoveredIdx] = useState(-1);
  const spacing = 1.5;
  const offset = ((bars.length - 1) * spacing) / 2;
  return (
    <>
      <mesh position={[0, -0.02, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[bars.length * spacing + 1.5, 3]} />
        <meshStandardMaterial color="#1B222C" />
      </mesh>
      {bars.map((b, i) => (
        <Bar key={b.category} x={i * spacing - offset} height={b.height} color={toneFor(b.pct)}
          label={b.category} pct={b.pct} active={b.category === cat}
          hovered={hoveredIdx === i} onHover={(v) => setHoveredIdx(v ? i : -1)}
          onClick={() => onSelect(b.category)} />
      ))}
    </>
  );
}

export default function ForecastBars3D({ categories, series, cat, onSelect }) {
  const bars = useMemo(() => categories.map((category) => {
    const s = series[category];
    const avg = s.historical.reduce((a, b) => a + b, 0) / s.historical.length;
    const pct = (s.forecast[0] / avg) * 100;
    return { category, pct, height: Math.max(0.3, Math.min(3.2, (pct / 100) * 1.8)) };
  }), [categories, series]);

  return (
    <Canvas camera={{ position: [0, 3.4, 7.5], fov: 40 }} dpr={[1, 1.5]} style={{ width: "100%", height: "100%" }}>
      <color attach="background" args={["#151B23"]} />
      <ambientLight intensity={0.8} />
      <pointLight position={[4, 6, 4]} intensity={1} />
      <Scene bars={bars} cat={cat} onSelect={onSelect} />
      <OrbitControls enablePan={false} minDistance={4} maxDistance={11} maxPolarAngle={Math.PI / 2.1} />
      <EffectComposer>
        <Bloom mipmapBlur intensity={0.9} luminanceThreshold={0.3} luminanceSmoothing={0.3} />
      </EffectComposer>
    </Canvas>
  );
}
