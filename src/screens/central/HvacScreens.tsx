import { useMemo } from 'react';
import { Panel } from '@/components/frame/Panel';
import { RingGauge } from '@/components/gauges/Gauges';
import { row } from '@/screens/layout';
import { ASSETS, coolingLoad, outdoorTemp, type AssetKind } from '@/model/central/assets';
import { plantPower, plantTons } from '@/model/central/kpis';
import { useFleet } from '@/model/central/useFleet';
import { AlarmList, FleetPanel, KpiTile, STATUS, StatTile, ZoneBars, useDrawer, useFleetRows, type FleetRow } from '@/screens/central/kit';
import { fmt } from '@/utils/format';

const n = (x: unknown) => (typeof x === 'number' ? x : 0);
const PLANT_KINDS: AssetKind[] = ['chiller', 'pchwp', 'cwp', 'ct', 'aux', 'crac'];
const RED = '#d96b84';
const VIOLET = '#9d78ff';

/* ================================================================================================
 * HVAC › Chiller Plant
 * ============================================================================================== */

export function ChillerPlantScreen() {
  const tiles = row(208, 130, 4);
  const [schem] = row(363, 400, 1);
  const [power, alarms] = row(788, 190, [1, 2]);
  const { kpi } = useFleet();
  const tons = plantTons(kpi);
  return (
    <>
      <KpiTile id="EX-02" frame={tiles[0]} index={0} />
      <StatTile frame={tiles[1]} index={1} label="Plant Load" value={fmt(tons)} unit="TR" note={`Outdoor ${outdoorTemp(kpi.now).toFixed(1)} °C · ${Math.round(coolingLoad(kpi.now) * 100)} % of peak`} />
      <KpiTile id="OP-02" frame={tiles[2]} index={2} />
      <KpiTile id="OP-03" frame={tiles[3]} index={3} />
      <Panel frame={schem} index={4} title="Chilled-Water Plant · Basement 01" subtitle="Click any chiller or pump for its live points">
        <PlantSchematic />
      </Panel>
      <Panel frame={power} index={5} title="Plant Power">
        <PlantPower />
      </Panel>
      <Panel frame={alarms} index={6} title="Plant Alarms">
        <div className="absolute inset-x-[4px] bottom-[10px] top-[2px]">
          <AlarmList compact filter={(a) => PLANT_KINDS.includes(a.kind)} />
        </div>
      </Panel>
    </>
  );
}

function PlantPower() {
  const { kpi } = useFleet();
  const p = plantPower(kpi);
  const segs = [
    { name: 'Chillers', v: p.ch, color: VIOLET },
    { name: 'Pumps', v: p.pumps, color: '#e4ccff' },
    { name: 'Tower fans', v: p.towers, color: '#7fcf9d' },
  ];
  return (
    <div className="flex h-full items-center gap-[18px] px-[18px] pb-[10px]">
      <RingGauge segments={segs.map((s) => ({ value: s.v, color: s.color }))} value={fmt(p.total)} unit="kW" size={120} />
      <ul className="flex-1 space-y-[8px] text-[14px]">
        {segs.map((s) => (
          <li key={s.name} className="flex items-center gap-[7px] text-ink-2">
            <span className="h-[7px] w-[7px] rounded-full" style={{ background: s.color }} />
            {s.name}
            <span className="ml-auto tabular-nums text-white">{fmt(s.v)}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

/** Six chillers between the CHW headers, primary pumps below, condenser pumps above (to the towers). */
function PlantSchematic() {
  const { snap } = useFleet();
  const open = useDrawer((s) => s.open);
  const of = (k: AssetKind) => ASSETS.filter((a) => a.kind === k);
  const chillers = of('chiller');
  const pchwp = of('pchwp');
  const cwp = of('cwp');
  const running = chillers.filter((c) => snap.states.get(c.tag)!.values.Sts_Run);
  const avg = (attr: string) => (running.length ? running.reduce((a, c) => a + n(snap.states.get(c.tag)!.values[attr]), 0) / running.length : null);
  const W = 1790;
  const col = (i: number, count: number) => 150 + (i * (W - 300)) / (count - 1);
  const color = (tag: string) => {
    const s = snap.states.get(tag)!;
    return s.alarm?.severity === 'critical' || s.status === 'fault' ? RED : s.status === 'run' ? VIOLET : s.status === 'manual' ? '#e8a98c' : '#3c3148';
  };
  const unit = (tag: string, x: number, y: number, w: number, h: number, label: string, sub: string, rx = 8) => {
    const c = color(tag);
    const s = snap.states.get(tag)!;
    return (
      <g key={tag} onClick={() => open(tag)} style={{ cursor: 'pointer' }}>
        <rect x={x - w / 2} y={y} width={w} height={h} rx={rx} fill={s.status === 'run' ? 'rgba(157,120,255,0.14)' : 'rgba(10,6,14,0.9)'} stroke={c} strokeWidth={1.6} style={{ animation: c === RED ? 'pf-alarm-blink 1s infinite' : undefined }} />
        <text x={x} y={y + h / 2 - 3} textAnchor="middle" fontSize={15} fill="#fff">
          {label}
        </text>
        <text x={x} y={y + h / 2 + 15} textAnchor="middle" fontSize={11.5} fill={c === RED ? '#e59aaa' : '#bbaacb'}>
          {sub}
        </text>
      </g>
    );
  };
  return (
    <svg className="absolute inset-x-[10px] top-0" width={W} height={300} viewBox={`0 0 ${W} 300`}>
      {/* Condenser header (to B03 towers) */}
      <line x1={80} x2={W - 40} y1={30} y2={30} stroke="#7fcf9d" strokeOpacity={0.6} strokeWidth={3} />
      <text x={W - 40} y={20} textAnchor="end" fontSize={12} fill="#7fcf9d">CONDENSER WATER → COOLING TOWERS (B03 ROOF)</text>
      {cwp.map((p, i) => unit(p.tag, col(i, cwp.length), 42, 120, 40, p.label, snap.states.get(p.tag)!.reading, 20))}
      {/* Chillers */}
      {chillers.map((c, i) => {
        const x = col(i, chillers.length);
        const s = snap.states.get(c.tag)!;
        return (
          <g key={c.tag}>
            <line x1={x} x2={x} y1={82} y2={110} stroke="#7fcf9d" strokeOpacity={0.4} strokeWidth={2} />
            <line x1={x} x2={x} y1={176} y2={200} stroke={VIOLET} strokeOpacity={0.5} strokeWidth={2} />
            {unit(c.tag, x, 110, 190, 66, c.label, s.status === 'run' ? `${s.values.Load_Pct} % · ${s.values.Power_kW} kW` : s.reading)}
          </g>
        );
      })}
      {/* CHW headers */}
      <line x1={80} x2={W - 40} y1={204} y2={204} stroke={VIOLET} strokeWidth={3} />
      <text x={86} y={196} fontSize={12} fill={VIOLET}>
        CHW SUPPLY {avg('CHWS_Temp')?.toFixed(1) ?? '—'} °C
      </text>
      <text x={W - 40} y={196} textAnchor="end" fontSize={12} fill="#e4ccff">
        CHW RETURN {avg('CHWR_Temp')?.toFixed(1) ?? '—'} °C · ΔP SETPOINT 120 kPa
      </text>
      {pchwp.map((p, i) => unit(p.tag, col(i, pchwp.length), 222, 120, 40, p.label, snap.states.get(p.tag)!.reading, 20))}
      <text x={W / 2} y={292} textAnchor="middle" fontSize={12} fill="#bbaacb" letterSpacing={2}>
        PRIMARY VARIABLE FLOW → 7 BUILDINGS (FAHU / AHU / FCU PIBCVs · 655 METERED TAKE-OFFS)
      </text>
    </svg>
  );
}

/* ================================================================================================
 * HVAC › Heat Rejection
 * ============================================================================================== */

export function HeatRejectionScreen() {
  const tiles = row(208, 130, 4);
  const [cells, table] = row(363, 615, [1.3, 1]);
  const { now, snap } = useFleet();
  const towers = useFleetRows(['ct', 'cwp'], { plantWide: true });
  const cts = ASSETS.filter((a) => a.kind === 'ct');
  const run = cts.filter((c) => snap.states.get(c.tag)!.values.Sts_Run);
  const out = run.length ? run.reduce((a, c) => a + n(snap.states.get(c.tag)!.values.CW_Out_Temp), 0) / run.length : null;
  const oat = outdoorTemp(now);
  return (
    <>
      <KpiTile id="OP-05" frame={tiles[0]} index={0} big />
      <StatTile frame={tiles[1]} index={1} label="Tower Cells Running" value={`${run.length} / 6`} note="Staged with the chillers" />
      <StatTile frame={tiles[2]} index={2} label="Leaving Water" value={out?.toFixed(1) ?? '—'} unit="°C" tone={out !== null && out > 33 ? 'warn' : 'neutral'} note="Design 29.5 °C" />
      <StatTile frame={tiles[3]} index={3} label="Outdoor Air" value={oat.toFixed(1)} unit="°C" note={`Wet bulb ≈ ${(oat - 11).toFixed(1)} °C`} />
      <Panel frame={cells} index={4} title="Cooling Towers · Building 03 Roof" subtitle="Click a cell for its live points">
        <TowerCells />
      </Panel>
      <FleetPanel frame={table} index={5} title="Towers & Condenser Pumps" rows={towers} />
    </>
  );
}

function TowerCells() {
  const { snap } = useFleet();
  const open = useDrawer((s) => s.open);
  const cts = ASSETS.filter((a) => a.kind === 'ct');
  return (
    <div className="absolute inset-x-[20px] bottom-[20px] top-[10px] grid grid-cols-3 gap-[18px]">
      {cts.map((c) => {
        const s = snap.states.get(c.tag)!;
        const run = s.values.Sts_Run;
        const speed = n(s.values.Speed_Fb);
        const bad = s.status === 'fault' || s.alarm?.severity === 'major';
        return (
          <button key={c.tag} onClick={() => open(c.tag)} className="relative overflow-hidden rounded-[14px] border text-left" style={{ borderColor: bad ? RED : run ? 'rgba(157,120,255,0.6)' : 'rgba(255,255,255,0.08)', background: 'rgba(8,5,11,0.6)' }}>
            <div className="absolute left-1/2 top-[34px] h-[110px] w-[110px] -translate-x-1/2 rounded-full border-2 border-dashed" style={{ borderColor: run ? VIOLET : '#3c3148', animation: run ? `spin ${Math.max(0.5, 3 - speed / 40)}s linear infinite` : undefined }} />
            <div className="absolute inset-x-0 bottom-0 p-[14px]">
              <p className="flex items-center justify-between text-[18px] text-white">
                {c.label}
                <span className="text-[12px]" style={{ color: STATUS[s.status].color }}>
                  {STATUS[s.status].label}
                </span>
              </p>
              <p className="mt-[4px] text-[13px] text-ink-3">{s.reading}</p>
              {s.values.Basin_Level_Sw ? <p className="mt-[2px] text-[13px] text-warn">Basin low level</p> : null}
            </div>
          </button>
        );
      })}
    </div>
  );
}

/* ================================================================================================
 * HVAC › Air Handling (FAHU, AHU, CRAC)
 * ============================================================================================== */

export function AirHandlingScreen() {
  const tiles = row(208, 130, 4);
  const [bars, table] = row(363, 615, [1, 1.6]);
  const units = useFleetRows(['fahu', 'ahu', 'crac']);
  const running = units.filter((r) => r.s.status === 'run').length;
  const smoke = units.filter((r) => r.s.values.Smoke_Det || r.s.values.Smoke_Det_Supply).length;
  return (
    <>
      <KpiTile id="OP-06" frame={tiles[0]} index={0} big />
      <KpiTile id="OP-09" frame={tiles[1]} index={1} />
      <StatTile frame={tiles[2]} index={2} label="Units Running" value={`${running} / ${units.length}`} note="Scheduled 06:00–24:00" />
      <StatTile frame={tiles[3]} index={3} label="Duct Smoke Detectors" value={smoke} tone={smoke ? 'bad' : 'neutral'} note={smoke ? 'Unit(s) shut down on smoke' : 'All clear'} />
      <Panel frame={bars} index={4} title="Units per Building" subtitle="Installed vs running">
        <ZoneBars kinds={['fahu', 'ahu']} a={(r) => r.length} b={(r) => r.filter((x) => x.s.status === 'run').length} names={{ a: 'Installed', b: 'Running' }} yTitle="Units" />
      </Panel>
      <FleetPanel frame={table} index={5} title="Air Handlers" subtitle="Click a FAHU for its points and 3D view" rows={units} />
    </>
  );
}

/* ================================================================================================
 * HVAC › Fan Coil Units
 * ============================================================================================== */

export function FcuScreen() {
  const tiles = row(208, 130, 4);
  const [left, table] = row(363, 615, [1, 1.45]);
  const all = useFleetRows(['fcu']);
  const on = all.filter((r) => r.s.values.OnOff);
  const avg = on.length ? on.reduce((a, r) => a + n(r.s.values.Room_Temp), 0) / on.length : null;
  const attention = useMemo(() => all.filter((r) => r.s.alarm || (r.s.values.OnOff && Math.abs(n(r.s.values.Room_Temp) - n(r.s.values.Setpoint)) > 1.5)), [all]);
  return (
    <>
      <KpiTile id="EX-05" frame={tiles[0]} index={0} big />
      <KpiTile id="OP-08" frame={tiles[1]} index={1} />
      <StatTile frame={tiles[2]} index={2} label="Units On / Occupied" value={`${on.length} / ${all.length}`} note={`${all.length ? Math.round((on.length / all.length) * 100) : 0} % occupied`} />
      <StatTile frame={tiles[3]} index={3} label="Average Room Temperature" value={avg?.toFixed(1) ?? '—'} unit="°C" note="Set points 22–25 °C" />
      <Panel frame={left} index={4} title="Room vs Set Point" subtitle="Occupied rooms by deviation (K)">
        <Deviation rows={on} />
      </Panel>
      <FleetPanel frame={table} index={5} title="FCUs Needing Attention" subtitle={`${attention.length} of ${all.length} rooms`} rows={attention} />
    </>
  );
}

function Deviation({ rows }: { rows: FleetRow[] }) {
  const bins = [-3, -2, -1.5, -1, -0.5, 0, 0.5, 1, 1.5, 2, 3, 99];
  const counts = bins.slice(0, -1).map((lo, i) => rows.filter((r) => {
    const d = n(r.s.values.Room_Temp) - n(r.s.values.Setpoint);
    return d >= lo && d < bins[i + 1];
  }).length);
  const max = Math.max(1, ...counts);
  return (
    <div className="absolute inset-x-[24px] bottom-[34px] top-[10px] flex items-end gap-[8px]">
      {counts.map((c, i) => {
        const inBand = bins[i] >= -1.5 && bins[i + 1] <= 1.5;
        return (
          <div key={i} className="flex flex-1 flex-col items-center gap-[4px]">
            <span className="text-[11px] tabular-nums text-ink-3">{c}</span>
            <div className="w-full rounded-t-[4px]" style={{ height: `${(c / max) * 380}px`, background: inBand ? VIOLET : '#e8a98c', opacity: inBand ? 0.9 : 0.75 }} />
            <span className="text-[10px] text-ink-4">{bins[i] > 0 ? '+' : ''}{bins[i]}</span>
          </div>
        );
      })}
    </div>
  );
}

/* ================================================================================================
 * HVAC › Car Park (B1 / B2)
 * ============================================================================================== */

export function CarParkScreen() {
  const tiles = row(208, 130, 4);
  const [map, table] = row(363, 615, [1.35, 1]);
  const fans = useFleetRows(['pef', 'psf'], { plantWide: true });
  const pef = fans.filter((r) => r.a.kind === 'pef');
  const max = Math.max(0, ...pef.map((r) => n(r.s.values.Zone_CO)));
  const kw = fans.reduce((a, r) => a + n(r.s.values.Motor_kW), 0);
  return (
    <>
      <KpiTile id="EX-13" frame={tiles[0]} index={0} big />
      <KpiTile id="OP-10" frame={tiles[1]} index={1} />
      <StatTile frame={tiles[2]} index={2} label="Highest Zone CO" value={max} unit="ppm" tone={max > 100 ? 'bad' : max > 50 ? 'warn' : 'neutral'} note="Fans boost above 50 ppm" />
      <StatTile frame={tiles[3]} index={3} label="Fan Power" value={fmt(kw)} unit="kW" note="CO-controlled speed" />
      <Panel frame={map} index={4} title="Car-Park CO by Zone" subtitle="Colour = CO level · click a zone">
        <CoMap rows={pef} />
      </Panel>
      <FleetPanel frame={table} index={5} title="Car-Park Fans" rows={fans} />
    </>
  );
}

function CoMap({ rows }: { rows: FleetRow[] }) {
  const open = useDrawer((s) => s.open);
  const levels = [rows.filter((r) => r.a.label.startsWith('BS1')), rows.filter((r) => r.a.label.startsWith('BS2'))];
  const color = (co: number) => (co > 100 ? RED : co > 50 ? '#e8a98c' : `rgba(157,120,255,${0.12 + Math.min(1, co / 50) * 0.6})`);
  return (
    <div className="absolute inset-x-[20px] bottom-[20px] top-[6px] flex flex-col gap-[16px]">
      {levels.map((lv, li) => (
        <div key={li} className="flex-1">
          <p className="mb-[6px] text-[12px] font-bold uppercase tracking-[0.14em] text-ink-3">Basement {li + 1}</p>
          <div className="grid h-[calc(100%-22px)] grid-cols-12 gap-[5px]">
            {lv.map((r) => {
              const co = n(r.s.values.Zone_CO);
              return (
                <button key={r.a.tag} onClick={() => open(r.a.tag)} title={`${r.a.label} · ${co} ppm · ${r.s.reading}`} className="flex flex-col items-center justify-center rounded-[6px] border text-[11px] text-white" style={{ background: color(co), borderColor: r.s.status === 'fault' ? RED : 'rgba(255,255,255,0.06)' }}>
                  <span className="tabular-nums">{co}</span>
                  <span className="text-[9px] text-white/60">{r.a.label.slice(-2)}</span>
                </button>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}

/* ================================================================================================
 * HVAC › Ventilation (exhaust, make-up, kitchen make-up)
 * ============================================================================================== */

export function VentilationScreen() {
  const tiles = row(208, 130, 4);
  const [ring, table] = row(363, 615, [1, 1.6]);
  const fans = useFleetRows(['exhaust', 'makeup', 'kmakeup']);
  const kitchen = fans.filter((r) => r.a.kind === 'kmakeup');
  const run = fans.filter((r) => r.s.status === 'run').length;
  return (
    <>
      <StatTile frame={tiles[0]} index={0} label="Fans Running" value={`${run} / ${fans.length}`} note="Time-scheduled from the BMS" />
      <KpiTile id="MT-02" frame={tiles[1]} index={1} />
      <KpiTile id="OP-07" frame={tiles[2]} index={2} />
      <StatTile frame={tiles[3]} index={3} label="Kitchen Make-Up (B07)" value={`${kitchen.filter((r) => r.s.status === 'run').length} / ${kitchen.length}`} tone={kitchen.some((r) => r.s.status === 'fault') ? 'warn' : 'neutral'} note={kitchen.some((r) => r.s.status === 'fault') ? 'One or more tripped' : 'All available'} />
      <Panel frame={ring} index={4} title="Fans per Building" subtitle="Installed vs running">
        <ZoneBars kinds={['exhaust', 'makeup', 'kmakeup']} a={(r) => r.length} b={(r) => r.filter((x) => x.s.status === 'run').length} names={{ a: 'Installed', b: 'Running' }} yTitle="Fans" />
      </Panel>
      <FleetPanel frame={table} index={5} title="Ventilation Fans" rows={fans} />
    </>
  );
}
