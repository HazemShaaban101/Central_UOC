import type { ReactNode } from 'react';
import { motion } from 'framer-motion';
import { ZONES } from '@/model/central/project';

/** Map image coordinates (the aerial is 2400×1191). Overlays use these units, before OVERLAY scales them onto the campus. */
export const MAP_W = 2400;
export const MAP_H = 1191;

const OVERLAY = { s: 0.75, tx: 334, ty: 251 };
/** Central's plan (stage coordinates 380–1520 × 230–860) placed on the same area, uniformly scaled. */
const PLAN = { s: 1.1, tx: 1219 - 950 * 1.1, ty: 704 - 545 * 1.1 };

/**
 * The top-view site map in the platform's cyan-rimmed pill frame (as on Fire Detection), with an SVG
 * overlay in map coordinates for markers, heat, routes and zones.
 */
export function SiteMap({ frame, children, radius = 16, dim = 0.15 }: { frame: { x: number; y: number; w: number; h: number }; children?: ReactNode; radius?: number; dim?: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, delay: 0.2 }}
      className="absolute overflow-hidden"
      style={{ left: frame.x, top: frame.y, width: frame.w, height: frame.h, borderRadius: radius }}
    >
      <div className="absolute inset-0" style={{ background: 'linear-gradient(180deg, #120d19, #07050a)' }} />
      <svg className="absolute inset-0 h-full w-full" viewBox={`0 0 ${MAP_W} ${MAP_H}`} preserveAspectRatio="xMidYMid slice" aria-label="Central site plan">
        {/* Central's schematic site plan (the home page's), centred on the area the overlays use. */}
        <g transform={`translate(${PLAN.tx} ${PLAN.ty}) scale(${PLAN.s})`}>
          {ZONES.map((z) => (
            <path key={z.id} d={z.outline} fill={z.id === 'bs' ? 'rgba(157,120,255,0.03)' : 'rgba(36,26,51,0.95)'} stroke="rgba(157,120,255,0.5)" strokeWidth={1.4} strokeDasharray={z.id === 'bs' ? '10 8' : undefined} />
          ))}
          {ZONES.filter((z) => z.id !== 'bs').map((z) => {
            const pts = [...z.outline.matchAll(/(\d+(?:\.\d+)?) (\d+(?:\.\d+)?)/g)].map((m) => [Number(m[1]), Number(m[2])]);
            const x = pts.reduce((acc, q) => acc + q[0], 0) / pts.length;
            const y = pts.reduce((acc, q) => acc + q[1], 0) / pts.length;
            return (
              <text key={z.id} x={x} y={y + 8} textAnchor="middle" fontSize={26} fill="rgba(255,255,255,0.55)">
                {z.short}
              </text>
            );
          })}
        </g>
      </svg>
      <div className="absolute inset-0" style={{ background: `rgba(1,7,7,${dim})`, boxShadow: 'inset 0 0 60px rgba(2,1,2,0.85)' }} />
      <svg className="absolute inset-0 h-full w-full" viewBox={`0 0 ${MAP_W} ${MAP_H}`} preserveAspectRatio="xMidYMid slice">
        {/* Overlay positions are in the old map's units: scaled and moved onto the campus of the aerial. */}
        <g transform={`translate(${OVERLAY.tx} ${OVERLAY.ty}) scale(${OVERLAY.s})`}>{children}</g>
      </svg>
      <div className="pointer-events-none absolute inset-0 border border-accent/60" style={{ borderRadius: radius }} />
    </motion.div>
  );
}
