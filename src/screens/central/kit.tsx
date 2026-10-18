import { useMemo, type ReactNode } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { create } from 'zustand';
import { Panel, type PanelProps } from '@/components/frame/Panel';
import { DataTable, Tag, type Column, type TagTone } from '@/components/data/DataTable';
import { TONE_COLOR, type Tone } from '@/components/controls/Controls';
import { StatusIcon } from '@/components/controls/StatusIcon';
import { AnimatedNumber } from '@/components/gauges/AnimatedNumber';
import { RingGauge } from '@/components/gauges/Gauges';
import { PairedBarChart } from '@/components/charts/PairedBarChart';
import { formatAttr } from '@/model/assets/galaxy';
import { TIERS, ZONES, zoneById, type SourceTier } from '@/model/central/project';
import { ASSETS, KINDS, assetByTag, severityRank, type Asset, type AssetAlarm, type AssetKind, type AssetState, type Status } from '@/model/central/assets';
import { kpiById } from '@/model/central/kpis';
import { sopById } from '@/model/central/sops';
import { useFleet } from '@/model/central/useFleet';
import { ahuById } from '@/model/galaxyBindings';
import { fmt } from '@/utils/format';

/* ================================================================================================
 * Data-tier badge: how sure we are that a value exists on site.
 * ============================================================================================== */

export function TierBadge({ tier, long }: { tier: SourceTier; long?: boolean }) {
  const t = TIERS[tier];
  return (
    <span
      className="inline-flex shrink-0 items-center gap-[5px] whitespace-nowrap rounded-full border px-[8px] text-[10px] font-bold uppercase leading-[18px] tracking-[0.08em]"
      style={{ color: t.color, borderColor: `${t.color}66`, background: `${t.color}14` }}
      title={`${t.label} — ${t.desc}`}
    >
      <span className="h-[5px] w-[5px] rounded-full" style={{ background: t.color }} />
      {long ? t.label : t.short}
    </span>
  );
}

/* ================================================================================================
 * Status vocabulary
 * ============================================================================================== */

export const STATUS: Record<Status, { label: string; tone: TagTone; color: string }> = {
  run: { label: 'Running', tone: 'good', color: '#9d78ff' },
  standby: { label: 'Standby', tone: 'idle', color: '#6d5a85' },
  off: { label: 'Off', tone: 'idle', color: '#3c3148' },
  manual: { label: 'Hand', tone: 'warn', color: '#e8a98c' },
  fault: { label: 'Fault', tone: 'bad', color: '#d96b84' },
  alarm: { label: 'Alarm', tone: 'bad', color: '#e59aaa' },
  offline: { label: 'Offline', tone: 'warn', color: '#b58ce3' },
};

export function StatusTag({ s }: { s: Status }) {
  return <Tag tone={STATUS[s].tone}>{STATUS[s].label}</Tag>;
}

const SEV_TONE: Record<AssetAlarm['severity'], TagTone> = { critical: 'bad', major: 'warn', minor: 'info' };
export const SevTag = ({ s }: { s: AssetAlarm['severity'] }) => <Tag tone={SEV_TONE[s]}>{s === 'critical' ? 'P1' : s === 'major' ? 'P2' : 'P3'}</Tag>;

/* ================================================================================================
 * Tiles: a label, one big value, one line of context. Nothing else.
 * ============================================================================================== */

export function StatTile({ frame, index = 0, label, value, unit, tone = 'neutral', note, tier, onClick, hint }: { frame: PanelProps['frame']; index?: number; label: string; value: ReactNode; unit?: string; tone?: Tone; note?: ReactNode; tier?: SourceTier; onClick?: () => void; hint?: string }) {
  const color = tone === 'warn' || tone === 'bad' ? TONE_COLOR[tone] : '#ffffff';
  const f = frame!;
  return (
    <motion.section
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, delay: 0.06 + index * 0.05, ease: [0.22, 1, 0.36, 1] }}
      className={`pf-panel absolute flex flex-col justify-between px-[22px] pb-[16px] pt-[16px] ${onClick ? 'pf-panel-link' : ''}`}
      style={{ left: f.x, top: f.y, width: f.w, height: f.h }}
      onClick={onClick}
      title={hint}
    >
      <div className="flex items-center gap-[8px]">
        <span className="truncate text-[16px] text-ink-2">{label}</span>
        {tier && <span className="ml-auto h-[7px] w-[7px] shrink-0 rounded-full" style={{ background: TIERS[tier].color }} title={TIERS[tier].label} />}
      </div>
      <div className="flex items-baseline gap-[8px]">
        <span className="inline-flex items-center gap-[10px] text-[40px] font-medium leading-none tabular-nums" style={{ color, letterSpacing: '-0.02em' }}>
          {(tone === 'warn' || tone === 'bad') && <StatusIcon tone={tone} size={24} />}
          {value}
        </span>
        {unit && <span className="text-[17px] text-ink-3">{unit}</span>}
      </div>
      <p className="truncate text-[13px] leading-[16px] text-[#a998ba]">{note ?? ' '}</p>
    </motion.section>
  );
}

/** One KPI from the register as a tile; clicking opens its definition. */
export function KpiTile({ id, frame, index = 0, to }: { id: string; frame: PanelProps['frame']; index?: number; big?: boolean; to?: string }) {
  const k = kpiById(id);
  const { kpi } = useFleet();
  const r = k.compute(kpi);
  const navigate = useNavigate();
  const numeric = r.value !== null && /^[\d.,]+/.test(r.text);
  const unit = numeric ? r.text.replace(/^[\d.,]+\s?/, '') : '';
  return (
    <StatTile
      frame={frame}
      index={index}
      label={k.name}
      tier={k.tier}
      tone={r.tone}
      value={numeric ? <AnimatedNumber value={r.value!} decimals={(r.text.split(' ')[0].split('.')[1] ?? '').length} /> : r.text}
      unit={unit}
      note={r.note}
      onClick={to ? () => navigate(to) : undefined}
      hint={`${k.id} · target ${k.target}`}
    />
  );
}

/* ================================================================================================
 * Asset drawer: any table row opens the asset's live points (Galaxy view) and its alarm's SOP.
 * ============================================================================================== */

export const useDrawer = create<{ tag: string | null; open: (tag: string) => void; close: () => void }>((set) => ({
  tag: null,
  open: (tag) => set({ tag }),
  close: () => set({ tag: null }),
}));

export function AssetDrawer() {
  const tag = useDrawer((s) => s.tag);
  const close = useDrawer((s) => s.close);
  const asset = assetByTag(tag ?? undefined);
  return (
    <AnimatePresence>
      {asset && (
        <motion.div key="scrim" className="absolute inset-0 z-[60]" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={close} style={{ background: 'rgba(3,2,5,0.45)' }}>
          <motion.aside
            initial={{ x: 40, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: 40, opacity: 0 }}
            transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
            onClick={(e) => e.stopPropagation()}
            className="pf-panel pf-panel-solid absolute bottom-[24px] right-[24px] top-[160px] flex w-[620px] flex-col"
          >
            <DrawerBody asset={asset} onClose={close} />
          </motion.aside>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

function DrawerBody({ asset, onClose }: { asset: Asset; onClose: () => void }) {
  const { snap } = useFleet(2000);
  const st = snap.states.get(asset.tag)!;
  const kind = KINDS[asset.kind];
  const navigate = useNavigate();
  const sop = st.alarm ? sopById(st.alarm.sop) : undefined;
  const ahu = asset.kind === 'fahu' ? ahuById(asset.label) : undefined;
  const go = (to: string) => {
    onClose();
    navigate(to);
  };
  return (
    <>
      <header className="flex items-start gap-[14px] border-b border-accent/15 px-[22px] pb-[14px] pt-[18px]">
        <div className="min-w-0 flex-1">
          <p className="pf-eyebrow">{kind.label} · {zoneById(asset.zone)?.label}</p>
          <h2 className="mt-[6px] text-[28px] font-medium leading-none text-white">{asset.label}</h2>
          <p className="mt-[8px] text-[14px] text-ink-3">{kind.template.desc}</p>
          <p className="mt-[4px] font-mono text-[12px] text-ink-4">Galaxy object {asset.tag} · {asset.panel}</p>
        </div>
        <button onClick={onClose} className="flex h-[34px] w-[34px] items-center justify-center rounded-[10px] text-ink-3 hover:bg-white/10 hover:text-white" aria-label="Close">
          ✕
        </button>
      </header>
      <div className="flex items-center gap-[10px] px-[22px] py-[12px]">
        <StatusTag s={st.status} />
        <span className="text-[15px] text-white">{st.reading}</span>
        <span className="ml-auto">
          <TierBadge tier={kind.tier} long />
        </span>
      </div>
      {st.alarm && (
        <div className="mx-[22px] mb-[10px] rounded-[12px] border px-[16px] py-[12px]" style={{ borderColor: st.alarm.severity === 'critical' ? '#d96b84' : 'rgba(232,169,140,0.5)', background: st.alarm.severity === 'critical' ? 'rgba(217,107,132,0.1)' : 'rgba(232,169,140,0.06)' }}>
          <div className="flex items-center gap-[10px]">
            <SevTag s={st.alarm.severity} />
            <span className="text-[16px] text-white">{st.alarm.text}</span>
          </div>
          {sop && (
            <button onClick={() => go(`/command/sops?id=${sop.id}`)} className="mt-[10px] flex w-full items-center justify-between rounded-[8px] border border-accent/40 bg-accent/10 px-[12px] py-[8px] text-left text-[14px] text-accent hover:bg-accent/20">
              <span>
                Follow <b>{sop.id}</b> · {sop.title}
              </span>
              <span>→</span>
            </button>
          )}
        </div>
      )}
      {ahu && (
        <button onClick={() => go(`/hvac/air/${ahu.id.toLowerCase()}`)} className="mx-[22px] mb-[10px] rounded-[8px] border border-accent/30 px-[12px] py-[8px] text-left text-[14px] text-ink-2 hover:border-accent hover:text-white">
          Open the 3D unit view →
        </button>
      )}
      <div className="px-[22px] pb-[6px] text-[12px] text-ink-3">
        <span className="text-aqua">{kind.template.name}</span> · {kind.template.io}
      </div>
      <div className="pf-scroll min-h-0 flex-1 px-[22px] pb-[18px]">
        {kind.template.attrs.map((a) => {
          const v = st.values[a.name] ?? null;
          const alarm = typeof v === 'boolean' && v && /Alm|Trip|Fault|Smoke|High_Level|Low$|Entrapment|E_Stop|SF6|Earth|On_Battery|Fire_Alarm/.test(a.name);
          return (
            <div key={a.name} className="flex items-center gap-[10px] border-b border-white/[0.06] py-[6px]" title={a.desc}>
              <span className="h-[7px] w-[7px] shrink-0 rounded-full" style={{ background: TIERS[a.src ?? kind.tier].color }} title={TIERS[a.src ?? kind.tier].label} />
              <span className="min-w-0 flex-1">
                <span className="block truncate font-mono text-[12.5px] text-ink-2">
                  <span className="text-ink-4">{asset.tag}.</span>
                  {a.name}
                </span>
                <span className="block truncate text-[11px] text-ink-4">{a.desc}</span>
              </span>
              <span className={`shrink-0 text-[14px] tabular-nums ${alarm ? 'font-medium text-alarm-soft' : 'text-white'}`}>{formatAttr(a, v)}</span>
            </div>
          );
        })}
        <div className="mt-[14px] flex flex-wrap gap-[8px]">
          {(['io', 'bms', 'aveva', 'calc', 'assumed'] as SourceTier[]).filter((t) => kind.template.attrs.some((a) => (a.src ?? kind.tier) === t)).map((t) => (
            <TierBadge key={t} tier={t} long />
          ))}
        </div>
      </div>
    </>
  );
}

/* ================================================================================================
 * Fleet table: assets of some kinds, scoped, with status, reading and alarm.
 * ============================================================================================== */

export interface FleetRow {
  a: Asset;
  s: AssetState;
}

export function useFleetRows(kinds: AssetKind[], opts: { plantWide?: boolean; filter?: (r: FleetRow) => boolean } = {}): FleetRow[] {
  const { snap, scope } = useFleet();
  return useMemo(
    () =>
      ASSETS.filter((a) => kinds.includes(a.kind) && (opts.plantWide || scope === 'project' || a.zone === scope))
        .map((a) => ({ a, s: snap.states.get(a.tag)! }))
        .filter((r) => !opts.filter || opts.filter(r)),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [snap, scope, kinds.join(','), opts.plantWide],
  );
}

const ORDER: Record<Status, number> = { alarm: 0, fault: 1, offline: 2, manual: 3, run: 4, standby: 5, off: 6 };

export function FleetTable({ rows, extra = [], limit = 400, sortProblems = true }: { rows: FleetRow[]; extra?: Column<FleetRow>[]; limit?: number; sortProblems?: boolean }) {
  const open = useDrawer((s) => s.open);
  const sorted = sortProblems ? [...rows].sort((x, y) => ORDER[x.s.status] - ORDER[y.s.status] || x.a.label.localeCompare(y.a.label, 'en', { numeric: true })) : rows;
  const multiZone = new Set(rows.map((r) => r.a.zone)).size > 1;
  return (
    <DataTable
      rows={sorted.slice(0, limit)}
      rowKey={(r) => r.a.tag}
      onRowClick={(r) => open(r.a.tag)}
      highlight={(r) => (r.s.alarm?.severity === 'critical' ? 'alarm' : r.s.alarm?.severity === 'major' ? 'warn' : null)}
      columns={[
        { key: 'tag', header: 'Asset', width: 170, render: (r) => <span className="text-white">{r.a.label}</span> },
        ...(multiZone ? [{ key: 'zone', header: 'Zone', width: 70, render: (r: FleetRow) => zoneById(r.a.zone)?.short }] : []),
        { key: 'st', header: 'Status', width: 120, render: (r) => <StatusTag s={r.s.status} /> },
        { key: 'rd', header: 'Reading', width: '1fr', render: (r) => r.s.reading },
        ...extra,
        { key: 'al', header: 'Alarm', width: '1.3fr', render: (r) => (r.s.alarm ? <span className={r.s.alarm.severity === 'critical' ? 'text-alarm-soft' : r.s.alarm.severity === 'major' ? 'text-warn' : 'text-ink-2'}>{r.s.alarm.text}</span> : <span className="text-ink-4">—</span>) },
      ]}
    />
  );
}

/** A panel holding a fleet table, with a count in the title. */
export function FleetPanel({ title, subtitle, rows, frame, index, extra, icon, action }: { title: string; subtitle?: string; rows: FleetRow[]; frame: PanelProps['frame']; index?: number; extra?: Column<FleetRow>[]; icon?: ReactNode; action?: ReactNode }) {
  const problems = rows.filter((r) => r.s.alarm).length;
  return (
    <Panel frame={frame} index={index} icon={icon} action={action} title={`${title} · ${rows.length}`} subtitle={subtitle ?? `${problems} in alarm · click a row for details`}>
      <div className="absolute inset-x-[4px] bottom-[10px] top-[4px]">
        <FleetTable rows={rows} extra={extra} />
      </div>
    </Panel>
  );
}

/* ================================================================================================
 * Status ring: how a fleet splits across statuses.
 * ============================================================================================== */

export function StatusRing({ rows, size = 170, label }: { rows: FleetRow[]; size?: number; label?: string }) {
  const counts = (Object.keys(STATUS) as Status[]).map((s) => ({ s, n: rows.filter((r) => r.s.status === s).length })).filter((c) => c.n);
  const running = rows.filter((r) => r.s.status === 'run').length;
  return (
    <div className="flex h-full items-center gap-[26px] px-[18px] pb-[12px]">
      <RingGauge segments={counts.map((c) => ({ value: c.n, color: STATUS[c.s].color }))} value={fmt(running)} unit={label ?? 'running'} size={size} />
      <ul className="flex flex-1 flex-col gap-[8px] text-[15px]">
        {counts.map((c) => (
          <li key={c.s} className="flex items-center gap-[8px] text-ink-2">
            <span className="h-[8px] w-[8px] rounded-full" style={{ background: STATUS[c.s].color }} />
            {STATUS[c.s].label}
            <span className="ml-auto tabular-nums text-white">{c.n}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

/* ================================================================================================
 * Per-building bars: a value per zone (project scope) for a fleet.
 * ============================================================================================== */

export function ZoneBars({ kinds, a, b, names, unit, yTitle, zones }: { kinds: AssetKind[]; a: (rows: FleetRow[]) => number; b: (rows: FleetRow[]) => number; names: { a: string; b: string }; unit?: string; yTitle?: string; zones?: string[] }) {
  const { snap } = useFleet();
  const data = ZONES.filter((z) => (zones ? zones.includes(z.id) : ASSETS.some((x) => x.zone === z.id && kinds.includes(x.kind)))).map((z) => {
    const rows = ASSETS.filter((x) => x.zone === z.id && kinds.includes(x.kind)).map((x) => ({ a: x, s: snap.states.get(x.tag)! }));
    return { label: z.short, a: Math.round(a(rows) * 10) / 10, b: Math.round(b(rows) * 10) / 10 };
  });
  return (
    <div className="absolute inset-x-[18px] bottom-[12px] top-[2px]">
      <PairedBarChart data={data} names={names} unit={unit} yTitle={yTitle} xTitle="Zone" fillWidth={1} />
    </div>
  );
}

/* ================================================================================================
 * Active alarm list (all assets, scoped), each with its SOP.
 * ============================================================================================== */

export function useAlarms(filter?: (a: Asset) => boolean) {
  const { snap, scope } = useFleet();
  return useMemo(() => {
    const out: { a: Asset; s: AssetState; al: AssetAlarm }[] = [];
    for (const a of ASSETS) {
      if (scope !== 'project' && a.zone !== scope) continue;
      if (filter && !filter(a)) continue;
      const s = snap.states.get(a.tag)!;
      if (s.alarm) out.push({ a, s, al: s.alarm });
    }
    return out.sort((x, y) => severityRank(y.al.severity) - severityRank(x.al.severity) || x.a.label.localeCompare(y.a.label, 'en', { numeric: true }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [snap, scope]);
}

export function AlarmList({ filter, compact }: { filter?: (a: Asset) => boolean; compact?: boolean }) {
  const alarms = useAlarms(filter);
  const open = useDrawer((s) => s.open);
  const navigate = useNavigate();
  return (
    <DataTable
      rows={alarms}
      rowKey={(r) => r.a.tag}
      onRowClick={(r) => open(r.a.tag)}
      highlight={(r) => (r.al.severity === 'critical' ? 'alarm' : null)}
      columns={[
        { key: 'sev', header: 'Pri.', width: 64, render: (r) => <SevTag s={r.al.severity} /> },
        { key: 'asset', header: 'Asset', width: compact ? 140 : 170, render: (r) => <span className="text-white">{r.a.label}</span> },
        { key: 'text', header: 'Alarm', render: (r) => r.al.text },
        {
          key: 'sop',
          header: 'SOP',
          width: 104,
          render: (r) => (
            <button
              onClick={(e) => {
                e.stopPropagation();
                navigate(`/command/sops?id=${r.al.sop}`);
              }}
              className="rounded-[6px] border border-accent/40 px-[7px] text-[12px] text-accent hover:bg-accent/15"
            >
              {r.al.sop}
            </button>
          ),
        },
      ]}
    />
  );
}

/* ================================================================================================
 * Little helpers
 * ============================================================================================== */

/** Counter tile body: big number + label, colour by tone. */
export function Big({ value, unit, tone = 'neutral', note }: { value: string | number; unit?: string; tone?: Tone; note?: ReactNode }) {
  const color = tone === 'warn' || tone === 'bad' ? TONE_COLOR[tone] : '#ffffff';
  return (
    <div className="absolute inset-x-[18px] bottom-[10px] top-0 flex flex-col justify-end">
      <div className="flex items-end gap-[8px]">
        <span className="inline-flex items-center gap-[10px] text-[38px] font-medium leading-none tabular-nums" style={{ color }}>
          {(tone === 'warn' || tone === 'bad') && <StatusIcon tone={tone} size={26} />}
          {value}
        </span>
        {unit && <span className="pb-[4px] text-[16px] text-ink-3">{unit}</span>}
      </div>
      {note && <p className="mt-[6px] truncate text-[13px] leading-[16px] text-[#b09dc1]">{note}</p>}
    </div>
  );
}

/** "Data basis" footer line naming where a screen's numbers come from. */
export function SourceNote({ tiers, children }: { tiers: SourceTier[]; children: ReactNode }) {
  return (
    <div className="absolute bottom-[78px] left-[52px] z-20 flex items-center gap-[8px] text-[12px] text-ink-3">
      {tiers.map((t) => (
        <TierBadge key={t} tier={t} />
      ))}
      <span>{children}</span>
    </div>
  );
}

