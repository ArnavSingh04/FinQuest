"use client";

import { useRef } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { OrbitControls, PerspectiveCamera } from "@react-three/drei";
import * as THREE from "three";

import { useGameStore } from "@/store/useGameStore";
import { CityGenerator } from "./CityGenerator";

const WEATHER = {
  thriving:    { bg: "#060e1c", fog: "#060e1c", ambient: 1.0,  dir: 2.8, dirColor: "#fff7d6", hemiSky: "#2563eb", hemiGround: "#166534" },
  clear:       { bg: "#090f1f", fog: "#090f1f", ambient: 0.75, dir: 2.1, dirColor: "#fff5e0", hemiSky: "#1e40af", hemiGround: "#14532d" },
  overcast:    { bg: "#111827", fog: "#111827", ambient: 0.5,  dir: 0.8, dirColor: "#c8d8e8", hemiSky: "#374151", hemiGround: "#1a2e1a" },
  rain:        { bg: "#0c1422", fog: "#0c1422", ambient: 0.3,  dir: 0.45, dirColor: "#8899aa", hemiSky: "#1e2a3a", hemiGround: "#111a11" },
  storm:       { bg: "#070c14", fog: "#070c14", ambient: 0.18, dir: 0.2,  dirColor: "#606878", hemiSky: "#111827", hemiGround: "#0a0f0a" },
  destruction: { bg: "#0f0404", fog: "#1a0505", ambient: 0.12, dir: 0.15, dirColor: "#ff4422", hemiSky: "#3b0a0a", hemiGround: "#0a0505" },
} as const;

function Lights() {
  const weather = useGameStore((s) => s.cityState.weather);
  const ambRef  = useRef<THREE.AmbientLight>(null);
  const dirRef  = useRef<THREE.DirectionalLight>(null);
  const hemiRef = useRef<THREE.HemisphereLight>(null);
  const cfg = WEATHER[weather];

  useFrame((_, dt) => {
    const k = dt * 1.4;
    if (ambRef.current)  ambRef.current.intensity  = THREE.MathUtils.lerp(ambRef.current.intensity,  cfg.ambient, k);
    if (dirRef.current)  dirRef.current.intensity  = THREE.MathUtils.lerp(dirRef.current.intensity,  cfg.dir, k);
    if (hemiRef.current) hemiRef.current.intensity = THREE.MathUtils.lerp(hemiRef.current.intensity, cfg.ambient * 0.6, k);
  });

  return (
    <>
      <ambientLight ref={ambRef} intensity={cfg.ambient} />
      <hemisphereLight
        ref={hemiRef}
        args={[cfg.hemiSky, cfg.hemiGround, cfg.ambient * 0.6]}
      />
      <directionalLight
        ref={dirRef}
        position={[8, 14, 6]}
        intensity={cfg.dir}
        color={cfg.dirColor}
        castShadow
        shadow-mapSize={[2048, 2048]}
        shadow-camera-near={0.5}
        shadow-camera-far={60}
        shadow-camera-left={-16}
        shadow-camera-right={16}
        shadow-camera-top={16}
        shadow-camera-bottom={-16}
      />
    </>
  );
}

function SceneFog() {
  const weather = useGameStore((s) => s.cityState.weather);
  const { scene } = useThree();
  const fogRef = useRef<THREE.Fog>(new THREE.Fog(WEATHER[weather].fog, 18, 42));

  useFrame((_, dt) => {
    const target = new THREE.Color(WEATHER[weather].fog);
    (fogRef.current.color as THREE.Color).lerp(target, dt * 1.2);
  });

  scene.fog = fogRef.current;
  return null;
}

function SkyBackground() {
  const weather = useGameStore((s) => s.cityState.weather);
  const ref = useRef<THREE.Color>(new THREE.Color(WEATHER[weather].bg));
  const { scene } = useThree();

  useFrame((_, dt) => {
    const target = new THREE.Color(WEATHER[weather].bg);
    (ref.current as THREE.Color).lerp(target, dt * 1.2);
    scene.background = ref.current;
  });
  return null;
}

interface CitySceneProps {
  height?: string;
}

export function CityScene({ height = "h-[480px]" }: CitySceneProps) {
  return (
    <div className={`overflow-hidden rounded-3xl border border-white/10 shadow-2xl ${height}`}>
      <Canvas shadows gl={{ antialias: true, toneMapping: THREE.ACESFilmicToneMapping, toneMappingExposure: 1.1 }}>
        <PerspectiveCamera makeDefault position={[9, 8, 11]} fov={40} />

        <SceneFog />
        <SkyBackground />
        <Lights />

        {/* Ground */}
        <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow position={[0, 0, 0]}>
          <planeGeometry args={[40, 40]} />
          <meshStandardMaterial color="#0f1a10" roughness={0.95} />
        </mesh>

        {/* Main road — horizontal */}
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.008, 0.3]}>
          <planeGeometry args={[40, 0.9]} />
          <meshStandardMaterial color="#1c1917" roughness={0.9} />
        </mesh>
        {/* Center line dashes drawn via a brighter strip */}
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.01, 0.3]}>
          <planeGeometry args={[40, 0.07]} />
          <meshStandardMaterial color="#f59e0b" emissive="#f59e0b" emissiveIntensity={0.5} />
        </mesh>

        {/* Main road — vertical */}
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[-0.4, 0.008, 0]}>
          <planeGeometry args={[0.9, 40]} />
          <meshStandardMaterial color="#1c1917" roughness={0.9} />
        </mesh>

        <CityGenerator />

        <OrbitControls
          enablePan={false}
          maxPolarAngle={Math.PI / 2.1}
          minDistance={5}
          maxDistance={22}
          target={[0, 1, 0]}
          autoRotate
          autoRotateSpeed={0.4}
        />
      </Canvas>
    </div>
  );
}
