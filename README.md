# Central · Operations Center Demo

A demo of the unified operations platform for **Central** (Fifth Settlement, New Cairo), built from the
BMS technical submittal **CNC0926-BMS-2254 REV-13** (Schneider Electric / ACS, September 2026):
System Architecture (SA), Riser Diagram (RD), Equipment List with BoQ, I/O list and schematics (EL),
and Data Sheets (DS).

**Everything is simulated.** There is no backend and no connection to any controller, Enterprise
Server or AVEVA Galaxy. What *is* real is the shape of the data: every asset, count and point comes
from the submittal, and every KPI, SOP and point is tagged with how sure we are it can be read on site.

**Sign in** with `administrator` / `000000` (local to the demo, `src/gateway/auth.ts`).

## What is modelled

| | From the submittal |
|---|---|
| Zones | Buildings 01–07 and Basements B1/B2 (central chiller plant, car park) |
| Assets | 2,018: 6 chillers, 7+7 pumps, 6 cooling towers, 26 FAHU, 4 AHU, 2 CRAC, 655 FCUs (TC903), 655 billing meters (590 SP90 energy valves + 65 Kamstrup), 192 car-park fans with 395 CO sensors, 30 smoke / pressurisation fans, 32 duplex sump sets, 54 lifts, 19 escalators, 19 generators, 22 transformers / RMUs, 153 power meters, 9 UPS, fire and PA panels |
| Points | 16,790 modelled attributes, per the EL schematics and I/O list and the integration matrices |

## Data tiers

| Tier | Meaning |
|---|---|
| Proven · BMS hardwired I/O | Listed in the EL I/O list / schematics (DI/DO/AI/AO) |
| Proven · BMS integration | Modbus RTU / BACnet IP interface in the BMS matrix; registers per data sheet |
| In scope · AVEVA integration | Interface in the AVEVA matrix (electrical, lifts, UPS); register map by the vendor |
| Calculated | Derived in the platform from proven points |
| Assumed | Systems by others (fire alarm, PA, CCTV, access control, CAFM, cooling billing) |

## Verticals

| Vertical | Tabs |
|---|---|
| Site | Schematic site plan with live alarm state per building; click a building to scope every KPI; executive overlay |
| Command | Executive scorecard · Operations console (alarms → SOPs, drills) · KPI Register · SOP Library · Data Coverage |
| HVAC | Chiller Plant · Heat Rejection · Air Handling (3D FAHU) · Fan Coil Units · Car Park (CO map) · Ventilation |
| Electric | MV & Transformers · Distribution · Generators & ATS · UPS · SLD (typical, illustrative) |
| Metering | Cooling Meters · Cooling Billing · Energy |
| Life Safety | Fire Alarm (live cause-and-effect) · Smoke Control · Public Address |
| Security | CCTV · Access Control (illustrative) |
| Facilities | Lifts & Escalators · Drainage · Lighting |
| CAFM | Work Orders · PPM Plan · Asset Register |

Every table row opens the asset's live points (Galaxy `Tag.Attribute` view, coloured by tier) and,
when it is in alarm, the SOP that handles it.

## KPIs and SOPs

- `src/model/central/kpis.ts` — 37 KPIs (14 executive, 17 operations, 6 maintenance): definition,
  formula, source points, tier, target; computed live from the simulated fleet.
- `src/model/central/sops.ts` — 41 SOPs: trigger points, roles, steps, close-out check read from
  points, escalation, linked KPIs.
- `npm run docs` writes them to `docs/` as Markdown (KPI register, SOP library, asset & point basis).

## Run

```bash
npm install
npm run dev
```

Open http://localhost:5195 (1920 × 1080 stage, scales to any window). `npm run build` writes a static
site to `dist/`.

## Source layout

| Folder | What is in it |
|---|---|
| `src/model/central/` | Project & zones, point templates, asset registry + simulator, KPIs, SOPs, assumed CAFM |
| `src/screens/central/` | The Central screens and the shared kit (KPI tiles, fleet tables, asset drawer) |
| `scripts/export-docs.ts` | Markdown export of the registers |
