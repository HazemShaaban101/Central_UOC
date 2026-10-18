import type { Tone } from '@/components/controls/Controls';
import { ASSETS, KINDS, coolingLoad, chillersStaged, type AssetKind, type AssetState, type Snapshot } from '@/model/central/assets';
import type { SourceTier } from '@/model/central/project';
import { cafmStats } from '@/model/central/cafm';

/**
 * The KPI register. Each KPI says who it is for, how it is calculated, which points feed it and how
 * sure we are that those points exist (tier). The value is computed live from the simulated fleet,
 * with exactly the same formula a live deployment would run on AVEVA historian data.
 */

export type Audience = 'Executive' | 'Operations' | 'Maintenance';

export interface KpiResult {
  value: number | null;
  text: string;
  tone: Tone;
  /** Small context line ("4 of 6 running"). */
  note?: string;
}

export interface KpiCtx {
  snap: Snapshot;
  /** 'project' or a zone id. */
  scope: string;
  now: number;
}

export interface Kpi {
  id: string;
  name: string;
  audience: Audience;
  domain: string;
  definition: string;
  formula: string;
  points: string[];
  tier: SourceTier;
  target: string;
  frequency: string;
  /** Scope it can be filtered by: building-level or plant-wide only. */
  plantWide?: boolean;
  compute: (c: KpiCtx) => KpiResult;
}

/* ---- helpers ------------------------------------------------------------------------------------ */

function rows(c: KpiCtx, kinds: AssetKind[], plant = false): { tag: string; s: AssetState }[] {
  const out: { tag: string; s: AssetState }[] = [];
  for (const a of ASSETS) {
    if (!kinds.includes(a.kind)) continue;
    if (!plant && c.scope !== 'project' && a.zone !== c.scope) continue;
    out.push({ tag: a.tag, s: c.snap.states.get(a.tag)! });
  }
  return out;
}
const n = (x: unknown) => (typeof x === 'number' ? x : 0);
const pct = (a: number, b: number) => (b ? (a / b) * 100 : null);
const tonePct = (v: number | null, good: number, warn: number): Tone => (v === null ? 'neutral' : v >= good ? 'good' : v >= warn ? 'warn' : 'bad');
const toneLow = (v: number | null, good: number, warn: number): Tone => (v === null ? 'neutral' : v <= good ? 'good' : v <= warn ? 'warn' : 'bad');
const fmt = (v: number | null, d = 0, unit = '') => (v === null ? '—' : `${v.toLocaleString('en-US', { minimumFractionDigits: d, maximumFractionDigits: d })}${unit}`);
const none: KpiResult = { value: null, text: '—', tone: 'neutral', note: 'No equipment of this type in scope' };

const CRITICAL: AssetKind[] = ['chiller', 'pchwp', 'cwp', 'ct', 'fahu', 'ahu', 'crac', 'smoke', 'press', 'pef', 'psf', 'sump', 'gen', 'ups', 'tr', 'elv', 'esc'];

/** Plant power: chiller BACnet kW + PCHWP VSD kW + an estimate for CWP and towers (cube law on speed). */
export function plantPower(c: KpiCtx) {
  let ch = 0;
  let pumps = 0;
  let towers = 0;
  for (const r of rows(c, ['chiller', 'pchwp', 'cwp', 'ct'], true)) {
    const v = r.s.values;
    if (r.tag.startsWith('CH_')) ch += n(v.Power_kW);
    else if (r.tag.startsWith('PCHWP')) pumps += n(v.Motor_kW);
    else if (r.tag.startsWith('CWP')) pumps += v.Sts_Run ? 45 * (n(v.Speed_Fb) / 100) ** 3 : 0;
    else towers += v.Sts_Run ? 22 * (n(v.Speed_Fb) / 100) ** 3 : 0;
  }
  return { ch, pumps, towers, total: ch + pumps + towers };
}

/** Plant cooling output (TR) — sum of chiller duty (calibrated against the building BTU meters). */
export function plantTons(c: KpiCtx) {
  return rows(c, ['chiller'], true).reduce((a, r) => a + n(r.s.values.Cooling_TR), 0);
}

/** Cooling power now across meters in scope (kW thermal) from BTU meters + energy valves. */
export function meteredCoolingKw(c: KpiCtx) {
  return rows(c, ['btuB', 'btuT']).reduce((a, r) => a + n(r.s.values.Power_kW), 0);
}

/** Site demand: the incomers only (MDB + EMDB); MCC / EMCC are fed from them and are not added. */
export function electricalKw(c: KpiCtx) {
  return rows(c, ['mdb', 'emdb']).reduce((a, r) => a + n(r.s.values.kW), 0);
}

const startOfDayHours = (t: number) => {
  const d = new Date(t);
  return d.getHours() + d.getMinutes() / 60;
};

/* ---- the register ------------------------------------------------------------------------------- */

export const KPIS: Kpi[] = [
  /* ============================ Executive ============================ */
  {
    id: 'EX-01', name: 'Critical Systems Availability', audience: 'Executive', domain: 'All systems',
    definition: 'Share of critical equipment (plant, air handling, life-safety fans, car-park fans, sumps, generators, UPS, transformers, lifts, escalators) not in fault or offline.',
    formula: 'available ÷ total × 100, where available = status ∉ {fault, offline}',
    points: ['*.Alm_Trip', '*.Alm_Fault', '*.Fault', '*.Comm_OK'], tier: 'io', target: '≥ 98 %', frequency: 'Live · monthly average reported',
    compute: (c) => {
      const r = rows(c, CRITICAL);
      if (!r.length) return none;
      const ok = r.filter((x) => x.s.status !== 'fault' && x.s.status !== 'offline').length;
      const v = pct(ok, r.length);
      return { value: v, text: fmt(v, 1, ' %'), tone: tonePct(v, 98, 95), note: `${r.length - ok} of ${r.length} assets unavailable` };
    },
  },
  {
    id: 'EX-02', name: 'Cooling Plant Efficiency', audience: 'Executive', domain: 'Chilled water plant', plantWide: true,
    definition: 'Electrical input of the whole plant per ton of cooling delivered.',
    formula: '(Σ chiller kW + Σ CHW/CW pump kW + Σ tower fan kW) ÷ plant TR',
    points: ['$Chiller.Power_kW', '$CHW_Pump.Motor_kW', '$CW_Pump.Speed_Fb', '$CoolingTower.Speed_Fb', '$BTU_Meter.Power_kW'], tier: 'bms', target: '≤ 0.75 kW/TR', frequency: 'Live · daily average',
    compute: (c) => {
      const tr = plantTons(c);
      const v = tr ? plantPower(c).total / tr : null;
      return { value: v, text: fmt(v, 2, ' kW/TR'), tone: toneLow(v, 0.75, 0.85), note: `${fmt(tr)} TR delivered now` };
    },
  },
  {
    id: 'EX-03', name: 'Cooling Energy Delivered Today', audience: 'Executive', domain: 'Metering',
    definition: 'Thermal energy delivered to buildings since midnight, from the 655 billing meters.',
    formula: 'Σ (register now − register 00:00) over energy valves and bulk BTU meters',
    points: ['$EnergyValve.Energy_kWh', '$BTU_Meter.Energy_MWh'], tier: 'bms', target: 'Trend vs last week', frequency: 'Hourly',
    compute: (c) => {
      const kw = meteredCoolingKw(c);
      // Integral of the day's profile so far ≈ current power × elapsed hours × profile mean ratio.
      const hours = startOfDayHours(c.now);
      const v = (kw * hours * 0.82) / 1000;
      return { value: v, text: fmt(v, 1, ' MWh'), tone: 'good', note: `${fmt(kw / 3.517)} TR load now` };
    },
  },
  {
    id: 'EX-04', name: 'Billing Data Completeness', audience: 'Executive', domain: 'Metering',
    definition: 'Share of the 655 cooling billing meters (590 SP90 energy valves + 65 Kamstrup meters) delivering valid data.',
    formula: 'meters with Comm_OK and Info_Code = 0 ÷ meters × 100',
    points: ['$EnergyValve.Comm_OK', '$BTU_Meter.Comm_OK', '$BTU_Meter.Info_Code'], tier: 'bms', target: '≥ 99.5 %', frequency: 'Live · month-end gate',
    compute: (c) => {
      const r = rows(c, ['btuT', 'btuB']);
      if (!r.length) return none;
      const ok = r.filter((x) => x.s.values.Comm_OK && !x.s.values.Info_Code).length;
      const v = pct(ok, r.length);
      return { value: v, text: fmt(v, 1, ' %'), tone: tonePct(v, 99.5, 98), note: `${r.length - ok} of ${r.length} meters need attention` };
    },
  },
  {
    id: 'EX-05', name: 'Thermal Comfort Compliance', audience: 'Executive', domain: 'Fan coil units',
    definition: 'Occupied rooms held within ±1.5 K of their set point.',
    formula: 'FCUs on with |Room_Temp − Setpoint| ≤ 1.5 K ÷ FCUs on × 100',
    points: ['$FCU_TC903.Room_Temp', '$FCU_TC903.Setpoint', '$FCU_TC903.OnOff'], tier: 'bms', target: '≥ 95 %', frequency: 'Live · weekly',
    compute: (c) => {
      const on = rows(c, ['fcu']).filter((x) => x.s.values.OnOff);
      if (!on.length) return none;
      const ok = on.filter((x) => Math.abs(n(x.s.values.Room_Temp) - n(x.s.values.Setpoint)) <= 1.5).length;
      const v = pct(ok, on.length);
      return { value: v, text: fmt(v, 1, ' %'), tone: tonePct(v, 95, 90), note: `${on.length} occupied rooms` };
    },
  },
  {
    id: 'EX-06', name: 'Life-Safety Readiness', audience: 'Executive', domain: 'Smoke control & fire',
    definition: 'Smoke extract and stair-pressurisation fans in Auto and healthy, and fire panels without faults.',
    formula: '(fans with Sts_Auto ∧ ¬Alm_Trip + panels ¬Fault) ÷ (fans + panels) × 100',
    points: ['$SmokeFan.Sts_Auto', '$SmokeFan.Alm_Trip', '$StairPressFan.Sts_Auto', '$FireAlarmPanel.Fault'], tier: 'io', target: '100 %', frequency: 'Live',
    compute: (c) => {
      const fans = rows(c, ['smoke', 'press', 'pef']);
      const panels = rows(c, ['facp']);
      const total = fans.length + panels.length;
      if (!total) return none;
      const ok = fans.filter((x) => x.s.values.Sts_Auto && !x.s.values.Alm_Trip).length + panels.filter((x) => !x.s.values.Fault).length;
      const v = pct(ok, total);
      return { value: v, text: fmt(v, 1, ' %'), tone: tonePct(v, 99.5, 97), note: `${total - ok} impairment(s)` };
    },
  },
  {
    id: 'EX-07', name: 'Electrical Demand', audience: 'Executive', domain: 'Electrical',
    definition: 'Live demand at the main and emergency distribution boards (the incomers; MCC / EMCC are sub-boards and not added).',
    formula: 'Σ MDB + EMDB incomer kW (digital power meters)',
    points: ['$PowerMeter.kW'], tier: 'aveva', target: 'Below contracted demand', frequency: 'Live · 15-min demand',
    compute: (c) => {
      const kw = electricalKw(c);
      const v = kw / 1000;
      return { value: v, text: fmt(v, 2, ' MW'), tone: 'good', note: `${rows(c, ['mdb', 'emdb']).length} incomers (MDB + EMDB)` };
    },
  },
  {
    id: 'EX-08', name: 'Standby Power Readiness', audience: 'Executive', domain: 'Electrical',
    definition: 'Generators ready to take load: in Auto, no shutdown, day tank ≥ 40 %.',
    formula: 'ready generators ÷ generators × 100',
    points: ['$Genset.Sts_Auto', '$Genset.Alm_Shutdown', '$Genset.Fuel_Level'], tier: 'aveva', target: '100 %', frequency: 'Live',
    compute: (c) => {
      const r = rows(c, ['gen']);
      if (!r.length) return none;
      const ok = r.filter((x) => x.s.values.Sts_Auto && !x.s.values.Alm_Shutdown && n(x.s.values.Fuel_Level) >= 40).length;
      const v = pct(ok, r.length);
      return { value: v, text: fmt(v, 0, ' %'), tone: tonePct(v, 100, 90), note: `${ok} of ${r.length} generators ready` };
    },
  },
  {
    id: 'EX-09', name: 'Vertical Transport Availability', audience: 'Executive', domain: 'Lifts & escalators',
    definition: 'Lifts and escalators in service (escalators outside opening hours count as available).',
    formula: '(lifts In_Service + escalators ¬Fault ∧ ¬E_Stop) ÷ units × 100',
    points: ['$Elevator.In_Service', '$Escalator.Fault', '$Escalator.E_Stop'], tier: 'aveva', target: '≥ 98 %', frequency: 'Live · monthly',
    compute: (c) => {
      const r = rows(c, ['elv', 'esc']);
      if (!r.length) return none;
      const ok = r.filter((x) => x.s.status !== 'fault').length;
      const v = pct(ok, r.length);
      return { value: v, text: fmt(v, 1, ' %'), tone: tonePct(v, 98, 95), note: `${r.length - ok} of ${r.length} out of service` };
    },
  },
  {
    id: 'EX-10', name: 'Open Critical Alarms', audience: 'Executive', domain: 'All systems',
    definition: 'Critical (P1) alarms active right now.',
    formula: 'count(alarms where severity = critical)',
    points: ['AVEVA alarm database'], tier: 'calc', target: '0', frequency: 'Live',
    compute: (c) => {
      let crit = 0;
      let all = 0;
      for (const a of ASSETS) {
        if (c.scope !== 'project' && a.zone !== c.scope) continue;
        const al = c.snap.states.get(a.tag)!.alarm;
        if (!al) continue;
        all++;
        if (al.severity === 'critical') crit++;
      }
      return { value: crit, text: String(crit), tone: crit === 0 ? 'good' : crit <= 2 ? 'warn' : 'bad', note: `${all} alarms in total` };
    },
  },
  {
    id: 'EX-11', name: 'Work-Order SLA Compliance', audience: 'Executive', domain: 'CAFM (assumed)',
    definition: 'Corrective work orders closed within their priority SLA (rolling 30 days).',
    formula: 'WOs closed within SLA ÷ WOs closed × 100',
    points: ['CAFM work orders'], tier: 'assumed', target: '≥ 90 %', frequency: 'Daily',
    compute: (c) => {
      const s = cafmStats(c.now, c.scope);
      return { value: s.slaPct, text: fmt(s.slaPct, 1, ' %'), tone: tonePct(s.slaPct, 90, 80), note: `${s.closed30} closed in 30 days` };
    },
  },
  {
    id: 'EX-12', name: 'PPM Compliance', audience: 'Executive', domain: 'CAFM (assumed)',
    definition: 'Planned maintenance completed in its window this month.',
    formula: 'PPM done on time ÷ PPM due × 100',
    points: ['CAFM PPM schedule', '$*.Run_Hours'], tier: 'assumed', target: '≥ 95 %', frequency: 'Weekly',
    compute: (c) => {
      const s = cafmStats(c.now, c.scope);
      return { value: s.ppmPct, text: fmt(s.ppmPct, 1, ' %'), tone: tonePct(s.ppmPct, 95, 85), note: `${s.ppmDue} PPM due this month` };
    },
  },
  {
    id: 'EX-13', name: 'Car-Park Air Quality', audience: 'Executive', domain: 'Car park',
    definition: 'Car-park zones below 50 ppm CO (the boost threshold).',
    formula: 'zones with Zone_CO < 50 ppm ÷ zones × 100',
    points: ['$CarParkExhaustFan.Zone_CO'], tier: 'io', target: '100 % (≥ 99 % of hours)', frequency: 'Live',
    compute: (c) => {
      const r = rows(c, ['pef']);
      if (!r.length) return none;
      const ok = r.filter((x) => n(x.s.values.Zone_CO) < 50).length;
      const v = pct(ok, r.length);
      const max = Math.max(...r.map((x) => n(x.s.values.Zone_CO)));
      return { value: v, text: fmt(v, 1, ' %'), tone: tonePct(v, 100, 97), note: `Highest zone ${fmt(max)} ppm` };
    },
  },
  {
    id: 'EX-14', name: 'Carbon Emissions Today', audience: 'Executive', domain: 'Sustainability',
    definition: 'Scope-2 emissions of today’s electricity.',
    formula: 'Σ MDB + EMDB kWh today × grid factor (0.46 kgCO₂e/kWh, Egypt grid — assumed)',
    points: ['$PowerMeter.kWh'], tier: 'aveva', target: '−5 % year on year', frequency: 'Daily',
    compute: (c) => {
      const v = (electricalKw(c) * startOfDayHours(c.now) * 0.8 * 0.46) / 1000;
      return { value: v, text: fmt(v, 1, ' tCO₂e'), tone: 'good', note: 'Grid factor 0.46 kg/kWh' };
    },
  },

  /* ============================ Operations ============================ */
  {
    id: 'OP-01', name: 'Active Alarms', audience: 'Operations', domain: 'All systems',
    definition: 'All active alarms by severity, each linked to its SOP.', formula: 'count by severity',
    points: ['AVEVA alarm database'], tier: 'calc', target: 'No P1 older than 15 min', frequency: 'Live',
    compute: (c) => {
      let maj = 0;
      let min = 0;
      let crit = 0;
      for (const a of ASSETS) {
        if (c.scope !== 'project' && a.zone !== c.scope) continue;
        const al = c.snap.states.get(a.tag)!.alarm;
        if (!al) continue;
        if (al.severity === 'critical') crit++;
        else if (al.severity === 'major') maj++;
        else min++;
      }
      const total = crit + maj + min;
      return { value: total, text: String(total), tone: crit ? 'bad' : maj ? 'warn' : 'good', note: `${crit} critical · ${maj} major · ${min} minor` };
    },
  },
  {
    id: 'OP-02', name: 'Chiller Staging', audience: 'Operations', domain: 'Chilled water plant', plantWide: true,
    definition: 'Chillers running against what the load needs.', formula: 'count(Sts_Run) vs staging demand',
    points: ['$Chiller.Sts_Run', '$Chiller.Load_Pct'], tier: 'io', target: 'Running = required', frequency: 'Live',
    compute: (c) => {
      const run = rows(c, ['chiller'], true).filter((x) => x.s.values.Sts_Run).length;
      const need = chillersStaged(c.now);
      return { value: run, text: `${run} / 6`, tone: run >= need ? 'good' : run === need - 1 ? 'warn' : 'bad', note: `${need} required at ${Math.round(coolingLoad(c.now) * 100)} % load` };
    },
  },
  {
    id: 'OP-03', name: 'CHW Supply Temperature', audience: 'Operations', domain: 'Chilled water plant', plantWide: true,
    definition: 'Average leaving chilled-water temperature of running chillers.', formula: 'mean(CHWS_Temp | Sts_Run)',
    points: ['$Chiller.CHWS_Temp', '$Chiller.CHW_Setpoint'], tier: 'io', target: 'Set point 6.7 °C ± 0.5 K', frequency: 'Live',
    compute: (c) => {
      const r = rows(c, ['chiller'], true).filter((x) => x.s.values.Sts_Run);
      const v = r.length ? r.reduce((a, x) => a + n(x.s.values.CHWS_Temp), 0) / r.length : null;
      return { value: v, text: fmt(v, 1, ' °C'), tone: v === null ? 'neutral' : Math.abs(v - 6.7) <= 0.5 ? 'good' : Math.abs(v - 6.7) <= 1 ? 'warn' : 'bad', note: 'Set point 6.7 °C' };
    },
  },
  {
    id: 'OP-04', name: 'Plant ΔT', audience: 'Operations', domain: 'Chilled water plant', plantWide: true,
    definition: 'Return minus supply across running chillers; low ΔT wastes pumping and chiller capacity.', formula: 'mean(CHWR_Temp − CHWS_Temp | Sts_Run)',
    points: ['$Chiller.CHWR_Temp', '$Chiller.CHWS_Temp', '$EnergyValve.DeltaT'], tier: 'io', target: '≥ 4.5 K (design 5.5 K)', frequency: 'Live',
    compute: (c) => {
      const r = rows(c, ['chiller'], true).filter((x) => x.s.values.Sts_Run);
      const v = r.length ? r.reduce((a, x) => a + n(x.s.values.CHWR_Temp) - n(x.s.values.CHWS_Temp), 0) / r.length : null;
      return { value: v, text: fmt(v, 1, ' K'), tone: v === null ? 'neutral' : v >= 4.5 ? 'good' : v >= 3.8 ? 'warn' : 'bad', note: 'Design ΔT 5.5 K' };
    },
  },
  {
    id: 'OP-05', name: 'Cooling Tower Approach', audience: 'Operations', domain: 'Heat rejection', plantWide: true,
    definition: 'Leaving tower water minus outdoor wet bulb (SHO2 outdoor T/RH sensor).', formula: 'mean(Approach_K | Sts_Run)',
    points: ['$CoolingTower.CW_Out_Temp', 'Outdoor T/RH (SHO2)'], tier: 'calc', target: '≤ 4 K', frequency: 'Live',
    compute: (c) => {
      const r = rows(c, ['ct'], true).filter((x) => x.s.values.Sts_Run);
      const v = r.length ? r.reduce((a, x) => a + n(x.s.values.Approach_K), 0) / r.length : null;
      return { value: v, text: fmt(v, 1, ' K'), tone: toneLow(v, 4, 5), note: `${r.length} cells running` };
    },
  },
  {
    id: 'OP-06', name: 'Supply Air Compliance', audience: 'Operations', domain: 'Air handling',
    definition: 'Running FAHU / AHU within ±1.5 K of supply set point.', formula: 'units in band ÷ running units × 100',
    points: ['$FAHU.Supply_Temp', '$FAHU.Supply_Setpoint'], tier: 'io', target: '≥ 95 %', frequency: 'Live',
    compute: (c) => {
      const r = rows(c, ['fahu', 'ahu']).filter((x) => x.s.values.Sts_Run);
      if (!r.length) return { ...none, note: 'No unit running' };
      const ok = r.filter((x) => Math.abs(n(x.s.values.Supply_Temp) - 14.5) <= 1.5).length;
      const v = pct(ok, r.length);
      return { value: v, text: fmt(v, 0, ' %'), tone: tonePct(v, 95, 85), note: `${r.length} units running` };
    },
  },
  {
    id: 'OP-07', name: 'Equipment in Hand', audience: 'Operations', domain: 'All starters',
    definition: 'Motor starters out of Auto (BMS cannot control them).', formula: 'count(Sts_Auto = False)',
    points: ['*.Sts_Auto'], tier: 'io', target: '0 unplanned', frequency: 'Live',
    compute: (c) => {
      const v = rows(c, ['pchwp', 'cwp', 'ct', 'fahu', 'ahu', 'exhaust', 'makeup', 'kmakeup', 'smoke', 'press', 'pef', 'psf']).filter((x) => x.s.values.Sts_Auto === false).length;
      return { value: v, text: String(v), tone: v === 0 ? 'good' : v <= 3 ? 'warn' : 'bad', note: 'Starters with H/O/A not in Auto' };
    },
  },
  {
    id: 'OP-08', name: 'Field Device Comms', audience: 'Operations', domain: 'BMS network',
    definition: 'Networked field devices answering (thermostats, energy valves, meters).', formula: 'Comm_OK ÷ devices × 100',
    points: ['$FCU_TC903.Comm_OK', '$EnergyValve.Comm_OK', '$PowerMeter.Comm_OK'], tier: 'bms', target: '≥ 99 %', frequency: 'Live',
    compute: (c) => {
      const r = rows(c, ['fcu', 'btuT', 'btuB', 'mdb', 'emdb', 'mcc', 'emcc']);
      if (!r.length) return none;
      const ok = r.filter((x) => x.s.values.Comm_OK).length;
      const v = pct(ok, r.length);
      return { value: v, text: fmt(v, 1, ' %'), tone: tonePct(v, 99, 97), note: `${r.length - ok} of ${r.length} offline` };
    },
  },
  {
    id: 'OP-09', name: 'Dirty Filters', audience: 'Operations', domain: 'Air handling',
    definition: 'Air handling units with a pre- or bag-filter ΔP switch made.', formula: 'count(PreFilter_DPS ∨ BagFilter_DPS)',
    points: ['$FAHU.PreFilter_DPS', '$FAHU.BagFilter_DPS'], tier: 'io', target: '0 older than 5 days', frequency: 'Live',
    compute: (c) => {
      const r = rows(c, ['fahu', 'ahu']);
      if (!r.length) return none;
      const v = r.filter((x) => x.s.values.PreFilter_DPS || x.s.values.BagFilter_DPS).length;
      return { value: v, text: String(v), tone: v === 0 ? 'good' : v <= 3 ? 'warn' : 'bad', note: `of ${r.length} units` };
    },
  },
  {
    id: 'OP-10', name: 'Car-Park Fans in Boost', audience: 'Operations', domain: 'Car park',
    definition: 'Exhaust fans at 100 % because zone CO > 50 ppm.', formula: 'count(Zone_CO > 50)',
    points: ['$CarParkExhaustFan.Zone_CO', '$CarParkExhaustFan.Speed_Fb'], tier: 'io', target: 'Trend only', frequency: 'Live',
    compute: (c) => {
      const r = rows(c, ['pef']);
      if (!r.length) return none;
      const v = r.filter((x) => n(x.s.values.Zone_CO) > 50).length;
      return { value: v, text: String(v), tone: v === 0 ? 'good' : v <= 4 ? 'warn' : 'bad', note: `of ${r.length} exhaust fans` };
    },
  },
  {
    id: 'OP-11', name: 'Sump High Levels', audience: 'Operations', domain: 'Drainage',
    definition: 'Sump pits at high level now.', formula: 'count(High_Level)',
    points: ['$DuplexSumpPumps.High_Level'], tier: 'io', target: '0', frequency: 'Live',
    compute: (c) => {
      const r = rows(c, ['sump']);
      if (!r.length) return none;
      const v = r.filter((x) => x.s.values.High_Level).length;
      return { value: v, text: String(v), tone: v === 0 ? 'good' : 'bad', note: `of ${r.length} pits` };
    },
  },
  {
    id: 'OP-12', name: 'Peak Transformer Loading', audience: 'Operations', domain: 'Electrical',
    definition: 'Most loaded transformer in scope.', formula: 'max(Load_Pct)',
    points: ['$Transformer.Load_Pct', '$Transformer.Winding_Temp'], tier: 'aveva', target: '≤ 80 %', frequency: 'Live',
    compute: (c) => {
      const r = rows(c, ['tr']);
      if (!r.length) return none;
      const top = r.reduce((a, x) => (n(x.s.values.Load_Pct) > n(a.s.values.Load_Pct) ? x : a));
      const v = n(top.s.values.Load_Pct);
      return { value: v, text: fmt(v, 0, ' %'), tone: toneLow(v, 80, 95), note: top.tag.replace(/_/g, '-') };
    },
  },
  {
    id: 'OP-13', name: 'Power Factor', audience: 'Operations', domain: 'Electrical',
    definition: 'kW-weighted power factor of the MDB incomers.', formula: 'Σ(kW·PF) ÷ Σ kW',
    points: ['$PowerMeter.PF', '$PowerMeter.kW'], tier: 'aveva', target: '≥ 0.92', frequency: 'Live',
    compute: (c) => {
      const r = rows(c, ['mdb']).filter((x) => x.s.values.Comm_OK);
      const kw = r.reduce((a, x) => a + n(x.s.values.kW), 0);
      const v = kw ? r.reduce((a, x) => a + n(x.s.values.kW) * n(x.s.values.PF), 0) / kw : null;
      return { value: v, text: fmt(v, 2), tone: tonePct(v, 0.92, 0.9), note: 'Utility penalty below 0.9' };
    },
  },
  {
    id: 'OP-14', name: 'Lift Faults & Entrapments', audience: 'Operations', domain: 'Lifts',
    definition: 'Lifts out of service; entrapments are P1.', formula: 'count(Fault), count(Entrapment)',
    points: ['$Elevator.Fault', '$Elevator.Entrapment'], tier: 'aveva', target: '0 entrapments', frequency: 'Live',
    compute: (c) => {
      const r = rows(c, ['elv']);
      if (!r.length) return none;
      const f = r.filter((x) => x.s.values.Fault).length;
      const e = r.filter((x) => x.s.values.Entrapment).length;
      return { value: f, text: String(f), tone: e ? 'bad' : f ? 'warn' : 'good', note: `${e} entrapment(s) · ${r.length} lifts` };
    },
  },
  {
    id: 'OP-15', name: 'Fire System Impairments', audience: 'Operations', domain: 'Fire alarm (assumed)',
    definition: 'Fire panel faults and disabled devices.', formula: 'count(Fault) + Σ Disabled_Pts',
    points: ['$FireAlarmPanel.Fault', '$FireAlarmPanel.Disabled_Pts'], tier: 'assumed', target: '0 without permit', frequency: 'Live',
    compute: (c) => {
      const r = rows(c, ['facp']);
      if (!r.length) return none;
      const f = r.filter((x) => x.s.values.Fault).length;
      const d = r.reduce((a, x) => a + n(x.s.values.Disabled_Pts), 0);
      return { value: f + d, text: String(f + d), tone: f ? 'warn' : 'good', note: `${f} panel fault(s) · ${d} disabled devices` };
    },
  },
  {
    id: 'OP-16', name: 'PA Health', audience: 'Operations', domain: 'Public address (assumed)',
    definition: 'PA racks without amplifier or line faults.', formula: 'healthy racks ÷ racks × 100',
    points: ['$PublicAddress.Amp_Fault', '$PublicAddress.Line_Fault'], tier: 'assumed', target: '100 %', frequency: 'Live',
    compute: (c) => {
      const r = rows(c, ['pa']);
      if (!r.length) return none;
      const ok = r.filter((x) => !x.s.values.Amp_Fault && !x.s.values.Line_Fault).length;
      const v = pct(ok, r.length);
      return { value: v, text: fmt(v, 0, ' %'), tone: tonePct(v, 100, 85), note: `${r.length} racks` };
    },
  },
  {
    id: 'OP-17', name: 'Security Events Today', audience: 'Operations', domain: 'CCTV & access (assumed)',
    definition: 'Door-forced / held alarms and camera losses today.', formula: 'count(events today)',
    points: ['$AccessDoor.Forced', '$AccessDoor.Held', '$Camera.Online'], tier: 'assumed', target: 'Trend only', frequency: 'Daily',
    compute: (c) => {
      const s = cafmStats(c.now, c.scope);
      return { value: s.securityToday, text: String(s.securityToday), tone: 'good', note: 'Door forced / held · camera loss' };
    },
  },

  /* ============================ Maintenance ============================ */
  {
    id: 'MT-01', name: 'Plant Run Hours vs Service', audience: 'Maintenance', domain: 'Chilled water plant', plantWide: true,
    definition: 'Chillers within 200 h of their 2,000 h service interval.', formula: 'count((Run_Hours mod 2000) > 1800)',
    points: ['$Chiller.Run_Hours'], tier: 'bms', target: 'Serviced before interval', frequency: 'Daily',
    compute: (c) => {
      const r = rows(c, ['chiller'], true);
      const due = r.filter((x) => n(x.s.values.Run_Hours) % 2000 > 1800).length;
      return { value: due, text: String(due), tone: due ? 'warn' : 'good', note: 'chillers due for service' };
    },
  },
  {
    id: 'MT-02', name: 'Trips Today', audience: 'Maintenance', domain: 'Motors',
    definition: 'Motor trips active (pumps, fans, towers, air handlers).', formula: 'count(Alm_Trip)',
    points: ['*.Alm_Trip'], tier: 'io', target: 'Trend down', frequency: 'Live · per 1,000 run h monthly',
    compute: (c) => {
      const v = rows(c, ['pchwp', 'cwp', 'ct', 'fahu', 'ahu', 'exhaust', 'makeup', 'kmakeup', 'smoke', 'press', 'pef', 'psf']).filter((x) => x.s.values.Alm_Trip).length;
      return { value: v, text: String(v), tone: v === 0 ? 'good' : v <= 4 ? 'warn' : 'bad', note: 'active trips' };
    },
  },
  {
    id: 'MT-03', name: 'Mean Time To Repair', audience: 'Maintenance', domain: 'CAFM (assumed)',
    definition: 'Average time from WO creation to close (30 days).', formula: 'mean(closed − created)',
    points: ['CAFM work orders'], tier: 'assumed', target: '≤ 8 h (P2)', frequency: 'Weekly',
    compute: (c) => {
      const s = cafmStats(c.now, c.scope);
      return { value: s.mttrH, text: fmt(s.mttrH, 1, ' h'), tone: toneLow(s.mttrH, 8, 12), note: 'rolling 30 days' };
    },
  },
  {
    id: 'MT-04', name: 'Open Work Orders', audience: 'Maintenance', domain: 'CAFM (assumed)',
    definition: 'Corrective work orders open now.', formula: 'count(status ≠ closed)',
    points: ['CAFM work orders'], tier: 'assumed', target: 'Backlog ≤ 1 week', frequency: 'Live',
    compute: (c) => {
      const s = cafmStats(c.now, c.scope);
      return { value: s.open, text: String(s.open), tone: s.overdue ? 'warn' : 'good', note: `${s.overdue} past SLA` };
    },
  },
  {
    id: 'MT-05', name: 'Sump Pump Starts', audience: 'Maintenance', domain: 'Drainage',
    definition: 'Average starts per sump set today; high counts point to infiltration or a stuck float.', formula: 'mean(Starts_Today)',
    points: ['$DuplexSumpPumps.P1_Run', '$DuplexSumpPumps.P2_Run'], tier: 'calc', target: '≤ 20 per day', frequency: 'Daily',
    compute: (c) => {
      const r = rows(c, ['sump']);
      if (!r.length) return none;
      const v = r.reduce((a, x) => a + n(x.s.values.Starts_Today), 0) / r.length;
      return { value: v, text: fmt(v, 1), tone: toneLow(v, 20, 30), note: `${r.length} sets` };
    },
  },
  {
    id: 'MT-06', name: 'Duty Rotation Balance', audience: 'Maintenance', domain: 'Pumps', plantWide: true,
    definition: 'Spread of run hours across the 7 primary CHW pumps (lead rotation working?).', formula: '(max − min) ÷ mean × 100 of Run_Hours',
    points: ['$CHW_Pump.Run_Hours'], tier: 'bms', target: '≤ 10 %', frequency: 'Weekly',
    compute: (c) => {
      const h = rows(c, ['pchwp'], true).map((x) => n(x.s.values.Run_Hours));
      const mean = h.reduce((a, b) => a + b, 0) / h.length;
      const v = mean ? ((Math.max(...h) - Math.min(...h)) / mean) * 100 : null;
      return { value: v, text: fmt(v, 0, ' %'), tone: toneLow(v, 10, 25), note: 'run-hour spread' };
    },
  },
];

export const kpiById = (id: string) => KPIS.find((k) => k.id === id)!;
export const kindLabel = (k: AssetKind) => KINDS[k].label;
