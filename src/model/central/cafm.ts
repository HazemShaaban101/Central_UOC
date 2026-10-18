import { hash01 } from '@/model/assets/galaxy';
import { ASSETS, KINDS, type Asset } from '@/model/central/assets';

/**
 * CAFM is supplied by others; the submittal only shows it connected to AVEVA ("Maintenance Workforce"
 * on the architecture drawing, AVEVA Work Task in the BoQ). This module assumes a typical CAFM: work
 * orders raised from AVEVA alarms, tenant requests and inspections, with priority SLAs, plus a PPM
 * plan. Everything here is simulated, deterministic per day, and labelled "assumed" on screen.
 */

export type Priority = 'P1' | 'P2' | 'P3' | 'P4';
export type WoStatus = 'Open' | 'Assigned' | 'In progress' | 'Closed';
export type WoSource = 'AVEVA alarm' | 'Tenant request' | 'Inspection';

export const SLA_HOURS: Record<Priority, number> = { P1: 4, P2: 8, P3: 24, P4: 72 };

export interface WorkOrder {
  id: string;
  created: number;
  closed: number;
  priority: Priority;
  source: WoSource;
  asset: Asset;
  trade: 'HVAC' | 'Electrical' | 'Plumbing' | 'Lifts' | 'Fire & Life Safety' | 'BMS';
  title: string;
  sop: string;
}

const TITLES: Record<string, { t: string; sop: string }[]> = {
  hvac: [
    { t: 'Room too warm', sop: 'SOP-HV-08' },
    { t: 'Replace dirty filter', sop: 'SOP-HV-06' },
    { t: 'Fan trip — inspect motor', sop: 'SOP-HV-05' },
    { t: 'Valve actuator not following command', sop: 'SOP-HV-05' },
  ],
  vent: [{ t: 'Fan trip — inspect VSD', sop: 'SOP-CP-02' }, { t: 'CO sensor reading high — calibrate', sop: 'SOP-CP-01' }],
  safety: [{ t: 'Life-safety fan not in Auto', sop: 'SOP-LS-02' }, { t: 'Detector fault', sop: 'SOP-LS-04' }],
  electric: [{ t: 'Meter not communicating', sop: 'SOP-BM-01' }, { t: 'Generator battery low', sop: 'SOP-EL-02' }, { t: 'High THD on MCC', sop: 'SOP-EL-05' }],
  metering: [{ t: 'Billing meter offline', sop: 'SOP-MT-01' }, { t: 'Low ΔT investigation', sop: 'SOP-MT-02' }],
  transport: [{ t: 'Lift out of service', sop: 'SOP-VT-01' }, { t: 'Escalator stopped', sop: 'SOP-VT-03' }],
  drainage: [{ t: 'Sump pump trip — clean impeller', sop: 'SOP-DR-02' }],
};

const TRADE: Record<string, WorkOrder['trade']> = { hvac: 'HVAC', vent: 'HVAC', safety: 'Fire & Life Safety', electric: 'Electrical', metering: 'BMS', transport: 'Lifts', drainage: 'Plumbing' };

const DAY = 86_400_000;
const cache = new Map<number, WorkOrder[]>();

/** Work orders created on day `d` (days since epoch). */
function dayOrders(d: number): WorkOrder[] {
  const hit = cache.get(d);
  if (hit) return hit;
  const out: WorkOrder[] = [];
  const count = 22 + Math.floor(hash01(`wo-day-${d}`) * 14);
  for (let i = 0; i < count; i++) {
    const r = (s: string) => hash01(`wo-${d}-${i}-${s}`);
    const asset = ASSETS[Math.floor(r('a') * ASSETS.length)];
    const domain = KINDS[asset.kind].domain;
    const list = TITLES[domain];
    const pick = list[Math.floor(r('t') * list.length)];
    const pr = r('p');
    const priority: Priority = pr < 0.06 ? 'P1' : pr < 0.3 ? 'P2' : pr < 0.8 ? 'P3' : 'P4';
    const created = d * DAY + 7 * 3_600_000 + r('c') * 14 * 3_600_000;
    // Most close within SLA; a tail runs over.
    const sla = SLA_HOURS[priority];
    const dur = (r('d') < 0.88 ? 0.15 + r('e') * 0.8 : 1.05 + r('e') * 1.4) * sla * 3_600_000;
    const src = r('s');
    out.push({
      id: `WO-${String(24_000 + (d % 1000) * 40 + i)}`,
      created,
      closed: created + dur,
      priority,
      source: src < 0.55 ? 'AVEVA alarm' : src < 0.85 ? 'Tenant request' : 'Inspection',
      asset,
      trade: TRADE[domain],
      title: pick.t,
      sop: pick.sop,
    });
  }
  cache.set(d, out);
  return out;
}

export function workOrders(now: number, days = 30, scope = 'project'): WorkOrder[] {
  const today = Math.floor(now / DAY);
  const out: WorkOrder[] = [];
  for (let d = today - days + 1; d <= today; d++) for (const w of dayOrders(d)) if (w.created <= now && (scope === 'project' || w.asset.zone === scope)) out.push(w);
  return out.sort((a, b) => b.created - a.created);
}

export function woStatus(w: WorkOrder, now: number): WoStatus {
  if (now >= w.closed) return 'Closed';
  const f = (now - w.created) / (w.closed - w.created);
  return f < 0.15 ? 'Open' : f < 0.4 ? 'Assigned' : 'In progress';
}

export const overdue = (w: WorkOrder, now: number) => (Math.min(now, w.closed) - w.created) / 3_600_000 > SLA_HOURS[w.priority];

/* ---- PPM plan (assumed intervals) ------------------------------------------------------------- */

export interface PpmTask {
  id: string;
  title: string;
  kinds: string;
  interval: string;
  qty: number;
  done: number;
  due: number;
  basis: 'Calendar' | 'Run hours (BMS)';
}

export function ppmPlan(now: number): PpmTask[] {
  const m = new Date(now);
  const dayOfMonth = m.getDate();
  const progress = Math.min(1, dayOfMonth / 30);
  const row = (id: string, title: string, kinds: string, interval: string, qty: number, basis: PpmTask['basis']): PpmTask => {
    const lag = hash01(`${id}-${m.getMonth()}`) * 0.12;
    const done = Math.round(qty * Math.max(0, progress - lag));
    return { id, title, kinds, interval, qty, done, due: Math.round(qty * progress), basis };
  };
  const c = (k: string) => ASSETS.filter((a) => a.kind === k).length;
  return [
    row('PPM-01', 'Chiller service', 'Chillers', '2,000 run hours', c('chiller'), 'Run hours (BMS)'),
    row('PPM-02', 'Pump inspection & greasing', 'CHW / CW pumps', '4,000 run hours', c('pchwp') + c('cwp'), 'Run hours (BMS)'),
    row('PPM-03', 'Cooling tower clean & chemical check', 'Cooling towers', 'Monthly', c('ct'), 'Calendar'),
    row('PPM-04', 'FAHU / AHU filter & belt check', 'Air handlers', 'Monthly', c('fahu') + c('ahu'), 'Calendar'),
    row('PPM-05', 'Smoke & pressurisation fan test', 'Life-safety fans', 'Weekly (×4)', (c('smoke') + c('press')) * 4, 'Calendar'),
    row('PPM-06', 'Car-park fan & CO sensor check', 'Car-park fans', 'Quarterly (⅓ per month)', Math.round((c('pef') + c('psf')) / 3), 'Calendar'),
    row('PPM-07', 'Generator off-load test', 'Generators', 'Monthly', c('gen'), 'Calendar'),
    row('PPM-08', 'Sump pit clean & float test', 'Sump sets', 'Quarterly (⅓ per month)', Math.round(c('sump') / 3), 'Calendar'),
    row('PPM-09', 'FCU filter clean', 'Fan coil units', 'Quarterly (⅓ per month)', Math.round(c('fcu') / 3), 'Calendar'),
    row('PPM-10', 'Lift & escalator statutory service', 'Lifts & escalators', 'Monthly (vendor)', c('elv') + c('esc'), 'Calendar'),
  ];
}

/* ---- stats for KPIs ---------------------------------------------------------------------------- */

export interface CafmStats {
  closed30: number;
  slaPct: number;
  mttrH: number;
  open: number;
  overdue: number;
  ppmDue: number;
  ppmPct: number;
  securityToday: number;
}

const statCache = new Map<string, CafmStats>();

export function cafmStats(now: number, scope = 'project'): CafmStats {
  const key = `${Math.floor(now / 60_000)}|${scope}`;
  const hit = statCache.get(key);
  if (hit) return hit;
  const wos = workOrders(now, 30, scope);
  const closed = wos.filter((w) => w.closed <= now);
  const inSla = closed.filter((w) => !overdue(w, now)).length;
  const open = wos.filter((w) => w.closed > now);
  const plan = ppmPlan(now);
  const due = plan.reduce((a, p) => a + p.due, 0);
  const done = plan.reduce((a, p) => a + Math.min(p.done, p.due), 0);
  const hour = new Date(now).getHours();
  const s: CafmStats = {
    closed30: closed.length,
    slaPct: closed.length ? (inSla / closed.length) * 100 : 100,
    mttrH: closed.length ? closed.reduce((a, w) => a + (w.closed - w.created), 0) / closed.length / 3_600_000 : 0,
    open: open.length,
    overdue: open.filter((w) => overdue(w, now)).length,
    ppmDue: due,
    ppmPct: due ? (done / due) * 100 : 100,
    securityToday: Math.round(hour * 1.6 + hash01(`sec-${Math.floor(now / 86_400_000)}`) * 6) * (scope === 'project' ? 1 : 0.15) | 0,
  };
  if (statCache.size > 50) statCache.clear();
  statCache.set(key, s);
  return s;
}
