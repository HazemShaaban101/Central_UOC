import { create } from 'zustand';
import { zoneById, type ZoneId } from '@/model/central/project';

export type Severity = 'critical' | 'warning' | 'info';

export interface PlatformNotification {
  id: string;
  time: number;
  system: string;
  severity: Severity;
  title: string;
  detail: string;
  /** Where "View" goes. */
  route?: string;
  read: boolean;
}

export interface FireAlarmState {
  active: boolean;
  triggeredAt: number | null;
  /** Detectors in alarm. */
  detectors: string[];
  /** Central zone in fire mode (b01…b07, bs). */
  zone: ZoneId | null;
  lastAlarmAt: number;
  lastResolvedAt: number | null;
}

/**
 * Utility (mains) failure drill: the MV incomers lose voltage, the generators start and take the
 * essential board through its ATS, and the UPS units ride through on battery until they do.
 */
export interface MainsState {
  failed: boolean;
  /** When the utility went down (null while healthy). */
  failedAt: number | null;
  /** When it came back: the generators keep running unloaded for their cool-down. */
  restoredAt: number | null;
}

/**
 * Forced-door drill (Security): a door is forced open, the nearest CCTV camera pops up and captures
 * the intruder's face, and the face is matched against the badge/face database.
 */
export interface IntrusionState {
  active: boolean;
  door: string;
  /** Building id (model/site.ts) the door belongs to. */
  building: string;
  camera: string;
  at: number | null;
  /** Who the face matched, or null when the person is unknown. */
  identity: { name: string; id: string; role: string } | null;
}

export interface FcuState {
  on: boolean;
  fan: 1 | 2 | 3;
  mode: 'Cooling' | 'Heating' | 'Fan';
  setpoint: number;
}

interface ScenarioStore {
  fire: FireAlarmState;
  mains: MainsState;
  intrusion: IntrusionState;
  notifications: PlatformNotification[];
  fcus: Record<string, FcuState>;
  dampers: Record<string, boolean>;

  triggerFireAlarm: (zone?: ZoneId) => void;
  resolveFireAlarm: () => void;
  failMains: () => void;
  restoreMains: () => void;
  triggerIntrusion: (known: boolean) => void;
  clearIntrusion: () => void;
  notify: (n: Omit<PlatformNotification, 'id' | 'time' | 'read'>) => void;
  markAllRead: () => void;
  dismiss: (id: string) => void;
  setFcu: (id: string, patch: Partial<FcuState>) => void;
  setDamper: (id: string, open: boolean) => void;
}

const yesterdayAt = (h: number, m: number) => {
  const d = new Date();
  d.setDate(d.getDate() - 1);
  d.setHours(h, m, 0, 0);
  return d.getTime();
};

let seq = 0;
const nid = () => `n${Date.now().toString(36)}${(seq++).toString(36)}`;

/**
 * Scenario-driven parts of the simulation: things that happen because someone did something (a fire
 * drill, an operator switching an FCU off) rather than because time passed. Shared by every screen,
 * so a fire alarm raised on the Fire System screen lights up the site map, the 3D view and the bell.
 */
export const useScenario = create<ScenarioStore>((set, get) => ({
  fire: {
    active: false,
    triggeredAt: null,
    detectors: [],
    zone: null,
    lastAlarmAt: yesterdayAt(16, 32),
    lastResolvedAt: yesterdayAt(16, 49),
  },
  notifications: [
    {
      id: nid(),
      time: Date.now() - 42 * 60_000,
      system: 'BMS',
      severity: 'warning',
      title: 'Dirty filter — FAHU-07',
      detail: 'Bag-filter ΔP switch made on FAHU-07 (B02 roof). Planned work order raised (SOP-HV-06).',
      route: '/hvac/air',
      read: false,
    },
    {
      id: nid(),
      time: Date.now() - 3 * 3_600_000,
      system: 'Maintenance',
      severity: 'info',
      title: 'Work order closed',
      detail: 'WO-24291 Cooling tower CT-02 fan inspection completed (PPM-03).',
      route: '/cafm/orders',
      read: true,
    },
  ],
  mains: { failed: false, failedAt: null, restoredAt: null },
  intrusion: { active: false, door: '', building: '', camera: '', at: null, identity: null },
  fcus: {},
  dampers: {},

  triggerFireAlarm: (zone = 'b03') => {
    if (get().fire.active) return;
    const now = Date.now();
    const z = zoneById(zone);
    set((s) => ({
      fire: { ...s.fire, active: true, triggeredAt: now, detectors: [`${z?.short}-L02-SD07`, `${z?.short}-L02-SD08`], zone, lastAlarmAt: now },
    }));
    get().notify({
      system: 'Fire',
      severity: 'critical',
      title: `Fire alarm — ${z?.label}`,
      detail: 'Two smoke detectors on Level 02. Cause-and-effect: smoke fans and stair pressurisation started, FAHUs stopped, lifts recalled, PA evacuation (SOP-LS-01).',
      route: '/safety/fire',
    });
  },

  resolveFireAlarm: () => {
    if (!get().fire.active) return;
    const z = zoneById(get().fire.zone ?? undefined);
    set((s) => ({ fire: { ...s.fire, active: false, detectors: [], zone: null, lastResolvedAt: Date.now() } }));
    get().notify({ system: 'Fire', severity: 'info', title: 'Fire alarm reset', detail: `${z?.label ?? 'Zone'} reset with Fire Warden approval. Smoke fans back to standby, FAHUs and lifts back in service.`, route: '/safety/fire' });
  },

  failMains: () => {
    if (get().mains.failed) return;
    set({ mains: { failed: true, failedAt: Date.now(), restoredAt: null } });
    get().notify({
      system: 'Electric',
      severity: 'critical',
      title: 'Utility supply lost',
      detail: 'MV ring de-energised. 19 generators starting; ATS units transferring; UPS units on battery until then (SOP-EL-01).',
      route: '/electric/sld',
    });
  },

  restoreMains: () => {
    if (!get().mains.failed) return;
    set((s) => ({ mains: { ...s.mains, failed: false, restoredAt: Date.now() } }));
    get().notify({ system: 'Electric', severity: 'info', title: 'Utility supply restored', detail: 'All ATS back on mains. Generators unloaded and cooling down.', route: '/electric/standby' });
  },

  triggerIntrusion: (known) => {
    if (get().intrusion.active) return;
    const identity = known ? { name: 'Mahmoud Adel', id: 'EMP-10431', role: 'Facilities contractor · badge not valid for this door' } : null;
    set({ intrusion: { active: true, door: 'B01 Service Corridor', building: 'b01', camera: 'CAM-06', at: Date.now(), identity } });
    get().notify({
      system: 'Security',
      severity: 'critical',
      title: 'Door forced — B01 Service Corridor',
      detail: identity ? `CCTV captured the face: ${identity.name} (${identity.id}), badge not valid for this door.` : 'CCTV captured the face: no match in the badge or face database.',
      route: '/security/access',
    });
  },

  clearIntrusion: () => {
    if (!get().intrusion.active) return;
    set((s) => ({ intrusion: { ...s.intrusion, active: false } }));
    get().notify({ system: 'Security', severity: 'info', title: 'Door alarm acknowledged', detail: 'B01 Service Corridor secured; security officer dispatched (SOP-SC-01).', route: '/security/access' });
  },

  notify: (n) => set((s) => ({ notifications: [{ ...n, id: nid(), time: Date.now(), read: false }, ...s.notifications].slice(0, 50) })),
  markAllRead: () => set((s) => ({ notifications: s.notifications.map((n) => ({ ...n, read: true })) })),
  dismiss: (id) => set((s) => ({ notifications: s.notifications.filter((n) => n.id !== id) })),

  setFcu: (id, patch) =>
    set((s) => ({ fcus: { ...s.fcus, [id]: { ...(s.fcus[id] ?? DEFAULT_FCU), ...patch } } })),
  setDamper: (id, open) => set((s) => ({ dampers: { ...s.dampers, [id]: open } })),
}));

export const DEFAULT_FCU: FcuState = { on: true, fan: 2, mode: 'Cooling', setpoint: 22 };
