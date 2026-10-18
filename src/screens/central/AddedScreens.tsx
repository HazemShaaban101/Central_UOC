import { Panel } from '@/components/frame/Panel';
import { Tag } from '@/components/data/DataTable';
import { Glyph } from '@/components/icons/Glyph';
import { CardIcon, ElevatorIcon, LeafIcon } from '@/components/icons/UiIcons';
import { PairedBarChart, type BarGroup } from '@/components/charts/PairedBarChart';
import { ArcVerdict, CapsuleState, DialVerdict, KpiBody } from '@/widgets/Widgets';
import { TrendCard } from '@/widgets/TrendCard';
import { bands } from '@/widgets/verdicts';
import { row } from '@/screens/layout';
import { ASSETS, type AssetKind, type AssetState } from '@/model/central/assets';
import { ZONES } from '@/model/central/project';
import { useFleet } from '@/model/central/useFleet';
import { useScenario } from '@/sim/scenario';
import { useNow } from '@/sim/clock';

/**
 * Subsystems the submittal has and the platform demo did not: smoke control and public address
 * (Fire), lighting (Electric, KNX via BACnet IP) and lifts & escalators (Maintenance). They follow
 * the existing layouts: status cards like Fire System, or gauge + bars + history like Metering.
 */

const n = (x: unknown) => (typeof x === 'number' ? x : 0);

function useRows(kinds: AssetKind[]) {
  const { snap, scope } = useFleet();
  return ASSETS.filter((a) => kinds.includes(a.kind) && (scope === 'project' || a.zone === scope)).map((a) => ({ a, s: snap.states.get(a.tag)! as AssetState }));
}

function useZoneGroups(kinds: AssetKind[], a: (r: AssetState[]) => number, b: (r: AssetState[]) => number): BarGroup[] {
  const { snap, scope } = useFleet();
  return ZONES.filter((z) => (scope === 'project' || z.id === scope) && ASSETS.some((x) => x.zone === z.id && kinds.includes(x.kind))).map((z) => {
    const st = ASSETS.filter((x) => x.zone === z.id && kinds.includes(x.kind)).map((x) => snap.states.get(x.tag)!);
    return { label: z.short, a: Math.round(a(st)), b: Math.round(b(st)) };
  });
}

function Bars({ groups, names, yTitle }: { groups: BarGroup[]; names: { a: string; b: string }; yTitle: string }) {
  return (
    <div className="absolute inset-x-[18px] bottom-[12px] top-[2px]">
      <PairedBarChart data={groups} names={names} yTitle={yTitle} xTitle="Building" fillWidth={1} />
    </div>
  );
}

/* ---- Fire › Smoke Control (hardwired I/O on the roof LCPs) ------------------------------------- */

export function SmokeControlScreen() {
  const fire = useScenario((s) => s.fire.active);
  const smoke = useRows(['smoke']);
  const press = useRows(['press']);
  const ducts = useRows(['fahu', 'ahu']).filter((r) => r.s.values.Smoke_Det || r.s.values.Smoke_Det_Supply);
  const fans = [...smoke, ...press];
  const ready = fans.filter((r) => r.s.values.Sts_Auto && !r.s.values.Alm_Trip).length;
  const readiness = fans.length ? Math.round((ready / fans.length) * 100) : 100;
  const status = row(208, 150, 4);
  const [bars] = row(383, 595, 1);
  const flame = <Glyph id="flame" size={20} color="#ffffff" />;
  const groups = useZoneGroups(['smoke', 'press'], (r) => r.length, (r) => r.filter((s) => s.values.Sts_Auto && !s.values.Alm_Trip).length);
  return (
    <>
      <Panel frame={status[0]} index={0} icon={flame} title="Smoke Extract" subtitle={`${smoke.length} Smoke Fans`}>
        <CapsuleState capsule="Fans" state={fire ? 'Running' : 'Standby'} tone={fire ? 'warn' : 'good'} />
      </Panel>
      <Panel frame={status[1]} index={1} icon={flame} title="Stair Pressurisation" subtitle={`${press.length} Fans · Stair ΔP Control`}>
        <CapsuleState capsule="Stairs" state={fire ? 'Pressurised' : 'Ready'} tone={fire ? 'warn' : 'good'} />
      </Panel>
      <Panel frame={status[2]} index={2} icon={flame} title="Duct Smoke Detectors" subtitle="FAHU / AHU Supply And Return">
        <CapsuleState capsule="Ducts" state={ducts.length ? `${ducts.length} Alarm` : 'Clear'} tone={ducts.length ? 'bad' : 'good'} />
      </Panel>
      <Panel frame={status[3]} index={3} icon={<CardIcon />} title="Readiness" subtitle="Fans In Auto With No Trip">
        <KpiBody source={{ fixed: readiness }} decimals={0} unit="%" tone={readiness === 100 ? 'good' : readiness >= 95 ? 'warn' : 'bad'} note={readiness === 100 ? <Tag tone="good">All fans ready</Tag> : <Tag tone="warn">{fans.length - ready} impaired</Tag>} />
      </Panel>
      <Panel frame={bars} index={4} icon={flame} title="Smoke Control Per Building" subtitle="Smoke Extract And Pressurisation Fans · Installed vs Ready">
        <Bars groups={groups} names={{ a: 'Installed', b: 'Ready' }} yTitle="Fans" />
      </Panel>
    </>
  );
}

/* ---- Fire › Public Address (BACnet IP to AVEVA; content assumed) ------------------------------- */

const ZONES_PER_RACK = 12;

export function PublicAddressScreen() {
  const fire = useScenario((s) => s.fire.active);
  const now = useNow(60_000);
  const racks = useRows(['pa']);
  const faults = racks.filter((r) => r.s.values.Amp_Fault || r.s.values.Line_Fault).length;
  const zones = racks.reduce((a, r) => a + n(r.s.values.Zones_Healthy), 0);
  const status = row(208, 150, 4);
  const [bars] = row(383, 595, 1);
  const icon = <CardIcon />;
  const groups = useZoneGroups(['pa'], (r) => r.length * ZONES_PER_RACK, (r) => r.reduce((a, s) => a + n(s.values.Zones_Healthy), 0));
  const lastTest = new Date(now - ((new Date(now).getDay() + 2) % 7) * 86_400_000).toLocaleDateString('en-GB', { weekday: 'short', day: '2-digit', month: 'short' });
  return (
    <>
      <Panel frame={status[0]} index={0} icon={icon} title="Status" subtitle="Current Broadcast">
        <CapsuleState capsule="PA" state={fire ? 'Evacuation' : 'Normal'} tone={fire ? 'bad' : 'good'} />
      </Panel>
      <Panel frame={status[1]} index={1} icon={icon} title="Amplifiers" subtitle={`${racks.length} PA Racks`}>
        <CapsuleState capsule="Racks" state={faults ? `${faults} Fault` : 'Healthy'} tone={faults ? 'warn' : 'good'} />
      </Panel>
      <Panel frame={status[2]} index={2} icon={icon} title="Speaker Zones" subtitle="Zones Healthy">
        <KpiBody source={{ fixed: zones }} decimals={0} unit={`/ ${racks.length * ZONES_PER_RACK}`} tone={faults ? 'warn' : 'good'} note={<Tag tone={faults ? 'warn' : 'good'}>{faults ? 'Line or amplifier fault' : 'All zones healthy'}</Tag>} />
      </Panel>
      <Panel frame={status[3]} index={3} icon={icon} title="Last Test" subtitle="Weekly Chime And Message Test">
        <div className="flex h-full flex-col justify-center gap-[10px] px-[22px] pb-[14px]">
          <span className="text-[26px] leading-none text-white">{lastTest} · 07:00</span>
          <Tag tone="good">Passed</Tag>
        </div>
      </Panel>
      <Panel frame={bars} index={4} icon={icon} title="Speaker Zones Per Building" subtitle="Zones vs Healthy Zones">
        <Bars groups={groups} names={{ a: 'Zones', b: 'Healthy' }} yTitle="Zones" />
      </Panel>
    </>
  );
}

/* ---- Electric › Lighting (KNX via BACnet IP; groups assumed) ----------------------------------- */

const GROUPS_PER_BUILDING = 12;

export function LightingScreen() {
  const now = useNow(60_000);
  const { scope } = useFleet();
  const h = new Date(now).getHours();
  const night = h >= 18 || h < 6;
  const onShare = (zone: string) => (zone === 'bs' ? 1 : night ? 0.75 : 0.42);
  const zones = ZONES.filter((z) => scope === 'project' || z.id === scope);
  const total = zones.length * GROUPS_PER_BUILDING;
  const on = zones.reduce((a, z) => a + Math.round(GROUPS_PER_BUILDING * onShare(z.id)), 0);
  const [g, b] = row(208, 355, 2);
  const [t] = row(588, 358, 1);
  const groups = zones.map((z) => ({ label: z.short, a: GROUPS_PER_BUILDING, b: Math.round(GROUPS_PER_BUILDING * onShare(z.id)) }));
  return (
    <>
      <Panel frame={g} index={0} icon={<LeafIcon />} title="Lighting Groups On" subtitle="KNX Lighting Control · Time Schedule">
        <ArcVerdict source={{ fixed: total ? (on / total) * 100 : 0 }} label="Groups On" suffix="%" decimals={0} verdict={() => ({ text: night ? 'Night Schedule' : 'Day Schedule', tone: 'good' })} />
      </Panel>
      <Panel frame={b} index={1} icon={<LeafIcon />} title="Lighting Per Building" subtitle="Groups vs Groups On">
        <Bars groups={groups} names={{ a: 'Groups', b: 'On' }} yTitle="Groups" />
      </Panel>
      <TrendCard frame={t} index={2} icon={<LeafIcon />} title="Lighting Load History" subtitle="Lighting Boards" sim="lighting.load" yTitle="Load (kW)" decimals={0} />
    </>
  );
}

/* ---- Maintenance › Lifts & Escalators (Modbus TCP to AVEVA) ------------------------------------ */

export function LiftsScreen() {
  const units = useRows(['elv', 'esc']);
  const ok = units.filter((r) => r.s.status !== 'fault').length;
  const availability = units.length ? (ok / units.length) * 100 : 100;
  const [g, b] = row(208, 355, 2);
  const [t] = row(588, 358, 1);
  const groups = useZoneGroups(['elv', 'esc'], (r) => r.length, (r) => r.filter((s) => s.status !== 'fault').length);
  return (
    <>
      <Panel frame={g} index={0} icon={<ElevatorIcon />} title="Availability" subtitle={`${units.filter((r) => r.a.kind === 'elv').length} Lifts · ${units.filter((r) => r.a.kind === 'esc').length} Escalators In Service`}>
        <DialVerdict
          source={{ fixed: availability, unit: '%' }}
          decimals={1}
          verdict={bands([
            { max: 95, text: 'Below Target', tone: 'bad' },
            { max: 98, text: 'Fair', tone: 'warn' },
            { max: 100, text: 'Good', tone: 'good' },
          ])}
        />
      </Panel>
      <Panel frame={b} index={1} icon={<ElevatorIcon />} title="Units Per Building" subtitle="Installed vs In Service">
        <Bars groups={groups} names={{ a: 'Installed', b: 'In Service' }} yTitle="Units" />
      </Panel>
      <TrendCard frame={t} index={2} icon={<ElevatorIcon />} title="Lift Utilisation History" subtitle="Average Across All Lifts" sim="elevator.avg" yTitle="Utilisation (%)" decimals={0} />
    </>
  );
}
