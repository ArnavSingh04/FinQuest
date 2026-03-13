"use client";

import { Canvas, useFrame } from "@react-three/fiber";
import { ContactShadows, OrbitControls, Sky, Stars } from "@react-three/drei";
import { useEffect, useRef, useState } from "react";
import type { Group } from "three";

import { useCityStore } from "@/store/useCityStore";
import { CityGenerator } from "./CityGenerator";

export function CityScene() {
  const cityMetrics = useCityStore((state) => state.cityMetrics);
  const heightMultiplier = useCityStore((state) => state.heightMultiplier);
  const needsBoostVersion = useCityStore((state) => state.needsBoostVersion);
  const skyMode = useCityStore((state) => state.skyMode);
  const [hammerActive, setHammerActive] = useState(false);
  const boostRef = useRef(needsBoostVersion);
  const hammerTimeout = useRef<NodeJS.Timeout | null>(null);

  const sunPosition: [number, number, number] = [10, 13, 10];

  useEffect(() => {
    if (needsBoostVersion > boostRef.current) {
      setHammerActive(true);
      if (hammerTimeout.current) {
        clearTimeout(hammerTimeout.current);
      }
      hammerTimeout.current = setTimeout(() => {
        setHammerActive(false);
      }, 3000);
    }

    boostRef.current = needsBoostVersion;

    return () => {
      if (hammerTimeout.current) {
        clearTimeout(hammerTimeout.current);
        hammerTimeout.current = null;
      }
    };
  }, [needsBoostVersion]);

  const hammerBaseHeight = 1.6 + (heightMultiplier - 1) * 2.2;
  const isNight = skyMode === "night";
  const backgroundColor = isNight ? "#01040d" : "#91cdee";
  const skyProps = isNight
    ? {
        turbidity: 1.2,
        rayleigh: 0.15,
        mieCoefficient: 0.002,
        mieDirectionalG: 0.84,
        distance: 360,
        inclination: 0.05,
        azimuth: -0.4,
      }
    : {
        turbidity: 6,
        rayleigh: 1.7,
        mieCoefficient: 0.015,
        mieDirectionalG: 0.7,
        distance: 450,
        inclination: 0.45,
        azimuth: 0.3,
      };

  return (
    <div className="glass-card h-[520px] overflow-hidden rounded-[2rem]">
      <Canvas
        camera={{ position: [15, 11, 15], fov: 42 }}
        shadows
        className="h-full w-full"
      >
        <color attach="background" args={[backgroundColor]} />
        <Sky sunPosition={sunPosition} {...skyProps} />
        {isNight && (
          <Stars
            radius={160}
            depth={70}
            count={6000}
            factor={7}
            saturation={0}
            fade
            speed={0.2}
          />
        )}

        <ambientLight intensity={isNight ? 0.35 : 0.85} />
        <hemisphereLight
          args={isNight ? ["#273a5f51", "#01040d", 0.5] : ["#ffffff", "#b4f1c1", 0.9]}
        />

        <directionalLight
          position={sunPosition}
          intensity={isNight ? 0.8 : 1.3}
          color={isNight ? "#c8d6ff" : "#fff7d9"}
          castShadow
          shadow-mapSize-width={2048}
          shadow-mapSize-height={2048}
          shadow-bias={-0.002}
        />

        <directionalLight
          position={[-6, 12, -8]}
          intensity={0.4}
          color="#a2c9ff"
        />

      

        <CityGenerator metrics={cityMetrics} />

        {hammerActive && (
          <HammerActor baseHeight={hammerBaseHeight} />
        )}

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
          enableDamping
          dampingFactor={0.12}
        />
      </Canvas>
    </div>
  );
}

interface HammerActorProps {
  baseHeight: number;
}

function HammerActor({ baseHeight }: HammerActorProps) {
  const ref = useRef<Group>(null);

  useFrame((state) => {
    if (!ref.current) {
      return;
    }

    const elapsed = state.clock.elapsedTime;
    const sway = Math.sin(elapsed * 22);
    ref.current.position.y = baseHeight + Math.abs(sway) * 0.2;
    ref.current.rotation.z = Math.sin(elapsed * 14) * 0.35;
    ref.current.rotation.x = -Math.abs(sway) * 0.1;
  });

  return (
    <group ref={ref} position={[0, baseHeight, 0]} rotation={[0, 0, 0.2]}>
      <mesh>
        <boxGeometry args={[0.4, 0.2, 1.2]} />
        <meshStandardMaterial color="#f97316" />
      </mesh>
      <mesh position={[0.25, -0.25, 0]}>
        <boxGeometry args={[0.18, 0.4, 0.18]} />
        <meshStandardMaterial color="#fde68a" />
      </mesh>
    </group>
  );
}
