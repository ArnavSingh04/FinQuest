"use client";

import { Canvas } from "@react-three/fiber";
import { ContactShadows, OrbitControls, Sky } from "@react-three/drei";
import { useCityStore } from "@/store/useCityStore";
import { CityGenerator } from "./CityGenerator";

export function CityScene() {
  const cityMetrics = useCityStore((state) => state.cityMetrics);

  const sunPosition: [number, number, number] = [10, 16, 10];

  return (
    <div className="glass-card h-[520px] overflow-hidden rounded-[2rem]">
      <Canvas
        camera={{ position: [15, 11, 15], fov: 42 }}
        shadows
        className="h-full w-full"
      >
        <color attach="background" args={["#bfe9ff"]} />

        <Sky
          sunPosition={sunPosition}
          turbidity={3}
          rayleigh={1.6}
          mieCoefficient={0.008}
          mieDirectionalG={0.84}
        />

        <ambientLight intensity={0.8} />
        <hemisphereLight args={["#ffffff", "#d8f3dc", 0.9]} />

        <directionalLight
          position={sunPosition}
          intensity={1.45}
          color="#fff4d6"
          castShadow
          shadow-mapSize-width={2048}
          shadow-mapSize-height={2048}
        />

        <directionalLight
          position={[-8, 10, -5]}
          intensity={0.3}
          color="#d6f0ff"
        />

        

        <CityGenerator metrics={cityMetrics} />

        <ContactShadows
          position={[0, -0.02, 0]}
          scale={38}
          opacity={0.28}
          blur={2.4}
          far={22}
        />

        <OrbitControls
          enablePan={false}
          maxPolarAngle={Math.PI / 2.15}
          minPolarAngle={Math.PI / 4.4}
        />
      </Canvas>
    </div>
  );
}
