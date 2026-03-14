"use client";

import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import type { Group } from "three";

// ─── Single pedestrian ────────────────────────────────────────────────────────

function Pedestrian({ startX, startZ, directionX, directionZ, speed, color, range, phaseOffset }: {
  startX: number; startZ: number; directionX: number; directionZ: number;
  speed: number; color: string; range: number; phaseOffset: number;
}) {
  const ref = useRef<Group>(null);
  const t = useRef(phaseOffset);

  useFrame((_, delta) => {
    if (!ref.current) return;
    t.current += delta * speed;
    const progress = Math.sin(t.current) * range;
    const bobY = Math.abs(Math.sin(t.current * 4)) * 0.025;
    ref.current.position.set(
      startX + directionX * progress,
      0.05 + bobY,
      startZ + directionZ * progress
    );
    ref.current.rotation.y = Math.cos(t.current) > 0
      ? Math.atan2(directionX, directionZ)
      : Math.atan2(-directionX, -directionZ);
    const swing = Math.sin(t.current * 4) * 0.28;
    const la = ref.current.children[2] as Group;
    const ra = ref.current.children[3] as Group;
    if (la) la.rotation.x = swing;
    if (ra) ra.rotation.x = -swing;
  });

  return (
    <group ref={ref} position={[startX, 0.05, startZ]}>
      <mesh position={[0, 0.18, 0]} castShadow>
        <capsuleGeometry args={[0.042, 0.13, 4, 8]} />
        <meshStandardMaterial color={color} roughness={0.8} />
      </mesh>
      <mesh position={[0, 0.36, 0]} castShadow>
        <sphereGeometry args={[0.042, 8, 8]} />
        <meshStandardMaterial color="#f5cba7" roughness={0.9} />
      </mesh>
      <group position={[-0.06, 0.21, 0]}>
        <mesh>
          <capsuleGeometry args={[0.02, 0.09, 4, 6]} />
          <meshStandardMaterial color={color} roughness={0.8} />
        </mesh>
      </group>
      <group position={[0.06, 0.21, 0]}>
        <mesh>
          <capsuleGeometry args={[0.02, 0.09, 4, 6]} />
          <meshStandardMaterial color={color} roughness={0.8} />
        </mesh>
      </group>
    </group>
  );
}

const PED_COLORS = ["#e74c3c","#3498db","#f39c12","#27ae60","#9b59b6","#1abc9c","#e67e22","#2980b9","#e91e63","#00bcd4"];

export function MovingPedestrians({ density }: { density: number }) {
  const count = Math.floor(density * 24);
  const streets = [-12.8, -9.6, -6.4, -3.2, 0, 3.2, 6.4, 9.6, 12.8];

  const peds = Array.from({ length: count }, (_, i) => {
    const si = i % streets.length;
    const off = streets[si];
    const horizontal = i % 2 === 0;
    const side = (i % 3 === 0) ? 0.28 : -0.28;
    return {
      startX: horizontal ? -8 + ((i * 3.3) % 16) : off + side,
      startZ: horizontal ? off + side : -8 + ((i * 2.7) % 16),
      directionX: horizontal ? 1 : 0,
      directionZ: horizontal ? 0 : 1,
      speed: 0.38 + (i % 5) * 0.14,
      color: PED_COLORS[i % PED_COLORS.length],
      range: 2.2 + (i % 4) * 1.1,
      phaseOffset: i * 1.37,
    };
  });

  return <>{peds.map((p, i) => <Pedestrian key={i} {...p} />)}</>;
}

// ─── Single car ───────────────────────────────────────────────────────────────

interface CarRoute {
  startX: number; startZ: number; endX: number; endZ: number;
  color: string; speed: number;
}

function MovingCar({ route, timeOffset }: { route: CarRoute; timeOffset: number }) {
  const ref = useRef<Group>(null);
  const t = useRef(timeOffset);

  useFrame((_, delta) => {
    if (!ref.current) return;
    t.current += delta * route.speed;
    const p = (t.current % 1 + 1) % 1;
    const x = route.startX + (route.endX - route.startX) * p;
    const z = route.startZ + (route.endZ - route.startZ) * p;
    const dx = route.endX - route.startX;
    const dz = route.endZ - route.startZ;
    ref.current.position.set(x, 0.09, z);
    ref.current.rotation.y = Math.atan2(dz, dx);
  });

  return (
    <group ref={ref}>
      <mesh castShadow>
        <boxGeometry args={[0.54, 0.15, 0.27]} />
        <meshStandardMaterial color={route.color} metalness={0.4} roughness={0.28} />
      </mesh>
      <mesh position={[0, 0.14, 0]} castShadow>
        <boxGeometry args={[0.29, 0.11, 0.23]} />
        <meshStandardMaterial color={route.color} metalness={0.25} roughness={0.38} />
      </mesh>
      <mesh position={[0.16, 0.15, 0]}>
        <boxGeometry args={[0.01, 0.09, 0.21]} />
        <meshStandardMaterial color="#a8d8f0" transparent opacity={0.55} />
      </mesh>
      {([-0.17, 0.17] as number[]).flatMap(wx =>
        ([-0.13, 0.13] as number[]).map(wz => (
          <mesh key={`${wx}-${wz}`} position={[wx, -0.065, wz]} rotation={[Math.PI / 2, 0, 0]} castShadow>
            <cylinderGeometry args={[0.063, 0.063, 0.048, 10]} />
            <meshStandardMaterial color="#1a1a1a" roughness={0.95} />
          </mesh>
        ))
      )}
      {/* Headlights */}
      {[0.08, -0.08].map(oz => (
        <mesh key={oz} position={[0.28, 0.02, oz]}>
          <sphereGeometry args={[0.023, 6, 6]} />
          <meshStandardMaterial color="#fffde7" emissive="#fffde7" emissiveIntensity={2} />
        </mesh>
      ))}
      {/* Tail lights */}
      {[0.08, -0.08].map(oz => (
        <mesh key={`t${oz}`} position={[-0.28, 0.02, oz]}>
          <sphereGeometry args={[0.02, 6, 6]} />
          <meshStandardMaterial color="#ff2200" emissive="#ff2200" emissiveIntensity={1.2} />
        </mesh>
      ))}
    </group>
  );
}

const CAR_COLORS = ["#e74c3c","#e67e22","#f1c40f","#2ecc71","#3498db","#9b59b6","#1abc9c","#ecf0f1","#2c3e50","#ff6b9d","#00bcd4","#ff5722"];

export function MovingTraffic({ trafficDensity, infrastructureHealth }: { trafficDensity: number; infrastructureHealth: number }) {
  const roads = [-12.8, -9.6, -6.4, -3.2, 0, 3.2, 6.4, 9.6, 12.8];
  const span = 14.5;
  const inset = 0.2;

  const routes: CarRoute[] = roads.flatMap((pos, i) => [
    { startX: -span, startZ: pos - inset, endX: span, endZ: pos - inset,
      color: CAR_COLORS[(i * 3) % CAR_COLORS.length],
      speed: (0.038 + Math.sin(i * 7.3) * 0.015) * (0.5 + infrastructureHealth * 0.5) },
    { startX: pos + inset, startZ: span, endX: pos + inset, endZ: -span,
      color: CAR_COLORS[(i * 3 + 6) % CAR_COLORS.length],
      speed: (0.032 + Math.sin(i * 5.1) * 0.013) * (0.5 + infrastructureHealth * 0.5) },
  ]);

  const maxCars = Math.max(3, Math.floor(trafficDensity * routes.length));
  const active = routes.slice(0, maxCars);

  return (
    <>
      {active.map((r, i) => (
        <MovingCar key={i} route={r} timeOffset={(i * 0.137 + i * i * 0.019) % 1} />
      ))}
    </>
  );
}