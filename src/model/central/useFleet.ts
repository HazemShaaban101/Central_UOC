import { useNow } from '@/sim/clock';
import { useScenario } from '@/sim/scenario';
import { useScope } from '@/sim/scope';
import { snapshot, type SimContext, type Snapshot } from '@/model/central/assets';
import type { KpiCtx } from '@/model/central/kpis';

/** The whole fleet at the current tick (shared by every widget on screen), plus the scope. */
export function useFleet(step = 5000): { snap: Snapshot; ctx: SimContext; scope: string; now: number; kpi: KpiCtx } {
  const now = useNow(step);
  const fireZone = useScenario((s) => (s.fire.active ? s.fire.zone : null));
  const mainsFailed = useScenario((s) => s.mains.failed);
  const scope = useScope();
  const ctx: SimContext = { fireZone, mainsFailed };
  const snap = snapshot(now, ctx);
  return { snap, ctx, scope, now, kpi: { snap, scope, now } };
}
