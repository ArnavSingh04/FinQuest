"use client";

import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import type { Group } from "three";

import type { CityStructureInfo } from "@/types";

interface SkyscraperProps {
  structure: CityStructureInfo;
  position: [number, number, number];
  height?: number;
  onHover: (structure: CityStructureInfo | null) => void;
  onSelect: (structure: CityStructureInfo) => void;
}

export function Skyscraper({
  structure,
  position,
  height = 3.8,
  onHover,
  onSelect,
}: SkyscraperProps) {
  const ref = useRef<Group>(null);

  useFrame((state) => {
    if (!ref.current) {
      return;
    }

    ref.current.scale.y = 1 + Math.sin(state.clock.elapsedTime * 0.8 + position[0]) * 0.02;
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
        <boxGeometry args={[1.05, height, 1.05]} />
        <meshStandardMaterial color="#22c55e" metalness={0.35} roughness={0.3} />
      </mesh>
      <mesh position={[0, height / 2 + 0.25, 0]} castShadow>
        <boxGeometry args={[0.35, 0.5, 0.35]} />
        <meshStandardMaterial color="#86efac" emissive="#14532d" emissiveIntensity={0.5} />
      </mesh>
    </group>
  );
}
