import { useMemo, useState } from 'react';
import { Panel } from '@/components/frame/Panel';
import { DataTable, Meter, Tag, type TagTone } from '@/components/data/DataTable';
import { RingGauge } from '@/components/gauges/Gauges';
import { row } from '@/screens/layout';
import { hash01 } from '@/model/assets/galaxy';
import { ASSETS, KINDS, type AssetKind } from '@/model/central/assets';
import { overdue, ppmPlan, SLA_HOURS, woStatus, workOrders, type WoStatus } from '@/model/central/cafm';
import { BUILDINGS, TIERS, ZONES, zoneById, type SourceTier, type ZoneId } from '@/model/central/project';
import { useFleet } from '@/model/central/useFleet';
import { useScenario } from '@/sim/scenario';
import { useScope } from '@/sim/scope';
import { Big, FleetPanel, KpiTile, TierBadge, ZoneBars, useDrawer, useFleetRows } from '@/screens/central/kit';
import { fmt } from '@/utils/format';

const n = (x: unknown) => (typeof x === 'number' ? x : 0);

/* ================================================================================================
 * Life Safety › Fire Alarm (panel content assumed; cause-and-effect read from proven BMS points)
 * ============================================================================================== */

export function FireAlarmScreen() {
  const tiles = row(208, 150, 4);
  const [ce, side] = row(383, 595, [1.45, 1]);
  const fire = useScenario((s) => s.fire);
  const scope = useScope();
  const [pick, setPick] = useState<ZoneId>('b03');
  const zone: ZoneId = fire.active && fire.zone ? fire.zone : scope !== 'project' && scope !== 'bs' ? (scope as ZoneId) : pick;
  const panels = useFleetRows(['facp']);
  return (
    <>
      <KpiTile id="EX-06" frame={tiles[0]} index={0} big />
      <KpiTile id="OP-15" frame={tiles[1]} index={1} />
      <Panel frame={tiles[2]} index={2} title="Panels in Fire Alarm" subtitle="8 FACPs · BACnet IP to AVEVA">
        <Big value={panels.filter((r) => r.s.values.Fire_Alarm).length} tone={fire.active ? 'bad' : 'neutral'} note={fire.active ? `${zoneById(fire.zone ?? undefined)?.label} · ${fire.detectors.join(', ')}` : 'No fire alarm'} />
      </Panel>
      <Panel frame={tiles[3]} index={3} title="Fire Drill" subtitle="Runs SOP-LS-01 cause-and-effect">
        <div className="absolute inset-x-[18px] bottom-[16px] flex items-center gap-[10px]">
          <select value={zone} disabled={fire.active} onChange={(e) => setPick(e.target.value as ZoneId)} className="h-[40px] rounded-[10px] border border-accent/30 bg-night-900 px-[10px] text-white">
            {BUILDINGS.map((b) => (
              <option key={b.id} value={b.id}>
                {b.label}
              </option>
            ))}
          </select>
          {fire.active ? (
            <button onClick={() => useScenario.getState().resolveFireAlarm()} className="pf-chip h-[40px] flex-1 border border-ok/50 text-ok hover:bg-ok/10">Reset alarm</button>
          ) : (
            <button onClick={() => useScenario.getState().triggerFireAlarm(zone)} className="pf-chip h-[40px] flex-1 border border-alarm/50 text-alarm-soft hover:bg-alarm/10">Simulate fire</button>
          )}
        </div>
      </Panel>
      <Panel frame={ce} index={4} title={`Cause & Effect · ${zoneById(zone)?.label}`} subtitle={fire.active ? 'Fire alarm ACTIVE — each effect verified from live points' : 'Standby — what the fire alarm will do, and the points that prove it'}>
        <CauseEffect zone={zone} active={fire.active && fire.zone === zone} />
      </Panel>
      <FleetPanel frame={side} index={5} title="Fire Alarm Panels" subtitle="Panel content assumed (by others) · click for the assumed object list" rows={panels} />
    </>
  );
}

function CauseEffect({ zone, active }: { zone: ZoneId; active: boolean }) {
  const { snap } = useFleet();
  const of = (k: AssetKind[]) => ASSETS.filter((a) => a.zone === zone && k.includes(a.kind)).map((a) => snap.states.get(a.tag)!);
  const smoke = of(['smoke']);
  const press = of(['press']);
  const ahu = of(['fahu', 'ahu']);
  const lifts = of(['elv']);
  const pa = of(['pa']);
  const lines: { effect: string; points: string; tier: SourceTier; total: number; done: number; expect: string }[] = [
    { effect: 'Smoke extract fans start', points: '$SmokeFan.Sts_Run + Airflow_DPS', tier: 'io', total: smoke.length, done: smoke.filter((s) => s.values.Sts_Run).length, expect: 'Running' },
    { effect: 'Stair pressurisation to 40–50 Pa', points: '$StairPressFan.Stair_DP', tier: 'io', total: press.length, done: press.filter((s) => n(s.values.Stair_DP) >= 40).length, expect: '≥ 40 Pa' },
    { effect: 'FAHU / AHU shut down, dampers closed', points: '$FAHU.Sts_Run = False · Sts_Damper', tier: 'io', total: ahu.length, done: ahu.filter((s) => !s.values.Sts_Run).length, expect: 'Stopped' },
    { effect: 'Lifts recalled to ground, doors open', points: '$Elevator.Fire_Recall · Floor = 0', tier: 'aveva', total: lifts.length, done: lifts.filter((s) => s.values.Fire_Recall).length, expect: 'Recalled' },
    { effect: 'PA evacuation message', points: '$PublicAddress.Evac_Active', tier: 'assumed', total: pa.length, done: pa.filter((s) => s.values.Evac_Active).length, expect: 'Playing' },
    { effect: 'Access-control doors on escape routes released', points: 'ACS release (by others)', tier: 'assumed', total: 1, done: active ? 1 : 0, expect: 'Released' },
  ];
  return (
    <div className="absolute inset-x-[4px] bottom-[10px] top-[4px]">
      <DataTable
        rows={lines}
        rowKey={(l) => l.effect}
        highlight={(l) => (active && l.done < l.total ? 'alarm' : null)}
        columns={[
          { key: 'e', header: 'Effect', render: (l) => <span className="text-white">{l.effect}</span> },
          { key: 'p', header: 'Verified by', width: 290, render: (l) => <span className="font-mono text-[12px] text-ink-3">{l.points}</span> },
          { key: 't', header: 'Data', width: 100, render: (l) => <TierBadge tier={l.tier} /> },
          { key: 'n', header: 'Units', width: 70, align: 'right', render: (l) => (l.total ? `${l.done}/${l.total}` : '—') },
          {
            key: 's',
            header: 'State',
            width: 140,
            render: (l) =>
              !l.total ? <Tag tone="idle">None here</Tag> : active ? l.done === l.total ? <Tag tone="good">{l.expect}</Tag> : <Tag tone="bad">Not achieved</Tag> : <Tag tone="idle">Standby</Tag>,
          },
        ]}
      />
    </div>
  );
}

/* ================================================================================================
 * Life Safety › Smoke Control (proven hardwired I/O)
 * ============================================================================================== */

export function SmokeControlScreen() {
  const tiles = row(208, 150, 4);
  const [left, table] = row(383, 595, [1, 1.6]);
  const fans = useFleetRows(['smoke', 'press']);
  const notAuto = fans.filter((r) => r.s.values.Sts_Auto === false).length;
  const trips = fans.filter((r) => r.s.values.Alm_Trip).length;
  const dp = fans.filter((r) => r.a.kind === 'press' && r.s.values.Sts_Run).map((r) => n(r.s.values.Stair_DP));
  return (
    <>
      <KpiTile id="EX-06" frame={tiles[0]} index={0} big />
      <Panel frame={tiles[1]} index={1} title="Fans Not in Auto" subtitle="Hand/Off/Auto selector (DI)">
        <Big value={notAuto} tone={notAuto ? 'warn' : 'neutral'} note="Impairs smoke control (SOP-LS-02)" />
      </Panel>
      <Panel frame={tiles[2]} index={2} title="Fans Tripped" subtitle="Overload / power fail (DI)">
        <Big value={trips} tone={trips ? 'bad' : 'neutral'} note={`${fans.length} life-safety fans in scope`} />
      </Panel>
      <Panel frame={tiles[3]} index={3} title="Stair Pressure" subtitle="ΔP transmitter on running fans">
        <Big value={dp.length ? Math.round(dp.reduce((a, b) => a + b, 0) / dp.length) : '—'} unit={dp.length ? 'Pa' : ''} note="Target 40–50 Pa in fire mode" />
      </Panel>
      <Panel frame={{ ...left, h: 285 }} index={4} title="Readiness per Building" subtitle="Fans installed vs ready (Auto, no trip)">
        <ZoneBars kinds={['smoke', 'press']} a={(r) => r.length} b={(r) => r.filter((x) => x.s.values.Sts_Auto && !x.s.values.Alm_Trip).length} names={{ a: 'Installed', b: 'Ready' }} yTitle="Fans" />
      </Panel>
      <Panel frame={{ ...left, y: left.y + 310, h: 285 }} index={5} title="Weekly Test" subtitle="SOP-LS-06 · last run Sunday 06:00">
        <WeeklyTest count={fans.length} />
      </Panel>
      <FleetPanel frame={table} index={6} title="Smoke Extract & Pressurisation Fans" rows={fans} />
    </>
  );
}

function WeeklyTest({ count }: { count: number }) {
  const { now } = useFleet();
  const week = Math.floor(now / 604_800_000);
  const failed = Math.floor(hash01(`lstest${week}`) * 3);
  return (
    <div className="flex h-full items-center gap-[24px] px-[20px] pb-[10px]">
      <RingGauge segments={[{ value: count - failed, color: '#9d78ff' }, { value: failed, color: '#d96b84' }]} value={`${count - failed}/${count}`} unit="passed" size={170} />
      <p className="text-[14px] leading-snug text-ink-3">Each fan commanded from the BMS; airflow proven within 30 s and stair ΔP logged. {failed ? `${failed} failed → SOP-LS-02 work order raised.` : 'All passed.'}</p>
    </div>
  );
}

/* ================================================================================================
 * Life Safety › Public Address (assumed)
 * ============================================================================================== */

export function PublicAddressScreen() {
  const tiles = row(208, 150, 3);
  const [table] = row(383, 595, 1);
  const racks = useFleetRows(['pa']);
  const fire = useScenario((s) => s.fire.active);
  return (
    <>
      <KpiTile id="OP-16" frame={tiles[0]} index={0} big />
      <Panel frame={tiles[1]} index={1} title="Evacuation Messages" subtitle="Racks playing evacuation">
        <Big value={racks.filter((r) => r.s.values.Evac_Active).length} tone={fire ? 'bad' : 'neutral'} note={fire ? 'Fire drill active' : 'None'} />
      </Panel>
      <Panel frame={tiles[2]} index={2} title="Integration" subtitle="AVEVA matrix: Public Address System · BACnet IP">
        <div className="absolute inset-x-[18px] bottom-[16px] flex items-center gap-[10px]">
          <TierBadge tier="assumed" long />
          <span className="text-[13px] text-ink-3">Rack / zone objects assumed</span>
        </div>
      </Panel>
      <FleetPanel frame={table} index={3} title="PA Racks" rows={racks} />
    </>
  );
}

/* ================================================================================================
 * Facilities › Lifts & Escalators
 * ============================================================================================== */

export function TransportScreen() {
  const tiles = row(208, 150, 4);
  const [bars, table] = row(383, 595, [1, 1.6]);
  const units = useFleetRows(['elv', 'esc']);
  const lifts = units.filter((r) => r.a.kind === 'elv');
  const esc = units.filter((r) => r.a.kind === 'esc');
  const trips = lifts.reduce((a, r) => a + n(r.s.values.Trips_Today), 0);
  return (
    <>
      <KpiTile id="EX-09" frame={tiles[0]} index={0} big />
      <KpiTile id="OP-14" frame={tiles[1]} index={1} />
      <Panel frame={tiles[2]} index={2} title="Lift Trips Today" subtitle="54 lifts · Modbus TCP">
        <Big value={fmt(trips)} note={`${lifts.filter((r) => r.s.status === 'run').length} moving now`} />
      </Panel>
      <Panel frame={tiles[3]} index={3} title="Escalators Running" subtitle="19 units · Basement / podium">
        <Big value={`${esc.filter((r) => r.s.values.Running).length} / ${esc.length}`} note="Operating hours 09:00–24:00" />
      </Panel>
      <Panel frame={bars} index={4} title="Lifts per Building" subtitle="Installed vs in service">
        <ZoneBars kinds={['elv']} a={(r) => r.length} b={(r) => r.filter((x) => x.s.values.In_Service).length} names={{ a: 'Installed', b: 'In service' }} yTitle="Lifts" />
      </Panel>
      <FleetPanel frame={table} index={5} title="Lifts & Escalators" rows={units} />
    </>
  );
}

/* ================================================================================================
 * Facilities › Drainage (32 duplex sump sets, B2)
 * ============================================================================================== */

export function DrainageScreen() {
  const tiles = row(208, 150, 4);
  const [grid, table] = row(383, 595, [1.2, 1]);
  const sets = useFleetRows(['sump'], { plantWide: true });
  const open = useDrawer((s) => s.open);
  return (
    <>
      <KpiTile id="OP-11" frame={tiles[0]} index={0} big />
      <KpiTile id="MT-05" frame={tiles[1]} index={1} />
      <Panel frame={tiles[2]} index={2} title="Pumps Running" subtitle="64 pumps in 32 duplex sets">
        <Big value={sets.reduce((a, r) => a + (r.s.values.P1_Run ? 1 : 0) + (r.s.values.P2_Run ? 1 : 0), 0)} note="Float-switch controlled" />
      </Panel>
      <Panel frame={tiles[3]} index={3} title="Pumps Tripped" subtitle="Duty covered by the partner pump">
        <Big value={sets.filter((r) => r.s.values.P1_Trip || r.s.values.P2_Trip).length} tone={sets.some((r) => r.s.values.P1_Trip) ? 'warn' : 'neutral'} note="SOP-DR-02" />
      </Panel>
      <Panel frame={grid} index={4} title="Sump Pits · Basement 02" subtitle="Each tile one duplex set · pumps 1 / 2 and pit level · click for points" action={<TierBadge tier="io" long />}>
        <div className="absolute inset-x-[20px] bottom-[18px] top-[6px] grid grid-cols-8 gap-[10px]">
          {sets.map((r) => {
            const hi = r.s.values.High_Level;
            const trip = r.s.values.P1_Trip;
            return (
              <button key={r.a.tag} onClick={() => open(r.a.tag)} className="flex flex-col justify-between rounded-[10px] border p-[8px] text-left" style={{ borderColor: hi ? '#d96b84' : trip ? '#e8a98c' : 'rgba(255,255,255,0.08)', background: hi ? 'rgba(217,107,132,0.18)' : 'rgba(8,5,11,0.6)', animation: hi ? 'pf-alarm-blink 1s infinite' : undefined }}>
                <span className="text-[12px] text-white">{r.a.label}</span>
                <span className="flex gap-[5px]">
                  <span className="h-[10px] w-[10px] rounded-full" style={{ background: r.s.values.P1_Trip ? '#e8a98c' : r.s.values.P1_Run ? '#9d78ff' : '#3c3148' }} />
                  <span className="h-[10px] w-[10px] rounded-full" style={{ background: r.s.values.P2_Run ? '#9d78ff' : '#3c3148' }} />
                </span>
                <span className="text-[10px] text-ink-3">{hi ? 'HIGH' : r.s.values.Low_Level ? 'Low' : 'Pumping'}</span>
              </button>
            );
          })}
        </div>
      </Panel>
      <FleetPanel frame={table} index={5} title="Sump Sets" rows={sets} />
    </>
  );
}

/* ================================================================================================
 * Facilities › Lighting (KNX via BACnet IP to the BMS — group points assumed)
 * ============================================================================================== */

const LIGHT_GROUPS = [
  { id: 'facade', label: 'Façade lighting', on: (h: number) => h >= 18 || h < 1, kw: 14 },
  { id: 'landscape', label: 'Landscape & plaza', on: (h: number) => h >= 18 || h < 2, kw: 9 },
  { id: 'common', label: 'Common areas & lobbies', on: (h: number) => h >= 7, kw: 22 },
  { id: 'corridor', label: 'Corridors (night 30 %)', on: () => true, kw: 11 },
  { id: 'carpark', label: 'Car park (B1/B2)', on: () => true, kw: 31 },
];

export function LightingScreen() {
  const tiles = row(208, 150, 3);
  const [table] = row(383, 595, 1);
  const { now } = useFleet();
  const h = new Date(now).getHours();
  const rows = ZONES.flatMap((z) => LIGHT_GROUPS.filter((g) => (z.id === 'bs' ? g.id === 'carpark' : g.id !== 'carpark')).map((g) => ({ z, g, on: g.on(h), dim: g.id === 'corridor' && (h >= 23 || h < 6) ? 30 : 100 })));
  const kw = rows.reduce((a, r) => a + (r.on ? (r.g.kw * r.dim) / 100 : 0), 0);
  return (
    <>
      <Panel frame={tiles[0]} index={0} title="Groups On" subtitle="By KNX time schedule">
        <Big value={`${rows.filter((r) => r.on).length} / ${rows.length}`} note={`${String(h).padStart(2, '0')}:00 · astronomical clock`} />
      </Panel>
      <Panel frame={tiles[1]} index={1} title="Lighting Load" subtitle="Estimated from group ratings">
        <Big value={fmt(kw)} unit="kW" note="Ratings assumed" />
      </Panel>
      <Panel frame={tiles[2]} index={2} title="Integration" subtitle="BMS matrix: Lighting Control System KNX-01 · BACnet IP">
        <div className="absolute inset-x-[18px] bottom-[16px] flex items-center gap-[10px]">
          <TierBadge tier="bms" long />
          <span className="text-[13px] text-ink-3">Group list assumed until the KNX project is shared</span>
        </div>
      </Panel>
      <Panel frame={table} index={3} title="Lighting Groups" subtitle="Status per building · groups assumed">
        <div className="absolute inset-x-[4px] bottom-[10px] top-[4px]">
          <DataTable
            dense
            rows={rows}
            rowKey={(r) => `${r.z.id}-${r.g.id}`}
            columns={[
              { key: 'z', header: 'Zone', width: 180, render: (r) => <span className="text-white">{r.z.label}</span> },
              { key: 'g', header: 'Group', render: (r) => r.g.label },
              { key: 's', header: 'State', width: 120, render: (r) => (r.on ? <Tag tone="info">On</Tag> : <Tag tone="idle">Off</Tag>) },
              { key: 'd', header: 'Level', width: 160, render: (r) => (r.on ? <Meter value={r.dim} width={90} /> : '—') },
              { key: 'k', header: 'Load', width: 100, align: 'right', render: (r) => (r.on ? `${fmt((r.g.kw * r.dim) / 100, 1)} kW` : '—') },
              { key: 't', header: 'Data', width: 110, render: () => <TierBadge tier="assumed" /> },
            ]}
          />
        </div>
      </Panel>
    </>
  );
}

/* ================================================================================================
 * CAFM (by others — assumed)
 * ============================================================================================== */

const WO_TONE: Record<WoStatus, TagTone> = { Open: 'warn', Assigned: 'info', 'In progress': 'info', Closed: 'good' };

export function WorkOrdersScreen() {
  const tiles = row(208, 150, 4);
  const [table, side] = row(383, 595, [1.75, 1]);
  const { now, scope } = useFleet(60_000);
  const open = useDrawer((s) => s.open);
  const wos = useMemo(() => workOrders(now, 7, scope), [now, scope]);
  const sorted = useMemo(() => [...wos].sort((a, b) => Number(now >= a.closed) - Number(now >= b.closed) || b.created - a.created), [wos, now]);
  const byTrade = ['HVAC', 'Electrical', 'Plumbing', 'Lifts', 'Fire & Life Safety', 'BMS'].map((t, i) => ({ t, n: wos.filter((w) => w.trade === t).length, color: ['#9d78ff', '#e4ccff', '#7fcf9d', '#b58ce3', '#d96b84', '#e8a98c'][i] }));
  return (
    <>
      <KpiTile id="EX-11" frame={tiles[0]} index={0} big />
      <KpiTile id="MT-03" frame={tiles[1]} index={1} />
      <KpiTile id="MT-04" frame={tiles[2]} index={2} />
      <Panel frame={tiles[3]} index={3} title="From AVEVA Alarms" subtitle="Share of WOs raised automatically (7 days)">
        <Big value={wos.length ? Math.round((wos.filter((w) => w.source === 'AVEVA alarm').length / wos.length) * 100) : 0} unit="%" note="AVEVA Work Task → CAFM (SOP-FM-01)" />
      </Panel>
      <Panel frame={table} index={4} title={`Work Orders · last 7 days · ${wos.length}`} subtitle="Open first · row → the asset's live points" action={<TierBadge tier="assumed" long />}>
        <div className="absolute inset-x-[4px] bottom-[10px] top-[4px]">
          <DataTable
            dense
            rows={sorted.slice(0, 250)}
            rowKey={(w) => w.id}
            onRowClick={(w) => open(w.asset.tag)}
            highlight={(w) => (now < w.closed && overdue(w, now) ? 'alarm' : null)}
            columns={[
              { key: 'id', header: 'WO', width: 90, render: (w) => <span className="font-mono text-[12px] text-accent">{w.id}</span> },
              { key: 'p', header: 'Pri.', width: 44, render: (w) => w.priority },
              { key: 't', header: 'Title', render: (w) => <span className="text-white">{w.title}</span> },
              { key: 'a', header: 'Asset', width: 140, render: (w) => w.asset.label },
              { key: 'tr', header: 'Trade', width: 130, render: (w) => w.trade },
              { key: 'src', header: 'Source', width: 120, render: (w) => w.source },
              { key: 'sla', header: 'SLA', width: 60, align: 'right', render: (w) => `${SLA_HOURS[w.priority]} h` },
              { key: 's', header: 'Status', width: 120, render: (w) => <Tag tone={now < w.closed && overdue(w, now) ? 'bad' : WO_TONE[woStatus(w, now)]}>{now < w.closed && overdue(w, now) ? 'Overdue' : woStatus(w, now)}</Tag> },
            ]}
          />
        </div>
      </Panel>
      <Panel frame={{ ...side, h: 300 }} index={5} title="By Trade" subtitle="Last 7 days">
        <div className="flex h-full items-center gap-[20px] px-[20px] pb-[10px]">
          <RingGauge segments={byTrade.map((b) => ({ value: b.n, color: b.color }))} value={String(wos.length)} unit="WOs" size={170} />
          <ul className="flex-1 space-y-[7px] text-[14px]">
            {byTrade.map((b) => (
              <li key={b.t} className="flex items-center gap-[8px] text-ink-2">
                <span className="h-[8px] w-[8px] rounded-full" style={{ background: b.color }} />
                {b.t}
                <span className="ml-auto tabular-nums text-white">{b.n}</span>
              </li>
            ))}
          </ul>
        </div>
      </Panel>
      <Panel frame={{ ...side, y: side.y + 325, h: 270 }} index={6} title="Priority SLAs" subtitle="Assumed — confirm with the FM contract">
        <dl className="absolute inset-x-[20px] top-[6px] grid grid-cols-2 gap-y-[10px] text-[15px]">
          {(['P1', 'P2', 'P3', 'P4'] as const).map((p) => (
            <div key={p} className="contents">
              <dt className="text-ink-3">{p} · {p === 'P1' ? 'Emergency' : p === 'P2' ? 'Urgent' : p === 'P3' ? 'Normal' : 'Planned'}</dt>
              <dd className="text-right text-white">{SLA_HOURS[p]} h to close</dd>
            </div>
          ))}
        </dl>
      </Panel>
    </>
  );
}

export function PpmScreen() {
  const tiles = row(208, 150, 3);
  const [table] = row(383, 595, 1);
  const { now } = useFleet(60_000);
  const plan = ppmPlan(now);
  const due = plan.reduce((a, p) => a + p.due, 0);
  const done = plan.reduce((a, p) => a + Math.min(p.done, p.due), 0);
  return (
    <>
      <KpiTile id="EX-12" frame={tiles[0]} index={0} big />
      <Panel frame={tiles[1]} index={1} title="PPM Due to Date" subtitle={new Date(now).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}>
        <Big value={fmt(due)} note={`${fmt(done)} done on time`} />
      </Panel>
      <KpiTile id="MT-01" frame={tiles[2]} index={2} />
      <Panel frame={table} index={3} title="PPM Plan" subtitle="Run-hour based tasks use the BMS run hours; calendar tasks the CAFM schedule" action={<TierBadge tier="assumed" long />}>
        <div className="absolute inset-x-[4px] bottom-[10px] top-[4px]">
          <DataTable
            rows={plan}
            rowKey={(p) => p.id}
            highlight={(p) => (p.done < p.due * 0.85 ? 'warn' : null)}
            columns={[
              { key: 'id', header: 'ID', width: 80, render: (p) => <span className="font-mono text-[12px] text-accent">{p.id}</span> },
              { key: 't', header: 'Task', render: (p) => <span className="text-white">{p.title}</span> },
              { key: 'k', header: 'Assets', width: 170, render: (p) => p.kinds },
              { key: 'i', header: 'Interval', width: 190, render: (p) => p.interval },
              { key: 'b', header: 'Trigger', width: 150, render: (p) => (p.basis === 'Calendar' ? <Tag tone="idle" dot={false}>Calendar</Tag> : <Tag tone="info" dot={false}>BMS run hours</Tag>) },
              { key: 'q', header: 'Due / done', width: 110, align: 'right', render: (p) => `${p.due} / ${Math.min(p.done, p.due)}` },
              { key: 'm', header: 'Progress', width: 170, render: (p) => <Meter value={p.due ? (Math.min(p.done, p.due) / p.due) * 100 : 100} tone={p.done < p.due * 0.85 ? 'warn' : 'good'} width={100} /> },
            ]}
          />
        </div>
      </Panel>
    </>
  );
}

export function AssetRegisterScreen() {
  const [table, side] = row(208, 770, [1.6, 1]);
  const [kind, setKind] = useState<AssetKind>('fahu');
  const kinds = Object.keys(KINDS) as AssetKind[];
  const def = KINDS[kind];
  return (
    <>
      <Panel frame={table} index={0} title={`Asset Register · ${ASSETS.length.toLocaleString('en-US')} assets`} subtitle="Counts per zone from the EL served-equipment tables · select a type for its point template">
        <div className="absolute inset-x-[4px] bottom-[10px] top-[4px]">
          <DataTable
            dense
            rows={kinds}
            rowKey={(k) => k}
            onRowClick={(k) => setKind(k)}
            highlight={(k) => (k === kind ? 'warn' : null)}
            columns={[
              { key: 'k', header: 'Type', width: 220, render: (k) => <span className="text-white">{KINDS[k].plural}</span> },
              ...ZONES.map((z) => ({ key: z.id, header: z.short, width: 58, align: 'right' as const, render: (k: AssetKind) => { const c = ASSETS.filter((a) => a.kind === k && a.zone === z.id).length; return c ? c : <span className="text-ink-4">·</span>; } })),
              { key: 'tot', header: 'Total', width: 70, align: 'right', render: (k) => <span className="text-accent">{ASSETS.filter((a) => a.kind === k).length}</span> },
              { key: 't', header: 'Data', width: 100, render: (k) => <TierBadge tier={KINDS[k].tier} /> },
            ]}
          />
        </div>
      </Panel>
      <Panel frame={side} index={1} title={def.template.name} subtitle={def.template.desc}>
        <div className="pf-scroll absolute inset-x-[20px] bottom-[14px] top-[0px] text-[14px]">
          <p className="mb-[10px] text-[13px] text-ink-3">{def.template.io}</p>
          {def.template.attrs.map((a) => (
            <div key={a.name} className="flex items-center gap-[10px] border-b border-white/[0.06] py-[6px]">
              <span className="h-[7px] w-[7px] shrink-0 rounded-full" style={{ background: TIERS[a.src ?? def.tier].color }} title={TIERS[a.src ?? def.tier].label} />
              <span className="w-[150px] shrink-0 font-mono text-[12.5px] text-ink-2">{a.name}</span>
              <span className="min-w-0 flex-1 truncate text-[12.5px] text-ink-3" title={a.desc}>{a.desc}</span>
              <span className="w-[56px] shrink-0 text-right text-[10px] uppercase text-ink-4">{a.type}</span>
            </div>
          ))}
        </div>
      </Panel>
    </>
  );
}
