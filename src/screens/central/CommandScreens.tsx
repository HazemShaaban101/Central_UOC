import { useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Panel } from '@/components/frame/Panel';
import { DataTable, Tag } from '@/components/data/DataTable';
import { TONE_COLOR, type Tone } from '@/components/controls/Controls';
import { StatusIcon } from '@/components/controls/StatusIcon';
import { TrendCard } from '@/widgets/TrendCard';
import { row } from '@/screens/layout';
import { BUILDINGS, PROJECT, TIERS, ZONES, type SourceTier } from '@/model/central/project';
import { ASSETS, KINDS, type AssetKind } from '@/model/central/assets';
import { KPIS, kpiById, type Audience, type Kpi } from '@/model/central/kpis';
import { SOPS, sopById, type Sop, type SopCategory } from '@/model/central/sops';
import { useFleet } from '@/model/central/useFleet';
import { useScenario } from '@/sim/scenario';
import { useScopeStore } from '@/sim/scope';
import { AlarmList, KpiTile, TierBadge, useAlarms } from '@/screens/central/kit';
import { clsx } from '@/utils/clsx';

const toneColor = (t: Tone) => (t === 'warn' || t === 'bad' ? TONE_COLOR[t] : '#ffffff');

function Rag({ tone }: { tone: Tone }) {
  const c = tone === 'bad' ? '#d96b84' : tone === 'warn' ? '#e8a98c' : tone === 'good' ? '#7fcf9d' : '#534760';
  return <span className="inline-block h-[10px] w-[10px] shrink-0 rounded-full" style={{ background: c, boxShadow: `0 0 8px ${c}88` }} />;
}

function Chip({ on, children, onClick }: { on: boolean; children: React.ReactNode; onClick: () => void }) {
  return (
    <button onClick={onClick} className={clsx('rounded-full border px-[12px] py-[3px] text-[13px] transition-colors', on ? 'border-accent bg-accent/15 text-accent' : 'border-white/10 text-ink-3 hover:border-accent/50 hover:text-white')}>
      {children}
    </button>
  );
}

/* ================================================================================================
 * Command › Executive
 * ============================================================================================== */

export function ExecutiveScreen() {
  const tiles = row(208, 150, 5);
  const [trend, table] = row(383, 330, [1, 1.25]);
  const [score, risks] = row(738, 240, [1, 1.25]);
  return (
    <>
      {['EX-01', 'EX-02', 'EX-05', 'EX-06', 'EX-08'].map((id, i) => (
        <KpiTile key={id} id={id} frame={tiles[i]} index={i} big />
      ))}
      <TrendCard frame={trend} index={5} title="Electrical Demand" subtitle="EX-07 · MDB power meters (AVEVA) · actual vs expected" sim="electric.demand" yTitle="Demand (MW)" decimals={2} />
      <Panel frame={table} index={6} title="Building Scorecard" subtitle="Executive KPIs per building and basement · click a row to scope the platform">
        <BuildingScorecard />
      </Panel>
      <Panel frame={score} index={7} title="Executive KPI Scorecard" subtitle="All 14 executive KPIs · RAG against target">
        <ExecScorecard />
      </Panel>
      <Panel frame={risks} index={8} title="Top Risks Now" subtitle="Critical and major alarms · each opens its SOP">
        <div className="absolute inset-x-[4px] bottom-[10px] top-[4px]">
          <AlarmList compact />
        </div>
      </Panel>
    </>
  );
}

function BuildingScorecard() {
  const { snap, now } = useFleet();
  const navigate = useNavigate();
  const setScope = useScopeStore((st) => st.setScope);
  const rows = ZONES.map((z) => {
    const c = { snap, scope: z.id, now };
    return { z, av: kpiById('EX-01').compute(c), cf: kpiById('EX-05').compute(c), bill: kpiById('EX-04').compute(c), ls: kpiById('EX-06').compute(c), al: kpiById('OP-01').compute(c) };
  });
  const cell = (r: { text: string; tone: Tone }) => (
    <span className="inline-flex items-center gap-[6px] tabular-nums" style={{ color: toneColor(r.tone) }}>
      <Rag tone={r.tone} />
      {r.text}
    </span>
  );
  return (
    <div className="absolute inset-x-[4px] bottom-[10px] top-[4px]">
      <DataTable
        dense
        rows={rows}
        rowKey={(r) => r.z.id}
        onRowClick={(r) => {
          setScope(r.z.id);
          navigate('/');
        }}
        columns={[
          { key: 'z', header: 'Zone', width: 150, render: (r) => <span className="text-white">{r.z.label}</span> },
          { key: 'av', header: 'Availability', render: (r) => cell(r.av) },
          { key: 'cf', header: 'Comfort', render: (r) => cell(r.cf) },
          { key: 'bl', header: 'Billing data', render: (r) => cell(r.bill) },
          { key: 'ls', header: 'Life safety', render: (r) => cell(r.ls) },
          { key: 'al', header: 'Alarms', width: 150, render: (r) => <span style={{ color: toneColor(r.al.tone) }}>{r.al.note?.split(' · ').slice(0, 2).join(' · ')}</span> },
        ]}
      />
    </div>
  );
}

function ExecScorecard() {
  const { kpi } = useFleet();
  const navigate = useNavigate();
  const list = KPIS.filter((k) => k.audience === 'Executive');
  return (
    <ul className="pf-scroll absolute inset-x-[18px] bottom-[10px] top-[2px] grid grid-cols-2 content-start gap-x-[26px] gap-y-[7px]">
      {list.map((k) => {
        const r = k.compute(kpi);
        return (
          <li key={k.id}>
            <button onClick={() => navigate(`/command/kpis?id=${k.id}`)} className="flex w-full items-center gap-[8px] border-b border-white/[0.05] pb-[5px] text-left text-[14px] hover:text-white">
              <Rag tone={r.tone} />
              <span className="min-w-0 flex-1 truncate text-ink-2">{k.name}</span>
              <span className="tabular-nums" style={{ color: toneColor(r.tone) }}>
                {r.text}
              </span>
            </button>
          </li>
        );
      })}
    </ul>
  );
}

/* ================================================================================================
 * Command › Operations
 * ============================================================================================== */

export function OperationsScreen() {
  const tiles = row(208, 150, 5);
  const [alarms, side] = row(383, 595, [1.55, 1]);
  const queueH = 330;
  return (
    <>
      {['OP-01', 'OP-02', 'OP-03', 'OP-07', 'OP-08'].map((id, i) => (
        <KpiTile key={id} id={id} frame={tiles[i]} index={i} />
      ))}
      <Panel frame={alarms} index={5} title="Active Alarms" subtitle="Every alarm in scope, highest priority first · row → live points, SOP button → procedure">
        <div className="absolute inset-x-[4px] bottom-[10px] top-[4px]">
          <AlarmList />
        </div>
      </Panel>
      <Panel frame={{ ...side, h: queueH }} index={6} title="Work Queue by SOP" subtitle="Alarms grouped by the procedure that handles them">
        <SopQueue />
      </Panel>
      <Panel frame={{ ...side, y: side.y + queueH + 25, h: side.h - queueH - 25 }} index={7} title="Drills & Scenarios" subtitle="Run a scenario to see cause-and-effect across every screen">
        <Drills />
      </Panel>
    </>
  );
}

function SopQueue() {
  const alarms = useAlarms();
  const navigate = useNavigate();
  const groups = useMemo(() => {
    const m = new Map<string, { n: number; crit: number }>();
    for (const a of alarms) {
      const g = m.get(a.al.sop) ?? { n: 0, crit: 0 };
      g.n++;
      if (a.al.severity === 'critical') g.crit++;
      m.set(a.al.sop, g);
    }
    return [...m.entries()].sort((x, y) => y[1].crit - x[1].crit || y[1].n - x[1].n);
  }, [alarms]);
  return (
    <ul className="pf-scroll absolute inset-x-[18px] bottom-[10px] top-[2px] space-y-[6px]">
      {groups.map(([id, g]) => {
        const s = sopById(id)!;
        return (
          <li key={id}>
            <button onClick={() => navigate(`/command/sops?id=${id}`)} className="flex w-full items-center gap-[10px] rounded-[8px] border border-white/[0.06] px-[10px] py-[6px] text-left hover:border-accent/50">
              <span className="w-[86px] shrink-0 font-mono text-[12px] text-accent">{id}</span>
              <span className="min-w-0 flex-1 truncate text-[14px] text-ink-2">{s.title}</span>
              {g.crit > 0 && <StatusIcon tone="bad" size={14} />}
              <span className="w-[30px] text-right tabular-nums text-white">{g.n}</span>
            </button>
          </li>
        );
      })}
    </ul>
  );
}

function Drills() {
  const fire = useScenario((s) => s.fire);
  const mains = useScenario((s) => s.mains.failed);
  const intrusion = useScenario((s) => s.intrusion.active);
  const sc = useScenario.getState();
  const [zone, setZone] = useState<string>('b03');
  const btn = 'pf-chip h-[40px] border px-[14px] text-[14px] transition-colors';
  return (
    <div className="absolute inset-x-[18px] top-[6px] space-y-[12px] text-[14px]">
      <div className="flex items-center gap-[10px]">
        <select value={zone} onChange={(e) => setZone(e.target.value)} disabled={fire.active} className="h-[40px] rounded-[10px] border border-accent/30 bg-night-900 px-[10px] text-white">
          {BUILDINGS.map((b) => (
            <option key={b.id} value={b.id}>
              {b.label}
            </option>
          ))}
        </select>
        {fire.active ? (
          <button onClick={() => sc.resolveFireAlarm()} className={`${btn} border-ok/50 text-ok hover:bg-ok/10`}>Reset fire alarm</button>
        ) : (
          <button onClick={() => sc.triggerFireAlarm(zone as never)} className={`${btn} border-alarm/50 text-alarm-soft hover:bg-alarm/10`}>Simulate fire alarm (SOP-LS-01)</button>
        )}
      </div>
      <div className="flex items-center gap-[10px]">
        {mains ? (
          <button onClick={() => sc.restoreMains()} className={`${btn} border-ok/50 text-ok hover:bg-ok/10`}>Restore utility supply</button>
        ) : (
          <button onClick={() => sc.failMains()} className={`${btn} border-warn/50 text-warn hover:bg-warn/10`}>Simulate utility failure (SOP-EL-01)</button>
        )}
        {intrusion ? (
          <button onClick={() => sc.clearIntrusion()} className={`${btn} border-ok/50 text-ok hover:bg-ok/10`}>Clear door alarm</button>
        ) : (
          <button onClick={() => sc.triggerIntrusion(true)} className={`${btn} border-accent/40 text-accent hover:bg-accent/10`}>Forced door (SOP-SC-01)</button>
        )}
      </div>
      <p className="text-[12px] leading-snug text-ink-4">Fire drill: smoke & pressurisation fans start, FAHUs in the building stop, lifts recall, PA plays evacuation. Utility failure: ATS → generators, UPS on battery, transformers de-energised.</p>
    </div>
  );
}

/* ================================================================================================
 * Command › KPI Register
 * ============================================================================================== */

export function KpiRegisterScreen() {
  const [params, setParams] = useSearchParams();
  const [aud, setAud] = useState<Audience | 'All'>('All');
  const selected = kpiById(params.get('id') ?? 'EX-01') ?? KPIS[0];
  const { kpi } = useFleet();
  const [list, detail] = row(208, 770, [1.1, 1]);
  const rows = KPIS.filter((k) => aud === 'All' || k.audience === aud);
  return (
    <>
      <Panel frame={list} index={0} title={`KPI Register · ${rows.length}`} subtitle="Every KPI with its data basis · select one for its definition" action={<div className="flex gap-[6px]">{(['All', 'Executive', 'Operations', 'Maintenance'] as const).map((a) => <Chip key={a} on={aud === a} onClick={() => setAud(a)}>{a}</Chip>)}</div>}>
        <div className="absolute inset-x-[4px] bottom-[10px] top-[4px]">
          <DataTable
            dense
            rows={rows}
            rowKey={(k) => k.id}
            onRowClick={(k) => setParams({ id: k.id })}
            highlight={(k) => (k.id === selected.id ? 'warn' : null)}
            columns={[
              { key: 'id', header: 'ID', width: 62, render: (k) => <span className="font-mono text-[12px] text-accent">{k.id}</span> },
              { key: 'n', header: 'KPI', render: (k) => <span className="text-white">{k.name}</span> },
              { key: 'a', header: 'For', width: 96, render: (k) => k.audience },
              { key: 't', header: 'Data', width: 92, render: (k) => <TierBadge tier={k.tier} /> },
              { key: 'g', header: 'Target', width: 130, render: (k) => <span className="text-ink-3">{k.target}</span> },
              {
                key: 'v',
                header: 'Now',
                width: 120,
                align: 'right',
                render: (k) => {
                  const r = k.compute(kpi);
                  return (
                    <span className="inline-flex items-center gap-[6px]" style={{ color: toneColor(r.tone) }}>
                      <Rag tone={r.tone} />
                      {r.text}
                    </span>
                  );
                },
              },
            ]}
          />
        </div>
      </Panel>
      <Panel frame={detail} index={1} title={`${selected.id} · ${selected.name}`} subtitle={`${selected.audience} KPI · ${selected.domain}`}>
        <KpiDetail k={selected} />
      </Panel>
    </>
  );
}

function KpiDetail({ k }: { k: Kpi }) {
  const { snap, now, kpi } = useFleet();
  const navigate = useNavigate();
  const r = k.compute(kpi);
  const sops = SOPS.filter((s) => s.kpis.includes(k.id));
  return (
    <div className="pf-scroll absolute inset-x-[22px] bottom-[14px] top-[0px] space-y-[16px] text-[15px]">
      <div className="flex items-end gap-[14px]">
        <span className="inline-flex items-center gap-[10px] text-[48px] font-medium leading-none tabular-nums" style={{ color: toneColor(r.tone) }}>
          {(r.tone === 'warn' || r.tone === 'bad') && <StatusIcon tone={r.tone} size={30} />}
          {r.text}
        </span>
        <span className="pb-[6px] text-ink-3">{r.note}</span>
        <span className="ml-auto pb-[6px]">
          <TierBadge tier={k.tier} long />
        </span>
      </div>
      <Field label="Definition">{k.definition}</Field>
      <Field label="Formula">
        <code className="font-mono text-[13.5px] text-accent-soft">{k.formula}</code>
      </Field>
      <div className="grid grid-cols-2 gap-[16px]">
        <Field label="Target">{k.target}</Field>
        <Field label="Frequency">{k.frequency}</Field>
      </div>
      <Field label="Source points">
        <div className="flex flex-wrap gap-[6px]">
          {k.points.map((p) => (
            <span key={p} className="rounded-[6px] border border-white/10 bg-white/[0.03] px-[7px] py-[1px] font-mono text-[12px] text-ink-2">
              {p}
            </span>
          ))}
        </div>
        <p className="mt-[6px] text-[12px] text-ink-4">{TIERS[k.tier].desc}</p>
      </Field>
      {!k.plantWide && (
        <Field label="Per zone, now">
          <div className="grid grid-cols-4 gap-[8px]">
            {ZONES.map((z) => {
              const zr = k.compute({ snap, scope: z.id, now });
              return (
                <div key={z.id} className="rounded-[8px] border border-white/[0.07] px-[10px] py-[6px]">
                  <p className="text-[11px] uppercase tracking-[0.1em] text-ink-4">{z.short}</p>
                  <p className="tabular-nums" style={{ color: toneColor(zr.tone) }}>
                    {zr.text}
                  </p>
                </div>
              );
            })}
          </div>
        </Field>
      )}
      <Field label={`SOPs that act on it · ${sops.length}`}>
        <div className="flex flex-wrap gap-[6px]">
          {sops.map((s) => (
            <button key={s.id} onClick={() => navigate(`/command/sops?id=${s.id}`)} className="rounded-[6px] border border-accent/40 px-[8px] py-[2px] text-[13px] text-accent hover:bg-accent/15">
              {s.id} · {s.title}
            </button>
          ))}
          {!sops.length && <span className="text-ink-4">Reporting KPI (no SOP)</span>}
        </div>
      </Field>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="mb-[5px] text-[11px] font-bold uppercase tracking-[0.14em] text-ink-3">{label}</p>
      <div className="leading-snug text-ink-2">{children}</div>
    </div>
  );
}

/* ================================================================================================
 * Command › SOP Library
 * ============================================================================================== */

export function SopLibraryScreen() {
  const [params, setParams] = useSearchParams();
  const [cat, setCat] = useState<SopCategory | 'All'>('All');
  const selected = sopById(params.get('id') ?? undefined) ?? SOPS[0];
  const alarms = useAlarms();
  const active = (id: string) => alarms.filter((a) => a.al.sop === id).length;
  const [list, detail] = row(208, 770, [1, 1.25]);
  const rows = SOPS.filter((s) => cat === 'All' || s.category === cat);
  return (
    <>
      <Panel frame={list} index={0} title={`SOP Library · ${rows.length}`} subtitle="Alarm-driven SOPs run as AVEVA Work Task workflows" action={<div className="flex gap-[6px]">{(['All', 'Emergency', 'Alarm response', 'Routine', 'Administrative'] as const).map((a) => <Chip key={a} on={cat === a} onClick={() => setCat(a)}>{a === 'Alarm response' ? 'Alarm' : a === 'Administrative' ? 'Admin' : a}</Chip>)}</div>}>
        <div className="absolute inset-x-[4px] bottom-[10px] top-[4px]">
          <DataTable
            dense
            rows={rows}
            rowKey={(s) => s.id}
            onRowClick={(s) => setParams({ id: s.id })}
            highlight={(s) => (s.id === selected.id ? 'warn' : null)}
            columns={[
              { key: 'id', header: 'ID', width: 92, render: (s) => <span className="font-mono text-[12px] text-accent">{s.id}</span> },
              { key: 't', header: 'Procedure', render: (s) => <span className="text-white">{s.title}</span> },
              { key: 'p', header: 'Pri.', width: 40, render: (s) => s.priority },
              { key: 'd', header: 'Data', width: 92, render: (s) => <TierBadge tier={s.tier} /> },
              { key: 'a', header: 'Active', width: 60, align: 'right', render: (s) => (active(s.id) ? <span className="text-warn">{active(s.id)}</span> : <span className="text-ink-4">0</span>) },
            ]}
          />
        </div>
      </Panel>
      <Panel frame={detail} index={1} title={`${selected.id} · ${selected.title}`} subtitle={`${selected.system} · ${selected.category} · ${selected.priority} · respond ${selected.response}`}>
        <SopDetail s={selected} activeCount={active(selected.id)} />
      </Panel>
    </>
  );
}

function SopDetail({ s, activeCount }: { s: Sop; activeCount: number }) {
  const navigate = useNavigate();
  const alarms = useAlarms().filter((a) => a.al.sop === s.id).slice(0, 6);
  return (
    <motion.div key={s.id} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} className="pf-scroll absolute inset-x-[22px] bottom-[14px] top-[0px] space-y-[14px] text-[15px]">
      <div className="flex flex-wrap items-center gap-[8px]">
        <TierBadge tier={s.tier} long />
        {s.roles.map((r) => (
          <Tag key={r} tone="idle" dot={false}>
            {r}
          </Tag>
        ))}
        {activeCount > 0 && <Tag tone="warn">{activeCount} active now</Tag>}
      </div>
      <Field label="Trigger">{s.trigger}</Field>
      <Field label="Trigger points">
        <div className="flex flex-wrap gap-[6px]">
          {s.points.map((p) => (
            <span key={p} className="rounded-[6px] border border-white/10 bg-white/[0.03] px-[7px] py-[1px] font-mono text-[12px] text-ink-2">
              {p}
            </span>
          ))}
        </div>
      </Field>
      <Field label="Steps">
        <ol className="space-y-[7px]">
          {s.steps.map((st, i) => (
            <li key={i} className="flex gap-[10px]">
              <span className="flex h-[22px] w-[22px] shrink-0 items-center justify-center rounded-full border border-accent/50 text-[12px] text-accent">{i + 1}</span>
              <span>{st}</span>
            </li>
          ))}
        </ol>
      </Field>
      <div className="grid grid-cols-2 gap-[16px]">
        <Field label="Close-out check (read from points)">{s.verify}</Field>
        <Field label="Escalation">{s.escalation}</Field>
      </div>
      <Field label="KPIs it protects">
        <div className="flex flex-wrap gap-[6px]">
          {s.kpis.map((id) => (
            <button key={id} onClick={() => navigate(`/command/kpis?id=${id}`)} className="rounded-[6px] border border-accent/40 px-[8px] py-[2px] text-[13px] text-accent hover:bg-accent/15">
              {id} · {kpiById(id)?.name}
            </button>
          ))}
        </div>
      </Field>
      {alarms.length > 0 && (
        <Field label="Raised right now by">
          <ul className="space-y-[4px]">
            {alarms.map((a) => (
              <li key={a.a.tag} className="flex justify-between text-[14px]">
                <span className="text-white">{a.a.label}</span>
                <span className="text-ink-3">{a.al.text}</span>
              </li>
            ))}
          </ul>
        </Field>
      )}
    </motion.div>
  );
}

/* ================================================================================================
 * Command › Data Coverage: what the submittal proves we can read, system by system.
 * ============================================================================================== */

interface CoverageRow {
  system: string;
  kinds: AssetKind[];
  link: string;
  via: string;
  qty: number;
  points: number;
  tier: SourceTier;
}

const COVERAGE: Omit<CoverageRow, 'qty' | 'points'>[] = [
  { system: 'Chillers', kinds: ['chiller'], link: 'Hardwire + BACnet IP', via: 'BMS (AS-P)', tier: 'io' },
  { system: 'CHW / CW pumps (VSD)', kinds: ['pchwp', 'cwp'], link: 'Hardwire + Modbus RTU', via: 'BMS (AS-P)', tier: 'io' },
  { system: 'Cooling towers', kinds: ['ct'], link: 'Hardwire', via: 'BMS (MP-C)', tier: 'io' },
  { system: 'Expansion tanks · water treatment', kinds: ['aux'], link: 'Hardwire', via: 'BMS (AS-P)', tier: 'io' },
  { system: 'FAHU / AHU', kinds: ['fahu', 'ahu'], link: 'Hardwire', via: 'BMS (MP-C)', tier: 'io' },
  { system: 'Exhaust · make-up · kitchen fans', kinds: ['exhaust', 'makeup', 'kmakeup'], link: 'Hardwire', via: 'BMS (MP-C)', tier: 'io' },
  { system: 'Smoke & pressurisation fans', kinds: ['smoke', 'press'], link: 'Hardwire (+ Modbus RTU VSD)', via: 'BMS (MP-C)', tier: 'io' },
  { system: 'Car-park fans + CO', kinds: ['pef', 'psf'], link: 'Hardwire + Modbus RTU VSD', via: 'BMS (MP-C)', tier: 'io' },
  { system: 'Submersible pumps', kinds: ['sump'], link: 'Hardwire', via: 'BMS (MP-C)', tier: 'io' },
  { system: 'CRAC units', kinds: ['crac'], link: 'BACnet IP', via: 'BMS', tier: 'bms' },
  { system: 'Fan coil units (TC903)', kinds: ['fcu'], link: 'Modbus RTU', via: 'BMS (PAS600)', tier: 'bms' },
  { system: 'Cooling meters (SP90 · Kamstrup)', kinds: ['btuT', 'btuB'], link: 'Modbus RTU / MS-TP', via: 'BMS → AVEVA', tier: 'bms' },
  { system: 'Generators · ATS · RMU · transformers', kinds: ['gen', 'ats', 'rmu', 'tr'], link: 'Modbus RTU', via: 'AVEVA', tier: 'aveva' },
  { system: 'Power meters (MDB · EMDB · MCC · EMCC)', kinds: ['mdb', 'emdb', 'mcc', 'emcc'], link: 'Modbus RTU', via: 'AVEVA', tier: 'aveva' },
  { system: 'UPS', kinds: ['ups'], link: 'Modbus TCP', via: 'AVEVA', tier: 'aveva' },
  { system: 'Elevators · escalators', kinds: ['elv', 'esc'], link: 'Modbus TCP', via: 'AVEVA', tier: 'aveva' },
  { system: 'Fire alarm panels', kinds: ['facp'], link: 'BACnet IP', via: 'AVEVA', tier: 'assumed' },
  { system: 'Public address', kinds: ['pa'], link: 'BACnet IP', via: 'AVEVA', tier: 'assumed' },
];

export function CoverageScreen() {
  const tiles = row(208, 150, 5);
  const [table, side] = row(383, 595, [1.7, 1]);
  const rows: CoverageRow[] = COVERAGE.map((c) => {
    const qty = ASSETS.filter((a) => c.kinds.includes(a.kind)).length;
    const points = c.kinds.reduce((acc, k) => acc + ASSETS.filter((a) => a.kind === k).length * KINDS[k].template.attrs.length, 0);
    return { ...c, qty, points };
  });
  const tierPoints = (t: SourceTier) => ASSETS.reduce((acc, a) => acc + KINDS[a.kind].template.attrs.filter((x) => (x.src ?? KINDS[a.kind].tier) === t).length, 0);
  const total = ASSETS.reduce((acc, a) => acc + KINDS[a.kind].template.attrs.length, 0);
  const counts: [SourceTier, string][] = [
    ['io', 'Hardwired points'],
    ['bms', 'BMS integration points'],
    ['aveva', 'AVEVA integration points'],
    ['assumed', 'Assumed (by others)'],
  ];
  return (
    <>
      <Panel frame={tiles[0]} index={0} title="Modelled Points" subtitle={PROJECT.submittal}>
        <div className="absolute inset-x-[18px] bottom-[14px] flex items-end gap-[8px]">
          <span className="text-[42px] font-medium leading-none tabular-nums text-white">{total.toLocaleString('en-US')}</span>
          <span className="pb-[4px] text-ink-3">on {ASSETS.length.toLocaleString('en-US')} assets</span>
        </div>
      </Panel>
      {counts.map(([t, label], i) => {
        const v = tierPoints(t);
        return (
          <Panel key={t} frame={tiles[i + 1]} index={i + 1} title={label} subtitle={TIERS[t].label}>
            <div className="absolute inset-x-[18px] bottom-[14px] flex items-end gap-[8px]">
              <span className="text-[42px] font-medium leading-none tabular-nums" style={{ color: TIERS[t].color }}>
                {v.toLocaleString('en-US')}
              </span>
              <span className="pb-[4px] text-ink-3">{((v / total) * 100).toFixed(0)} %</span>
            </div>
          </Panel>
        );
      })}
      <Panel frame={table} index={5} title="Integration Coverage" subtitle="From the SA integration matrices, EL served equipment and I/O list">
        <div className="absolute inset-x-[4px] bottom-[10px] top-[4px]">
          <DataTable
            dense
            rows={rows}
            rowKey={(r) => r.system}
            columns={[
              { key: 's', header: 'System', render: (r) => <span className="text-white">{r.system}</span> },
              { key: 'l', header: 'Interface', width: 210, render: (r) => r.link },
              { key: 'v', header: 'Into', width: 120, render: (r) => r.via },
              { key: 'q', header: 'Units', width: 70, align: 'right', render: (r) => r.qty.toLocaleString('en-US') },
              { key: 'p', header: 'Points', width: 80, align: 'right', render: (r) => r.points.toLocaleString('en-US') },
              { key: 't', header: 'Data', width: 100, render: (r) => <TierBadge tier={r.tier} /> },
            ]}
          />
        </div>
      </Panel>
      <Panel frame={side} index={6} title="How to Read the Tiers" subtitle="Every KPI, SOP and point carries one">
        <div className="pf-scroll absolute inset-x-[20px] bottom-[14px] top-[0px] space-y-[14px] text-[14px]">
          {(Object.keys(TIERS) as SourceTier[]).map((t) => (
            <div key={t}>
              <TierBadge tier={t} long />
              <p className="mt-[5px] leading-snug text-ink-3">{TIERS[t].desc}</p>
            </div>
          ))}
          <div className="border-t border-white/10 pt-[12px] text-[13px] leading-snug text-ink-4">
            Not in the submittal: CCTV and access control appear in the AVEVA matrix (BACnet IP) but their content, the cooling billing system and the CAFM are by others — their screens are illustrative. Lighting (KNX via BACnet IP) is integrated to the BMS; group-level points are assumed.
          </div>
        </div>
      </Panel>
    </>
  );
}
