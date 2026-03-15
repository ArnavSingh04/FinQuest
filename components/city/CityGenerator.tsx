"use client";

import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { useFrame } from "@react-three/fiber";
import { Html } from "@react-three/drei";
import * as THREE from "three";

import { useGameStore, useGameStoreInCanvas } from "@/store/useGameStore";
import { useCityStateOverride } from "@/contexts/CityStateContext";
import type { RewardBuilding, RewardBuildingType, TransactionCategory } from "@/types";

const CATEGORY_COLORS: Record<TransactionCategory, string> = {
  Need: "#3B7DD8",
  Want: "#E8A020",
  Treat: "#D94F3D",
  Invest: "#3DAB6A",
};

const REWARD_BUILDING_LABELS: Record<RewardBuildingType, string> = {
  library: "Library",
  stadium: "Stadium",
  solar_tower: "Solar Tower",
  market: "Reward Market",
  monument: "Monument",
  garden: "Community Garden",
};

// ─── Unified city state hook (respects shared-city context override) ──────────
function useActiveCityState() {
  const override = useCityStateOverride();
  const storeCity = useGameStoreInCanvas((s) => s.cityState);
  const storeProps = useGameStoreInCanvas((s) => s.proportions);
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

// ─── Idle breathing pulse hook (scale.y only — vertical life) ─────────────────
const IDLE_PULSE_MOBILE = typeof window !== "undefined" && window.innerWidth < 768;

function useIdlePulse(speed = 1.0, amount = 0.012, offset = 0) {
  const ref = useRef<THREE.Group>(null);
  const pulseAmount = IDLE_PULSE_MOBILE ? amount * 0.5 : amount;
  useFrame(({ clock }) => {
    if (!ref.current) return;
    ref.current.scale.y = 1 + Math.sin(clock.elapsedTime * speed + offset) * pulseAmount;
  });
  return ref;
}

// ─── Idle sway hook (scale.x + scale.z — for trees) ─────────────────────────
function useIdleSway(speed = 1.2, amount = 0.015, offset = 0) {
  const ref = useRef<THREE.Group>(null);
  const swayAmount = IDLE_PULSE_MOBILE ? amount * 0.5 : amount;
  useFrame(({ clock }) => {
    if (!ref.current) return;
    const s = 1 + Math.sin(clock.elapsedTime * speed + offset) * swayAmount;
    ref.current.scale.x = s;
    ref.current.scale.z = s;
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
  winColor = "#FFF3B0",
  winEmissive = "#FFF3B0",
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

// ─── Apartment building (Needs — warm sandstone) ───────────────────────────────
const APT_COLORS = ["#D4A96A", "#C49558", "#D4A96A", "#C49558", "#D4A96A"] as const;

function Apartment({ x, z, idx }: { x: number; z: number; idx: number }) {
  const { cityState } = useActiveCityState();
  const count = cityState.apartmentCount;
  const visible = idx < count;
  const baseH = 1.9 + (idx % 4) * 0.7;
  const topH  = baseH * 0.5;
  const baseWindowRows = Math.max(1, Math.floor(baseH * 0.9));
  const baseWindowBandHeight = Math.max(0.35, baseH * 0.35);
  const target = visible ? 1 : 0.01;
  const color = APT_COLORS[idx % APT_COLORS.length];

  const baseRef  = useLerpScale(target);
  const upperRef = useLerpScale(target, 2.2);
  const pulseRef = useIdlePulse(0.6, 0.010, idx * 0.8);

  const bW = 0.88; const bD = 0.88;
  const tW = 0.58; const tD = 0.58;

  // useLerpScale(1) drives scale.y → 1 and position.y → 0.5 each frame.
  // Main body is BoxGeometry of height baseH, so its top in group space is:
  //   position.y + (scale.y * baseH / 2) = 0.5 + baseH / 2
  const aptTop = 0.5 + baseH / 2;

  // WindowGrid places row r at: baseY + r * rowStep  (r = 1..rows)
  const winRowStep = baseWindowBandHeight / (baseWindowRows + 1);

  // Balconies at fractional heights, filtered to stay within body
  const balconyYs = [0.25, 0.45, 0.65, 0.85]
    .map((f) => f * baseH)
    .filter((y) => y > 0.3 && y < aptTop - 0.2);

  return (
    <group ref={pulseRef} position={[x, 0, z]}>
      {/* ── Wider base podium (ground floor) ── */}
      <mesh position={[0, 0.25, 0]} castShadow receiveShadow>
        <boxGeometry args={[bW + 0.15, 0.5, bD + 0.15]} />
        <meshStandardMaterial color="#C49558" roughness={0.6} metalness={0.1} />
      </mesh>

      {/* ── Main body ── */}
      <mesh ref={baseRef} position={[0, baseH * 0.5, 0]} castShadow receiveShadow>
        <boxGeometry args={[bW, baseH, bD]} />
        <meshStandardMaterial color={color} emissive={color} emissiveIntensity={0.18} roughness={0.55} metalness={0.12} />
      </mesh>

      {/* ── Window grids on all 4 faces ── */}
      {visible && <WindowGrid cols={2} rows={baseWindowRows} width={bW - 0.1} height={baseWindowBandHeight} depth={bD / 2} facingZ baseY={0.04} />}
      {visible && <WindowGrid cols={2} rows={baseWindowRows} width={bW - 0.1} height={baseWindowBandHeight} depth={-bD / 2} facingZ baseY={0.04} />}
      {visible && <WindowGrid cols={2} rows={baseWindowRows} width={bD - 0.1} height={baseWindowBandHeight} depth={bW / 2} facingZ={false} baseY={0.04} winIntensity={1.2} />}
      {visible && <WindowGrid cols={2} rows={baseWindowRows} width={bD - 0.1} height={baseWindowBandHeight} depth={-bW / 2} facingZ={false} baseY={0.04} winIntensity={1.2} />}

      {/* ── Window sill bands — aligned with WindowGrid row centres ── */}
      {visible && Array.from({ length: baseWindowRows }, (_, si) => {
        // WindowGrid row (si+1) is centred at: 0.04 + (si+1) * winRowStep
        const sillY = 0.04 + (si + 1) * winRowStep - winRowStep * 0.3;
        return (
          <mesh key={`sill-${si}`} position={[0, sillY, bD / 2 + 0.002]}>
            <boxGeometry args={[bW - 0.1, 0.04, 0.06]} />
            <meshStandardMaterial color="#BF8C4A" roughness={0.7} metalness={0.05} />
          </mesh>
        );
      })}

      {/* ── Balconies on front face — clamped within building body ── */}
      {visible && balconyYs.map((by, bi) => (
        <group key={`bal-${bi}`}>
          {/* Slab */}
          <mesh position={[0, by, bD / 2 + 0.1]} castShadow>
            <boxGeometry args={[bW - 0.2, 0.06, 0.2]} />
            <meshStandardMaterial color="#BF8C4A" roughness={0.6} metalness={0.1} />
          </mesh>
          {/* Railing */}
          <mesh position={[0, by + 0.1, bD / 2 + 0.2]}>
            <boxGeometry args={[bW - 0.22, 0.06, 0.018]} />
            <meshStandardMaterial color="#A07840" roughness={0.5} metalness={0.2} />
          </mesh>
        </group>
      ))}

      {/* ── Upper setback (narrower penthouse section) ── */}
      <mesh ref={upperRef} position={[0, baseH + topH * 0.5, 0]} castShadow>
        <boxGeometry args={[tW, topH, tD]} />
        <meshStandardMaterial color={color} roughness={0.5} metalness={0.16} emissive={color} emissiveIntensity={0.2} />
      </mesh>

      {/* ── Roof parapet — sits flush on top of main body ── */}
      {visible && (
        <>
          <mesh position={[0, aptTop + 0.06, bD / 2]}>
            <boxGeometry args={[bW, 0.12, 0.08]} />
            <meshStandardMaterial color="#C49558" roughness={0.65} />
          </mesh>
          <mesh position={[0, aptTop + 0.06, -bD / 2]}>
            <boxGeometry args={[bW, 0.12, 0.08]} />
            <meshStandardMaterial color="#C49558" roughness={0.65} />
          </mesh>
          <mesh position={[bW / 2, aptTop + 0.06, 0]}>
            <boxGeometry args={[0.08, 0.12, bD]} />
            <meshStandardMaterial color="#C49558" roughness={0.65} />
          </mesh>
          <mesh position={[-bW / 2, aptTop + 0.06, 0]}>
            <boxGeometry args={[0.08, 0.12, bD]} />
            <meshStandardMaterial color="#C49558" roughness={0.65} />
          </mesh>
        </>
      )}

      {/* ── Rooftop water tower — group origin at roof surface ── */}
      {visible && idx % 3 === 0 && (
        <group position={[0.2, aptTop, 0.1]}>
          {/* Three legs — local y 0 to 0.25 */}
          {[[-0.065, -0.065], [0.065, -0.065], [0, 0.075]].map(([lx, lz], li) => (
            <mesh key={li} position={[lx, 0.125, lz as number]}>
              <cylinderGeometry args={[0.006, 0.006, 0.25, 4]} />
              <meshStandardMaterial color="#8B7355" roughness={0.9} />
            </mesh>
          ))}
          {/* Tank — sits on top of legs */}
          <mesh position={[0, 0.38, 0]}>
            <cylinderGeometry args={[0.1, 0.12, 0.3, 8]} />
            <meshStandardMaterial color="#8B7355" roughness={0.8} metalness={0.1} />
          </mesh>
          {/* Cone roof */}
          <mesh position={[0, 0.59, 0]}>
            <coneGeometry args={[0.11, 0.12, 8]} />
            <meshStandardMaterial color="#6B5840" roughness={0.9} />
          </mesh>
        </group>
      )}

      {/* ── Entrance canopy — ground-level, flush with front face ── */}
      {visible && (
        <>
          <mesh position={[0, 0.55, bD / 2 + 0.11]} castShadow>
            <boxGeometry args={[0.35, 0.05, 0.2]} />
            <meshStandardMaterial color="#A0785A" roughness={0.7} metalness={0.1} />
          </mesh>
          {/* Pillar — height 0.3 centred at 0.38, spans 0.23–0.53 */}
          <mesh position={[-0.13, 0.38, bD / 2 + 0.19]}>
            <boxGeometry args={[0.04, 0.3, 0.04]} />
            <meshStandardMaterial color="#8B6B4A" roughness={0.75} />
          </mesh>
          <mesh position={[0.13, 0.38, bD / 2 + 0.19]}>
            <boxGeometry args={[0.04, 0.3, 0.04]} />
            <meshStandardMaterial color="#8B6B4A" roughness={0.75} />
          </mesh>
        </>
      )}
    </group>
  );
}

// ─── Restaurant building (Wants — soft coral & amber) ──────────────────────────
const REST_PALETTE = [
  { wall: "#E8836A", sign: "#f97316", trim: "#D4725A" },
  { wall: "#D4725A", sign: "#fbbf24", trim: "#c2410c" },
  { wall: "#E8A020", sign: "#fef08a", trim: "#d97706" },
  { wall: "#E8836A", sign: "#fcd34d", trim: "#D4725A" },
  { wall: "#D4725A", sign: "#E8A020", trim: "#b45309" },
] as const;

function Restaurant({ x, z, idx }: { x: number; z: number; idx: number }) {
  const { cityState } = useActiveCityState();
  const count = cityState.restaurantCount;
  const visible = idx < count;
  const h = 1.05 + (idx % 3) * 0.35;
  const pal = REST_PALETTE[idx % REST_PALETTE.length];
  const bW = 1.1; const bD = 0.95;
  const pulseRef = useIdlePulse(0.8, 0.010, idx * 0.6);

  if (!visible) {
    return null;
  }

  return (
    <group ref={pulseRef} position={[x, 0, z]}>
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
        winColor="#FFF3B0"
        winEmissive="#FFF3B0"
        winIntensity={0.5}
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
        <meshStandardMaterial color="#6B6560" roughness={0.9} />
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
  const pulseRef = useIdlePulse(0.3, 0.018, 0);

  const bW = 0.95; const bD = 0.95;
  const towerRows = Math.max(3, Math.floor(height * 1.8));
  const towerCols = Math.max(2, Math.min(5, Math.floor(height * 0.7) + 2));

  return (
    <group ref={pulseRef} position={[x, 0, z]}>
      {/* Podium base */}
      <mesh position={[0, 0.3, 0]} castShadow receiveShadow>
        <boxGeometry args={[1.55, 0.6, 1.55]} />
        <meshStandardMaterial color="#4A90D9" roughness={0.35} metalness={0.5} />
      </mesh>
      {/* Podium columns decorative */}
      {[-0.55, 0.55].map((cx) => (
        <mesh key={cx} position={[cx, 0.38, 0.78]} castShadow>
          <cylinderGeometry args={[0.055, 0.065, 0.76, 8]} />
          <meshStandardMaterial color="#4A90D9" roughness={0.3} metalness={0.6} />
        </mesh>
      ))}

      {/* Main shaft */}
      <mesh ref={mainRef} position={[0, height * 0.5, 0]} castShadow>
        <boxGeometry args={[bW, 1, bD]} />
        <meshStandardMaterial color="#4A90D9" roughness={0.2} metalness={0.65} emissive="#3a7bc8" emissiveIntensity={0.3} />
      </mesh>
      {/* Window grids all 4 faces — warm window lights */}
      <WindowGrid cols={towerCols} rows={towerRows} width={bW - 0.12} height={height - 0.6} depth={bD / 2} facingZ baseY={0.65} winColor="#FFF3B0" winEmissive="#FFF3B0" winIntensity={1.2} />
      <WindowGrid cols={towerCols} rows={towerRows} width={bW - 0.12} height={height - 0.6} depth={-bD / 2} facingZ baseY={0.65} winColor="#FFF3B0" winEmissive="#FFF3B0" winIntensity={1.2} />
      <WindowGrid cols={towerCols} rows={towerRows} width={bD - 0.12} height={height - 0.6} depth={bW / 2} facingZ={false} baseY={0.65} winColor="#FFF3B0" winEmissive="#FFF3B0" winIntensity={1.0} />
      <WindowGrid cols={towerCols} rows={towerRows} width={bD - 0.12} height={height - 0.6} depth={-bW / 2} facingZ={false} baseY={0.65} winColor="#FFF3B0" winEmissive="#FFF3B0" winIntensity={1.0} />

      {/* Mid setback */}
      <mesh position={[0, height * 0.72, 0]} castShadow>
        <boxGeometry args={[bW - 0.16, height * 0.06, bD - 0.16]} />
        <meshStandardMaterial color="#4A90D9" roughness={0.25} metalness={0.7} emissive="#4A90D9" emissiveIntensity={0.2} />
      </mesh>

      {/* Crown */}
      <mesh ref={crownRef} position={[0, height + height * 0.09, 0]}>
        <cylinderGeometry args={[0.06, 0.28, 1, 4]} />
        <meshStandardMaterial color="#6BA3E0" emissive="#4A90D9" emissiveIntensity={0.5} metalness={0.5} />
      </mesh>
      {/* Top beacon */}
      <mesh position={[0, height + height * 0.2, 0]}>
        <sphereGeometry args={[0.055, 8, 8]} />
        <meshStandardMaterial color="#FFF3B0" emissive="#FFF3B0" emissiveIntensity={1.5} />
      </mesh>
      <pointLight position={[0, height + height * 0.2, 0]} intensity={3} color="#FFF3B0" distance={8} decay={2} />
    </group>
  );
}

// ─── Investment Tower ─────────────────────────────────────────────────────────
function InvestmentTower({ x, z }: { x: number; z: number }) {
  const { cityState } = useActiveCityState();
  const h = cityState.towerHeight;
  const mainRef  = useLerpScale(h, 2);
  const tipRef   = useLerpScale(h * 0.25, 2);
  const pulseRef = useIdlePulse(0.3, 0.018, 1.5);
  const windowRows = Math.max(3, Math.floor(h * 2.4));
  const windowBandHeight = Math.max(0.12, Math.min(0.22, (h * 0.72) / windowRows * 0.55));

  return (
    <group ref={pulseRef} position={[x, 0, z]}>
      {/* Base ring */}
      <mesh position={[0, 0.14, 0]}>
        <cylinderGeometry args={[0.75, 0.75, 0.28, 6]} />
        <meshStandardMaterial color="#4A90D9" roughness={0.4} metalness={0.45} />
      </mesh>
      {/* Lobby glass ring */}
      <mesh position={[0, 0.42, 0]}>
        <cylinderGeometry args={[0.62, 0.68, 0.32, 6]} />
        <meshStandardMaterial color="#e8f4fc" roughness={0.1} metalness={0.3} transparent opacity={0.55} emissive="#FFF3B0" emissiveIntensity={0.4} />
      </mesh>

      {/* Main hex shaft */}
      <mesh ref={mainRef} position={[0, h * 0.5, 0]} castShadow>
        <cylinderGeometry args={[0.38, 0.46, 1, 6]} />
        <meshStandardMaterial color="#4A90D9" roughness={0.18} metalness={0.55} emissive="#3a7bc8" emissiveIntensity={0.25} />
      </mesh>
      {/* Window bands — warm-tinted window lights */}
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
                  color="#FFF3B0"
                  emissive="#FFF3B0"
                  emissiveIntensity={1.0}
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
        <meshStandardMaterial color="#4A90D9" roughness={0.2} metalness={0.5} emissive="#4A90D9" emissiveIntensity={0.2} />
      </mesh>

      {/* Glowing tip */}
      <mesh ref={tipRef} position={[0, h + h * 0.125, 0]}>
        <coneGeometry args={[0.18, 1, 6]} />
        <meshStandardMaterial color="#6BA3E0" emissive="#4A90D9" emissiveIntensity={0.8} />
      </mesh>
      <pointLight position={[0, h + h * 0.2, 0]} intensity={4} color="#FFF3B0" distance={10} decay={2} />
    </group>
  );
}

// ─── Gold Tower (Art Deco — unlocks as investment spending rises) ─────────────
// ─── Gold particle burst (8 spheres fired outward on tower unlock) ───────────
const PARTICLE_ANGLES = Array.from({ length: 8 }, (_, i) => (i / 8) * Math.PI * 2);

function GoldParticleBurst({ active }: { active: boolean }) {
  const refs = useRef<(THREE.Mesh | null)[]>([]);
  const startRef = useRef(0);
  const speeds = useRef(PARTICLE_ANGLES.map(() => 0.8 + Math.random() * 0.4));

  useEffect(() => {
    if (active) startRef.current = performance.now();
  }, [active]);

  useFrame(() => {
    if (!active) return;
    const elapsed = (performance.now() - startRef.current) / 1000;
    refs.current.forEach((mesh, i) => {
      if (!mesh) return;
      const angle = PARTICLE_ANGLES[i]!;
      const spd   = speeds.current[i]!;
      const t     = Math.min(elapsed / 1.5, 1);
      const r     = spd * t * 2.5;
      const grav  = -4 * t * t;
      mesh.position.set(
        Math.cos(angle) * r,
        Math.max(0, 0.5 - t * 0.5 + grav * 0.4),
        Math.sin(angle) * r,
      );
      const mat = mesh.material as THREE.MeshStandardMaterial;
      mat.opacity = 1 - t;
    });
  });

  if (!active) return null;
  return (
    <>
      {PARTICLE_ANGLES.map((_, i) => (
        <mesh
          key={i}
          ref={(el) => { refs.current[i] = el; }}
          position={[0, 0.3, 0]}
        >
          <sphereGeometry args={[0.04, 6, 6]} />
          <meshStandardMaterial
            color="#FFD700"
            emissive="#FFD700"
            emissiveIntensity={2}
            transparent
            opacity={1}
          />
        </mesh>
      ))}
    </>
  );
}

function GoldTower({
  x,
  z,
  idx,
  heightMultiplier = 1,
  isNew = false,
}: {
  x: number;
  z: number;
  idx: number;
  heightMultiplier?: number;
  isNew?: boolean;
}) {
  // ─── Entrance animation state ────────────────────────────────────────────────
  const hasAnimated  = useRef(false);
  const animStart    = useRef(0);
  const [showParticles, setShowParticles] = useState(false);

  useEffect(() => {
    if (isNew && !hasAnimated.current) {
      hasAnimated.current = true;
      animStart.current = performance.now();
      setShowParticles(true);
      // Particles only live for 1.5s
      const t = setTimeout(() => setShowParticles(false), 1500);
      return () => clearTimeout(t);
    }
  }, [isNew]);

  // ─── Refs for animated parts ─────────────────────────────────────────────────
  const outerRef     = useRef<THREE.Group>(null);        // rise + idle pulse target
  const pulseRef     = useIdlePulse(0.35, 0.018, idx * 1.4);  // idle after entrance
  const beaconRef    = useRef<THREE.Mesh>(null);
  const burstLightRef = useRef<THREE.PointLight>(null);

  // ─── Computed section positions ───────────────────────────────────────────────
  const lowerBodyH  = heightMultiplier * 2.5;
  const lowerBodyY  = heightMultiplier * 1.25 + 0.3;
  const middleBaseY = 0.3 + lowerBodyH;
  const middleH     = heightMultiplier * 2.0;
  const middleBodyY = middleBaseY + middleH * 0.5;
  const upperBaseY  = middleBaseY + middleH;
  const upperH      = heightMultiplier * 1.5;
  const upperBodyY  = upperBaseY + upperH * 0.5;
  const spireBaseY  = upperBaseY + upperH;
  const spireH      = heightMultiplier * 0.8;
  const spireY      = spireBaseY + spireH * 0.5;
  const beaconY     = spireBaseY + spireH + 0.06;

  const lowerRows  = Math.max(3, Math.floor(lowerBodyH * 1.8));
  const middleRows = Math.max(2, Math.floor(middleH * 1.8));

  const cornerOffsets: [number, number][] = [
    [0.78, 0.78], [0.78, -0.78], [-0.78, 0.78], [-0.78, -0.78],
  ];

  // ─── Main useFrame: entrance anim → idle pulse ───────────────────────────────
  useFrame(({ clock }) => {
    const group = outerRef.current;
    if (!group) return;

    // Beacon idle pulse (always)
    if (beaconRef.current) {
      const mat = beaconRef.current.material as THREE.MeshStandardMaterial;
      mat.emissiveIntensity = 2.5 + Math.sin(clock.elapsedTime * 2 + idx) * 1.0;
    }

    if (!hasAnimated.current) {
      // No entrance needed — apply idle pulse directly
      group.scale.y = 1 + Math.sin(clock.elapsedTime * 0.35 + idx * 1.4) * (IDLE_PULSE_MOBILE ? 0.009 : 0.018);
      return;
    }

    const elapsed = (performance.now() - animStart.current) / 1000;

    if (elapsed < 1.2) {
      // Phase 1 — rise from ground
      const t = elapsed / 1.2;
      const scaleY = -(Math.cos(Math.PI * t) - 1) / 2;          // ease-in-out [0→1]
      group.scale.y = scaleY;

      // Beacon burst fires at the peak of the rise (t ≈ 1)
      if (burstLightRef.current) {
        const burstT = Math.max(0, (t - 0.85) / 0.15);           // 0→1 over last 15%
        burstLightRef.current.intensity = 1.5 + burstT * 6.5;    // spike to 8
      }
    } else if (elapsed < 2.5) {
      // Phase 2 — shimmer: flash gold emissive rapidly
      group.scale.y = 1;
      if (burstLightRef.current) {
        // Decay burst light back to 1.5 over 0.8s after rise completes
        const decayT = Math.min(1, (elapsed - 1.2) / 0.8);
        burstLightRef.current.intensity = THREE.MathUtils.lerp(8, 1.5, decayT);
      }
      // Shimmer all gold materials via the beacon ref as proxy (enough visual impact)
      if (beaconRef.current) {
        const mat = beaconRef.current.material as THREE.MeshStandardMaterial;
        mat.emissiveIntensity = 0.4 + Math.sin(elapsed * 15) * 0.3 + 2.5;
      }
    } else {
      // Phase 3 — settle: hand off to idle pulse
      if (burstLightRef.current) burstLightRef.current.intensity = 1.5;
      const idleScale = 1 + Math.sin(clock.elapsedTime * 0.35 + idx * 1.4) * (IDLE_PULSE_MOBILE ? 0.009 : 0.018);
      group.scale.y = idleScale;
    }
  });

  return (
    <group position={[x, 0, z]}>
      {/* Particle burst on unlock */}
      <GoldParticleBurst active={showParticles} />

      {/* Everything that participates in the rise animation */}
      <group ref={outerRef}>
        {/* 1 — Base plinth */}
        <mesh position={[0, 0.15, 0]} castShadow receiveShadow>
          <boxGeometry args={[1.8, 0.3, 1.8]} />
          <meshStandardMaterial color="#8B6914" metalness={0.8} roughness={0.2} />
        </mesh>

        {/* 2 — Lower body */}
        <mesh position={[0, lowerBodyY, 0]} castShadow receiveShadow>
          <boxGeometry args={[1.5, lowerBodyH, 1.5]} />
          <meshStandardMaterial
            color="#C9A84C"
            metalness={0.7}
            roughness={0.15}
            emissive="#C9A84C"
            emissiveIntensity={0.3}
          />
        </mesh>

        {/* Art Deco corner fins */}
        {cornerOffsets.map(([cx, cz], fi) => (
          <mesh key={`fin-${fi}`} position={[cx, lowerBodyY, cz]} castShadow>
            <boxGeometry args={[0.06, lowerBodyH, 0.06]} />
            <meshStandardMaterial
              color="#FFD700"
              metalness={0.9}
              roughness={0.05}
              emissive="#FFD700"
              emissiveIntensity={0.6}
            />
          </mesh>
        ))}

        {/* Windows — lower body, all 4 faces */}
        <WindowGrid cols={3} rows={lowerRows} width={1.35} height={lowerBodyH - 0.3} depth={ 0.76} facingZ       baseY={0.6} winColor="#FEF3C7" winEmissive="#F59E0B" winIntensity={1.2} />
        <WindowGrid cols={3} rows={lowerRows} width={1.35} height={lowerBodyH - 0.3} depth={-0.76} facingZ       baseY={0.6} winColor="#FEF3C7" winEmissive="#F59E0B" winIntensity={1.2} />
        <WindowGrid cols={3} rows={lowerRows} width={1.35} height={lowerBodyH - 0.3} depth={ 0.76} facingZ={false} baseY={0.6} winColor="#FEF3C7" winEmissive="#F59E0B" winIntensity={1.0} />
        <WindowGrid cols={3} rows={lowerRows} width={1.35} height={lowerBodyH - 0.3} depth={-0.76} facingZ={false} baseY={0.6} winColor="#FEF3C7" winEmissive="#F59E0B" winIntensity={1.0} />

        {/* 3 — Middle setback */}
        <mesh position={[0, middleBodyY, 0]} castShadow>
          <boxGeometry args={[1.1, middleH, 1.1]} />
          <meshStandardMaterial
            color="#D4A843"
            metalness={0.75}
            roughness={0.1}
            emissive="#C9A84C"
            emissiveIntensity={0.35}
          />
        </mesh>

        {/* Windows — middle setback, all 4 faces */}
        <WindowGrid cols={2} rows={middleRows} width={0.92} height={middleH - 0.2} depth={ 0.56} facingZ       baseY={middleBaseY + 0.1} winColor="#FEF3C7" winEmissive="#F59E0B" winIntensity={1.2} />
        <WindowGrid cols={2} rows={middleRows} width={0.92} height={middleH - 0.2} depth={-0.56} facingZ       baseY={middleBaseY + 0.1} winColor="#FEF3C7" winEmissive="#F59E0B" winIntensity={1.2} />
        <WindowGrid cols={2} rows={middleRows} width={0.92} height={middleH - 0.2} depth={ 0.56} facingZ={false} baseY={middleBaseY + 0.1} winColor="#FEF3C7" winEmissive="#F59E0B" winIntensity={1.0} />
        <WindowGrid cols={2} rows={middleRows} width={0.92} height={middleH - 0.2} depth={-0.56} facingZ={false} baseY={middleBaseY + 0.1} winColor="#FEF3C7" winEmissive="#F59E0B" winIntensity={1.0} />

        {/* 4 — Upper setback */}
        <mesh position={[0, upperBodyY, 0]} castShadow>
          <boxGeometry args={[0.75, upperH, 0.75]} />
          <meshStandardMaterial
            color="#E8B84B"
            metalness={0.8}
            roughness={0.08}
            emissive="#FFD700"
            emissiveIntensity={0.4}
          />
        </mesh>

        {/* 5 — Crown spire */}
        <mesh position={[0, spireY, 0]} castShadow>
          <cylinderGeometry args={[0.08, 0.25, spireH, 8]} />
          <meshStandardMaterial
            color="#FFD700"
            metalness={0.9}
            roughness={0.05}
            emissive="#FFD700"
            emissiveIntensity={0.8}
          />
        </mesh>

        {/* 6 — Pulsing beacon */}
        <mesh ref={beaconRef} position={[0, beaconY, 0]}>
          <sphereGeometry args={[0.08, 8, 8]} />
          <meshStandardMaterial
            color="#FFFFFF"
            emissive="#FFD700"
            emissiveIntensity={2.5}
          />
        </mesh>

        {/* Burst point light (intensity driven by useFrame during entrance) */}
        <pointLight
          ref={burstLightRef}
          position={[0, beaconY, 0]}
          intensity={1.5}
          color="#FFD700"
          distance={4}
          decay={2}
        />
      </group>
    </group>
  );
}

// ─── Tree ─────────────────────────────────────────────────────────────────────
function Tree({ x, z, scale = 1 }: { x: number; z: number; scale?: number }) {
  const swayRef = useIdleSway(1.2, 0.015, (Math.abs(x) + Math.abs(z)) * 0.3);
  return (
    <group position={[x, 0, z]} scale={[scale, scale, scale]}>
      {/* Inner group receives the sway animation (X/Z only) */}
      <group ref={swayRef}>
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
            <meshStandardMaterial color={i % 2 === 0 ? "#6BA03C" : "#5A9E35"} roughness={0.8} />
          </mesh>
        ))}
      </group>
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
        <meshStandardMaterial color="#6B6560" metalness={0.8} roughness={0.2} />
      </mesh>
      {/* Arm */}
      <mesh position={[0.1, 2.15, 0]} rotation={[0, 0, Math.PI / 12]}>
        <cylinderGeometry args={[0.018, 0.018, 0.3, 6]} />
        <meshStandardMaterial color="#6B6560" metalness={0.8} roughness={0.2} />
      </mesh>
      {/* Hood */}
      <mesh position={[0.2, 2.22, 0]}>
        <cylinderGeometry args={[0.1, 0.06, 0.1, 8]} />
        <meshStandardMaterial color="#6B6560" metalness={0.7} roughness={0.3} />
      </mesh>
      {/* Bulb */}
      <mesh position={[0.2, 2.16, 0]}>
        <sphereGeometry args={[0.07, 8, 8]} />
        <meshStandardMaterial color="#fef9c3" emissive="#fef08a" emissiveIntensity={4} />
      </mesh>
      <pointLight position={[0.2, 2.1, 0]} intensity={3.5} color="#fef08a" distance={5} decay={2} />
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
    if (speed === 0) return;
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
      <meshStandardMaterial color="#5A9E35" roughness={0.9} />
    </mesh>
  );
}

// ─── Pavement ─────────────────────────────────────────────────────────────────
function Pavement({ x, z, w, d }: { x: number; z: number; w: number; d: number }) {
  return (
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[x, 0.006, z]} receiveShadow>
      <planeGeometry args={[w, d]} />
      <meshStandardMaterial color="#6B6560" roughness={0.85} />
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
  const { proportions } = useActiveCityState();
  const visible = Math.round(proportions.needs * 100) >= 40; // needs ≥ 40%
  const target = visible ? 1 : 0.01;
  const bodyRef = useLerpScale(target);
  const towerRef = useLerpScale(target, 1.8);
  const pulseRef = useIdlePulse(0.4, 0.008, 0.5);

  return (
    <group ref={pulseRef} position={[x, 0, z]}>
      {/* Main building body */}
      <mesh ref={bodyRef} position={[0, 0.55, 0]} castShadow receiveShadow>
        <boxGeometry args={[1.4, 1.1, 1.0]} />
        <meshStandardMaterial color="#5A9E35" roughness={0.6} metalness={0.05} emissive="#6BA03C" emissiveIntensity={0.3} />
      </mesh>
      {/* Clock tower */}
      <mesh ref={towerRef} position={[0, 1.4, 0]} castShadow>
        <boxGeometry args={[0.38, 0.8, 0.38]} />
        <meshStandardMaterial color="#6BA03C" roughness={0.55} emissive="#5A9E35" emissiveIntensity={0.4} />
      </mesh>
      {/* Clock face */}
      <mesh position={[0, 1.58, 0.21]}>
        <cylinderGeometry args={[0.12, 0.12, 0.02, 12]} />
        <meshStandardMaterial color="#fef9c3" emissive="#fef08a" emissiveIntensity={1.5} />
      </mesh>
      {/* Roof peak */}
      <mesh position={[0, 1.85, 0]}>
        <coneGeometry args={[0.22, 0.35, 4]} />
        <meshStandardMaterial color="#5A9E35" roughness={0.7} />
      </mesh>
      {/* Windows */}
      <WindowGrid cols={3} rows={2} width={1.3} height={0.85} depth={0.51} facingZ baseY={0.12} winColor="#FFF3B0" winEmissive="#FFF3B0" winIntensity={0.8} />
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
  const { proportions } = useActiveCityState();
  const visible = Math.round(proportions.investments * 100) >= 15; // invest ≥ 15%
  const target = visible ? 1 : 0.01;
  const bodyRef = useLerpScale(target);
  const pulseRef = useIdlePulse(0.4, 0.008, 0.5);

  const bodyH = 1.8;
  const bodyW = 1.4;
  const bodyD = 1.1;

  return (
    <group ref={pulseRef} position={[x, 0, z]}>
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
      <pointLight position={[0, 0.55, 0]} intensity={2.5} color="#38bdf8" distance={3.5} decay={2} />
    </group>
  );
}

// ─── Bridge over road intersection ───────────────────────────────────────────
function Bridge() {
  return (
    <group position={[-0.4, 0, 0.3]}>
      {/* Deck — warm asphalt */}
      <mesh position={[0, 0.62, 0]} receiveShadow castShadow>
        <boxGeometry args={[0.7, 0.08, 1.8]} />
        <meshStandardMaterial color="#6B6560" roughness={0.8} />
      </mesh>
      {/* Railings */}
      {[-0.3, 0.3].map((rx) => (
        <mesh key={rx} position={[rx, 0.72, 0]}>
          <boxGeometry args={[0.04, 0.1, 1.8]} />
          <meshStandardMaterial color="#6B6560" roughness={0.9} />
        </mesh>
      ))}
      {/* Support pillars */}
      {[-0.7, 0.7].map((rz) => (
        <mesh key={rz} position={[0, 0.31, rz]} castShadow>
          <cylinderGeometry args={[0.07, 0.09, 0.62, 8]} />
          <meshStandardMaterial color="#6B6560" roughness={0.8} metalness={0.2} />
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

// ─── Bunny Rabbit ─────────────────────────────────────────────────────────────
function BunnyRabbit({ idx }: { idx: number }) {
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
    // Light hop motion
    ref.current.position.y = 0.1 + Math.abs(Math.sin(ref.current.position.x * 8)) * 0.02;
    ref.current.rotation.y = speed > 0 ? 0 : Math.PI;
  });

  const BUNNY_COLORS = ["#f3f4f6", "#d1d5db", "#e5e7eb", "#d6d3d1"];
  const color = BUNNY_COLORS[idx % BUNNY_COLORS.length];
  const startX = (idx * 2.1) % 20 - 10;

  return (
    <group ref={ref} position={[startX, 0.1, zPos]}>
      {/* Bunny body */}
      <mesh position={[0, 0.1, 0]}>
        <sphereGeometry args={[0.1, 12, 12]} />
        <meshStandardMaterial color={color} roughness={0.8} />
      </mesh>
      {/* Head */}
      <mesh position={[0.11, 0.16, 0]}>
        <sphereGeometry args={[0.07, 10, 10]} />
        <meshStandardMaterial color={color} roughness={0.82} />
      </mesh>
      {/* Ears */}
      <mesh position={[0.14, 0.27, 0.025]}>
        <capsuleGeometry args={[0.015, 0.1, 4, 6]} />
        <meshStandardMaterial color={color} roughness={0.85} />
      </mesh>
      <mesh position={[0.14, 0.27, -0.025]}>
        <capsuleGeometry args={[0.015, 0.1, 4, 6]} />
        <meshStandardMaterial color={color} roughness={0.85} />
      </mesh>
      {/* Tail */}
      <mesh position={[-0.09, 0.12, 0]}>
        <sphereGeometry args={[0.03, 8, 8]} />
        <meshStandardMaterial color="#ffffff" roughness={0.9} />
      </mesh>
    </group>
  );
}

// ─── Office Block ─────────────────────────────────────────────────────────────
function OfficeBlock({ x, z, idx }: { x: number; z: number; idx: number }) {
  const { cityState } = useActiveCityState();
  const h = cityState.bankHeight * 0.6 + (idx % 3) * 0.55;
  const mainRef = useLerpScale(h, 2);
  const pulseRef = useIdlePulse(0.4, 0.008, idx * 1.0);
  const bW = 1.0; const bD = 0.85;
  const cols = Math.max(2, Math.min(5, Math.floor(h * 0.8) + 2));
  const rows = Math.max(2, Math.floor(h * 1.4));

  return (
    <group ref={pulseRef} position={[x, 0, z]}>
      <mesh position={[0, 0.2, 0]} castShadow receiveShadow>
        <boxGeometry args={[bW + 0.2, 0.4, bD + 0.2]} />
        <meshStandardMaterial color="#1e293b" roughness={0.5} metalness={0.3} />
      </mesh>
      <mesh ref={mainRef} position={[0, h * 0.5, 0]} castShadow>
        <boxGeometry args={[bW, 1, bD]} />
        <meshStandardMaterial color="#334155" roughness={0.22} metalness={0.55} emissive="#1e293b" emissiveIntensity={0.4} />
      </mesh>
      <WindowGrid cols={cols} rows={rows} width={bW - 0.12} height={Math.max(0.3, h - 0.5)} depth={bD / 2}  facingZ    baseY={0.5}  winColor="#bfdbfe" winEmissive="#93c5fd" winIntensity={0.8} />
      <WindowGrid cols={cols} rows={rows} width={bW - 0.12} height={Math.max(0.3, h - 0.5)} depth={-bD / 2} facingZ    baseY={0.5}  winColor="#bfdbfe" winEmissive="#93c5fd" winIntensity={0.8} />
      <WindowGrid cols={cols} rows={rows} width={bD - 0.12} height={Math.max(0.3, h - 0.5)} depth={bW / 2}  facingZ={false} baseY={0.5} winColor="#bfdbfe" winEmissive="#93c5fd" winIntensity={0.6} />
      <WindowGrid cols={cols} rows={rows} width={bD - 0.12} height={Math.max(0.3, h - 0.5)} depth={-bW / 2} facingZ={false} baseY={0.5} winColor="#bfdbfe" winEmissive="#93c5fd" winIntensity={0.6} />
      <mesh position={[0, h + 0.06, 0]}>
        <boxGeometry args={[bW - 0.2, 0.12, bD - 0.2]} />
        <meshStandardMaterial color="#475569" metalness={0.6} roughness={0.3} />
      </mesh>
    </group>
  );
}

// ─── Shopping Mall ────────────────────────────────────────────────────────────
function ShoppingMall({ x, z }: { x: number; z: number }) {
  const { proportions } = useActiveCityState();
  const visible = Math.round(proportions.wants * 100) >= 15;
  const bodyRef = useLerpScale(visible ? 1 : 0.01);

  return (
    <group position={[x, 0, z]}>
      <mesh ref={bodyRef} position={[0, 0.9, 0]} castShadow receiveShadow>
        <boxGeometry args={[3.8, 1.8, 2.2]} />
        <meshStandardMaterial color="#92400e" roughness={0.5} metalness={0.05} emissive="#7c2d12" emissiveIntensity={0.15} />
      </mesh>
      {visible && (
        <mesh position={[0, 1.22, 1.12]}>
          <boxGeometry args={[2.2, 0.08, 0.6]} />
          <meshStandardMaterial color="#d97706" emissive="#92400e" emissiveIntensity={0.5} />
        </mesh>
      )}
      {visible && <WindowGrid cols={5} rows={2} width={3.6}  height={1.4} depth={1.12}  facingZ       baseY={0.14} winColor="#f8fafc" winEmissive="#e2e8f0" winIntensity={0.3} />}
      {visible && <WindowGrid cols={2} rows={2} width={2.05} height={1.4} depth={1.92}  facingZ={false} baseY={0.14} winColor="#f8fafc" winEmissive="#e2e8f0" winIntensity={0.25} />}
      {visible && <WindowGrid cols={2} rows={2} width={2.05} height={1.4} depth={-1.92} facingZ={false} baseY={0.14} winColor="#f8fafc" winEmissive="#e2e8f0" winIntensity={0.25} />}
      {visible && (
        <mesh position={[0, 1.95, 1.12]}>
          <boxGeometry args={[2.8, 0.22, 0.04]} />
          <meshStandardMaterial color="#f59e0b" emissive="#d97706" emissiveIntensity={1.5} />
        </mesh>
      )}
      {[[-1.2, 0], [0, 0], [1.2, 0]].map(([rx, rz], i) => (
        <mesh key={i} position={[rx, 1.88, rz as number]}>
          <boxGeometry args={[0.4, 0.14, 0.35]} />
          <meshStandardMaterial color="#6B6560" roughness={0.9} />
        </mesh>
      ))}
    </group>
  );
}

// ─── Market / Corner Shop ─────────────────────────────────────────────────────
const MKT_PALETTE = [
  { wall: "#E8836A", sign: "#f97316", awning: "#D4725A" },
  { wall: "#D4725A", sign: "#fbbf24", awning: "#E8A020" },
  { wall: "#E8836A", sign: "#fcd34d", awning: "#D4725A" },
  { wall: "#E8A020", sign: "#fef08a", awning: "#d97706" },
  { wall: "#D4725A", sign: "#E8A020", awning: "#b45309" },
  { wall: "#E8836A", sign: "#fbbf24", awning: "#c2410c" },
] as const;

function Market({ x, z, idx }: { x: number; z: number; idx: number }) {
  const pal = MKT_PALETTE[idx % MKT_PALETTE.length];
  const h = 0.85 + (idx % 3) * 0.12;
  return (
    <group position={[x, 0, z]}>
      <mesh position={[0, h * 0.5, 0]} castShadow receiveShadow>
        <boxGeometry args={[1.3, h, 1.0]} />
        <meshStandardMaterial color={pal.wall} roughness={0.5} metalness={0.05} />
      </mesh>
      <mesh position={[0, h + 0.04, 0.54]}>
        <boxGeometry args={[1.3, 0.05, 0.35]} />
        <meshStandardMaterial color={pal.awning} emissive={pal.awning} emissiveIntensity={0.5} />
      </mesh>
      <mesh position={[0, h - 0.08, 0.52]}>
        <boxGeometry args={[0.9, 0.12, 0.025]} />
        <meshStandardMaterial color={pal.sign} emissive={pal.sign} emissiveIntensity={1.2} />
      </mesh>
      <WindowGrid cols={2} rows={1} width={1.1} height={h * 0.35} depth={0.51} facingZ baseY={0.12} winColor="#FFF3B0" winEmissive="#FFF3B0" winIntensity={0.5} />
      <mesh position={[0.5, 0.22, 0.6]}>
        <boxGeometry args={[0.45, 0.38, 0.08]} />
        <meshStandardMaterial color={pal.sign} roughness={0.8} />
      </mesh>
    </group>
  );
}

// ─── Warehouse ────────────────────────────────────────────────────────────────
function Warehouse({ x, z }: { x: number; z: number }) {
  return (
    <group position={[x, 0, z]}>
      <mesh position={[0, 0.75, 0]} castShadow receiveShadow>
        <boxGeometry args={[3.0, 1.5, 2.0]} />
        <meshStandardMaterial color="#6B6560" roughness={0.8} metalness={0.3} />
      </mesh>
      <mesh position={[0, 1.62, 0]}>
        <boxGeometry args={[3.0, 0.24, 0.4]} />
        <meshStandardMaterial color="#6B6560" roughness={0.9} />
      </mesh>
      <mesh position={[0, 0.22, 1.06]}>
        <boxGeometry args={[1.4, 0.44, 0.12]} />
        <meshStandardMaterial color="#6B6560" roughness={0.85} />
      </mesh>
      <WindowGrid cols={3} rows={1} width={2.8} height={0.35} depth={1.02} facingZ baseY={0.95} winColor="#FFF3B0" winEmissive="#FFF3B0" winIntensity={0.4} />
      <WindowGrid cols={2} rows={1} width={1.85} height={0.35} depth={1.02} facingZ={false} baseY={0.95} winColor="#cbd5e1" winEmissive="#94a3b8" winIntensity={0.3} />
    </group>
  );
}

// ─── Condo Tower (taller residential variant) ─────────────────────────────────
const CONDO_COLORS = ["#0c4a6e", "#164e63", "#0e7490", "#075985"] as const;

function CondoTower({ x, z, idx }: { x: number; z: number; idx: number }) {
  const { cityState } = useActiveCityState();
  const count = cityState.apartmentCount;
  const visible = idx < Math.floor(count / 3);
  const h = 3.2 + (idx % 3) * 1.1;
  const target = visible ? 1 : 0.01;
  // useLerpScale(h) → scale.y → h, position.y → h/2.
  // Unit box (height 1) scaled to h spans: h/2 - h/2 = 0 to h/2 + h/2 = h.
  const mainRef = useLerpScale(target * h, 2);
  const pulseRef = useIdlePulse(0.5, 0.015, idx * 1.2);
  const color = CONDO_COLORS[idx % CONDO_COLORS.length];
  const cols = 3; const rows = Math.max(3, Math.floor(h * 1.5));

  const bW = 0.9; const bD = 0.9;

  // Art Deco setbacks: y = bottom edge, centre = bottom + height/2
  const sb1H = h * 0.35; const sb1W = bW * 0.85; const sb1D = bD * 0.85;
  const sb2H = h * 0.20; const sb2W = bW * 0.70; const sb2D = bD * 0.70;
  const sb1Y  = h * 0.55 + sb1H * 0.5;   // centre at h*0.55 + h*0.175 = h*0.725
  const sb2Y  = h * 0.80 + sb2H * 0.5;   // centre at h*0.80 + h*0.10  = h*0.90

  // Corner fin positions: just outside the shaft faces
  const finOffset = bW / 2 + 0.02;

  return (
    <group ref={pulseRef} position={[x, 0, z]}>
      {/* ── Street-level podium ── */}
      <mesh position={[0, 0.18, 0]} castShadow receiveShadow>
        <boxGeometry args={[1.15, 0.36, 1.15]} />
        <meshStandardMaterial color="#1e293b" roughness={0.4} metalness={0.4} />
      </mesh>

      {/* ── Main shaft — unit box scaled to h, spans y=0 to y=h ── */}
      <mesh ref={mainRef} position={[0, h * 0.5, 0]} castShadow>
        <boxGeometry args={[bW, 1, bD]} />
        <meshStandardMaterial color={color} roughness={0.2} metalness={0.55} emissive={color} emissiveIntensity={0.25} />
      </mesh>

      {/* ── Horizontal floor-line bands — every 0.8 units from 0.8 to h-0.2 ── */}
      {visible && Array.from(
        { length: Math.floor(h / 0.8) },
        (_, fi) => {
          const lineY = (fi + 1) * 0.8;
          if (lineY >= h - 0.2) return null;
          return (
            <mesh key={`floor-${fi}`} position={[0, lineY, 0]}>
              <boxGeometry args={[bW + 0.05, 0.04, bD + 0.05]} />
              <meshStandardMaterial color="#1a4a6a" roughness={0.3} metalness={0.4} />
            </mesh>
          );
        }
      )}

      {/* ── Corner fins — exterior, full tower height, centred at h/2 ── */}
      {visible && [
        [ finOffset,  finOffset],
        [-finOffset,  finOffset],
        [ finOffset, -finOffset],
        [-finOffset, -finOffset],
      ].map(([cx, cz], fi) => (
        <mesh key={`fin-${fi}`} position={[cx, h * 0.5, cz]} castShadow>
          <boxGeometry args={[0.04, h, 0.04]} />
          <meshStandardMaterial color="#1a6090" roughness={0.25} metalness={0.5} />
        </mesh>
      ))}

      {/* ── Windows ── */}
      {visible && <WindowGrid cols={cols} rows={rows} width={0.78} height={h - 0.5} depth={ 0.46} facingZ       baseY={0.45} winColor="#e0f2fe" winEmissive="#bae6fd" winIntensity={1.0} />}
      {visible && <WindowGrid cols={cols} rows={rows} width={0.78} height={h - 0.5} depth={-0.46} facingZ       baseY={0.45} winColor="#e0f2fe" winEmissive="#bae6fd" winIntensity={1.0} />}
      {visible && <WindowGrid cols={cols} rows={rows} width={0.78} height={h - 0.5} depth={ 0.46} facingZ={false} baseY={0.45} winColor="#e0f2fe" winEmissive="#bae6fd" winIntensity={0.8} />}
      {visible && <WindowGrid cols={cols} rows={rows} width={0.78} height={h - 0.5} depth={-0.46} facingZ={false} baseY={0.45} winColor="#e0f2fe" winEmissive="#bae6fd" winIntensity={0.8} />}

      {/* ── Art Deco setback 1 — bottom at h*0.55, top at h*0.90 ── */}
      {visible && (
        <mesh position={[0, sb1Y, 0]} castShadow>
          <boxGeometry args={[sb1W, sb1H, sb1D]} />
          <meshStandardMaterial color={color} roughness={0.22} metalness={0.55} emissive={color} emissiveIntensity={0.3} />
        </mesh>
      )}

      {/* ── Art Deco setback 2 — bottom at h*0.80, top at h*1.00 ── */}
      {visible && (
        <mesh position={[0, sb2Y, 0]} castShadow>
          <boxGeometry args={[sb2W, sb2H, sb2D]} />
          <meshStandardMaterial color={color} roughness={0.2} metalness={0.6} emissive={color} emissiveIntensity={0.35} />
        </mesh>
      )}

      {/* ── Mechanical penthouse floor — sits on tower top ── */}
      {visible && (
        <mesh position={[0, h + 0.15, 0]} castShadow>
          <boxGeometry args={[0.5, 0.3, 0.5]} />
          <meshStandardMaterial color="#0b3a5a" roughness={0.4} metalness={0.6} />
        </mesh>
      )}

      {/* ── Rooftop crown glow — flush with tower top ── */}
      {visible && (
        <mesh position={[0, h + 0.125, 0]}>
          <boxGeometry args={[0.6, 0.25, 0.6]} />
          <meshStandardMaterial color={color} roughness={0.15} metalness={0.7} emissive={color} emissiveIntensity={0.6} />
        </mesh>
      )}

      {/* ── Antenna / spire — base at h+0.30, tip at h+0.90 ── */}
      {visible && (
        <mesh position={[0, h + 0.6, 0]} castShadow>
          <cylinderGeometry args={[0.015, 0.03, 0.6, 6]} />
          <meshStandardMaterial color="#94A3B8" metalness={0.9} roughness={0.1} />
        </mesh>
      )}
    </group>
  );
}

// ─── Civic district grid (top-left quadrant, for reward buildings only) ─────────
const CIVIC_DISTRICT_POSITIONS: [number, number][] = [
  [-17, 3], [-17, 0], [-17, -2], [-14, 3], [-14, 0], [-14, -2],
];

// ─── Reward building glow (golden halo beneath) ─────────────────────────────────
function RewardGlow() {
  return (
    <mesh position={[0, 0.02, 0]} rotation={[-Math.PI / 2, 0, 0]}>
      <cylinderGeometry args={[1.8, 1.8, 0.02, 32]} />
      <meshBasicMaterial color="#C17B3F" transparent opacity={0.3} depthWrite={false} side={THREE.DoubleSide} />
    </mesh>
  );
}

// ─── Scale-up animation (0 → 1 over 1 second) ────────────────────────────────────
function useRewardScaleIn() {
  const ref = useRef<THREE.Group>(null);
  const start = useRef<number | null>(null);
  useFrame(({ clock }) => {
    if (!ref.current) return;
    const elapsed = clock.elapsedTime;
    if (start.current === null) start.current = elapsed;
    const startVal = start.current;
    const t = Math.min(1, elapsed - startVal);
    const s = THREE.MathUtils.smoothstep(t, 0, 1);
    ref.current.scale.setScalar(s);
  });
  return ref;
}

// ─── Library: warm brick, triangular roof, small dome ───────────────────────────
function RewardLibrary() {
  const ref = useRewardScaleIn();
  return (
    <group ref={ref}>
      <RewardGlow />
      <mesh position={[0, 0.6, 0]} castShadow receiveShadow>
        <boxGeometry args={[1.4, 1.2, 1.2]} />
        <meshStandardMaterial color="#C4956A" roughness={0.7} />
      </mesh>
      <mesh position={[0, 1.35, 0]} castShadow>
        <coneGeometry args={[1.0, 0.5, 3]} />
        <meshStandardMaterial color="#C4956A" roughness={0.7} />
      </mesh>
      <mesh position={[0, 1.75, 0]} castShadow>
        <sphereGeometry args={[0.25, 16, 12, 0, Math.PI * 2, 0, Math.PI / 2]} />
        <meshStandardMaterial color="#C4956A" roughness={0.6} />
      </mesh>
    </group>
  );
}

// ─── Stadium: large oval, low profile, ring of columns ──────────────────────────
function RewardStadium() {
  const ref = useRewardScaleIn();
  return (
    <group ref={ref}>
      <RewardGlow />
      <mesh position={[0, 0.25, 0]} rotation={[-Math.PI / 2, 0, 0]} castShadow receiveShadow>
        <cylinderGeometry args={[1.8, 1.8, 0.3, 32]} />
        <meshStandardMaterial color="#E8D5A3" roughness={0.8} />
      </mesh>
      {Array.from({ length: 16 }, (_, i) => {
        const a = (i / 16) * Math.PI * 2;
        return (
          <mesh key={i} position={[Math.cos(a) * 1.5, 0.35, Math.sin(a) * 1.5]} castShadow>
            <cylinderGeometry args={[0.06, 0.06, 0.25, 8]} />
            <meshStandardMaterial color="#E8D5A3" roughness={0.8} />
          </mesh>
        );
      })}
    </group>
  );
}

// ─── Solar tower: tall slim tower, teal panels at top ───────────────────────────
function RewardSolarTower() {
  const ref = useRewardScaleIn();
  return (
    <group ref={ref}>
      <RewardGlow />
      <mesh position={[0, 1.2, 0]} castShadow>
        <boxGeometry args={[0.5, 2.4, 0.5]} />
        <meshStandardMaterial color="#4A90D9" roughness={0.3} metalness={0.4} />
      </mesh>
      <group position={[0, 2.6, 0]}>
        <mesh rotation={[0.4, 0, 0]} castShadow>
          <boxGeometry args={[0.6, 0.08, 0.5]} />
          <meshStandardMaterial color="#00D4AA" emissive="#00D4AA" emissiveIntensity={0.6} />
        </mesh>
        <mesh position={[0, 0, 0.35]} rotation={[0.4, 0, 0]} castShadow>
          <boxGeometry args={[0.6, 0.08, 0.5]} />
          <meshStandardMaterial color="#00D4AA" emissive="#00D4AA" emissiveIntensity={0.6} />
        </mesh>
        <mesh position={[0, 0, -0.35]} rotation={[0.4, 0, 0]} castShadow>
          <boxGeometry args={[0.6, 0.08, 0.5]} />
          <meshStandardMaterial color="#00D4AA" emissive="#00D4AA" emissiveIntensity={0.6} />
        </mesh>
      </group>
    </group>
  );
}

// ─── Reward Market: wide low, striped awnings, stall structures ──────────────────
function RewardMarket() {
  const ref = useRewardScaleIn();
  const stripes = ["#E8836A", "#D4725A", "#E8A020", "#c2410c"];
  return (
    <group ref={ref}>
      <RewardGlow />
      <mesh position={[0, 0.35, 0]} castShadow receiveShadow>
        <boxGeometry args={[2.2, 0.7, 1.4]} />
        <meshStandardMaterial color="#E8836A" roughness={0.6} />
      </mesh>
      {[0, 1, 2, 3].map((i) => (
        <mesh key={i} position={[-0.9 + i * 0.6, 0.75, 0.72]} castShadow>
          <boxGeometry args={[0.5, 0.1, 0.8]} />
          <meshStandardMaterial color={stripes[i % stripes.length]} roughness={0.5} />
        </mesh>
      ))}
      {[[-0.6, 0.5, 0.8], [0.6, 0.4, 0.8]].map(([px, py, pz], i) => (
        <mesh key={`stall-${i}`} position={[px, py, pz]} castShadow>
          <boxGeometry args={[0.5, 0.5, 0.4]} />
          <meshStandardMaterial color="#E8836A" roughness={0.6} />
        </mesh>
      ))}
    </group>
  );
}

// ─── Monument: obelisk on plinth, gold accent top ────────────────────────────────
function RewardMonument() {
  const ref = useRewardScaleIn();
  return (
    <group ref={ref}>
      <RewardGlow />
      <mesh position={[0, 0.15, 0]} castShadow receiveShadow>
        <boxGeometry args={[1.2, 0.3, 1.2]} />
        <meshStandardMaterial color="#F5E6C8" roughness={0.4} metalness={0.1} />
      </mesh>
      <mesh position={[0, 1.0, 0]} castShadow>
        <boxGeometry args={[0.4, 1.4, 0.4]} />
        <meshStandardMaterial color="#F5E6C8" roughness={0.35} metalness={0.15} />
      </mesh>
      <mesh position={[0, 1.95, 0]} castShadow>
        <boxGeometry args={[0.15, 0.3, 0.15]} />
        <meshStandardMaterial color="#C17B3F" emissive="#C17B3F" emissiveIntensity={0.4} metalness={0.6} />
      </mesh>
    </group>
  );
}

// ─── Garden: hedge borders, fountain, flower clusters ───────────────────────────
function RewardGarden() {
  const ref = useRewardScaleIn();
  return (
    <group ref={ref}>
      <RewardGlow />
      {/* Hedge borders */}
      {[[0, 0.2, 0.65], [0, 0.2, -0.65], [0.65, 0.2, 0], [-0.65, 0.2, 0]].map(([x, y, z], i) => (
        <mesh key={i} position={[x, y, z]} castShadow>
          <boxGeometry args={i < 2 ? [1.2, 0.4, 0.15] : [0.15, 0.4, 1.2]} />
          <meshStandardMaterial color="#5A9E35" roughness={0.9} />
        </mesh>
      ))}
      {/* Fountain centre */}
      <mesh position={[0, 0.15, 0]} castShadow>
        <cylinderGeometry args={[0.2, 0.25, 0.3, 12]} />
        <meshStandardMaterial color="#F5E6C8" roughness={0.5} />
      </mesh>
      <mesh position={[0, 0.45, 0]}>
        <sphereGeometry args={[0.08, 8, 8]} />
        <meshStandardMaterial color="#7dd3fc" transparent opacity={0.9} />
      </mesh>
      {/* Flowers: pink and yellow spheres */}
      {[[0.25, 0.12, 0.25], [-0.3, 0.1, 0.2], [0.2, 0.1, -0.3], [-0.25, 0.12, -0.2], [0.35, 0.1, 0]].map(([x, y, z], i) => (
        <mesh key={i} position={[x, y, z]}>
          <sphereGeometry args={[0.06, 6, 6]} />
          <meshStandardMaterial color={i % 2 === 0 ? "#FFB3C6" : "#FFE566"} roughness={0.8} />
        </mesh>
      ))}
    </group>
  );
}

// ─── Pulse on transaction (scale 1 → 1.12 → 1 over 600ms when category matches) ─
function usePulseOnTransaction(category: string) {
  const lastCategory = useGameStore((s) => s.lastTransactionCategory);
  const clearLastTransaction = useGameStore((s) => s.clearLastTransaction);
  const scaleRef = useRef(1);
  const pulseRef = useRef(false);
  const startRef = useRef(0);

  useEffect(() => {
    if (lastCategory?.toLowerCase() === category.toLowerCase()) {
      pulseRef.current = true;
      startRef.current = performance.now();
    }
  }, [lastCategory, category]);

  useFrame(() => {
    if (!pulseRef.current) return;
    const elapsed = (performance.now() - startRef.current) / 1000;
    if (elapsed < 0.3) {
      scaleRef.current = 1 + (elapsed / 0.3) * 0.12;
    } else if (elapsed < 0.6) {
      scaleRef.current = 1.12 - ((elapsed - 0.3) / 0.3) * 0.12;
    } else {
      scaleRef.current = 1;
      pulseRef.current = false;
      clearLastTransaction();
    }
  });

  return scaleRef;
}

function ScaleGroup({ category, children }: { category: string; children: ReactNode }) {
  const scaleRef = usePulseOnTransaction(category);
  const groupRef = useRef<THREE.Group>(null);
  useFrame(() => {
    if (groupRef.current) {
      groupRef.current.scale.setScalar(scaleRef.current);
    }
  });
  return <group ref={groupRef}>{children}</group>;
}

// ─── Long-press ring (expands from point over 500ms) ───────────────────────────
function LongPressRing({ position }: { position: THREE.Vector3 }) {
  const ref = useRef<THREE.Mesh>(null);
  const start = useRef<number | null>(null);
  useFrame(({ clock }) => {
    const t = start.current === null ? (start.current = clock.elapsedTime) && 0 : clock.elapsedTime - start.current;
    if (ref.current) {
      const s = Math.min(1, t / 0.5) * 2;
      ref.current.scale.setScalar(s);
      (ref.current.material as THREE.MeshBasicMaterial).opacity = 0.4 * (1 - Math.min(1, t / 0.5));
    }
  });
  return (
    <mesh ref={ref} position={[position.x, 0.02, position.z]} rotation={[-Math.PI / 2, 0, 0]}>
      <ringGeometry args={[0.1, 0.5, 32]} />
      <meshBasicMaterial color="#C17B3F" transparent opacity={0.4} depthWrite={false} side={THREE.DoubleSide} />
    </mesh>
  );
}

function RewardBuildingByType({ type }: { type: RewardBuildingType }) {
  switch (type) {
    case "library": return <RewardLibrary />;
    case "stadium": return <RewardStadium />;
    case "solar_tower": return <RewardSolarTower />;
    case "market": return <RewardMarket />;
    case "monument": return <RewardMonument />;
    case "garden": return <RewardGarden />;
    default: return null;
  }
}

// ─── Main city export ──────────────────────────────────────────────────────────
type BuildingPopupData =
  | { type: "building"; title: string; category: TransactionCategory; status: string; tip: string }
  | { type: "reward"; building: RewardBuilding };

export function CityGenerator() {
  const { proportions, cityState } = useActiveCityState();
  const rewardBuildings = useGameStoreInCanvas((s) => s.rewardBuildings);
  const setRewardBuildingPosition = useGameStoreInCanvas((s) => s.setRewardBuildingPosition);
  const [hoverInfo, setHoverInfo] = useState<{
    title: string;
    stat: string;
    state: string;
    tip: string;
    position: [number, number, number];
  } | null>(null);
  const [buildingPopup, setBuildingPopup] = useState<{
    position: THREE.Vector3;
    data: BuildingPopupData;
  } | null>(null);
  const [placementPicker, setPlacementPicker] = useState<{ position: THREE.Vector3 } | null>(null);
  const lastTapTime = useRef(0);
  const longPressTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const longPressPosition = useRef<THREE.Vector3 | null>(null);
  const [longPressRing, setLongPressRing] = useState<THREE.Vector3 | null>(null);

  useEffect(() => {
    return () => {
      if (longPressTimer.current) clearTimeout(longPressTimer.current);
    };
  }, []);

  const needsPct = Math.round(proportions.needs * 100);
  const wantsPct = Math.round(proportions.wants * 100);
  const treatsPct = Math.round(proportions.treats * 100);
  const investPct = Math.round(proportions.investments * 100);
  const healthPct = Math.round(cityState.healthScore);

  // Contextual state labels
  const needsState  = needsPct >= 50 ? "Healthy" : needsPct >= 30 ? "Growing" : "Low";
  const wantsState  = wantsPct <= 30 ? "Balanced" : wantsPct <= 50 ? "High" : "Excessive";
  const treatsState = treatsPct <= 10 ? "Minimal" : treatsPct <= 20 ? "Moderate" : "Heavy";
  const investState = investPct >= 20 ? "Strong" : investPct >= 10 ? "Building" : "Weak";
  const healthState = healthPct >= 75 ? "Thriving" : healthPct >= 50 ? "Stable" : healthPct >= 30 ? "Struggling" : "Critical";

  const hoverProps = useCallback(
    (title: string, stat: string, state: string, tip: string, position: [number, number, number]) => ({
      onPointerOver: (e: any) => {
        e.stopPropagation();
        setHoverInfo({ title, stat, state, tip, position });
      },
      onPointerOut: (e: any) => {
        e.stopPropagation();
        setHoverInfo(null);
      },
    }),
    [],
  );

  const setResetCameraTrigger = useGameStoreInCanvas((s) => s.setResetCameraTrigger);

  const buildingTapProps = useCallback(
    (
      title: string,
      category: TransactionCategory,
      status: string,
      tip: string,
      position: [number, number, number],
    ) => ({
      onPointerDown: (e: any) => {
        e.stopPropagation();
        const pt = e.point.clone().add(0, 1.5, 0);
        setBuildingPopup({
          position: pt,
          data: { type: "building", title, category, status, tip },
        });
        const now = Date.now();
        if (now - lastTapTime.current < 300) setResetCameraTrigger();
        lastTapTime.current = now;
      },
    }),
    [setResetCameraTrigger],
  );

  const unplacedRewardBuildings = useMemo(
    () => rewardBuildings.filter((b) => b.position == null),
    [rewardBuildings],
  );

  const handlePlacementPlanePointerDown = useCallback(
    (e: any) => {
      e.stopPropagation();
      const now = Date.now();
      if (now - lastTapTime.current < 300) {
        setResetCameraTrigger();
        lastTapTime.current = 0;
        return;
      }
      lastTapTime.current = now;
      longPressPosition.current = e.point.clone();
      if (longPressTimer.current) clearTimeout(longPressTimer.current);
      longPressTimer.current = setTimeout(() => {
        setLongPressRing(e.point.clone());
        if (unplacedRewardBuildings.length > 0) {
          setPlacementPicker({ position: e.point.clone() });
        }
        longPressTimer.current = null;
      }, 500);
    },
    [unplacedRewardBuildings.length, setResetCameraTrigger],
  );

  const handlePlacementPlanePointerUp = useCallback(() => {
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current);
      longPressTimer.current = null;
    }
    setLongPressRing(null);
  }, []);

  const handlePlaceBuilding = useCallback(
    (buildingId: string, position: { x: number; z: number }) => {
      setRewardBuildingPosition(buildingId, position);
      setPlacementPicker(null);
    },
    [setRewardBuildingPosition],
  );

  const treats = proportions.treats;
  const cloudCount = Math.min(8, Math.floor(treats * 18));
  const carCount   = Math.max(2, Math.min(8, cityState.population));
  const pedCount   = Math.max(3, Math.min(16, cityState.population * 2));
  const officeCount = Math.max(2, Math.round(investPct / 100 * 8));

  // 24 apartment positions — Near NW, Far NW, NE, Deep NW
  const aptPositions: [number, number][] = [
    [-5.5,-3.2], [-4.2,-3.2], [-2.9,-3.2], [-1.6,-3.2],
    [-6.8,-1.8], [-5.5,-1.8], [-4.2,-1.8], [-2.9,-1.8],
    [-9.0,-3.2], [-10.5,-3.2], [-12.0,-3.2],
    [-9.0,-1.8], [-10.5,-1.8],
    [-9.0,-6.8], [-10.5,-6.8], [-12.0,-6.8], [-13.5,-6.8],
    [1.5,-3.2],  [3.0,-3.2],
    [1.5,-6.8],  [3.0,-6.8],  [4.5,-6.8],
    [-9.0,-9.5], [-10.5,-9.5],
  ];

  // 12 restaurant positions — SW strip, SE strip, deep SW strip
  const restPositions: [number, number][] = [
    [-6.5, 2.2], [-5.0, 2.2], [-3.5, 2.2], [-2.0, 2.2], [-0.5, 2.2],
    [1.5, 2.2],  [3.0, 2.2],  [4.5, 2.2],
    [-9.0, 7.5], [-6.5, 7.5], [-4.0, 7.5], [-1.5, 7.5],
  ];

  // 8 office block positions — NE district
  const officePositions: [number, number][] = [
    [1.5,-1.6],  [3.5,-1.6],
    [8.0,-2.0],  [9.5,-2.0],
    [8.0,-5.0],  [9.5,-5.0],
    [8.0,-8.0],  [9.5,-8.0],
  ];

  // 4 condo tower positions — tall residential punctuating the skyline
  const condoPositions: [number, number][] = [
    [-13.5,-3.2], [-13.5,-1.8], [-13.5,-9.5], [4.5,-3.2],
  ];

  // Gold Tower positions — "Financial Crown" district, NE cluster (up to 7)
  const goldTowerPositions: [number, number, number][] = [
    // x, z, heightMultiplier — centre landmark is tallest
    [6.5, -4.5, 2.2],
    [4.8, -3.2, 1.6],
    [8.2, -3.2, 1.4],
    [4.8, -5.8, 1.5],
    [8.2, -5.8, 1.3],
    [6.5, -2.0, 1.2],
    [6.5, -7.0, 1.1],
  ];
  const goldCount = cityState.goldTowerCount ?? 0;

  // 6 market positions — commercial strips
  const marketPositions: [number, number][] = [
    [-8.5, 2.2], [-10.0, 2.2],
    [6.0, 2.2],  [7.5, 2.2],
    [-8.5, 5.5], [-6.0, 5.5],
  ];

  return (
    <group
      onPointerMissed={() => {
        setBuildingPopup(null);
        setPlacementPicker(null);
      }}
    >
      {/* Placement plane: long-press on empty ground to place reward buildings */}
      <mesh
        position={[0, 0.001, 0]}
        rotation={[-Math.PI / 2, 0, 0]}
        onPointerDown={handlePlacementPlanePointerDown}
        onPointerUp={handlePlacementPlanePointerUp}
        onPointerLeave={handlePlacementPlanePointerUp}
        visible={false}
      >
        <planeGeometry args={[50, 50]} />
        <meshBasicMaterial transparent opacity={0} />
      </mesh>

      {/* Long-press ring feedback */}
      {longPressRing && (
        <LongPressRing position={longPressRing} />
      )}

      {/* ── Secondary road network (warm asphalt) ── */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.007, -5.5]} receiveShadow>
        <planeGeometry args={[40, 0.65]} />
        <meshStandardMaterial color="#6B6560" roughness={0.9} />
      </mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.007, 6.5]} receiveShadow>
        <planeGeometry args={[40, 0.65]} />
        <meshStandardMaterial color="#6B6560" roughness={0.9} />
      </mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[-7.5, 0.007, 0]} receiveShadow>
        <planeGeometry args={[0.65, 40]} />
        <meshStandardMaterial color="#6B6560" roughness={0.9} />
      </mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[7.0, 0.007, 0]} receiveShadow>
        <planeGeometry args={[0.65, 40]} />
        <meshStandardMaterial color="#6B6560" roughness={0.9} />
      </mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.007, -10.5]} receiveShadow>
        <planeGeometry args={[40, 0.55]} />
        <meshStandardMaterial color="#6B6560" roughness={0.9} />
      </mesh>

      {/* ── Parks ── */}
      <group {...hoverProps("Central Park", `Treats: ${treatsPct}%`, treatsState, "Keep treats under 20% to keep your green spaces clean.", [-3.5, 0.5, -2.5])} {...buildingTapProps("Central Park", "Treat", treatsState, "Keep treats under 20% to keep your green spaces clean.", [-3.5, 0.5, -2.5])}>
        <Park x={-3.5} z={-2.5} w={5.5} d={3.5} />
      </group>
      <group {...hoverProps("South Park", `Treats: ${treatsPct}%`, treatsState, "Keep treats under 20% to keep your green spaces clean.", [-2.0, 0.5, 4.5])} {...buildingTapProps("South Park", "Treat", treatsState, "Keep treats under 20% to keep your green spaces clean.", [-2.0, 0.5, 4.5])}>
        <Park x={-2.0} z={4.5} w={9.5} d={3.5} />
      </group>
      <group {...hoverProps("Northwest Reserve", `Treats: ${treatsPct}%`, treatsState, "Reduce treats to grow your nature reserves.", [-11.5, 0.5, -8.2])} {...buildingTapProps("Northwest Reserve", "Treat", treatsState, "Reduce treats to grow your nature reserves.", [-11.5, 0.5, -8.2])}>
        <Park x={-11.5} z={-8.2} w={5.0} d={3.0} />
      </group>
      <group {...hoverProps("East Gardens", `Treats: ${treatsPct}%`, treatsState, "Lower treats keep these gardens flourishing.", [4.5, 0.5, -8.0])} {...buildingTapProps("East Gardens", "Treat", treatsState, "Lower treats keep these gardens flourishing.", [4.5, 0.5, -8.0])}>
        <Park x={4.5} z={-8.0} w={5.5} d={3.5} />
      </group>

      {/* ── Pavements ── */}
      <group {...hoverProps("Sidewalks", `Needs: ${needsPct}%`, needsState, "Spending on needs builds city infrastructure — aim for ~50%.", [-3.0, 0.35, -0.45])} {...buildingTapProps("Sidewalks", "Need", needsState, "Spending on needs builds city infrastructure — aim for ~50%.", [-3.0, 0.35, -0.45])}>
        <Pavement x={-3.0} z={-0.45} w={8}    d={0.55} />
        <Pavement x={-3.0} z={1.05}  w={8}    d={0.55} />
        <Pavement x={3.6}  z={-1.2}  w={0.55} d={5} />
        <Pavement x={-10.8} z={-0.45} w={6.5} d={0.5} />
        <Pavement x={-10.8} z={1.05}  w={6.5} d={0.5} />
        <Pavement x={8.8}  z={-0.45} w={4.0}  d={0.5} />
        <Pavement x={8.8}  z={1.05}  w={4.0}  d={0.5} />
        <Pavement x={-10.8} z={-5.8}  w={6.5} d={0.45} />
        <Pavement x={3.0}  z={-5.8}  w={6.0}  d={0.45} />
        <Pavement x={8.8}  z={-5.8}  w={4.0}  d={0.45} />
      </group>

      {/* ── Benches ── */}
      <group {...hoverProps("Park Benches", `Treats: ${treatsPct}%`, treatsState, "Less treats = cleaner parks with more amenities.", [-1.8, 0.7, -0.6])} {...buildingTapProps("Park Benches", "Treat", treatsState, "Less treats = cleaner parks.", [-1.8, 0.7, -0.6])}>
        <Bench x={-1.8} z={-0.6} />
        <Bench x={1.2}  z={-0.6} />
        <Bench x={-4.0} z={1.2} />
        <Bench x={-10.5} z={-7.5} />
        <Bench x={4.0}  z={-7.5} />
        <Bench x={-2.0} z={4.8} />
        <Bench x={0.5}  z={4.8} />
        <Bench x={-5.0} z={5.0} />
      </group>

      {/* ── Apartments (24 positions) ── */}
      <ScaleGroup category="need">
        {aptPositions.map(([x, z], i) => (
          <group key={`apt-wrap-${i}`} {...hoverProps("Apartments", `Needs: ${needsPct}%`, needsState, "More needs spending = more apartments and residents.", [x, 1.4, z])} {...buildingTapProps("Residential District", "Need", needsState, "Keep needs between 40-50% to grow this district.", [x, 1.4, z])}>
            <Apartment x={x} z={z} idx={i} />
          </group>
        ))}
      </ScaleGroup>

      {/* ── Condo Towers (4 tall residential towers) ── */}
      <ScaleGroup category="need">
        {condoPositions.map(([x, z], i) => (
          <group key={`condo-${i}`} {...hoverProps("Condo Tower", `Needs: ${needsPct}%`, needsState, "Condos rise as residential spending grows — aim for 50% needs.", [x, 3.5, z])} {...buildingTapProps("Condo Tower", "Need", needsState, "Keep needs between 40-50% to grow this district.", [x, 3.5, z])}>
            <CondoTower x={x} z={z} idx={i} />
          </group>
        ))}
      </ScaleGroup>

      {/* ── Restaurants (12 positions) ── */}
      <ScaleGroup category="want">
        {restPositions.map(([x, z], i) => (
          <group key={`rest-wrap-${i}`} {...hoverProps("Restaurants", `Wants: ${wantsPct}%`, wantsState, "Wants add variety, but keep them under 30% for a balanced city.", [x, 1.2, z])} {...buildingTapProps("Restaurants", "Want", wantsState, "Keep wants under 30% for a balanced city.", [x, 1.2, z])}>
            <Restaurant x={x} z={z} idx={i} />
          </group>
        ))}
      </ScaleGroup>

      {/* ── Office Blocks (scale with investment) ── */}
      {officePositions.slice(0, officeCount).map(([x, z], i) => (
        <group key={`office-${i}`} {...hoverProps("Office Block", `Investments: ${investPct}%`, investState, "More investment grows your business district.", [x, 2.5, z])} {...buildingTapProps("Office Block", "Invest", investState, "Aim for 20%+ investment to grow your business district.", [x, 2.5, z])}>
          <OfficeBlock x={x} z={z} idx={i} />
        </group>
      ))}

      {/* ── Markets (always visible) ── */}
      {marketPositions.map(([x, z], i) => (
        <group key={`market-${i}`} {...hoverProps("Market", `Wants: ${wantsPct}%`, wantsState, "Markets serve the community's daily needs.", [x, 1.0, z])} {...buildingTapProps("Market", "Want", wantsState, "Keep wants under 30% for a balanced city.", [x, 1.0, z])}>
          <Market x={x} z={z} idx={i} />
        </group>
      ))}

      {/* ── Shopping Mall (unlocks at wants ≥ 15%) ── */}
      <group {...hoverProps("Shopping Mall", `Wants: ${wantsPct}%`, wantsState, "The mall thrives when wants spending is above 15%.", [-11.5, 1.5, 5.5])} {...buildingTapProps("Shopping Mall", "Want", wantsState, "Keep wants under 30% for a balanced city.", [-11.5, 1.5, 5.5])}>
        <ShoppingMall x={-11.5} z={5.5} />
      </group>

      {/* ── Warehouses (industrial east) ── */}
      <group {...hoverProps("Warehouse", `Health: ${healthPct}/100`, healthState, "Industrial buildings anchor the far edge of your city.", [10.5, 1.2, 3.5])} {...buildingTapProps("Warehouse", "Invest", healthState, "City health affects industrial growth.", [10.5, 1.2, 3.5])}>
        <Warehouse x={10.5} z={3.5} />
      </group>
      <group {...hoverProps("Warehouse", `Health: ${healthPct}/100`, healthState, "Industrial buildings anchor the far edge of your city.", [10.5, 1.2, 7.5])} {...buildingTapProps("Warehouse", "Invest", healthState, "City health affects industrial growth.", [10.5, 1.2, 7.5])}>
        <Warehouse x={10.5} z={7.5} />
      </group>

      {/* ── Financial district ── */}
      <ScaleGroup category="invest">
        <group {...hoverProps("Bank Tower", `Investments: ${investPct}%`, investState, "Invest more to grow your financial district — aim for 20%+.", [3.5, 3.5, -2.5])} {...buildingTapProps("Bank Tower", "Invest", investState, "Invest more to grow your financial district — aim for 20%+.", [3.5, 3.5, -2.5])}>
          <BankTower x={3.5} z={-2.5} />
        </group>
        <group {...hoverProps("Investment Tower", `Investments: ${investPct}%`, investState, "Higher investment % makes this tower taller and more impressive.", [5.3, 3.2, -2.1])} {...buildingTapProps("Investment Tower", "Invest", investState, "Aim for 20%+ investment to grow this tower.", [5.3, 3.2, -2.1])}>
          <InvestmentTower x={5.3} z={-2.1} />
        </group>

        {/* ── Financial Crown district — golden plaza floor ── */}
        {goldCount >= 3 && (
          <mesh rotation={[-Math.PI / 2, 0, 0]} position={[6.5, 0.008, -4.5]} receiveShadow>
            <circleGeometry args={[3.5, 32]} />
            <meshStandardMaterial
              color="#C9A84C"
              transparent
              opacity={0.15}
              roughness={0.8}
              metalness={0.3}
            />
          </mesh>
        )}

        {/* ── "FINANCIAL CROWN" district label ── */}
        {goldCount >= 1 && (
          <Html position={[6.5, 0.1, -1.5]} center>
            <div
              style={{
                color: "#C9A84C",
                fontSize: 9,
                fontFamily: "DM Sans, sans-serif",
                fontWeight: 600,
                textTransform: "uppercase",
                letterSpacing: "0.1em",
                background: "rgba(0,0,0,0.3)",
                padding: "2px 6px",
                borderRadius: 4,
                whiteSpace: "nowrap",
                pointerEvents: "none",
              }}
            >
              Financial Crown
            </div>
          </Html>
        )}

        {/* ── Gold Towers (tiered: 5% → 1 tower … 35%+ → 7 towers) ── */}
        {goldTowerPositions.slice(0, goldCount).map(([gx, gz, hm], i) => (
          <group
            key={`gold-${i}`}
            {...hoverProps(
              "Gold Tower",
              `Investments: ${investPct}%`,
              investState,
              i === 0
                ? "Your landmark tower — keep investing to grow the Financial Crown!"
                : "Investment towers rise as you save and invest more.",
              [gx, 4, gz],
            )}
            {...buildingTapProps(
              "Gold Tower",
              "Invest",
              investState,
              "Keep investing to unlock more Gold Towers in the Financial Crown district.",
              [gx, 4, gz],
            )}
          >
            <GoldTower
              x={gx}
              z={gz}
              idx={i}
              heightMultiplier={hm}
              isNew={i === goldCount - 1}
            />
          </group>
        ))}
      </ScaleGroup>

      {/* ── Community buildings ── */}
      <group {...hoverProps("School", `Needs: ${needsPct}%`, needsState, "School appears when needs reach 40% — keep essentials covered.", [-7.0, 1.6, -2.2])} {...buildingTapProps("School", "Need", needsState, "Keep needs between 40-50% to support schools.", [-7.0, 1.6, -2.2])}>
        <School x={-7.0} z={-2.2} />
      </group>
      <group {...hoverProps("Hospital", `Investments: ${investPct}%`, investState, "Hospital unlocks at 15% investment — save for the future!", [-7.0, 1.6, 0.8])} {...buildingTapProps("Hospital", "Invest", investState, "Aim for 15%+ investment to unlock hospitals.", [-7.0, 1.6, 0.8])}>
        <Hospital x={-7.0} z={0.8} />
      </group>

      {/* ── Park features ── */}
      <group {...hoverProps("Fountain", `Health: ${healthPct}/100`, healthState, "A well-funded city keeps its fountain running all year.", [-2.1, 1.2, 2.9])} {...buildingTapProps("Fountain", "Invest", healthState, "Keep city health high to maintain amenities.", [-2.1, 1.2, 2.9])}>
        <Fountain x={-2.1} z={2.9} />
      </group>
      <group {...hoverProps("Fountain", `Health: ${healthPct}/100`, healthState, "A well-funded city keeps its fountain running all year.", [4.5, 1.2, -7.5])} {...buildingTapProps("Fountain", "Invest", healthState, "Keep city health high to maintain amenities.", [4.5, 1.2, -7.5])}>
        <Fountain x={4.5} z={-7.5} />
      </group>

      {/* ── Bridge ── */}
      <group {...hoverProps("Bridge", `Health: ${healthPct}/100`, healthState, "City bridges reflect overall financial health — keep the score high!", [-0.4, 1.2, 0.3])} {...buildingTapProps("Bridge", "Invest", healthState, "City health keeps infrastructure strong.", [-0.4, 1.2, 0.3])}>
        <Bridge />
      </group>

      {/* ── Trees (expanded throughout city) ── */}
      <group {...hoverProps("Trees", `Treats: ${treatsPct}%`, treatsState, "Cutting treats keeps the air clean and trees green.", [0, 2.2, -1.2])} {...buildingTapProps("Trees", "Treat", treatsState, "Keep treats low to keep trees green.", [0, 2.2, -1.2])}>
        {/* Central park */}
        <Tree x={-0.6} z={-3.0} scale={1.1} />
        <Tree x={-0.6} z={-1.5} scale={0.9} />
        <Tree x={0.7}  z={-2.3} scale={1.0} />
        {/* NW reserve */}
        <Tree x={-10.5} z={-7.5} scale={0.9} />
        <Tree x={-12.0} z={-7.0} scale={1.1} />
        <Tree x={-11.0} z={-9.0} scale={0.85} />
        <Tree x={-13.0} z={-8.5} scale={1.0} />
        {/* East gardens */}
        <Tree x={4.5}  z={-7.5} scale={1.0} />
        <Tree x={6.0}  z={-8.0} scale={0.9} />
        <Tree x={3.5}  z={-9.0} scale={1.1} />
        <Tree x={5.8}  z={-9.2} scale={0.85} />
        {/* South park */}
        <Tree x={-1.5} z={4.5}  scale={1.0} />
        <Tree x={0.5}  z={5.0}  scale={0.85} />
        <Tree x={-3.0} z={5.5}  scale={0.95} />
        <Tree x={1.5}  z={4.2}  scale={1.05} />
        <Tree x={-4.5} z={4.8}  scale={0.9} />
        {/* Street trees */}
        <Tree x={-5.8} z={-0.8} scale={0.85} />
        <Tree x={4.8}  z={-0.8} scale={0.95} />
        <Tree x={-13.5} z={-1.0} scale={1.0} />
        <Tree x={10.5} z={-1.0} scale={0.9} />
        <Tree x={-7.5} z={-5.8} scale={0.8} />
        <Tree x={7.0}  z={-5.8} scale={0.85} />
      </group>

      {/* ── Street lamps (full network) ── */}
      <group {...hoverProps("Street Lamps", `Needs: ${needsPct}%`, needsState, "Needs spending keeps the streets lit and safe.", [-0.6, 1.8, 0.6])} {...buildingTapProps("Street Lamps", "Need", needsState, "Keep needs between 40-50% for infrastructure.", [-0.6, 1.8, 0.6])}>
        {/* Main intersection */}
        <StreetLamp x={-0.6} z={0.6} />
        <StreetLamp x={2.5}  z={0.6} />
        <StreetLamp x={-3.5} z={0.6} />
        <StreetLamp x={-0.6} z={-0.9} />
        <StreetLamp x={2.5}  z={-0.9} />
        {/* West section */}
        <StreetLamp x={-8.0} z={0.6} />
        <StreetLamp x={-8.0} z={-0.9} />
        <StreetLamp x={-11.5} z={0.6} />
        <StreetLamp x={-11.5} z={-0.9} />
        {/* East section */}
        <StreetLamp x={7.5}  z={0.6} />
        <StreetLamp x={7.5}  z={-0.9} />
        <StreetLamp x={10.5} z={0.6} />
        {/* Secondary road lamps */}
        <StreetLamp x={-0.6} z={-5.8} />
        <StreetLamp x={-4.0} z={-5.8} />
        <StreetLamp x={4.0}  z={-5.8} />
        <StreetLamp x={-8.5} z={-5.8} />
        <StreetLamp x={7.5}  z={-5.8} />
        <StreetLamp x={-0.6} z={-10.5} />
        <StreetLamp x={-5.0} z={-10.5} />
        <StreetLamp x={-10.5} z={-10.5} />
        <StreetLamp x={0.6}  z={6.5} />
        <StreetLamp x={-5.0} z={6.5} />
        <StreetLamp x={-11.0} z={6.5} />
      </group>

      {/* ── Pollution clouds ── */}
      <ScaleGroup category="treat">
        <group {...hoverProps("Pollution", `Treats: ${treatsPct}%`, treatsState, "Reduce treats to clear the smog over your city.", [3.5, 5.5, 1])} {...buildingTapProps("Pollution", "Treat", treatsState, "Reduce treats to clear the smog.", [3.5, 5.5, 1])}>
          {Array.from({ length: cloudCount }, (_, i) => (
            <PollutionCloud
              key={i}
              x={1 + (i % 4) * 2.5}
              y={4 + (i % 3) * 0.5}
              z={3 - (i % 3) * 1.5}
              opacity={0.2 + treats * 0.55}
            />
          ))}
        </group>
      </ScaleGroup>

      {/* ── Traffic ── */}
      {Array.from({ length: carCount }, (_, i) => (
        <group key={`car-wrap-h-${i}`} {...hoverProps("Traffic", `Pop: ${cityState.population * 1000}K`, healthState, "More cars appear as your city's health score rises.", [0, 1.1, 0.3])}>
          <Car idx={i} lane="h" direction={i % 2 === 0 ? 1 : -1} />
        </group>
      ))}
      {Array.from({ length: Math.floor(carCount / 2) }, (_, i) => (
        <group key={`car-wrap-v-${i}`} {...hoverProps("Traffic", `Pop: ${cityState.population * 1000}K`, healthState, "More cars appear as your city's health score rises.", [-0.4, 1.1, 0])}>
          <Car idx={i + 10} lane="v" direction={i % 2 === 0 ? 1 : -1} />
        </group>
      ))}

      {/* ── Bunny rabbits (replacing pedestrians) ── */}
      {Array.from({ length: pedCount }, (_, i) => (
        <group key={`ped-wrap-${i}`} {...hoverProps("Residents", `Pop: ${cityState.population * 1000}K`, healthState, "A healthier city attracts more residents walking the streets.", [-1.8, 1.1, -0.6])}>
          <BunnyRabbit idx={i} />
        </group>
      ))}

      {/* ── Reward buildings (civic district, top-left) ── */}
      {rewardBuildings.map((building, idx) => {
        const slot = CIVIC_DISTRICT_POSITIONS[idx % CIVIC_DISTRICT_POSITIONS.length]!;
        const pos = building.position ?? { x: slot[0], z: slot[1] };
        return (
          <group
            key={building.id}
            position={[pos.x, 0, pos.z]}
            scale={1.2}
            onPointerDown={(e: any) => {
              e.stopPropagation();
              setBuildingPopup({
                position: e.point.clone().add(0, 1.5, 0),
                data: { type: "reward", building },
              });
            }}
          >
            <RewardBuildingByType type={building.type} />
          </group>
        );
      })}

      {/* Hover badge — only render when hoverInfo is not null */}
      {hoverInfo != null && (
        <Html position={hoverInfo.position} center distanceFactor={12}>
          <div className="rounded-xl border border-sky-300/25 bg-slate-950/90 px-3 py-2 text-center shadow-xl backdrop-blur-sm min-w-[120px]">
            <p className="text-[10px] font-bold uppercase tracking-wider text-sky-300">{hoverInfo.title}</p>
            <p className="text-sm font-semibold text-white leading-tight">{hoverInfo.stat}</p>
            <p className="mt-0.5 text-[10px] font-medium text-emerald-400">{hoverInfo.state}</p>
            <p className="mt-1 text-[9px] text-slate-400 leading-snug max-w-[140px]">{hoverInfo.tip}</p>
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