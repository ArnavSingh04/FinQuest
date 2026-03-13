"use client";

import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";

import { useGameStore } from "@/store/useGameStore";

// ─── Utilities ────────────────────────────────────────────────────────────────

function useLerpScale(target: number, speed = 2.5) {
  const ref = useRef<THREE.Mesh>(null);
  const targetRef = useRef(target);
  targetRef.current = target;

  useFrame((_, dt) => {
    if (!ref.current) return;
    ref.current.scale.y = THREE.MathUtils.lerp(ref.current.scale.y, targetRef.current, dt * speed);
    ref.current.position.y = ref.current.scale.y * 0.5;
  });
  return ref;
}

// ─── Apartment building (needs → count) ───────────────────────────────────────
// Each apartment has a wide base + narrower upper setback — classic city look.
function Apartment({ x, z, idx }: { x: number; z: number; idx: number }) {
  const count = useGameStore((s) => s.cityState.apartmentCount);
  const visible = idx < count;
  const baseH = 1.0 + (idx % 4) * 0.35;
  const topH  = baseH * 0.55;
  const target = visible ? 1 : 0.01;

  const baseRef  = useLerpScale(target);
  const upperRef = useLerpScale(target, 2.2);

  return (
    <group position={[x, 0, z]}>
      {/* Base */}
      <mesh ref={baseRef} position={[0, baseH * 0.5, 0]} castShadow receiveShadow>
        <boxGeometry args={[0.85, baseH, 0.85]} />
        <meshStandardMaterial color="#64748b" roughness={0.7} metalness={0.15}
          emissive="#1e293b" emissiveIntensity={0.6} />
      </mesh>
      {/* Upper setback */}
      <mesh ref={upperRef} position={[0, baseH + topH * 0.5, 0]} castShadow>
        <boxGeometry args={[0.55, topH, 0.55]} />
        <meshStandardMaterial color="#475569" roughness={0.6} metalness={0.2}
          emissive="#334155" emissiveIntensity={0.8} />
      </mesh>
      {/* Roof water tower */}
      {idx % 3 === 0 && (
        <mesh position={[0.18, baseH + topH + 0.18, 0.18]} castShadow>
          <cylinderGeometry args={[0.07, 0.09, 0.36, 8]} />
          <meshStandardMaterial color="#374151" roughness={0.9} />
        </mesh>
      )}
    </group>
  );
}

// ─── Restaurant building (wants → count) ──────────────────────────────────────
const REST_COLORS = ["#c2410c", "#b45309", "#b91c1c", "#7c3aed", "#0369a1"] as const;

function Restaurant({ x, z, idx }: { x: number; z: number; idx: number }) {
  const count = useGameStore((s) => s.cityState.restaurantCount);
  const visible = idx < count;
  const h = 0.55 + (idx % 3) * 0.22;
  const ref = useLerpScale(visible ? 1 : 0.01, 3);

  return (
    <group position={[x, 0, z]}>
      <mesh ref={ref} position={[0, h * 0.5, 0]} castShadow receiveShadow>
        <boxGeometry args={[1.1, h, 0.95]} />
        <meshStandardMaterial
          color={REST_COLORS[idx % REST_COLORS.length]}
          roughness={0.5} metalness={0.05}
          emissive={REST_COLORS[idx % REST_COLORS.length]}
          emissiveIntensity={0.45}
        />
      </mesh>
      {/* Awning */}
      <mesh position={[0, h + 0.06, 0.52]}>
        <boxGeometry args={[1.1, 0.06, 0.25]} />
        <meshStandardMaterial color={REST_COLORS[idx % REST_COLORS.length]} emissive={REST_COLORS[idx % REST_COLORS.length]} emissiveIntensity={0.8} />
      </mesh>
    </group>
  );
}

// ─── Bank Tower (investments → height) — multi-part glass tower ───────────────
function BankTower({ x, z }: { x: number; z: number }) {
  const height = useGameStore((s) => s.cityState.bankHeight);
  const mainRef  = useLerpScale(height, 2);
  const crownRef = useLerpScale(height * 0.18, 2);

  return (
    <group position={[x, 0, z]}>
      {/* Podium */}
      <mesh position={[0, 0.25, 0]} castShadow receiveShadow>
        <boxGeometry args={[1.4, 0.5, 1.4]} />
        <meshStandardMaterial color="#1e40af" roughness={0.3} metalness={0.5} />
      </mesh>
      {/* Main shaft */}
      <mesh ref={mainRef} position={[0, height * 0.5, 0]} castShadow>
        <boxGeometry args={[0.9, 1, 0.9]} />
        <meshStandardMaterial color="#1d4ed8" roughness={0.25} metalness={0.6}
          emissive="#1e3a8a" emissiveIntensity={0.9} />
      </mesh>
      {/* Crown spire */}
      <mesh ref={crownRef} position={[0, height + height * 0.09, 0]}>
        <cylinderGeometry args={[0.06, 0.25, 1, 4]} />
        <meshStandardMaterial color="#60a5fa" emissive="#93c5fd" emissiveIntensity={1.2} />
      </mesh>
    </group>
  );
}

// ─── Investment Tower (investments → height) — hex emerald ────────────────────
function InvestmentTower({ x, z }: { x: number; z: number }) {
  const h = useGameStore((s) => s.cityState.towerHeight);
  const mainRef  = useLerpScale(h, 2);
  const tipRef   = useLerpScale(h * 0.25, 2);

  return (
    <group position={[x, 0, z]}>
      {/* Base disc */}
      <mesh position={[0, 0.12, 0]}>
        <cylinderGeometry args={[0.7, 0.7, 0.24, 6]} />
        <meshStandardMaterial color="#065f46" roughness={0.4} metalness={0.4} />
      </mesh>
      {/* Main hex shaft */}
      <mesh ref={mainRef} position={[0, h * 0.5, 0]} castShadow>
        <cylinderGeometry args={[0.38, 0.46, 1, 6]} />
        <meshStandardMaterial color="#059669" roughness={0.2} metalness={0.5}
          emissive="#064e3b" emissiveIntensity={0.8} />
      </mesh>
      {/* Tip */}
      <mesh ref={tipRef} position={[0, h + h * 0.125, 0]}>
        <coneGeometry args={[0.18, 1, 6]} />
        <meshStandardMaterial color="#34d399" emissive="#6ee7b7" emissiveIntensity={1.5} />
      </mesh>
    </group>
  );
}

// ─── Tree ─────────────────────────────────────────────────────────────────────
function Tree({ x, z, scale = 1 }: { x: number; z: number; scale?: number }) {
  return (
    <group position={[x, 0, z]} scale={[scale, scale, scale]}>
      <mesh position={[0, 0.32, 0]} castShadow>
        <cylinderGeometry args={[0.07, 0.1, 0.64, 6]} />
        <meshStandardMaterial color="#713f12" roughness={0.95} />
      </mesh>
      <mesh position={[0, 0.95, 0]} castShadow>
        <coneGeometry args={[0.44, 0.75, 7]} />
        <meshStandardMaterial color="#14532d" roughness={0.85} />
      </mesh>
      <mesh position={[0, 1.38, 0]} castShadow>
        <coneGeometry args={[0.32, 0.62, 7]} />
        <meshStandardMaterial color="#166534" roughness={0.8} />
      </mesh>
      <mesh position={[0, 1.74, 0]} castShadow>
        <coneGeometry args={[0.2, 0.48, 7]} />
        <meshStandardMaterial color="#15803d" roughness={0.75} />
      </mesh>
    </group>
  );
}

// ─── Street Lamp ──────────────────────────────────────────────────────────────
function StreetLamp({ x, z }: { x: number; z: number }) {
  return (
    <group position={[x, 0, z]}>
      <mesh position={[0, 1.1, 0]}>
        <cylinderGeometry args={[0.035, 0.04, 2.2, 6]} />
        <meshStandardMaterial color="#374151" metalness={0.8} roughness={0.2} />
      </mesh>
      <mesh position={[0.14, 2.15, 0]}>
        <sphereGeometry args={[0.09, 8, 8]} />
        <meshStandardMaterial color="#fef9c3" emissive="#fef08a" emissiveIntensity={3} />
      </mesh>
      <pointLight position={[0.14, 2.15, 0]} intensity={4} color="#fef08a" distance={5} decay={2} />
    </group>
  );
}

// ─── Pollution cloud (treats → opacity) ───────────────────────────────────────
function PollutionCloud({ x, y, z, opacity }: { x: number; y: number; z: number; opacity: number }) {
  const ref = useRef<THREE.Mesh>(null);
  useFrame(({ clock }) => {
    if (ref.current) ref.current.position.y = y + Math.sin(clock.elapsedTime * 0.35 + x) * 0.18;
  });
  return (
    <mesh ref={ref} position={[x, y, z]}>
      <sphereGeometry args={[0.55, 9, 9]} />
      <meshStandardMaterial color="#78716c" transparent opacity={opacity} roughness={1} />
    </mesh>
  );
}

// ─── Rain ─────────────────────────────────────────────────────────────────────
function Rain() {
  const weather = useGameStore((s) => s.cityState.weather);
  const ref = useRef<THREE.Points>(null);
  const COUNT = 400;
  const positions = useMemo(() => {
    const arr = new Float32Array(COUNT * 3);
    for (let i = 0; i < COUNT; i++) {
      arr[i * 3]     = (Math.random() - 0.5) * 24;
      arr[i * 3 + 1] = Math.random() * 14;
      arr[i * 3 + 2] = (Math.random() - 0.5) * 24;
    }
    return arr;
  }, []);

  useFrame((_, dt) => {
    if (!ref.current) return;
    const speed = weather === "storm" ? 9 : 4.5;
    const pos = ref.current.geometry.attributes.position as THREE.BufferAttribute;
    for (let i = 0; i < COUNT; i++) {
      (pos.array as Float32Array)[i * 3 + 1] -= dt * speed;
      if ((pos.array as Float32Array)[i * 3 + 1] < -1) (pos.array as Float32Array)[i * 3 + 1] = 13;
    }
    pos.needsUpdate = true;
  });

  if (weather !== "rain" && weather !== "storm") return null;

  return (
    <points ref={ref}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
      </bufferGeometry>
      <pointsMaterial color="#93c5fd" size={0.055} transparent opacity={weather === "storm" ? 0.75 : 0.45} />
    </points>
  );
}

// ─── Stars ────────────────────────────────────────────────────────────────────
function Stars() {
  const positions = useMemo(() => {
    const arr = new Float32Array(250 * 3);
    for (let i = 0; i < 250; i++) {
      arr[i * 3]     = (Math.random() - 0.5) * 70;
      arr[i * 3 + 1] = 12 + Math.random() * 22;
      arr[i * 3 + 2] = (Math.random() - 0.5) * 70;
    }
    return arr;
  }, []);

  const weather = useGameStore((s) => s.cityState.weather);
  const opacity = weather === "clear" ? 0.75 : weather === "overcast" ? 0.2 : 0;

  return (
    <points>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
      </bufferGeometry>
      <pointsMaterial color="#e2e8f0" size={0.07} transparent opacity={opacity} />
    </points>
  );
}

// ─── Park ground patch ────────────────────────────────────────────────────────
function Park({ x, z, w, d }: { x: number; z: number; w: number; d: number }) {
  return (
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[x, 0.005, z]} receiveShadow>
      <planeGeometry args={[w, d]} />
      <meshStandardMaterial color="#14532d" roughness={0.9} />
    </mesh>
  );
}

// ─── Main city export ──────────────────────────────────────────────────────────
export function CityGenerator() {
  const treats = useGameStore((s) => s.proportions.treats);
  const cloudCount = Math.min(5, Math.floor(treats * 12));

  // Apartment grid: up to 8 buildings in 2 rows (z=-3 and z=-1.6)
  const aptPositions: [number, number][] = [
    [-5.5, -3.2], [-4.2, -3.2], [-2.9, -3.2], [-1.6, -3.2],
    [-5.5, -1.8], [-4.2, -1.8], [-2.9, -1.8], [-1.6, -1.8],
  ];

  // Restaurant row
  const restPositions: [number, number][] = [
    [-4.5, 1.8], [-2.9, 1.8], [-1.3, 1.8], [0.3, 1.8], [1.9, 1.8], [3.5, 1.8],
  ];

  return (
    <group>
      {/* ── Parks ── */}
      <Park x={-3.5} z={-2.5} w={6.5} d={3.5} />
      <Park x={-1}   z={2.2}  w={9}   d={2.2} />

      {/* ── Apartments ── */}
      {aptPositions.map(([x, z], i) => (
        <Apartment key={`apt-${i}`} x={x} z={z} idx={i} />
      ))}

      {/* ── Restaurants ── */}
      {restPositions.map(([x, z], i) => (
        <Restaurant key={`rest-${i}`} x={x} z={z} idx={i} />
      ))}

      {/* ── Financial district ── */}
      <BankTower x={3.5} z={-2.5} />
      <InvestmentTower x={5.2} z={0.4} />

      {/* ── Trees ── */}
      <Tree x={-0.6} z={-3.0} scale={1.1} />
      <Tree x={-0.6} z={-1.5} scale={0.9} />
      <Tree x={0.7}  z={-2.3} scale={1.0} />
      <Tree x={-5.8} z={-0.8} scale={0.85} />
      <Tree x={4.8}  z={-0.8} scale={0.95} />
      <Tree x={2.2}  z={3.2}  scale={0.9} />
      <Tree x={5.0}  z={3.0}  scale={1.05} />
      <Tree x={-4.0} z={3.2}  scale={0.8} />

      {/* ── Street lamps ── */}
      <StreetLamp x={-0.6} z={0.6} />
      <StreetLamp x={2.5}  z={0.6} />
      <StreetLamp x={-3.5} z={0.6} />
      <StreetLamp x={-0.6} z={-0.9} />
      <StreetLamp x={2.5}  z={-0.9} />

      {/* ── Pollution clouds ── */}
      {Array.from({ length: cloudCount }, (_, i) => (
        <PollutionCloud
          key={i}
          x={1 + i * 2.1}
          y={4 + i * 0.4}
          z={3 - i * 0.6}
          opacity={0.18 + treats * 0.5}
        />
      ))}

      {/* ── Rain ── */}
      <Rain />

      {/* ── Stars ── */}
      <Stars />
    </group>
  );
}
