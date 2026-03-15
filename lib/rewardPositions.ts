/**
 * Predefined city-grid positions for quest-reward buildings.
 * Shared between RewardChoiceModal (position selection) and
 * CityGenerator (rendering). Defined here to avoid importing
 * from a Three.js component into plain React/UI code.
 */

export interface TowerPosition {
  x: number;
  z: number;
  heightMultiplier: number;
}

export interface ParkPosition {
  x: number;
  z: number;
}

/** Northeast corner, extending the Financial Crown district */
export const REWARD_TOWER_POSITIONS: TowerPosition[] = [
  { x: 14.0, z:  -4.0, heightMultiplier: 1.8 },
  { x: 14.0, z:  -7.0, heightMultiplier: 2.0 },
  { x: 14.0, z: -10.0, heightMultiplier: 1.6 },
  { x: 16.0, z:  -5.5, heightMultiplier: 1.9 },
  { x: 16.0, z:  -8.5, heightMultiplier: 1.7 },
  { x: 18.0, z:  -4.0, heightMultiplier: 2.2 },
  { x: 18.0, z:  -8.0, heightMultiplier: 1.5 },
  { x: 18.0, z: -11.0, heightMultiplier: 1.8 },
];

/** Scattered across empty city areas */
export const REWARD_PARK_POSITIONS: ParkPosition[] = [
  { x:  -3.0, z: -13.0 }, // northwest suburb
  { x:   5.0, z: -13.0 }, // north suburb
  { x: -14.0, z:   3.0 }, // west side
  { x:  10.0, z:   5.0 }, // east side
  { x:  -5.0, z:   9.0 }, // south area
  { x:   3.0, z:   9.0 }, // south area
  { x: -14.0, z: -14.0 }, // far northwest
  { x:   5.0, z:   8.0 }, // southeast
];
