"use client";

import { useRef, useState, useEffect } from "react";
import { useFrame } from "@react-three/fiber";
import type { Group } from "three";

export const DEMOLITION_DURATION = 2200; // ms

interface DemolitionChunkProps {
  x: number;
  y: number;
  z: number;
  size: number;
  color: string;
  velX: number;
  velY: number;
  velZ: number;
  rotVel: number;
}

function DemolitionChunk({
  x,
  y,
  z,
  size,
  color,
  velX,
  velY,
  velZ,
  rotVel,
}: DemolitionChunkProps) {
  const ref = useRef<Group>(null);
  const startRef = useRef(Date.now());

  useFrame(() => {
    if (!ref.current) return;
    const t = (Date.now() - startRef.current) / 1000;
    // Physics: gravity
    const px = x + velX * t;
    const py = y + velY * t - 0.5 * 9.8 * t * t;
    const pz = z + velZ * t;

    if (py < 0) {
      ref.current.visible = false;
      return;
    }

    ref.current.position.set(px, py, pz);
    ref.current.rotation.x = rotVel * t * 2;
    ref.current.rotation.z = rotVel * t;
    // Fade out as it falls
    const progress = t / (DEMOLITION_DURATION / 1000);
    ref.current.children.forEach((child) => {
      const mesh = child as any;
      if (mesh.material) {
        mesh.material.opacity = Math.max(0, 1 - progress * 1.5);
        mesh.material.transparent = true;
      }
    });
  });

  return (
    <group ref={ref} position={[x, y, z]}>
      <mesh castShadow>
        <boxGeometry args={[size, size, size]} />
        <meshStandardMaterial color={color} roughness={0.8} />
      </mesh>
    </group>
  );
}

interface DemolitionProps {
  x: number;
  z: number;
  buildingHeight: number;
  buildingColor: string;
  active: boolean;
  onComplete?: () => void;
}

export function DemolitionEffect({
  x,
  z,
  buildingHeight,
  buildingColor,
  active,
  onComplete,
}: DemolitionProps) {
  const [chunks, setChunks] = useState<DemolitionChunkProps[]>([]);
  const startedRef = useRef(false);

  useEffect(() => {
    if (!active || startedRef.current) return;
    startedRef.current = true;

    // Generate chunks
    const newChunks: DemolitionChunkProps[] = Array.from(
      { length: 24 },
      (_, i) => {
        const angle = (i / 24) * Math.PI * 2;
        const speed = 1.5 + Math.random() * 2;
        return {
          x: x + (Math.random() - 0.5) * 1.5,
          y: buildingHeight * 0.3 + Math.random() * buildingHeight * 0.6,
          z: z + (Math.random() - 0.5) * 1.5,
          size: 0.1 + Math.random() * 0.35,
          color: Math.random() > 0.5 ? buildingColor : "#9ca3af",
          velX: Math.cos(angle) * speed * 0.8,
          velY: 2 + Math.random() * 3,
          velZ: Math.sin(angle) * speed * 0.8,
          rotVel: (Math.random() - 0.5) * 5,
        };
      }
    );
    setChunks(newChunks);

    // Call onComplete after animation
    const timer = setTimeout(() => {
      onComplete?.();
      startedRef.current = false;
    }, DEMOLITION_DURATION);

    return () => clearTimeout(timer);
  }, [active, x, z, buildingHeight, buildingColor, onComplete]);

  if (!active || chunks.length === 0) return null;

  return (
    <>
      {chunks.map((chunk, i) => (
        <DemolitionChunk key={`chunk-${i}`} {...chunk} />
      ))}
      {/* Dust cloud */}
      <DustCloud x={x} z={z} active={active} />
    </>
  );
}

function DustCloud({
  x,
  z,
  active,
}: {
  x: number;
  z: number;
  active: boolean;
}) {
  const ref = useRef<Group>(null);
  const startRef = useRef(Date.now());

  useFrame(() => {
    if (!ref.current || !active) return;
    const t = (Date.now() - startRef.current) / 1000;
    const scale = 1 + t * 3;
    ref.current.scale.set(scale, scale * 0.5, scale);
    const mesh = ref.current.children[0] as any;
    if (mesh?.material) {
      mesh.material.opacity = Math.max(0, 0.5 - t * 0.4);
    }
  });

  if (!active) return null;

  return (
    <group ref={ref} position={[x, 0.5, z]}>
      <mesh>
        <sphereGeometry args={[0.8, 8, 8]} />
        <meshStandardMaterial
          color="#b0b0b0"
          transparent
          opacity={0.5}
          roughness={1}
        />
      </mesh>
    </group>
  );
}

// Construction scaffolding that appears before a new building
interface ScaffoldingProps {
  x: number;
  z: number;
  targetHeight: number;
  progress: number; // 0..1
}

export function ConstructionScaffolding({
  x,
  z,
  targetHeight,
  progress,
}: ScaffoldingProps) {
  const currentHeight = targetHeight * Math.min(progress * 1.2, 1);

  return (
    <group position={[x, 0, z]}>
      {/* Base slab */}
      <mesh position={[0, 0.05, 0]}>
        <boxGeometry args={[2, 0.1, 2]} />
        <meshStandardMaterial color="#78716c" />
      </mesh>
      {/* Scaffold poles */}
      {([-0.7, 0.7] as number[]).map((px) =>
        ([-0.7, 0.7] as number[]).map((pz) => (
          <mesh
            key={`pole-${px}-${pz}`}
            position={[px, currentHeight / 2, pz]}
          >
            <cylinderGeometry args={[0.03, 0.03, currentHeight, 6]} />
            <meshStandardMaterial color="#f59e0b" metalness={0.5} roughness={0.3} />
          </mesh>
        ))
      )}
      {/* Cross beams */}
      {Array.from({ length: Math.floor(currentHeight / 0.8) }, (_, i) => (
        <mesh key={`beam-${i}`} position={[0, i * 0.8 + 0.4, 0]}>
          <boxGeometry args={[1.4, 0.04, 0.04]} />
          <meshStandardMaterial color="#f59e0b" metalness={0.4} />
        </mesh>
      ))}
      {/* Building shell growing upward */}
      {progress > 0.1 && (
        <mesh position={[0, (currentHeight * 0.6) / 2, 0]}>
          <boxGeometry args={[1.4, currentHeight * 0.6, 1.4]} />
          <meshStandardMaterial
            color="#94a3b8"
            roughness={0.6}
            transparent
            opacity={0.7 + progress * 0.3}
          />
        </mesh>
      )}
    </group>
  );
}