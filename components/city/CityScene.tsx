"use client";

import { useRef } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import * as THREE from "three";

import { useGameStore } from "@/store/useGameStore";
import { CityGenerator } from "./CityGenerator";

const weatherConfig = {
  clear:    { bg: "#0a1628", ambient: 0.8, dirColor: "#ffe4b5", dirIntensity: 2.0 },
  overcast: { bg: "#141e2e", ambient: 0.55, dirColor: "#b0c4de", dirIntensity: 0.9 },
  rain:     { bg: "#0d1520", ambient: 0.35, dirColor: "#8090a0", dirIntensity: 0.55 },
  storm:    { bg: "#080e18", ambient: 0.2,  dirColor: "#707080", dirIntensity: 0.3 },
};

function WeatherLights() {
  const weather = useGameStore((s) => s.cityState.weather);
  const ambientRef = useRef<THREE.AmbientLight>(null);
  const dirRef = useRef<THREE.DirectionalLight>(null);

  const cfg = weatherConfig[weather];

  useFrame((_, delta) => {
    if (ambientRef.current) {
      ambientRef.current.intensity = THREE.MathUtils.lerp(
        ambientRef.current.intensity,
        cfg.ambient,
        delta * 1.5,
      );
    }
    if (dirRef.current) {
      dirRef.current.intensity = THREE.MathUtils.lerp(
        dirRef.current.intensity,
        cfg.dirIntensity,
        delta * 1.5,
      );
    }
  });

  return (
    <>
      <ambientLight ref={ambientRef} intensity={cfg.ambient} />
      <directionalLight
        ref={dirRef}
        position={[6, 10, 4]}
        intensity={cfg.dirIntensity}
        color={cfg.dirColor}
        castShadow
        shadow-mapSize-width={1024}
        shadow-mapSize-height={1024}
      />
    </>
  );
}

function Background() {
  const weather = useGameStore((s) => s.cityState.weather);
  return <color attach="background" args={[weatherConfig[weather].bg]} />;
}

interface CitySceneProps {
  height?: string;
}

export function CityScene({ height = "h-[480px]" }: CitySceneProps) {
  return (
    <div className={`glass-card overflow-hidden rounded-[2rem] ${height}`}>
      <Canvas camera={{ position: [7, 6, 9], fov: 42 }} shadows className="h-full w-full">
        <Background />
        <WeatherLights />

        {/* Ground */}
        <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
          <planeGeometry args={[30, 30]} />
          <meshStandardMaterial color="#0f5132" />
        </mesh>

        {/* Roads — cross pattern */}
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.01, 0]}>
          <planeGeometry args={[30, 0.6]} />
          <meshStandardMaterial color="#1a1a2e" />
        </mesh>
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.01, 0]}>
          <planeGeometry args={[0.6, 30]} />
          <meshStandardMaterial color="#1a1a2e" />
        </mesh>

        <CityGenerator />
        <OrbitControls enablePan={false} maxPolarAngle={Math.PI / 2.15} minDistance={4} maxDistance={20} />
      </Canvas>
    </div>
  );
}
