/**
 * Central's information architecture: nine systems across the top, each with its subsystems along
 * the bottom (the systems in the submittal's integration matrices, plus Command and CAFM). Everything that renders navigation (top orbs, bottom
 * tabs, breadcrumbs, routes) reads this one table.
 */

export type SystemId = 'site' | 'command' | 'hvac' | 'electric' | 'metering' | 'safety' | 'security' | 'facilities' | 'cafm';

export type GlyphId =
  | 'location'
  | 'fire'
  | 'bolt'
  | 'community'
  | 'meter'
  | 'shield'
  | 'wrench'
  | 'fan'
  | 'waste'
  | 'gear';

export interface Subsystem {
  id: string;
  label: string;
}

export interface SystemDef {
  id: SystemId;
  label: string;
  glyph: GlyphId;
  /** Empty for 3D View, which has no tabs (clicking a building scopes the KPIs to it). */
  subsystems: Subsystem[];
}

export const SYSTEMS: SystemDef[] = [
  { id: 'site', label: 'Site', glyph: 'location', subsystems: [] },
  {
    id: 'command',
    label: 'Command',
    glyph: 'community',
    subsystems: [
      { id: 'executive', label: 'Executive' },
      { id: 'operations', label: 'Operations' },
      { id: 'kpis', label: 'KPI Register' },
      { id: 'sops', label: 'SOP Library' },
      { id: 'coverage', label: 'Data Coverage' },
    ],
  },
  {
    id: 'hvac',
    label: 'HVAC',
    glyph: 'fan',
    subsystems: [
      { id: 'plant', label: 'Chiller Plant' },
      { id: 'towers', label: 'Heat Rejection' },
      { id: 'air', label: 'Air Handling' },
      { id: 'fcu', label: 'Fan Coil Units' },
      { id: 'carpark', label: 'Car Park' },
      { id: 'ventilation', label: 'Ventilation' },
    ],
  },
  {
    id: 'electric',
    label: 'Electric',
    glyph: 'bolt',
    subsystems: [
      { id: 'mv', label: 'MV & Transformers' },
      { id: 'distribution', label: 'Distribution' },
      { id: 'standby', label: 'Generators & ATS' },
      { id: 'ups', label: 'UPS' },
      { id: 'sld', label: 'SLD' },
    ],
  },
  {
    id: 'metering',
    label: 'Metering',
    glyph: 'meter',
    subsystems: [
      { id: 'btu', label: 'Cooling Meters' },
      { id: 'billing', label: 'Cooling Billing' },
      { id: 'energy', label: 'Energy' },
    ],
  },
  {
    id: 'safety',
    label: 'Life Safety',
    glyph: 'fire',
    subsystems: [
      { id: 'fire', label: 'Fire Alarm' },
      { id: 'smoke', label: 'Smoke Control' },
      { id: 'pa', label: 'Public Address' },
    ],
  },
  {
    id: 'security',
    label: 'Security',
    glyph: 'shield',
    subsystems: [
      { id: 'cctv', label: 'CCTV' },
      { id: 'access', label: 'Access Control' },
    ],
  },
  {
    id: 'facilities',
    label: 'Facilities',
    glyph: 'wrench',
    subsystems: [
      { id: 'transport', label: 'Lifts & Escalators' },
      { id: 'drainage', label: 'Drainage' },
      { id: 'lighting', label: 'Lighting' },
    ],
  },
  {
    id: 'cafm',
    label: 'CAFM',
    glyph: 'gear',
    subsystems: [
      { id: 'orders', label: 'Work Orders' },
      { id: 'ppm', label: 'PPM Plan' },
      { id: 'assets', label: 'Asset Register' },
    ],
  },
];

export const systemById = (id: string | undefined) => SYSTEMS.find((s) => s.id === id);

export function systemPath(system: SystemDef): string {
  return system.subsystems.length ? `/${system.id}/${system.subsystems[0].id}` : '/';
}

export const subsystemPath = (system: SystemId, sub: string) => `/${system}/${sub}`;
