"use client";

import { useRef } from "react";
import { useFrame, type ThreeEvent } from "@react-three/fiber";
import type { Group } from "three";

import type { CityStructureInfo } from "@/types";

interface MallProps {
  structure: CityStructureInfo;
  position: [number, number, number];
  onHover: (structure: CityStructureInfo | null) => void;
  onSelect: (structure: CityStructureInfo) => void;
}

export function Mall({ structure, position, onHover, onSelect }: MallProps) {
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

    ref.current.position.y = position[1] + Math.sin(state.clock.elapsedTime * 0.8 + position[0]) * 0.04;
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
        <boxGeometry args={[1.9, 1.05, 1.25]} />
        <meshStandardMaterial color="#c084fc" metalness={0.12} roughness={0.55} />
      </mesh>
      <mesh position={[0, 0.62, 0]} castShadow receiveShadow>
        <boxGeometry args={[2.05, 0.14, 1.35]} />
        <meshStandardMaterial color="#7e22ce" />
      </mesh>
      <mesh position={[0, -0.08, 0.66]} castShadow receiveShadow>
        <boxGeometry args={[0.48, 0.56, 0.05]} />
        <meshStandardMaterial color="#fef3c7" emissive="#ca8a04" emissiveIntensity={0.25} />
      </mesh>
      {[-0.58, 0, 0.58].map((x) => (
        <mesh key={`mall-window-${x}`} position={[x, 0.1, 0.63]} castShadow receiveShadow>
          <boxGeometry args={[0.28, 0.24, 0.04]} />
          <meshStandardMaterial color="#fde68a" emissive="#f59e0b" emissiveIntensity={0.22} />
        </mesh>
      ))}
      <mesh position={[0, -0.52, 0]} receiveShadow>
        <boxGeometry args={[2.2, 0.1, 1.5]} />
        <meshStandardMaterial color="#334155" />
      </mesh>
    </group>
  );
}
