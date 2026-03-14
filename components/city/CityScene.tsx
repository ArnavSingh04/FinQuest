"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Canvas } from "@react-three/fiber";
import {
  ContactShadows,
  Environment,
  OrbitControls,
  Sky,
} from "@react-three/drei";
import { CanvasTexture, RepeatWrapping, SRGBColorSpace } from "three";

import { useCityStore } from "@/store/useCityStore";

import { BuildingInfoPanel } from "./BuildingInfoPanel";
import { CityHUD } from "./CityHUD";
import { CityGenerator } from "./CityGenerator";

function createGroundTexture() {
  const canvas = document.createElement("canvas");
  canvas.width = 512;
  canvas.height = 512;

  const context = canvas.getContext("2d");

  if (!context) {
    return null;
  }

  context.fillStyle = "#1f6f4a";
  context.fillRect(0, 0, canvas.width, canvas.height);

  context.strokeStyle = "rgba(186, 230, 253, 0.22)";
  context.lineWidth = 2;

  for (let offset = 0; offset <= canvas.width; offset += 64) {
    context.beginPath();
    context.moveTo(offset, 0);
    context.lineTo(offset, canvas.height);
    context.stroke();

    context.beginPath();
    context.moveTo(0, offset);
    context.lineTo(canvas.width, offset);
    context.stroke();
  }

  context.strokeStyle = "rgba(15, 23, 42, 0.2)";
  context.lineWidth = 1;

  for (let offset = 0; offset <= canvas.width; offset += 16) {
    context.beginPath();
    context.moveTo(offset, 0);
    context.lineTo(offset, canvas.height);
    context.stroke();

    context.beginPath();
    context.moveTo(0, offset);
    context.lineTo(canvas.width, offset);
    context.stroke();
  }

  const texture = new CanvasTexture(canvas);
  texture.wrapS = RepeatWrapping;
  texture.wrapT = RepeatWrapping;
  texture.repeat.set(10, 10);
  texture.colorSpace = SRGBColorSpace;

  return texture;
}

function GroundPlane() {
  const groundTexture = useMemo(() => createGroundTexture(), []);

  useEffect(() => {
    return () => {
      groundTexture?.dispose();
    };
  }, [groundTexture]);

  return (
    <>
      <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[42, 42]} />
        <meshStandardMaterial
          color="#1f6f4a"
          map={groundTexture ?? undefined}
          roughness={0.96}
        />
      </mesh>
      <mesh
        position={[0, -0.02, 0]}
        rotation={[-Math.PI / 2, 0, 0]}
        receiveShadow
      >
        <circleGeometry args={[10.5, 48]} />
        <meshStandardMaterial color="#14532d" roughness={1} />
      </mesh>
    </>
  );
}

function RoadGrid() {
  const verticalRoads = [-5.3, -2.6, 0.2, 3, 5.8];
  const horizontalRoads = [-4.8, -2, 0.8, 3.6];

  return (
    <group position={[0, 0.01, 0]}>
      {verticalRoads.map((x) => (
        <mesh
          key={`vertical-road-${x}`}
          position={[x, 0, 0]}
          rotation={[-Math.PI / 2, 0, 0]}
          receiveShadow
        >
          <planeGeometry args={[1.05, 16]} />
          <meshStandardMaterial color="#334155" roughness={0.92} />
        </mesh>
      ))}
      {horizontalRoads.map((z) => (
        <mesh
          key={`horizontal-road-${z}`}
          position={[0, 0, z]}
          rotation={[-Math.PI / 2, 0, 0]}
          receiveShadow
        >
          <planeGeometry args={[16, 1.05]} />
          <meshStandardMaterial color="#334155" roughness={0.92} />
        </mesh>
      ))}
      {[...verticalRoads].map((x) =>
        horizontalRoads.map((z) => (
          <mesh
            key={`intersection-${x}-${z}`}
            position={[x, 0.01, z]}
            rotation={[-Math.PI / 2, 0, 0]}
            receiveShadow
          >
            <planeGeometry args={[1.15, 1.15]} />
            <meshStandardMaterial color="#475569" roughness={0.9} />
          </mesh>
        )),
      )}
    </group>
  );
}

export function CityScene() {
  const cityMetrics = useCityStore((state) => state.cityMetrics);
  const hoveredStructure = useCityStore((state) => state.hoveredStructure);
  const selectedStructure = useCityStore((state) => state.selectedStructure);
  const setSelectedStructure = useCityStore((state) => state.setSelectedStructure);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const sceneContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleFullscreenChange() {
      setIsFullscreen(document.fullscreenElement === sceneContainerRef.current);

      // Three's canvas can retain stale dimensions after exiting fullscreen.
      requestAnimationFrame(() => {
        window.dispatchEvent(new Event("resize"));
      });
    }

    handleFullscreenChange();
    document.addEventListener("fullscreenchange", handleFullscreenChange);

    return () => {
      document.removeEventListener("fullscreenchange", handleFullscreenChange);
    };
  }, []);

  async function toggleFullscreen() {
    if (document.fullscreenElement === sceneContainerRef.current) {
      await document.exitFullscreen();
      return;
    }

    await sceneContainerRef.current?.requestFullscreen();
  }

  return (
    <div
      ref={sceneContainerRef}
      className={`city-scene-shell glass-card relative overflow-hidden ${
        isFullscreen ? "z-[70] h-screen w-screen rounded-none" : "h-[520px] rounded-[2rem]"
      }`}
    >
      <CityHUD
        cityMetrics={cityMetrics}
        hoveredStructure={hoveredStructure}
        selectedStructure={selectedStructure}
        isFullscreen={isFullscreen}
        onToggleFullscreen={toggleFullscreen}
      />
      <BuildingInfoPanel
        selectedBuilding={selectedStructure}
        onClose={() => setSelectedStructure(null)}
      />
      <Canvas
        key={isFullscreen ? "city-fullscreen" : "city-windowed"}
        camera={{ position: [9, 8, 11], fov: 40 }}
        onPointerMissed={() => setSelectedStructure(null)}
        shadows
        className="h-full w-full"
      >
        <color attach="background" args={["#07111f"]} />
        <fog attach="fog" args={["#07111f", 14, 32]} />
        <Sky sunPosition={[8, 5, 4]} turbidity={6} />
        <ambientLight intensity={0.45} />
        <hemisphereLight
          intensity={0.9}
          groundColor="#0f172a"
          color="#cbd5e1"
        />
        <directionalLight
          position={[10, 16, 8]}
          intensity={2}
          castShadow
          shadow-mapSize-width={2048}
          shadow-mapSize-height={2048}
          shadow-camera-left={-16}
          shadow-camera-right={16}
          shadow-camera-top={16}
          shadow-camera-bottom={-16}
        />
        <Environment preset="sunset" />
        <GroundPlane />
        <RoadGrid />
        <ContactShadows
          position={[0, 0.02, 0]}
          opacity={0.35}
          scale={22}
          blur={1.8}
          far={10}
        />

        {/* The generator converts city metrics into visible building types. */}
        <CityGenerator metrics={cityMetrics} />
        <OrbitControls
          enablePan
          enableZoom
          minDistance={6}
          maxDistance={22}
          maxPolarAngle={Math.PI / 2.1}
        />
      </Canvas>
    </div>
  );
}
