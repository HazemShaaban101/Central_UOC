import { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Panel } from '@/components/frame/Panel';
import { Glyph } from '@/components/icons/Glyph';
import { useHomeUi } from '@/components/chrome/ScopeBar';
import { BUILDINGS, PROJECT, ZONES, type Zone } from '@/model/central/project';
import { FIRE_DRILL_BUILDINGS } from '@/model/site';
import { ASSETS, KINDS, countOf, type Domain } from '@/model/central/assets';
import { useFleet } from '@/model/central/useFleet';
import { useScopeStore } from '@/sim/scope';
import { useScenario } from '@/sim/scenario';
import { KpiTile } from '@/screens/central/kit';
import { fmt } from '@/utils/format';

const RED = '#d96b84';
const AMBER = '#e8a98c';
const VIOLET = '#9d78ff';

/**
 * Site — Central from above (schematic; the submittal has no site layout): seven buildings around a
 * plaza over the two-level basement that holds the central chiller plant and the car park. Each
 * building shows its live alarm state; clicking one scopes every KPI on the platform to it.
 */
export default function SiteScreen() {
  const kpis = useHomeUi((s) => s.kpis);
  const scope = useScopeStore((s) => s.scope);
  const setScope = useScopeStore((s) => s.setScope);
  const [hover, setHover] = useState<Zone | null>(null);
  const { snap } = useFleet();
  const fireActive = useScenario((s) => s.fire.active);
  const fireIds: string[] = fireActive ? FIRE_DRILL_BUILDINGS : [];
  const mains = useScenario((s) => s.mains.failed);

  const zoneAlarm = (z: Zone) => {
    let crit = 0;
    let major = 0;
    for (const a of ASSETS) {
      if (a.zone !== z.id) continue;
      const al = snap.states.get(a.tag)!.alarm;
      if (al?.severity === 'critical') crit++;
      else if (al?.severity === 'major') major++;
    }
    return { crit, major };
  };
  const pick = (z: Zone) => setScope(scope === z.id ? 'project' : z.id);
  const basement = ZONES.find((z) => z.id === 'bs')!;

  return (
    <>
      <motion.svg className="absolute inset-0" width={1920} height={1080} initial={{ opacity: 0, scale: 1.04 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 1.1, ease: [0.22, 1, 0.36, 1] }} style={{ transformOrigin: '50% 55%' }}>
        <defs>
          <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
            <path d="M40 0H0V40" fill="none" stroke="rgba(157,120,255,0.06)" strokeWidth="1" />
          </pattern>
          <radialGradient id="plaza" cx="50%" cy="50%" r="50%">
            <stop offset="0" stopColor="rgba(157,120,255,0.16)" />
            <stop offset="1" stopColor="rgba(157,120,255,0)" />
          </radialGradient>
          <linearGradient id="roof" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#241a33" />
            <stop offset="1" stopColor="#150f1f" />
          </linearGradient>
          <linearGradient id="wall" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#2a1f3b" />
            <stop offset="1" stopColor="#0c0812" />
          </linearGradient>
          <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="6" />
          </filter>
        </defs>
        <rect width={1920} height={1080} fill="url(#grid)" onClick={() => setScope('project')} />
        <Ground />
        {/* Basement footprint (B1 / B2) under everything. */}
        <path
          d={basement.outline}
          fill={scope === 'bs' ? 'rgba(157,120,255,0.10)' : 'rgba(157,120,255,0.03)'}
          stroke={zoneStroke(basement, zoneAlarm(basement), fireIds, scope)}
          strokeWidth={scope === 'bs' ? 2.5 : 1.5}
          strokeDasharray="10 8"
          onClick={() => pick(basement)}
          onMouseEnter={() => setHover(basement)}
          onMouseLeave={() => setHover(null)}
          style={{ cursor: 'pointer' }}
        />
        <text x={1500} y={848} textAnchor="end" className="fill-ink-3" fontSize={13} letterSpacing={2}>
          BASEMENTS B1 · B2
        </text>
        <ellipse cx={940} cy={540} rx={170} ry={95} fill="url(#plaza)" pointerEvents="none" />
        <text x={940} y={580} textAnchor="middle" fontSize={13} letterSpacing={4} className="fill-ink-4" pointerEvents="none">
          CENTRAL PLAZA
        </text>
        {/* Plant room marker (B1) and cooling towers (B03 roof). */}
        <g pointerEvents="none">
          <rect x={880} y={527} width={120} height={26} rx={13} fill="rgba(5,3,8,0.85)" stroke="rgba(157,120,255,0.4)" />
          <text x={940} y={545} textAnchor="middle" fontSize={12} className="fill-aqua">CHILLER PLANT · B1</text>
        </g>
        {[...BUILDINGS].sort((a, b) => centroid(a.outline).y - centroid(b.outline).y).map((z) => {
          const al = zoneAlarm(z);
          const on = scope === z.id;
          const lit = on || hover?.id === z.id;
          const stroke = zoneStroke(z, al, fireIds, scope);
          const fire = fireIds.includes(z.id);
          return (
            <g
              key={z.id}
              role="button"
              tabIndex={0}
              aria-label={`Show KPIs for ${z.label}`}
              aria-pressed={on}
              onClick={() => pick(z)}
              onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && (e.preventDefault(), pick(z))}
              onMouseEnter={() => setHover(z)}
              onMouseLeave={() => setHover((h) => (h?.id === z.id ? null : h))}
              onFocus={() => setHover(z)}
              onBlur={() => setHover(null)}
              style={{ cursor: 'pointer', outline: 'none' }}
            >
              <Block z={z} stroke={stroke} on={on} lit={lit} fire={fire} />
              <ZoneLabel z={z} al={al} />
            </g>
          );
        })}
        {mains && (
          <text x={940} y={900} textAnchor="middle" fontSize={18} fill={AMBER} letterSpacing={2}>
            UTILITY SUPPLY LOST · SITE ON GENERATORS
          </text>
        )}
      </motion.svg>

      <AnimatePresence>{hover && <ZoneTip key={hover.id} z={hover} selected={scope === hover.id} />}</AnimatePresence>
      <AnimatePresence>{kpis && <ExecOverlay />}</AnimatePresence>
    </>
  );
}

function zoneStroke(z: Zone, al: { crit: number; major: number }, fireIds: string[], scope: string) {
  if (fireIds.includes(z.id)) return RED;
  if (al.crit) return RED;
  if (al.major) return AMBER;
  return scope === z.id ? VIOLET : 'rgba(157,120,255,0.55)';
}

const pointsOf = (outline: string) => [...outline.matchAll(/(\d+(?:\.\d+)?) (\d+(?:\.\d+)?)/g)].map((m) => [Number(m[1]), Number(m[2])] as [number, number]);
const poly = (pts: [number, number][]) => pts.map((p) => p.join(',')).join(' ');
/** Storeys, as an extrusion height in px (B03 carries the cooling towers; B06 / B07 are lower). */
const HEIGHT: Record<string, number> = { b01: 40, b02: 46, b03: 52, b04: 42, b05: 44, b06: 26, b07: 30 };

/** A building as an extruded block: shadow, walls, roof with a parapet line and rooftop plant. */
function Block({ z, stroke, on, lit, fire }: { z: Zone; stroke: string; on: boolean; lit: boolean; fire: boolean }) {
  const base = pointsOf(z.outline);
  const h = HEIGHT[z.id] ?? 36;
  const roof = base.map(([x, y]) => [x, y - h] as [number, number]);
  const c = { x: roof.reduce((a, p) => a + p[0], 0) / roof.length, y: roof.reduce((a, p) => a + p[1], 0) / roof.length };
  const inset = roof.map(([x, y]) => [c.x + (x - c.x) * 0.86, c.y + (y - c.y) * 0.86] as [number, number]);
  // Walls facing the viewer: edges whose outward side points down the screen.
  const walls = base.map((p, i) => {
    const q = base[(i + 1) % base.length];
    return [p, q, [q[0], q[1] - h], [p[0], p[1] - h]] as [number, number][];
  });
  const accent = fire ? RED : stroke;
  return (
    <g style={{ animation: fire ? 'pf-alarm-blink 1s infinite' : undefined }}>
      <polygon points={poly(base.map(([x, y]) => [x + 16, y + 10]))} fill="rgba(0,0,0,0.45)" filter="url(#glow)" />
      {walls.map((w, i) => (
        <polygon key={i} points={poly(w)} fill="url(#wall)" stroke={accent} strokeOpacity={0.35} strokeWidth={1} />
      ))}
      {(lit || fire) && <polygon points={poly(roof)} fill={accent} opacity={0.35} filter="url(#glow)" />}
      <polygon points={poly(roof)} fill={fire ? 'rgba(217,107,132,0.35)' : on ? 'rgba(157,120,255,0.32)' : lit ? 'rgba(157,120,255,0.2)' : 'url(#roof)'} stroke={accent} strokeWidth={on ? 2.6 : 1.4} strokeLinejoin="round" style={{ transition: 'fill .25s' }} />
      <polygon points={poly(inset)} fill="none" stroke="rgba(228,204,255,0.12)" strokeWidth={1} />
      {[-1, 1].map((k) => (
        <rect key={k} x={c.x + k * 52 - 14} y={c.y - 46} width={28} height={14} rx={2} fill="rgba(228,204,255,0.06)" stroke="rgba(228,204,255,0.18)" strokeWidth={0.8} />
      ))}
    </g>
  );
}

/** Plaza paths and trees: context only, not clickable. */
function Ground() {
  const trees: [number, number][] = [];
  for (let i = 0; i < 26; i++) {
    const a = (i / 26) * Math.PI * 2;
    trees.push([940 + Math.cos(a) * 205, 540 + Math.sin(a) * 120]);
  }
  return (
    <g pointerEvents="none">
      {[0, 60, 120, 180, 240, 300].map((deg) => {
        const r = (deg * Math.PI) / 180;
        return <line key={deg} x1={940} y1={540} x2={940 + Math.cos(r) * 260} y2={540 + Math.sin(r) * 160} stroke="rgba(157,120,255,0.07)" strokeWidth={10} strokeLinecap="round" />;
      })}
      <ellipse cx={940} cy={540} rx={120} ry={66} fill="none" stroke="rgba(157,120,255,0.14)" strokeWidth={1.2} />
      {trees.map(([x, y], i) => (
        <circle key={i} cx={x} cy={y} r={5 + (i % 3)} fill="rgba(127,207,157,0.14)" stroke="rgba(127,207,157,0.3)" strokeWidth={0.8} />
      ))}
    </g>
  );
}

function centroid(outline: string) {
  const pts = [...outline.matchAll(/(\d+(?:\.\d+)?) (\d+(?:\.\d+)?)/g)].map((m) => [Number(m[1]), Number(m[2])]);
  const x = pts.reduce((a, p) => a + p[0], 0) / pts.length;
  const y = pts.reduce((a, p) => a + p[1], 0) / pts.length;
  return { x, y };
}

function ZoneLabel({ z, al }: { z: Zone; al: { crit: number; major: number } }) {
  const b = centroid(z.outline);
  const c = { x: b.x, y: b.y - (HEIGHT[z.id] ?? 36) + 10 };
  return (
    <g pointerEvents="none">
      <text x={c.x} y={c.y - 4} textAnchor="middle" fontSize={30} fontWeight={500} fill="#ffffff" letterSpacing={1}>
        {z.short}
      </text>
      <text x={c.x} y={c.y + 20} textAnchor="middle" fontSize={12} className="fill-ink-3" letterSpacing={1.5}>
        {al.crit ? `${al.crit} CRITICAL` : al.major ? `${al.major} MAJOR` : 'NORMAL'}
      </text>
      {(al.crit > 0 || al.major > 0) && <circle cx={c.x + 34} cy={c.y - 22} r={6} fill={al.crit ? RED : AMBER} style={{ animation: al.crit ? 'pf-alarm-blink 1s infinite' : undefined }} />}
    </g>
  );
}

const TIP_W = 300;
const TIP_H = 200;

/** Where the hover card goes: beside the building's roof, inside the map area, below the header. */
function tipPosition(z: Zone) {
  const c = centroid(z.outline);
  const roofY = c.y - (HEIGHT[z.id] ?? 0);
  const right = c.x + 130;
  const x = right + TIP_W <= 1530 ? right : c.x - 130 - TIP_W;
  const y = Math.min(Math.max(roofY - TIP_H / 2, 210), 880 - TIP_H);
  return z.id === 'bs' ? { x: 1180, y: 640 } : { x, y };
}

function ZoneTip({ z, selected }: { z: Zone; selected: boolean }) {
  const counts: [string, number][] = (['fahu', 'ahu', 'fcu', 'btuT', 'elv', 'gen', 'chiller', 'pef', 'sump'] as const)
    .map((k) => [KINDS[k].plural, ASSETS.filter((a) => a.zone === z.id && a.kind === k).length] as [string, number])
    .filter((x) => x[1] > 0)
    .slice(0, 4);
  const pos = tipPosition(z);
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.15 }}
      className="pf-panel pf-panel-solid pointer-events-none absolute z-30 px-[18px] py-[14px]"
      style={{ left: pos.x, top: pos.y, width: TIP_W }}
    >
      <p className="flex items-center justify-between text-[18px] font-medium text-white">
        {z.label}
        <span className="rounded-[8px] border border-accent/40 bg-accent/10 px-[8px] text-[12px] text-accent">{ASSETS.filter((a) => a.zone === z.id).length} assets</span>
      </p>
      <p className="mt-[4px] text-[13px] leading-snug text-ink-3">{z.note}</p>
      <ul className="mt-[10px] space-y-[5px] text-[13px] text-ink-2">
        {counts.map(([l, n]) => (
          <li key={l} className="flex justify-between">
            <span>{l}</span>
            <span className="tabular-nums text-white">{n}</span>
          </li>
        ))}
      </ul>
      <p className="mt-[10px] text-[13px] font-medium text-accent">{selected ? 'Click again for the entire project' : 'Click to show its KPIs'}</p>
    </motion.div>
  );
}

/* ---- Executive overlay ------------------------------------------------------------------------- */

const DOMAINS: { id: Domain; label: string; to: string }[] = [
  { id: 'hvac', label: 'HVAC', to: '/hvac/plant' },
  { id: 'vent', label: 'Ventilation & car park', to: '/hvac/ventilation' },
  { id: 'safety', label: 'Life safety', to: '/fire/system' },
  { id: 'electric', label: 'Electrical', to: '/electric/transformers' },
  { id: 'metering', label: 'Metering', to: '/metering/btu' },
  { id: 'transport', label: 'Lifts & escalators', to: '/maintenance/lifts' },
  { id: 'drainage', label: 'Drainage', to: '/wastewater/submersible' },
]

const KPI_LINKS: Record<string, string> = { 'EX-01': '/maintenance/mechanical', 'EX-06': '/fire/smoke', 'EX-02': '/hvac/plant', 'EX-07': '/metering/energy', 'EX-03': '/metering/btu', 'EX-05': '/hvac/fcu', 'EX-09': '/maintenance/lifts' };

function ExecOverlay() {
  const W = (1816 - 3 * 24) / 4;
  const bottom = [0, 1, 2, 3].map((i) => ({ x: 52 + i * (W + 24), y: 906, w: W, h: 130 }));
  return (
    <motion.div className="pointer-events-none absolute inset-0 [&>section]:pointer-events-auto" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ delay: 0.3 }}>
      <Panel frame={{ x: 52, y: 206, w: 310, h: 300 }} index={3} icon={<Glyph id="building" size={18} color="#ffffff" />} title={PROJECT.name} subtitle={PROJECT.location}>
        <Glance />
      </Panel>
      <KpiTile id="EX-01" to="/maintenance/mechanical" frame={{ x: 52, y: 526, w: 310, h: 130 }} index={4} />
      <KpiTile id="EX-06" to="/fire/smoke" frame={{ x: 52, y: 676, w: 310, h: 130 }} index={5} />

      <Panel frame={{ x: 1558, y: 206, w: 310, h: 450 }} index={6} title="Alarms by System" subtitle="Click a system to open it">
        <AlarmsBySystem />
      </Panel>
      <KpiTile id="EX-02" to="/hvac/plant" frame={{ x: 1558, y: 676, w: 310, h: 130 }} index={7} />

      {['EX-07', 'EX-03', 'EX-05', 'EX-09'].map((id, i) => (
        <KpiTile key={id} id={id} to={KPI_LINKS[id]} frame={bottom[i]} index={8 + i} />
      ))}
    </motion.div>
  );
}

function Glance() {
  const facts: [string, string][] = [
    ['Buildings', '7 + 2 basements'],
    ['Connected assets', fmt(ASSETS.length)],
    ['Fan coil units', fmt(countOf('fcu'))],
    ['Billing meters', fmt(countOf('btuT') + countOf('btuB'))],
    ['Air handlers', fmt(countOf('fahu') + countOf('ahu'))],
    ['Lifts & escalators', fmt(countOf('elv') + countOf('esc'))],
  ];
  return (
    <dl className="absolute inset-x-[20px] bottom-[18px] top-[4px] grid grid-cols-2 gap-x-[16px] gap-y-[14px]">
      {facts.map(([l, v]) => (
        <div key={l} className="flex flex-col justify-center">
          <dd className="text-[24px] font-medium leading-none tabular-nums text-white">{v.split(' ')[0]}</dd>
          <dt className="mt-[6px] text-[13px] leading-tight text-ink-3">{v.includes(' ') ? `${l} ${v.slice(v.indexOf(' '))}` : l}</dt>
        </div>
      ))}
    </dl>
  );
}

function AlarmsBySystem() {
  const { snap, scope } = useFleet();
  const navigate = useNavigate();
  const rows = DOMAINS.map((d) => {
    let crit = 0;
    let other = 0;
    for (const a of ASSETS) {
      if (KINDS[a.kind].domain !== d.id || (scope !== 'project' && a.zone !== scope)) continue;
      const al = snap.states.get(a.tag)!.alarm;
      if (al?.severity === 'critical') crit++;
      else if (al) other++;
    }
    return { ...d, crit, other };
  });
  const max = Math.max(1, ...rows.map((r) => r.crit + r.other));
  return (
    <ul className="absolute inset-x-[20px] top-[8px] space-y-[18px]">
      {rows.map((r) => (
        <li key={r.id}>
          <button onClick={() => navigate(r.to)} className="group w-full text-left">
            <div className="flex items-baseline justify-between text-[15px]">
              <span className="text-ink-2 group-hover:text-white">{r.label}</span>
              <span className="tabular-nums">
                {r.crit > 0 && <span className="mr-[8px] text-alarm-soft">{r.crit} crit</span>}
                <span className="text-white">{r.crit + r.other}</span>
              </span>
            </div>
            <div className="mt-[4px] flex h-[4px] overflow-hidden rounded-full bg-white/[0.06]">
              <span style={{ width: `${(r.crit / max) * 100}%`, background: RED }} />
              <span style={{ width: `${(r.other / max) * 100}%`, background: VIOLET }} />
            </div>
          </button>
        </li>
      ))}
    </ul>
  );
}
