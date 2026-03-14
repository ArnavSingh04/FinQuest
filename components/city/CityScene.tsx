"use client";

import { Canvas, useFrame } from "@react-three/fiber";
import { ContactShadows, OrbitControls, Sky, Stars, Cloud, Sparkles } from "@react-three/drei";
import { useEffect, useMemo, useRef } from "react";
import type { Group } from "three";
import * as THREE from "three";

import { deriveCityFinance } from "@/lib/cityFinanceModel";
import { useCityStore } from "@/store/useCityStore";
import { CityGenerator } from "./CityGenerator";
import { MovingPedestrians, MovingTraffic } from "./Citytraffic";

// ─── Ambient City Life ───────────────────────────────────────────────────────

function AmbientBirds({ count }: { count: number }) {
  const group = useRef<Group>(null);

  useFrame(({ clock }) => {
    if (!group.current) return;
    const t = clock.getElapsedTime();
    group.current.children.forEach((bird, i) => {
      const speed = 0.4 + i * 0.07;
      const radius = 8 + i * 1.5;
      const height = 12 + i * 0.8;
      bird.position.set(
        Math.cos(t * speed + i) * radius,
        height + Math.sin(t * 2 + i) * 0.5,
        Math.sin(t * speed + i) * radius
      );
      bird.rotation.y = -t * speed - i + Math.PI / 2;
    });
  });

  return (
    <group ref={group}>
      {Array.from({ length: count }, (_, i) => (
        <group key={`bird-${i}`}>
          {/* Wings */}
          <mesh>
            <boxGeometry args={[0.4, 0.03, 0.1]} />
            <meshStandardMaterial color="#2d2d2d" />
          </mesh>
          <mesh rotation={[0, 0, 0.3]}>
            <boxGeometry args={[0.15, 0.03, 0.08]} />
            <meshStandardMaterial color="#2d2d2d" />
          </mesh>
        </group>
      ))}
    </group>
  );
}

// ─── Pollution / Smog Layer ──────────────────────────────────────────────────

function PollutionHaze({ level }: { level: number }) {
  if (level < 0.2) return null;
  return (
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 6, 0]}>
      <planeGeometry args={[60, 60]} />
      <meshStandardMaterial
        color="#8b8b6b"
        transparent
        opacity={level * 0.18}
        depthWrite={false}
        side={THREE.DoubleSide}
      />
    </mesh>
  );
}

// ─── Golden Hour Light Shafts ─────────────────────────────────────────────────

function GoldenShafts() {
  const ref = useRef<Group>(null);
  useFrame(({ clock }) => {
    if (!ref.current) return;
    ref.current.children.forEach((shaft, i) => {
      const m = shaft as any;
      if (m.material) {
        m.material.opacity = 0.04 + Math.sin(clock.getElapsedTime() * 0.5 + i) * 0.02;
      }
    });
  });
  return (
    <group ref={ref}>
      {[-3, 0, 3].map((x, i) => (
        <mesh key={i} position={[x + 8, 8, 2]} rotation={[0, 0, 0.3]}>
          <coneGeometry args={[1.5, 14, 6]} />
          <meshStandardMaterial
            color="#ffcc44"
            transparent
            opacity={0.05}
            depthWrite={false}
            side={THREE.DoubleSide}
          />
        </mesh>
      ))}
    </group>
  );
}

// ─── Financial Health HUD ────────────────────────────────────────────────────

interface HUDProps {
  needs: number;
  wants: number;
  investments: number;
  assets: number;
  skyQuality: string;
}

function CityHealthOverlay({ needs, wants, investments, assets, skyQuality }: HUDProps) {
  const total = needs + wants + investments + assets || 1;

  const bars = [
    { label: "Needs",   value: needs / total,       color: "#22c55e", icon: "🏗️" },
    { label: "Invest",  value: investments / total,  color: "#3b82f6", icon: "📈" },
    { label: "Treats",  value: assets / total,       color: "#a78bfa", icon: "🌳" },
    { label: "Wants",   value: wants / total,        color: "#f97316", icon: "🎮" },
  ];

  const healthMessages: Record<string, string> = {
    clear: "✨ Balanced city — keep it up!",
    golden: "🌟 Thriving metropolis!",
    hazy: "💨 Reduce wants spending to clear the smog",
    stormy: "⚠️ City stressed — prioritise needs & invest",
  };

  return (
    <div className="absolute bottom-4 left-4 right-4 pointer-events-none">
      <div className="glass-card rounded-2xl p-3 flex flex-col gap-2">
        <p className="text-xs text-slate-400 font-medium uppercase tracking-widest">
          City Health
        </p>
        <div className="flex gap-2">
          {bars.map((b) => (
            <div key={b.label} className="flex-1">
              <div className="flex items-center gap-1 mb-1">
                <span className="text-[10px]">{b.icon}</span>
                <span className="text-[10px] text-slate-300">{b.label}</span>
              </div>
              <div className="h-1.5 rounded-full bg-slate-700 overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-700"
                  style={{
                    width: `${Math.round(b.value * 100)}%`,
                    background: b.color,
                  }}
                />
              </div>
              <span className="text-[10px] text-slate-400">
                {Math.round(b.value * 100)}%
              </span>
            </div>
          ))}
        </div>
        <p className="text-xs text-slate-300 text-center">
          {healthMessages[skyQuality] ?? healthMessages.clear}
        </p>
      </div>
    </div>
  );
}

// ─── Main Scene ───────────────────────────────────────────────────────────────

export function CityScene() {
  const cityMetrics = useCityStore((state) => state.cityMetrics);
  const financeMetrics = useCityStore((state) => state.financeMetrics);
  const setHeightMultiplier = useCityStore((state) => state.setHeightMultiplier);
  const skyMode = useCityStore((state) => state.skyMode);

  const finance = useMemo(
    () => deriveCityFinance(financeMetrics),
    [financeMetrics]
  );

  useEffect(() => {
    setHeightMultiplier(finance.heightMultiplier);
  }, [finance.heightMultiplier, setHeightMultiplier]);

  // ── Sky configuration ──────────────────────────────────────────────────────
  const isNight = skyMode === "night";
  const skyQuality =
    finance.instabilityRisk > 0.65
      ? "stormy"
      : finance.pollutionLevel > 0.45
        ? "hazy"
        : finance.prosperityGlow > 0.65 && finance.financialBalance > 0.55
          ? "golden"
          : "clear";
  const isGolden = skyQuality === "golden" && !isNight;
  const isStormy = skyQuality === "stormy" && !isNight;
  const isHazy = skyQuality === "hazy" && !isNight;

  const backgroundColor = isNight
    ? "#01040d"
    : isStormy
      ? "#2a3441"
      : isGolden
        ? "#5b2a1a"
        : isHazy
          ? "#2f3541"
          : "#0f172a";

  const sunPosition: [number, number, number] = isGolden
    ? [3, 3, 8]
    : [10, 13, 10];

  const skyProps = isNight
    ? { turbidity: 1.2, rayleigh: 0.15, mieCoefficient: 0.002, mieDirectionalG: 0.84,
        distance: 360, inclination: 0.05, azimuth: -0.4 }
    : isGolden
      ? { turbidity: 12, rayleigh: 3, mieCoefficient: 0.04, mieDirectionalG: 0.9,
          distance: 450, inclination: 0.1, azimuth: 0.25 }
      : isStormy
        ? { turbidity: 20, rayleigh: 4, mieCoefficient: 0.05, mieDirectionalG: 0.5,
            distance: 450, inclination: 0.4, azimuth: 0.3 }
        : { turbidity: 6 + (isHazy ? 8 : 0), rayleigh: 1.7, mieCoefficient: 0.015,
            mieDirectionalG: 0.7, distance: 450, inclination: 0.45, azimuth: 0.3 };

  const ambientIntensity = isNight ? 0.3 : isStormy ? 0.35 : 0.55;
  const sunIntensity = isNight ? 0.7 : isGolden ? 1.1 : isStormy ? 0.3 : 0.8;
  const sunColor = isNight ? "#1a2138" : isGolden ? "#7f1d1d" : isStormy ? "#475569" : "#1d4ed8";

  const birdCount = Math.floor(finance.resilience * 8 + finance.investments * 4);
  const trafficDensity = Math.min(
    1,
    0.2 + finance.lifestyleIntensity * 0.45 + finance.developmentScore * 0.35,
  );
  const pedestrianDensity = Math.min(
    1,
    0.2 + finance.infrastructureHealth * 0.35 + finance.lifestyleIntensity * 0.45,
  );

  return (
    <div className="relative glass-card h-[560px] overflow-hidden rounded-[2rem]">
      <Canvas
        camera={{ position: [15, 11, 15], fov: 42 }}
        shadows
        className="h-full w-full"
      >
        <color attach="background" args={[backgroundColor]} />
        <Sky sunPosition={sunPosition} {...skyProps} />

        {isNight && (
          <Stars
            radius={160} depth={70} count={6000}
            factor={7} saturation={0} fade speed={0.2}
          />
        )}

        {/* Cloudy / stormy weather */}
        {(isStormy || isHazy) && (
          <>
            <Cloud position={[-8, 14, -6]} speed={0.2} opacity={0.6} />
            <Cloud position={[6, 12, 8]} speed={0.15} opacity={0.5} />
            <Cloud position={[0, 16, 0]} speed={0.1} opacity={0.7} />
          </>
        )}

        {/* Prosperity sparkles */}
        {finance.prosperityGlow > 0.6 && !isNight && (
          <Sparkles
            count={30}
            scale={20}
            size={1.5}
            speed={0.3}
            color="#ffd700"
            position={[0, 8, 0]}
          />
        )}

        {/* Golden shafts of light */}
        {isGolden && <GoldenShafts />}

        <ambientLight intensity={ambientIntensity} />
        <hemisphereLight
          args={
            isNight
              ? ["#273a5f51", "#01040d", 0.5]
              : isGolden
                ? ["#ffcc88", "#e8a060", 1.2]
                : ["#ffffff", "#b4f1c1", 0.9]
          }
        />
        <directionalLight
          position={sunPosition}
          intensity={sunIntensity}
          color={sunColor}
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

        {/* Smog / pollution haze */}
        <PollutionHaze level={finance.pollutionLevel} />

        {/* City buildings */}
        <CityGenerator metrics={cityMetrics} finance={finance} />

        {/* Moving traffic */}
        <MovingTraffic
          trafficDensity={trafficDensity}
          infrastructureHealth={finance.infrastructureHealth}
        />

        {/* Moving pedestrians */}
        <MovingPedestrians density={pedestrianDensity} />

        {/* Birds when city is green and healthy */}
        {birdCount > 0 && <AmbientBirds count={Math.min(birdCount, 8)} />}

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

      {/* HUD overlay */}
      <CityHealthOverlay
        needs={financeMetrics.needs}
        wants={financeMetrics.wants}
        investments={financeMetrics.investments}
        assets={financeMetrics.assets}
        skyQuality={skyQuality}
      />
    </div>
  );
}
