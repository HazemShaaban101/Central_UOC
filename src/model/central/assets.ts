import type { AttrValues, TemplateDef } from '@/model/assets/galaxy';
import { hash01, wander, clamp } from '@/model/assets/galaxy';
import { ZONES, type SourceTier, type ZoneId } from '@/model/central/project';
import * as T from '@/model/central/templates';
import { PROFILES } from '@/sim/signals';

/**
 * Every piece of equipment on Central, generated from the Equipment List's served-equipment tables
 * (counts per building / basement) and the riser (which LCP serves it). Values are simulated, but
 * each asset only carries the points its template says the submittal can deliver.
 */

export type AssetKind =
  | 'chiller' | 'pchwp' | 'cwp' | 'ct' | 'aux'
  | 'fahu' | 'ahu' | 'crac' | 'fcu'
  | 'btuT' | 'btuB'
  | 'exhaust' | 'makeup' | 'kmakeup' | 'smoke' | 'press' | 'pef' | 'psf'
  | 'sump'
  | 'gen' | 'tr' | 'rmu' | 'ats' | 'mdb' | 'emdb' | 'mcc' | 'emcc' | 'ups'
  | 'elv' | 'esc'
  | 'facp' | 'pa';

export type Domain = 'hvac' | 'vent' | 'safety' | 'electric' | 'metering' | 'transport' | 'drainage';

interface KindDef {
  label: string;
  plural: string;
  domain: Domain;
  template: TemplateDef;
  tier: SourceTier;
}

export const KINDS: Record<AssetKind, KindDef> = {
  chiller: { label: 'Chiller', plural: 'Chillers', domain: 'hvac', template: T.CHILLER, tier: 'io' },
  pchwp: { label: 'CHW Pump', plural: 'Primary CHW pumps', domain: 'hvac', template: T.PCHWP, tier: 'io' },
  cwp: { label: 'CW Pump', plural: 'Condenser-water pumps', domain: 'hvac', template: T.CWP, tier: 'io' },
  ct: { label: 'Cooling Tower', plural: 'Cooling towers', domain: 'hvac', template: T.COOLING_TOWER, tier: 'io' },
  aux: { label: 'Plant Package', plural: 'Expansion tanks & water treatment', domain: 'hvac', template: T.PLANT_AUX, tier: 'io' },
  fahu: { label: 'FAHU', plural: 'Fresh air handling units', domain: 'hvac', template: T.FAHU, tier: 'io' },
  ahu: { label: 'AHU', plural: 'Air handling units', domain: 'hvac', template: T.AHU, tier: 'io' },
  crac: { label: 'CRAC', plural: 'Computer room A/C', domain: 'hvac', template: T.CRAC, tier: 'bms' },
  fcu: { label: 'FCU', plural: 'Fan coil units', domain: 'hvac', template: T.FCU, tier: 'bms' },
  btuT: { label: 'Energy Valve', plural: 'Tenant energy valves (SP90)', domain: 'metering', template: T.BTU_TENANT, tier: 'bms' },
  btuB: { label: 'BTU Meter', plural: 'Bulk BTU meters (Kamstrup)', domain: 'metering', template: T.BTU_BULK, tier: 'bms' },
  exhaust: { label: 'Exhaust Fan', plural: 'Exhaust fans', domain: 'vent', template: T.FAN, tier: 'io' },
  makeup: { label: 'Make-Up Fan', plural: 'Make-up fans', domain: 'vent', template: T.FAN, tier: 'io' },
  kmakeup: { label: 'Kitchen MAF', plural: 'Kitchen make-up fans', domain: 'vent', template: T.FAN, tier: 'io' },
  smoke: { label: 'Smoke Fan', plural: 'Smoke extract fans', domain: 'safety', template: T.SMOKE_FAN, tier: 'io' },
  press: { label: 'Press. Fan', plural: 'Stair pressurisation fans', domain: 'safety', template: T.PRESS_FAN, tier: 'io' },
  pef: { label: 'Car Park EF', plural: 'Car-park exhaust fans', domain: 'vent', template: T.PARK_EXHAUST, tier: 'io' },
  psf: { label: 'Car Park SF', plural: 'Car-park supply fans', domain: 'vent', template: T.PARK_SUPPLY, tier: 'io' },
  sump: { label: 'Sump Set', plural: 'Duplex submersible pump sets', domain: 'drainage', template: T.SUMP, tier: 'io' },
  gen: { label: 'Generator', plural: 'Generators', domain: 'electric', template: T.GENSET, tier: 'aveva' },
  tr: { label: 'Transformer', plural: 'Transformers', domain: 'electric', template: T.TRANSFORMER, tier: 'aveva' },
  rmu: { label: 'RMU', plural: 'Ring main units', domain: 'electric', template: T.RMU, tier: 'aveva' },
  ats: { label: 'ATS', plural: 'Transfer switches', domain: 'electric', template: T.ATS, tier: 'aveva' },
  mdb: { label: 'MDB', plural: 'Main distribution boards', domain: 'electric', template: T.DPM, tier: 'aveva' },
  emdb: { label: 'EMDB', plural: 'Emergency MDBs', domain: 'electric', template: T.DPM, tier: 'aveva' },
  mcc: { label: 'MCC', plural: 'Motor control centres', domain: 'electric', template: T.DPM, tier: 'aveva' },
  emcc: { label: 'EMCC', plural: 'Emergency MCCs', domain: 'electric', template: T.DPM, tier: 'aveva' },
  ups: { label: 'UPS', plural: 'UPS units', domain: 'electric', template: T.UPS, tier: 'aveva' },
  elv: { label: 'Elevator', plural: 'Elevators', domain: 'transport', template: T.ELEVATOR, tier: 'aveva' },
  esc: { label: 'Escalator', plural: 'Escalators', domain: 'transport', template: T.ESCALATOR, tier: 'aveva' },
  facp: { label: 'Fire Panel', plural: 'Fire alarm panels', domain: 'safety', template: T.FACP, tier: 'assumed' },
  pa: { label: 'PA Rack', plural: 'Public address racks', domain: 'safety', template: T.PA, tier: 'assumed' },
};

export interface Asset {
  tag: string;
  label: string;
  kind: AssetKind;
  zone: ZoneId;
  /** Local control panel / gateway it is wired or networked to. */
  panel: string;
  /** 0-based index within its kind (rotation, lead/lag). */
  n: number;
}

/* =================================================================================================
 * Registry (EL "Served Equipment" tables)
 * ================================================================================================= */

type Row = [AssetKind, string, number, string?];

const ROOF_STD = (b: string, pressLabel = 'PR'): Row[] => [
  ['fahu', 'FAHU', 4, `LCP-${b}-ROOF`],
  ['exhaust', 'T-EAF', 2, `LCP-${b}-ROOF`],
  ['smoke', 'SMK.F', 2, `LCP-${b}-ROOF`],
  ['makeup', 'MAF', 4, `LCP-${b}-ROOF`],
  ['press', pressLabel, 4, `LCP-${b}-ROOF`],
];

const ELEC = (gen: number, mdb: number, emdb: number, mcc: number, emcc: number, ats: number, rmu: number, tr: number): Row[] => [
  ['gen', 'GEN', gen],
  ['mdb', 'MDB', mdb],
  ['emdb', 'EMDB', emdb],
  ['mcc', 'MCC', mcc],
  ['emcc', 'EMCC', emcc],
  ['ats', 'ATS', ats],
  ['rmu', 'RMU', rmu],
  ['tr', 'TR', tr],
];

/** Per zone: [kind, label prefix, quantity, panel prefix]. FAHU numbering is project-wide (FAHU-01…26). */
const SERVED: Record<ZoneId, Row[]> = {
  b01: [...ROOF_STD('B01'), ['fcu', 'FCU', 56], ['btuT', 'EV', 97], ['btuB', 'BTU', 8], ...ELEC(2, 2, 2, 2, 2, 2, 2, 2), ['elv', 'ELV', 9], ['facp', 'FACP', 1], ['pa', 'PA', 1]],
  b02: [...ROOF_STD('B02'), ['fcu', 'FCU', 56], ['btuT', 'EV', 97], ['btuB', 'BTU', 8], ...ELEC(2, 2, 2, 2, 2, 2, 2, 2), ['elv', 'ELV', 9], ['facp', 'FACP', 1], ['pa', 'PA', 1]],
  b03: [['ct', 'CT', 6, 'LCP-B03-ROOF'], ...ROOF_STD('B03', 'PF'), ['fcu', 'FCU', 50], ['btuT', 'EV', 173], ['btuB', 'BTU', 3], ...ELEC(2, 2, 2, 2, 2, 2, 2, 2), ['elv', 'ELV', 8], ['facp', 'FACP', 1], ['pa', 'PA', 1]],
  b04: [...ROOF_STD('B04'), ['fcu', 'FCU', 58], ['btuT', 'EV', 107], ['btuB', 'BTU', 11], ...ELEC(2, 2, 2, 2, 2, 2, 2, 2), ['elv', 'ELV', 9], ['facp', 'FACP', 1], ['pa', 'PA', 1]],
  b05: [...ROOF_STD('B05'), ['fcu', 'FCU', 64], ['btuT', 'EV', 107], ['btuB', 'BTU', 11], ...ELEC(2, 2, 2, 2, 2, 2, 2, 2), ['elv', 'ELV', 9], ['facp', 'FACP', 1], ['pa', 'PA', 1]],
  b06: [['ahu', 'AHU', 4, 'LCP-B06-ROOF'], ['fahu', 'FAHU', 1, 'LCP-B06-ROOF'], ['exhaust', 'G-EAF', 1, 'LCP-B06-ROOF'], ['fcu', 'FCU', 9], ['btuT', 'EV', 8], ['btuB', 'BTU', 7], ...ELEC(1, 1, 1, 1, 1, 1, 1, 1), ['elv', 'ELV', 5], ['facp', 'FACP', 1], ['pa', 'PA', 1]],
  b07: [['fahu', 'FAHU', 5, 'LCP-B07-ROOF'], ['exhaust', 'G-EAF', 5, 'LCP-B07-ROOF'], ['exhaust', 'T-EAF', 5, 'LCP-B07-ROOF'], ['kmakeup', 'K-MAF', 17, 'LCP-B07-ROOF'], ['fcu', 'FCU', 10], ['btuT', 'EV', 1], ['btuB', 'BTU', 17], ...ELEC(2, 2, 2, 5, 2, 2, 2, 2), ['elv', 'ELV', 5], ['facp', 'FACP', 1], ['pa', 'PA', 1]],
  bs: [
    ['chiller', 'CH', 6, 'LCP-BS1-03'],
    ['pchwp', 'PCHWP', 7, 'LCP-BS1-03'],
    ['cwp', 'CWP', 7, 'LCP-BS1-03'],
    ['aux', 'EX.T', 2, 'LCP-BS1-03'],
    ['aux', 'WTS', 2, 'LCP-BS1-03'],
    ['crac', 'CRAC', 2, 'LCP-BS1-03'],
    ['pef', 'P.EX.F', 96],
    ['psf', 'P.S.F', 96],
    ['fcu', 'FCU', 352],
    ['sump', 'SUB.P', 32, 'LCP-BS2'],
    ...ELEC(6, 9, 6, 7, 76, 7, 9, 9),
    ['ups', 'UPS', 9],
    ['esc', 'ES', 19],
    ['facp', 'FACP', 1],
    ['pa', 'PA', 1],
  ],
};

const pad = (n: number) => String(n).padStart(2, '0');

function build(): Asset[] {
  const out: Asset[] = [];
  let fahuNo = 0;
  let ahuNo = 26;
  const kindCount: Partial<Record<AssetKind, number>> = {};
  for (const z of ZONES) {
    const zi = z.short;
    for (const [kind, prefix, qty, panel] of SERVED[z.id]) {
      for (let i = 0; i < qty; i++) {
        const n = kindCount[kind] ?? 0;
        kindCount[kind] = n + 1;
        let label: string;
        if (kind === 'fahu') label = `FAHU-${pad(++fahuNo)}`;
        else if (kind === 'ahu') label = `AHU-${pad(++ahuNo)}`;
        else if (z.id === 'bs' || kind === 'ct') label = `${prefix}-${pad(i + 1)}`;
        else label = `${zi}-${prefix}-${pad(i + 1)}`;
        // Car-park fans: 48 per basement level, 6 per LCP (riser sheets 8 and 9).
        let p = panel ?? '';
        if (kind === 'pef' || kind === 'psf') {
          const level = i < 48 ? 'BS1' : 'BS2';
          p = `LCP-${level}-${pad(Math.floor((i % 48) / 6) * 2 + (kind === 'pef' ? 1 : 2))}`;
          label = `${level}-${prefix}-${pad((i % 48) + 1)}`;
        } else if (kind === 'fcu' || kind === 'btuT' || kind === 'btuB') {
          p = `PAS600 · ${zi}`;
        } else if (KINDS[kind].tier === 'aveva' || KINDS[kind].tier === 'assumed') {
          p = 'AVEVA · ' + (kind === 'elv' || kind === 'esc' || kind === 'ups' ? 'Modbus TCP' : kind === 'facp' || kind === 'pa' ? 'BACnet IP' : 'Modbus RTU');
        } else if (p.startsWith('LCP') && !/\d$/.test(p)) {
          p = `${p}-${pad((i % (z.lcps.length || 1)) + 1)}`;
        }
        if (kind === 'sump') p = `LCP-BS2-${pad(Math.floor(i / 2) + 1)}`;
        out.push({ tag: label.replace(/[.\-]/g, '_'), label, kind, zone: z.id, panel: p, n });
      }
    }
  }
  return out;
}

export const ASSETS: Asset[] = build();
export const assetByTag = (tag: string | undefined) => ASSETS.find((a) => a.tag === tag);
export const assetsOf = (kinds: AssetKind[], zone?: string) => ASSETS.filter((a) => kinds.includes(a.kind) && (!zone || zone === 'project' || a.zone === zone));
export const countOf = (kind: AssetKind) => ASSETS.filter((a) => a.kind === kind).length;

/* =================================================================================================
 * Simulation
 * ================================================================================================= */

export type Status = 'run' | 'standby' | 'off' | 'manual' | 'fault' | 'alarm' | 'offline';
export type Severity = 'critical' | 'major' | 'minor';

export interface AssetAlarm {
  text: string;
  severity: Severity;
  /** SOP that handles it (model/central/sops.ts). */
  sop: string;
}

export interface AssetState {
  status: Status;
  values: AttrValues;
  alarm: AssetAlarm | null;
  /** Primary reading for tables (e.g. "22.4 °C", "74 %"). */
  reading: string;
}

export interface SimContext {
  /** Fire drill: the zone in fire mode (smoke control running, FAHUs off, lifts recalled). */
  fireZone: ZoneId | null;
  mainsFailed: boolean;
}

const hourOf = (t: number) => {
  const d = new Date(t);
  return d.getHours() + d.getMinutes() / 60;
};
const prof = (name: keyof typeof PROFILES, t: number) => {
  const h = hourOf(t);
  const p = PROFILES[name];
  const i = Math.floor(h) % 24;
  return p[i] + (p[(i + 1) % 24] - p[i]) * (h - Math.floor(h));
};

/** A deterministic event chance for an asset that holds for a window (an alarm stays up for a while). */
const chance = (tag: string, t: number, salt: string, windowMin = 90) => hash01(`${tag}|${salt}|${Math.floor(t / (windowMin * 60_000))}`);

/** Cooling load factor 0..1 (afternoon peak). */
export const coolingLoad = (t: number) => prof('hvac', t);
/** How many of the 6 chillers the plant runs now (staging on load). */
export const chillersStaged = (t: number) => clamp(Math.ceil(coolingLoad(t) * 5.6), 2, 6);
export const outdoorTemp = (t: number) => 24 + 13 * prof('hvac', t) + wander('oat', t, 0, 0.6, 30);

const r1 = (v: number) => Math.round(v * 10) / 10;

export function simulate(a: Asset, t: number, ctx: SimContext): AssetState {
  const v: AttrValues = {};
  let status = 'run' as Status;
  let alarm = null as AssetAlarm | null;
  let reading = '';
  const h = hourOf(t);
  const tag = a.tag;
  const fire = ctx.fireZone !== null && (ctx.fireZone === a.zone || ctx.fireZone === 'bs' && a.zone === 'bs');
  const set = (k: string, x: number | boolean | string | null) => (v[k] = x);
  const raise = (text: string, severity: Severity, sop: string) => {
    if (!alarm || rank(severity) > rank(alarm.severity)) alarm = { text, severity, sop };
  };
  const starterSim = (running: boolean, tripRate: number, handRate: number, sopTrip: string, sevTrip: Severity = 'major') => {
    const tripped = chance(tag, t, 'trip') < tripRate;
    const hand = !tripped && chance(tag, t, 'hand', 240) < handRate;
    const run = running && !tripped;
    set('Cmd_Start', running);
    set('Sts_Run', run);
    set('Sts_Auto', !hand);
    set('Alm_Trip', tripped);
    set('Airflow_DPS', run);
    status = tripped ? 'fault' : hand ? 'manual' : run ? 'run' : 'standby';
    if (tripped) raise(`${KINDS[a.kind].label} trip`, sevTrip, sopTrip);
    else if (hand) raise('Starter left in Hand', 'minor', 'SOP-GN-02');
    return run;
  };

  switch (a.kind) {
    case 'chiller': {
      const staged = chillersStaged(t);
      const lead = Math.floor(t / 86_400_000) % 6;
      const order = (a.n - lead + 6) % 6;
      const fault = chance(tag, t, 'fault', 180) < 0.035;
      const running = order < staged && !fault;
      const load = running ? clamp(55 + 40 * coolingLoad(t) + wander(tag, t, 0, 6), 30, 100) : 0;
      set('Cmd_Start', order < staged);
      set('Sts_Run', running);
      set('Alm_Fault', fault);
      set('Cmd_CHW_Valve', running);
      set('Sts_CHW_Valve', running);
      set('Cmd_CW_Valve', running);
      set('Sts_CW_Valve', running);
      set('CHW_Flow_Sw', running);
      set('CW_Flow_Sw', running);
      const sp = 6.7;
      set('CHW_Setpoint', sp);
      set('CHWS_Temp', r1(running ? sp + wander(tag + 's', t, 0.2, 0.3, 5) : 14 + wander(tag, t, 0, 0.5)));
      set('CHWR_Temp', r1(running ? sp + 4.6 + wander(tag + 'r', t, 0.3, 0.6, 7) : 14.4));
      set('CHW_Press', Math.round(running ? 320 + wander(tag + 'p', t, 0, 12) : 210));
      set('CWS_Temp', r1(running ? 29.5 + 3 * coolingLoad(t) + wander(tag + 'c', t, 0, 0.4) : 28));
      set('CWR_Temp', r1(running ? 34.6 + 3 * coolingLoad(t) + wander(tag + 'd', t, 0, 0.4) : 28.2));
      set('Load_Pct', Math.round(load));
      const tr = running ? (load / 100) * 1000 : 0;
      const kwPerTr = running ? 0.56 + 0.12 * (1 - load / 100) + wander(tag + 'k', t, 0, 0.02, 11) : 0;
      set('Power_kW', Math.round(tr * kwPerTr));
      set('Cooling_TR', Math.round(tr));
      set('kW_per_TR', running ? Math.round(kwPerTr * 100) / 100 : null);
      set('Run_Hours', Math.round(18_000 + hash01(tag) * 6000 + t / 3_600_000 / 2.2 - 245_000));
      status = fault ? 'fault' : running ? 'run' : 'standby';
      if (fault) raise('Chiller general fault', 'critical', 'SOP-HV-01');
      reading = running ? `${Math.round(load)} % · ${v.CHWS_Temp} °C` : fault ? 'Fault' : 'Standby';
      break;
    }
    case 'pchwp':
    case 'cwp': {
      const staged = chillersStaged(t);
      const lead = Math.floor(t / 86_400_000) % 7;
      const order = (a.n % 7 - lead + 7) % 7;
      const run = starterSim(order < staged, 0.03, 0.04, 'SOP-HV-02');
      const speed = run ? clamp(62 + 30 * coolingLoad(t) + wander(tag, t, 0, 4), 40, 100) : 0;
      set('Flow_DPS', run);
      set('Speed_Cmd', Math.round(speed));
      set('Speed_Fb', Math.round(speed - (run ? 0.6 : 0)));
      if (a.kind === 'pchwp') {
        const kw = run ? 55 * (speed / 100) ** 3 : 0;
        set('Motor_kW', r1(kw));
        set('Motor_Current', r1(kw * 1.62));
        set('Energy_kWh', Math.round(90_000 + hash01(tag) * 40_000));
        set('Fault_Code', 0);
      }
      set('Run_Hours', Math.round(9000 + hash01(tag) * 9000));
      reading = run ? `${Math.round(speed)} %` : status === 'fault' ? 'Trip' : 'Standby';
      break;
    }
    case 'ct': {
      const staged = chillersStaged(t);
      const run = starterSim(a.n < staged, 0.03, 0.03, 'SOP-HV-03');
      const speed = run ? clamp(48 + 45 * coolingLoad(t) + wander(tag, t, 0, 5), 30, 100) : 0;
      set('Speed_Cmd', Math.round(speed));
      set('Speed_Fb', Math.round(speed));
      const low = chance(tag, t, 'basin', 120) < 0.025;
      set('Basin_Level_Sw', low);
      set('Cmd_Valve', run);
      set('Sts_Valve', run);
      const oat = outdoorTemp(t);
      const wb = oat - 11;
      const out = wb + 4 + wander(tag + 'a', t, 0, 0.5);
      set('CW_Out_Temp', r1(run ? out : oat - 3));
      set('Approach_K', run ? r1(out - wb) : null);
      if (low) raise('Basin low level', 'major', 'SOP-HV-03');
      reading = run ? `${Math.round(speed)} % · ${r1(out)} °C` : status === 'fault' ? 'Trip' : 'Standby';
      break;
    }
    case 'aux': {
      const fault = chance(tag, t, 'f', 240) < 0.04;
      set('Sts_Normal', !fault);
      set('Alm_Fault', fault);
      status = fault ? 'fault' : 'run';
      if (fault) raise(a.label.startsWith('WTS') ? 'Water treatment fault' : 'Pressurisation unit fault', 'major', 'SOP-HV-04');
      reading = fault ? 'Fault' : 'Normal';
      break;
    }
    case 'fahu':
    case 'ahu': {
      const sched = a.zone === 'b07' ? h >= 7 || h < 1 : h >= 6;
      const smoke = chance(tag, t, 'smoke', 360) < 0.004;
      const run = starterSim(sched && !fire && !smoke, 0.025, 0.03, 'SOP-HV-05');
      const valve = run ? clamp(40 + 55 * coolingLoad(t) + wander(tag, t, 0, 6), 0, 100) : 0;
      const sat = run ? 14 + (valve > 97 ? 2.5 : 0) + wander(tag + 't', t, 0.3, 0.6, 6) : outdoorTemp(t) - 2;
      const pre = chance(tag, t, 'pre', 720) < 0.07;
      const bag = chance(tag, t, 'bag', 720) < 0.05;
      set('PreFilter_DPS', pre);
      set('BagFilter_DPS', bag);
      set('Valve_Cmd', Math.round(valve));
      set('Valve_Fb', Math.round(valve - (run ? 1 : 0)));
      set('Supply_Temp', r1(sat));
      if (a.kind === 'fahu') {
        set('Smoke_Det', smoke);
        set('Cmd_Damper', run);
        set('Sts_Damper', run);
        set('Supply_Setpoint', 14.5);
      } else {
        set('Smoke_Det_Supply', smoke);
        set('Smoke_Det_Return', false);
        const fa = run ? 30 + wander(tag + 'f', t, 0, 6) : 0;
        set('FA_Damper_Cmd', Math.round(fa));
        set('FA_Damper_Fb', Math.round(fa));
        set('RA_Damper_Cmd', run ? Math.round(100 - fa) : 0);
        set('Return_Temp', r1(24 + wander(tag + 'r', t, 0, 0.6)));
      }
      if (smoke) raise('Duct smoke detector', 'critical', 'SOP-LS-03');
      else if (fire && status !== 'fault') status = 'off';
      if (pre || bag) raise(`${bag ? 'Bag' : 'Pre'}-filter dirty`, 'minor', 'SOP-HV-06');
      if (run && sat > 17) raise('Supply air above set point', 'minor', 'SOP-HV-05');
      if (!sched && status === 'standby') status = 'off';
      reading = run ? `${r1(sat)} °C · valve ${Math.round(valve)} %` : fire ? 'Fire mode · off' : smoke ? 'Smoke trip' : status === 'fault' ? 'Trip' : 'Off (schedule)';
      break;
    }
    case 'crac': {
      const al = chance(tag, t, 'a', 240) < 0.03;
      const rt = 22.5 + wander(tag, t, 0, 0.8) + (al ? 3 : 0);
      set('Sts_Run', true);
      set('Alm_Common', al);
      set('Return_Temp', r1(rt));
      set('Supply_Temp', r1(rt - 9));
      set('Return_RH', Math.round(46 + wander(tag + 'h', t, 0, 4)));
      set('Setpoint', 23);
      status = al ? 'alarm' : 'run';
      if (al) raise('CRAC high return temperature', 'critical', 'SOP-HV-07');
      reading = `${r1(rt)} °C · ${v.Return_RH} %RH`;
      break;
    }
    case 'fcu': {
      const occ = a.zone === 'bs' ? prof('retail', t) : prof('office', t);
      const comm = chance(tag, t, 'comm', 180) > 0.006;
      const on = hash01(tag + Math.floor(t / 3_600_000)) < 0.15 + 0.8 * occ;
      const sp = 22 + Math.round(hash01(tag) * 6) / 2;
      const hot = on && chance(tag, t, 'hot', 120) < 0.018;
      const room = on ? sp + 0.3 + wander(tag, t, 0, 0.5, 6) + (hot ? 3.2 : 0) : 25.6 + wander(tag, t, 0, 0.8, 15);
      set('OnOff', comm ? on : null);
      set('Room_Temp', comm ? r1(room) : null);
      set('Setpoint', comm ? sp : null);
      set('Fan_Speed', comm ? (on ? 1 + Math.floor(hash01(tag + 'f') * 3) : 0) : null);
      set('Mode', comm ? (on ? 0 : 2) : null);
      set('Occupied', comm ? on : null);
      set('Valve_Out', comm ? (on ? Math.round(clamp(30 + (room - sp) * 25, 0, 100)) : 0) : null);
      set('Alm_Temp', comm ? hot : null);
      set('Comm_OK', comm);
      status = !comm ? 'offline' : hot ? 'alarm' : on ? 'run' : 'off';
      if (!comm) raise('Thermostat not communicating', 'minor', 'SOP-BM-01');
      else if (hot) raise('Room above set point +3 K', 'minor', 'SOP-HV-08');
      reading = comm ? `${r1(room)} / ${sp} °C` : 'No comm';
      break;
    }
    case 'btuT':
    case 'btuB': {
      const comm = chance(tag, t, 'comm', 240) > (a.kind === 'btuB' ? 0.012 : 0.008);
      const occ = prof('office', t) * 0.6 + prof('hvac', t) * 0.4;
      const size = a.kind === 'btuB' ? 140 : 6;
      const kw = size * (0.25 + 0.75 * occ) * (0.7 + hash01(tag) * 0.6) + wander(tag, t, 0, size * 0.05);
      const dt = 4.2 + wander(tag + 'dt', t, 0, 0.6, 9);
      const flow = kw / (1.163 * dt);
      const sup = 7.1 + wander(tag + 's', t, 0, 0.2);
      // Monotonic register: a base per meter plus what the profile delivered since an epoch.
      const base = (a.kind === 'btuB' ? 900 : 30) * (0.5 + hash01(tag));
      const accum = base + (size * 0.55 * 24 * ((t / 86_400_000) % 400)) / (a.kind === 'btuB' ? 1000 : 1);
      if (a.kind === 'btuB') {
        set('Energy_MWh', comm ? Math.round(accum * 100) / 100 : null);
        set('Volume_m3', comm ? Math.round(accum * 180) : null);
        set('Info_Code', comm ? (chance(tag, t, 'info', 720) < 0.03 ? 16 : 0) : null);
        if (comm && v.Info_Code) raise('Meter info code 16 (flow sensor)', 'minor', 'SOP-MT-01');
      } else {
        set('Energy_kWh', comm ? Math.round(accum) : null);
        set('Valve_Pos', comm ? Math.round(clamp(occ * 80 + wander(tag + 'v', t, 0, 8), 0, 100)) : null);
        set('DeltaT', comm ? r1(dt) : null);
      }
      set('Power_kW', comm ? r1(kw) : null);
      set('Flow_m3h', comm ? Math.round(flow * 100) / 100 : null);
      set('Supply_Temp', comm ? r1(sup) : null);
      set('Return_Temp', comm ? r1(sup + dt) : null);
      set('Comm_OK', comm);
      status = comm ? 'run' : 'offline';
      if (!comm) raise('Meter not communicating (billing data gap)', 'major', 'SOP-MT-01');
      else if (dt < 3.6) raise('Low ΔT', 'minor', 'SOP-MT-02');
      reading = comm ? `${r1(kw)} kW · ΔT ${r1(dt)} K` : 'No comm';
      break;
    }
    case 'exhaust':
    case 'makeup':
    case 'kmakeup': {
      const sched = a.kind === 'kmakeup' ? h >= 8 || h < 1 : h >= 6;
      starterSim(sched, 0.02, 0.03, 'SOP-HV-09', a.kind === 'kmakeup' ? 'major' : 'minor');
      if (!sched && status === 'standby') status = 'off';
      reading = status === 'run' ? 'Running' : status === 'fault' ? 'Trip' : status === 'manual' ? 'Hand' : 'Off (schedule)';
      break;
    }
    case 'smoke':
    case 'press': {
      const run = starterSim(fire, 0.012, 0.025, 'SOP-LS-02', 'critical');
      set('Fire_Mode', fire);
      if (a.kind === 'press') {
        const sp = run ? 85 : 0;
        set('Speed_Cmd', sp);
        set('Speed_Fb', sp);
        set('Stair_DP', run ? Math.round(45 + wander(tag, t, 0, 4, 1)) : Math.round(2 + wander(tag, t, 0, 1)));
      }
      if (status === 'manual') alarm = { text: 'Life-safety fan not in Auto', severity: 'major', sop: 'SOP-LS-02' };
      reading = run ? (a.kind === 'press' ? `Fire mode · ${v.Stair_DP} Pa` : 'Fire mode · running') : status === 'fault' ? 'Trip · not available' : status === 'manual' ? 'Hand' : 'Standby (auto)';
      break;
    }
    case 'pef':
    case 'psf': {
      const level = a.label.startsWith('BS1') ? 1 : 2;
      const traffic = prof('occupancy', t);
      const co = clamp(6 + 38 * traffic * (level === 1 ? 1 : 0.8) + wander(tag + 'co', t, 0, 8, 12) + (chance(tag, t, 'co', 60) < 0.01 ? 70 : 0), 0, 250);
      const boost = co > 50 || fire;
      const run = starterSim(true, 0.012, 0.02, 'SOP-CP-02');
      const speed = run ? (boost ? 100 : clamp(30 + co * 0.6, 30, 80)) : 0;
      set('Speed_Cmd', Math.round(speed));
      set('Speed_Fb', Math.round(speed));
      set('Motor_kW', r1(run ? 11 * (speed / 100) ** 3 : 0));
      if (a.kind === 'pef') {
        set('Zone_CO', Math.round(co));
        set('Energy_kWh', Math.round(30_000 + hash01(tag) * 20_000));
        if (co > 100) raise(`Car-park CO ${Math.round(co)} ppm`, 'critical', 'SOP-CP-01');
        else if (co > 50) raise(`Car-park CO ${Math.round(co)} ppm (boost)`, 'major', 'SOP-CP-01');
      }
      reading = run ? `${Math.round(speed)} %${a.kind === 'pef' ? ` · CO ${Math.round(co)} ppm` : ''}` : status === 'fault' ? 'Trip' : 'Hand';
      break;
    }
    case 'sump': {
      const cycle = hash01(`${tag}|${Math.floor(t / 600_000)}`);
      const high = chance(tag, t, 'hl', 45) < 0.012;
      const t1 = chance(tag, t, 't1', 240) < 0.02;
      const p1 = (cycle < 0.18 || high) && !t1;
      const p2 = high || (t1 && cycle < 0.18);
      set('P1_Run', p1);
      set('P2_Run', p2);
      set('P1_Trip', t1);
      set('P2_Trip', false);
      set('High_Level', high);
      set('Low_Level', !p1 && !p2);
      set('Starts_Today', Math.round(4 + hash01(tag + Math.floor(t / 86_400_000)) * 10 + hourOf(t) / 3));
      status = high ? 'alarm' : t1 ? 'fault' : p1 || p2 ? 'run' : 'standby';
      if (high) raise('Sump pit high level', 'critical', 'SOP-DR-01');
      else if (t1) raise('Sump pump 1 trip (duty on pump 2)', 'major', 'SOP-DR-02');
      reading = high ? 'HIGH LEVEL' : p1 && p2 ? 'Both pumps' : p1 ? 'Pump 1' : p2 ? 'Pump 2' : 'Idle';
      break;
    }
    case 'gen': {
      const testing = new Date(t).getDay() === 2 && h >= 10 && h < 10.5 && a.n % 3 === 0;
      const running = ctx.mainsFailed || testing;
      const notAuto = chance(tag, t, 'auto', 480) < 0.03;
      const fuel = chance(tag, t, 'fuel', 1440) < 0.04 ? 36 : clamp(96 - hash01(tag + Math.floor(t / 604_800_000)) * 40, 25, 100);
      set('Sts_Running', running);
      set('Sts_Auto', !notAuto);
      set('GCB_Closed', ctx.mainsFailed);
      const load = ctx.mainsFailed ? 55 + wander(tag, t, 0, 8) : 0;
      set('Load_Pct', Math.round(load));
      set('Load_kW', Math.round(load * 16));
      set('Voltage_LL', running ? Math.round(400 + wander(tag + 'v', t, 0, 3)) : 0);
      set('Frequency', running ? Math.round((50 + wander(tag + 'f', t, 0, 0.05)) * 100) / 100 : 0);
      set('Fuel_Level', Math.round(fuel));
      set('Battery_V', r1(26.8 + wander(tag + 'b', t, 0, 0.4)));
      set('Coolant_Temp', running ? Math.round(82 + wander(tag + 'c', t, 0, 3)) : Math.round(41 + wander(tag + 'c', t, 0, 2)));
      set('Run_Hours', Math.round(120 + hash01(tag) * 300));
      set('Alm_Common', fuel < 40 || notAuto);
      set('Alm_Shutdown', false);
      status = notAuto ? 'manual' : running ? 'run' : 'standby';
      if (notAuto) raise('Generator not in Auto', 'major', 'SOP-EL-02');
      else if (fuel < 40) raise(`Day tank ${Math.round(fuel)} %`, 'major', 'SOP-EL-03');
      reading = running ? (ctx.mainsFailed ? `On load · ${Math.round(load)} %` : 'Weekly test run') : `Standby · fuel ${Math.round(fuel)} %`;
      break;
    }
    case 'tr': {
      const load = ctx.mainsFailed ? 0 : clamp(38 + 42 * prof('retail', t) * (0.8 + hash01(tag) * 0.4) + wander(tag, t, 0, 3), 5, 110);
      const wt = 45 + load * 0.62 + wander(tag + 'w', t, 0, 2);
      set('Load_Pct', Math.round(load));
      set('Winding_Temp', Math.round(wt));
      set('Alm_Temp', wt > 100);
      set('Trip_Temp', false);
      status = ctx.mainsFailed ? 'off' : wt > 100 ? 'alarm' : 'run';
      if (wt > 100) raise(`Winding ${Math.round(wt)} °C`, 'major', 'SOP-EL-04');
      reading = ctx.mainsFailed ? 'De-energised' : `${Math.round(load)} % · ${Math.round(wt)} °C`;
      break;
    }
    case 'rmu': {
      const sf6 = chance(tag, t, 'sf6', 1440) < 0.02;
      set('Ring1_Closed', true);
      set('Ring2_Closed', a.n % 4 !== 0);
      set('TX_CB_Closed', true);
      set('Earth_Fault', false);
      set('SF6_Low', sf6);
      status = sf6 ? 'alarm' : ctx.mainsFailed ? 'off' : 'run';
      if (sf6) raise('SF6 gas pressure low', 'major', 'SOP-EL-04');
      reading = ctx.mainsFailed ? 'Utility dead' : a.n % 4 === 0 ? 'Open point · healthy' : 'Closed ring · healthy';
      break;
    }
    case 'ats': {
      set('Position', ctx.mainsFailed ? 1 : 0);
      set('Mains_OK', !ctx.mainsFailed);
      set('Gen_OK', ctx.mainsFailed);
      set('Transfers', Math.round(6 + hash01(tag) * 20));
      status = ctx.mainsFailed ? 'alarm' : 'run';
      if (ctx.mainsFailed) raise('On generator supply', 'critical', 'SOP-EL-01');
      reading = ctx.mainsFailed ? 'Generator' : 'Mains';
      break;
    }
    case 'mdb':
    case 'emdb':
    case 'mcc':
    case 'emcc': {
      const comm = chance(tag, t, 'comm', 240) > 0.01;
      const rating = a.kind === 'mdb' ? 1600 : a.kind === 'mcc' ? 630 : a.kind === 'emdb' ? 800 : 100;
      const shape = a.kind === 'mcc' || a.kind === 'emcc' ? prof('hvac', t) : prof('retail', t);
      const base = a.kind === 'emdb' || a.kind === 'emcc' ? 0.55 : 1;
      const load = ctx.mainsFailed && (a.kind === 'mdb' || a.kind === 'mcc') ? 0 : clamp((25 + 55 * shape * (0.7 + hash01(tag) * 0.5)) * base + wander(tag, t, 0, 3), 0, 104);
      const kw = (rating * 0.4 * 1.732 * 0.92 * load) / 100;
      const thd = 3 + hash01(tag) * 5 + wander(tag + 'h', t, 0, 0.8) + (chance(tag, t, 'thd', 240) < 0.03 ? 3 : 0);
      set('kW', comm ? Math.round(kw) : null);
      set('kWh', comm ? Math.round(200_000 * hash01(tag + 'e') + t / 3_600_000 * kw * 0.02) : null);
      set('Current_Avg', comm ? Math.round((rating * load) / 100) : null);
      set('Voltage_LL', comm ? Math.round(398 + wander(tag + 'v', t, 0, 3)) : null);
      set('PF', comm ? Math.round((0.97 - 0.035 * shape + wander(tag + 'pf', t, 0, 0.01)) * 100) / 100 : null);
      set('THD_I', comm ? r1(thd) : null);
      set('Load_Pct', comm ? Math.round(load) : null);
      set('Comm_OK', comm);
      status = !comm ? 'offline' : load > 90 ? 'alarm' : load === 0 ? 'off' : 'run';
      if (!comm) raise('Power meter not communicating', 'minor', 'SOP-BM-01');
      else if (load > 90) raise(`Incomer at ${Math.round(load)} %`, 'major', 'SOP-EL-05');
      else if (thd > 9.5) raise(`Current THD ${r1(thd)} %`, 'minor', 'SOP-EL-05');
      reading = comm ? `${Math.round(kw)} kW · ${Math.round(load)} %` : 'No comm';
      break;
    }
    case 'ups': {
      const onBatt = ctx.mainsFailed;
      const load = 35 + hash01(tag) * 30 + wander(tag, t, 0, 2);
      const batt = onBatt ? 92 : 100;
      set('On_Battery', onBatt);
      set('On_Bypass', false);
      set('Load_Pct', Math.round(load));
      set('Battery_Pct', batt);
      set('Autonomy_Min', Math.round((batt / 100) * 38 * (60 / load)));
      set('Alm_Common', onBatt);
      status = onBatt ? 'alarm' : 'run';
      if (onBatt) raise('UPS on battery', 'critical', 'SOP-EL-06');
      reading = `${Math.round(load)} % · ${onBatt ? 'battery' : 'online'}`;
      break;
    }
    case 'elv': {
      const fault = chance(tag, t, 'f', 180) < 0.007;
      const trapped = fault && chance(tag, t, 'e', 180) < 0.12;
      const busy = prof('occupancy', t);
      const moving = !fault && hash01(`${tag}${Math.floor(t / 20_000)}`) < busy;
      set('In_Service', !fault && !fire);
      set('Floor', fire ? 0 : Math.floor(hash01(`${tag}${Math.floor(t / 20_000)}f`) * 8));
      set('Direction', moving ? 1 + Math.floor(hash01(`${tag}${Math.floor(t / 20_000)}d`) * 2) : 0);
      set('Door_Open', !moving);
      set('Fault', fault);
      set('Fire_Recall', fire);
      set('Trips_Today', Math.round(hourOf(t) * 14 * busy + hash01(tag) * 40));
      set('Entrapment', trapped);
      status = fault ? 'fault' : fire ? 'off' : moving ? 'run' : 'standby';
      if (trapped) raise('Passenger entrapment', 'critical', 'SOP-VT-02');
      else if (fault) raise('Lift out of service (fault)', 'major', 'SOP-VT-01');
      reading = fire ? 'Fire recall · G' : fault ? 'Out of service' : moving ? `Moving · L${v.Floor}` : `Idle · L${v.Floor}`;
      break;
    }
    case 'esc': {
      const open = h >= 9 && h < 24;
      const fault = chance(tag, t, 'f', 180) < 0.01;
      const estop = !fault && chance(tag, t, 'es', 60) < 0.004;
      set('Running', open && !fault && !estop);
      set('Direction', a.n % 2 ? 2 : 1);
      set('Fault', fault);
      set('E_Stop', estop);
      status = fault || estop ? 'fault' : open ? 'run' : 'off';
      if (fault || estop) raise(estop ? 'Emergency stop pressed' : 'Escalator fault', 'major', 'SOP-VT-03');
      reading = fault ? 'Fault' : estop ? 'E-stop' : open ? (a.n % 2 ? 'Down' : 'Up') : 'Off (hours)';
      break;
    }
    case 'facp': {
      const fault = chance(tag, t, 'f', 240) < 0.06;
      set('Fire_Alarm', fire);
      set('Pre_Alarm', false);
      set('Fault', fault);
      set('Supervisory', false);
      set('Disabled_Pts', Math.round(hash01(tag + Math.floor(t / 86_400_000)) * 4));
      set('Zones_In_Alarm', fire ? 2 : 0);
      status = fire ? 'alarm' : fault ? 'fault' : 'run';
      if (fire) raise('FIRE ALARM', 'critical', 'SOP-LS-01');
      else if (fault) raise('Fire panel fault', 'major', 'SOP-LS-04');
      reading = fire ? 'FIRE' : fault ? 'Fault' : `Normal · ${v.Disabled_Pts} disabled`;
      break;
    }
    case 'pa': {
      const fault = chance(tag, t, 'f', 240) < 0.04;
      set('Evac_Active', fire);
      set('Alert_Active', false);
      set('Amp_Fault', fault);
      set('Line_Fault', false);
      set('Zones_Healthy', fault ? 11 : 12);
      status = fire ? 'alarm' : fault ? 'fault' : 'run';
      if (fault) raise('PA amplifier fault', 'major', 'SOP-LS-05');
      reading = fire ? 'Evacuation message' : fault ? 'Amp fault' : 'Healthy';
      break;
    }
  }
  return { status, values: v, alarm, reading };
}

const rank = (s: Severity) => (s === 'critical' ? 3 : s === 'major' ? 2 : 1);
export const severityRank = rank;

/* =================================================================================================
 * Snapshot: the whole fleet at one instant, cached per tick so every widget shares one computation.
 * ================================================================================================= */

export interface Snapshot {
  t: number;
  states: Map<string, AssetState>;
}

let cache: { key: string; snap: Snapshot } | null = null;

export function snapshot(t: number, ctx: SimContext): Snapshot {
  const key = `${t}|${ctx.fireZone}|${ctx.mainsFailed}`;
  if (cache?.key === key) return cache.snap;
  const states = new Map<string, AssetState>();
  for (const a of ASSETS) states.set(a.tag, simulate(a, t, ctx));
  const snap = { t, states };
  cache = { key, snap };
  return snap;
}
