"use client";

import { Canvas, useFrame } from "@react-three/fiber";
import { ContactShadows, OrbitControls, Sky, Stars } from "@react-three/drei";
import { useEffect, useMemo, useRef, useState } from "react";
import type { Group } from "three";

import { HAMMER_ANIMATION_DURATION } from "@/components/city/constants";
import { deriveCityFinance } from "@/lib/cityFinanceModel";
import { useCityStore } from "@/store/useCityStore";
import { CityGenerator } from "./CityGenerator";

export function CityScene() {
  const cityMetrics = useCityStore((state) => state.cityMetrics);
  const financeMetrics = useCityStore((state) => state.financeMetrics);
  const setHeightMultiplier = useCityStore((state) => state.setHeightMultiplier);
  const skyMode = useCityStore((state) => state.skyMode);
  const [hammerActive, setHammerActive] = useState(false);
  const previousLevelRef = useRef<number>(0);
  const hammerTimeout = useRef<NodeJS.Timeout | null>(null);

  const finance = useMemo(() => deriveCityFinance(financeMetrics), [financeMetrics]);

  useEffect(() => {
    setHeightMultiplier(finance.heightMultiplier);
  }, [finance.heightMultiplier, setHeightMultiplier]);

  useEffect(() => {
    if (finance.developmentLevel > previousLevelRef.current) {
      setHammerActive(true);
      if (hammerTimeout.current) {
        clearTimeout(hammerTimeout.current);
      }
      hammerTimeout.current = setTimeout(() => {
        setHammerActive(false);
      }, HAMMER_ANIMATION_DURATION);
    }

    previousLevelRef.current = finance.developmentLevel;

    return () => {
      if (hammerTimeout.current) {
        clearTimeout(hammerTimeout.current);
        hammerTimeout.current = null;
      }
    };
  }, [finance.developmentLevel]);

  const sunPosition: [number, number, number] = [10, 13, 10];
  const hammerBaseHeight = 10.6 + (finance.heightMultiplier - 1) * 2.2;
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
          color={isNight ? "#1a2138" : "#fff7d9"}
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

        <CityGenerator metrics={cityMetrics} finance={finance} />

        {hammerActive && <HammerActor baseHeight={hammerBaseHeight} />}

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
  const startRef = useRef<number>(Date.now());

  useEffect(() => {
    startRef.current = Date.now();
  }, []);

  useFrame(() => {
    if (!ref.current) {
      return;
    }

    const elapsed = (Date.now() - startRef.current) / 1000;
    const knockCycle = 0.6;
    const cycleProgress = (elapsed % knockCycle) / knockCycle;
    const impact = Math.sin(cycleProgress * Math.PI);
    const sway = Math.sin(elapsed * 3.1);
    const rise = Math.abs(Math.sin(elapsed * 1.4)) * 0.35;
    const horizontalKnock = Math.sin(elapsed * 1.2);
    const knockPush = -impact * 1.3;

    ref.current.position.set(
      sway * 0.45 + horizontalKnock * (0.25 + impact * 0.35) + knockPush,
      baseHeight + 4.5 + rise - impact * 0.7,
      -1.3 + Math.sin(elapsed * 1.3) * 0.25,
    );
    ref.current.rotation.z = Math.sin(elapsed * 2.6) * 0.45;
    ref.current.rotation.x = -0.6 + impact * 0.5;
  });

  return (
    <group ref={ref} position={[0, baseHeight + 4.8, -1.3]} rotation={[0.35, 0.4, 0]} scale={1.6}>
      <mesh position={[0, -1.2, 0]}>
        <cylinderGeometry args={[0.18, 0.24, 4.8, 18]} />
        <meshStandardMaterial color="#6b4e2c" />
      </mesh>

      <mesh position={[0, 0.8, 0]}>
        <boxGeometry args={[2.2, 0.85, 1]} />
        <meshStandardMaterial color="#9ca3af" metalness={0.5} roughness={0.15} />
      </mesh>

      <mesh rotation={[0, 0, Math.PI / 2]} position={[1.3, 0.9, 0]}>
        <cylinderGeometry args={[0.26, 0.26, 0.4, 16]} />
        <meshStandardMaterial color="#9ca3af" />
      </mesh>

      <mesh rotation={[0, 0, Math.PI / 2]} position={[-1.3, 0.9, 0]}>
        <coneGeometry args={[0.26, 1, 16]} />
        <meshStandardMaterial color="#9ca3af" />
      </mesh>

      <mesh
        position={[0, -0.05, -0.8]}
        rotation={[-Math.PI / 2, 0, 0]}
        scale={1.4}
      >
        <circleGeometry args={[0.8, 32]} />
        <meshStandardMaterial
          color="#fecdd3"
          transparent
          opacity={0.45}
          emissive="#f97316"
          emissiveIntensity={0.8}
        />
      </mesh>
    </group>
  );
}
