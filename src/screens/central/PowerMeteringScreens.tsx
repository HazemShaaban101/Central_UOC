import { useMemo } from 'react';
import { Panel } from '@/components/frame/Panel';
import { DataTable, Tag } from '@/components/data/DataTable';
import { RingGauge } from '@/components/gauges/Gauges';
import { TrendCard } from '@/widgets/TrendCard';
import { row } from '@/screens/layout';
import { hash01 } from '@/model/assets/galaxy';
import { ASSETS } from '@/model/central/assets';
import { electricalKw, meteredCoolingKw } from '@/model/central/kpis';
import { zoneById } from '@/model/central/project';
import { useFleet } from '@/model/central/useFleet';
import { useScenario } from '@/sim/scenario';
import { DrillControl } from '@/screens/electric/PowerScreens';
import { FleetPanel, KpiTile, StatTile, TierBadge, ZoneBars, useDrawer, useFleetRows } from '@/screens/central/kit';
import { fmt } from '@/utils/format';

const n = (x: unknown) => (typeof x === 'number' ? x : 0);

/* ================================================================================================
 * Electric (AVEVA integrations, Modbus RTU / TCP)
 * ============================================================================================== */

export function MvScreen() {
  const tiles = row(208, 130, 4);
  const [bars, table] = row(363, 615, [1, 1.6]);
  const rows = useFleetRows(['tr', 'rmu']);
  const tr = rows.filter((r) => r.a.kind === 'tr');
  const hot = Math.max(0, ...tr.map((r) => n(r.s.values.Winding_Temp)));
  return (
    <>
      <KpiTile id="OP-12" frame={tiles[0]} index={0} big />
      <StatTile frame={tiles[1]} index={1} label="Hottest Winding" value={hot} unit="°C" tone={hot > 100 ? 'warn' : 'neutral'} note="Alarm at 100 °C" />
      <StatTile frame={tiles[2]} index={2} label="Transformers" value={`${tr.filter((r) => r.s.status === 'run').length} / ${tr.length}`} note="Energised" />
      <StatTile frame={tiles[3]} index={3} label="Ring Main Units" value={rows.filter((r) => r.a.kind === 'rmu' && r.s.alarm).length} tone={rows.some((r) => r.a.kind === 'rmu' && r.s.alarm) ? 'warn' : 'neutral'} note="RMUs with an alarm" />
      <Panel frame={bars} index={4} title="Transformer Loading per Zone" subtitle="Average and peak loading (%)">
        <ZoneBars kinds={['tr']} a={(r) => (r.length ? r.reduce((a, x) => a + n(x.s.values.Load_Pct), 0) / r.length : 0)} b={(r) => Math.max(0, ...r.map((x) => n(x.s.values.Load_Pct)))} names={{ a: 'Average', b: 'Peak' }} yTitle="Load (%)" unit="%" />
      </Panel>
      <FleetPanel frame={table} index={5} title="MV Equipment" rows={rows} />
    </>
  );
}

export function DistributionScreen() {
  const tiles = row(208, 130, 4);
  const [bars, table] = row(363, 615, [1, 1.6]);
  const rows = useFleetRows(['mdb', 'emdb', 'mcc', 'emcc']);
  const maxThd = Math.max(0, ...rows.map((r) => n(r.s.values.THD_I)));
  return (
    <>
      <KpiTile id="EX-07" frame={tiles[0]} index={0} big />
      <KpiTile id="OP-13" frame={tiles[1]} index={1} />
      <StatTile frame={tiles[2]} index={2} label="Worst Current THD" value={maxThd.toFixed(1)} unit="%" tone={maxThd > 9.5 ? 'warn' : 'neutral'} note="Investigate above 9.5 %" />
      <KpiTile id="EX-14" frame={tiles[3]} index={3} />
      <Panel frame={bars} index={4} title="Load per Zone" subtitle="MDB vs MCC (kW)">
        <ZoneBars kinds={['mdb', 'mcc']} a={(r) => r.filter((x) => x.a.kind === 'mdb').reduce((a, x) => a + n(x.s.values.kW), 0)} b={(r) => r.filter((x) => x.a.kind === 'mcc').reduce((a, x) => a + n(x.s.values.kW), 0)} names={{ a: 'MDB', b: 'MCC' }} yTitle="Power (kW)" unit="kW" />
      </Panel>
      <FleetPanel frame={table} index={5} title="Boards (Digital Power Meters)" subtitle="Click a board for V, I, kW, PF and THD" rows={rows} />
    </>
  );
}

export function StandbyScreen() {
  const tiles = row(208, 130, 4);
  const [left, table] = row(363, 615, [1, 1.6]);
  const rows = useFleetRows(['gen', 'ats']);
  const gens = rows.filter((r) => r.a.kind === 'gen');
  const fuelMin = Math.min(100, ...gens.map((r) => n(r.s.values.Fuel_Level)));
  const mains = useScenario((s) => s.mains.failed);
  return (
    <>
      <KpiTile id="EX-08" frame={tiles[0]} index={0} big />
      <StatTile frame={tiles[1]} index={1} label="Generators Running" value={`${gens.filter((r) => r.s.values.Sts_Running).length} / ${gens.length}`} tone={mains ? 'warn' : 'neutral'} note={mains ? 'Utility failure — on load' : 'Standby (weekly test Tue 10:00)'} />
      <StatTile frame={tiles[2]} index={2} label="Lowest Day Tank" value={fuelMin} unit="%" tone={fuelMin < 40 ? 'warn' : 'neutral'} note="Order fuel below 40 %" />
      <StatTile frame={tiles[3]} index={3} label="Transfer Switches" value={rows.filter((r) => r.a.kind === 'ats' && r.s.values.Position === 1).length} unit="on generator" tone={mains ? 'bad' : 'neutral'} note="Position from the ATS controller" />
      <Panel frame={left} index={4} title="Generators per Building" subtitle="Installed vs ready in Auto">
        <ZoneBars kinds={['gen']} a={(r) => r.length} b={(r) => r.filter((x) => x.s.values.Sts_Auto).length} names={{ a: 'Installed', b: 'Ready' }} yTitle="Sets" />
      </Panel>
      <FleetPanel frame={table} index={5} title="Generators & ATS" rows={rows} action={<DrillControl compact />} />
    </>
  );
}

export function UpsScreen() {
  const tiles = row(208, 130, 3);
  const [table] = row(363, 615, 1);
  const rows = useFleetRows(['ups'], { plantWide: true });
  const minAut = Math.min(999, ...rows.map((r) => n(r.s.values.Autonomy_Min)));
  return (
    <>
      <StatTile frame={tiles[0]} index={0} label="UPS Online" value={`${rows.filter((r) => !r.s.values.On_Battery).length} / ${rows.length}`} tone={rows.some((r) => r.s.values.On_Battery) ? 'bad' : 'neutral'} note="Units on mains (not battery)" />
      <StatTile frame={tiles[1]} index={1} label="Lowest Autonomy" value={minAut} unit="min" tone={minAut < 10 ? 'bad' : minAut < 20 ? 'warn' : 'neutral'} note="Shutdown below 10 min" />
      <StatTile frame={tiles[2]} index={2} label="Highest Load" value={Math.max(0, ...rows.map((r) => n(r.s.values.Load_Pct)))} unit="%" note="Keep below 80 % for N+1" />
      <FleetPanel frame={table} index={3} title="UPS Units" rows={rows} />
    </>
  );
}

/* ================================================================================================
 * Metering › Cooling Meters (590 SP90 energy valves + 65 Kamstrup bulk meters)
 * ============================================================================================== */

export function CoolingMetersScreen() {
  const tiles = row(208, 130, 4);
  const [bars, table] = row(363, 615, [1, 1.5]);
  const { kpi } = useFleet();
  const meters = useFleetRows(['btuT', 'btuB']);
  const attention = useMemo(() => meters.filter((r) => r.s.alarm), [meters]);
  const kw = meteredCoolingKw(kpi);
  return (
    <>
      <KpiTile id="EX-04" frame={tiles[0]} index={0} big />
      <KpiTile id="EX-03" frame={tiles[1]} index={1} />
      <StatTile frame={tiles[2]} index={2} label="Metered Cooling Now" value={fmt(kw / 3.517)} unit="TR" note={`${fmt(kw)} kW thermal`} />
      <StatTile frame={tiles[3]} index={3} label="Low ΔT Meters" value={meters.filter((r) => r.a.kind === 'btuT' && n(r.s.values.DeltaT) > 0 && n(r.s.values.DeltaT) < 3.6).length} note="Below 3.6 K" />
      <Panel frame={bars} index={4} title="Cooling Power per Building" subtitle="Energy valves vs bulk meters (kW)">
        <ZoneBars kinds={['btuT', 'btuB']} zones={['b01', 'b02', 'b03', 'b04', 'b05', 'b06', 'b07']} a={(r) => r.filter((x) => x.a.kind === 'btuT').reduce((a, x) => a + n(x.s.values.Power_kW), 0)} b={(r) => r.filter((x) => x.a.kind === 'btuB').reduce((a, x) => a + n(x.s.values.Power_kW), 0)} names={{ a: 'Energy valves', b: 'Bulk meters' }} yTitle="kW" unit="kW" />
      </Panel>
      <FleetPanel frame={table} index={5} title="Meters Needing Attention" subtitle={`${attention.length} of ${meters.length} meters`} rows={attention} />
    </>
  );
}


/* ================================================================================================
 * Metering › Cooling Billing (billing system by others; meter readings proven)
 * ============================================================================================== */

const TARIFF_EGP_PER_KWH_TH = 1.15; // assumed chilled-water energy tariff
const CAPACITY_EGP_PER_TR = 210; // assumed monthly capacity charge per contracted TR

export function CoolingBillingScreen() {
  const tiles = row(208, 130, 4);
  const [table, side] = row(363, 615, [1.75, 1]);
  const { snap, scope, now } = useFleet(60_000);
  const open = useDrawer((s) => s.open);
  const day = new Date(now).getDate();
  const month = new Date(now).toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  const bills = useMemo(() => {
    return ASSETS.filter((a) => a.kind === 'btuT' && (scope === 'project' || a.zone === scope)).map((a) => {
      const s = snap.states.get(a.tag)!;
      const ctr = Math.round(2 + hash01(a.tag + 'tr') * 10);
      const kwh = Math.round(ctr * 3.517 * 10 * day * (0.55 + hash01(a.tag + 'u') * 0.5));
      const amount = kwh * TARIFF_EGP_PER_KWH_TH + ctr * CAPACITY_EGP_PER_TR * (day / 30);
      const gap = !s.values.Comm_OK;
      return { a, unit: `${zoneById(a.zone)?.short}-U${a.label.slice(-2)}`, ctr, kwh, amount, gap, dt: n(s.values.DeltaT) };
    });
  }, [snap, scope, day]);
  const total = bills.reduce((x, b) => x + b.amount, 0);
  const energy = bills.reduce((x, b) => x + b.kwh, 0);
  const gaps = bills.filter((b) => b.gap).length;
  return (
    <>
      <StatTile frame={tiles[0]} index={0} label="Billed to Date" value={fmt(total / 1000)} unit="k EGP" note={`${month} · tariff assumed`} />
      <StatTile frame={tiles[1]} index={1} label="Metered Energy" value={fmt(energy / 1000)} unit="MWh th" note={`${bills.length} tenant meters`} />
      <StatTile frame={tiles[2]} index={2} label="Bill Lines with Data Gap" value={gaps} tone={gaps ? 'warn' : 'neutral'} note="Back-filled from register" />
      <KpiTile id="EX-04" frame={tiles[3]} index={3} />
      <Panel frame={table} index={4} title="Tenant Cooling Bills" subtitle="One line per tenant meter · click for details" action={<TierBadge tier="assumed" />}>
        <div className="absolute inset-x-[4px] bottom-[10px] top-[4px]">
          <DataTable
            dense
            rows={bills.slice(0, 300)}
            rowKey={(b) => b.a.tag}
            onRowClick={(b) => open(b.a.tag)}
            highlight={(b) => (b.gap ? 'warn' : null)}
            columns={[
              { key: 'u', header: 'Unit', width: 110, render: (b) => <span className="text-white">{b.unit}</span> },
              { key: 'm', header: 'Meter', width: 130, render: (b) => b.a.label },
              { key: 'c', header: 'Contract', width: 90, align: 'right', render: (b) => `${b.ctr} TR` },
              { key: 'k', header: 'kWh th', width: 100, align: 'right', render: (b) => fmt(b.kwh) },
              { key: 'd', header: 'ΔT', width: 70, align: 'right', render: (b) => (b.gap ? '—' : `${b.dt.toFixed(1)} K`) },
              { key: 'a', header: 'Amount', width: 130, align: 'right', render: (b) => <span className="text-white">EGP {fmt(b.amount)}</span> },
              { key: 's', header: 'Data', width: 120, render: (b) => (b.gap ? <Tag tone="warn">Gap · back-fill</Tag> : <Tag tone="good">Complete</Tag>) },
            ]}
          />
        </div>
      </Panel>
      <Panel frame={side} index={5} title="Revenue Split" subtitle="Energy vs capacity charge">
        <div className="flex h-full items-center gap-[24px] px-[20px] pb-[10px]">
          <RingGauge segments={[{ value: energy * TARIFF_EGP_PER_KWH_TH, color: '#9d78ff' }, { value: Math.max(0, total - energy * TARIFF_EGP_PER_KWH_TH), color: '#e4ccff' }]} value={`${fmt(total / 1_000_000, 2)}M`} unit="EGP" size={170} />
          <ul className="space-y-[10px] text-[14px] text-ink-2">
            <li>Energy · EGP {TARIFF_EGP_PER_KWH_TH} / kWh th</li>
            <li>Capacity · EGP {CAPACITY_EGP_PER_TR} / TR · month</li>
          </ul>
        </div>
      </Panel>
    </>
  );
}

/* ================================================================================================
 * Metering › Energy (DPMs via AVEVA)
 * ============================================================================================== */

export function EnergyScreen() {
  const tiles = row(208, 130, 4);
  const [trend, split] = row(363, 370, [1.6, 1]);
  const [bars] = row(758, 220, 1);
  const { kpi } = useFleet();
  const kw = electricalKw(kpi);
  const mcc = useMccKw();
  return (
    <>
      <KpiTile id="EX-07" frame={tiles[0]} index={0} big />
      <KpiTile id="EX-14" frame={tiles[1]} index={1} />
      <KpiTile id="EX-02" frame={tiles[2]} index={2} />
      <StatTile frame={tiles[3]} index={3} label="Motor Share of Demand" value={kw ? Math.round((mcc / kw) * 100) : 0} unit="%" note="MCC + EMCC share" />
      <TrendCard frame={trend} index={4} title="Electrical Demand" subtitle="Actual vs expected" sim="electric.demand" yTitle="Demand (MW)" decimals={2} />
      <Panel frame={split} index={5} title="Demand by Incomer" subtitle="MCC / EMCC are fed from these">
        <BoardSplit />
      </Panel>
      <Panel frame={bars} index={6} title="Demand per Building" subtitle="MDB vs EMDB (kW)">
        <ZoneBars kinds={['mdb', 'emdb']} a={(r) => r.filter((x) => x.a.kind === 'mdb').reduce((a, x) => a + n(x.s.values.kW), 0)} b={(r) => r.filter((x) => x.a.kind === 'emdb').reduce((a, x) => a + n(x.s.values.kW), 0)} names={{ a: 'MDB', b: 'EMDB' }} yTitle="kW" unit="kW" />
      </Panel>
    </>
  );
}

function useMccKw() {
  const rows = useFleetRows(['mcc', 'emcc']);
  return rows.reduce((a, r) => a + n(r.s.values.kW), 0);
}

function BoardSplit() {
  const rows = useFleetRows(['mdb', 'emdb', 'mcc', 'emcc']);
  const kw = (k: string) => rows.filter((r) => r.a.kind === k).reduce((a, r) => a + n(r.s.values.kW), 0);
  const segs = [
    { k: 'MDB', v: kw('mdb'), color: '#9d78ff' },
    { k: 'EMDB', v: kw('emdb'), color: '#e4ccff' },
  ];
  const total = segs.reduce((a, s) => a + s.v, 0);
  const sub = [
    { k: 'of which MCC', v: kw('mcc') },
    { k: 'of which EMCC', v: kw('emcc') },
  ];
  return (
    <div className="flex h-full items-center gap-[24px] px-[20px] pb-[10px]">
      <RingGauge segments={segs.map((s) => ({ value: s.v, color: s.color }))} value={fmt(total / 1000, 1)} unit="MW" size={190} />
      <ul className="flex-1 space-y-[10px] text-[15px]">
        {segs.map((s) => (
          <li key={s.k} className="flex items-center gap-[8px] text-ink-2">
            <span className="h-[8px] w-[8px] rounded-full" style={{ background: s.color }} />
            {s.k}
            <span className="ml-auto tabular-nums text-white">{fmt(s.v)} kW</span>
          </li>
        ))}
        {sub.map((s) => (
          <li key={s.k} className="flex items-center gap-[8px] pl-[16px] text-[13px] text-ink-3">
            {s.k}
            <span className="ml-auto tabular-nums">{fmt(s.v)} kW</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
