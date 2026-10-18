import type { ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import { Panel } from '@/components/frame/Panel';
import { ModeButton } from '@/components/controls/Controls';
import { PairedBarChart, type BarGroup } from '@/components/charts/PairedBarChart';
import { BtuIcon, CardIcon, FilterLinesIcon, SensorIcon } from '@/components/icons/UiIcons';
import { ArcVerdict, DialVerdict } from '@/widgets/Widgets';
import { TrendCard } from '@/widgets/TrendCard';
import { bands } from '@/widgets/verdicts';
import { row } from '@/screens/layout';
import type { SignalId } from '@/sim/catalog';
import { ASSETS, type AssetKind, type AssetState } from '@/model/central/assets';
import { plantPower, plantTons } from '@/model/central/kpis';
import { ZONES } from '@/model/central/project';
import { useFleet } from '@/model/central/useFleet';

/**
 * HVAC — the BMS side of the submittal (EL I/O list and schematics): the chilled-water plant in
 * Basement 01, the 26 FAHU / 4 AHU on the roofs, the 655 TC903 fan coil units and the ventilation
 * fans (car park, exhaust, make-up). Same layout as the Metering screens: a gauge and per-building
 * bars on top, the history underneath.
 */

const n = (x: unknown) => (typeof x === 'number' ? x : 0);

interface Rows {
  kind: AssetKind;
  s: AssetState;
}

/** Paired bars per zone (or per unit) from the live equipment states. */
function FleetBars({ groups, names, yTitle, xTitle, unit }: { groups: BarGroup[]; names: { a: string; b: string }; yTitle: string; xTitle: string; unit?: string }) {
  return (
    <div className="absolute inset-x-[18px] bottom-[12px] top-[2px]">
      <PairedBarChart data={groups} names={names} yTitle={yTitle} xTitle={xTitle} unit={unit} fillWidth={1} />
    </div>
  );
}

/** Per zone that has any of `kinds`: a and b computed from its equipment. */
function useZoneGroups(kinds: AssetKind[], a: (r: Rows[]) => number, b: (r: Rows[]) => number): BarGroup[] {
  const { snap, scope } = useFleet();
  return ZONES.filter((z) => (scope === 'project' || z.id === scope) && ASSETS.some((x) => x.zone === z.id && kinds.includes(x.kind))).map((z) => {
    const rows = ASSETS.filter((x) => x.zone === z.id && kinds.includes(x.kind)).map((x) => ({ kind: x.kind, s: snap.states.get(x.tag)! }));
    return { label: z.short, a: Math.round(a(rows) * 10) / 10, b: Math.round(b(rows) * 10) / 10 };
  });
}

interface TemplateProps {
  icon: ReactNode;
  top: [ReactNode, ReactNode];
  trend: { title: string; subtitle: string; sim: SignalId; yTitle: string; decimals?: number };
}

/** Gauge + bars on top, history below (the Metering layout). */
function HvacTemplate({ icon, top, trend }: TemplateProps) {
  const [t] = row(588, 358, 1);
  return (
    <>
      {top}
      <TrendCard frame={t} index={2} icon={icon} title={trend.title} subtitle={trend.subtitle} sim={trend.sim} yTitle={trend.yTitle} decimals={trend.decimals ?? 1} />
    </>
  );
}

/* ---- HVAC › Chiller Plant -------------------------------------------------------------------- */

export function ChillerPlantScreen() {
  const [g, b] = row(208, 355, 2);
  const { kpi, snap } = useFleet();
  const tons = plantTons(kpi);
  const kwPerTr = tons ? plantPower(kpi).total / tons : null;
  const chillers = ASSETS.filter((a) => a.kind === 'chiller').map((a) => ({ label: a.label, a: 1000, b: n(snap.states.get(a.tag)!.values.Cooling_TR) }));
  return (
    <HvacTemplate
      icon={<BtuIcon />}
      top={[
        <Panel key="g" frame={g} index={0} icon={<BtuIcon />} title="Plant Efficiency" subtitle="Plant kW per Ton of Cooling Delivered">
          <DialVerdict
            source={{ fixed: kwPerTr ?? 0, unit: 'kW/TR' }}
            max={1.2}
            decimals={2}
            verdict={bands([
              { max: 0.75, text: 'Efficient', tone: 'good' },
              { max: 0.85, text: 'Fair', tone: 'warn' },
              { max: Infinity, text: 'Inefficient', tone: 'bad' },
            ])}
          />
        </Panel>,
        <Panel key="b" frame={b} index={1} icon={<BtuIcon />} title="Chiller Loading" subtitle="Cooling Delivered vs Rated Capacity Per Chiller">
          <FleetBars groups={chillers} names={{ a: 'Rated Capacity', b: 'Cooling Delivered' }} yTitle="Cooling (TR)" xTitle="Chiller" unit="TR" />
        </Panel>,
      ]}
      trend={{ title: 'Cooling Load History', subtitle: 'Chilled-Water Plant · Basement 01', sim: 'hvac.coolingLoad', yTitle: 'Load (TR)', decimals: 0 }}
    />
  );
}

/* ---- HVAC › Air Handling ---------------------------------------------------------------------- */

export function AirHandlingScreen() {
  const [g, b] = row(208, 355, 2);
  const navigate = useNavigate();
  const { snap, scope } = useFleet();
  const running = ASSETS.filter((a) => (a.kind === 'fahu' || a.kind === 'ahu') && (scope === 'project' || a.zone === scope)).map((a) => snap.states.get(a.tag)!).filter((s) => s.values.Sts_Run);
  const sat = running.length ? running.reduce((a, s) => a + n(s.values.Supply_Temp), 0) / running.length : null;
  const groups = useZoneGroups(['fahu', 'ahu'], (r) => r.length, (r) => r.filter((x) => x.s.values.Sts_Run).length);
  return (
    <HvacTemplate
      icon={<FilterLinesIcon />}
      top={[
        <Panel key="g" frame={g} index={0} icon={<FilterLinesIcon />} title="Supply Air Temperature" subtitle="Average Of Running FAHU / AHU">
          <DialVerdict
            source={{ fixed: sat ?? 0, unit: '°C' }}
            min={10}
            max={20}
            decimals={1}
            verdict={bands([
              { max: 16, text: 'Good', tone: 'good' },
              { max: 17.5, text: 'Above Set Point', tone: 'warn' },
              { max: Infinity, text: 'Too Warm', tone: 'bad' },
            ])}
          />
        </Panel>,
        <Panel key="b" frame={b} index={1} icon={<FilterLinesIcon />} title="Air Handlers Per Building" subtitle="Installed vs Running" action={<ModeButton label="3D unit · FAHU-01" onClick={() => navigate('/hvac/air/fahu-01')} />}>
          <FleetBars groups={groups} names={{ a: 'Installed', b: 'Running' }} yTitle="Units" xTitle="Building" />
        </Panel>,
      ]}
      trend={{ title: 'Supply Air Temperature History', subtitle: 'Average Of Running Units', sim: 'hvac.supplyAir', yTitle: 'Temperature (°C)' }}
    />
  );
}

/* ---- HVAC › Fan Coil Units -------------------------------------------------------------------- */

export function FcuScreen() {
  const [g, b] = row(208, 355, 2);
  const { snap, scope } = useFleet();
  const on = ASSETS.filter((a) => a.kind === 'fcu' && (scope === 'project' || a.zone === scope)).map((a) => snap.states.get(a.tag)!).filter((s) => s.values.OnOff);
  const ok = on.filter((s) => Math.abs(n(s.values.Room_Temp) - n(s.values.Setpoint)) <= 1.5).length;
  const comfort = on.length ? (ok / on.length) * 100 : 0;
  const groups = useZoneGroups(['fcu'], (r) => r.filter((x) => x.s.values.OnOff).length, (r) => r.filter((x) => x.s.values.OnOff && Math.abs(n(x.s.values.Room_Temp) - n(x.s.values.Setpoint)) <= 1.5).length);
  return (
    <HvacTemplate
      icon={<SensorIcon />}
      top={[
        <Panel key="g" frame={g} index={0} icon={<SensorIcon />} title="Thermal Comfort" subtitle="Occupied Rooms Within ±1.5 K Of Set Point">
          <ArcVerdict
            source={{ fixed: comfort }}
            label="Comfort"
            suffix="%"
            decimals={1}
            verdict={bands([
              { max: 90, text: 'Poor', tone: 'bad' },
              { max: 95, text: 'Fair', tone: 'warn' },
              { max: 100, text: 'Good', tone: 'good' },
            ])}
          />
        </Panel>,
        <Panel key="b" frame={b} index={1} icon={<SensorIcon />} title="Comfort Per Building" subtitle="Occupied Rooms vs Rooms In Comfort Band">
          <FleetBars groups={groups} names={{ a: 'Occupied', b: 'In Comfort Band' }} yTitle="Rooms" xTitle="Building" />
        </Panel>,
      ]}
      trend={{ title: 'Average Room Temperature', subtitle: 'TC903 Thermostats · Occupied Rooms', sim: 'hvac.roomTemp', yTitle: 'Temperature (°C)' }}
    />
  );
}

/* ---- HVAC › Ventilation (car park, exhaust, make-up) -------------------------------------------- */

const FAN_KINDS: AssetKind[] = ['pef', 'psf', 'exhaust', 'makeup', 'kmakeup'];

export function VentilationScreen() {
  const [g, b] = row(208, 355, 2);
  const { snap } = useFleet();
  const co = Math.max(0, ...ASSETS.filter((a) => a.kind === 'pef').map((a) => n(snap.states.get(a.tag)!.values.Zone_CO)));
  const groups = useZoneGroups(FAN_KINDS, (r) => r.length, (r) => r.filter((x) => x.s.values.Sts_Run).length);
  return (
    <HvacTemplate
      icon={<CardIcon />}
      top={[
        <Panel key="g" frame={g} index={0} icon={<CardIcon />} title="Car Park Air Quality" subtitle="Highest Zone CO · 395 Sensors On B1 / B2">
          <DialVerdict
            source={{ fixed: co, unit: 'ppm' }}
            max={150}
            verdict={bands([
              { max: 35, text: 'Good', tone: 'good' },
              { max: 50, text: 'Elevated', tone: 'warn' },
              { max: Infinity, text: 'High CO', tone: 'bad' },
            ])}
          />
        </Panel>,
        <Panel key="b" frame={b} index={1} icon={<CardIcon />} title="Ventilation Fans Per Building" subtitle="Car Park, Exhaust And Make-Up Fans · Installed vs Running">
          <FleetBars groups={groups} names={{ a: 'Installed', b: 'Running' }} yTitle="Fans" xTitle="Building" />
        </Panel>,
      ]}
      trend={{ title: 'Car Park CO History', subtitle: 'Average Of Exhaust Zones', sim: 'hvac.carParkCo', yTitle: 'CO (ppm)', decimals: 0 }}
    />
  );
}
