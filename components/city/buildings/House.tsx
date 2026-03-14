"use client";

import { useRef } from "react";
import { useFrame, type ThreeEvent } from "@react-three/fiber";
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

    ref.current.position.y = position[1] + Math.sin(state.clock.elapsedTime + position[0]) * 0.03;
  });

  return (
    <group
      ref={ref}
      position={position}
      scale={scale}
      userData={{ cityStructure: true, structureId: structure.id }}
      onPointerOver={handleHover}
      onPointerOut={handleHoverEnd}
      onClick={handleSelect}
    >
      <mesh position={[0, 0.42, 0]} castShadow receiveShadow>
        <boxGeometry args={[0.9, 0.82, 0.82]} />
        <meshStandardMaterial color="#f8fafc" roughness={0.88} />
      </mesh>
      <mesh position={[0, 0.97, 0]} castShadow>
        <coneGeometry args={[0.78, 0.7, 4]} />
        <meshStandardMaterial color="#b45309" roughness={0.7} />
      </mesh>
      <mesh position={[0, 0.08, 0.38]} castShadow receiveShadow>
        <boxGeometry args={[0.22, 0.3, 0.06]} />
        <meshStandardMaterial color="#7c2d12" roughness={0.8} />
      </mesh>
      <mesh position={[-0.24, 0.42, 0.41]} castShadow receiveShadow>
        <boxGeometry args={[0.18, 0.18, 0.04]} />
        <meshStandardMaterial color="#7dd3fc" emissive="#0f172a" emissiveIntensity={0.3} />
      </mesh>
      <mesh position={[0.24, 0.42, 0.41]} castShadow receiveShadow>
        <boxGeometry args={[0.18, 0.18, 0.04]} />
        <meshStandardMaterial color="#7dd3fc" emissive="#0f172a" emissiveIntensity={0.3} />
      </mesh>
      <mesh position={[0, 0.03, 0]} receiveShadow>
        <boxGeometry args={[1.2, 0.06, 1.15]} />
        <meshStandardMaterial color="#16a34a" roughness={1} />
      </mesh>
    </group>
  );
}
