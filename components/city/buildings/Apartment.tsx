"use client";

import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import type { Group } from "three";

import type { CityStructureInfo } from "@/types";

interface ApartmentProps {
  structure: CityStructureInfo;
  position: [number, number, number];
  height?: number;
  onHover: (structure: CityStructureInfo | null) => void;
  onSelect: (structure: CityStructureInfo) => void;
}

export function Apartment({
  structure,
  position,
  height = 1.8,
  onHover,
  onSelect,
}: ApartmentProps) {
  const ref = useRef<Group>(null);

  useFrame((state) => {
    if (!ref.current) {
      return;
    }

    ref.current.rotation.y = Math.sin(state.clock.elapsedTime * 0.15 + position[0]) * 0.05;
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
        <boxGeometry args={[1, height, 1]} />
        <meshStandardMaterial color="#38bdf8" metalness={0.2} roughness={0.4} />
      </mesh>
      <mesh position={[0, height / 2 + 0.05, 0]}>
        <boxGeometry args={[1.05, 0.1, 1.05]} />
        <meshStandardMaterial color="#0f172a" />
      </mesh>
    </group>
  );
}
