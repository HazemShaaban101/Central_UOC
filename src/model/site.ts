import { ZONES, zoneById, type Zone } from '@/model/central/project';

/**
 * The scopes the KPIs can be filtered by: Central's seven buildings and the shared basements (central
 * plant, car park). A thin view over model/central/project.ts, kept for the chrome (scope switcher,
 * breadcrumbs) that predates the Central model.
 */
export interface Building {
  id: string;
  label: string;
  use: string;
  zone: Zone;
}

export const BUILDINGS: Building[] = ZONES.map((z) => ({ id: z.id, label: z.short, use: z.note, zone: z }));

export const buildingById = (id: string | undefined) => {
  const z = zoneById(id);
  return z ? BUILDINGS.find((b) => b.id === z.id) : undefined;
};
