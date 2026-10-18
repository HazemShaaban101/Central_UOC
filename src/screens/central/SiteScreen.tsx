import { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Panel } from '@/components/frame/Panel';
import { Glyph } from '@/components/icons/Glyph';
import { useHomeUi } from '@/components/chrome/ScopeBar';
import { BUILDINGS, PROJECT, ZONES, type Zone } from '@/model/central/project';
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
  const fireZone = useScenario((s) => (s.fire.active ? s.fire.zone : null));
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
          <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="6" />
          </filter>
        </defs>
        <rect width={1920} height={1080} fill="url(#grid)" onClick={() => setScope('project')} />
        {/* Basement footprint (B1 / B2) under everything. */}
        <path
          d={basement.outline}
          fill={scope === 'bs' ? 'rgba(157,120,255,0.10)' : 'rgba(157,120,255,0.03)'}
          stroke={zoneStroke(basement, zoneAlarm(basement), fireZone, scope)}
          strokeWidth={scope === 'bs' ? 2.5 : 1.5}
          strokeDasharray="10 8"
          onClick={() => pick(basement)}
          onMouseEnter={() => setHover(basement)}
          onMouseLeave={() => setHover(null)}
          style={{ cursor: 'pointer' }}
        />
        <text x={1478} y={830} textAnchor="end" className="fill-ink-3" fontSize={14} letterSpacing={2}>
          BASEMENTS B1 · B2 — CHILLER PLANT · CAR PARK (192 FANS)
        </text>
        <ellipse cx={940} cy={530} rx={170} ry={95} fill="url(#plaza)" pointerEvents="none" />
        <text x={940} y={536} textAnchor="middle" fontSize={15} letterSpacing={4} className="fill-ink-4" pointerEvents="none">
          CENTRAL PLAZA
        </text>
        {/* Plant room marker (B1) and cooling towers (B03 roof). */}
        <g pointerEvents="none">
          <rect x={890} y={455} width={100} height={26} rx={6} fill="rgba(5,3,8,0.8)" stroke="rgba(157,120,255,0.4)" />
          <text x={940} y={473} textAnchor="middle" fontSize={12} className="fill-aqua">CHILLER PLANT · B1</text>
        </g>
        {BUILDINGS.map((z) => {
          const al = zoneAlarm(z);
          const on = scope === z.id;
          const lit = on || hover?.id === z.id;
          const stroke = zoneStroke(z, al, fireZone, scope);
          const fire = fireZone === z.id;
          return (
            <g key={z.id}>
              {(lit || fire) && <path d={z.outline} fill={stroke} opacity={0.35} filter="url(#glow)" pointerEvents="none" />}
              <path
                d={z.outline}
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
                fill={fire ? 'rgba(217,107,132,0.35)' : on ? 'rgba(157,120,255,0.30)' : lit ? 'rgba(157,120,255,0.2)' : 'rgba(20,14,28,0.92)'}
                stroke={stroke}
                strokeWidth={on ? 3 : 1.6}
                strokeLinejoin="round"
                style={{ cursor: 'pointer', outline: 'none', transition: 'fill .25s', animation: fire ? 'pf-alarm-blink 1s infinite' : undefined }}
              />
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

      <AnimatePresence>{hover && <ZoneTip z={hover} selected={scope === hover.id} />}</AnimatePresence>
      <AnimatePresence>{kpis && <ExecOverlay />}</AnimatePresence>
    </>
  );
}

function zoneStroke(z: Zone, al: { crit: number; major: number }, fireZone: string | null, scope: string) {
  if (fireZone === z.id) return RED;
  if (al.crit) return RED;
  if (al.major) return AMBER;
  return scope === z.id ? VIOLET : 'rgba(157,120,255,0.55)';
}

function centroid(outline: string) {
  const pts = [...outline.matchAll(/(\d+(?:\.\d+)?) (\d+(?:\.\d+)?)/g)].map((m) => [Number(m[1]), Number(m[2])]);
  const x = pts.reduce((a, p) => a + p[0], 0) / pts.length;
  const y = pts.reduce((a, p) => a + p[1], 0) / pts.length;
  return { x, y };
}

function ZoneLabel({ z, al }: { z: Zone; al: { crit: number; major: number } }) {
  const c = centroid(z.outline);
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

function ZoneTip({ z, selected }: { z: Zone; selected: boolean }) {
  const counts: [string, number][] = (['fahu', 'ahu', 'fcu', 'btuT', 'elv', 'gen', 'chiller', 'pef', 'sump'] as const)
    .map((k) => [KINDS[k].plural, ASSETS.filter((a) => a.zone === z.id && a.kind === k).length] as [string, number])
    .filter((x) => x[1] > 0)
    .slice(0, 5);
  return (
    <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="pf-panel pf-panel-solid pointer-events-none absolute z-20 w-[290px] -translate-x-1/2 -translate-y-full px-[16px] py-[12px]" style={{ left: z.anchor.x, top: z.anchor.y - 14 }}>
      <p className="flex items-center justify-between text-[17px] font-medium text-white">
        {z.label}
        <span className="rounded-[8px] border border-accent/40 bg-accent/10 px-[7px] text-[11px] text-accent">{ASSETS.filter((a) => a.zone === z.id).length} assets</span>
      </p>
      <p className="mt-[3px] text-[12px] text-ink-3">{z.note}</p>
      <ul className="mt-[8px] space-y-[3px] text-[12px] text-ink-2">
        {counts.map(([l, n]) => (
          <li key={l} className="flex justify-between">
            <span>{l}</span>
            <span className="tabular-nums text-white">{n}</span>
          </li>
        ))}
      </ul>
      <p className="mt-[6px] text-[12px] font-medium text-accent">{selected ? 'Click again for the entire project' : 'Click to scope every KPI to it'}</p>
    </motion.div>
  );
}

/* ---- Executive overlay ------------------------------------------------------------------------- */

const DOMAINS: { id: Domain; label: string; to: string }[] = [
  { id: 'hvac', label: 'HVAC', to: '/hvac/plant' },
  { id: 'vent', label: 'Ventilation & car park', to: '/hvac/carpark' },
  { id: 'safety', label: 'Life safety', to: '/safety/fire' },
  { id: 'electric', label: 'Electrical', to: '/electric/mv' },
  { id: 'metering', label: 'Metering', to: '/metering/btu' },
  { id: 'transport', label: 'Lifts & escalators', to: '/facilities/transport' },
  { id: 'drainage', label: 'Drainage', to: '/facilities/drainage' },
];

function ExecOverlay() {
  const bottom = [0, 1, 2, 3, 4, 5].map((i) => ({ x: 52 + i * (286 + 20), y: 891, w: 286, h: 155 }));
  return (
    <motion.div className="pointer-events-none absolute inset-0 [&>section]:pointer-events-auto" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ delay: 0.3 }}>
      <Panel frame={{ x: 52, y: 206, w: 310, h: 330 }} index={3} icon={<Glyph id="building" size={18} color="#ffffff" />} title="Central at a Glance" subtitle={PROJECT.location}>
        <Glance />
      </Panel>
      <KpiTile id="EX-01" frame={{ x: 52, y: 556, w: 310, h: 150 }} index={4} />
      <KpiTile id="EX-06" frame={{ x: 52, y: 726, w: 310, h: 150 }} index={5} />

      <Panel frame={{ x: 1558, y: 206, w: 310, h: 330 }} index={6} title="Alarms by System" subtitle="Live · click a system">
        <AlarmsBySystem />
      </Panel>
      <KpiTile id="EX-02" frame={{ x: 1558, y: 556, w: 310, h: 150 }} index={7} />
      <KpiTile id="EX-10" frame={{ x: 1558, y: 726, w: 310, h: 150 }} index={8} />

      {['EX-07', 'EX-03', 'EX-05', 'EX-04', 'EX-09', 'EX-11'].map((id, i) => (
        <KpiTile key={id} id={id} frame={bottom[i]} index={9 + i} />
      ))}
    </motion.div>
  );
}

function Glance() {
  const facts: [string, number | string][] = [
    ['Buildings + basements', '7 + 2'],
    ['Connected assets', fmt(ASSETS.length)],
    ['Chillers · towers', `${countOf('chiller')} · ${countOf('ct')}`],
    ['Air handlers (FAHU · AHU)', `${countOf('fahu')} · ${countOf('ahu')}`],
    ['Fan coil units', fmt(countOf('fcu'))],
    ['Cooling billing meters', fmt(countOf('btuT') + countOf('btuB'))],
    ['Car-park fans · CO sensors', `${countOf('pef') + countOf('psf')} · 395`],
    ['Lifts · escalators', `${countOf('elv')} · ${countOf('esc')}`],
    ['Generators · transformers', `${countOf('gen')} · ${countOf('tr')}`],
  ];
  return (
    <dl className="absolute inset-x-[18px] top-[0px] space-y-[4px] text-[13.5px]">
      {facts.map(([l, v]) => (
        <div key={l} className="flex items-baseline justify-between border-b border-white/[0.05] pb-[4px]">
          <dt className="text-[#d0c0df]">{l}</dt>
          <dd className="tabular-nums text-white">{v}</dd>
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
    <ul className="absolute inset-x-[18px] top-[4px] space-y-[9px]">
      {rows.map((r) => (
        <li key={r.id}>
          <button onClick={() => navigate(r.to)} className="group w-full text-left">
            <div className="flex items-baseline justify-between text-[14px]">
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
