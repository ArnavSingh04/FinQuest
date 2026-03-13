"use client";

import { useCityStore } from "@/store/useCityStore";
import type { CityMetrics } from "@/types";

interface CityGeneratorProps {
  metrics: CityMetrics;
}

function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value));
}

function seededRandom(seed: number) {
  const x = Math.sin(seed * 999.91) * 43758.5453123;
  return x - Math.floor(x);
}

type SpecialType = "stadium" | "gym" | "hospital";

type Block = {
  x: number;
  z: number;
  district: "cbd" | "mixed" | "residential" | "park" | "plaza" | "school";
  heightFactor: number;
  width: number;
  depth: number;
  special?: SpecialType;
};

const CITY_GRASS = "#59c36a";

function createCityBlocks(metrics: CityMetrics): Block[] {
  const blocks: Block[] = [];

  const spacing = 3.8;
  const gridSize = 3;

  const greeneryBias = clamp((100 - metrics.pollution) / 100, 0.25, 0.48);
  const entertainmentBias = clamp(metrics.entertainment / 100, 0, 1);
  const growthBias = clamp(metrics.growth / 100, 0, 1);

  for (let gx = -gridSize; gx <= gridSize; gx++) {
    for (let gz = -gridSize; gz <= gridSize; gz++) {
      const x = gx * spacing;
      const z = gz * spacing;

      const distance = Math.sqrt(gx * gx + gz * gz);
      const seed = gx * 100 + gz * 17 + 99;
      const noise = seededRandom(seed);

      const parkChance =
        distance > 1.8 ? greeneryBias * (0.55 + noise * 0.5) : greeneryBias * 0.12;

      const plazaChance =
        distance <= 2.2 ? 0.12 + entertainmentBias * 0.16 : 0.04;

      const housingBias = clamp(metrics.housing / 100, 0, 1);
      const schoolChance = 0.04 + housingBias * 0.2;
      const specialChance = 0.06 + entertainmentBias * 0.25;

      if (noise < parkChance) {
        blocks.push({
          x,
          z,
          district: "park",
          heightFactor: 0,
          width: 2.1,
          depth: 2.1,
        });
        continue;
      }

      if (noise > 0.82 && noise < 0.82 + plazaChance) {
        blocks.push({
          x,
          z,
          district: "plaza",
          heightFactor: 0,
          width: 2,
          depth: 2,
        });
        continue;
      }

      if (noise > 0.5 && noise < 0.5 + schoolChance) {
        blocks.push({
          x,
          z,
          district: "school",
          heightFactor: 0,
          width: 2.4,
          depth: 2.4,
        });
        continue;
      }

      if (noise > 0.6 && noise < 0.6 + specialChance) {
        const specialTypes: SpecialType[] = ["stadium", "gym", "hospital"];
        const choice = specialTypes[Math.floor(noise * specialTypes.length)];
        blocks.push({
          x,
          z,
          district: "mixed",
          heightFactor: 0.12,
          width: 2.6,
          depth: 2.6,
          special: choice,
        });
        continue;
      }

      let district: Block["district"] = "residential";
      if (distance <= 1.6) district = "cbd";
      else if (distance <= 3.2) district = "mixed";

      const centerBoost = clamp(1 - distance / 6, 0, 1);

      const heightFactor =
        district === "cbd"
          ? 0.52 + centerBoost * 0.38 + growthBias * 0.28 + noise * 0.12
          : district === "mixed"
            ? 0.34 + centerBoost * 0.22 + growthBias * 0.18 + noise * 0.12
            : 0.2 + growthBias * 0.12 + noise * 0.1;

      const shouldSkip = noise < 0.15;
      if (shouldSkip) {
        continue;
      }

      blocks.push({
        x,
        z,
        district,
        heightFactor,
        width: 1.65 + noise * 0.28,
        depth: 1.65 + seededRandom(seed + 33) * 0.28,
      });
    }
  }

  return blocks;
}

function getFacadeColor(index: number) {
  const palette = ["#f72585", "#7209b7", "#4cc9f0", "#ff6b6b", "#3a0ca3", "#ffba08"];
  return palette[index % palette.length];
}

function getGlassColor(index: number) {
  const palette = ["#7dd3fc", "#38bdf8", "#22d3ee", "#0ea5e9"];
  return palette[index % palette.length];
}

function getRoofColor(index: number) {
  const palette = ["#e76f51", "#fb8500", "#ffbe0b"];
  return palette[index % palette.length];
}

function getParkGreen() {
  return CITY_GRASS;
}

function getPlazaColor(index: number) {
  const palette = ["#ffe5ec", "#fde2e4", "#e4f0ff", "#faf3dd"];
  return palette[index % palette.length];
}

export function CityGenerator({ metrics }: CityGeneratorProps) {
  const blocks = createCityBlocks(metrics);
  const heightMultiplier = useCityStore((state) => state.heightMultiplier);

  const growth = clamp(metrics.growth / 100, 0, 1);
  const housing = clamp(metrics.housing / 100, 0, 1);
  const entertainment = clamp(metrics.entertainment / 100, 0, 1);
  const pollution = clamp(metrics.pollution / 100, 0, 1);

  const maxTowerHeight = 7 + growth * 5;
  const mixedHeight = 3.5 + housing * 2.2;
  const residentialHeight = 1.8 + housing * 1.5;

  const streetColor = pollution > 0.55 ? "#59616b" : "#5c6770";
  const laneColor = "#f8fafc";
  const sidewalkColor = "#d9d4cb";
  const groundColor = CITY_GRASS;

  const roadSpan = 29;
  const blockSpacing = 3.2;

  return (
    <group>
      {/* Base ground */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[42, 42]} />
        <meshStandardMaterial color={groundColor} roughness={1} metalness={0} />
      </mesh>

      {/* Bright city platform */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.01, 0]} receiveShadow>
        <planeGeometry args={[32, 32]} />
        <meshStandardMaterial color="#f3eadf" roughness={1} metalness={0} />
      </mesh>

      {/* Horizontal roads */}
      {Array.from({ length: 9 }, (_, i) => {
        const offset = (i - 4) * blockSpacing;

        return (
          <group key={`road-h-${i}`}>
            <mesh
              position={[0, 0.02, offset]}
              rotation={[-Math.PI / 2, 0, 0]}
              receiveShadow
            >
              <planeGeometry args={[roadSpan, 0.8]} />
              <meshStandardMaterial color={streetColor} />
            </mesh>

            {Array.from({ length: 10 }, (_, j) => (
              <mesh
                key={`lane-h-${i}-${j}`}
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

      {/* Vertical roads */}
      {Array.from({ length: 9 }, (_, i) => {
        const offset = (i - 4) * blockSpacing;

        return (
          <group key={`road-v-${i}`}>
            <mesh
              position={[offset, 0.021, 0]}
              rotation={[-Math.PI / 2, 0, 0]}
              receiveShadow
            >
              <planeGeometry args={[0.8, roadSpan]} />
              <meshStandardMaterial color={streetColor} />
            </mesh>

            {Array.from({ length: 10 }, (_, j) => (
              <mesh
                key={`lane-v-${i}-${j}`}
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

      {/* Buildings / parks / plazas */}
      {blocks.map((block, index) => {
        if (block.district === "park") {
          return (
            <group key={`park-${index}`} position={[block.x, 0, block.z]}>
              <mesh position={[0, 0.035, 0]} receiveShadow>
                <boxGeometry args={[2.05, 0.07, 2.05]} />
                <meshStandardMaterial color={getParkGreen()} roughness={1} metalness={0} />
              </mesh>

              <mesh position={[0, 0.04, 0]} receiveShadow>
                <boxGeometry args={[1.7, 0.02, 0.18]} />
                <meshStandardMaterial color="#f5efe6" />
              </mesh>
              <mesh position={[0, 0.041, 0]} receiveShadow>
                <boxGeometry args={[0.18, 0.02, 1.7]} />
                <meshStandardMaterial color="#f5efe6" />
              </mesh>

              {Array.from({ length: 4 }, (_, t) => {
                const tx = (seededRandom(index * 13 + t) - 0.5) * 1.15;
                const tz = (seededRandom(index * 29 + t) - 0.5) * 1.15;
                const trunkH = 0.28 + seededRandom(index * 41 + t) * 0.12;
                const crown = 0.2 + seededRandom(index * 53 + t) * 0.09;

                return (
                  <group key={`tree-${index}-${t}`} position={[tx, 0.04, tz]}>
                    <mesh position={[0, trunkH / 2, 0]} castShadow>
                      <cylinderGeometry args={[0.035, 0.05, trunkH, 8]} />
                      <meshStandardMaterial color="#8b5e3c" />
                    </mesh>
                    <mesh position={[0, trunkH + crown * 0.6, 0]} castShadow>
                      <sphereGeometry args={[crown, 12, 12]} />
                      <meshStandardMaterial color="#52b788" />
                    </mesh>
                  </group>
                );
              })}
            </group>
          );
        }

        if (block.district === "plaza") {
          return (
            <group key={`plaza-${index}`} position={[block.x, 0, block.z]}>
              <mesh position={[0, 0.035, 0]} receiveShadow>
                <boxGeometry args={[2, 0.07, 2]} />
                <meshStandardMaterial color={getPlazaColor(index)} />
              </mesh>

              <mesh position={[0, 0.12, 0]}>
                <cylinderGeometry args={[0.22, 0.28, 0.18, 20]} />
                <meshStandardMaterial color="#ffffff" />
              </mesh>

              <mesh position={[0, 0.28, 0]}>
                <sphereGeometry args={[0.14, 16, 16]} />
                <meshStandardMaterial
                  color="#7bdff2"
                  emissive="#7bdff2"
                  emissiveIntensity={0.25}
                />
              </mesh>

              {[
                [-0.55, 0.08, 0],
                [0.55, 0.08, 0],
                [0, 0.08, -0.55],
                [0, 0.08, 0.55],
              ].map((pos, i) => (
                <mesh
                  key={`plaza-seat-${index}-${i}`}
                  position={pos as [number, number, number]}
                >
                  <boxGeometry args={[0.28, 0.1, 0.16]} />
                  <meshStandardMaterial color="#cdb4db" />
                </mesh>
              ))}
            </group>
          );
        }

        if (block.district === "school") {
          const signColor = "#f87171";
          const slideColor = "#22c55e";
          return (
            <group key={`school-${index}`} position={[block.x, 0, block.z]}>
              <mesh position={[0, 0.12, 0]} receiveShadow>
                <boxGeometry args={[2.1, 0.24, 1.3]} />
                <meshStandardMaterial color={signColor} />
              </mesh>
              <mesh position={[0, 0.36, 0]}>
                <boxGeometry args={[1.6, 0.02, 0.8]} />
                <meshStandardMaterial color="#fbf5f3" />
              </mesh>
              <mesh position={[0, 0.52, 0]}>
                <boxGeometry args={[1.2, 0.6, 0.6]} />
                <meshStandardMaterial color="#fde68a" />
              </mesh>
              <mesh position={[0, 0.82, 0]}>
                <coneGeometry args={[0.2, 0.6, 6]} />
                <meshStandardMaterial color="#f97316" />
              </mesh>

              <mesh position={[0, 0.05, 1.1]}>
                <boxGeometry args={[1.4, 0.08, 1.8]} />
                <meshStandardMaterial color="#70efad" />
              </mesh>
              <mesh position={[0.4, 0.25, 1.35]}>
                <boxGeometry args={[0.3, 0.2, 0.3]} />
                <meshStandardMaterial color={slideColor} />
              </mesh>
              <mesh position={[-0.4, 0.25, 1.35]}>
                <boxGeometry args={[0.3, 0.2, 0.3]} />
                <meshStandardMaterial color={slideColor} />
              </mesh>

              <mesh position={[0, 0.14, -1.15]}>
                <planeGeometry args={[1.1, 0.6]} />
                <meshStandardMaterial color="#1e40af" />
              </mesh>
            </group>
          );
        }

        if (block.special) {
          const baseHeight = 0.4;
          const stadiumRadius = 1.6;
          if (block.special === "stadium") {
            return (
              <group key={`stadium-${index}`} position={[block.x, 0, block.z]}>
                <mesh position={[0, baseHeight, 0]} receiveShadow>
                  <cylinderGeometry args={[stadiumRadius, stadiumRadius, 0.35, 64]} />
                  <meshStandardMaterial color="#253b6b" metalness={0.3} />
                </mesh>
                <mesh position={[0, baseHeight + 0.25, 0]}>
                  <torusGeometry args={[stadiumRadius - 0.15, 0.2, 16, 64]} />
                  <meshStandardMaterial color="#bde0fe" />
                </mesh>
                <mesh position={[0, baseHeight + 0.6, 0]}>
                  <cylinderGeometry args={[stadiumRadius * 0.6, stadiumRadius * 0.6, 0.15, 32]} />
                  <meshStandardMaterial color="#020617" />
                </mesh>
              </group>
            );
          }

          if (block.special === "gym") {
            return (
              <group key={`gym-${index}`} position={[block.x, 0, block.z]}>
                <mesh position={[0, 0.25, 0]} receiveShadow>
                  <boxGeometry args={[2, 0.5, 1.4]} />
                  <meshStandardMaterial color="#5eead4" />
                </mesh>
                <mesh position={[0, 0.55, 0]} receiveShadow>
                  <boxGeometry args={[1.4, 0.18, 0.8]} />
                  <meshStandardMaterial color="#0ea5e9" />
                </mesh>
                <mesh position={[0, 0.03, 0.75]}>
                  <boxGeometry args={[0.6, 0.06, 0.6]} />
                  <meshStandardMaterial color="#f97316" />
                </mesh>
              </group>
            );
          }

          return (
            <group key={`hospital-${index}`} position={[block.x, 0, block.z]}>
              <mesh position={[0, 0.2, 0]} receiveShadow>
                <boxGeometry args={[2.2, 0.4, 1.6]} />
                <meshStandardMaterial color="#e0f2fe" />
              </mesh>
              <mesh position={[0, 0.6, 0]}>
                <boxGeometry args={[1.4, 0.3, 1.6]} />
                <meshStandardMaterial color="#ffffff" />
              </mesh>
              <mesh position={[0, 0.75, 0.7]}>
                <boxGeometry args={[0.3, 0.3, 0.05]} />
                <meshStandardMaterial color="#ef4444" />
              </mesh>
              <mesh position={[0, 0.75, 0.3]}>
                <boxGeometry args={[0.05, 0.3, 0.3]} />
                <meshStandardMaterial color="#ef4444" />
              </mesh>
              <mesh position={[0, 0.2, 1.1]}>
                <boxGeometry args={[1.6, 0.05, 0.5]} />
                <meshStandardMaterial color="#0ea5e9" />
              </mesh>
            </group>
          );
        }

        const baseHeight =
          block.district === "cbd"
            ? maxTowerHeight * block.heightFactor
            : block.district === "mixed"
              ? mixedHeight * block.heightFactor * 1.55
              : residentialHeight * block.heightFactor * 1.8;

        const podiumHeight =
          block.district === "cbd"
            ? 0.45 + seededRandom(index) * 0.35
            : 0.2 + seededRandom(index) * 0.2;

        const towerHeight =
          block.district === "cbd"
            ? Math.max(2.6, baseHeight)
            : block.district === "mixed"
            ? Math.max(1.5, baseHeight)
            : Math.max(0.9, baseHeight * 0.9);

        const adjustedPodiumHeight = podiumHeight * heightMultiplier;
        const adjustedTowerHeight = towerHeight * heightMultiplier;

        const buildingWidth = block.width * 0.85;
        const buildingDepth = block.depth * 0.85;

        const facadeColor = getFacadeColor(index);
        const glassColor = getGlassColor(index);
        const roofColor = getRoofColor(index);

        const isTall = block.district === "cbd" && adjustedTowerHeight > 4.6;
        const hasSetback = isTall && seededRandom(index * 17) > 0.45;
        const rooftopGarden = seededRandom(index * 77) > 0.65;

        return (
          <group key={`block-${index}`} position={[block.x, 0, block.z]}>
            <mesh position={[0, 0.03, 0]} receiveShadow>
              <boxGeometry args={[2.08, 0.06, 2.08]} />
              <meshStandardMaterial color={sidewalkColor} />
            </mesh>

            <mesh
              position={[0, adjustedPodiumHeight / 2 + 0.06, 0]}
              castShadow
              receiveShadow
            >
              <boxGeometry
                args={[buildingWidth, adjustedPodiumHeight, buildingDepth]}
              />
              <meshStandardMaterial
                color={facadeColor}
                roughness={0.78}
                metalness={0.06}
              />
            </mesh>

            <mesh
              position={[
                0,
                adjustedPodiumHeight + adjustedTowerHeight / 2 + 0.06,
                0,
              ]}
              castShadow
              receiveShadow
            >
              <boxGeometry
                args={[
                  hasSetback ? buildingWidth * 0.78 : buildingWidth * 0.94,
                  adjustedTowerHeight,
                  hasSetback ? buildingDepth * 0.78 : buildingDepth * 0.94,
                ]}
              />
              <meshStandardMaterial
                color={block.district === "residential" ? facadeColor : glassColor}
                roughness={block.district === "residential" ? 0.7 : 0.2}
                metalness={block.district === "residential" ? 0.08 : 0.4}
              />
            </mesh>

            {hasSetback && (
              <mesh
                position={[
                  0,
                  adjustedPodiumHeight + adjustedTowerHeight + adjustedTowerHeight * 0.12,
                  0,
                ]}
                castShadow
                receiveShadow
              >
                <boxGeometry
                  args={[
                    buildingWidth * 0.52,
                    adjustedTowerHeight * 0.22,
                    buildingDepth * 0.52,
                  ]}
                />
              <meshStandardMaterial
                color={glassColor}
                roughness={0.18}
                  metalness={0.45}
                />
              </mesh>
            )}

            <mesh
              position={[
                0,
                adjustedPodiumHeight +
                  adjustedTowerHeight +
                  (hasSetback ? adjustedTowerHeight * 0.24 : 0) +
                  0.08,
                0,
              ]}
              castShadow
            >
              <boxGeometry args={[buildingWidth * 0.55, 0.06, buildingDepth * 0.55]} />
              <meshStandardMaterial color={roofColor} />
            </mesh>

            {rooftopGarden && (
              <mesh
                position={[
                  0,
                  adjustedPodiumHeight +
                    adjustedTowerHeight +
                    (hasSetback ? adjustedTowerHeight * 0.24 : 0) +
                    0.12,
                  0,
                ]}
              >
                <boxGeometry args={[buildingWidth * 0.38, 0.04, buildingDepth * 0.38]} />
                <meshStandardMaterial color="#80ed99" />
              </mesh>
            )}

            {Array.from({ length: 3 }, (_, row) =>
              Array.from({ length: 3 }, (_, col) => {
                const wy = 0.28 + row * 0.38;
                const horizontalOffset = (col - 1) * (0.28 + 0.08);

                const faces = [
                  { axis: "z", direction: 1 },
                  { axis: "z", direction: -1 },
                  { axis: "x", direction: 1 },
                  { axis: "x", direction: -1 },
                ] as const;

                return faces.map((face) => {
                  const wallDistance =
                    face.axis === "z"
                      ? buildingDepth / 2 - 0.01
                      : buildingWidth / 2 - 0.01;
                      const position =
                        face.axis === "z"
                          ? [
                              horizontalOffset,
                              adjustedPodiumHeight + wy,
                              face.direction * wallDistance,
                            ]
                          : [
                              face.direction * wallDistance,
                              adjustedPodiumHeight + wy,
                              horizontalOffset,
                            ];

                  const rotation = face.axis === "x" ? [0, Math.PI / 2, 0] : [0, 0, 0];

                  return (
                    <mesh
                      key={`window-${index}-${row}-${col}-${face.axis}-${face.direction}`}
                      position={position as [number, number, number]}
                      rotation={rotation as [number, number, number]}
                    >
                      <boxGeometry args={[0.22, 0.18, 0.02]} />
                      <meshStandardMaterial
                        color={entertainment > 0.55 ? "#fff8d0" : "#b6e0ff"}
                        emissive={entertainment > 0.55 ? "#ffe66d" : "#a5b4fc"}
                        emissiveIntensity={entertainment > 0.55 ? 0.12 : 0.08}
                        metalness={0.25}
                        roughness={0.3}
                      />
                    </mesh>
                  );
                });
              })
            )}

            {block.district === "cbd" && (
              <>
                <mesh
                  position={[
                    0,
                    adjustedPodiumHeight + adjustedTowerHeight * 0.35,
                    buildingDepth * 0.4,
                  ]}
                >
                  <boxGeometry args={[buildingWidth * 0.82, 0.05, 0.03]} />
                  <meshStandardMaterial color="#ffffff" />
                </mesh>
                <mesh
                  position={[
                    0,
                    adjustedPodiumHeight + adjustedTowerHeight * 0.68,
                    buildingDepth * 0.4,
                  ]}
                >
                  <boxGeometry args={[buildingWidth * 0.82, 0.05, 0.03]} />
                  <meshStandardMaterial color="#ffffff" />
                </mesh>
              </>
            )}
          </group>
        );
      })}

      {[
        { x: -3.2, z: 0, h: 5.8, w: 1.2, d: 1.2, color: "#7bdff2" },
        { x: 3.2, z: -3.2, h: 5.2, w: 1.05, d: 1.05, color: "#bdb2ff" },
        { x: 0, z: 3.2, h: 4.8, w: 1.15, d: 1.15, color: "#caffbf" },
      ].map((tower, i) => (
        <group key={`landmark-${i}`} position={[tower.x, 0, tower.z]}>
          <mesh position={[0, 0.38, 0]} castShadow receiveShadow>
            <boxGeometry args={[1.45, 0.76, 1.45]} />
            <meshStandardMaterial color="#ffffff" roughness={0.82} />
          </mesh>

          <mesh position={[0, 0.76 + tower.h / 2, 0]} castShadow receiveShadow>
            <boxGeometry args={[tower.w, tower.h, tower.d]} />
            <meshStandardMaterial color={tower.color} metalness={0.28} roughness={0.22} />
          </mesh>

          <mesh position={[0, 0.76 + tower.h + 0.14, 0]}>
            <boxGeometry args={[tower.w * 0.45, 0.12, tower.d * 0.45]} />
            <meshStandardMaterial color="#ffffff" />
          </mesh>
        </group>
      ))}

      {[
        { x: -6.4, z: -3.2, color: "#ff595e", rot: 0 },
        { x: 6.4, z: 3.2, color: "#ffca3a", rot: Math.PI / 2 },
        { x: 0, z: -9.6, color: "#1982c4", rot: 0 },
        { x: 9.6, z: 0, color: "#8ac926", rot: Math.PI / 2 },
      ].map((car, i) => (
        <mesh
          key={`car-${i}`}
          position={[car.x, 0.08, car.z]}
          rotation={[0, car.rot, 0]}
          castShadow
        >
          <boxGeometry args={[0.42, 0.14, 0.22]} />
          <meshStandardMaterial
            color={car.color}
            metalness={0.22}
            roughness={0.32}
          />
        </mesh>
      ))}
    </group>
  );
}
