"use client";

import { Canvas } from "@react-three/fiber";
import { Environment, OrbitControls, Sky } from "@react-three/drei";

import { useCityStore } from "@/store/useCityStore";

import { CityHUD } from "./CityHUD";
import { CityGenerator } from "./CityGenerator";

export function CityScene() {
  const cityMetrics = useCityStore((state) => state.cityMetrics);
  const hoveredStructure = useCityStore((state) => state.hoveredStructure);
  const selectedStructure = useCityStore((state) => state.selectedStructure);

  return (
    <div className="glass-card relative h-[520px] overflow-hidden rounded-[2rem]">
      <CityHUD
        cityMetrics={cityMetrics}
        hoveredStructure={hoveredStructure}
        selectedStructure={selectedStructure}
      />
      <Canvas
        camera={{ position: [8, 6, 9], fov: 42 }}
        shadows
        className="h-full w-full"
      >
        <color attach="background" args={["#07111f"]} />
        <fog attach="fog" args={["#07111f", 12, 28]} />
        <Sky sunPosition={[4, 1, 6]} />
        <ambientLight intensity={0.55} />
        <hemisphereLight
          intensity={0.8}
          groundColor="#0f172a"
          color="#cbd5e1"
        />
        <directionalLight
          position={[8, 12, 6]}
          intensity={1.8}
          castShadow
          shadow-mapSize-width={2048}
          shadow-mapSize-height={2048}
        />
        <Environment preset="city" />

        <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
          <planeGeometry args={[38, 38]} />
          <meshStandardMaterial color="#164e63" />
        </mesh>

        <mesh position={[0, -0.04, 0]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
          <ringGeometry args={[7, 13, 48]} />
          <meshStandardMaterial color="#14532d" />
        </mesh>

        {/* The generator converts city metrics into visible building types. */}
        <CityGenerator metrics={cityMetrics} />
        <OrbitControls
          enablePan
          enableZoom
          minDistance={5}
          maxDistance={18}
          maxPolarAngle={Math.PI / 2.1}
        />
      </Canvas>
    </div>
  );
}
