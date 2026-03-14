"use client";

import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import type { Group } from "three";

import type { CityStructureInfo } from "@/types";

interface HouseProps {
  structure: CityStructureInfo;
  position: [number, number, number];
  scale?: [number, number, number];
  onHover: (structure: CityStructureInfo | null) => void;
  onSelect: (structure: CityStructureInfo) => void;
}

export function House({
  structure,
  position,
  scale = [1, 1, 1],
  onHover,
  onSelect,
}: HouseProps) {
  const ref = useRef<Group>(null);

  useFrame((state) => {
    if (!ref.current) {
      return;
    }

    ref.current.position.y = position[1] + Math.sin(state.clock.elapsedTime + position[0]) * 0.03;
  });

  return (
    <group
      ref={ref}
      position={position}
      scale={scale}
      onPointerOver={() => onHover(structure)}
      onPointerOut={() => onHover(null)}
      onClick={() => onSelect(structure)}
    >
      <mesh castShadow receiveShadow>
        <boxGeometry args={[0.8, 0.8, 0.8]} />
        <meshStandardMaterial color="#60a5fa" />
      </mesh>
      <mesh position={[0, 0.6, 0]} castShadow>
        <coneGeometry args={[0.65, 0.55, 4]} />
        <meshStandardMaterial color="#f97316" />
      </mesh>
    </group>
  );
}
