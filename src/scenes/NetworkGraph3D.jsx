import React, { useMemo, useRef, useState } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { OrbitControls, Html, Line } from "@react-three/drei";
import { EffectComposer, Bloom } from "@react-three/postprocessing";

/* Interactive 3D supply-chain graph for the dashboard: suppliers on an outer
   ring, projects on an inner ring, edges drawn from real purchase-order
   relationships. Drag to orbit, scroll to zoom, click a node to navigate —
   this is a real spatial encoding of the data, not a decorative spinner. */

const DARK = {
  panel: "#151B23", border: "#2A3341", text: "#E8ECF2", muted: "#8A95A6",
  copper: "#CD8B4F", cyan: "#5AB2C9", green: "#5FB489", amber: "#E0A458", red: "#D9705F",
};

const PROJECT_TONE = {
  Planning: DARK.muted, Procurement: DARK.cyan, Construction: DARK.copper,
  Testing: DARK.amber, Commissioned: DARK.green, "On Hold": DARK.red, Cancelled: DARK.red,
};
const RISK_TONE = { Low: DARK.green, Medium: DARK.amber, High: DARK.red };

function ringPositions(count, radius, y) {
  return Array.from({ length: count }, (_, i) => {
    const a = (i / count) * Math.PI * 2;
    return [Math.cos(a) * radius, y, Math.sin(a) * radius];
  });
}

function Node({ position, color, size, label, onClick, hovered, onHover, seed }) {
  const ref = useRef(null);
  const elapsed = useRef(0);
  const flashAt = useRef(-10);
  useFrame((state) => {
    if (!ref.current) return;
    const t = state.clock.elapsedTime;
    elapsed.current = t;
    const idle = 1 + Math.sin(t * 1.6 + seed * 6) * 0.06;
    const target = (hovered ? size * 1.4 : size) * idle;
    ref.current.scale.x += (target - ref.current.scale.x) * 0.2;
    ref.current.scale.y = ref.current.scale.z = ref.current.scale.x;
    const flash = Math.max(0, 1 - (t - flashAt.current) / 0.6) * 2.5;
    ref.current.material.emissiveIntensity = (hovered ? 1.1 : 0.55) + Math.sin(t * 1.6 + seed * 6) * 0.15 + flash;
  });
  return (
    <group position={position}>
      <mesh
        ref={ref}
        onPointerOver={(e) => { e.stopPropagation(); onHover(true); }}
        onPointerOut={(e) => { e.stopPropagation(); onHover(false); }}
        onClick={(e) => { e.stopPropagation(); flashAt.current = elapsed.current; onClick(); }}
      >
        <sphereGeometry args={[1, 20, 20]} />
        <meshStandardMaterial color={color} emissive={color} emissiveIntensity={0.55} toneMapped={false} />
      </mesh>
      {hovered && (
        <Html center distanceFactor={9} style={{ pointerEvents: "none" }}>
          <div style={{
            background: DARK.panel, border: `1px solid ${DARK.border}`, borderRadius: 6,
            padding: "4px 8px", fontSize: 11, color: DARK.text, whiteSpace: "nowrap",
            fontFamily: "'JetBrains Mono',ui-monospace,monospace",
          }}>{label}</div>
        </Html>
      )}
    </group>
  );
}

function EdgePulse({ a, b, speed, delay }) {
  const ref = useRef(null);
  useFrame((state) => {
    if (!ref.current) return;
    const t = state.clock.elapsedTime;
    const p = ((t * speed + delay) % 1);
    ref.current.position.set(a[0] + (b[0] - a[0]) * p, a[1] + (b[1] - a[1]) * p, a[2] + (b[2] - a[2]) * p);
  });
  return (
    <mesh ref={ref}>
      <sphereGeometry args={[0.045, 8, 8]} />
      <meshStandardMaterial color="#FFFFFF" emissive={DARK.cyan} emissiveIntensity={2.2} toneMapped={false} />
    </mesh>
  );
}

function Scene({ db, go }) {
  const [hoveredId, setHoveredId] = useState(null);

  const projects = db.projects.slice(0, 10);
  const suppliers = db.suppliers.slice(0, 12);

  const projectPos = useMemo(() => ringPositions(projects.length, 2.1, 0), [projects.length]);
  const supplierPos = useMemo(() => ringPositions(suppliers.length, 4.2, 0), [suppliers.length]);

  const edges = useMemo(() => {
    const seen = new Set();
    const list = [];
    db.purchase_orders.forEach((po) => {
      const pi = projects.findIndex((p) => p.project_id === po.project_id);
      const si = suppliers.findIndex((s) => s.supplier_id === po.supplier_id);
      if (pi === -1 || si === -1) return;
      const key = `${pi}-${si}`;
      if (seen.has(key)) return;
      seen.add(key);
      list.push([projectPos[pi], supplierPos[si]]);
    });
    return list;
  }, [db.purchase_orders, projects, suppliers, projectPos, supplierPos]);

  const groupRef = useRef(null);
  useFrame((_, delta) => {
    if (groupRef.current && hoveredId === null) groupRef.current.rotation.y += delta * 0.08;
  });

  return (
    <group ref={groupRef}>
      {edges.map(([a, b], i) => (
        <Line key={i} points={[a, b]} color={DARK.border} lineWidth={1} transparent opacity={0.55} />
      ))}
      {edges.filter((_, i) => i % 2 === 0).map(([a, b], i) => (
        <EdgePulse key={i} a={a} b={b} speed={0.12 + (i % 3) * 0.04} delay={i * 0.37} />
      ))}
      {projects.map((p, i) => (
        <Node key={p.project_id} position={projectPos[i]} seed={i}
          color={PROJECT_TONE[p.project_status] || DARK.muted}
          size={0.16 + (p.percent_complete / 100) * 0.14}
          label={`${p.project_name} · ${p.project_status}`}
          hovered={hoveredId === p.project_id}
          onHover={(v) => setHoveredId(v ? p.project_id : null)}
          onClick={() => go("projects")} />
      ))}
      {suppliers.map((s, i) => (
        <Node key={s.supplier_id} position={supplierPos[i]} seed={i + 20}
          color={RISK_TONE[s._risk_band] || DARK.muted}
          size={0.11 + Math.min(s._orders_ytd, 200) / 200 * 0.1}
          label={`${s.supplier_name} · ${s._risk_band} risk`}
          hovered={hoveredId === s.supplier_id}
          onHover={(v) => setHoveredId(v ? s.supplier_id : null)}
          onClick={() => go("suppliers")} />
      ))}
    </group>
  );
}

export default function NetworkGraph3D({ db, go }) {
  return (
    <Canvas camera={{ position: [0, 3.2, 7.5], fov: 45 }} dpr={[1, 1.5]} style={{ width: "100%", height: "100%" }}>
      <color attach="background" args={[DARK.panel]} />
      <ambientLight intensity={0.7} />
      <pointLight position={[5, 6, 5]} intensity={1.2} />
      <Scene db={db} go={go} />
      <OrbitControls enablePan={false} minDistance={4} maxDistance={13} autoRotate={false} />
      <EffectComposer>
        <Bloom mipmapBlur intensity={1.1} luminanceThreshold={0.25} luminanceSmoothing={0.3} />
      </EffectComposer>
    </Canvas>
  );
}
