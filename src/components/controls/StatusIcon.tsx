import type { CSSProperties, ReactNode } from 'react';

export type StatusTone = 'warn' | 'bad';

const WARN = 'var(--color-warn)';
const ALARM = 'var(--color-alarm)';
const ON_ALARM = '#14060b';

/** The shapes (24×24): a triangle for a warning, a filled disc for an alarm, so they differ without colour too. */
function Shape({ tone }: { tone: StatusTone }) {
  return tone === 'warn' ? (
    <>
      <path d="M12 3.6 21.6 20.4H2.4Z" fill={WARN} fillOpacity={0.18} stroke={WARN} strokeWidth={2} strokeLinejoin="round" />
      <path d="M12 10v4.6" stroke={WARN} strokeWidth={2.2} strokeLinecap="round" />
      <circle cx={12} cy={17.5} r={1.25} fill={WARN} />
    </>
  ) : (
    <>
      <circle cx={12} cy={12} r={10} fill={ALARM} />
      <path d="M12 6.8v6.2" stroke={ON_ALARM} strokeWidth={2.4} strokeLinecap="round" />
      <circle cx={12} cy={17.2} r={1.5} fill={ON_ALARM} />
    </>
  );
}

/** A warning is steady; an alarm blinks (the animation is switched off for people who ask for less motion). */
const blink: CSSProperties = { animation: 'pf-alarm-blink 0.9s ease-in-out infinite' };

/** Inline status icon: static triangle for a warning, blinking disc for an alarm. */
export function StatusIcon({ tone, size = 16, style }: { tone: StatusTone; size?: number | string; style?: CSSProperties }) {
  return (
    <svg
      viewBox="0 0 24 24"
      width={size}
      height={size}
      role="img"
      aria-label={tone === 'bad' ? 'Alarm' : 'Warning'}
      className={tone === 'bad' ? 'pf-blink shrink-0' : 'shrink-0'}
      style={{ display: 'inline-block', filter: `drop-shadow(0 0 4px ${tone === 'bad' ? 'rgba(217,107,132,0.55)' : 'rgba(232,169,140,0.4)'})`, ...(tone === 'bad' ? blink : null), ...style }}
    >
      <Shape tone={tone} />
    </svg>
  );
}

/** The same icon placed inside an SVG (gauge faces): x/y is the top-left corner. */
export function StatusIconSvg({ tone, x, y, size = 16 }: { tone: StatusTone; x: number; y: number; size?: number }) {
  return (
    <svg x={x} y={y} width={size} height={size} viewBox="0 0 24 24" className={tone === 'bad' ? 'pf-blink' : undefined} style={tone === 'bad' ? blink : undefined} aria-label={tone === 'bad' ? 'Alarm' : 'Warning'}>
      <Shape tone={tone} />
    </svg>
  );
}

/** Inline text with its status icon: `<Flag tone="warn">3 d late</Flag>`; with no tone it is just the text. */
export function Flag({ tone, children, size = '0.95em' }: { tone?: StatusTone | null; children: ReactNode; size?: number | string }) {
  if (!tone) return <>{children}</>;
  return (
    <span className="inline-flex items-center gap-[0.4em]">
      <StatusIcon tone={tone} size={size} />
      {children}
    </span>
  );
}
