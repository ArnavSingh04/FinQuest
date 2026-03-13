"use client";

import { Canvas } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";

import { useCityStore } from "@/store/useCityStore";

import { CityGenerator } from "./CityGenerator";

export function CityScene() {
  const cityMetrics = useCityStore((state) => state.cityMetrics);

  return (
    <div className="glass-card h-[420px] overflow-hidden rounded-[2rem]">
      <Canvas
        camera={{ position: [6, 6, 8], fov: 42 }}
        shadows
        className="h-full w-full"
      >
        <color attach="background" args={["#06111f"]} />
        <ambientLight intensity={0.6} />
        <directionalLight
          position={[6, 10, 4]}
          intensity={1.5}
          castShadow
          shadow-mapSize-width={1024}
          shadow-mapSize-height={1024}
        />

        <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
          <planeGeometry args={[28, 28]} />
          <meshStandardMaterial color="#0f766e" />
        </mesh>

        {/* The generator converts city metrics into visible building types. */}
        <CityGenerator metrics={cityMetrics} />
        <OrbitControls enablePan={false} maxPolarAngle={Math.PI / 2.2} />
      </Canvas>
    </div>
  );
}
