import React, { useMemo, useRef } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { EffectComposer, Bloom } from "@react-three/postprocessing";

/* Full-bleed abstract 3D hero: a drifting particle field, a rotating
   wireframe icosahedron core, and a sparse glowing node network — all real
   render-loop animation with pointer-driven parallax, not a static image. */

const CYAN = "#37E7F0";
const COPPER = "#CD8B4F";

function Particles({ count = 900 }) {
  const ref = useRef(null);
  const positions = useMemo(() => {
    const arr = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      const r = 6 + Math.random() * 10;
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);
      arr[i * 3] = r * Math.sin(phi) * Math.cos(theta);
      arr[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta) * 0.6;
      arr[i * 3 + 2] = r * Math.cos(phi);
    }
    return arr;
  }, [count]);

  useFrame((state, delta) => {
    if (!ref.current) return;
    ref.current.rotation.y += delta * 0.025;
    ref.current.rotation.x = Math.sin(state.clock.elapsedTime * 0.05) * 0.08;
  });

  return (
    <points ref={ref}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
      </bufferGeometry>
      <pointsMaterial color={CYAN} size={0.045} transparent opacity={0.55} sizeAttenuation depthWrite={false} />
    </points>
  );
}

function Core() {
  const ref = useRef(null);
  const innerRef = useRef(null);
  useFrame((state, delta) => {
    if (ref.current) { ref.current.rotation.y += delta * 0.12; ref.current.rotation.x += delta * 0.05; }
    if (innerRef.current) innerRef.current.rotation.y -= delta * 0.18;
  });
  return (
    <group>
      <mesh ref={ref}>
        <icosahedronGeometry args={[2.6, 1]} />
        <meshBasicMaterial color={CYAN} wireframe transparent opacity={0.35} />
      </mesh>
      <mesh ref={innerRef}>
        <icosahedronGeometry args={[1.6, 0]} />
        <meshBasicMaterial color={COPPER} wireframe transparent opacity={0.5} />
      </mesh>
    </group>
  );
}

const HUBS = [
  [-6, 2.4, -1], [6.4, 1.6, -2], [-4.6, -2.8, 1], [5.2, -2.2, 0.5],
  [0, 4.4, -3], [-7.2, -1, -2], [7, -0.5, -1.5], [0.5, -4.6, 1],
];

function Hub({ pos, delay }) {
  const ref = useRef(null);
  useFrame((state) => {
    if (!ref.current) return;
    const t = state.clock.elapsedTime;
    const pulse = 1 + Math.sin(t * 1.6 + delay * 5) * 0.25;
    ref.current.scale.setScalar(0.14 * pulse);
    ref.current.material.emissiveIntensity = 1 + Math.sin(t * 1.6 + delay * 5) * 0.6;
  });
  return (
    <mesh ref={ref} position={pos}>
      <sphereGeometry args={[1, 12, 12]} />
      <meshStandardMaterial color={CYAN} emissive={CYAN} emissiveIntensity={1} toneMapped={false} />
    </mesh>
  );
}

function HubLines() {
  const lines = useMemo(() => {
    const arr = [];
    for (let i = 0; i < HUBS.length; i++) {
      const j = (i + 1) % HUBS.length;
      arr.push([HUBS[i], HUBS[j]]);
      if (i % 2 === 0) arr.push([HUBS[i], HUBS[(i + 3) % HUBS.length]]);
    }
    return arr;
  }, []);
  return (
    <>
      {lines.map(([a, b], i) => {
        const positions = new Float32Array([...a, ...b]);
        return (
          <line key={i}>
            <bufferGeometry>
              <bufferAttribute attach="attributes-position" args={[positions, 3]} />
            </bufferGeometry>
            <lineBasicMaterial color={CYAN} transparent opacity={0.18} />
          </line>
        );
      })}
    </>
  );
}

function Rig({ children }) {
  const group = useRef(null);
  useFrame((state) => {
    if (!group.current) return;
    group.current.rotation.y += (state.pointer.x * 0.35 - group.current.rotation.y) * 0.03;
    group.current.rotation.x += (-state.pointer.y * 0.2 - group.current.rotation.x) * 0.03;
  });
  return <group ref={group}>{children}</group>;
}

export default function HeroScene3D() {
  return (
    <Canvas
      camera={{ position: [0, 0, 11], fov: 55 }}
      gl={{ antialias: true, alpha: true }}
      dpr={[1, 1.5]}
      style={{ position: "absolute", inset: 0 }}
    >
      <color attach="background" args={["#070B12"]} />
      <fog attach="fog" args={["#070B12", 10, 22]} />
      <ambientLight intensity={0.5} />
      <Rig>
        <Core />
        <Particles />
        <HubLines />
        {HUBS.map((pos, i) => <Hub key={i} pos={pos} delay={i} />)}
      </Rig>
      <EffectComposer>
        <Bloom mipmapBlur intensity={1.6} luminanceThreshold={0.1} luminanceSmoothing={0.3} />
      </EffectComposer>
    </Canvas>
  );
}
