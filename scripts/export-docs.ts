/**
 * Writes the KPI register and the SOP library to docs/ as Markdown, from the same data the demo shows
 * (src/model/central). Run: npm run docs
 */
import { writeFileSync, mkdirSync } from 'node:fs';
import { resolve } from 'node:path';
import { KPIS } from '@/model/central/kpis';
import { SOPS } from '@/model/central/sops';
import { ASSETS, KINDS, type AssetKind } from '@/model/central/assets';
import { PROJECT, TIERS, ZONES } from '@/model/central/project';

const out = resolve(process.cwd(), 'docs');
mkdirSync(out, { recursive: true });
const esc = (s: string) => s.replace(/\|/g, '\\|');
const tier = (t: keyof typeof TIERS) => TIERS[t].label;

const header = (title: string) => `# Central — ${title}

**Project:** ${PROJECT.name}, ${PROJECT.location} · **Client:** ${PROJECT.client}
**Basis:** BMS technical submittal ${PROJECT.submittal} (${PROJECT.documents.map((d) => d.code).join(', ')})
**BMS:** ${PROJECT.bmsVendor} · **Supervisory:** ${PROJECT.supervisory}

## Data tiers

| Tier | Meaning |
|---|---|
${(Object.keys(TIERS) as (keyof typeof TIERS)[]).map((t) => `| ${TIERS[t].label} | ${TIERS[t].desc} |`).join('\n')}
`;

/* ---- KPI register ---- */
const kpiDoc = [
  header('KPI Register'),
  `## Summary (${KPIS.length} KPIs)

| ID | KPI | Audience | Data tier | Target | Frequency |
|---|---|---|---|---|---|
${KPIS.map((k) => `| ${k.id} | ${esc(k.name)} | ${k.audience} | ${tier(k.tier)} | ${esc(k.target)} | ${esc(k.frequency)} |`).join('\n')}
`,
  ...(['Executive', 'Operations', 'Maintenance'] as const).map(
    (aud) => `## ${aud} KPIs

${KPIS.filter((k) => k.audience === aud)
  .map(
    (k) => `### ${k.id} · ${k.name}

- **Domain:** ${k.domain}${k.plantWide ? ' (central plant, project-wide)' : ''}
- **Definition:** ${k.definition}
- **Formula:** \`${k.formula}\`
- **Source points:** ${k.points.map((p) => `\`${p}\``).join(', ')}
- **Data tier:** ${tier(k.tier)}
- **Target:** ${k.target} · **Frequency:** ${k.frequency}
- **SOPs acting on it:** ${SOPS.filter((s) => s.kpis.includes(k.id)).map((s) => `${s.id} ${s.title}`).join('; ') || '— (reporting KPI)'}
`,
  )
  .join('\n')}`,
  ),
].join('\n');

/* ---- SOP library ---- */
const sopDoc = [
  header('SOP Library'),
  `Alarm-driven SOPs are meant to run as AVEVA Work Task workflows (AVEVA BoQ): the alarm opens the task, each step is acknowledged by its role, and the close-out check reads the points back before the task can be closed.

## Summary (${SOPS.length} SOPs)

| ID | Procedure | System | Category | Priority | Data tier |
|---|---|---|---|---|---|
${SOPS.map((s) => `| ${s.id} | ${esc(s.title)} | ${esc(s.system)} | ${s.category} | ${s.priority} | ${tier(s.tier)} |`).join('\n')}
`,
  ...SOPS.map(
    (s) => `## ${s.id} · ${s.title}

| | |
|---|---|
| System | ${esc(s.system)} |
| Category | ${s.category} |
| Priority / response | ${s.priority} · ${esc(s.response)} |
| Data tier | ${tier(s.tier)} |
| Roles | ${s.roles.join(', ')} |

**Trigger.** ${s.trigger}

**Trigger points.** ${s.points.map((p) => `\`${p}\``).join(', ')}

**Steps**

${s.steps.map((st, i) => `${i + 1}. ${st}`).join('\n')}

**Close-out check (read from points).** ${s.verify}

**Escalation.** ${s.escalation}

**KPIs protected.** ${s.kpis.map((id) => `${id} ${KPIS.find((k) => k.id === id)?.name ?? ''}`).join('; ')}
`,
  ),
].join('\n');

/* ---- Asset & point basis ---- */
const kinds = Object.keys(KINDS) as AssetKind[];
const assetDoc = `${header('Asset & Point Basis')}
## Served equipment per zone (from the EL)

| Type | ${ZONES.map((z) => z.short).join(' | ')} | Total | Data tier |
|---|${ZONES.map(() => '---:').join('|')}|---:|---|
${kinds.map((k) => `| ${KINDS[k].plural} | ${ZONES.map((z) => ASSETS.filter((a) => a.kind === k && a.zone === z.id).length || '·').join(' | ')} | ${ASSETS.filter((a) => a.kind === k).length} | ${tier(KINDS[k].tier)} |`).join('\n')}

## Point templates

${kinds
  .filter((k, i) => kinds.findIndex((x) => KINDS[x].template === KINDS[k].template) === i)
  .map(
    (k) => `### ${KINDS[k].template.name} — ${KINDS[k].template.desc}

Interface: ${KINDS[k].template.io}

| Attribute | Type | Unit | Description | Tier |
|---|---|---|---|---|
${KINDS[k].template.attrs.map((a) => `| ${a.name} | ${a.type} | ${a.unit ?? ''} | ${esc(a.desc)} | ${tier(a.src ?? KINDS[k].tier)} |`).join('\n')}
`,
  )
  .join('\n')}`;

writeFileSync(resolve(out, 'Central-KPI-Register.md'), kpiDoc);
writeFileSync(resolve(out, 'Central-SOP-Library.md'), sopDoc);
writeFileSync(resolve(out, 'Central-Asset-Point-Basis.md'), assetDoc);
console.log(`Wrote ${KPIS.length} KPIs, ${SOPS.length} SOPs, ${ASSETS.length} assets to docs/`);
