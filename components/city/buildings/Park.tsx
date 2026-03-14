"use client";

import { type ThreeEvent } from "@react-three/fiber";

import type { CityStructureInfo } from "@/types";

interface ParkProps {
  structure: CityStructureInfo;
  position: [number, number, number];
  onHover: (structure: CityStructureInfo | null) => void;
  onSelect: (structure: CityStructureInfo) => void;
}

export function Park({ structure, position, onHover, onSelect }: ParkProps) {
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

  return (
    <group
      position={position}
      userData={{ cityStructure: true, structureId: structure.id }}
      onPointerOver={handleHover}
      onPointerOut={handleHoverEnd}
      onClick={handleSelect}
    >
      <mesh receiveShadow>
        <cylinderGeometry args={[0.65, 0.7, 0.08, 16]} />
        <meshStandardMaterial color="#22c55e" roughness={1} />
      </mesh>
      <mesh position={[0, 0.38, 0]} castShadow receiveShadow>
        <cylinderGeometry args={[0.08, 0.08, 0.48, 12]} />
        <meshStandardMaterial color="#92400e" roughness={0.95} />
      </mesh>
      <mesh position={[0, 0.76, 0]} castShadow receiveShadow>
        <sphereGeometry args={[0.38, 18, 18]} />
        <meshStandardMaterial color="#16a34a" roughness={0.92} />
      </mesh>
      <mesh position={[0.24, 0.68, 0.12]} castShadow receiveShadow>
        <sphereGeometry args={[0.22, 16, 16]} />
        <meshStandardMaterial color="#15803d" roughness={0.94} />
      </mesh>
      <mesh position={[-0.22, 0.66, -0.14]} castShadow receiveShadow>
        <sphereGeometry args={[0.2, 16, 16]} />
        <meshStandardMaterial color="#15803d" roughness={0.94} />
      </mesh>
    </group>
  );
}
