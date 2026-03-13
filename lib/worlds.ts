import type { CityMetrics } from "@/types";

const STORAGE_KEY = "finquest-worlds";
const WORLD_ID_KEY = "finquest-world-id";
const USER_ID_KEY = "finquest-user-id";

export const defaultCityMetrics: CityMetrics = {
  housing: 35,
  entertainment: 28,
  pollution: 18,
  growth: 24,
};

export interface WorldMember {
  id: string;
  cityMetrics: CityMetrics;
  lastUpdated: string;
}

export interface WorldData {
  id: string;
  name: string;
  createdAt: string;
  members: Record<string, WorldMember>;
}

export interface WorldStoreData {
  userId: string;
  worldId: string;
  worlds: Record<string, WorldData>;
}

function safeParse<T>(value: string | null, fallback: T): T {
  if (!value) {
    return fallback;
  }

  try {
    return JSON.parse(value) as T;
  } catch {
    return fallback;
  }
}

export function generateId() {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  // Fallback for environments without crypto.randomUUID (rare in browsers)
  return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

export function loadWorldStore(): WorldStoreData {
  const userId = getOrCreateUserId();
  const worlds = loadWorlds();
  let worldId = localStorage.getItem(WORLD_ID_KEY);

  if (!worldId) {
    const newWorld = createWorld();
    worlds[newWorld.id] = newWorld;
    worldId = newWorld.id;
    saveWorlds(worlds);
    localStorage.setItem(WORLD_ID_KEY, worldId);
  }

  // Make sure the world exists and includes the current user.
  if (!worlds[worldId]) {
    worlds[worldId] = createWorld();
    worldId = worlds[worldId].id;
    localStorage.setItem(WORLD_ID_KEY, worldId);
  }

  const world = worlds[worldId];
  if (!world.members[userId]) {
    world.members[userId] = createWorldMember(userId, defaultCityMetrics);
    saveWorlds(worlds);
  }

  return {
    userId,
    worldId,
    worlds,
  };
}

export function createWorld(name = "My World"): WorldData {
  const id = generateId();
  return {
    id,
    name,
    createdAt: new Date().toISOString(),
    members: {},
  };
}

export function createWorldMember(
  id: string,
  cityMetrics: CityMetrics,
): WorldMember {
  return {
    id,
    cityMetrics,
    lastUpdated: new Date().toISOString(),
  };
}

export function loadWorlds(): Record<string, WorldData> {
  return safeParse<Record<string, WorldData>>(localStorage.getItem(STORAGE_KEY), {});
}

export function saveWorlds(worlds: Record<string, WorldData>) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(worlds));
}

export function setCurrentWorldId(worldId: string) {
  localStorage.setItem(WORLD_ID_KEY, worldId);
}

export function setCurrentUserId(userId: string) {
  localStorage.setItem(USER_ID_KEY, userId);
}

export function getOrCreateUserId(): string {
  let userId = localStorage.getItem(USER_ID_KEY);
  if (!userId) {
    userId = generateId();
    localStorage.setItem(USER_ID_KEY, userId);
  }
  return userId;
}

export function updateMemberInWorld(
  worlds: Record<string, WorldData>,
  worldId: string,
  memberId: string,
  cityMetrics: CityMetrics,
): Record<string, WorldData> {
  const world = worlds[worldId] ?? createWorld();

  world.members = {
    ...world.members,
    [memberId]: {
      id: memberId,
      cityMetrics,
      lastUpdated: new Date().toISOString(),
    },
  };

  return {
    ...worlds,
    [world.id]: world,
  };
}

export function removeMemberFromWorld(
  worlds: Record<string, WorldData>,
  worldId: string,
  memberId: string,
): Record<string, WorldData> {
  const world = worlds[worldId];
  if (!world) {
    return worlds;
  }

  const { [memberId]: removed, ...remaining } = world.members;
  world.members = remaining;

  // If world is empty after removal, keep it around for history.
  return {
    ...worlds,
    [worldId]: world,
  };
}

export function exportWorldCode(worlds: Record<string, WorldData>, worldId: string) {
  const world = worlds[worldId];
  if (!world) {
    return "";
  }

  const payload = {
    worldId: world.id,
    world,
  };

  try {
    return btoa(JSON.stringify(payload));
  } catch {
    return "";
  }
}

interface ImportedWorldPayload {
  worldId: string;
  world: WorldData;
}

export function importWorldCode(
  code: string,
): { worldId?: string; world?: WorldData; error?: string } {
  // Accept both raw worldId and encoded payload.
  if (!code) {
    return { error: "Empty code provided." };
  }

  // Try to parse as JSON directly (for debugging / easy paste).
  try {
    const parsed = JSON.parse(code);
    if (parsed?.worldId && parsed?.world) {
      return { worldId: parsed.worldId, world: parsed.world };
    }
  } catch {
    // not JSON
  }

  try {
    const decoded = atob(code);
    const parsed = JSON.parse(decoded) as ImportedWorldPayload;
    if (parsed?.worldId && parsed?.world) {
      return { worldId: parsed.worldId, world: parsed.world };
    }
  } catch {
    // Not base64, maybe it's just a world id.
  }

  // If it's just a world id, return it and let the caller decide.
  return { worldId: code.trim() };
}
