"use client";

import { useRef, useState, useEffect, useMemo } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import type { Group, Mesh } from "three";

export const DEMOLITION_DURATION = 3500;
export const METEOR_DURATION = 4000;

// ─── Debris chunk (building rubble) ─────────────────────────────────────────

interface ChunkProps {
  startX: number; startY: number; startZ: number;
  velX: number; velY: number; velZ: number;
  rotVel: number; size: number; color: string;
}

function DebrisChunk({ startX, startY, startZ, velX, velY, velZ, rotVel, size, color }: ChunkProps) {
  const ref = useRef<Group>(null);
  const t0 = useRef(Date.now());

  useFrame(() => {
    if (!ref.current) return;
    const t = (Date.now() - t0.current) / 1000;
    const py = startY + velY * t - 4.9 * t * t;
    if (py < -0.5) { ref.current.visible = false; return; }
    ref.current.position.set(startX + velX * t, py, startZ + velZ * t);
    ref.current.rotation.x = rotVel * t * 1.8;
    ref.current.rotation.z = rotVel * t * 0.9;
    const fade = Math.max(0, 1 - t / (DEMOLITION_DURATION / 1000));
    (ref.current.children[0] as any).material.opacity = fade;
  });

  return (
    <group ref={ref} position={[startX, startY, startZ]}>
      <mesh castShadow>
        <boxGeometry args={[size, size, size]} />
        <meshStandardMaterial color={color} roughness={0.8} transparent opacity={1} />
      </mesh>
    </group>
  );
}

// ─── Meteor (fireball from sky) ───────────────────────────────────────────────

interface MeteorProps {
  targetX: number; targetZ: number; delay: number;
  onImpact?: () => void; intensity: number;
}

function Meteor({ targetX, targetZ, delay, onImpact, intensity }: MeteorProps) {
  const ref = useRef<Group>(null);
  const trailRef = useRef<Group>(null);
  const t0 = useRef(Date.now() + delay);
  const impactFired = useRef(false);
  const size = 0.3 + intensity * 0.5;

  // Angle in from top-right
  const startX = targetX + 14;
  const startY = 22;
  const startZ = targetZ - 8;

  useFrame(() => {
    if (!ref.current) return;
    const elapsed = (Date.now() - t0.current) / 1000;
    if (elapsed < 0) return;

    const duration = 1.4;
    const t = clamp01(elapsed / duration);
    const eased = t * t; // ease-in — accelerate toward ground

    const x = startX + (targetX - startX) * eased;
    const y = startY + (0 - startY) * eased;
    const z = startZ + (targetZ - startZ) * eased;

    ref.current.position.set(x, y, z);
    // Point along travel direction
    ref.current.rotation.z = -0.6;

    // Pulse glow
    const glow = 0.8 + Math.sin(elapsed * 12) * 0.3;
    (ref.current.children[0] as any)?.material && ((ref.current.children[0] as any).material.emissiveIntensity = glow);

    // Trail
    if (trailRef.current) {
      trailRef.current.position.set(x + 0.5, y + 0.5, z - 0.3);
      trailRef.current.scale.set(1, 1 + t * 2, 1);
      (trailRef.current.children[0] as any).material.opacity = (1 - t) * 0.7;
    }

    if (t >= 0.97 && !impactFired.current) {
      impactFired.current = true;
      onImpact?.();
    }

    if (elapsed > duration + 0.5 && ref.current) {
      ref.current.visible = false;
      if (trailRef.current) trailRef.current.visible = false;
    }
  });

  return (
    <>
      <group ref={ref} position={[startX, startY, startZ]}>
        {/* Core fireball */}
        <mesh>
          <sphereGeometry args={[size, 12, 12]} />
          <meshStandardMaterial
            color="#ff4500" emissive="#ff6600"
            emissiveIntensity={1.2} roughness={0.3}
          />
        </mesh>
        {/* Outer glow shell */}
        <mesh scale={1.6}>
          <sphereGeometry args={[size, 8, 8]} />
          <meshStandardMaterial
            color="#ff8c00" transparent opacity={0.25}
            emissive="#ff4400" emissiveIntensity={0.8}
          />
        </mesh>
      </group>
      {/* Trail */}
      <group ref={trailRef} position={[startX, startY, startZ]}>
        <mesh rotation={[0.5, 0, 0.4]}>
          <coneGeometry args={[size * 0.6, size * 4, 8]} />
          <meshStandardMaterial
            color="#ff6600" transparent opacity={0.5}
            emissive="#ff4400" emissiveIntensity={0.6}
          />
        </mesh>
      </group>
    </>
  );
}

// ─── Crater explosion at impact ───────────────────────────────────────────────

function ImpactExplosion({ x, z, active, intensity }: { x: number; z: number; active: boolean; intensity: number }) {
  const ref = useRef<Group>(null);
  const t0 = useRef(Date.now());
  const rings = 3;

  useEffect(() => { if (active) t0.current = Date.now(); }, [active]);

  useFrame(() => {
    if (!ref.current || !active) return;
    const t = (Date.now() - t0.current) / 1000;
    ref.current.children.forEach((ring: any, i) => {
      const delay = i * 0.12;
      const rt = Math.max(0, t - delay);
      const s = rt * (2.5 + intensity * 2) * (1 + i * 0.5);
      ring.scale.set(s, 0.1 + Math.max(0, 0.8 - rt * 1.5), s);
      ring.material.opacity = Math.max(0, 0.7 - rt * 0.6);
    });
  });

  if (!active) return null;

  return (
    <group ref={ref} position={[x, 0.05, z]}>
      {Array.from({ length: rings }, (_, i) => (
        <mesh key={i} rotation={[-Math.PI / 2, 0, 0]}>
          <ringGeometry args={[0, 1, 24]} />
          <meshStandardMaterial
            color={i === 0 ? "#ff6600" : i === 1 ? "#ff9900" : "#ffcc00"}
            transparent opacity={0.7} emissive={i === 0 ? "#ff4400" : "#ff8800"}
            emissiveIntensity={0.8} side={THREE.DoubleSide}
          />
        </mesh>
      ))}
    </group>
  );
}

// ─── Full demolition event (building crumbles + debris) ──────────────────────

export interface DemolitionEvent {
  x: number; z: number;
  buildingHeight: number;
  buildingColor: string;
  type: "meteor" | "attack" | "crumble";
}

interface DemolitionEffectProps {
  events: DemolitionEvent[];
  active: boolean;
  intensity: number;
  onComplete?: () => void;
}

function clamp01(v: number) { return Math.max(0, Math.min(1, v)); }

export function DemolitionEffect({ events, active, intensity, onComplete }: DemolitionEffectProps) {
  const [impacted, setImpacted] = useState<Record<number, boolean>>({});
  const completedRef = useRef(false);

  useEffect(() => {
    if (!active) { completedRef.current = false; setImpacted({}); return; }
    const timer = setTimeout(() => {
      onComplete?.();
      completedRef.current = true;
    }, METEOR_DURATION);
    return () => clearTimeout(timer);
  }, [active, onComplete]);

  const chunks = useMemo(() => {
    if (!active) return [];
    return events.flatMap((ev, ei) =>
      Array.from({ length: 20 }, (_, i) => {
        const angle = (i / 20) * Math.PI * 2;
        const speed = 2 + Math.random() * 3 * intensity;
        return {
          id: `${ei}-${i}`,
          startX: ev.x + (Math.random() - 0.5) * 1.2,
          startY: ev.buildingHeight * (0.3 + Math.random() * 0.6),
          startZ: ev.z + (Math.random() - 0.5) * 1.2,
          velX: Math.cos(angle) * speed,
          velY: 2.5 + Math.random() * 4,
          velZ: Math.sin(angle) * speed,
          rotVel: (Math.random() - 0.5) * 6,
          size: 0.08 + Math.random() * 0.3,
          color: Math.random() > 0.4 ? ev.buildingColor : "#9ca3af",
        };
      })
    );
  }, [active, events, intensity]);

  if (!active) return null;

  return (
    <>
      {events.map((ev, i) => (
        <group key={`ev-${i}`}>
          {ev.type === "meteor" && (
            <Meteor
              targetX={ev.x} targetZ={ev.z}
              delay={i * 400} intensity={intensity}
              onImpact={() => setImpacted(prev => ({ ...prev, [i]: true }))}
            />
          )}
          <ImpactExplosion x={ev.x} z={ev.z} active={!!impacted[i]} intensity={intensity} />
        </group>
      ))}
      {chunks.map((c) => <DebrisChunk key={c.id} {...c} />)}
    </>
  );
}

// ─── Construction scaffolding (appears when a new building is going up) ───────

export function ConstructionScaffolding({
  x, z, targetHeight, progress,
}: { x: number; z: number; targetHeight: number; progress: number }) {
  const h = targetHeight * Math.min(progress * 1.3, 1);
  return (
    <group position={[x, 0, z]}>
      <mesh position={[0, 0.05, 0]}>
        <boxGeometry args={[2, 0.1, 2]} />
        <meshStandardMaterial color="#78716c" />
      </mesh>
      {([-0.7, 0.7] as number[]).flatMap(px =>
        ([-0.7, 0.7] as number[]).map(pz => (
          <mesh key={`${px}-${pz}`} position={[px, h / 2, pz]}>
            <cylinderGeometry args={[0.03, 0.03, h, 6]} />
            <meshStandardMaterial color="#f59e0b" metalness={0.5} roughness={0.3} />
          </mesh>
        ))
      )}
      {Array.from({ length: Math.floor(h / 0.7) }, (_, i) => (
        <mesh key={i} position={[0, i * 0.7 + 0.35, 0]}>
          <boxGeometry args={[1.4, 0.04, 0.04]} />
          <meshStandardMaterial color="#f59e0b" metalness={0.4} />
        </mesh>
      ))}
      {progress > 0.15 && (
        <mesh position={[0, h * 0.5, 0]}>
          <boxGeometry args={[1.35, h, 1.35]} />
          <meshStandardMaterial color="#94a3b8" roughness={0.6} transparent opacity={0.6 + progress * 0.35} />
        </mesh>
      )}
    </group>
  );
}