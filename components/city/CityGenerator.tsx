"use client";

import { useMemo } from "react";

import { useCityStore } from "@/store/useCityStore";
import type { CityMetrics, CityStructureInfo } from "@/types";

import { Apartment } from "./buildings/Apartment";
import { House } from "./buildings/House";
import { Mall } from "./buildings/Mall";
import { OfficeTower } from "./buildings/OfficeTower";
import { Park } from "./buildings/Park";
import { PollutionCloud } from "./buildings/PollutionCloud";

interface CityGeneratorProps {
  metrics: CityMetrics;
}

function createIndexedArray(length: number) {
  return Array.from({ length }, (_, index) => index);
}

export function CityGenerator({ metrics }: CityGeneratorProps) {
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

  const officeTowers = useMemo<CityStructureInfo[]>(
    () =>
      createIndexedArray(growthCount).map((index) => ({
        id: `office-${index}`,
        title: `Office Tower ${index + 1}`,
        category: "office",
        metricValue: metrics.growth,
        description:
          "High investment behavior pushes economic growth and unlocks taller skyline structures.",
      })),
    [growthCount, metrics.growth],
  );

  const mallStructures = useMemo<CityStructureInfo[]>(
    () =>
      createIndexedArray(entertainmentCount).map((index) => ({
        id: `mall-${index}`,
        title: `Town Mall ${index + 1}`,
        category: "mall",
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

  const parks = useMemo<CityStructureInfo[]>(
    () =>
      createIndexedArray(parkCount).map((index) => ({
        id: `park-${index}`,
        title: `Neighborhood Park ${index + 1}`,
        category: "park",
        metricValue: metrics.parks,
        description:
          "Healthy saving and balanced spending keep neighborhoods greener and more relaxing.",
      })),
    [metrics.parks, parkCount],
  );

  return (
    <group>
      {houses.map((structure, index) => (
        <House
          key={structure.id}
          structure={structure}
          position={[
            -4.6 + (index % 4) * 1.55,
            0.45,
            -3.2 - Math.floor(index / 4) * 1.8,
          ]}
          onHover={setHoveredStructure}
          onSelect={setSelectedStructure}
        />
      ))}

      {apartments.map((structure, index) => (
        <Apartment
          key={structure.id}
          structure={structure}
          position={[
            -1.4 + (index % 3) * 1.9,
            1.1,
            -1.5 - Math.floor(index / 3) * 2.1,
          ]}
          height={2 + index * 0.2}
          onHover={setHoveredStructure}
          onSelect={setSelectedStructure}
        />
      ))}

      {mallStructures.map((structure, index) => (
        <Mall
          key={structure.id}
          structure={structure}
          position={[-3 + index * 2.7, 0.56, 2.3]}
          onHover={setHoveredStructure}
          onSelect={setSelectedStructure}
        />
      ))}

      {officeTowers.map((structure, index) => (
        <OfficeTower
          key={structure.id}
          structure={structure}
          position={[
            2.2 + (index % 3) * 2.05,
            2.2 + index * 0.12,
            -1.3 - Math.floor(index / 3) * 2,
          ]}
          height={4.2 + index * 0.45}
          onHover={setHoveredStructure}
          onSelect={setSelectedStructure}
        />
      ))}

      {pollutionStructures.map((structure, index) => (
        <PollutionCloud
          key={structure.id}
          structure={structure}
          position={[2.2 + index * 1.25, 3.4 + index * 0.14, 2.4 - index * 0.7]}
          onHover={setHoveredStructure}
          onSelect={setSelectedStructure}
        />
      ))}

      {parks.map((structure, index) => (
        <Park
          key={structure.id}
          structure={structure}
          position={[
            -4 + (index % 4) * 2.7,
            0.12,
            4 + Math.floor(index / 4) * 1.9,
          ]}
          onHover={setHoveredStructure}
          onSelect={setSelectedStructure}
        />
      ))}
    </group>
  );
}
