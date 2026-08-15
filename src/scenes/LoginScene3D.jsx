import React, { useMemo, useRef } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { Sparkles } from "@react-three/drei";
import * as THREE from "three";

/* Real 3D scene (not a 2D image) for the login background. Camera parallaxes
   with the pointer for a genuine "interacting" feel; every moving piece here
   (turbine blades, current pulses, the truck, the ship) animates via
   useFrame on the actual render loop, not CSS. */

const PALETTE = {
  ground: "#E4ECF4", groundFar: "#CFDCE9",
  structure: "#96A6BA", structureDark: "#7C8CA0",
  copper: "#C1793C", cyan: "#2694AE",
  water: "#BFD6E5",
  sky: "#EEF3F9",
};

function Rig() {
  useFrame((state) => {
    const { pointer, camera } = state;
    camera.position.x += (pointer.x * 2.2 - camera.position.x) * 0.02;
    camera.position.y += (2.6 - pointer.y * 1.1 - camera.position.y) * 0.02;
    camera.lookAt(0, 0.6, 0);
  });
  return null;
}

function Tower({ x }) {
  const legMat = PALETTE.structure;
  return (
    <group position={[x, 0, 0]}>
      {[[-0.55, -0.18], [0.55, -0.18], [-0.3, 0.18], [0.3, 0.18]].map(([dx, dz], i) => (
        <mesh key={i} position={[dx * 0.55, 1.1, dz]} rotation={[0, 0, dx > 0 ? -0.12 : 0.12]}>
          <boxGeometry args={[0.05, 2.2, 0.05]} />
          <meshStandardMaterial color={legMat} />
        </mesh>
      ))}
      <mesh position={[0, 2.2, 0]}>
        <boxGeometry args={[1.15, 0.05, 0.05]} />
        <meshStandardMaterial color={legMat} />
      </mesh>
      <mesh position={[0, 1.75, 0]}>
        <boxGeometry args={[0.9, 0.05, 0.05]} />
        <meshStandardMaterial color={legMat} />
      </mesh>
    </group>
  );
}

function CurrentPulse({ from, to, speed, color }) {
  const ref = useRef(null);
  const curve = useMemo(() => new THREE.CatmullRomCurve3([
    new THREE.Vector3(...from),
    new THREE.Vector3((from[0] + to[0]) / 2, Math.max(from[1], to[1]) + 0.35, (from[2] + to[2]) / 2),
    new THREE.Vector3(...to),
  ]), [from, to]);

  useFrame((state) => {
    const t = (state.clock.elapsedTime * speed) % 1;
    const p = curve.getPoint(t);
    if (ref.current) ref.current.position.copy(p);
  });

  return (
    <mesh ref={ref}>
      <sphereGeometry args={[0.045, 8, 8]} />
      <meshStandardMaterial color={color} emissive={color} emissiveIntensity={1.4} />
    </mesh>
  );
}

function TransmissionLine() {
  const towerX = [-4.5, -2.2, 0, 2.2, 4.5];
  return (
    <group>
      {towerX.map((x, i) => <Tower key={i} x={x} />)}
      {towerX.slice(0, -1).map((x, i) => {
        const x2 = towerX[i + 1];
        return (
          <React.Fragment key={i}>
            <line>
              <bufferGeometry>
                <bufferAttribute attach="attributes-position" args={[new Float32Array([x, 2.2, 0, x2, 2.2, 0]), 3]} />
              </bufferGeometry>
              <lineBasicMaterial color={PALETTE.structureDark} />
            </line>
            <CurrentPulse from={[x, 2.2, 0]} to={[x2, 2.2, 0]} speed={0.12 + i * 0.02} color={PALETTE.cyan} />
            <CurrentPulse from={[x, 1.75, 0]} to={[x2, 1.75, 0]} speed={0.1 + i * 0.015} color={PALETTE.copper} />
          </React.Fragment>
        );
      })}
    </group>
  );
}

function WindTurbine({ position }) {
  const blades = useRef(null);
  useFrame((_, delta) => { if (blades.current) blades.current.rotation.z += delta * 1.6; });
  return (
    <group position={position}>
      <mesh position={[0, 0.75, 0]}>
        <cylinderGeometry args={[0.035, 0.05, 1.5, 8]} />
        <meshStandardMaterial color={PALETTE.structure} />
      </mesh>
      <group ref={blades} position={[0, 1.5, 0.05]}>
        {[0, 120, 240].map((deg) => (
          <mesh key={deg} rotation={[0, 0, THREE.MathUtils.degToRad(deg)]} position={[0, 0.32, 0]}>
            <boxGeometry args={[0.045, 0.62, 0.02]} />
            <meshStandardMaterial color={PALETTE.structureDark} />
          </mesh>
        ))}
      </group>
    </group>
  );
}

function Truck({ z, speed, color, delay }) {
  const ref = useRef(null);
  useFrame((state) => {
    const t = ((state.clock.elapsedTime * speed + delay) % 1);
    if (ref.current) ref.current.position.x = -6 + t * 12;
  });
  return (
    <group ref={ref} position={[0, 0.14, z]}>
      <mesh position={[0, 0.09, 0]}>
        <boxGeometry args={[0.32, 0.16, 0.14]} />
        <meshStandardMaterial color={color} />
      </mesh>
      <mesh position={[0.22, 0.11, 0]}>
        <boxGeometry args={[0.14, 0.12, 0.13]} />
        <meshStandardMaterial color={PALETTE.cyan} />
      </mesh>
      {[[-0.11, -0.075], [0.11, -0.075], [-0.11, 0.075], [0.11, 0.075]].map(([x, zz], i) => (
        <mesh key={i} position={[x, 0, zz]} rotation={[Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[0.035, 0.035, 0.03, 10]} />
          <meshStandardMaterial color="#3A4657" />
        </mesh>
      ))}
    </group>
  );
}

function Ship() {
  const ref = useRef(null);
  useFrame((state) => {
    if (ref.current) ref.current.position.x = Math.sin(state.clock.elapsedTime * 0.06) * 3;
  });
  return (
    <group ref={ref} position={[0, -0.35, 3.4]}>
      <mesh>
        <boxGeometry args={[2.2, 0.28, 0.55]} />
        <meshStandardMaterial color={PALETTE.structureDark} />
      </mesh>
      {[-0.8, -0.4, 0, 0.4, 0.8].map((x, i) => (
        <mesh key={i} position={[x, 0.24, 0]}>
          <boxGeometry args={[0.34, 0.2, 0.4]} />
          <meshStandardMaterial color={i % 2 === 0 ? PALETTE.copper : "#8FA0B5"} />
        </mesh>
      ))}
    </group>
  );
}

function Ground() {
  return (
    <>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]}>
        <planeGeometry args={[30, 6]} />
        <meshStandardMaterial color={PALETTE.ground} />
      </mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.36, 3.6]}>
        <planeGeometry args={[30, 3.2]} />
        <meshStandardMaterial color={PALETTE.water} />
      </mesh>
    </>
  );
}

export default function LoginScene3D() {
  return (
    <Canvas
      camera={{ position: [0, 2.6, 6.5], fov: 42 }}
      gl={{ antialias: true, alpha: false }}
      style={{ position: "absolute", inset: 0 }}
      dpr={[1, 1.5]}
    >
      <color attach="background" args={[PALETTE.sky]} />
      <fog attach="fog" args={[PALETTE.sky, 6, 16]} />
      <ambientLight intensity={0.85} />
      <directionalLight position={[4, 6, 3]} intensity={1.1} />
      <Rig />
      <Ground />
      <TransmissionLine />
      <WindTurbine position={[-3.4, 0, -1.6]} />
      <WindTurbine position={[3.7, 0, -1.8]} />
      <Truck z={0.9} speed={0.045} color="#7C8CA0" delay={0} />
      <Truck z={1.15} speed={0.06} color={PALETTE.copper} delay={0.4} />
      <Ship />
      <Sparkles count={26} scale={[9, 3, 6]} size={2.4} speed={0.25} color={PALETTE.copper} position={[0, 1.4, 1]} opacity={0.6} />
    </Canvas>
  );
}
