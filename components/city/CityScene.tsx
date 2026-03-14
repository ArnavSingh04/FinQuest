"use client";

import { Canvas, useFrame } from "@react-three/fiber";
import { ContactShadows, OrbitControls, Sky, Stars, Cloud, Sparkles } from "@react-three/drei";
import { useEffect, useMemo, useRef, useState } from "react";
import type { Group } from "three";
import * as THREE from "three";

import { HAMMER_ANIMATION_DURATION } from "@/components/city/constants";
import { deriveCityFinance } from "@/lib/cityFinanceModel";
import { useCityStore } from "@/store/useCityStore";
import { CityGenerator } from "./CityGenerator";
import { MovingPedestrians, MovingTraffic } from "./Citytraffic";
import { DemolitionEffect, type DemolitionEvent } from "./Demolitioneffect";

// ─── Birds ────────────────────────────────────────────────────────────────────

function AmbientBirds({ count }: { count: number }) {
  const group = useRef<Group>(null);
  useFrame(({ clock }) => {
    if (!group.current) return;
    const t = clock.getElapsedTime();
    group.current.children.forEach((bird, i) => {
      const spd = 0.35 + i * 0.06;
      const r = 9 + i * 1.8;
      bird.position.set(Math.cos(t * spd + i * 1.1) * r, 11 + i * 0.7 + Math.sin(t * 1.5 + i) * 0.5, Math.sin(t * spd + i * 1.1) * r);
      bird.rotation.y = -(t * spd + i * 1.1) + Math.PI / 2;
      // Wing flap
      const wing = bird.children[0] as any;
      if (wing) wing.rotation.z = Math.sin(t * 8 + i) * 0.35;
    });
  });
  return (
    <group ref={group}>
      {Array.from({ length: Math.min(count, 9) }, (_, i) => (
        <group key={i}>
          <mesh>
            <boxGeometry args={[0.38, 0.03, 0.09]} />
            <meshStandardMaterial color="#2d2d2d" />
          </mesh>
        </group>
      ))}
    </group>
  );
}

// ─── Smog haze ────────────────────────────────────────────────────────────────

function PollutionHaze({ level }: { level: number }) {
  if (level < 0.15) return null;
  return (
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 5.5, 0]}>
      <planeGeometry args={[60, 60]} />
      <meshStandardMaterial color="#7a7a55" transparent opacity={level * 0.2} depthWrite={false} side={THREE.DoubleSide} />
    </mesh>
  );
}

// ─── Golden light shafts ──────────────────────────────────────────────────────

function GoldenShafts() {
  const ref = useRef<Group>(null);
  useFrame(({ clock }) => {
    if (!ref.current) return;
    ref.current.children.forEach((c: any, i) => {
      if (c.material) c.material.opacity = 0.04 + Math.sin(clock.getElapsedTime() * 0.4 + i) * 0.02;
    });
  });
  return (
    <group ref={ref}>
      {[-3, 0, 4].map((x, i) => (
        <mesh key={i} position={[x + 9, 8, 2]} rotation={[0, 0, 0.28]}>
          <coneGeometry args={[1.8, 15, 6]} />
          <meshStandardMaterial color="#ffcc44" transparent opacity={0.05} depthWrite={false} side={THREE.DoubleSide} />
        </mesh>
      ))}
    </group>
  );
}

// ─── Hammer animation ─────────────────────────────────────────────────────────

function HammerActor({ baseHeight }: { baseHeight: number }) {
  const ref = useRef<Group>(null);
  const t0 = useRef(Date.now());
  useEffect(() => { t0.current = Date.now(); }, []);
  useFrame(() => {
    if (!ref.current) return;
    const e = (Date.now() - t0.current) / 1000;
    const cyc = 0.6, cp = (e % cyc) / cyc;
    const impact = Math.sin(cp * Math.PI);
    ref.current.position.set(
      Math.sin(e * 3.1) * 0.45 + Math.sin(e * 1.2) * (0.25 + impact * 0.35) - impact * 1.3,
      baseHeight + 4.5 + Math.abs(Math.sin(e * 1.4)) * 0.35 - impact * 0.7,
      -1.3 + Math.sin(e * 1.3) * 0.25
    );
    ref.current.rotation.z = Math.sin(e * 2.6) * 0.45;
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
    </group>
  );
}

// ─── Main CityScene ───────────────────────────────────────────────────────────

export function CityScene() {
  const cityMetrics    = useCityStore(s => s.cityMetrics);
  const financeMetrics = useCityStore(s => s.financeMetrics);
  const setHeightMultiplier = useCityStore(s => s.setHeightMultiplier);
  const skyMode = useCityStore(s => s.skyMode);

  const [hammerActive, setHammerActive]       = useState(false);
  const [demolishActive, setDemolishActive]   = useState(false);
  const [demolishEvents, setDemolishEvents]   = useState<DemolitionEvent[]>([]);
  const prevLevelRef  = useRef(0);
  const prevDemolish  = useRef(false);
  const hammerTimer   = useRef<ReturnType<typeof setTimeout> | null>(null);

  const finance = useMemo(() => deriveCityFinance(financeMetrics), [financeMetrics]);

  useEffect(() => { setHeightMultiplier(finance.heightMultiplier); }, [finance.heightMultiplier, setHeightMultiplier]);

  // Hammer when development rises
  useEffect(() => {
    if (finance.developmentLevel > prevLevelRef.current) {
      setHammerActive(true);
      if (hammerTimer.current) clearTimeout(hammerTimer.current);
      hammerTimer.current = setTimeout(() => setHammerActive(false), HAMMER_ANIMATION_DURATION);
    }
    prevLevelRef.current = finance.developmentLevel;
    return () => { if (hammerTimer.current) clearTimeout(hammerTimer.current); };
  }, [finance.developmentLevel]);

  // Meteor strike when wants overload
  useEffect(() => {
    if (finance.shouldDemolish && !prevDemolish.current && !demolishActive) {
      const baseEvents: DemolitionEvent[] = [
        { x: 0,    z: 0,    buildingHeight: 8 * finance.heightMultiplier, buildingColor: "#4cc9f0", type: "meteor" },
        { x: -3.2, z: 0,    buildingHeight: 6,                            buildingColor: "#7209b7", type: "meteor" },
        { x: 3.2,  z: -3.2, buildingHeight: 5,                            buildingColor: "#f72585", type: "meteor" },
      ];
      const events = baseEvents.slice(
        0,
        1 + Math.floor(finance.demolishIntensity * 2),
      );
      setDemolishEvents(events);
      setDemolishActive(true);
    }
    prevDemolish.current = finance.shouldDemolish;
  }, [finance.shouldDemolish, finance.demolishIntensity, finance.heightMultiplier, demolishActive]);

  const hammerBase = 10.6 + (finance.heightMultiplier - 1) * 2.2;
  const isNight  = skyMode === "night";
  const isGolden = finance.skyQuality === "golden" && !isNight;
  const isStormy = finance.skyQuality === "stormy" && !isNight;
  const isHazy   = finance.skyQuality === "hazy"   && !isNight;

  const bgColor = isNight ? "#01040d" : isStormy ? "#5a6470" : isGolden ? "#e8a44a" : isHazy ? "#c0baa6" : "#91cdee";
  const sun: [number, number, number] = isGolden ? [3, 3, 8] : [10, 13, 10];
  const skyProps = isNight
    ? { turbidity:1.2, rayleigh:0.15, mieCoefficient:0.002, mieDirectionalG:0.84, distance:360, inclination:0.05, azimuth:-0.4 }
    : isGolden
      ? { turbidity:14, rayleigh:3.5, mieCoefficient:0.05, mieDirectionalG:0.92, distance:450, inclination:0.08, azimuth:0.25 }
      : isStormy
        ? { turbidity:22, rayleigh:5, mieCoefficient:0.055, mieDirectionalG:0.48, distance:450, inclination:0.38, azimuth:0.3 }
        : { turbidity: isHazy ? 14 : 6, rayleigh:1.7, mieCoefficient:0.015, mieDirectionalG:0.7, distance:450, inclination:0.45, azimuth:0.3 };

  const birdCount = Math.floor(finance.resilience * 9 + finance.investScore * 3);

  return (
    <div className="relative glass-card h-[560px] overflow-hidden rounded-[2rem]">
      <Canvas camera={{ position: [15, 11, 15], fov: 42 }} shadows>
        <color attach="background" args={[bgColor]} />
        <Sky sunPosition={sun} {...skyProps} />
        {isNight && <Stars radius={160} depth={70} count={6000} factor={7} saturation={0} fade speed={0.2} />}
        {(isStormy || isHazy) && <>
          <Cloud position={[-8, 14, -6]} speed={0.2} opacity={0.65} />
          <Cloud position={[6, 12, 8]} speed={0.15} opacity={0.5} />
          <Cloud position={[0, 17, 0]} speed={0.1} opacity={0.75} />
        </>}
        {finance.prosperityGlow > 0.55 && !isNight && (
          <Sparkles count={28} scale={20} size={1.4} speed={0.28} color="#ffd700" position={[0, 9, 0]} />
        )}
        {isGolden && <GoldenShafts />}

        <ambientLight intensity={isNight ? 0.35 : isStormy ? 0.48 : 0.88} />
        <hemisphereLight args={isNight ? ["#273a5f51","#01040d",0.5] : isGolden ? ["#ffcc88","#e8a060",1.2] : ["#ffffff","#b4f1c1",0.9]} />
        <directionalLight
          position={sun} castShadow
          intensity={isNight ? 0.8 : isGolden ? 2.1 : isStormy ? 0.38 : 1.3}
          color={isNight ? "#1a2138" : isGolden ? "#ffa040" : isStormy ? "#6888a0" : "#fff7d9"}
          shadow-mapSize-width={2048} shadow-mapSize-height={2048} shadow-bias={-0.002}
        />
        <directionalLight position={[-6, 12, -8]} intensity={0.38} color="#a2c9ff" />

        <PollutionHaze level={finance.pollutionLevel} />
        <CityGenerator metrics={cityMetrics} finance={finance} />
        <MovingTraffic trafficDensity={finance.trafficDensity} infrastructureHealth={finance.infrastructureHealth} />
        <MovingPedestrians density={finance.pedestrianDensity} />
        {birdCount > 0 && <AmbientBirds count={birdCount} />}
        {hammerActive && <HammerActor baseHeight={hammerBase} />}
        <DemolitionEffect
          events={demolishEvents}
          active={demolishActive}
          intensity={finance.demolishIntensity}
          onComplete={() => setDemolishActive(false)}
        />

        <ContactShadows position={[0, -0.02, 0]} scale={38} opacity={0.28} blur={2.4} far={22} />
        <OrbitControls enablePan={false} maxPolarAngle={Math.PI / 2.1} minPolarAngle={Math.PI / 4.4} enableDamping dampingFactor={0.12} />
      </Canvas>

      {/* Demolition warning overlay */}
      {demolishActive && (
        <div className="absolute top-4 left-4 right-4 pointer-events-none">
          <div className="rounded-2xl border border-red-500/50 bg-red-950/70 px-4 py-2.5 flex items-center gap-2">
            <span className="text-lg">☄️</span>
            <div>
              <p className="text-sm font-semibold text-red-300">Meteor Strike!</p>
              <p className="text-xs text-red-400">Overspending on wants is destroying your city's towers!</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
