"use client";

import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import type { Group } from "three";

import type { CityStructureInfo } from "@/types";

interface EntertainmentBuildingProps {
  structure: CityStructureInfo;
  position: [number, number, number];
  onHover: (structure: CityStructureInfo | null) => void;
  onSelect: (structure: CityStructureInfo) => void;
}

export function EntertainmentBuilding({
  structure,
  position,
  onHover,
  onSelect,
}: EntertainmentBuildingProps) {
  const ref = useRef<Group>(null);

  useFrame((state) => {
    if (!ref.current) {
      return;
    }

    ref.current.rotation.y = state.clock.elapsedTime * 0.3;
  });

  return (
    <group
      ref={ref}
      position={position}
      onPointerOver={() => onHover(structure)}
      onPointerOut={() => onHover(null)}
      onClick={() => onSelect(structure)}
    >
      <mesh castShadow receiveShadow>
        <cylinderGeometry args={[0.6, 0.8, 1.8, 6]} />
        <meshStandardMaterial color="#a855f7" emissive="#6d28d9" emissiveIntensity={0.55} />
      </mesh>
      <mesh position={[0, 1.1, 0]} castShadow>
        <torusGeometry args={[0.5, 0.12, 12, 24]} />
        <meshStandardMaterial color="#f59e0b" emissive="#b45309" emissiveIntensity={0.65} />
      </mesh>
    </group>
  );
}
