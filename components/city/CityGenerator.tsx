"use client";

import { useRef, useState, useEffect } from "react";
import { useFrame } from "@react-three/fiber";
import { Color } from "three";
import type { Group } from "three";

import type { DerivedCityFinance } from "@/lib/cityFinanceModel";
import type { CityMetrics } from "@/types";

interface CityGeneratorProps {
  metrics: CityMetrics;
  finance: DerivedCityFinance;
}

function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value));
}

function clamp01(value: number) {
  return Math.max(0, Math.min(1, value));
}

function blendColors(from: string, to: string, t: number) {
  return new Color(from).lerp(new Color(to), clamp01(t)).getStyle();
}

function seededRandom(seed: number) {
  const x = Math.sin(seed * 999.91) * 43758.5453123;
  return x - Math.floor(x);
}

// ─── Animated building that grows from zero ───────────────────────────────

interface AnimatedBuildingProps {
  position: [number, number, number];
  width: number;
  depth: number;
  targetHeight: number;
  color: string;
  metalness?: number;
  roughness?: number;
  delay?: number;
}

function AnimatedBuilding({
  position,
  width,
  depth,
  targetHeight,
  color,
  metalness = 0.1,
  roughness = 0.7,
  delay = 0,
}: AnimatedBuildingProps) {
  const ref = useRef<Group>(null);
  const startRef = useRef<number>(Date.now() + delay);
  const [started, setStarted] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setStarted(true), delay);
    return () => clearTimeout(timer);
  }, [delay]);

  useFrame(() => {
    if (!ref.current || !started) return;
    const elapsed = (Date.now() - startRef.current) / 1000;
    // Ease-out cubic
    const t = clamp01(elapsed / 1.2);
    const eased = 1 - Math.pow(1 - t, 3);
    const h = targetHeight * eased;
    ref.current.scale.set(1, h / (targetHeight || 1), 1);
    ref.current.position.y = 0;
  });

  return (
    <group ref={ref} position={position} scale={[1, 0, 1]}>
      <mesh position={[0, targetHeight / 2, 0]} castShadow receiveShadow>
        <boxGeometry args={[width, targetHeight, depth]} />
        <meshStandardMaterial
          color={color}
          metalness={metalness}
          roughness={roughness}
        />
      </mesh>
    </group>
  );
}

// ─── Needs Buildings: Schools, Hospitals, Utility ─────────────────────────

function NeedsBuilding({ x, z, index, health }: { x: number; z: number; index: number; health: number }) {
  const types = ["school", "hospital", "utility"] as const;
  const type = types[index % 3];
  const h = health;

  if (type === "school") {
    return (
      <group position={[x, 0, z]}>
        <AnimatedBuilding
          position={[0, 0, 0]}
          width={2.1} depth={1.3} targetHeight={0.5}
          color={blendColors("#f87171", "#ef4444", h)}
          delay={index * 80}
        />
        <mesh position={[0, 0.6, 0]} castShadow>
          <boxGeometry args={[1.6, 0.06, 0.9]} />
          <meshStandardMaterial color="#fbf5f3" />
        </mesh>
        <mesh position={[0, 0.8, 0]} castShadow>
          <boxGeometry args={[1.1, 0.65, 0.65]} />
          <meshStandardMaterial color="#fde68a" roughness={0.6} />
        </mesh>
        <mesh position={[0, 1.12, 0]}>
          <coneGeometry args={[0.22, 0.65, 6]} />
          <meshStandardMaterial color="#f97316" />
        </mesh>
        {/* Flag */}
        <mesh position={[0.65, 1.5, 0]}>
          <cylinderGeometry args={[0.015, 0.015, 0.8, 6]} />
          <meshStandardMaterial color="#888" />
        </mesh>
        <mesh position={[0.8, 1.85, 0]}>
          <boxGeometry args={[0.28, 0.18, 0.02]} />
          <meshStandardMaterial color={blendColors("#22c55e", "#16a34a", h)} />
        </mesh>
        {/* Sign */}
        <mesh position={[0, 0.22, 0.66]}>
          <boxGeometry args={[0.6, 0.15, 0.02]} />
          <meshStandardMaterial color="#ffffff" />
        </mesh>
      </group>
    );
  }

  if (type === "hospital") {
    return (
      <group position={[x, 0, z]}>
        <AnimatedBuilding
          position={[0, 0, 0]}
          width={2.2} depth={1.6} targetHeight={0.55}
          color={blendColors("#e0f2fe", "#bae6fd", h)}
          delay={index * 80}
        />
        <mesh position={[0, 0.65, 0]} castShadow>
          <boxGeometry args={[1.6, 1.1, 1.2]} />
          <meshStandardMaterial color={blendColors("#f0f9ff", "#e0f2fe", h)} roughness={0.5} />
        </mesh>
        {/* Red cross */}
        <mesh position={[0, 1.1, 0.62]}>
          <boxGeometry args={[0.45, 0.1, 0.02]} />
          <meshStandardMaterial color="#ef4444" emissive="#ef4444" emissiveIntensity={0.4} />
        </mesh>
        <mesh position={[0, 1.1, 0.62]}>
          <boxGeometry args={[0.1, 0.45, 0.02]} />
          <meshStandardMaterial color="#ef4444" emissive="#ef4444" emissiveIntensity={0.4} />
        </mesh>
        {/* Ambulance bay */}
        <mesh position={[0, 0.18, 0.9]}>
          <boxGeometry args={[0.6, 0.36, 0.1]} />
          <meshStandardMaterial color="#94a3b8" />
        </mesh>
      </group>
    );
  }

  // Utility/infrastructure tower
  return (
    <group position={[x, 0, z]}>
      <mesh position={[0, 0.5, 0]} castShadow>
        <cylinderGeometry args={[0.5, 0.65, 1, 8]} />
        <meshStandardMaterial color={blendColors("#94a3b8", "#64748b", 1 - h)} roughness={0.5} metalness={0.3} />
      </mesh>
      <mesh position={[0, 1.2, 0]}>
        <cylinderGeometry args={[0.22, 0.22, 0.8, 8]} />
        <meshStandardMaterial color="#475569" metalness={0.6} />
      </mesh>
      {/* Antenna */}
      <mesh position={[0, 1.7, 0]}>
        <cylinderGeometry args={[0.04, 0.04, 0.6, 6]} />
        <meshStandardMaterial color="#cbd5e1" metalness={0.9} />
      </mesh>
      {/* Blinking light */}
      <mesh position={[0, 2.05, 0]}>
        <sphereGeometry args={[0.04, 6, 6]} />
        <meshStandardMaterial color="#ef4444" emissive="#ef4444" emissiveIntensity={1.5} />
      </mesh>
    </group>
  );
}

// ─── Want Buildings: Entertainment, Malls, Clubs ──────────────────────────

function WantBuilding({ x, z, index, intensity, neon }: {
  x: number; z: number; index: number; intensity: number; neon: number;
}) {
  const types = ["mall", "cinema", "arcade", "club"] as const;
  const type = types[index % 4];
  const ref = useRef<Group>(null);

  useFrame(({ clock }) => {
    if (!ref.current) return;
    // Neon buildings pulse
    if (neon > 0.3) {
      const pulse = 0.5 + Math.sin(clock.getElapsedTime() * 2 + index) * 0.5;
      ref.current.children.forEach((child: any) => {
        if (child.material?.emissiveIntensity !== undefined) {
          child.material.emissiveIntensity = 0.3 + pulse * neon * 0.6;
        }
      });
    }
  });

  const neonColor = ["#ff2d6b", "#7c3aed", "#0ea5e9", "#f97316"][index % 4];
  const bodyColor = blendColors("#1e1b2e", "#2d1b4e", intensity);

  return (
    <group ref={ref} position={[x, 0, z]}>
      <AnimatedBuilding
        position={[0, 0, 0]}
        width={2.3} depth={1.8} targetHeight={0.45}
        color="#374151" delay={index * 60}
      />
      <mesh position={[0, 0.7, 0]} castShadow>
        <boxGeometry args={[2, 1.5, 1.6]} />
        <meshStandardMaterial color={bodyColor} roughness={0.2} metalness={0.5} />
      </mesh>
      {/* Neon sign strip */}
      <mesh position={[0, 1.35, 0.82]}>
        <boxGeometry args={[1.8, 0.12, 0.04]} />
        <meshStandardMaterial
          color={neonColor}
          emissive={neonColor}
          emissiveIntensity={0.8 + intensity * 0.6}
        />
      </mesh>
      {/* Canopy */}
      <mesh position={[0, 0.58, 0.88]}>
        <boxGeometry args={[1.8, 0.08, 0.4]} />
        <meshStandardMaterial
          color={neonColor}
          transparent opacity={0.8}
          emissive={neonColor}
          emissiveIntensity={0.3}
        />
      </mesh>
      {/* Windows with neon */}
      {[-0.5, 0.5].map((wx) => (
        <mesh key={wx} position={[wx, 0.9, 0.82]}>
          <boxGeometry args={[0.45, 0.55, 0.02]} />
          <meshStandardMaterial
            color={blendColors("#b6e0ff", neonColor, intensity * 0.5)}
            emissive={neonColor}
            emissiveIntensity={0.3 + intensity * 0.4}
            transparent opacity={0.85}
          />
        </mesh>
      ))}
    </group>
  );
}

// ─── Investment Buildings: Banks, Offices, Skyscrapers ────────────────────

function InvestBuilding({ x, z, index, wealth, height }: {
  x: number; z: number; index: number; wealth: number; height: number;
}) {
  const glassColors = ["#7dd3fc", "#38bdf8", "#22d3ee", "#0ea5e9", "#6ee7b7"];
  const glassColor = glassColors[index % glassColors.length];

  return (
    <group position={[x, 0, z]}>
      {/* Podium */}
      <AnimatedBuilding
        position={[0, 0, 0]}
        width={2} depth={2} targetHeight={0.6}
        color={blendColors("#f8fafc", "#e2e8f0", wealth)}
        metalness={0.2} roughness={0.4}
        delay={index * 100}
      />
      {/* Tower */}
      <AnimatedBuilding
        position={[0, 0.6, 0]}
        width={1.4} depth={1.4} targetHeight={height}
        color={blendColors(glassColor, "#fde68a", wealth * 0.5)}
        metalness={0.4 + wealth * 0.3} roughness={0.15}
        delay={index * 100 + 300}
      />
      {/* Roof spire */}
      <mesh position={[0, 0.6 + height + 0.3, 0]}>
        <coneGeometry args={[0.12, 0.8, 6]} />
        <meshStandardMaterial
          color={blendColors("#e2e8f0", "#fbbf24", wealth)}
          metalness={0.9} roughness={0.1}
        />
      </mesh>
      {/* Logo beacon */}
      <mesh position={[0, 0.6 + height + 0.72, 0]}>
        <sphereGeometry args={[0.06, 8, 8]} />
        <meshStandardMaterial
          color="#fbbf24"
          emissive="#fbbf24"
          emissiveIntensity={1.5}
        />
      </mesh>
    </group>
  );
}

// ─── Treat Buildings: Parks, Gyms, Community Gardens ─────────────────────

function TreatBuilding({ x, z, index, resilience }: {
  x: number; z: number; index: number; resilience: number;
}) {
  const ref = useRef<Group>(null);

  useFrame(({ clock }) => {
    if (!ref.current) return;
    // Gently sway trees
    const t = clock.getElapsedTime();
    ref.current.children.forEach((child: any, i: number) => {
      if (child.geometry?.type?.includes("Cone")) {
        child.rotation.z = Math.sin(t * 0.6 + i * 0.8) * 0.03;
      }
    });
  });

  const types = ["park", "gym", "garden", "sports"] as const;
  const type = types[index % 4];
  const grassColor = blendColors("#4fba62", "#16a34a", resilience);
  const treeColor = blendColors("#22c55e", "#166534", resilience);

  if (type === "park") {
    return (
      <group ref={ref} position={[x, 0, z]}>
        <mesh position={[0, 0.04, 0]} receiveShadow>
          <boxGeometry args={[2.4, 0.08, 2.4]} />
          <meshStandardMaterial color={grassColor} roughness={0.95} />
        </mesh>
        {/* Path */}
        <mesh position={[0, 0.05, 0]} receiveShadow>
          <boxGeometry args={[2, 0.02, 0.2]} />
          <meshStandardMaterial color="#f5efe6" roughness={0.9} />
        </mesh>
        {/* Trees */}
        {[[-0.6, -0.6], [0.6, -0.6], [-0.6, 0.6], [0.6, 0.6]].map(([tx, tz], i) => (
          <group key={i} position={[tx, 0, tz]}>
            <mesh position={[0, 0.2, 0]}>
              <cylinderGeometry args={[0.04, 0.06, 0.4, 6]} />
              <meshStandardMaterial color="#6b4e2c" roughness={0.9} />
            </mesh>
            <mesh position={[0, 0.55, 0]}>
              <coneGeometry args={[0.22, 0.5, 7]} />
              <meshStandardMaterial color={treeColor} roughness={0.8} />
            </mesh>
            <mesh position={[0, 0.78, 0]}>
              <coneGeometry args={[0.15, 0.4, 7]} />
              <meshStandardMaterial color={blendColors(treeColor, "#4ade80", 0.3)} roughness={0.8} />
            </mesh>
          </group>
        ))}
        {/* Bench */}
        <mesh position={[0, 0.12, 0.7]}>
          <boxGeometry args={[0.4, 0.06, 0.14]} />
          <meshStandardMaterial color="#92400e" roughness={0.8} />
        </mesh>
        {/* Fountain */}
        <mesh position={[0, 0.1, 0]}>
          <cylinderGeometry args={[0.18, 0.22, 0.12, 12]} />
          <meshStandardMaterial color="#94a3b8" roughness={0.3} metalness={0.4} />
        </mesh>
      </group>
    );
  }

  if (type === "gym") {
    return (
      <group ref={ref} position={[x, 0, z]}>
        <AnimatedBuilding
          position={[0, 0, 0]}
          width={2.2} depth={1.5} targetHeight={0.6}
          color={blendColors("#5eead4", "#0ea5e9", resilience)}
          metalness={0.3} roughness={0.4}
          delay={index * 80}
        />
        <mesh position={[0, 0.7, 0]} castShadow>
          <boxGeometry args={[1.8, 0.6, 1.2]} />
          <meshStandardMaterial color={blendColors("#e0f2fe", "#7dd3fc", resilience)} roughness={0.3} />
        </mesh>
        {/* Glass roof */}
        <mesh position={[0, 1.08, 0]}>
          <boxGeometry args={[1.8, 0.06, 1.2]} />
          <meshStandardMaterial color="#7dd3fc" transparent opacity={0.5} metalness={0.3} />
        </mesh>
        {/* Dumbbell sign */}
        <mesh position={[0, 0.9, 0.62]}>
          <boxGeometry args={[0.5, 0.12, 0.02]} />
          <meshStandardMaterial color="#0ea5e9" emissive="#0ea5e9" emissiveIntensity={0.5} />
        </mesh>
      </group>
    );
  }

  if (type === "garden") {
    return (
      <group ref={ref} position={[x, 0, z]}>
        <mesh position={[0, 0.04, 0]} receiveShadow>
          <boxGeometry args={[2.3, 0.08, 2.3]} />
          <meshStandardMaterial color={grassColor} roughness={0.95} />
        </mesh>
        {/* Raised garden beds */}
        {[[-0.5, 0], [0.5, 0], [0, -0.5], [0, 0.5]].map(([bx, bz], i) => (
          <group key={i} position={[bx, 0, bz]}>
            <mesh position={[0, 0.1, 0]}>
              <boxGeometry args={[0.5, 0.2, 0.35]} />
              <meshStandardMaterial color="#92400e" roughness={0.9} />
            </mesh>
            <mesh position={[0, 0.22, 0]}>
              <boxGeometry args={[0.45, 0.04, 0.3]} />
              <meshStandardMaterial color="#4ade80" roughness={0.8} />
            </mesh>
          </group>
        ))}
        {/* Greenhouse */}
        <mesh position={[0, 0.28, 0]}>
          <boxGeometry args={[0.6, 0.4, 0.4]} />
          <meshStandardMaterial color="#a7f3d0" transparent opacity={0.5} roughness={0.1} />
        </mesh>
      </group>
    );
  }

  // Sports court
  return (
    <group ref={ref} position={[x, 0, z]}>
      <mesh position={[0, 0.04, 0]} receiveShadow>
        <boxGeometry args={[2.4, 0.08, 2.4]} />
        <meshStandardMaterial color={blendColors("#fb923c", "#f97316", resilience)} roughness={0.7} />
      </mesh>
      {/* Court lines */}
      <mesh position={[0, 0.06, 0]}>
        <boxGeometry args={[1.8, 0.02, 0.04]} />
        <meshStandardMaterial color="#ffffff" />
      </mesh>
      <mesh position={[0, 0.06, 0]}>
        <boxGeometry args={[0.04, 0.02, 1.8]} />
        <meshStandardMaterial color="#ffffff" />
      </mesh>
      {/* Hoops */}
      {[-0.75, 0.75].map((px) => (
        <group key={px} position={[px, 0, 0]}>
          <mesh position={[0, 0.6, 0]}>
            <cylinderGeometry args={[0.025, 0.025, 1.2, 6]} />
            <meshStandardMaterial color="#94a3b8" metalness={0.6} />
          </mesh>
          <mesh position={[0, 1.2, 0]} rotation={[Math.PI / 2, 0, 0]}>
            <torusGeometry args={[0.14, 0.015, 6, 16]} />
            <meshStandardMaterial color="#f97316" metalness={0.5} />
          </mesh>
        </group>
      ))}
    </group>
  );
}

// ─── The Wise Financial Advisor NPC ──────────────────────────────────────

function FinancialAdvisorNPC({ finance }: { finance: DerivedCityFinance }) {
  const ref = useRef<Group>(null);
  const timeRef = useRef(0);

  useFrame((_, delta) => {
    if (!ref.current) return;
    timeRef.current += delta;
    // Gentle idle bob
    ref.current.position.y = 0.05 + Math.sin(timeRef.current * 1.2) * 0.04;
    ref.current.rotation.y = Math.sin(timeRef.current * 0.4) * 0.3;
  });

  // Colour-coded suit based on financial health
  const suitColor = finance.instabilityRisk > 0.5
    ? "#ef4444"  // Red if city unstable
    : finance.prosperityGlow > 0.6
      ? "#22c55e" // Green if thriving
      : "#3b82f6"; // Blue otherwise

  return (
    <group ref={ref} position={[3.5, 0.05, 3.5]}>
      {/* Body */}
      <mesh position={[0, 0.22, 0]} castShadow>
        <capsuleGeometry args={[0.07, 0.22, 4, 8]} />
        <meshStandardMaterial color={suitColor} roughness={0.6} />
      </mesh>
      {/* Head */}
      <mesh position={[0, 0.5, 0]} castShadow>
        <sphereGeometry args={[0.075, 10, 10]} />
        <meshStandardMaterial color="#f5cba7" roughness={0.8} />
      </mesh>
      {/* Hat */}
      <mesh position={[0, 0.58, 0]}>
        <cylinderGeometry args={[0.06, 0.08, 0.06, 10]} />
        <meshStandardMaterial color="#1e293b" />
      </mesh>
      <mesh position={[0, 0.62, 0]}>
        <cylinderGeometry args={[0.05, 0.05, 0.1, 10]} />
        <meshStandardMaterial color="#1e293b" />
      </mesh>
      {/* Briefcase */}
      <mesh position={[0.1, 0.15, 0.06]}>
        <boxGeometry args={[0.1, 0.07, 0.05]} />
        <meshStandardMaterial color="#92400e" roughness={0.5} metalness={0.2} />
      </mesh>
    </group>
  );
}

// ─── Main generator ────────────────────────────────────────────────────────

type BlockDistrict = "cbd" | "mixed" | "residential" | "park" | "plaza" | "school" |
  "needs" | "wants" | "invest" | "treat";

interface Block {
  x: number;
  z: number;
  district: BlockDistrict;
  heightFactor: number;
  width: number;
  depth: number;
  index: number;
}

function createCityBlocks(metrics: CityMetrics, finance: DerivedCityFinance): Block[] {
  const blocks: Block[] = [];
  const spacing = 3.8;
  const gridSize = Math.round(2 + (finance.developmentLevel / 5) * 0.8);

  const needsScore = finance.needs;
  const wantsScore = finance.wants;
  const investScore = finance.investments;
  const treatsScore = finance.assets;

  for (let gx = -gridSize; gx <= gridSize; gx++) {
    for (let gz = -gridSize; gz <= gridSize; gz++) {
      const x = gx * spacing;
      const z = gz * spacing;
      const distance = Math.sqrt(gx * gx + gz * gz);
      const seed = gx * 100 + gz * 17 + 99;
      const noise = seededRandom(seed);

      // Skip edge blocks unless city is large
      if (distance > gridSize + 0.5) continue;

      // Category-driven building placement based on spending
      // Radial districts: inner = invest, mid = mixed needs/wants, outer = treats/parks
      if (distance <= 1.4 && investScore > 0.1) {
        blocks.push({
          x, z,
          district: "invest",
          heightFactor: 0.5 + investScore * 0.5 + noise * 0.1,
          width: 1.8, depth: 1.8,
          index: blocks.length,
        });
        continue;
      }

      if (distance <= 2.8) {
        // Mid-ring: needs vs wants battle
        const roll = noise;
        if (roll < needsScore * 0.5 && needsScore > 0.1) {
          blocks.push({ x, z, district: "needs", heightFactor: 0.4, width: 2.1, depth: 2.1, index: blocks.length });
          continue;
        }
        if (roll > 0.5 && wantsScore > 0.15) {
          blocks.push({ x, z, district: "wants", heightFactor: 0.3, width: 2.0, depth: 2.0, index: blocks.length });
          continue;
        }
      }

      // Outer ring: treats / parks when spending is good
      if (distance > 2.4 && treatsScore > 0.05) {
        if (noise < treatsScore * 0.7) {
          blocks.push({ x, z, district: "treat", heightFactor: 0, width: 2.3, depth: 2.3, index: blocks.length });
          continue;
        }
        if (noise > 0.7 && noise < 0.7 + treatsScore * 0.2) {
          blocks.push({ x, z, district: "park", heightFactor: 0, width: 2.1, depth: 2.1, index: blocks.length });
          continue;
        }
      }

      // Fallback: generic residential / CBD
      if (noise < 0.12) continue; // gap

      let district: BlockDistrict = "residential";
      if (distance <= 1.6) district = "cbd";
      else if (distance <= 3.2) district = "mixed";

      const growthBias = clamp(metrics.growth / 100, 0, 1);
      const centerBoost = clamp(1 - distance / 6, 0, 1);
      const heightFactor =
        district === "cbd"
          ? 0.52 + centerBoost * 0.38 + growthBias * 0.28 + noise * 0.12
          : district === "mixed"
            ? 0.34 + centerBoost * 0.22 + growthBias * 0.18 + noise * 0.12
            : 0.2 + growthBias * 0.12 + noise * 0.1;

      blocks.push({
        x, z, district, heightFactor,
        width: 1.65 + noise * 0.28,
        depth: 1.65 + seededRandom(seed + 33) * 0.28,
        index: blocks.length,
      });
    }
  }

  return blocks;
}

// ─── Generic building facade helpers ──────────────────────────────────────

function getFacadeColor(index: number) {
  const palette = ["#5b0b0b", "#2b1a5a", "#102a43", "#4a0e1f", "#1f2937", "#3f1d0d"];
  return palette[index % palette.length];
}

function getGlassColor(index: number) {
  const palette = ["#0f2d4a", "#12324f", "#0b2239", "#1c3b5a"];
  return palette[index % palette.length];
}

function getRoofColor(index: number) {
  const palette = ["#4b0d0d", "#5b2a0a", "#2a3340"];
  return palette[index % palette.length];
}

// ─── Export ────────────────────────────────────────────────────────────────

export function CityGenerator({ metrics, finance }: CityGeneratorProps) {
  const blocks = createCityBlocks(metrics, finance);

  const growth = clamp(metrics.growth / 100, 0, 1);
  const housing = clamp(metrics.housing / 100, 0, 1);

  const maxTowerHeight = 7 + growth * 5;
  const mixedHeight = 3.5 + housing * 2.2;
  const residentialHeight = 1.8 + housing * 1.5;

  // Road / ground colors
  const roadTone = clamp01(finance.infrastructureHealth * 0.75 + finance.prosperityGlow * 0.25);
  const roadStress = clamp01(finance.pollutionLevel * 0.65 + finance.instabilityRisk * 0.35);
  const streetColor = blendColors(
    blendColors("#161b22", "#243447", roadTone), "#111827", roadStress
  );
  const laneColor = blendColors("#6b7280", "#9ca3af", finance.infrastructureHealth);
  const sidewalkColor = blendColors("#3a3a40", "#52525b", finance.infrastructureHealth);
  const groundColor = blendColors(
    blendColors("#1f7a3f", "#14532d", finance.resilience), "#2f5d36", finance.pollutionLevel
  );
  const platformColor = blendColors(
    blendColors("#274b31", "#355f3b", finance.prosperityGlow), "#23362a", finance.pollutionLevel
  );

  const roadSpan = 29;
  const blockSpacing = 3.2;
  const neonOverload = clamp01(finance.lifestyleIntensity * finance.instabilityRisk);
  const windowGlow = 0.14 + finance.lifestyleIntensity * 0.28 + neonOverload * 0.3;
  const skylineRefinement = clamp01(finance.resilience * 0.6 + finance.prosperityGlow * 0.4);
  const flashyFactor = clamp01(finance.lifestyleIntensity * 0.6 + neonOverload * 0.4);

  return (
    <group>
      {/* Ground */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[42, 42]} />
        <meshStandardMaterial color={groundColor} roughness={0.95} metalness={0.02} />
      </mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.01, 0]} receiveShadow>
        <planeGeometry args={[32, 32]} />
        <meshStandardMaterial color={platformColor} roughness={0.9} metalness={0.02} />
      </mesh>

      {/* Roads */}
      {Array.from({ length: 9 }, (_, i) => {
        const offset = (i - 4) * blockSpacing;
        return (
          <group key={`road-h-${i}`}>
            <mesh position={[0, 0.02, offset]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
              <planeGeometry args={[roadSpan, 0.8]} />
              <meshStandardMaterial color={streetColor} roughness={0.65 + roadStress * 0.3} />
            </mesh>
            {/* Lane markings more detailed for high infra */}
            {Array.from({ length: 10 }, (_, j) => (
              <mesh
                key={j}
                position={[-14.4 + j * blockSpacing, 0.025, offset]}
                rotation={[-Math.PI / 2, 0, 0]}
              >
                <planeGeometry args={[0.9, 0.04]} />
                <meshStandardMaterial color={laneColor} />
              </mesh>
            ))}
          </group>
        );
      })}
      {Array.from({ length: 9 }, (_, i) => {
        const offset = (i - 4) * blockSpacing;
        return (
          <group key={`road-v-${i}`}>
            <mesh position={[offset, 0.021, 0]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
              <planeGeometry args={[0.8, roadSpan]} />
              <meshStandardMaterial color={streetColor} roughness={0.65 + roadStress * 0.3} />
            </mesh>
            {Array.from({ length: 10 }, (_, j) => (
              <mesh
                key={j}
                position={[offset, 0.026, -14.4 + j * blockSpacing]}
                rotation={[-Math.PI / 2, 0, 0]}
              >
                <planeGeometry args={[0.04, 0.9]} />
                <meshStandardMaterial color={laneColor} />
              </mesh>
            ))}
          </group>
        );
      })}

      {/* Category-specific and generic buildings */}
      {blocks.map((block) => {
        if (block.district === "needs") {
          return (
            <NeedsBuilding
              key={`needs-${block.index}`}
              x={block.x} z={block.z}
              index={block.index}
              health={finance.infrastructureHealth}
            />
          );
        }

        if (block.district === "wants") {
          return (
            <WantBuilding
              key={`wants-${block.index}`}
              x={block.x} z={block.z}
              index={block.index}
              intensity={finance.lifestyleIntensity}
              neon={neonOverload}
            />
          );
        }

        if (block.district === "invest") {
          const invHeight = 3.5 + finance.investments * 8 * finance.heightMultiplier;
          return (
            <InvestBuilding
              key={`invest-${block.index}`}
              x={block.x} z={block.z}
              index={block.index}
              wealth={finance.wealthStrength}
              height={invHeight}
            />
          );
        }

        if (block.district === "treat") {
          return (
            <TreatBuilding
              key={`treat-${block.index}`}
              x={block.x} z={block.z}
              index={block.index}
              resilience={finance.resilience}
            />
          );
        }

        if (block.district === "park") {
          return (
            <group key={`park-${block.index}`} position={[block.x, 0, block.z]}>
              <mesh position={[0, 0.035, 0]} receiveShadow>
                <boxGeometry args={[2.05, 0.07, 2.05]} />
                <meshStandardMaterial
                  color={blendColors("#4fba62", "#3a8f4a", finance.resilience)}
                  roughness={0.9}
                />
              </mesh>
              <mesh position={[0, 0.04, 0]}>
                <boxGeometry args={[1.7, 0.02, 0.18]} />
                <meshStandardMaterial color={blendColors("#f5efe6", "#c9c1b3", 1 - finance.infrastructureHealth)} />
              </mesh>
              <mesh position={[0, 0.041, 0]}>
                <boxGeometry args={[0.18, 0.02, 1.7]} />
                <meshStandardMaterial color={blendColors("#f5efe6", "#c9c1b3", 1 - finance.infrastructureHealth)} />
              </mesh>
            </group>
          );
        }

        // Generic buildings (cbd / mixed / residential)
        const baseHeight =
          block.district === "cbd"
            ? maxTowerHeight * block.heightFactor
            : block.district === "mixed"
              ? mixedHeight * block.heightFactor * 1.55
              : residentialHeight * block.heightFactor * 1.8;

        const podiumHeight =
          block.district === "cbd"
            ? 0.45 + seededRandom(block.index) * 0.35
            : 0.2 + seededRandom(block.index) * 0.2;

        const towerHeight =
          block.district === "cbd"
            ? Math.max(2.6, baseHeight)
            : block.district === "mixed"
              ? Math.max(1.5, baseHeight)
              : Math.max(0.9, baseHeight * 0.9);

        const adjPodium = podiumHeight * finance.heightMultiplier;
        const adjTower = towerHeight * finance.heightMultiplier;
        const bw = block.width * 0.85;
        const bd = block.depth * 0.85;

        const facadeColor = getFacadeColor(block.index);
        const glassColor = getGlassColor(block.index);
        const roofColor = getRoofColor(block.index);

        const facadeTint = blendColors(
          facadeColor,
          blendColors("#7f1d1d", "#1e3a8a", flashyFactor),
          0.2 + flashyFactor * 0.4
        );
        const towerColor =
          block.district === "residential"
            ? blendColors(facadeTint, "#334155", finance.infrastructureHealth * 0.35)
            : blendColors(glassColor, "#1e3a8a", finance.prosperityGlow * 0.35);
        const roofAccent = blendColors(
          blendColors(roofColor, "#7f1d1d", finance.wealthStrength),
          "#334155",
          0.2 + finance.prosperityGlow * 0.35
        );
        const rooftopGarden = seededRandom(block.index * 77) < 0.2 + finance.resilience * 0.45;

        return (
          <group key={`block-${block.index}`} position={[block.x, 0, block.z]}>
            <mesh position={[0, 0.03, 0]} receiveShadow>
              <boxGeometry args={[2.08, 0.06, 2.08]} />
              <meshStandardMaterial color={sidewalkColor} />
            </mesh>
            <mesh position={[0, adjPodium / 2 + 0.06, 0]} castShadow receiveShadow>
              <boxGeometry args={[bw, adjPodium, bd]} />
              <meshStandardMaterial
                color={facadeTint}
                roughness={0.78 - finance.infrastructureHealth * 0.2 + finance.pollutionLevel * 0.15}
                metalness={0.06 + finance.wealthStrength * 0.18}
              />
            </mesh>
            <mesh position={[0, adjPodium + adjTower / 2 + 0.06, 0]} castShadow receiveShadow>
              <boxGeometry args={[bw * 0.94, adjTower, bd * 0.94]} />
              <meshStandardMaterial
                color={towerColor}
                roughness={0.2 + (1 - skylineRefinement) * 0.25}
                metalness={0.25 + skylineRefinement * 0.25}
              />
            </mesh>
            <mesh position={[0, adjPodium + adjTower + 0.08, 0]} castShadow>
              <boxGeometry args={[bw * 0.55, 0.06, bd * 0.55]} />
              <meshStandardMaterial
                color={roofAccent}
                roughness={0.35 - finance.prosperityGlow * 0.15}
                metalness={0.3 + finance.wealthStrength * 0.25}
              />
            </mesh>
            {rooftopGarden && (
              <mesh position={[0, adjPodium + adjTower + 0.12, 0]}>
                <boxGeometry args={[bw * 0.38, 0.04, bd * 0.38]} />
                <meshStandardMaterial
                  color={blendColors("#80ed99", "#1f8a5b", finance.resilience)}
                  roughness={0.4}
                />
              </mesh>
            )}
            {/* Windows */}
            {Array.from({ length: 3 }, (_, row) =>
              Array.from({ length: 3 }, (_, col) => {
                const wy = 0.28 + row * 0.38;
                const ho = (col - 1) * 0.36;
                return (
                  [
                    { axis: "z" as const, dir: 1 },
                    { axis: "z" as const, dir: -1 },
                    { axis: "x" as const, dir: 1 },
                    { axis: "x" as const, dir: -1 },
                  ] as const
                ).map((face) => {
                  const wd = face.axis === "z" ? bd / 2 - 0.01 : bw / 2 - 0.01;
                  const pos = face.axis === "z"
                    ? [ho, adjPodium + wy, face.dir * wd]
                    : [face.dir * wd, adjPodium + wy, ho];
                  const rot = face.axis === "x" ? [0, Math.PI / 2, 0] : [0, 0, 0];
                  return (
                    <mesh
                      key={`w-${block.index}-${row}-${col}-${face.axis}-${face.dir}`}
                      position={pos as [number, number, number]}
                      rotation={rot as [number, number, number]}
                    >
                      <boxGeometry args={[0.22, 0.18, 0.02]} />
                      <meshStandardMaterial
                        color={blendColors("#60a5fa", "#93c5fd", finance.lifestyleIntensity)}
                        emissive={blendColors("#1d4ed8", "#7f1d1d", neonOverload)}
                        emissiveIntensity={windowGlow}
                        metalness={0.25}
                        roughness={0.3}
                      />
                    </mesh>
                  );
                });
              })
            )}
          </group>
        );
      })}

      {/* Landmark towers */}
      {[
        { x: -3.2, z: 0, h: 5.8, w: 1.2, d: 1.2, color: "#7bdff2" },
        { x: 3.2, z: -3.2, h: 5.2, w: 1.05, d: 1.05, color: "#bdb2ff" },
        { x: 0, z: 3.2, h: 4.8, w: 1.15, d: 1.15, color: "#caffbf" },
      ].map((tower, i) => (
        <group key={`landmark-${i}`} position={[tower.x, 0, tower.z]}>
          <mesh position={[0, 0.38, 0]} castShadow receiveShadow>
            <boxGeometry args={[1.45, 0.76, 1.45]} />
            <meshStandardMaterial
              color={blendColors("#334155", "#475569", finance.wealthStrength)}
              roughness={0.65}
              metalness={0.12 + finance.wealthStrength * 0.2}
            />
          </mesh>
          <mesh
            position={[0, 0.76 + (tower.h * finance.heightMultiplier) / 2, 0]}
            castShadow receiveShadow
          >
            <boxGeometry args={[tower.w, tower.h * finance.heightMultiplier, tower.d]} />
            <meshStandardMaterial
              color={blendColors(tower.color, "#1e3a8a", finance.wealthStrength)}
              metalness={0.25 + finance.wealthStrength * 0.35}
              roughness={0.2 + (1 - finance.wealthStrength) * 0.2}
            />
          </mesh>
        </group>
      ))}

      {/* Financial Advisor NPC */}
      <FinancialAdvisorNPC finance={finance} />
    </group>
  );
}
