/**
 * Central (Fifth Settlement, New Cairo): the project as the BMS technical submittal describes it
 * (Schneider Electric / ACS, documents CNC0926-BMS-2254-SA / RD / EL / DS, REV-13, September 2026).
 * Every count below is taken from the Equipment List (served equipment per building and the BoQ) and
 * the Riser Diagram; nothing here is invented except the site-plan geometry, which is schematic.
 */

export const PROJECT = {
  name: 'Central',
  location: 'Fifth Settlement, New Cairo',
  client: 'RMC',
  bmsVendor: 'Schneider Electric · EcoStruxure Building Operation',
  integrator: 'Advanced Control Systems (ACS)',
  supervisory: 'AVEVA System Platform · Operations Control Supervisory',
  submittal: 'CNC0926-BMS-2254 · REV-13 · Sep 2026',
  documents: [
    { code: 'CNC0926-BMS-2254-SA', title: 'System Architecture & Integration Matrix' },
    { code: 'CNC0926-BMS-2254-RD', title: 'Riser Diagram (9 sheets)' },
    { code: 'CNC0926-BMS-2254-EL', title: 'Equipment List, BoQ, I/O List, Schematics' },
    { code: 'CNC0926-BMS-2254-DS', title: 'Data Sheets' },
  ],
} as const;

export type ZoneId = 'b01' | 'b02' | 'b03' | 'b04' | 'b05' | 'b06' | 'b07' | 'bs';

export interface Zone {
  id: ZoneId;
  label: string;
  short: string;
  /** What the submittal tells us about it (no assumed building use). */
  note: string;
  /** Local control panels on the riser (LCP-…). */
  lcps: string[];
  /** Footprint on the schematic site plan (stage coordinates). */
  outline: string;
  anchor: { x: number; y: number };
  /** Share of the project's electrical and cooling totals, for scoped KPIs. */
  share: number;
}

const lcps = (prefix: string, n: number) => Array.from({ length: n }, (_, i) => `${prefix}-${String(i + 1).padStart(2, '0')}`);

/**
 * Schematic site plan: seven buildings around a central plaza, over a two-level basement (dashed).
 * Geometry is illustrative only; the submittal has no site layout.
 */
export const ZONES: Zone[] = [
  { id: 'b01', label: 'Building 01', short: 'B01', note: '4 FAHU · 56 FCU · 105 BTU meters · 9 lifts', lcps: lcps('LCP-B01-ROOF', 2), outline: 'M560 330 L760 300 L790 470 L590 500 Z', anchor: { x: 675, y: 300 }, share: 0.13 },
  { id: 'b02', label: 'Building 02', short: 'B02', note: '4 FAHU · 56 FCU · 105 BTU meters · 9 lifts', lcps: lcps('LCP-B02-ROOF', 2), outline: 'M840 270 L1060 250 L1075 420 L855 440 Z', anchor: { x: 955, y: 250 }, share: 0.13 },
  { id: 'b03', label: 'Building 03', short: 'B03', note: '4 FAHU · 6 cooling towers · 50 FCU · 176 BTU meters', lcps: lcps('LCP-B03-ROOF', 2), outline: 'M1140 260 L1370 290 L1340 470 L1115 440 Z', anchor: { x: 1250, y: 262 }, share: 0.17 },
  { id: 'b04', label: 'Building 04', short: 'B04', note: '4 FAHU · 58 FCU · 118 BTU meters · 9 lifts', lcps: lcps('LCP-B04-ROOF', 2), outline: 'M1210 560 L1420 540 L1450 720 L1235 745 Z', anchor: { x: 1330, y: 540 }, share: 0.14 },
  { id: 'b05', label: 'Building 05', short: 'B05', note: '4 FAHU · 64 FCU · 118 BTU meters · 9 lifts', lcps: lcps('LCP-B05-ROOF', 2), outline: 'M920 610 L1140 600 L1150 790 L925 800 Z', anchor: { x: 1035, y: 600 }, share: 0.15 },
  { id: 'b06', label: 'Building 06', short: 'B06', note: '4 AHU + 1 FAHU · 9 FCU · 15 BTU meters · 5 lifts', lcps: lcps('LCP-B06-ROOF', 1), outline: 'M640 590 L840 600 L830 770 L620 760 Z', anchor: { x: 735, y: 590 }, share: 0.1 },
  { id: 'b07', label: 'Building 07', short: 'B07', note: '5 FAHU · 17 kitchen make-up fans · 10 FCU · 5 lifts', lcps: lcps('LCP-B07-ROOF', 5), outline: 'M420 560 L560 545 L575 760 L430 770 Z', anchor: { x: 495, y: 545 }, share: 0.08 },
  { id: 'bs', label: 'Basements B1 · B2', short: 'BS', note: 'Central chiller plant · 192 car-park fans · 352 FCU · 32 sump sets', lcps: [...lcps('LCP-BS1', 16), ...lcps('LCP-BS2', 16)], outline: 'M380 280 L1480 230 L1520 840 L400 860 Z', anchor: { x: 1490, y: 250 }, share: 0.1 },
];

export const BUILDINGS = ZONES.filter((z) => z.id !== 'bs');
export const zoneById = (id: string | undefined) => ZONES.find((z) => z.id === id);

/** Where each piece of data comes from, from most to least certain. Shown on every KPI, SOP and point. */
export type SourceTier = 'io' | 'bms' | 'aveva' | 'calc' | 'assumed';

export const TIERS: Record<SourceTier, { label: string; short: string; color: string; desc: string }> = {
  io: { label: 'Proven · BMS hardwired I/O', short: 'I/O', color: '#7fcf9d', desc: 'Listed point-by-point in the EL I/O list and schematics (DI / DO / AI / AO on MP-C / AS-P controllers).' },
  bms: { label: 'Proven · BMS integration', short: 'BMS INT', color: '#9d78ff', desc: 'Software interface in the BMS integration matrix (Modbus RTU / BACnet IP); registers per the device data sheet.' },
  aveva: { label: 'In scope · AVEVA integration', short: 'AVEVA INT', color: '#b58ce3', desc: 'Software interface in the AVEVA integration matrix; register map supplied by the system vendor (by others).' },
  calc: { label: 'Calculated', short: 'CALC', color: '#d9cbe6', desc: 'Computed in the platform from proven points (no extra hardware).' },
  assumed: { label: 'Assumed · system by others', short: 'ASSUMED', color: '#e8a98c', desc: 'Third-party system (fire, PA, CCTV, access, CAFM): content assumed from industry practice, to be confirmed with its vendor.' },
};
