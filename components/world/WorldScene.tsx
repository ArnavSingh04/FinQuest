"use client";

import { Canvas } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";

import { useWorldStore } from "@/store/useWorldStore";
import { CityGenerator } from "@/components/city/CityGenerator";

export function WorldScene() {
  const members = useWorldStore((state) => state.members);

  const spacing = 10;
  const cols = 3;

  return (
    <div className="glass-card h-[520px] overflow-hidden rounded-[2rem]">
      <Canvas camera={{ position: [12, 12, 18], fov: 45 }} shadows className="h-full w-full">
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
          <planeGeometry args={[60, 60]} />
          <meshStandardMaterial color="#0f766e" />
        </mesh>

        {members.map((member, index) => {
          const row = Math.floor(index / cols);
          const col = index % cols;
          const x = (col - (cols - 1) / 2) * spacing;
          const z = (row - Math.floor((members.length - 1) / cols) / 2) * spacing;

          return (
            <group key={member.id} position={[x, 0, z]}>
              <CityGenerator metrics={member.cityMetrics} />
            </group>
          );
        })}

        <OrbitControls enablePan={false} maxPolarAngle={Math.PI / 2.2} />
      </Canvas>
    </div>
  );
}
