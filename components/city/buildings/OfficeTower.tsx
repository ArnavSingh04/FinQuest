"use client";

import { useRef } from "react";
import { useFrame, type ThreeEvent } from "@react-three/fiber";
import type { Group } from "three";

import type { CityStructureInfo } from "@/types";

interface OfficeTowerProps {
  structure: CityStructureInfo;
  position: [number, number, number];
  height?: number;
  onHover: (structure: CityStructureInfo | null) => void;
  onSelect: (structure: CityStructureInfo) => void;
}

export function OfficeTower({
  structure,
  position,
  height = 4.2,
  onHover,
  onSelect,
}: OfficeTowerProps) {
  const ref = useRef<Group>(null);

  function handleSelect(event: ThreeEvent<MouseEvent>) {
    event.stopPropagation();
    onSelect(structure);
  }

  function handleHover(event: ThreeEvent<PointerEvent>) {
    event.stopPropagation();
    onHover(structure);
  }

  function handleHoverEnd(event: ThreeEvent<PointerEvent>) {
    event.stopPropagation();
    onHover(null);
  }

  useFrame((state) => {
    if (!ref.current) {
      return;
    }

    ref.current.rotation.y = Math.sin(state.clock.elapsedTime * 0.18 + position[0]) * 0.05;
  });

  return (
    <group
      ref={ref}
      position={position}
      userData={{ cityStructure: true, structureId: structure.id }}
      onPointerOver={handleHover}
      onPointerOut={handleHoverEnd}
      onClick={handleSelect}
    >
      <mesh castShadow receiveShadow>
        <boxGeometry args={[1.2, height, 1.2]} />
        <meshStandardMaterial color="#475569" metalness={0.35} roughness={0.28} />
      </mesh>
      <mesh position={[0, height / 2 + 0.18, 0]} castShadow receiveShadow>
        <boxGeometry args={[0.7, 0.36, 0.7]} />
        <meshStandardMaterial color="#0f172a" metalness={0.4} roughness={0.2} />
      </mesh>
      {[-0.36, 0, 0.36].map((x) => (
        <mesh key={`tower-window-top-${x}`} position={[x, 0.85, 0.62]} castShadow receiveShadow>
          <boxGeometry args={[0.18, 1.5, 0.04]} />
          <meshStandardMaterial color="#93c5fd" emissive="#1d4ed8" emissiveIntensity={0.2} />
        </mesh>
      ))}
      {[-0.36, 0, 0.36].map((x) => (
        <mesh key={`tower-window-bottom-${x}`} position={[x, -0.95, 0.62]} castShadow receiveShadow>
          <boxGeometry args={[0.18, 1.2, 0.04]} />
          <meshStandardMaterial color="#bfdbfe" emissive="#1e3a8a" emissiveIntensity={0.16} />
        </mesh>
      ))}
      <mesh position={[0, -height / 2 + 0.06, 0]} receiveShadow>
        <boxGeometry args={[1.5, 0.12, 1.5]} />
        <meshStandardMaterial color="#1e293b" />
      </mesh>
    </group>
  );
}
