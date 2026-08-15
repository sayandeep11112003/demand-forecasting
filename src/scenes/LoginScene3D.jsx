import React, { useMemo, useRef, useCallback } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { Line } from "@react-three/drei";
import { EffectComposer, Bloom } from "@react-three/postprocessing";

/* Real photo (transmission towers over a dusk city) as the background, with a
   genuinely live Three.js network-graph layer on top: nodes push away from
   the cursor, pulses travel the lines, edges rewire over time, clicking
   sends an expanding light pulse through the whole graph, and real bloom
   post-processing makes it glow rather than just look bright. */

const CYAN = "#37E7F0";
const CYAN_DIM = "#0FB8C4";

// Full-frame spread (not just a corner) so the overlay reads as one coherent
// network across the whole photo, denser where the real towers sit (right).
const NODES = [
  [-9.4, 3.6], [-8.1, 1.8], [-7.2, 4.2], [-6.3, 2.6], [-5.5, 0.6], [-4.6, 3.4],
  [-3.6, 1.4], [-2.6, 4.0], [-1.6, 2.2], [-0.6, 0.4], [0.4, 3.0], [1.3, 1.2],
  [2.2, 3.6], [3.0, 1.8], [3.8, -0.2], [4.6, 2.6], [5.4, 0.8], [6.2, 3.2],
  [7.0, 1.4], [7.8, -0.6], [8.6, 2.0], [-8.6, -1.4], [-6.4, -1.8], [-4.0, -1.2],
  [-1.4, -1.8], [1.0, -1.4], [3.6, -2.0], [6.0, -1.6],
];

function buildEdges(nodes, { maxDist = 3.1, maxPerNode = 3 } = {}) {
  const edges = [];
  const degree = new Array(nodes.length).fill(0);
  for (let i = 0; i < nodes.length; i++) {
    const dists = [];
    for (let j = 0; j < nodes.length; j++) {
      if (i === j) continue;
      const dx = nodes[i][0] - nodes[j][0], dy = nodes[i][1] - nodes[j][1];
      const d = Math.hypot(dx, dy);
      if (d < maxDist) dists.push([d, j]);
    }
    dists.sort((a, b) => a[0] - b[0]);
    for (const [, j] of dists) {
      if (degree[i] >= maxPerNode || degree[j] >= maxPerNode) continue;
      if (edges.some(([a, b]) => (a === i && b === j) || (a === j && b === i))) continue;
      edges.push([i, j]);
      degree[i]++; degree[j]++;
    }
  }
  return edges;
}

function Ripples() {
  return useRef([]);
}

function Node({ pos, delay, ripples, cursor }) {
  const ref = useRef(null);
  const current = useRef([pos[0], pos[1]]);
  useFrame((state) => {
    if (!ref.current) return;
    const t = state.clock.elapsedTime;
    const grown = Math.min(1, Math.max(0, (t - delay) / 0.6));

    // repel softly from the cursor (in world space)
    const cx = cursor.current[0], cy = cursor.current[1];
    const dx = pos[0] - cx, dy = pos[1] - cy;
    const dist = Math.hypot(dx, dy);
    const influence = Math.max(0, 1 - dist / 2.2);
    const push = influence * 0.45;
    const targetX = pos[0] + (dist > 0.0001 ? (dx / dist) * push : 0);
    const targetY = pos[1] + (dist > 0.0001 ? (dy / dist) * push : 0);
    current.current[0] += (targetX - current.current[0]) * 0.08;
    current.current[1] += (targetY - current.current[1]) * 0.08;
    ref.current.position.set(current.current[0], current.current[1], 0);

    let rippleBoost = 0;
    for (const r of ripples.current) {
      const age = t - r.time;
      const radius = age * 5.5;
      const d = Math.hypot(pos[0] - r.x, pos[1] - r.y);
      const band = Math.abs(d - radius);
      if (band < 0.6) rippleBoost = Math.max(rippleBoost, (1 - band / 0.6) * 2.2);
    }

    const pulse = 1 + Math.sin(t * 2.2 + delay * 7) * 0.15 + influence * 0.5;
    ref.current.scale.setScalar(grown * pulse * 0.13);
    ref.current.material.emissiveIntensity = 1.2 + Math.sin(t * 2.2 + delay * 7) * 0.5 + influence * 1.8 + rippleBoost;
  });
  return (
    <mesh ref={ref} scale={0}>
      <sphereGeometry args={[1, 14, 14]} />
      <meshStandardMaterial color={CYAN} emissive={CYAN} emissiveIntensity={1.2} toneMapped={false} />
    </mesh>
  );
}

function Edge({ a, b, delay, fadeSeed, ripples }) {
  const ref = useRef(null);
  const mid = [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2];
  useFrame((state) => {
    if (!ref.current?.material) return;
    const t = state.clock.elapsedTime;
    const grown = Math.min(1, Math.max(0, (t - delay) / 0.6));
    const flicker = 0.5 + Math.sin(t * 1.4 + fadeSeed * 9) * 0.2;

    let rippleBoost = 0;
    for (const r of ripples.current) {
      const age = t - r.time;
      const radius = age * 5.5;
      const d = Math.hypot(mid[0] - r.x, mid[1] - r.y);
      const band = Math.abs(d - radius);
      if (band < 0.6) rippleBoost = Math.max(rippleBoost, (1 - band / 0.6) * 0.8);
    }

    ref.current.material.opacity = Math.min(1, grown * flicker + rippleBoost);
  });
  return <Line ref={ref} points={[[a[0], a[1], 0], [b[0], b[1], 0]]} color={CYAN_DIM} lineWidth={1.4} transparent opacity={0} />;
}

function Pulse({ a, b, speed, delay }) {
  const ref = useRef(null);
  useFrame((state) => {
    if (!ref.current) return;
    const t = state.clock.elapsedTime;
    if (t < delay) { ref.current.visible = false; return; }
    ref.current.visible = true;
    const p = ((t - delay) * speed) % 1;
    ref.current.position.set(a[0] + (b[0] - a[0]) * p, a[1] + (b[1] - a[1]) * p, 0.01);
  });
  return (
    <mesh ref={ref}>
      <sphereGeometry args={[0.06, 8, 8]} />
      <meshStandardMaterial color="#FFFFFF" emissive={CYAN} emissiveIntensity={3} toneMapped={false} />
    </mesh>
  );
}

function InteractiveNetwork() {
  const { viewport } = useThree();
  const cursor = useRef([0, 0]);
  const elapsed = useRef(0);
  const ripples = Ripples();

  const edges = useMemo(() => buildEdges(NODES).map((e, i) => ({ e, delay: i * 0.06, seed: i })), []);
  const pulses = useMemo(() => edges.filter((_, i) => i % 3 === 0).map(({ e }, i) => ({
    e, speed: 0.15 + (i % 4) * 0.05, delay: i * 0.5,
  })), [edges]);

  useFrame((state) => {
    elapsed.current = state.clock.elapsedTime;
    cursor.current = [(state.pointer.x * viewport.width) / 2, (state.pointer.y * viewport.height) / 2];
  });

  const onClick = useCallback((e) => {
    ripples.current.push({ x: e.point.x, y: e.point.y, time: elapsed.current });
    if (ripples.current.length > 5) ripples.current.shift();
  }, [ripples]);

  return (
    <group>
      <mesh position={[0, 0, -0.1]} onPointerDown={onClick}>
        <planeGeometry args={[40, 20]} />
        <meshBasicMaterial transparent opacity={0} depthWrite={false} />
      </mesh>
      {edges.map(({ e, delay, seed }, i) => (
        <Edge key={i} a={NODES[e[0]]} b={NODES[e[1]]} delay={delay} fadeSeed={seed} ripples={ripples} />
      ))}
      {NODES.map((pos, i) => <Node key={i} pos={pos} delay={i * 0.08} ripples={ripples} cursor={cursor} />)}
      {pulses.map(({ e, speed, delay }, i) => (
        <Pulse key={i} a={NODES[e[0]]} b={NODES[e[1]]} speed={speed} delay={delay} />
      ))}
    </group>
  );
}

export default function LoginScene3D() {
  return (
    <div style={{ position: "absolute", inset: 0, overflow: "hidden" }}>
      <img
        src="/scene/port-network.jpg"
        alt=""
        style={{
          position: "absolute", inset: 0, width: "100%", height: "100%",
          objectFit: "cover", objectPosition: "50% 35%",
        }}
      />
      <Canvas
        orthographic
        camera={{ zoom: 48, position: [0, 0, 10] }}
        gl={{ alpha: true, antialias: true }}
        style={{ position: "absolute", inset: 0 }}
        dpr={[1, 1.5]}
      >
        <ambientLight intensity={0.6} />
        <InteractiveNetwork />
        <EffectComposer>
          <Bloom mipmapBlur intensity={1.4} luminanceThreshold={0.15} luminanceSmoothing={0.3} />
        </EffectComposer>
      </Canvas>
    </div>
  );
}
