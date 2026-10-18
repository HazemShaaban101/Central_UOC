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

The platform demo's verticals and tabs, with Central's data; the subsystems Central has and the demo
did not are added in the same card layouts (marked *new*).

| Vertical | Tabs |
|---|---|
| 3D View | Central site plan with live alarm state per building; click a building to scope every KPI |
| HVAC *new* | Chiller Plant · Air Handling (3D FAHU) · Fan Coil Units · Ventilation |
| Fire | Fire System (B01–B07 + basements, fire drill) · Fire Hydrants · Smoke Control *new* · Public Address *new* |
| Electric | Transformers · MDB · Generators · UPS · SLD (Basement 01 substation) · Lighting *new* |
| Community | Application · Navigation · Crowd Monitoring · Social Media (not in the submittal: illustrative) |
| Metering | Energy Metering · Energy Analytics · Water Metering · BTU (655 meters) · Billing |
| Security | CCTV · Access Control · Parking & LPR · Gates |
| Plumbing | Domestic / Irrigation · Pumps · Valve Chambers · SLD |
| Wastewater | Submersible Pumps (32 duplex sets on B2, four sump groups) · Odor Control |
| Maintenance | Ticketing · Mechanical · Electrical · Pumps · Sensors · Lifts & Escalators *new* |

## KPIs and SOPs

- The KPI register and SOP library are documents (`docs/`), not screens.
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
| `src/screens/central/` | The home page (site plan), the added subsystems, and the tile kit |
| `src/screens/hvac/` | HVAC screens (new vertical) |
| `scripts/export-docs.ts` | Markdown export of the registers |
