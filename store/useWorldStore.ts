"use client";

import { create } from "zustand";

import type { CityMetrics } from "@/types";
import {
  createWorld,
  defaultCityMetrics,
  exportWorldCode,
  importWorldCode,
  loadWorldStore,
  removeMemberFromWorld,
  saveWorlds,
  setCurrentWorldId,
  updateMemberInWorld,
  WorldData,
} from "@/lib/worlds";

interface WorldMemberView {
  id: string;
  isYou: boolean;
  cityMetrics: CityMetrics;
  lastUpdated: string;
}

interface WorldSummary {
  id: string;
  name: string;
  memberCount: number;
}

interface WorldStore {
  initialized: boolean;
  userId: string;
  worldId: string;
  worldName: string;
  members: WorldMemberView[];
  availableWorlds: WorldSummary[];
  init: () => void;
  setActiveWorld: (worldId: string) => void;
  joinWorld: (code: string) => { success: boolean; message?: string; action?: string };
  leaveWorld: () => void;
  updateMyMetrics: (metrics: CityMetrics) => void;
  exportCurrentWorldCode: () => string;
}

function mapMembers(world: WorldData, userId: string): WorldMemberView[] {
  return Object.values(world.members)
    .map((member) => ({
      id: member.id,
      isYou: member.id === userId,
      cityMetrics: member.cityMetrics,
      lastUpdated: member.lastUpdated,
    }))
    .sort((a, b) => (a.isYou === b.isYou ? 0 : a.isYou ? -1 : 1));
}

function summarizeWorlds(worlds: Record<string, WorldData>) {
  return Object.values(worlds).map((world) => ({
    id: world.id,
    name: world.name,
    memberCount: Object.keys(world.members).length,
  }));
}

function findWorldsWithMember(worlds: Record<string, WorldData>, userId: string) {
  return Object.values(worlds).filter((world) => Boolean(world.members[userId]));
}

function ensureWorldsInList(
  worlds: Record<string, WorldData>,
  worldIds: string[],
): Record<string, WorldData> {
  const result = { ...worlds };
  for (const id of worldIds) {
    if (worlds[id]) {
      result[id] = worlds[id];
    }
  }
  return result;
}

export const useWorldStore = create<WorldStore>((set, get) => ({
  initialized: false,
  userId: "",
  worldId: "",
  worldName: "",
  members: [],
  availableWorlds: [],
  init() {
    const store = loadWorldStore();
    const world = store.worlds[store.worldId];

    if (!world) {
      return;
    }

    const memberWorlds = findWorldsWithMember(store.worlds, store.userId);
    const worldMap = memberWorlds.reduce((acc, world) => ({ ...acc, [world.id]: world }), {});
    const completedMap = ensureWorldsInList(worldMap, [store.worldId]);
    const availableWorlds = summarizeWorlds(completedMap);

    set({
      initialized: true,
      userId: store.userId,
      worldId: store.worldId,
      worldName: world.name,
      members: mapMembers(world, store.userId),
      availableWorlds,
    });
  },
  setActiveWorld(worldId: string) {
    const store = loadWorldStore();

    const world = store.worlds[worldId];
    if (!world) {
      return;
    }

    setCurrentWorldId(worldId);
    set({
      worldId,
      worldName: world.name,
      members: mapMembers(world, get().userId),
    });
  },

  joinWorld(code: string) {
    const { userId, worldId: currentWorldId } = get();

    const existing = loadWorldStore();
    const { worldId: targetId, world } = importWorldCode(code);

    if (!targetId) {
      return { success: false, message: "Could not parse world code." };
    }

    let worlds = existing.worlds;

    // Ensure the current world stays in the store and the user remains a member.
    if (!worlds[currentWorldId]) {
      worlds[currentWorldId] = createWorld();
    }

    const currentMetrics = worlds[currentWorldId]?.members[userId]?.cityMetrics ?? defaultCityMetrics;
    worlds = updateMemberInWorld(worlds, currentWorldId, userId, currentMetrics);

    // Merge incoming world payload (if provided).
    if (world) {
      worlds[targetId] = world;
    }

    // Ensure the target world exists.
    if (!worlds[targetId]) {
      worlds[targetId] = world ?? createWorld();
    }

    // Check if user is already a member of this world.
    const isAlreadyMember = Boolean(worlds[targetId].members[userId]);

    const memberWorlds = findWorldsWithMember(worlds, userId);
    const worldMap = memberWorlds.reduce((acc, world) => ({ ...acc, [world.id]: world }), {});

    const completedMap = ensureWorldsInList(worldMap, [currentWorldId, targetId]);
    const availableWorlds = summarizeWorlds(completedMap);

    if (isAlreadyMember) {
      // Sync the joined world state without removing membership from other worlds.
      saveWorlds(worlds);
      setCurrentWorldId(targetId);

      set({
        worldId: targetId,
        worldName: worlds[targetId]?.name ?? "",
        members: mapMembers(worlds[targetId], userId),
        availableWorlds,
      });

      return { success: true, action: "synced" };
    }

    // Add the user to the target world (without removing from others).
    const memberMetrics = worlds[currentWorldId]?.members[userId]?.cityMetrics ?? defaultCityMetrics;
    worlds = updateMemberInWorld(worlds, targetId, userId, memberMetrics);

    saveWorlds(worlds);
    setCurrentWorldId(targetId);

    const targetWorld = worlds[targetId];

    set({
      worldId: targetId,
      worldName: targetWorld?.name ?? "",
      members: mapMembers(targetWorld, userId),
      availableWorlds,
    });

    return { success: true, action: "joined" };
  },

  leaveWorld() {
    const { userId, worldId } = get();
    const store = loadWorldStore();

    // Remove from current world
    let worldsWithoutMember = removeMemberFromWorld(store.worlds, worldId, userId);

    // Determine next world to switch to (if any)
    const remainingWorlds = findWorldsWithMember(worldsWithoutMember, userId);
    let nextWorld: WorldData;

    if (remainingWorlds.length > 0) {
      nextWorld = remainingWorlds[0];
    } else {
      nextWorld = createWorld("My World");
      worldsWithoutMember[nextWorld.id] = nextWorld;
      // Add the user to the new personal world.
      worldsWithoutMember = updateMemberInWorld(
        worldsWithoutMember,
        nextWorld.id,
        userId,
        defaultCityMetrics,
      );
    }

    saveWorlds(worldsWithoutMember);
    setCurrentWorldId(nextWorld.id);

    const memberWorlds = findWorldsWithMember(worldsWithoutMember, userId);
    const worldMap = memberWorlds.reduce((acc, world) => ({ ...acc, [world.id]: world }), {});
    const completedMap = ensureWorldsInList(worldMap, [nextWorld.id]);
    const availableWorlds = summarizeWorlds(completedMap);

    set({
      worldId: nextWorld.id,
      worldName: nextWorld.name,
      members: mapMembers(nextWorld, userId),
      availableWorlds,
    });
  },
  updateMyMetrics(metrics: CityMetrics) {
    const { userId, worldId } = get();
    const store = loadWorldStore();

    // Update the user in every world they belong to so metrics are synced across worlds.
    const worldsWithMember = findWorldsWithMember(store.worlds, userId);
    let updatedWorlds = { ...store.worlds };

    worldsWithMember.forEach((world) => {
      updatedWorlds = updateMemberInWorld(updatedWorlds, world.id, userId, metrics);
    });

    saveWorlds(updatedWorlds);

    const world = updatedWorlds[worldId];
    set({
      members: mapMembers(world, userId),
    });
  },
  exportCurrentWorldCode() {
    const store = loadWorldStore();
    return exportWorldCode(store.worlds, store.worldId);
  },
}));

