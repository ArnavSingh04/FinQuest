"use client";

import { useCallback, useMemo, useRef, useState } from "react";
import { useFrame } from "@react-three/fiber";
import { Html } from "@react-three/drei";
import * as THREE from "three";

import { useGameStore } from "@/store/useGameStore";
import { useCityStateOverride } from "@/contexts/CityStateContext";

// ─── Unified city state hook (respects shared-city context override) ──────────
function useActiveCityState() {
  const override = useCityStateOverride();
  const storeCity = useGameStore((s) => s.cityState);
  const storeProps = useGameStore((s) => s.proportions);
  return override ?? { cityState: storeCity, proportions: storeProps };
}

// ─── Lerp scale hook ──────────────────────────────────────────────────────────
function useLerpScale(target: number, speed = 2.5) {
  const ref = useRef<THREE.Mesh>(null);
  const targetRef = useRef(target);
  targetRef.current = target;
  useFrame((_, dt) => {
    if (!ref.current) return;
    ref.current.scale.y = THREE.MathUtils.lerp(ref.current.scale.y, targetRef.current, dt * speed);
    ref.current.position.y = ref.current.scale.y * 0.5;
  });
  return ref;
}

// ─── Window grid helper ───────────────────────────────────────────────────────
// Creates a grid of small emissive rectangles across a building face
interface WindowGridProps {
  cols: number; rows: number;
  width: number; height: number;
  depth: number;        // half-depth offset from center (which face to place on)
  facingZ?: boolean;    // true = +Z face, false = +X face
  winColor?: string;
  winEmissive?: string;
  winIntensity?: number;
  baseY?: number;
}

function WindowGrid({
  cols, rows, width, height, depth,
  facingZ = true,
  winColor = "#ffffff",
  winEmissive = "#f8fafc",
  winIntensity = 0.9,
  baseY = 0,
}: WindowGridProps) {
  const windows = useMemo(() => {
    const items: { x: number; y: number }[] = [];
    const colStep = width / (cols + 1);
    const rowStep = height / (rows + 1);
    for (let c = 1; c <= cols; c++) {
      for (let r = 1; r <= rows; r++) {
        items.push({ x: -width / 2 + c * colStep, y: baseY + r * rowStep });
      }
    }
    return items;
  }, [cols, rows, width, height, baseY]);

  const winW = width / (cols + 1) * 0.38;
  const winH = height / (rows + 1) * 0.45;
  // Keep windows almost flush with wall, but slightly outside to avoid z-fighting.
  const surfaceDepth = depth >= 0 ? depth + 0.003 : depth - 0.003;

  return (
    <>
      {windows.map(({ x, y }, i) => {
        // random ~20% chance window is dark (office empty / blinds)
        const dark = (i * 7 + cols) % 5 === 0;
        return (
          <mesh
            key={i}
            position={facingZ ? [x, y, surfaceDepth] : [surfaceDepth, y, x]}
            rotation={facingZ ? [0, 0, 0] : [0, Math.PI / 2, 0]}
          >
            <boxGeometry args={[winW, winH, 0.012]} />
            <meshStandardMaterial
              color={dark ? "#334155" : winColor}
              emissive={dark ? "#000" : winEmissive}
              emissiveIntensity={dark ? 0 : winIntensity}
              roughness={0.35}
              metalness={0.2}
              side={THREE.DoubleSide}
            />
          </mesh>
        );
      })}
    </>
  );
}

// ─── Apartment building ───────────────────────────────────────────────────────
const APT_COLORS = ["#7c3aed", "#6d28d9", "#5b21b6", "#8b5cf6", "#4c1d95"] as const;

function Apartment({ x, z, idx }: { x: number; z: number; idx: number }) {
  const { cityState } = useActiveCityState();
  const count = cityState.apartmentCount;
  const visible = idx < count;
  const baseH = 1.9 + (idx % 4) * 0.7;
  const topH  = baseH * 0.5;
  const baseWindowRows = Math.max(1, Math.floor(baseH * 0.9)); // ~50% fewer than before
  const baseWindowBandHeight = Math.max(0.35, baseH * 0.35);   // keep windows near the bottom
  const target = visible ? 1 : 0.01;
  const color = APT_COLORS[idx % APT_COLORS.length];

  const baseRef  = useLerpScale(target);
  const upperRef = useLerpScale(target, 2.2);

  const bW = 0.88; const bD = 0.88;
  const tW = 0.58; const tD = 0.58;

  return (
    <group position={[x, 0, z]}>
      {/* Base block */}
      <mesh ref={baseRef} position={[0, baseH * 0.5, 0]} castShadow receiveShadow>
        <boxGeometry args={[bW, baseH, bD]} />
        <meshStandardMaterial color={color} emissive={color} emissiveIntensity={0.18} roughness={0.55} metalness={0.12} />
      </mesh>
      {/* Window grids on all 4 faces */}
      <WindowGrid cols={2} rows={baseWindowRows} width={bW - 0.1} height={baseWindowBandHeight} depth={bD / 2} facingZ baseY={0.04} />
      <WindowGrid cols={2} rows={baseWindowRows} width={bW - 0.1} height={baseWindowBandHeight} depth={-bD / 2} facingZ baseY={0.04} />
      <WindowGrid cols={2} rows={baseWindowRows} width={bD - 0.1} height={baseWindowBandHeight} depth={bW / 2} facingZ={false} baseY={0.04} winIntensity={1.2} />
      <WindowGrid cols={2} rows={baseWindowRows} width={bD - 0.1} height={baseWindowBandHeight} depth={-bW / 2} facingZ={false} baseY={0.04} winIntensity={1.2} />

      {/* Upper setback */}
      <mesh ref={upperRef} position={[0, baseH + topH * 0.5, 0]} castShadow>
        <boxGeometry args={[tW, topH, tD]} />
        <meshStandardMaterial color={color} roughness={0.5} metalness={0.16} emissive={color} emissiveIntensity={0.2} />
      </mesh>
      {/* Keep apartment windows in the lower/base section only */}

      {/* Entrance canopy */}
      <mesh position={[0, 0.22, bD / 2 + 0.14]}>
        <boxGeometry args={[0.5, 0.05, 0.28]} />
        <meshStandardMaterial color="#1e293b" roughness={0.7} metalness={0.3} />
      </mesh>
    </group>
  );
}

// ─── Restaurant building ──────────────────────────────────────────────────────
const REST_PALETTE = [
  { wall: "#c2410c", sign: "#f97316", trim: "#ea580c" },
  { wall: "#b45309", sign: "#fbbf24", trim: "#d97706" },
  { wall: "#7c3aed", sign: "#a78bfa", trim: "#8b5cf6" },
  { wall: "#0369a1", sign: "#38bdf8", trim: "#0284c7" },
  { wall: "#065f46", sign: "#34d399", trim: "#059669" },
] as const;

function Restaurant({ x, z, idx }: { x: number; z: number; idx: number }) {
  const { cityState } = useActiveCityState();
  const count = cityState.restaurantCount;
  const visible = idx < count;
  const h = 1.05 + (idx % 3) * 0.35;
  const pal = REST_PALETTE[idx % REST_PALETTE.length];
  const bW = 1.1; const bD = 0.95;

  if (!visible) {
    return null;
  }

  return (
    <group position={[x, 0, z]}>
      {/* Main block */}
      <mesh position={[0, h * 0.5, 0]} castShadow receiveShadow>
        <boxGeometry args={[bW, h, bD]} />
        <meshStandardMaterial
          color={pal.wall}
          emissive={pal.wall}
          emissiveIntensity={0.08}
          roughness={0.5}
          metalness={0.05}
          transparent={false}
          opacity={1}
        />
      </mesh>
      {/* Shop windows (large lower panes) */}
      <WindowGrid
        cols={3}
        rows={1}
        width={bW - 0.12}
        height={h * 0.22}
        depth={bD / 2}
        facingZ
        baseY={0.08}
        winColor="#f8fafc"
        winEmissive="#e2e8f0"
        winIntensity={0.25}
      />
      {/* Awning */}
      <mesh position={[0, h + 0.06, bD / 2 + 0.04]}>
        <boxGeometry args={[bW, 0.06, 0.28]} />
        <meshStandardMaterial color={pal.trim} emissive={pal.trim} emissiveIntensity={0.6} roughness={0.5} />
      </mesh>
      {/* Sign board */}
      <mesh position={[0, h - 0.12, bD / 2 + 0.02]}>
        <boxGeometry args={[bW * 0.7, 0.14, 0.025]} />
        <meshStandardMaterial color={pal.sign} emissive={pal.sign} emissiveIntensity={1.2} roughness={0.3} />
      </mesh>
      {/* AC unit on side */}
      <mesh position={[bW / 2 + 0.04, h * 0.7, 0]}>
        <boxGeometry args={[0.08, 0.12, 0.18]} />
        <meshStandardMaterial color="#374151" roughness={0.9} />
      </mesh>
    </group>
  );
}

// ─── Bank Tower ───────────────────────────────────────────────────────────────
function BankTower({ x, z }: { x: number; z: number }) {
  const { cityState } = useActiveCityState();
  const height = cityState.bankHeight;
  const mainRef  = useLerpScale(height, 2);
  const crownRef = useLerpScale(height * 0.18, 2);

  const bW = 0.95; const bD = 0.95;
  const towerRows = Math.max(3, Math.floor(height * 1.8));
  const towerCols = Math.max(2, Math.min(5, Math.floor(height * 0.7) + 2));

  return (
    <group position={[x, 0, z]}>
      {/* Podium base */}
      <mesh position={[0, 0.3, 0]} castShadow receiveShadow>
        <boxGeometry args={[1.55, 0.6, 1.55]} />
        <meshStandardMaterial color="#1e3a8a" roughness={0.35} metalness={0.5} />
      </mesh>
      {/* Podium columns decorative */}
      {[-0.55, 0.55].map((cx) => (
        <mesh key={cx} position={[cx, 0.38, 0.78]} castShadow>
          <cylinderGeometry args={[0.055, 0.065, 0.76, 8]} />
          <meshStandardMaterial color="#1d4ed8" roughness={0.3} metalness={0.6} />
        </mesh>
      ))}

      {/* Main shaft */}
      <mesh ref={mainRef} position={[0, height * 0.5, 0]} castShadow>
        <boxGeometry args={[bW, 1, bD]} />
        <meshStandardMaterial color="#1d4ed8" roughness={0.2} metalness={0.65} emissive="#172554" emissiveIntensity={0.7} />
      </mesh>
      {/* Window grids all 4 faces */}
      <WindowGrid cols={towerCols} rows={towerRows} width={bW - 0.12} height={height - 0.6} depth={bD / 2} facingZ baseY={0.65} winColor="#bfdbfe" winEmissive="#93c5fd" winIntensity={1.4} />
      <WindowGrid cols={towerCols} rows={towerRows} width={bW - 0.12} height={height - 0.6} depth={-bD / 2} facingZ baseY={0.65} winColor="#bfdbfe" winEmissive="#93c5fd" winIntensity={1.4} />
      <WindowGrid cols={towerCols} rows={towerRows} width={bD - 0.12} height={height - 0.6} depth={bW / 2} facingZ={false} baseY={0.65} winColor="#bfdbfe" winEmissive="#93c5fd" winIntensity={1.0} />
      <WindowGrid cols={towerCols} rows={towerRows} width={bD - 0.12} height={height - 0.6} depth={-bW / 2} facingZ={false} baseY={0.65} winColor="#bfdbfe" winEmissive="#93c5fd" winIntensity={1.0} />

      {/* Mid setback */}
      <mesh position={[0, height * 0.72, 0]} castShadow>
        <boxGeometry args={[bW - 0.16, height * 0.06, bD - 0.16]} />
        <meshStandardMaterial color="#2563eb" roughness={0.25} metalness={0.7} emissive="#1d4ed8" emissiveIntensity={0.5} />
      </mesh>

      {/* Crown */}
      <mesh ref={crownRef} position={[0, height + height * 0.09, 0]}>
        <cylinderGeometry args={[0.06, 0.28, 1, 4]} />
        <meshStandardMaterial color="#60a5fa" emissive="#93c5fd" emissiveIntensity={1.6} metalness={0.5} />
      </mesh>
      {/* Top beacon */}
      <mesh position={[0, height + height * 0.2, 0]}>
        <sphereGeometry args={[0.055, 8, 8]} />
        <meshStandardMaterial color="#e0f2fe" emissive="#7dd3fc" emissiveIntensity={3} />
      </mesh>
      <pointLight position={[x, height + height * 0.2, z]} intensity={6} color="#93c5fd" distance={8} decay={2} />
    </group>
  );
}

// ─── Investment Tower ─────────────────────────────────────────────────────────
function InvestmentTower({ x, z }: { x: number; z: number }) {
  const { cityState } = useActiveCityState();
  const h = cityState.towerHeight;
  const mainRef  = useLerpScale(h, 2);
  const tipRef   = useLerpScale(h * 0.25, 2);
  const windowRows = Math.max(3, Math.floor(h * 2.4));
  const windowBandHeight = Math.max(0.12, Math.min(0.22, (h * 0.72) / windowRows * 0.55));

  return (
    <group position={[x, 0, z]}>
      {/* Base ring */}
      <mesh position={[0, 0.14, 0]}>
        <cylinderGeometry args={[0.75, 0.75, 0.28, 6]} />
        <meshStandardMaterial color="#064e3b" roughness={0.4} metalness={0.45} />
      </mesh>
      {/* Lobby glass ring */}
      <mesh position={[0, 0.42, 0]}>
        <cylinderGeometry args={[0.62, 0.68, 0.32, 6]} />
        <meshStandardMaterial color="#ecfdf5" roughness={0.1} metalness={0.3} transparent opacity={0.55} emissive="#a7f3d0" emissiveIntensity={0.5} />
      </mesh>

      {/* Main hex shaft */}
      <mesh ref={mainRef} position={[0, h * 0.5, 0]} castShadow>
        <cylinderGeometry args={[0.38, 0.46, 1, 6]} />
        <meshStandardMaterial color="#059669" roughness={0.18} metalness={0.55} emissive="#064e3b" emissiveIntensity={0.8} />
      </mesh>
      {/* Window bands on each hex face; row count scales with tower height */}
      {[0, 1, 2, 3, 4, 5].map((i) => {
        const angle = (i / 6) * Math.PI * 2;
        const yStart = Math.max(0.35, h * 0.16);
        const ySpan = Math.max(0.3, h * 0.68);
        const rowStep = ySpan / windowRows;
        return (
          <group key={i}>
            {Array.from({ length: windowRows }, (_, row) => (
              <mesh
                key={`${i}-${row}`}
                position={[
                  Math.cos(angle) * 0.42,
                  yStart + row * rowStep,
                  Math.sin(angle) * 0.42,
                ]}
                rotation={[0, -angle, 0]}
              >
                <planeGeometry args={[0.13, windowBandHeight]} />
                <meshStandardMaterial
                  color="#d1fae5"
                  emissive="#6ee7b7"
                  emissiveIntensity={1.1}
                  roughness={0.25}
                  metalness={0.2}
                />
              </mesh>
            ))}
          </group>
        );
      })}

      {/* Upper taper */}
      <mesh position={[0, h * 0.86, 0]}>
        <cylinderGeometry args={[0.22, 0.38, h * 0.18, 6]} />
        <meshStandardMaterial color="#10b981" roughness={0.2} metalness={0.5} emissive="#065f46" emissiveIntensity={0.6} />
      </mesh>

      {/* Glowing tip */}
      <mesh ref={tipRef} position={[0, h + h * 0.125, 0]}>
        <coneGeometry args={[0.18, 1, 6]} />
        <meshStandardMaterial color="#34d399" emissive="#6ee7b7" emissiveIntensity={2.0} />
      </mesh>
      <pointLight position={[x, h + h * 0.2, z]} intensity={8} color="#34d399" distance={10} decay={2} />
    </group>
  );
}

// ─── Tree ─────────────────────────────────────────────────────────────────────
function Tree({ x, z, scale = 1 }: { x: number; z: number; scale?: number }) {
  return (
    <group position={[x, 0, z]} scale={[scale, scale, scale]}>
      <mesh position={[0, 0.35, 0]} castShadow>
        <cylinderGeometry args={[0.06, 0.1, 0.7, 7]} />
        <meshStandardMaterial color="#713f12" roughness={0.95} />
      </mesh>
      {[
        { y: 0.9, r: 0.46, h: 0.76 },
        { y: 1.38, r: 0.34, h: 0.62 },
        { y: 1.74, r: 0.22, h: 0.5 },
        { y: 2.04, r: 0.12, h: 0.38 },
      ].map(({ y, r, h }, i) => (
        <mesh key={i} position={[0, y, 0]} castShadow>
          <coneGeometry args={[r, h, 8]} />
          <meshStandardMaterial color={i % 2 === 0 ? "#14532d" : "#166534"} roughness={0.8} />
        </mesh>
      ))}
    </group>
  );
}

// ─── Street Lamp ──────────────────────────────────────────────────────────────
function StreetLamp({ x, z }: { x: number; z: number }) {
  return (
    <group position={[x, 0, z]}>
      {/* Pole */}
      <mesh position={[0, 1.1, 0]}>
        <cylinderGeometry args={[0.032, 0.042, 2.2, 8]} />
        <meshStandardMaterial color="#374151" metalness={0.8} roughness={0.2} />
      </mesh>
      {/* Arm */}
      <mesh position={[0.1, 2.15, 0]} rotation={[0, 0, Math.PI / 12]}>
        <cylinderGeometry args={[0.018, 0.018, 0.3, 6]} />
        <meshStandardMaterial color="#374151" metalness={0.8} roughness={0.2} />
      </mesh>
      {/* Hood */}
      <mesh position={[0.2, 2.22, 0]}>
        <cylinderGeometry args={[0.1, 0.06, 0.1, 8]} />
        <meshStandardMaterial color="#1f2937" metalness={0.7} roughness={0.3} />
      </mesh>
      {/* Bulb */}
      <mesh position={[0.2, 2.16, 0]}>
        <sphereGeometry args={[0.07, 8, 8]} />
        <meshStandardMaterial color="#fef9c3" emissive="#fef08a" emissiveIntensity={4} />
      </mesh>
      <pointLight position={[0.2 + x, 2.1, z]} intensity={3.5} color="#fef08a" distance={5} decay={2} />
    </group>
  );
}

// ─── Pollution cloud ──────────────────────────────────────────────────────────
function PollutionCloud({ x, y, z, opacity }: { x: number; y: number; z: number; opacity: number }) {
  const ref = useRef<THREE.Group>(null);
  useFrame(({ clock }) => {
    if (ref.current) ref.current.position.y = y + Math.sin(clock.elapsedTime * 0.3 + x) * 0.2;
  });
  return (
    <group ref={ref} position={[x, y, z]}>
      <mesh>
        <sphereGeometry args={[0.6, 9, 9]} />
        <meshStandardMaterial color="#57534e" transparent opacity={opacity} roughness={1} depthWrite={false} />
      </mesh>
      <mesh position={[0.45, 0.18, 0]}>
        <sphereGeometry args={[0.42, 8, 8]} />
        <meshStandardMaterial color="#44403c" transparent opacity={opacity * 0.9} roughness={1} depthWrite={false} />
      </mesh>
      <mesh position={[-0.38, 0.12, 0.2]}>
        <sphereGeometry args={[0.35, 8, 8]} />
        <meshStandardMaterial color="#292524" transparent opacity={opacity * 0.8} roughness={1} depthWrite={false} />
      </mesh>
    </group>
  );
}

// ─── Rain ─────────────────────────────────────────────────────────────────────
function Rain() {
  const { cityState } = useActiveCityState();
  const weather = cityState.weather;
  const ref = useRef<THREE.Points>(null);
  const COUNT = 900;
  const XZ_SPREAD = 28;
  const Y_MIN = -1;
  const Y_MAX = 16;
  const positions = useMemo(() => {
    const arr = new Float32Array(COUNT * 3);
    for (let i = 0; i < COUNT; i++) {
      arr[i * 3] = (Math.random() - 0.5) * XZ_SPREAD;
      arr[i * 3 + 1] = Math.random() * Y_MAX;
      arr[i * 3 + 2] = (Math.random() - 0.5) * XZ_SPREAD;
    }
    return arr;
  }, []);
  const fallFactors = useMemo(() => {
    const arr = new Float32Array(COUNT);
    for (let i = 0; i < COUNT; i++) arr[i] = 0.75 + Math.random() * 0.7;
    return arr;
  }, []);

  useFrame((_, dt) => {
    if (!ref.current) return;
    const isStorm = weather === "storm" || weather === "destruction";
    const speed = isStorm ? 12 : weather === "rain" ? 5 : 0;
    const pos = ref.current.geometry.attributes.position as THREE.BufferAttribute;
    for (let i = 0; i < COUNT; i++) {
      (pos.array as Float32Array)[i * 3 + 1] -= dt * speed * fallFactors[i];
      if ((pos.array as Float32Array)[i * 3 + 1] < Y_MIN) {
        // Respawn above view with random X/Z so rain feels continuous, not chunked.
        (pos.array as Float32Array)[i * 3] = (Math.random() - 0.5) * XZ_SPREAD;
        (pos.array as Float32Array)[i * 3 + 1] = Y_MAX + Math.random() * 6;
        (pos.array as Float32Array)[i * 3 + 2] = (Math.random() - 0.5) * XZ_SPREAD;
      }
    }
    pos.needsUpdate = true;
  });

  if (weather !== "rain" && weather !== "storm" && weather !== "destruction") return null;

  const isDestruction = weather === "destruction";
  return (
    <points ref={ref}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
      </bufferGeometry>
      <pointsMaterial
        color={isDestruction ? "#ff6644" : "#93c5fd"}
        size={isDestruction ? 0.08 : 0.05}
        transparent
        opacity={isDestruction ? 0.7 : weather === "storm" ? 0.75 : 0.45}
      />
    </points>
  );
}

// ─── Embers / sparks (thriving) ───────────────────────────────────────────────
function Embers() {
  const { cityState } = useActiveCityState();
  const weather = cityState.weather;
  const ref = useRef<THREE.Points>(null);
  const COUNT = 120;
  const positions = useMemo(() => {
    const arr = new Float32Array(COUNT * 3);
    for (let i = 0; i < COUNT; i++) {
      arr[i * 3]     = (Math.random() - 0.5) * 20;
      arr[i * 3 + 1] = Math.random() * 10;
      arr[i * 3 + 2] = (Math.random() - 0.5) * 20;
    }
    return arr;
  }, []);

  useFrame(({ clock }, dt) => {
    if (!ref.current || weather !== "thriving") return;
    const pos = ref.current.geometry.attributes.position as THREE.BufferAttribute;
    for (let i = 0; i < COUNT; i++) {
      (pos.array as Float32Array)[i * 3 + 1] += dt * (0.5 + Math.sin(clock.elapsedTime + i) * 0.3);
      (pos.array as Float32Array)[i * 3]     += Math.sin(clock.elapsedTime * 0.5 + i * 0.3) * dt * 0.2;
      if ((pos.array as Float32Array)[i * 3 + 1] > 12) (pos.array as Float32Array)[i * 3 + 1] = 0;
    }
    pos.needsUpdate = true;
  });

  if (weather !== "thriving") return null;

  return (
    <points ref={ref}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
      </bufferGeometry>
      <pointsMaterial color="#fbbf24" size={0.06} transparent opacity={0.85} />
    </points>
  );
}

// ─── Stars ────────────────────────────────────────────────────────────────────
function Stars() {
  const { cityState } = useActiveCityState();
  const positions = useMemo(() => {
    const arr = new Float32Array(300 * 3);
    for (let i = 0; i < 300; i++) {
      arr[i * 3]     = (Math.random() - 0.5) * 80;
      arr[i * 3 + 1] = 14 + Math.random() * 28;
      arr[i * 3 + 2] = (Math.random() - 0.5) * 80;
    }
    return arr;
  }, []);

  const weather = cityState.weather;
  const opacity = weather === "thriving" ? 1.0 : weather === "clear" ? 0.75 : weather === "overcast" ? 0.15 : 0;

  return (
    <points>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
      </bufferGeometry>
      <pointsMaterial color="#e2e8f0" size={0.07} transparent opacity={opacity} />
    </points>
  );
}

// ─── Park ─────────────────────────────────────────────────────────────────────
function Park({ x, z, w, d }: { x: number; z: number; w: number; d: number }) {
  return (
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[x, 0.005, z]} receiveShadow>
      <planeGeometry args={[w, d]} />
      <meshStandardMaterial color="#14532d" roughness={0.9} />
    </mesh>
  );
}

// ─── Pavement ─────────────────────────────────────────────────────────────────
function Pavement({ x, z, w, d }: { x: number; z: number; w: number; d: number }) {
  return (
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[x, 0.006, z]} receiveShadow>
      <planeGeometry args={[w, d]} />
      <meshStandardMaterial color="#374151" roughness={0.85} />
    </mesh>
  );
}

// ─── Bench ────────────────────────────────────────────────────────────────────
function Bench({ x, z }: { x: number; z: number }) {
  return (
    <group position={[x, 0, z]}>
      <mesh position={[0, 0.22, 0]}>
        <boxGeometry args={[0.5, 0.06, 0.16]} />
        <meshStandardMaterial color="#78350f" roughness={0.9} />
      </mesh>
      {[-0.2, 0.2].map((lx) => (
        <mesh key={lx} position={[lx, 0.12, 0]}>
          <boxGeometry args={[0.04, 0.24, 0.14]} />
          <meshStandardMaterial color="#92400e" roughness={0.9} />
        </mesh>
      ))}
    </group>
  );
}

// ─── Lightning bolt (storm/destruction) ───────────────────────────────────────
function Lightning() {
  const { cityState } = useActiveCityState();
  const weather = cityState.weather;
  const ref = useRef<THREE.Mesh>(null);
  const timerRef = useRef(0);
  const visRef = useRef(false);

  useFrame(({ clock }, dt) => {
    timerRef.current -= dt;
    if (timerRef.current <= 0) {
      timerRef.current = 1.5 + Math.random() * 3.5;
      visRef.current = !visRef.current && Math.random() > 0.4;
    }
    if (ref.current) {
      ref.current.visible = visRef.current && (weather === "storm" || weather === "destruction");
      // Flicker effect
      if (ref.current.visible) {
        ref.current.position.x = (Math.random() - 0.5) * 10;
        ref.current.position.z = (Math.random() - 0.5) * 10;
        (ref.current.material as THREE.MeshStandardMaterial).emissiveIntensity =
          2 + Math.sin(clock.elapsedTime * 30) * 2;
      }
    }
  });

  return (
    <mesh ref={ref} position={[3, 6, -2]} rotation={[0, 0, 0.2]}>
      <cylinderGeometry args={[0.03, 0.015, 6, 4]} />
      <meshStandardMaterial color="#e0f2fe" emissive="#7dd3fc" emissiveIntensity={4} transparent opacity={0.9} />
    </mesh>
  );
}

// ─── School building (appears when needs ≥ 40%) ──────────────────────────────
function School({ x, z }: { x: number; z: number }) {
  const { cityState } = useActiveCityState();
  const visible = cityState.apartmentCount >= 4; // proxy for needs ≥ 40%
  const target = visible ? 1 : 0.01;
  const bodyRef = useLerpScale(target);
  const towerRef = useLerpScale(target, 1.8);

  return (
    <group position={[x, 0, z]}>
      {/* Main building body */}
      <mesh ref={bodyRef} position={[0, 0.55, 0]} castShadow receiveShadow>
        <boxGeometry args={[1.4, 1.1, 1.0]} />
        <meshStandardMaterial color="#4ade80" roughness={0.6} metalness={0.05} emissive="#166534" emissiveIntensity={0.3} />
      </mesh>
      {/* Clock tower */}
      <mesh ref={towerRef} position={[0, 1.4, 0]} castShadow>
        <boxGeometry args={[0.38, 0.8, 0.38]} />
        <meshStandardMaterial color="#22c55e" roughness={0.55} emissive="#14532d" emissiveIntensity={0.4} />
      </mesh>
      {/* Clock face */}
      <mesh position={[0, 1.58, 0.21]}>
        <cylinderGeometry args={[0.12, 0.12, 0.02, 12]} />
        <meshStandardMaterial color="#fef9c3" emissive="#fef08a" emissiveIntensity={1.5} />
      </mesh>
      {/* Roof peak */}
      <mesh position={[0, 1.85, 0]}>
        <coneGeometry args={[0.22, 0.35, 4]} />
        <meshStandardMaterial color="#15803d" roughness={0.7} />
      </mesh>
      {/* Windows */}
      <WindowGrid cols={3} rows={2} width={1.3} height={0.85} depth={0.51} facingZ baseY={0.12} winColor="#bfdbfe" winEmissive="#dbeafe" winIntensity={0.8} />
      {/* Flag pole */}
      <mesh position={[0.75, 1.6, 0]}>
        <cylinderGeometry args={[0.014, 0.014, 0.9, 5]} />
        <meshStandardMaterial color="#9ca3af" metalness={0.8} roughness={0.2} />
      </mesh>
      <mesh position={[0.9, 1.95, 0]}>
        <boxGeometry args={[0.28, 0.14, 0.02]} />
        <meshStandardMaterial color="#ef4444" emissive="#dc2626" emissiveIntensity={0.8} />
      </mesh>
    </group>
  );
}

// ─── Hospital (appears when invest ≥ 15%) ─────────────────────────────────────
function Hospital({ x, z }: { x: number; z: number }) {
  const { cityState } = useActiveCityState();
  const visible = cityState.towerHeight >= 1.5; // proxy for invest ≥ 15%
  const target = visible ? 1 : 0.01;
  const bodyRef = useLerpScale(target);

  const bodyH = 1.8;
  const bodyW = 1.4;
  const bodyD = 1.1;

  return (
    <group position={[x, 0, z]}>
      <mesh ref={bodyRef} position={[0, bodyH * 0.5, 0]} castShadow receiveShadow>
        <boxGeometry args={[bodyW, bodyH, bodyD]} />
        <meshStandardMaterial color="#f0f9ff" roughness={0.5} metalness={0.1} emissive="#e0f2fe" emissiveIntensity={0.2} />
      </mesh>
      {/* Red cross sign */}
      <mesh position={[0, bodyH * 0.62, bodyD / 2 + 0.02]}>
        <boxGeometry args={[0.32, 0.09, 0.025]} />
        <meshStandardMaterial color="#ef4444" emissive="#dc2626" emissiveIntensity={2} />
      </mesh>
      <mesh position={[0, bodyH * 0.62, bodyD / 2 + 0.02]}>
        <boxGeometry args={[0.09, 0.32, 0.025]} />
        <meshStandardMaterial color="#ef4444" emissive="#dc2626" emissiveIntensity={2} />
      </mesh>
      {/* Windows */}
      <WindowGrid
        cols={3}
        rows={4}
        width={bodyW - 0.2}
        height={bodyH - 0.45}
        depth={bodyD / 2}
        facingZ
        baseY={0.16}
        winColor="#e0f2fe"
        winEmissive="#bae6fd"
        winIntensity={0.9}
      />
      {/* Rooftop helipad */}
      <mesh position={[0, bodyH + 0.08, 0]}>
        <cylinderGeometry args={[0.35, 0.35, 0.04, 12]} />
        <meshStandardMaterial color="#fbbf24" emissive="#d97706" emissiveIntensity={0.6} />
      </mesh>
      <mesh position={[0, bodyH + 0.11, 0]}>
        <cylinderGeometry args={[0.28, 0.28, 0.02, 12]} />
        <meshStandardMaterial color="#f59e0b" emissive="#f59e0b" emissiveIntensity={1} />
      </mesh>
      {/* Entrance canopy */}
      <mesh position={[0, 0.24, bodyD / 2 + 0.1]}>
        <boxGeometry args={[0.7, 0.06, 0.3]} />
        <meshStandardMaterial color="#bae6fd" transparent opacity={0.7} />
      </mesh>
    </group>
  );
}

// ─── Park fountain ────────────────────────────────────────────────────────────
function Fountain({ x, z }: { x: number; z: number }) {
  const ref = useRef<THREE.Mesh>(null);
  useFrame(({ clock }) => {
    if (ref.current) {
      (ref.current.material as THREE.MeshStandardMaterial).emissiveIntensity =
        0.8 + Math.sin(clock.elapsedTime * 2) * 0.3;
    }
  });

  return (
    <group position={[x, 0, z]}>
      {/* Basin */}
      <mesh position={[0, 0.06, 0]}>
        <cylinderGeometry args={[0.55, 0.6, 0.12, 12]} />
        <meshStandardMaterial color="#475569" roughness={0.7} />
      </mesh>
      {/* Inner water */}
      <mesh position={[0, 0.1, 0]}>
        <cylinderGeometry args={[0.45, 0.45, 0.04, 12]} />
        <meshStandardMaterial color="#38bdf8" transparent opacity={0.7} emissive="#0ea5e9" emissiveIntensity={0.8} />
      </mesh>
      {/* Centre pillar */}
      <mesh position={[0, 0.3, 0]}>
        <cylinderGeometry args={[0.06, 0.09, 0.44, 8]} />
        <meshStandardMaterial color="#94a3b8" roughness={0.6} metalness={0.4} />
      </mesh>
      {/* Top tier */}
      <mesh position={[0, 0.55, 0]}>
        <cylinderGeometry args={[0.22, 0.22, 0.06, 10]} />
        <meshStandardMaterial color="#64748b" roughness={0.6} />
      </mesh>
      {/* Water jet (animated) */}
      <mesh ref={ref} position={[0, 0.72, 0]}>
        <sphereGeometry args={[0.06, 8, 8]} />
        <meshStandardMaterial color="#7dd3fc" transparent opacity={0.85} emissive="#38bdf8" emissiveIntensity={0.8} />
      </mesh>
      <pointLight position={[x, 0.55, z]} intensity={2.5} color="#38bdf8" distance={3.5} decay={2} />
    </group>
  );
}

// ─── Bridge over road intersection ───────────────────────────────────────────
function Bridge() {
  return (
    <group position={[-0.4, 0, 0.3]}>
      {/* Deck */}
      <mesh position={[0, 0.62, 0]} receiveShadow castShadow>
        <boxGeometry args={[0.7, 0.08, 1.8]} />
        <meshStandardMaterial color="#374151" roughness={0.8} />
      </mesh>
      {/* Railings */}
      {[-0.3, 0.3].map((rx) => (
        <mesh key={rx} position={[rx, 0.72, 0]}>
          <boxGeometry args={[0.04, 0.1, 1.8]} />
          <meshStandardMaterial color="#4b5563" roughness={0.9} />
        </mesh>
      ))}
      {/* Support pillars */}
      {[-0.7, 0.7].map((rz) => (
        <mesh key={rz} position={[0, 0.31, rz]} castShadow>
          <cylinderGeometry args={[0.07, 0.09, 0.62, 8]} />
          <meshStandardMaterial color="#374151" roughness={0.8} metalness={0.3} />
        </mesh>
      ))}
    </group>
  );
}

// ─── Car ──────────────────────────────────────────────────────────────────────
const CAR_COLORS = ["#dc2626", "#2563eb", "#16a34a", "#ca8a04", "#7c3aed", "#0891b2"] as const;

function Car({ idx, lane, direction }: { idx: number; lane: "h" | "v"; direction: 1 | -1 }) {
  const { cityState } = useActiveCityState();
  const ref = useRef<THREE.Group>(null);
  const speed = (0.8 + (idx % 3) * 0.4) * direction * (0.4 + cityState.healthScore / 120);
  const offset = (idx * 3.7) % 28 - 14;

  useFrame((_, dt) => {
    if (!ref.current) return;
    if (lane === "h") {
      ref.current.position.x += dt * speed;
      if (ref.current.position.x > 16) ref.current.position.x = -16;
      if (ref.current.position.x < -16) ref.current.position.x = 16;
    } else {
      ref.current.position.z += dt * speed;
      if (ref.current.position.z > 16) ref.current.position.z = -16;
      if (ref.current.position.z < -16) ref.current.position.z = 16;
    }
  });

  const color = CAR_COLORS[idx % CAR_COLORS.length];
  const initialPos: [number, number, number] = lane === "h"
    ? [offset, 0.14, 0.3 + (direction > 0 ? -0.22 : 0.22)]
    : [-0.4 + (direction > 0 ? -0.22 : 0.22), 0.14, offset];
  const rotY = lane === "h" ? (direction > 0 ? 0 : Math.PI) : (direction > 0 ? Math.PI / 2 : -Math.PI / 2);

  return (
    <group ref={ref} position={initialPos} rotation={[0, rotY, 0]}>
      {/* Body */}
      <mesh position={[0, 0.085, 0]} castShadow>
        <boxGeometry args={[0.55, 0.17, 0.28]} />
        <meshStandardMaterial color={color} roughness={0.3} metalness={0.5} emissive={color} emissiveIntensity={0.2} />
      </mesh>
      {/* Cabin */}
      <mesh position={[0, 0.21, 0]}>
        <boxGeometry args={[0.3, 0.13, 0.24]} />
        <meshStandardMaterial color={color} roughness={0.25} metalness={0.4} />
      </mesh>
      {/* Windshield */}
      <mesh position={[0.15, 0.22, 0]}>
        <boxGeometry args={[0.02, 0.1, 0.2]} />
        <meshStandardMaterial color="#bfdbfe" transparent opacity={0.6} emissive="#bfdbfe" emissiveIntensity={0.3} />
      </mesh>
      {/* Headlights */}
      <mesh position={[0.28, 0.1, 0.08]}>
        <sphereGeometry args={[0.03, 6, 6]} />
        <meshStandardMaterial color="#fef3c7" emissive="#fef08a" emissiveIntensity={3} />
      </mesh>
      <mesh position={[0.28, 0.1, -0.08]}>
        <sphereGeometry args={[0.03, 6, 6]} />
        <meshStandardMaterial color="#fef3c7" emissive="#fef08a" emissiveIntensity={3} />
      </mesh>
      {/* Wheels */}
      {[[-0.18, -0.1], [-0.18, 0.1], [0.18, -0.1], [0.18, 0.1]].map(([wx, wz], i) => (
        <mesh key={i} position={[wx, -0.02, wz as number]} rotation={[Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[0.065, 0.065, 0.05, 8]} />
          <meshStandardMaterial color="#1f2937" roughness={0.9} />
        </mesh>
      ))}
    </group>
  );
}

// ─── Pedestrian ───────────────────────────────────────────────────────────────
function Pedestrian({ idx }: { idx: number }) {
  const { cityState } = useActiveCityState();
  const ref = useRef<THREE.Group>(null);
  const speed = (0.3 + (idx % 4) * 0.12) * (idx % 2 === 0 ? 1 : -1) * (0.5 + cityState.healthScore / 150);
  const lane = idx % 3;
  const zPos = lane === 0 ? -0.52 : lane === 1 ? 0.98 : -0.52;

  useFrame((_, dt) => {
    if (!ref.current) return;
    ref.current.position.x += dt * speed;
    if (ref.current.position.x > 10) ref.current.position.x = -10;
    if (ref.current.position.x < -10) ref.current.position.x = 10;
    // Bob up and down slightly while walking
    ref.current.position.y = 0.1 + Math.abs(Math.sin(ref.current.position.x * 8)) * 0.02;
  });

  const PERSON_COLORS = ["#f97316","#22d3ee","#f472b6","#a3e635","#fb923c","#818cf8"];
  const color = PERSON_COLORS[idx % PERSON_COLORS.length];
  const startX = (idx * 2.1) % 20 - 10;

  return (
    <group ref={ref} position={[startX, 0.1, zPos]}>
      {/* Body */}
      <mesh position={[0, 0.12, 0]}>
        <capsuleGeometry args={[0.04, 0.14, 4, 6]} />
        <meshStandardMaterial color={color} roughness={0.8} />
      </mesh>
      {/* Head */}
      <mesh position={[0, 0.28, 0]}>
        <sphereGeometry args={[0.05, 6, 6]} />
        <meshStandardMaterial color="#fde68a" roughness={0.9} />
      </mesh>
    </group>
  );
}

// ─── Main city export ──────────────────────────────────────────────────────────
export function CityGenerator() {
  const { proportions, cityState } = useActiveCityState();
  const [hoverInfo, setHoverInfo] = useState<{
    title: string;
    value: string;
    position: [number, number, number];
  } | null>(null);

  const needsPct = Math.round(proportions.needs * 100);
  const wantsPct = Math.round(proportions.wants * 100);
  const treatsPct = Math.round(proportions.treats * 100);
  const investPct = Math.round(proportions.investments * 100);
  const healthPct = Math.round(cityState.healthScore);

  const hoverProps = useCallback(
    (title: string, value: string, position: [number, number, number]) => ({
      onPointerOver: (e: any) => {
        e.stopPropagation();
        setHoverInfo({ title, value, position });
      },
      onPointerOut: (e: any) => {
        e.stopPropagation();
        setHoverInfo(null);
      },
    }),
    [],
  );

  const treats = proportions.treats;
  const cloudCount = Math.min(6, Math.floor(treats * 14));
  const carCount = Math.max(1, Math.min(6, cityState.population));
  const pedCount = Math.max(2, Math.min(10, cityState.population * 2));

  const aptPositions: [number, number][] = [
    [-5.5, -3.2], [-4.2, -3.2], [-2.9, -3.2], [-1.6, -3.2],
    [-5.5, -1.8], [-4.2, -1.8], [-2.9, -1.8], [-1.6, -1.8],
  ];

  const restPositions: [number, number][] = [
    [-4.5, 1.8], [-2.9, 1.8], [-1.3, 1.8], [0.3, 1.8], [1.9, 1.8], [3.5, 1.8],
  ];

  return (
    <group>
      {/* ── Parks ── */}
      <group {...hoverProps("Parks", `Treats level: ${treatsPct}%`, [-3.5, 0.5, -2.5])}>
        <Park x={-3.5} z={-2.5} w={6.5} d={3.5} />
      </group>
      <group {...hoverProps("Parks", `Treats level: ${treatsPct}%`, [-1, 0.5, 2.2])}>
        <Park x={-1}   z={2.2}  w={9}   d={2.2} />
      </group>

      {/* ── Pavements ── */}
      <group {...hoverProps("Pavements", `Needs level: ${needsPct}%`, [-3.0, 0.35, -0.45])}>
        <Pavement x={-3.0} z={-0.45} w={8}    d={0.55} />
      </group>
      <group {...hoverProps("Pavements", `Needs level: ${needsPct}%`, [-3.0, 0.35, 1.05])}>
        <Pavement x={-3.0} z={1.05}  w={8}    d={0.55} />
      </group>
      <group {...hoverProps("Pavements", `Needs level: ${needsPct}%`, [3.6, 0.35, -1.2])}>
        <Pavement x={3.6}  z={-1.2}  w={0.55} d={5}    />
      </group>

      {/* ── Benches ── */}
      <group {...hoverProps("Benches", `Treats level: ${treatsPct}%`, [-1.8, 0.7, -0.6])}>
        <Bench x={-1.8} z={-0.6} />
      </group>
      <group {...hoverProps("Benches", `Treats level: ${treatsPct}%`, [1.2, 0.7, -0.6])}>
        <Bench x={1.2}  z={-0.6} />
      </group>
      <group {...hoverProps("Benches", `Treats level: ${treatsPct}%`, [-4.0, 0.7, 1.2])}>
        <Bench x={-4.0} z={1.2}  />
      </group>

      {/* ── Apartments ── */}
      {aptPositions.map(([x, z], i) => (
        <group key={`apt-wrap-${i}`} {...hoverProps("Apartments", `Needs level: ${needsPct}%`, [x, 1.4, z])}>
          <Apartment key={`apt-${i}`} x={x} z={z} idx={i} />
        </group>
      ))}

      {/* ── Restaurants ── */}
      {restPositions.map(([x, z], i) => (
        <group key={`rest-wrap-${i}`} {...hoverProps("Restaurants", `Wants level: ${wantsPct}%`, [x, 1.2, z])}>
          <Restaurant key={`rest-${i}`} x={x} z={z} idx={i} />
        </group>
      ))}

      {/* ── Financial district ── */}
      <group {...hoverProps("Bank Tower", `Investments level: ${investPct}%`, [3.5, 3.5, -2.5])}>
        <BankTower x={3.5} z={-2.5} />
      </group>
      <group {...hoverProps("Investment Tower", `Investments level: ${investPct}%`, [5.3, 3.2, -2.1])}>
        <InvestmentTower x={5.3} z={-2.1} />
      </group>

      {/* ── Community buildings ── */}
      <group {...hoverProps("School", `Needs level: ${needsPct}%`, [-7.0, 1.6, -2.2])}>
        <School x={-7.0} z={-2.2} />
      </group>
      <group {...hoverProps("Hospital", `Investments level: ${investPct}%`, [-7.0, 1.6, 0.8])}>
        <Hospital x={-7.0} z={0.8} />
      </group>

      {/* ── Park features ── */}
      <group {...hoverProps("Fountain", `Treats level: ${treatsPct}%`, [-2.1, 1.2, 2.9])}>
        <Fountain x={-2.1} z={2.9} />
      </group>

      {/* ── Bridge ── */}
      <group {...hoverProps("Bridge", `City health: ${healthPct}/100`, [-0.4, 1.2, 0.3])}>
        <Bridge />
      </group>

      {/* ── Trees ── */}
      <group {...hoverProps("Trees", `Treats level: ${treatsPct}%`, [0, 2.2, -1.2])}>
        <Tree x={-0.6} z={-3.0} scale={1.1} />
        <Tree x={-0.6} z={-1.5} scale={0.9} />
        <Tree x={0.7}  z={-2.3} scale={1.0} />
        <Tree x={-5.8} z={-0.8} scale={0.85} />
        <Tree x={4.8}  z={-0.8} scale={0.95} />
        <Tree x={2.2}  z={3.2}  scale={0.9} />
        <Tree x={5.0}  z={3.0}  scale={1.05} />
        <Tree x={-4.0} z={3.2}  scale={0.8} />
      </group>

      {/* ── Street lamps ── */}
      <group {...hoverProps("Street Lamps", `Needs level: ${needsPct}%`, [-0.6, 1.8, 0.6])}>
        <StreetLamp x={-0.6} z={0.6} />
        <StreetLamp x={2.5}  z={0.6} />
        <StreetLamp x={-3.5} z={0.6} />
        <StreetLamp x={-0.6} z={-0.9} />
        <StreetLamp x={2.5}  z={-0.9} />
      </group>

      {/* ── Pollution clouds ── */}
      <group {...hoverProps("Pollution", `Wants pressure: ${wantsPct}%`, [3.5, 5.5, 1])}>
        {Array.from({ length: cloudCount }, (_, i) => (
          <PollutionCloud
            key={i}
            x={1 + i * 2.1}
            y={4 + i * 0.4}
            z={3 - i * 0.6}
            opacity={0.2 + treats * 0.55}
          />
        ))}
      </group>

      {/* ── Traffic ── */}
      {Array.from({ length: carCount }, (_, i) => (
        <group key={`car-wrap-h-${i}`} {...hoverProps("Cars", `Population level: ${cityState.population}/10`, [0, 1.1, 0.3])}>
          <Car key={`car-h-${i}`} idx={i} lane="h" direction={i % 2 === 0 ? 1 : -1} />
        </group>
      ))}
      {Array.from({ length: Math.floor(carCount / 2) }, (_, i) => (
        <group key={`car-wrap-v-${i}`} {...hoverProps("Cars", `Population level: ${cityState.population}/10`, [-0.4, 1.1, 0])}>
          <Car key={`car-v-${i}`} idx={i + 10} lane="v" direction={i % 2 === 0 ? 1 : -1} />
        </group>
      ))}

      {/* ── Pedestrians ── */}
      {Array.from({ length: pedCount }, (_, i) => (
        <group key={`ped-wrap-${i}`} {...hoverProps("Pedestrians", `Population level: ${cityState.population}/10`, [-1.8, 1.1, -0.6])}>
          <Pedestrian key={`ped-${i}`} idx={i} />
        </group>
      ))}

      {/* Hover badge */}
      {hoverInfo && (
        <Html position={hoverInfo.position} center distanceFactor={12}>
          <div className="rounded-lg border border-sky-300/30 bg-slate-950/85 px-3 py-1.5 text-center shadow-xl backdrop-blur-sm">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-sky-300">{hoverInfo.title}</p>
            <p className="text-xs font-medium text-white">{hoverInfo.value}</p>
          </div>
        </Html>
      )}

      {/* ── Weather FX ── */}
      <Rain />
      <Lightning />
      <Embers />
      <Stars />
    </group>
  );
}
