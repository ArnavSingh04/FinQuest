"use client";

import type { CityMetrics } from "@/types";

interface CityGeneratorProps {
  metrics: CityMetrics;
}

function createIndexedArray(length: number) {
  return Array.from({ length }, (_, index) => index);
}

export function CityGenerator({ metrics }: CityGeneratorProps) {
  const housingCount = Math.max(2, Math.round(metrics.housing / 18));
  const entertainmentCount = Math.max(1, Math.round(metrics.entertainment / 25));
  const growthCount = Math.max(1, Math.round(metrics.growth / 22));
  const pollutionCount = Math.max(1, Math.round(metrics.pollution / 30));

  return (
    <group>
      {createIndexedArray(housingCount).map((index) => (
        <mesh
          key={`house-${index}`}
          position={[-4 + index * 1.2, 0.4, -1.8]}
          castShadow
          receiveShadow
        >
          <boxGeometry args={[0.75, 0.8 + index * 0.08, 0.75]} />
          <meshStandardMaterial color="#38bdf8" />
        </mesh>
      ))}

      {createIndexedArray(entertainmentCount).map((index) => (
        <mesh
          key={`entertainment-${index}`}
          position={[-2 + index * 1.5, 0.65, 1.2]}
          castShadow
          receiveShadow
        >
          <boxGeometry args={[0.9, 1.3 + index * 0.35, 0.9]} />
          <meshStandardMaterial
            color={index % 2 === 0 ? "#a855f7" : "#f59e0b"}
            emissive={index % 2 === 0 ? "#6d28d9" : "#92400e"}
            emissiveIntensity={0.35}
          />
        </mesh>
      ))}

      {createIndexedArray(growthCount).map((index) => (
        <mesh
          key={`growth-${index}`}
          position={[1.5 + index * 1.4, 1.2 + index * 0.25, -0.3]}
          castShadow
          receiveShadow
        >
          <boxGeometry args={[0.85, 2.4 + index * 0.5, 0.85]} />
          <meshStandardMaterial color="#22c55e" />
        </mesh>
      ))}

      {createIndexedArray(pollutionCount).map((index) => (
        <mesh key={`pollution-${index}`} position={[2.2 + index, 2.8, 2 - index]}>
          <sphereGeometry args={[0.42 + index * 0.08, 16, 16]} />
          <meshStandardMaterial
            color="#94a3b8"
            transparent
            opacity={0.3}
          />
        </mesh>
      ))}
    </group>
  );
}
