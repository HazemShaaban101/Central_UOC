import { ZONES } from '@/model/central/project';

/**
 * The physical model of Central: its seven buildings and the shared basements (central plant, car
 * park), in the shape the platform's screens expect. Buildings, outlines and notes come from
 * model/central/project.ts (EL served-equipment tables); floor lists are assumed — the submittal only
 * fixes the roof (FAHU, fans) and Basements B1/B2.
 */

export interface Building {
  id: string;
  label: string;
  /** What the submittal says about it. */
  use: string;
  /** Footprint on the site plan, stage coordinates. */
  outline: string;
  /** Tooltip anchor. */
  anchor: { x: number; y: number };
  floors: FloorDef[];
  detailed: boolean;
}

export interface FloorDef {
  id: string;
  label: string;
}

const floors = (...ids: string[]): FloorDef[] => ids.map((id) => ({ id: id.toLowerCase(), label: id }));
const FLOORS: Record<string, FloorDef[]> = {
  b01: floors('RF', 'L03', 'L02', 'L01', 'GF'),
  b02: floors('RF', 'L03', 'L02', 'L01', 'GF'),
  b03: floors('RF', 'L03', 'L02', 'L01', 'GF'),
  b04: floors('RF', 'L03', 'L02', 'L01', 'GF'),
  b05: floors('RF', 'L03', 'L02', 'L01', 'GF'),
  b06: floors('RF', 'L01', 'GF'),
  b07: floors('RF', 'L02', 'L01', 'GF'),
  bs: floors('B1', 'B2'),
};

export const BUILDINGS: Building[] = ZONES.map((z) => ({
  id: z.id,
  label: z.short,
  use: z.note,
  outline: z.outline,
  anchor: z.anchor,
  floors: FLOORS[z.id],
  detailed: false,
}));

export const buildingById = (id: string | undefined) => BUILDINGS.find((b) => b.id === id);

/**
 * Fire zones on the Fire System map, west to east (map x ranges in the map's own coordinates), and
 * the buildings each holds. The fire drill raises Zone 1 (Buildings 03 and 04).
 */
export const FIRE_ZONES = [
  { id: 1, label: 'Zone 1', x0: 1260, x1: 1788, buildings: ['b03', 'b04'] },
  { id: 2, label: 'Zone 2', x0: 690, x1: 1260, buildings: ['b02', 'b05'] },
  { id: 3, label: 'Zone 3', x0: 131, x1: 690, buildings: ['b01', 'b06', 'b07'] },
];

/** The buildings in fire mode during the drill. */
export const FIRE_DRILL_BUILDINGS = FIRE_ZONES[0].buildings;

/**
 * Block plan used by the Fire System map (map coordinates: x 131–1788, y 534–899): the buildings of
 * each zone side by side, the basements as a band underneath.
 */
export const FIRE_MAP_BLOCKS: { id: string; label: string; x: number; y: number; w: number; h: number }[] = [
  { id: 'b07', label: 'B07', x: 170, y: 600, w: 140, h: 190 },
  { id: 'b01', label: 'B01', x: 335, y: 590, w: 160, h: 200 },
  { id: 'b06', label: 'B06', x: 520, y: 610, w: 140, h: 180 },
  { id: 'b02', label: 'B02', x: 740, y: 585, w: 210, h: 205 },
  { id: 'b05', label: 'B05', x: 990, y: 590, w: 220, h: 200 },
  { id: 'b03', label: 'B03', x: 1300, y: 580, w: 220, h: 210 },
  { id: 'b04', label: 'B04', x: 1550, y: 595, w: 200, h: 195 },
  { id: 'bs', label: 'BASEMENTS B1 · B2', x: 170, y: 815, w: 1580, h: 56 },
];

/** The blocks that light up for a Zone 1 alarm. */
export const ZONE1_ALARM_BLOCKS = FIRE_MAP_BLOCKS.filter((b) => FIRE_DRILL_BUILDINGS.includes(b.id)).map((b) => `M${b.x + 6} ${b.y}H${b.x + b.w - 6}Q${b.x + b.w} ${b.y} ${b.x + b.w} ${b.y + 6}V${b.y + b.h - 6}Q${b.x + b.w} ${b.y + b.h} ${b.x + b.w - 6} ${b.y + b.h}H${b.x + 6}Q${b.x} ${b.y + b.h} ${b.x} ${b.y + b.h - 6}V${b.y + 6}Q${b.x} ${b.y} ${b.x + 6} ${b.y}Z`);
