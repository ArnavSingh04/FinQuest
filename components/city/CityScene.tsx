"use client";

import { useState } from "react";
import { Canvas } from "@react-three/fiber";
import * as THREE from "three";

import { CityFullscreen, SceneContents } from "./CityFullscreen";
import { useGameStore } from "@/store/useGameStore";

interface CitySceneProps {
  /** When false, scene fills container with no card chrome (for persistent full-screen city layer). */
  embedded?: boolean;
  height?: string;
}

export function CityScene({
  embedded = true,
  height = "h-[480px]",
}: CitySceneProps) {
  const [fullscreen, setFullscreen] = useState(false);
  const setResetCameraTrigger = useGameStore((s) => s.setResetCameraTrigger);

  const wrapperClass = embedded
    ? `relative overflow-hidden rounded-3xl border border-border shadow-card ${height}`
    : "relative h-full w-full overflow-hidden";

  return (
    <>
      <div className={wrapperClass}>
        <Canvas
          shadows
          className="h-full w-full"
          gl={{
            antialias: true,
            toneMapping: THREE.ACESFilmicToneMapping,
            toneMappingExposure: 1.15,
          }}
        >
          <SceneContents preset={null} />
        </Canvas>

        {embedded && (
          <div className="absolute top-3 right-3 flex gap-2">
            <button
              type="button"
              onClick={() => setResetCameraTrigger()}
              className="rounded-xl border border-white/20 bg-black/50 px-3 py-1.5 text-xs font-semibold text-white backdrop-blur-sm transition hover:bg-white/15"
              title="Reset camera to default"
            >
              Reset View
            </button>
            <button
              onClick={() => setFullscreen(true)}
              className="rounded-xl border border-white/20 bg-black/50 px-3 py-1.5 text-xs font-semibold text-white backdrop-blur-sm transition hover:bg-white/15"
              title="Expand to fullscreen"
            >
              ⛶ Expand
            </button>
          </div>
        )}
      </div>

      {fullscreen && <CityFullscreen onClose={() => setFullscreen(false)} />}
    </>
  );
}