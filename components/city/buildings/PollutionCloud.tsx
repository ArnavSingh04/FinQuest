"use client";

import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import type { Group } from "three";

import type { CityStructureInfo } from "@/types";

interface PollutionCloudProps {
  structure: CityStructureInfo;
  position: [number, number, number];
  onHover: (structure: CityStructureInfo | null) => void;
  onSelect: (structure: CityStructureInfo) => void;
}

export function PollutionCloud({
  structure,
  position,
  onHover,
  onSelect,
}: PollutionCloudProps) {
  const ref = useRef<Group>(null);

  useFrame((state) => {
    if (!ref.current) {
      return;
    }

    ref.current.position.y = position[1] + Math.sin(state.clock.elapsedTime + position[0]) * 0.12;
  });

  return (
    <group
      ref={ref}
      position={position}
      onPointerOver={() => onHover(structure)}
      onPointerOut={() => onHover(null)}
      onClick={() => onSelect(structure)}
    >
      <mesh>
        <sphereGeometry args={[0.5, 16, 16]} />
        <meshStandardMaterial color="#94a3b8" transparent opacity={0.35} />
      </mesh>
      <mesh position={[0.45, 0.2, -0.1]}>
        <sphereGeometry args={[0.35, 16, 16]} />
        <meshStandardMaterial color="#cbd5e1" transparent opacity={0.25} />
      </mesh>
      <mesh position={[-0.35, 0.15, 0.18]}>
        <sphereGeometry args={[0.32, 16, 16]} />
        <meshStandardMaterial color="#94a3b8" transparent opacity={0.28} />
      </mesh>
    </group>
  );
}
