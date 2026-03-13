"use client";

import { useEffect, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";

import { useGameStore } from "@/store/useGameStore";

// Lerp a mesh's Y scale toward a target, keeping it grounded
function useLerpHeight(target: number, speed = 2.5) {
  const meshRef = useRef<THREE.Mesh>(null);
  const targetRef = useRef(target);

  useEffect(() => {
    targetRef.current = target;
  }, [target]);

  useFrame((_, delta) => {
    if (!meshRef.current) return;
    meshRef.current.scale.y = THREE.MathUtils.lerp(
      meshRef.current.scale.y,
      targetRef.current,
      delta * speed,
    );
    meshRef.current.position.y = meshRef.current.scale.y * 0.5;
  });

  return meshRef;
}

// ─── Bank Tower (investments → height) ────────────────────────────────────────
function BankTower({ x, z }: { x: number; z: number }) {
  const bankHeight = useGameStore((s) => s.cityState.bankHeight);
  const meshRef = useLerpHeight(bankHeight);

  return (
    <mesh
      ref={meshRef}
      position={[x, bankHeight * 0.5, z]}
      castShadow
      receiveShadow
    >
      <boxGeometry args={[0.85, 1, 0.85]} />
      <meshStandardMaterial
        color="#1A56DB"
        emissive="#0a2a8a"
        emissiveIntensity={0.4}
      />
    </mesh>
  );
}

// ─── Investment Tower (investments → height, cylinder) ────────────────────────
function InvestmentTower({ x, z }: { x: number; z: number }) {
  const towerHeight = useGameStore((s) => s.cityState.towerHeight);
  const meshRef = useLerpHeight(towerHeight);

  return (
    <mesh
      ref={meshRef}
      position={[x, towerHeight * 0.5, z]}
      castShadow
      receiveShadow
    >
      <cylinderGeometry args={[0.35, 0.42, 1, 6]} />
      <meshStandardMaterial
        color="#059669"
        emissive="#023d2b"
        emissiveIntensity={0.5}
      />
    </mesh>
  );
}

// ─── Apartment (needs → count, medium grey boxes) ─────────────────────────────
function Apartment({ x, z, index }: { x: number; z: number; index: number }) {
  const apartmentCount = useGameStore((s) => s.cityState.apartmentCount);
  const visible = index < apartmentCount;
  const height = 1.2 + (index % 3) * 0.4;
  const meshRef = useLerpHeight(visible ? height : 0.05, 3);

  return (
    <mesh ref={meshRef} position={[x, height * 0.5, z]} castShadow receiveShadow>
      <boxGeometry args={[0.7, 1, 0.7]} />
      <meshStandardMaterial color="#9CA3AF" />
    </mesh>
  );
}

// ─── Restaurant (wants → count, short+wide orange) ────────────────────────────
function Restaurant({ x, z, index }: { x: number; z: number; index: number }) {
  const restaurantCount = useGameStore((s) => s.cityState.restaurantCount);
  const visible = index < restaurantCount;
  const height = 0.6 + (index % 2) * 0.25;
  const meshRef = useLerpHeight(visible ? height : 0.05, 3);

  return (
    <mesh ref={meshRef} position={[x, height * 0.5, z]} castShadow receiveShadow>
      <boxGeometry args={[1.1, 1, 0.9]} />
      <meshStandardMaterial
        color={index % 2 === 0 ? "#F97316" : "#EA580C"}
        emissive={index % 2 === 0 ? "#7c3a0e" : "#5c2a08"}
        emissiveIntensity={0.3}
      />
    </mesh>
  );
}

// ─── Pollution clouds (treats → health penalty → weather) ─────────────────────
function PollutionCloud({ x, y, z, opacity }: { x: number; y: number; z: number; opacity: number }) {
  const meshRef = useRef<THREE.Mesh>(null);

  useFrame(({ clock }) => {
    if (!meshRef.current) return;
    meshRef.current.position.y = y + Math.sin(clock.elapsedTime * 0.4) * 0.15;
  });

  return (
    <mesh ref={meshRef} position={[x, y, z]}>
      <sphereGeometry args={[0.5, 10, 10]} />
      <meshStandardMaterial color="#94a3b8" transparent opacity={opacity} />
    </mesh>
  );
}

// ─── Citizens (tiny capsules walking, count = population) ─────────────────────
function Citizens() {
  const population = useGameStore((s) => s.cityState.population);
  const count = Math.min(population, 8);

  const positions: [number, number, number][] = Array.from({ length: count }, (_, i) => [
    -4 + (i % 4) * 2.2 + Math.sin(i * 1.3) * 0.6,
    0.15,
    -0.5 + Math.floor(i / 4) * 2 + Math.cos(i * 0.9) * 0.4,
  ]);

  return (
    <>
      {positions.map(([x, y, z], i) => (
        <mesh key={i} position={[x, y, z]}>
          <capsuleGeometry args={[0.08, 0.14, 4, 6]} />
          <meshStandardMaterial color={["#f9a8d4", "#86efac", "#93c5fd", "#fcd34d"][i % 4]} />
        </mesh>
      ))}
    </>
  );
}

// ─── Rain particles ────────────────────────────────────────────────────────────
function Rain() {
  const weather = useGameStore((s) => s.cityState.weather);
  const pointsRef = useRef<THREE.Points>(null);
  const count = 300;

  const positions = useRef(
    new Float32Array(
      Array.from({ length: count * 3 }, (_, i) =>
        i % 3 === 1 ? Math.random() * 12 : (Math.random() - 0.5) * 20,
      ),
    ),
  );

  useFrame((_, delta) => {
    if (!pointsRef.current) return;
    const pos = positions.current;
    const speed = weather === "storm" ? 6 : 3;
    for (let i = 0; i < count; i++) {
      pos[i * 3 + 1] -= delta * speed;
      if (pos[i * 3 + 1] < -1) pos[i * 3 + 1] = 11;
    }
    (pointsRef.current.geometry.attributes.position as THREE.BufferAttribute).needsUpdate = true;
  });

  if (weather !== "rain" && weather !== "storm") return null;

  return (
    <points ref={pointsRef}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          args={[positions.current, 3]}
        />
      </bufferGeometry>
      <pointsMaterial
        color="#a0c4ff"
        size={0.06}
        transparent
        opacity={weather === "storm" ? 0.7 : 0.45}
      />
    </points>
  );
}

// ─── Main city export ──────────────────────────────────────────────────────────
export function CityGenerator() {
  const treats = useGameStore((s) => s.proportions.treats);
  const cloudCount = Math.min(4, Math.floor(treats * 10));

  return (
    <group>
      {/* Apartment row — left side */}
      {Array.from({ length: 8 }, (_, i) => (
        <Apartment key={`apt-${i}`} x={-5 + i * 1.15} z={-2.5} index={i} />
      ))}

      {/* Restaurant row — middle */}
      {Array.from({ length: 6 }, (_, i) => (
        <Restaurant key={`rest-${i}`} x={-3.5 + i * 1.5} z={1.5} index={i} />
      ))}

      {/* Bank tower — right */}
      <BankTower x={3.2} z={-1.5} />

      {/* Investment tower — far right */}
      <InvestmentTower x={5} z={0.5} />

      {/* Pollution clouds */}
      {Array.from({ length: cloudCount }, (_, i) => (
        <PollutionCloud
          key={`cloud-${i}`}
          x={1.5 + i * 1.8}
          y={3.5 + i * 0.3}
          z={2.5 - i * 0.5}
          opacity={0.25 + treats * 0.4}
        />
      ))}

      {/* Citizens */}
      <Citizens />

      {/* Rain */}
      <Rain />
    </group>
  );
}
