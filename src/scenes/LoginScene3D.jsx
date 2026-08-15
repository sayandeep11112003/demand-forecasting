import React, { useMemo, useRef } from "react";
import { Canvas, useFrame } from "@react-three/fiber";

/* Real photo (transmission towers over a dusk city) as the background, with a
   genuinely live Three.js network-graph layer rendered on top in a
   transparent canvas: nodes pulse, pulses travel the lines, edges rewire
   over time, and the whole layer parallaxes against the fixed photo as the
   pointer moves — everything animates on the actual render loop. */

const CYAN = "#37E7F0";
const CYAN_DIM = "#1FA8B3";

// Hand-placed to echo the reference photo's network composition: dense
// upper-left, thinning out toward the lower-right where the real towers sit.
const NODES = [
  [-7.6, 3.3], [-6.4, 2.2], [-5.0, 3.6], [-4.6, 1.4], [-3.0, 2.6],
  [-1.6, 3.7], [-0.4, 1.8], [1.1, 2.9], [2.4, 1.1], [3.6, 2.4],
  [-6.8, -0.4], [-4.2, -1.1], [-1.2, -0.6], [1.6, -1.4], [4.2, 0.2],
  [-2.6, 0.6], [0.4, 0.3],
];

const BASE_EDGES = [
  [0, 1], [1, 2], [1, 3], [2, 4], [3, 4], [4, 5], [5, 6], [6, 7], [7, 8], [8, 9],
  [1, 10], [3, 11], [6, 12], [8, 13], [9, 14], [10, 11], [11, 15], [12, 15],
  [12, 16], [13, 16], [4, 15], [7, 16],
];
// Extra candidate edges the network occasionally "rewires" into, for a
// visibly live, changing graph rather than a static frozen mesh.
const CANDIDATE_EDGES = [
  [0, 2], [2, 5], [5, 7], [9, 13], [10, 12], [14, 16], [3, 15], [6, 16], [2, 15],
];

function Rig({ children }) {
  const group = useRef(null);
  useFrame((state) => {
    if (!group.current) return;
    group.current.position.x += (state.pointer.x * 0.55 - group.current.position.x) * 0.04;
    group.current.position.y += (state.pointer.y * 0.35 - group.current.position.y) * 0.04;
  });
  return <group ref={group}>{children}</group>;
}

function Node({ pos, delay }) {
  const ref = useRef(null);
  const born = useRef(false);
  useFrame((state) => {
    if (!ref.current) return;
    const t = state.clock.elapsedTime;
    const grown = Math.min(1, Math.max(0, (t - delay) / 0.6));
    const pulse = 1 + Math.sin(t * 2.2 + delay * 7) * 0.12;
    ref.current.scale.setScalar(grown * pulse * 0.11);
    ref.current.material.emissiveIntensity = 1.1 + Math.sin(t * 2.2 + delay * 7) * 0.5;
  });
  return (
    <mesh ref={ref} position={[pos[0], pos[1], 0]} scale={0}>
      <sphereGeometry args={[1, 12, 12]} />
      <meshStandardMaterial color={CYAN} emissive={CYAN} emissiveIntensity={1.2} toneMapped={false} />
    </mesh>
  );
}

function Edge({ a, b, delay, fadeSeed }) {
  const matRef = useRef(null);
  const positions = useMemo(() => new Float32Array([a[0], a[1], 0, b[0], b[1], 0]), [a, b]);
  useFrame((state) => {
    if (!matRef.current) return;
    const t = state.clock.elapsedTime;
    const grown = Math.min(1, Math.max(0, (t - delay) / 0.6));
    const flicker = 0.55 + Math.sin(t * 1.4 + fadeSeed * 9) * 0.2;
    matRef.current.opacity = grown * flicker;
  });
  return (
    <line>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
      </bufferGeometry>
      <lineBasicMaterial ref={matRef} color={CYAN_DIM} transparent opacity={0} />
    </line>
  );
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
      <sphereGeometry args={[0.055, 8, 8]} />
      <meshStandardMaterial color="#FFFFFF" emissive={CYAN} emissiveIntensity={2.4} toneMapped={false} />
    </mesh>
  );
}

function NetworkOverlay() {
  const edges = useMemo(() => {
    const all = [...BASE_EDGES.map((e, i) => ({ e, delay: i * 0.08, seed: i }))];
    CANDIDATE_EDGES.forEach((e, i) => all.push({ e, delay: 4 + i * 1.6, seed: 100 + i }));
    return all;
  }, []);

  const pulses = useMemo(() => BASE_EDGES.filter((_, i) => i % 3 === 0).map((e, i) => ({
    e, speed: 0.16 + (i % 4) * 0.05, delay: i * 0.6,
  })), []);

  return (
    <Rig>
      {edges.map(({ e, delay, seed }, i) => (
        <Edge key={i} a={NODES[e[0]]} b={NODES[e[1]]} delay={delay} fadeSeed={seed} />
      ))}
      {NODES.map((pos, i) => <Node key={i} pos={pos} delay={i * 0.09} />)}
      {pulses.map(({ e, speed, delay }, i) => (
        <Pulse key={i} a={NODES[e[0]]} b={NODES[e[1]]} speed={speed} delay={delay} />
      ))}
    </Rig>
  );
}

export default function LoginScene3D() {
  return (
    <div style={{ position: "absolute", inset: 0, overflow: "hidden" }}>
      <img
        src="/scene/grid-network.jpg"
        alt=""
        style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover", objectPosition: "60% 40%" }}
      />
      <Canvas
        orthographic
        camera={{ zoom: 55, position: [0, 0, 10] }}
        gl={{ alpha: true, antialias: true }}
        style={{ position: "absolute", inset: 0 }}
        dpr={[1, 1.5]}
      >
        <ambientLight intensity={0.6} />
        <NetworkOverlay />
      </Canvas>
    </div>
  );
}
