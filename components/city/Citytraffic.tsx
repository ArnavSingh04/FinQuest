"use client";

import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import type { Group } from "three";

interface PedestrianProps {
  startX: number;
  startZ: number;
  directionX: number;
  directionZ: number;
  speed: number;
  color: string;
  range: number;
}

function Pedestrian({
  startX,
  startZ,
  directionX,
  directionZ,
  speed,
  color,
  range,
}: PedestrianProps) {
  const ref = useRef<Group>(null);
  const timeRef = useRef(Math.random() * 100);

  useFrame((_, delta) => {
    if (!ref.current) return;
    timeRef.current += delta * speed;

    const t = timeRef.current;
    // Oscillate back and forth along the street
    const progress = Math.sin(t) * range;
    const bobY = Math.abs(Math.sin(t * 4)) * 0.03; // walking bob

    ref.current.position.set(
      startX + directionX * progress,
      0.05 + bobY,
      startZ + directionZ * progress
    );

    // Face direction of travel
    const movingForward = Math.cos(t) > 0;
    ref.current.rotation.y = movingForward
      ? Math.atan2(directionX, directionZ)
      : Math.atan2(-directionX, -directionZ);

    // Arm swing
    const swing = Math.sin(t * 4) * 0.3;
    const leftArm = ref.current.children[2] as Group;
    const rightArm = ref.current.children[3] as Group;
    if (leftArm) leftArm.rotation.x = swing;
    if (rightArm) rightArm.rotation.x = -swing;
  });

  return (
    <group ref={ref} position={[startX, 0.05, startZ]}>
      {/* Body */}
      <mesh position={[0, 0.18, 0]} castShadow>
        <capsuleGeometry args={[0.045, 0.14, 4, 8]} />
        <meshStandardMaterial color={color} roughness={0.8} />
      </mesh>
      {/* Head */}
      <mesh position={[0, 0.38, 0]} castShadow>
        <sphereGeometry args={[0.045, 8, 8]} />
        <meshStandardMaterial color="#f5cba7" roughness={0.9} />
      </mesh>
      {/* Left arm */}
      <group position={[-0.065, 0.22, 0]}>
        <mesh castShadow>
          <capsuleGeometry args={[0.022, 0.1, 4, 6]} />
          <meshStandardMaterial color={color} roughness={0.8} />
        </mesh>
      </group>
      {/* Right arm */}
      <group position={[0.065, 0.22, 0]}>
        <mesh castShadow>
          <capsuleGeometry args={[0.022, 0.1, 4, 6]} />
          <meshStandardMaterial color={color} roughness={0.8} />
        </mesh>
      </group>
    </group>
  );
}

interface MovingCarsProps {
  trafficDensity: number;
  infrastructureHealth: number;
}

interface CarRoute {
  startX: number;
  startZ: number;
  endX: number;
  endZ: number;
  color: string;
  speed: number;
}

function MovingCar({
  route,
  timeOffset,
}: {
  route: CarRoute;
  timeOffset: number;
}) {
  const ref = useRef<Group>(null);
  const timeRef = useRef(timeOffset);

  useFrame((_, delta) => {
    if (!ref.current) return;
    timeRef.current += delta * route.speed;
    // Loop 0..1 along route
    const t = (timeRef.current % 1 + 1) % 1;

    const x = route.startX + (route.endX - route.startX) * t;
    const z = route.startZ + (route.endZ - route.startZ) * t;
    const dx = route.endX - route.startX;
    const dz = route.endZ - route.startZ;

    ref.current.position.set(x, 0.09, z);
    // Car mesh points along +X by default; align it to route direction.
    ref.current.rotation.y = Math.atan2(dz, dx);
  });

  return (
    <group ref={ref}>
      {/* Car body */}
      <mesh castShadow>
        <boxGeometry args={[0.55, 0.16, 0.28]} />
        <meshStandardMaterial
          color={route.color}
          metalness={0.35}
          roughness={0.3}
        />
      </mesh>
      {/* Roof */}
      <mesh position={[0, 0.14, 0]} castShadow>
        <boxGeometry args={[0.3, 0.12, 0.24]} />
        <meshStandardMaterial color={route.color} metalness={0.2} roughness={0.4} />
      </mesh>
      {/* Windshield */}
      <mesh position={[0.16, 0.15, 0]}>
        <boxGeometry args={[0.01, 0.1, 0.22]} />
        <meshStandardMaterial
          color="#a8d8f0"
          transparent
          opacity={0.6}
          metalness={0.1}
        />
      </mesh>
      {/* Wheels */}
      {([-0.18, 0.18] as number[]).map((wx) =>
        ([-0.135, 0.135] as number[]).map((wz) => (
          <mesh
            key={`w-${wx}-${wz}`}
            position={[wx, -0.07, wz]}
            rotation={[Math.PI / 2, 0, 0]}
            castShadow
          >
            <cylinderGeometry args={[0.065, 0.065, 0.05, 10]} />
            <meshStandardMaterial color="#222" roughness={0.9} />
          </mesh>
        ))
      )}
      {/* Headlights */}
      <mesh position={[0.28, 0.02, 0.08]}>
        <sphereGeometry args={[0.025, 6, 6]} />
        <meshStandardMaterial
          color="#fffde7"
          emissive="#fffde7"
          emissiveIntensity={1.5}
        />
      </mesh>
      <mesh position={[0.28, 0.02, -0.08]}>
        <sphereGeometry args={[0.025, 6, 6]} />
        <meshStandardMaterial
          color="#fffde7"
          emissive="#fffde7"
          emissiveIntensity={1.5}
        />
      </mesh>
    </group>
  );
}

const CAR_COLORS = [
  "#e74c3c", "#e67e22", "#f1c40f", "#2ecc71",
  "#3498db", "#9b59b6", "#1abc9c", "#e8e8e8",
  "#2c3e50", "#ff6b9d",
];

function buildCarRoutes(density: number): CarRoute[] {
  const routes: CarRoute[] = [];
  const roadPositions = [-12.8, -9.6, -6.4, -3.2, 0, 3.2, 6.4, 9.6, 12.8];
  const citySpan = 14.4;
  const laneInset = 0.22;

  roadPositions.forEach((pos, i) => {
    const colorH = CAR_COLORS[(i * 3) % CAR_COLORS.length];
    const colorV = CAR_COLORS[(i * 3 + 5) % CAR_COLORS.length];
    // Horizontal road
    routes.push({
      startX: -citySpan,
      startZ: pos - laneInset,
      endX: citySpan,
      endZ: pos - laneInset,
      color: colorH,
      speed: 0.04 + Math.random() * 0.03,
    });
    // Vertical road (opposite direction)
    routes.push({
      startX: pos + laneInset,
      startZ: citySpan,
      endX: pos + laneInset,
      endZ: -citySpan,
      color: colorV,
      speed: 0.035 + Math.random() * 0.03,
    });
  });

  // Filter to density
  const maxCars = Math.floor(density * routes.length);
  return routes.slice(0, Math.max(2, maxCars));
}

const PEDESTRIAN_COLORS = [
  "#e74c3c", "#3498db", "#f39c12", "#27ae60",
  "#9b59b6", "#1abc9c", "#e67e22", "#2980b9",
];

interface WalkersProps {
  density: number;
}

export function MovingPedestrians({ density }: WalkersProps) {
  const count = Math.floor(density * 20);
  const streetOffsets = [-12.8, -9.6, -6.4, -3.2, 0, 3.2, 6.4, 9.6, 12.8];
  const laneInset = 0.22;

  const pedestrians = Array.from({ length: count }, (_, i) => {
    const streetIdx = i % streetOffsets.length;
    const offset = streetOffsets[streetIdx];
    const isHorizontal = i % 2 === 0;
    const sideOffset = i % 3 === 0 ? laneInset : -laneInset;

    return {
      startX: isHorizontal ? -10 + ((i * 3.1) % 20) : offset + sideOffset,
      startZ: isHorizontal ? offset + sideOffset : -10 + ((i * 2.7) % 20),
      directionX: isHorizontal ? 1 : 0,
      directionZ: isHorizontal ? 0 : 1,
      speed: 0.4 + (i % 5) * 0.15,
      color: PEDESTRIAN_COLORS[i % PEDESTRIAN_COLORS.length],
      range: 2.5 + (i % 4) * 1.2,
    };
  });

  return (
    <>
      {pedestrians.map((p, i) => (
        <Pedestrian key={`ped-${i}`} {...p} />
      ))}
    </>
  );
}

export function MovingTraffic({ trafficDensity, infrastructureHealth }: MovingCarsProps) {
  const routes = buildCarRoutes(trafficDensity);

  return (
    <>
      {routes.map((route, i) => (
        <MovingCar
          key={`car-${i}`}
          route={{
            ...route,
            speed: route.speed * (0.5 + infrastructureHealth * 0.5),
          }}
          timeOffset={(i * 0.137) % 1}
        />
      ))}
    </>
  );
}
