"use client";

import { useState } from "react";
import { Canvas } from "@react-three/fiber";
import * as THREE from "three";

import { CityFullscreen, SceneContents } from "./CityFullscreen";

// Re-export SceneContents inline canvas (non-fullscreen)
interface CitySceneProps {
  height?: string;
}

export function CityScene({ height = "h-[480px]" }: CitySceneProps) {
  const [fullscreen, setFullscreen] = useState(false);

  return (
    <>
      <div className={`relative overflow-hidden rounded-3xl border border-white/10 shadow-2xl ${height}`}>
        <Canvas
          shadows
          gl={{ antialias: true, toneMapping: THREE.ACESFilmicToneMapping, toneMappingExposure: 1.15 }}
        >
          <SceneContents preset={null} />
        </Canvas>

        {/* Expand button */}
        <button
          onClick={() => setFullscreen(true)}
          className="absolute top-3 right-3 rounded-xl border border-white/20 bg-black/50 px-3 py-1.5 text-xs font-semibold text-white backdrop-blur-sm hover:bg-white/15 transition"
          title="Expand to fullscreen"
        >
          ⛶ Expand
        </button>
      </div>

      {fullscreen && <CityFullscreen onClose={() => setFullscreen(false)} />}
    </>
  );
}