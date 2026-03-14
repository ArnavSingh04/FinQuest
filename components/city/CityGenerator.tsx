"use client";

import { useLayoutEffect, useMemo, useRef } from "react";
import { Object3D, type InstancedMesh } from "three";

import { useCityStore } from "@/store/useCityStore";
import type { CityMetrics, CityStructureInfo } from "@/types";

import { Apartment } from "./buildings/Apartment";
import { EntertainmentBuilding } from "./buildings/EntertainmentBuilding";
import { House } from "./buildings/House";
import { PollutionCloud } from "./buildings/PollutionCloud";
import { Skyscraper } from "./buildings/Skyscraper";

interface CityGeneratorProps {
  metrics: CityMetrics;
}

function createIndexedArray(length: number) {
  return Array.from({ length }, (_, index) => index);
}

export function CityGenerator({ metrics }: CityGeneratorProps) {
  const parkMeshRef = useRef<InstancedMesh>(null);
  const setHoveredStructure = useCityStore((state) => state.setHoveredStructure);
  const setSelectedStructure = useCityStore((state) => state.setSelectedStructure);

  const infrastructureCount = Math.max(2, Math.round(metrics.infrastructure / 18));
  const apartmentCount = Math.max(1, Math.round(metrics.stability / 28));
  const entertainmentCount = Math.max(1, Math.round(metrics.entertainment / 24));
  const growthCount = Math.max(1, Math.round(metrics.growth / 18));
  const pollutionCount = Math.max(1, Math.round(metrics.pollution / 28));
  const parkCount = Math.max(1, Math.round(metrics.parks / 22));

  const houses = useMemo<CityStructureInfo[]>(
    () =>
      createIndexedArray(infrastructureCount).map((index) => ({
        id: `house-${index}`,
        title: `Infrastructure House ${index + 1}`,
        category: "housing",
        metricValue: metrics.infrastructure,
        description:
          "Needs spending improves infrastructure, so these homes grow when essentials stay funded.",
      })),
    [infrastructureCount, metrics.infrastructure],
  );

  const apartments = useMemo<CityStructureInfo[]>(
    () =>
      createIndexedArray(apartmentCount).map((index) => ({
        id: `apartment-${index}`,
        title: `Stable Apartment ${index + 1}`,
        category: "apartment",
        metricValue: metrics.stability,
        description:
          "Budget health and liquidity make the city more stable, which shows up as denser apartments.",
      })),
    [apartmentCount, metrics.stability],
  );

  const skyscrapers = useMemo<CityStructureInfo[]>(
    () =>
      createIndexedArray(growthCount).map((index) => ({
        id: `skyscraper-${index}`,
        title: `Growth Tower ${index + 1}`,
        category: "skyscraper",
        metricValue: metrics.growth,
        description:
          "High investment behavior pushes economic growth and unlocks taller skyline structures.",
      })),
    [growthCount, metrics.growth],
  );

  const entertainmentStructures = useMemo<CityStructureInfo[]>(
    () =>
      createIndexedArray(entertainmentCount).map((index) => ({
        id: `entertainment-${index}`,
        title: `Entertainment Hub ${index + 1}`,
        category: "entertainment",
        metricValue: metrics.entertainment,
        description:
          "Wants spending powers social and fun districts, but it works best when balanced with the rest of the budget.",
      })),
    [entertainmentCount, metrics.entertainment],
  );

  const pollutionStructures = useMemo<CityStructureInfo[]>(
    () =>
      createIndexedArray(pollutionCount).map((index) => ({
        id: `pollution-${index}`,
        title: `Pollution Cloud ${index + 1}`,
        category: "pollution",
        metricValue: metrics.pollution,
        description:
          "Treat-heavy spending creates pollution pressure, warning the player that short-term spending is crowding out healthier habits.",
      })),
    [pollutionCount, metrics.pollution],
  );

  const parkPositions = useMemo<[number, number, number][]>(
    () =>
      createIndexedArray(parkCount).map((index) => [
        -3.5 + (index % 3) * 2.2,
        0.06,
        2.8 + Math.floor(index / 3) * 1.7,
      ]),
    [parkCount],
  );

  useLayoutEffect(() => {
    if (!parkMeshRef.current) {
      return;
    }

    const dummy = new Object3D();

    parkPositions.forEach((position, index) => {
      dummy.position.set(position[0], position[1], position[2]);
      dummy.scale.set(1.2, 1, 1.2);
      dummy.updateMatrix();
      parkMeshRef.current?.setMatrixAt(index, dummy.matrix);
    });

    parkMeshRef.current.count = parkPositions.length;
    parkMeshRef.current.instanceMatrix.needsUpdate = true;
  }, [parkPositions]);

  return (
    <group>
      {houses.map((structure, index) => (
        <House
          key={structure.id}
          structure={structure}
          position={[-4 + (index % 4) * 1.3, 0.45, -1.8 - Math.floor(index / 4) * 1.15]}
          onHover={setHoveredStructure}
          onSelect={setSelectedStructure}
        />
      ))}

      {apartments.map((structure, index) => (
        <Apartment
          key={structure.id}
          structure={structure}
          position={[-1.5 + (index % 3) * 1.45, 0.9, -0.4 - Math.floor(index / 3) * 1.2]}
          height={1.6 + index * 0.25}
          onHover={setHoveredStructure}
          onSelect={setSelectedStructure}
        />
      ))}

      {entertainmentStructures.map((structure, index) => (
        <EntertainmentBuilding
          key={structure.id}
          structure={structure}
          position={[-1 + index * 1.8, 0.95, 2]}
          onHover={setHoveredStructure}
          onSelect={setSelectedStructure}
        />
      ))}

      {skyscrapers.map((structure, index) => (
        <Skyscraper
          key={structure.id}
          structure={structure}
          position={[2 + (index % 3) * 1.5, 1.9 + index * 0.12, -0.6]}
          height={3.4 + index * 0.6}
          onHover={setHoveredStructure}
          onSelect={setSelectedStructure}
        />
      ))}

      {pollutionStructures.map((structure, index) => (
        <PollutionCloud
          key={structure.id}
          structure={structure}
          position={[2 + index * 1.05, 3.1 + index * 0.18, 2 - index * 0.55]}
          onHover={setHoveredStructure}
          onSelect={setSelectedStructure}
        />
      ))}

      {/* Parks are instanced because they repeat often and are visually simple. */}
      <instancedMesh ref={parkMeshRef} args={[undefined, undefined, parkCount]} receiveShadow>
        <cylinderGeometry args={[0.55, 0.55, 0.1, 16]} />
        <meshStandardMaterial color="#4ade80" />
      </instancedMesh>
    </group>
  );
}
