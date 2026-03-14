"use client";

import { useEffect, useRef, useState } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { OrbitControls, PerspectiveCamera } from "@react-three/drei";
import type { OrbitControls as OrbitControlsImpl } from "three-stdlib";
import * as THREE from "three";

import { useGameStore } from "@/store/useGameStore";
import { CityStateContext, useCityStateOverride } from "@/contexts/CityStateContext";
import { getCityTier } from "@/lib/cityLevel";
import { CityGenerator } from "./CityGenerator";

// Fixed warm afternoon / golden hour — no day/night cycle
const WARM_AFTERNOON = {
  ambientColor: "#FFF5E0",
  ambientIntensity: 0.6,
  mainDirColor: "#FFD580",
  mainDirIntensity: 1.4,
  mainDirPosition: [50, 80, 30] as [number, number, number],
  fillColor: "#C8E0FF",
  fillIntensity: 0.4,
  fillPosition: [-30, 40, -20] as [number, number, number],
  fogColor: "#F0E8D0",
  fogNear: 80,
  fogFar: 200,
  skyColor: "#A8D8EA",
} as const;

const CAMERA_PRESETS = [
  { label: "Overview",    icon: "⬡", pos: [12, 12, 16]  as [number,number,number], target: [-1, 1, -2]  as [number,number,number] },
  { label: "Street",      icon: "🚶", pos: [0, 1.6, 7]   as [number,number,number], target: [0, 1.5, 0]  as [number,number,number] },
  { label: "Top Down",    icon: "🗺", pos: [-1, 28, 0.1] as [number,number,number], target: [-1, 0, -2]  as [number,number,number] },
  { label: "Finance",     icon: "🏦", pos: [6, 5, 4]     as [number,number,number], target: [4, 2, -2]   as [number,number,number] },
  { label: "West Side",   icon: "🏘️", pos: [-14, 6, 2]   as [number,number,number], target: [-8, 1, -3]  as [number,number,number] },
];

function Lights() {
  const c = WARM_AFTERNOON;
  return (
    <>
      <ambientLight color={c.ambientColor} intensity={c.ambientIntensity} />
      <directionalLight
        position={c.mainDirPosition}
        intensity={c.mainDirIntensity}
        color={c.mainDirColor}
        castShadow
        shadow-mapSize={[2048, 2048]}
        shadow-camera-near={0.5}
        shadow-camera-far={90}
        shadow-camera-left={-22}
        shadow-camera-right={22}
        shadow-camera-top={22}
        shadow-camera-bottom={-22}
      />
      <directionalLight
        position={c.fillPosition}
        intensity={c.fillIntensity}
        color={c.fillColor}
      />
    </>
  );
}

function SceneFog() {
  const { scene } = useThree();
  const c = WARM_AFTERNOON;
  scene.fog = new THREE.Fog(c.fogColor, c.fogNear, c.fogFar);
  return null;
}

function SkyBackground() {
  const { scene } = useThree();
  scene.background = new THREE.Color(WARM_AFTERNOON.skyColor);
  return null;
}

function CameraController({ preset }: { preset: typeof CAMERA_PRESETS[number] | null }) {
  const { camera } = useThree();
  const controlsRef = useRef<OrbitControlsImpl>(null);
  const targetPos = useRef(new THREE.Vector3(...(preset?.pos ?? [9, 8, 11])));
  const targetLook = useRef(new THREE.Vector3(...(preset?.target ?? [0, 1, 0])));

  useEffect(() => {
    if (preset) {
      targetPos.current.set(...preset.pos);
      targetLook.current.set(...preset.target);
    }
  }, [preset]);

  useFrame((_, dt) => {
    // Only enforce camera interpolation when a preset is active.
    // In free mode, let OrbitControls own rotate/zoom fully.
    if (preset) {
      camera.position.lerp(targetPos.current, dt * 2.5);
      if (controlsRef.current) {
        controlsRef.current.target.lerp(targetLook.current, dt * 2.5);
      }
    }
  }, -1);

  return (
    <OrbitControls
      ref={controlsRef}
      enableDamping
      dampingFactor={0.08}
      enablePan
      maxPolarAngle={Math.PI / 2.1}
      minDistance={2}
      maxDistance={120}
      autoRotate={false}
      zoomSpeed={0.45}
      rotateSpeed={0.85}
    />
  );
}

export function SceneContents({ preset }: { preset: typeof CAMERA_PRESETS[number] | null }) {
  return (
    <>
      <PerspectiveCamera makeDefault position={[12, 12, 16]} fov={42} />
      <SceneFog />
      <SkyBackground />
      <Lights />

      {/* Ground — primary grass */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[40, 40]} />
        <meshStandardMaterial color="#7AB648" roughness={0.9} />
      </mesh>
      {/* Roads — warm asphalt */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.008, 0.3]}>
        <planeGeometry args={[40, 0.9]} />
        <meshStandardMaterial color="#6B6560" roughness={0.85} />
      </mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.01, 0.3]}>
        <planeGeometry args={[40, 0.07]} />
        <meshStandardMaterial color="#FFE566" emissive="#FFE566" emissiveIntensity={0.4} />
      </mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[-0.4, 0.008, 0]}>
        <planeGeometry args={[0.9, 40]} />
        <meshStandardMaterial color="#6B6560" roughness={0.85} />
      </mesh>

      <CityGenerator />
      <CameraController preset={preset} />
    </>
  );
}

interface CityCanvasProps {
  className?: string;
  preset?: typeof CAMERA_PRESETS[number] | null;
  override?: import("@/contexts/CityStateContext").CityStateOverride | null;
}

export function CityCanvas({ className = "", preset = null, override = null }: CityCanvasProps) {
  const canvas = (
    <Canvas
      shadows
      className={className}
      gl={{ antialias: true, toneMapping: THREE.ACESFilmicToneMapping, toneMappingExposure: 1.15 }}
    >
      <SceneContents preset={preset} />
    </Canvas>
  );

  if (override) {
    return <CityStateContext.Provider value={override}>{canvas}</CityStateContext.Provider>;
  }
  return canvas;
}

export { CAMERA_PRESETS };

// ─── Fullscreen overlay ───────────────────────────────────────────────────────
const WEATHER_LABELS = { thriving: "Thriving", clear: "Clear", overcast: "Overcast", rain: "Rainy", storm: "Storm", destruction: "Destruction" } as const;
const WEATHER_ICONS  = { thriving: "✨", clear: "☀️", overcast: "⛅", rain: "🌧️", storm: "⛈️", destruction: "🔥" } as const;

export function CityFullscreen({ onClose }: { onClose: () => void }) {
  const [preset, setPreset] = useState<typeof CAMERA_PRESETS[number] | null>(null);
  const cityState = useGameStore((s) => s.cityState);
  const cityName  = useGameStore((s) => s.cityName);
  const tier      = getCityTier(cityState.healthScore);

  // Close on Escape
  useEffect(() => {
    function onKey(e: KeyboardEvent) { if (e.key === "Escape") onClose(); }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-black">
      {/* Top bar */}
      <div className="absolute top-0 left-0 right-0 z-10 flex items-center justify-between gap-3 p-3 bg-gradient-to-b from-black/70 to-transparent pointer-events-none">
        <div className="flex gap-2 pointer-events-auto">
          {CAMERA_PRESETS.map((p) => (
            <button
              key={p.label}
              onClick={() => setPreset(preset?.label === p.label ? null : p)}
              className={`rounded-xl px-3 py-1.5 text-xs font-semibold transition border ${
                preset?.label === p.label
                  ? "border-sky-400 bg-sky-500/30 text-sky-200"
                  : "border-white/15 bg-black/40 text-slate-300 hover:bg-white/10"
              }`}
            >
              {p.icon} {p.label}
            </button>
          ))}
        </div>
        <button
          onClick={onClose}
          className="pointer-events-auto rounded-xl border border-white/20 bg-black/50 px-3 py-1.5 text-sm font-semibold text-white hover:bg-white/10 transition"
        >
          ✕ Close
        </button>
      </div>

      {/* Canvas fills screen */}
      <CityCanvas className="flex-1 w-full" preset={preset} />

      {/* City stats HUD */}
      <div className="absolute bottom-10 left-1/2 -translate-x-1/2 z-10 flex items-center gap-4 rounded-2xl border border-white/10 bg-black/60 px-5 py-2.5 backdrop-blur-sm pointer-events-none">
        <div className="text-sm font-bold text-white leading-tight">{cityName}</div>
        <div className="h-4 w-px bg-white/15" />
        <div className="flex items-baseline gap-1">
          <span className={`text-lg font-black tabular-nums leading-none ${tier.color}`}>{cityState.healthScore}</span>
          <span className="text-[10px] text-slate-400">/100</span>
        </div>
        <div className="h-4 w-px bg-white/15" />
        <div className="flex items-center gap-1.5">
          <span className="text-base leading-none">{tier.icon}</span>
          <span className={`text-xs font-semibold ${tier.color}`}>{tier.name}</span>
        </div>
        <div className="h-4 w-px bg-white/15" />
        <div className="flex items-center gap-1">
          <span className="text-[11px] text-slate-400">Pop</span>
          <span className="text-xs font-semibold text-white tabular-nums">{cityState.population * 1000}K</span>
        </div>
        <div className="h-4 w-px bg-white/15" />
        <div className="flex items-center gap-1.5">
          <span className="text-sm leading-none">{WEATHER_ICONS[cityState.weather]}</span>
          <span className="text-xs text-slate-300">{WEATHER_LABELS[cityState.weather]}</span>
        </div>
      </div>
      {/* Bottom hint */}
      <div className="absolute bottom-3.5 left-1/2 -translate-x-1/2 text-xs text-slate-500 pointer-events-none">
        Drag to rotate · Scroll to zoom · Pinch on mobile
      </div>
    </div>
  );
}