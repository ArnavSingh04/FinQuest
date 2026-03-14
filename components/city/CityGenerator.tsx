"use client";

import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { Color } from "three";
import type { Group } from "three";

import type { DerivedCityFinance } from "@/lib/cityFinanceModel";
import type { CityMetrics } from "@/types";

function clamp(v: number, min: number, max: number) { return Math.max(min, Math.min(max, v)); }
function clamp01(v: number) { return Math.max(0, Math.min(1, v)); }
function blendColors(from: string, to: string, t: number) { return new Color(from).lerp(new Color(to), clamp01(t)).getStyle(); }
function seededRandom(seed: number) { const x = Math.sin(seed * 999.91) * 43758.5453123; return x - Math.floor(x); }

// ─── Animated building (grows from ground) ────────────────────────────────────

function AnimatedBuilding({ position, w, d, h, color, metalness = 0.1, roughness = 0.7, delay = 0 }: {
  position: [number, number, number]; w: number; d: number; h: number;
  color: string; metalness?: number; roughness?: number; delay?: number;
}) {
  const ref = useRef<Group>(null);
  const t0 = useRef(Date.now() + delay);
  const ready = useRef(false);
  useFrame(() => {
    if (!ref.current) return;
    if (!ready.current) { if (Date.now() >= t0.current) ready.current = true; else return; }
    const elapsed = (Date.now() - t0.current) / 1000;
    const t = clamp01(elapsed / 1.1);
    const eased = 1 - Math.pow(1 - t, 3);
    ref.current.scale.y = eased;
  });
  return (
    <group ref={ref} position={position} scale={[1, 0.001, 1]}>
      <mesh position={[0, h / 2, 0]} castShadow receiveShadow>
        <boxGeometry args={[w, h, d]} />
        <meshStandardMaterial color={color} metalness={metalness} roughness={roughness} />
      </mesh>
    </group>
  );
}

// ─── Investment tower (INVEST = TALLEST towers, max visual reward) ─────────────

function InvestTower({ x, z, idx, wealth, height }: { x: number; z: number; idx: number; wealth: number; height: number }) {
  const glassColors = ["#38bdf8","#7dd3fc","#22d3ee","#0ea5e9","#6ee7b7","#a78bfa"];
  const gc = glassColors[idx % glassColors.length];
  const h = Math.max(2.5, height);

  return (
    <group position={[x, 0, z]}>
      {/* Plaza base */}
      <mesh position={[0, 0.06, 0]} receiveShadow>
        <boxGeometry args={[2.3, 0.12, 2.3]} />
        <meshStandardMaterial color={blendColors("#e2e8f0","#f1f5f9", wealth)} roughness={0.4} metalness={0.15} />
      </mesh>
      {/* Podium */}
      <AnimatedBuilding position={[0, 0.12, 0]} w={2.0} d={2.0} h={0.7}
        color={blendColors("#f8fafc","#e2e8f0", wealth)} metalness={0.25} roughness={0.35} delay={idx * 80} />
      {/* Main glass tower */}
      <AnimatedBuilding position={[0, 0.82, 0]} w={1.45} d={1.45} h={h}
        color={blendColors(gc, "#fde68a", wealth * 0.45)}
        metalness={0.45 + wealth * 0.35} roughness={0.12} delay={idx * 80 + 250} />
      {/* Setback floor */}
      <AnimatedBuilding position={[0, 0.82 + h * 0.65, 0]} w={1.1} d={1.1} h={h * 0.28}
        color={blendColors(gc, "#ffffff", 0.3)}
        metalness={0.6 + wealth * 0.2} roughness={0.08} delay={idx * 80 + 550} />
      {/* Crown spire */}
      <mesh position={[0, 0.82 + h + h * 0.28 * 0.5 + 0.45, 0]}>
        <coneGeometry args={[0.09, 1.2, 6]} />
        <meshStandardMaterial color={blendColors("#e2e8f0","#fbbf24", wealth)} metalness={0.95} roughness={0.05} />
      </mesh>
      {/* Beacon */}
      <mesh position={[0, 0.82 + h + h * 0.28 * 0.5 + 1.08, 0]}>
        <sphereGeometry args={[0.055, 8, 8]} />
        <meshStandardMaterial color="#fbbf24" emissive="#fbbf24" emissiveIntensity={2.5} />
      </mesh>
      {/* Window grid */}
      {Array.from({ length: 5 }, (_, row) =>
        Array.from({ length: 4 }, (_, col) => {
          const wy = 0.82 + 0.7 + row * (h / 5.5);
          const wx = (col - 1.5) * 0.32;
          return [1, -1].map(side => (
            <mesh key={`${row}-${col}-${side}`} position={[side * 0.74, wy, wx]}>
              <boxGeometry args={[0.02, 0.18, 0.22]} />
              <meshStandardMaterial
                color={blendColors("#bae6fd","#fef3c7", wealth * 0.6)}
                emissive={blendColors("#38bdf8","#fbbf24", wealth)}
                emissiveIntensity={0.3 + wealth * 0.5} metalness={0.4} roughness={0.2}
              />
            </mesh>
          ));
        })
      )}
    </group>
  );
}

// ─── Needs buildings ───────────────────────────────────────────────────────────

function NeedsBuilding({ x, z, idx, health }: { x: number; z: number; idx: number; health: number }) {
  const types = ["school","hospital","utility"] as const;
  const type = types[idx % 3];

  if (type === "school") return (
    <group position={[x, 0, z]}>
      <AnimatedBuilding position={[0,0,0]} w={2.1} d={1.3} h={0.5} color={blendColors("#f87171","#ef4444",health)} delay={idx*80} />
      <mesh position={[0,0.6,0]} castShadow><boxGeometry args={[1.6,0.06,0.9]} /><meshStandardMaterial color="#fbf5f3" /></mesh>
      <mesh position={[0,0.8,0]} castShadow><boxGeometry args={[1.1,0.65,0.65]} /><meshStandardMaterial color="#fde68a" roughness={0.6} /></mesh>
      <mesh position={[0,1.12,0]}><coneGeometry args={[0.22,0.65,6]} /><meshStandardMaterial color="#f97316" /></mesh>
      <mesh position={[0.65,1.5,0]}><cylinderGeometry args={[0.015,0.015,0.8,6]} /><meshStandardMaterial color="#888" /></mesh>
      <mesh position={[0.8,1.85,0]}><boxGeometry args={[0.28,0.18,0.02]} /><meshStandardMaterial color={blendColors("#22c55e","#16a34a",health)} /></mesh>
      <mesh position={[0,0.22,0.67]}><boxGeometry args={[0.6,0.15,0.02]} /><meshStandardMaterial color="#fff" /></mesh>
    </group>
  );

  if (type === "hospital") return (
    <group position={[x, 0, z]}>
      <AnimatedBuilding position={[0,0,0]} w={2.2} d={1.6} h={0.55} color={blendColors("#e0f2fe","#bae6fd",health)} delay={idx*80} />
      <mesh position={[0,0.65,0]} castShadow><boxGeometry args={[1.6,1.1,1.2]} /><meshStandardMaterial color={blendColors("#f0f9ff","#e0f2fe",health)} roughness={0.5} /></mesh>
      <mesh position={[0,1.1,0.62]}><boxGeometry args={[0.46,0.1,0.02]} /><meshStandardMaterial color="#ef4444" emissive="#ef4444" emissiveIntensity={0.5} /></mesh>
      <mesh position={[0,1.1,0.62]}><boxGeometry args={[0.1,0.46,0.02]} /><meshStandardMaterial color="#ef4444" emissive="#ef4444" emissiveIntensity={0.5} /></mesh>
      <mesh position={[0,0.18,0.9]}><boxGeometry args={[0.6,0.36,0.1]} /><meshStandardMaterial color="#94a3b8" /></mesh>
    </group>
  );

  return (
    <group position={[x, 0, z]}>
      <mesh position={[0,0.5,0]} castShadow><cylinderGeometry args={[0.5,0.65,1,8]} /><meshStandardMaterial color={blendColors("#94a3b8","#64748b",1-health)} roughness={0.5} metalness={0.3} /></mesh>
      <mesh position={[0,1.2,0]}><cylinderGeometry args={[0.22,0.22,0.8,8]} /><meshStandardMaterial color="#475569" metalness={0.6} /></mesh>
      <mesh position={[0,1.7,0]}><cylinderGeometry args={[0.04,0.04,0.6,6]} /><meshStandardMaterial color="#cbd5e1" metalness={0.9} /></mesh>
      <mesh position={[0,2.05,0]}><sphereGeometry args={[0.04,6,6]} /><meshStandardMaterial color="#ef4444" emissive="#ef4444" emissiveIntensity={1.8} /></mesh>
    </group>
  );
}

// ─── Wants buildings (entertainment — neon pulsing) ────────────────────────────

function WantBuilding({ x, z, idx, intensity, neon }: { x: number; z: number; idx: number; intensity: number; neon: number }) {
  const ref = useRef<Group>(null);
  const neonColors = ["#ff2d6b","#7c3aed","#0ea5e9","#f97316"];
  const nc = neonColors[idx % 4];
  const body = blendColors("#1e1b2e","#2d1b4e",intensity);

  useFrame(({ clock }) => {
    if (!ref.current || neon < 0.2) return;
    const pulse = 0.5 + Math.sin(clock.getElapsedTime() * 2.5 + idx * 0.7) * 0.5;
    ref.current.traverse((c: any) => {
      if (c.isMesh && c.material?.emissiveIntensity !== undefined && c.material.emissive?.r > 0) {
        c.material.emissiveIntensity = 0.35 + pulse * neon * 0.7;
      }
    });
  });

  return (
    <group ref={ref} position={[x, 0, z]}>
      <AnimatedBuilding position={[0,0,0]} w={2.3} d={1.8} h={0.45} color="#374151" delay={idx*60} />
      <mesh position={[0,0.7,0]} castShadow><boxGeometry args={[2,1.5,1.6]} /><meshStandardMaterial color={body} roughness={0.2} metalness={0.5} /></mesh>
      <mesh position={[0,1.38,0.83]}><boxGeometry args={[1.8,0.14,0.04]} /><meshStandardMaterial color={nc} emissive={nc} emissiveIntensity={1.0} /></mesh>
      <mesh position={[0,0.57,0.9]}><boxGeometry args={[1.8,0.08,0.4]} /><meshStandardMaterial color={nc} transparent opacity={0.75} emissive={nc} emissiveIntensity={0.35} /></mesh>
      {[-0.5,0.5].map(wx => (
        <mesh key={wx} position={[wx,0.9,0.83]}>
          <boxGeometry args={[0.45,0.55,0.02]} />
          <meshStandardMaterial color={blendColors("#b6e0ff",nc,intensity*0.5)} emissive={nc} emissiveIntensity={0.4+intensity*0.4} transparent opacity={0.88} />
        </mesh>
      ))}
    </group>
  );
}

// ─── Treat buildings (parks, gyms, gardens, sports) ───────────────────────────

function TreatBuilding({ x, z, idx, resilience }: { x: number; z: number; idx: number; resilience: number }) {
  const ref = useRef<Group>(null);
  const type = ["park","gym","garden","sports"][idx % 4];
  const grass = blendColors("#4fba62","#16a34a",resilience);
  const tree  = blendColors("#22c55e","#166534",resilience);

  useFrame(({ clock }) => {
    if (!ref.current) return;
    const t = clock.getElapsedTime();
    ref.current.traverse((c: any) => {
      if (c.isMesh && c.geometry?.type === "ConeGeometry") {
        c.rotation.z = Math.sin(t * 0.55 + idx * 0.9) * 0.025;
      }
    });
  });

  if (type === "park") return (
    <group ref={ref} position={[x,0,z]}>
      <mesh position={[0,0.04,0]} receiveShadow><boxGeometry args={[2.4,0.08,2.4]} /><meshStandardMaterial color={grass} roughness={0.95} /></mesh>
      <mesh position={[0,0.05,0]}><boxGeometry args={[2,0.02,0.2]} /><meshStandardMaterial color="#f5efe6" /></mesh>
      {[[-0.6,-0.6],[0.6,-0.6],[-0.6,0.6],[0.6,0.6]].map(([tx,tz],i) => (
        <group key={i} position={[tx,0,tz]}>
          <mesh position={[0,0.2,0]}><cylinderGeometry args={[0.04,0.06,0.4,6]} /><meshStandardMaterial color="#6b4e2c" /></mesh>
          <mesh position={[0,0.55,0]}><coneGeometry args={[0.22,0.5,7]} /><meshStandardMaterial color={tree} roughness={0.8} /></mesh>
          <mesh position={[0,0.78,0]}><coneGeometry args={[0.15,0.38,7]} /><meshStandardMaterial color={blendColors(tree,"#4ade80",0.28)} roughness={0.8} /></mesh>
        </group>
      ))}
      <mesh position={[0,0.12,0.72]}><boxGeometry args={[0.4,0.06,0.14]} /><meshStandardMaterial color="#92400e" roughness={0.8} /></mesh>
      <mesh position={[0,0.1,0]}><cylinderGeometry args={[0.18,0.22,0.12,12]} /><meshStandardMaterial color="#94a3b8" roughness={0.3} metalness={0.4} /></mesh>
    </group>
  );

  if (type === "gym") return (
    <group ref={ref} position={[x,0,z]}>
      <AnimatedBuilding position={[0,0,0]} w={2.2} d={1.5} h={0.6} color={blendColors("#5eead4","#0ea5e9",resilience)} metalness={0.3} roughness={0.4} delay={idx*80} />
      <mesh position={[0,0.7,0]} castShadow><boxGeometry args={[1.8,0.6,1.2]} /><meshStandardMaterial color={blendColors("#e0f2fe","#7dd3fc",resilience)} roughness={0.3} /></mesh>
      <mesh position={[0,1.08,0]}><boxGeometry args={[1.8,0.06,1.2]} /><meshStandardMaterial color="#7dd3fc" transparent opacity={0.5} metalness={0.3} /></mesh>
      <mesh position={[0,0.9,0.62]}><boxGeometry args={[0.5,0.12,0.02]} /><meshStandardMaterial color="#0ea5e9" emissive="#0ea5e9" emissiveIntensity={0.6} /></mesh>
    </group>
  );

  if (type === "garden") return (
    <group ref={ref} position={[x,0,z]}>
      <mesh position={[0,0.04,0]} receiveShadow><boxGeometry args={[2.3,0.08,2.3]} /><meshStandardMaterial color={grass} roughness={0.95} /></mesh>
      {[[-0.5,0],[0.5,0],[0,-0.5],[0,0.5]].map(([bx,bz],i) => (
        <group key={i} position={[bx,0,bz]}>
          <mesh position={[0,0.1,0]}><boxGeometry args={[0.5,0.2,0.35]} /><meshStandardMaterial color="#92400e" roughness={0.9} /></mesh>
          <mesh position={[0,0.22,0]}><boxGeometry args={[0.45,0.04,0.3]} /><meshStandardMaterial color="#4ade80" roughness={0.8} /></mesh>
        </group>
      ))}
      <mesh position={[0,0.28,0]}><boxGeometry args={[0.6,0.4,0.4]} /><meshStandardMaterial color="#a7f3d0" transparent opacity={0.5} roughness={0.1} /></mesh>
    </group>
  );

  // sports
  return (
    <group ref={ref} position={[x,0,z]}>
      <mesh position={[0,0.04,0]} receiveShadow><boxGeometry args={[2.4,0.08,2.4]} /><meshStandardMaterial color={blendColors("#fb923c","#f97316",resilience)} roughness={0.7} /></mesh>
      <mesh position={[0,0.06,0]}><boxGeometry args={[1.8,0.02,0.04]} /><meshStandardMaterial color="#fff" /></mesh>
      <mesh position={[0,0.06,0]}><boxGeometry args={[0.04,0.02,1.8]} /><meshStandardMaterial color="#fff" /></mesh>
      {[-0.75,0.75].map(px => (
        <group key={px} position={[px,0,0]}>
          <mesh position={[0,0.6,0]}><cylinderGeometry args={[0.025,0.025,1.2,6]} /><meshStandardMaterial color="#94a3b8" metalness={0.6} /></mesh>
          <mesh position={[0,1.2,0]} rotation={[Math.PI/2,0,0]}><torusGeometry args={[0.14,0.015,6,16]} /><meshStandardMaterial color="#f97316" metalness={0.5} /></mesh>
        </group>
      ))}
    </group>
  );
}

// ─── Financial Advisor NPC ─────────────────────────────────────────────────────

function AdvisorNPC({ finance }: { finance: DerivedCityFinance }) {
  const ref = useRef<Group>(null);
  const t = useRef(0);
  useFrame((_, delta) => {
    if (!ref.current) return;
    t.current += delta;
    ref.current.position.y = 0.05 + Math.sin(t.current * 1.1) * 0.04;
    ref.current.rotation.y = Math.sin(t.current * 0.35) * 0.35;
  });
  const suit = finance.instabilityRisk > 0.45 ? "#ef4444" : finance.prosperityGlow > 0.55 ? "#22c55e" : "#3b82f6";
  return (
    <group ref={ref} position={[4.0, 0.05, 4.0]}>
      <mesh position={[0,0.22,0]} castShadow><capsuleGeometry args={[0.07,0.22,4,8]} /><meshStandardMaterial color={suit} roughness={0.6} /></mesh>
      <mesh position={[0,0.5,0]} castShadow><sphereGeometry args={[0.075,10,10]} /><meshStandardMaterial color="#f5cba7" roughness={0.8} /></mesh>
      <mesh position={[0,0.575,0]}><cylinderGeometry args={[0.06,0.08,0.06,10]} /><meshStandardMaterial color="#1e293b" /></mesh>
      <mesh position={[0,0.618,0]}><cylinderGeometry args={[0.05,0.05,0.1,10]} /><meshStandardMaterial color="#1e293b" /></mesh>
      <mesh position={[0.1,0.15,0.06]}><boxGeometry args={[0.1,0.07,0.05]} /><meshStandardMaterial color="#92400e" roughness={0.5} metalness={0.2} /></mesh>
    </group>
  );
}

// ─── Block layout ─────────────────────────────────────────────────────────────

type District = "invest"|"needs"|"wants"|"treat"|"park"|"cbd"|"mixed"|"residential";
interface Block { x:number; z:number; district:District; heightFactor:number; width:number; depth:number; index:number; }

function createBlocks(metrics: CityMetrics, finance: DerivedCityFinance): Block[] {
  const blocks: Block[] = [];
  const spacing = 3.8;
  const gridSize = Math.round(2 + finance.expansionRadius * 0.65);

  for (let gx = -gridSize; gx <= gridSize; gx++) {
    for (let gz = -gridSize; gz <= gridSize; gz++) {
      const x = gx * spacing, z = gz * spacing;
      const dist = Math.sqrt(gx*gx + gz*gz);
      if (dist > gridSize + 0.5) continue;
      const seed = gx*100 + gz*17 + 99;
      const noise = seededRandom(seed);

      // Core CBD: invest towers
      if (dist <= 1.3 && finance.investScore > 0.05) {
        blocks.push({ x,z, district:"invest", heightFactor:0.5+finance.investScore*0.5+noise*0.1, width:1.85, depth:1.85, index:blocks.length });
        continue;
      }
      // Mid ring: needs vs wants
      if (dist <= 2.6) {
        if (noise < finance.needsScore * 0.5 && finance.needsScore > 0.08) {
          blocks.push({ x,z, district:"needs", heightFactor:0.4, width:2.1, depth:2.1, index:blocks.length });
          continue;
        }
        if (noise > 0.52 && finance.wantsScore > 0.12) {
          blocks.push({ x,z, district:"wants", heightFactor:0.3, width:2.0, depth:2.0, index:blocks.length });
          continue;
        }
      }
      // Outer: treats & parks
      if (dist > 2.2 && finance.treatsScore > 0.04) {
        if (noise < finance.treatsScore * 0.65) {
          blocks.push({ x,z, district:"treat", heightFactor:0, width:2.3, depth:2.3, index:blocks.length });
          continue;
        }
        if (noise > 0.72 && noise < 0.72 + finance.treatsScore * 0.18) {
          blocks.push({ x,z, district:"park", heightFactor:0, width:2.1, depth:2.1, index:blocks.length });
          continue;
        }
      }
      if (noise < 0.12) continue;
      const district: District = dist <= 1.6 ? "cbd" : dist <= 3.2 ? "mixed" : "residential";
      const growthBias = clamp(metrics.growth/100, 0, 1);
      const cb = clamp(1 - dist/6, 0, 1);
      const heightFactor =
        district==="cbd"     ? 0.52 + cb*0.38 + growthBias*0.28 + noise*0.12 :
        district==="mixed"   ? 0.34 + cb*0.22 + growthBias*0.18 + noise*0.12 :
                               0.2  + growthBias*0.12 + noise*0.1;
      blocks.push({ x,z, district, heightFactor, width:1.65+noise*0.28, depth:1.65+seededRandom(seed+33)*0.28, index:blocks.length });
    }
  }
  return blocks;
}

const FACADE_PALETTE = ["#ff1744", "#d50000", "#304ffe", "#2962ff", "#7c4dff", "#00b0ff"];
const GLASS_PALETTE  = ["#40c4ff", "#00b8d4", "#82b1ff", "#448aff"];
const ROOF_PALETTE   = ["#ff5252", "#ff1744", "#2979ff"];

export function CityGenerator({ metrics, finance }: { metrics: CityMetrics; finance: DerivedCityFinance }) {
  const blocks = createBlocks(metrics, finance);
  const growth  = clamp(metrics.growth/100, 0, 1);
  const housing = clamp(metrics.housing/100, 0, 1);
  const maxH = 7 + growth*5;
  const midH = 3.5 + housing*2.2;
  const resH = 1.8 + housing*1.5;

  const roadTone   = clamp01(finance.infrastructureHealth*0.75 + finance.prosperityGlow*0.25);
  const roadStress = clamp01(finance.pollutionLevel*0.65 + finance.instabilityRisk*0.35);
  const streetColor = blendColors(blendColors("#2f323d","#6f8ea6",roadTone),"#4e5057",roadStress);
  const laneColor   = blendColors("#f8fafc","#c7f9f0",finance.infrastructureHealth);
  const sidewalkColor = blendColors("#b7b2a7","#efe7d8",finance.infrastructureHealth);
  const groundColor = blendColors(blendColors("#4fba62","#2f6d38",finance.resilience),"#5f665f",finance.pollutionLevel);
  const platColor   = blendColors(blendColors("#e8dfd4","#f6efe4",finance.prosperityGlow),"#b8b2a8",finance.pollutionLevel);

  const span = 29, bs = 3.2;
  const neon   = clamp01(finance.lifestyleIntensity * finance.instabilityRisk);
  const wGlow  = clamp01(0.16 + finance.lifestyleIntensity*0.34 + neon*0.3);
  const skyRef = clamp01(finance.resilience*0.6 + finance.prosperityGlow*0.4);
  const flash  = clamp01(finance.lifestyleIntensity*0.6 + neon*0.4);

  return (
    <group>
      {/* Ground planes */}
      <mesh rotation={[-Math.PI/2,0,0]} receiveShadow>
        <planeGeometry args={[44,44]} /><meshStandardMaterial color={groundColor} roughness={0.95} metalness={0.02} />
      </mesh>
      <mesh rotation={[-Math.PI/2,0,0]} position={[0,0.01,0]} receiveShadow>
        <planeGeometry args={[32,32]} /><meshStandardMaterial color={platColor} roughness={0.9} metalness={0.02} />
      </mesh>

      {/* Roads */}
      {Array.from({length:9},(_,i)=>{const o=(i-4)*bs;return(
        <group key={`rh${i}`}>
          <mesh position={[0,0.02,o]} rotation={[-Math.PI/2,0,0]} receiveShadow>
            <planeGeometry args={[span,0.82]} /><meshStandardMaterial color={streetColor} roughness={0.65+roadStress*0.3} />
          </mesh>
          {Array.from({length:10},(_,j)=>(
            <mesh key={j} position={[-14.4+j*bs,0.025,o]} rotation={[-Math.PI/2,0,0]}>
              <planeGeometry args={[0.9,0.04]} /><meshStandardMaterial color={laneColor} />
            </mesh>
          ))}
        </group>
      );})}
      {Array.from({length:9},(_,i)=>{const o=(i-4)*bs;return(
        <group key={`rv${i}`}>
          <mesh position={[o,0.021,0]} rotation={[-Math.PI/2,0,0]} receiveShadow>
            <planeGeometry args={[0.82,span]} /><meshStandardMaterial color={streetColor} roughness={0.65+roadStress*0.3} />
          </mesh>
          {Array.from({length:10},(_,j)=>(
            <mesh key={j} position={[o,0.026,-14.4+j*bs]} rotation={[-Math.PI/2,0,0]}>
              <planeGeometry args={[0.04,0.9]} /><meshStandardMaterial color={laneColor} />
            </mesh>
          ))}
        </group>
      );})}

      {/* Blocks */}
      {blocks.map(block => {
        if (block.district==="invest") {
          const invH = 3.0 + finance.investScore * 10 * finance.heightMultiplier;
          return <InvestTower key={`inv-${block.index}`} x={block.x} z={block.z} idx={block.index} wealth={finance.wealthStrength} height={invH} />;
        }
        if (block.district==="needs") return <NeedsBuilding key={`needs-${block.index}`} x={block.x} z={block.z} idx={block.index} health={finance.infrastructureHealth} />;
        if (block.district==="wants") return <WantBuilding key={`wants-${block.index}`} x={block.x} z={block.z} idx={block.index} intensity={finance.lifestyleIntensity} neon={neon} />;
        if (block.district==="treat") return <TreatBuilding key={`treat-${block.index}`} x={block.x} z={block.z} idx={block.index} resilience={finance.resilience} />;
        if (block.district==="park") return (
          <group key={`park-${block.index}`} position={[block.x,0,block.z]}>
            <mesh position={[0,0.035,0]} receiveShadow><boxGeometry args={[2.05,0.07,2.05]} /><meshStandardMaterial color={blendColors("#4fba62","#3a8f4a",finance.resilience)} roughness={0.9} /></mesh>
            <mesh position={[0,0.04,0]}><boxGeometry args={[1.7,0.02,0.18]} /><meshStandardMaterial color="#f5efe6" /></mesh>
            <mesh position={[0,0.041,0]}><boxGeometry args={[0.18,0.02,1.7]} /><meshStandardMaterial color="#f5efe6" /></mesh>
          </group>
        );

        // Generic buildings
        const bh = block.district==="cbd" ? maxH*block.heightFactor : block.district==="mixed" ? midH*block.heightFactor*1.55 : resH*block.heightFactor*1.8;
        const ph = (block.district==="cbd" ? 0.45+seededRandom(block.index)*0.35 : 0.2+seededRandom(block.index)*0.2) * finance.heightMultiplier;
        const th = Math.max(block.district==="cbd"?2.6:block.district==="mixed"?1.5:0.9, bh) * finance.heightMultiplier;
        const bw = block.width*0.85, bd=block.depth*0.85;
        const fc = FACADE_PALETTE[block.index%6];
        const gc = GLASS_PALETTE[block.index%4];
        const rc = ROOF_PALETTE[block.index%3];
        const facadeTint = blendColors(fc, blendColors("#ff3d00", "#2979ff", flash), 0.25 + flash*0.45);
        const towerColor = block.district==="residential"
          ? blendColors(facadeTint, "#ef4444", finance.infrastructureHealth*0.3)
          : blendColors(gc, "#2962ff", finance.prosperityGlow*0.45);
        const roofAccent = blendColors(blendColors(rc, "#ff1744", finance.wealthStrength), "#82b1ff", finance.prosperityGlow*0.4);
        const hasGarden  = seededRandom(block.index*77) < 0.2 + finance.resilience*0.45;

        return (
          <group key={`b-${block.index}`} position={[block.x,0,block.z]}>
            <mesh position={[0,0.03,0]} receiveShadow><boxGeometry args={[2.08,0.06,2.08]} /><meshStandardMaterial color={sidewalkColor} /></mesh>
            <mesh position={[0,ph/2+0.06,0]} castShadow receiveShadow>
              <boxGeometry args={[bw,ph,bd]} /><meshStandardMaterial color={facadeTint} roughness={0.78-finance.infrastructureHealth*0.2} metalness={0.06+finance.wealthStrength*0.18} />
            </mesh>
            <mesh position={[0,ph+th/2+0.06,0]} castShadow receiveShadow>
              <boxGeometry args={[bw*0.94,th,bd*0.94]} /><meshStandardMaterial color={towerColor} roughness={0.2+(1-skyRef)*0.25} metalness={0.25+skyRef*0.25} />
            </mesh>
            <mesh position={[0,ph+th+0.08,0]} castShadow>
              <boxGeometry args={[bw*0.55,0.06,bd*0.55]} /><meshStandardMaterial color={roofAccent} roughness={0.35-finance.prosperityGlow*0.15} metalness={0.3+finance.wealthStrength*0.25} />
            </mesh>
            {hasGarden && (
              <mesh position={[0,ph+th+0.12,0]}>
                <boxGeometry args={[bw*0.38,0.04,bd*0.38]} /><meshStandardMaterial color={blendColors("#80ed99","#1f8a5b",finance.resilience)} roughness={0.4} />
              </mesh>
            )}
            {Array.from({length:3},(_,row)=>Array.from({length:3},(_,col)=>{
              const wy=0.28+row*0.38, ho=(col-1)*0.36;
              return ([{ax:"z",dir:1},{ax:"z",dir:-1},{ax:"x",dir:1},{ax:"x",dir:-1}] as const).map(face=>{
                const wd = face.ax==="z"?bd/2-0.01:bw/2-0.01;
                const pos = face.ax==="z"?[ho,ph+wy,face.dir*wd]:[face.dir*wd,ph+wy,ho];
                const rot = face.ax==="x"?[0,Math.PI/2,0]:[0,0,0];
                return (
                  <mesh key={`w-${block.index}-${row}-${col}-${face.ax}-${face.dir}`} position={pos as [number,number,number]} rotation={rot as [number,number,number]}>
                    <boxGeometry args={[0.22,0.18,0.02]} />
                    <meshStandardMaterial color={blendColors("#93c5fd","#fca5a5",finance.lifestyleIntensity)} emissive={blendColors("#1d4ed8","#dc2626",neon)} emissiveIntensity={wGlow} metalness={0.25} roughness={0.3} />
                  </mesh>
                );
              });
            }))}
          </group>
        );
      })}

      {/* Landmark towers */}
      {[{x:-3.2,z:0,h:5.8,w:1.2,d:1.2,c:"#38bdf8"},{x:3.2,z:-3.2,h:5.2,w:1.05,d:1.05,c:"#6366f1"},{x:0,z:3.2,h:4.8,w:1.15,d:1.15,c:"#ef4444"}].map((t,i)=>(
        <group key={`lm-${i}`} position={[t.x,0,t.z]}>
          <mesh position={[0,0.38,0]} castShadow receiveShadow>
            <boxGeometry args={[1.45,0.76,1.45]} /><meshStandardMaterial color={blendColors("#1e293b","#334155",finance.wealthStrength)} roughness={0.65} metalness={0.12+finance.wealthStrength*0.2} />
          </mesh>
          <mesh position={[0,0.76+(t.h*finance.heightMultiplier)/2,0]} castShadow receiveShadow>
            <boxGeometry args={[t.w,t.h*finance.heightMultiplier,t.d]} /><meshStandardMaterial color={blendColors(t.c,"#f43f5e",finance.wealthStrength*0.35)} metalness={0.25+finance.wealthStrength*0.35} roughness={0.2+(1-finance.wealthStrength)*0.2} />
          </mesh>
        </group>
      ))}

      <AdvisorNPC finance={finance} />
    </group>
  );
}
