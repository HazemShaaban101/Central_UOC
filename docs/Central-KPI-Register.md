# Central — KPI Register

**Project:** Central, Fifth Settlement, New Cairo · **Client:** RMC
**Basis:** BMS technical submittal CNC0926-BMS-2254 · REV-13 · Sep 2026 (CNC0926-BMS-2254-SA, CNC0926-BMS-2254-RD, CNC0926-BMS-2254-EL, CNC0926-BMS-2254-DS)
**BMS:** Schneider Electric · EcoStruxure Building Operation · **Supervisory:** AVEVA System Platform · Operations Control Supervisory

## Data tiers

| Tier | Meaning |
|---|---|
| Proven · BMS hardwired I/O | Listed point-by-point in the EL I/O list and schematics (DI / DO / AI / AO on MP-C / AS-P controllers). |
| Proven · BMS integration | Software interface in the BMS integration matrix (Modbus RTU / BACnet IP); registers per the device data sheet. |
| In scope · AVEVA integration | Software interface in the AVEVA integration matrix; register map supplied by the system vendor (by others). |
| Calculated | Computed in the platform from proven points (no extra hardware). |
| Assumed · system by others | Third-party system (fire, PA, CCTV, access, CAFM): content assumed from industry practice, to be confirmed with its vendor. |

## Summary (37 KPIs)

| ID | KPI | Audience | Data tier | Target | Frequency |
|---|---|---|---|---|---|
| EX-01 | Critical Systems Availability | Executive | Proven · BMS hardwired I/O | ≥ 98 % | Live · monthly average reported |
| EX-02 | Cooling Plant Efficiency | Executive | Proven · BMS integration | ≤ 0.75 kW/TR | Live · daily average |
| EX-03 | Cooling Energy Delivered Today | Executive | Proven · BMS integration | Trend vs last week | Hourly |
| EX-04 | Billing Data Completeness | Executive | Proven · BMS integration | ≥ 99.5 % | Live · month-end gate |
| EX-05 | Thermal Comfort Compliance | Executive | Proven · BMS integration | ≥ 95 % | Live · weekly |
| EX-06 | Life-Safety Readiness | Executive | Proven · BMS hardwired I/O | 100 % | Live |
| EX-07 | Electrical Demand | Executive | In scope · AVEVA integration | Below contracted demand | Live · 15-min demand |
| EX-08 | Standby Power Readiness | Executive | In scope · AVEVA integration | 100 % | Live |
| EX-09 | Vertical Transport Availability | Executive | In scope · AVEVA integration | ≥ 98 % | Live · monthly |
| EX-10 | Open Critical Alarms | Executive | Calculated | 0 | Live |
| EX-11 | Work-Order SLA Compliance | Executive | Assumed · system by others | ≥ 90 % | Daily |
| EX-12 | PPM Compliance | Executive | Assumed · system by others | ≥ 95 % | Weekly |
| EX-13 | Car-Park Air Quality | Executive | Proven · BMS hardwired I/O | 100 % (≥ 99 % of hours) | Live |
| EX-14 | Carbon Emissions Today | Executive | In scope · AVEVA integration | −5 % year on year | Daily |
| OP-01 | Active Alarms | Operations | Calculated | No P1 older than 15 min | Live |
| OP-02 | Chiller Staging | Operations | Proven · BMS hardwired I/O | Running = required | Live |
| OP-03 | CHW Supply Temperature | Operations | Proven · BMS hardwired I/O | Set point 6.7 °C ± 0.5 K | Live |
| OP-04 | Plant ΔT | Operations | Proven · BMS hardwired I/O | ≥ 4.5 K (design 5.5 K) | Live |
| OP-05 | Cooling Tower Approach | Operations | Calculated | ≤ 4 K | Live |
| OP-06 | Supply Air Compliance | Operations | Proven · BMS hardwired I/O | ≥ 95 % | Live |
| OP-07 | Equipment in Hand | Operations | Proven · BMS hardwired I/O | 0 unplanned | Live |
| OP-08 | Field Device Comms | Operations | Proven · BMS integration | ≥ 99 % | Live |
| OP-09 | Dirty Filters | Operations | Proven · BMS hardwired I/O | 0 older than 5 days | Live |
| OP-10 | Car-Park Fans in Boost | Operations | Proven · BMS hardwired I/O | Trend only | Live |
| OP-11 | Sump High Levels | Operations | Proven · BMS hardwired I/O | 0 | Live |
| OP-12 | Peak Transformer Loading | Operations | In scope · AVEVA integration | ≤ 80 % | Live |
| OP-13 | Power Factor | Operations | In scope · AVEVA integration | ≥ 0.92 | Live |
| OP-14 | Lift Faults & Entrapments | Operations | In scope · AVEVA integration | 0 entrapments | Live |
| OP-15 | Fire System Impairments | Operations | Assumed · system by others | 0 without permit | Live |
| OP-16 | PA Health | Operations | Assumed · system by others | 100 % | Live |
| OP-17 | Security Events Today | Operations | Assumed · system by others | Trend only | Daily |
| MT-01 | Plant Run Hours vs Service | Maintenance | Proven · BMS integration | Serviced before interval | Daily |
| MT-02 | Trips Today | Maintenance | Proven · BMS hardwired I/O | Trend down | Live · per 1,000 run h monthly |
| MT-03 | Mean Time To Repair | Maintenance | Assumed · system by others | ≤ 8 h (P2) | Weekly |
| MT-04 | Open Work Orders | Maintenance | Assumed · system by others | Backlog ≤ 1 week | Live |
| MT-05 | Sump Pump Starts | Maintenance | Calculated | ≤ 20 per day | Daily |
| MT-06 | Duty Rotation Balance | Maintenance | Proven · BMS integration | ≤ 10 % | Weekly |

## Executive KPIs

### EX-01 · Critical Systems Availability

- **Domain:** All systems
- **Definition:** Share of critical equipment (plant, air handling, life-safety fans, car-park fans, sumps, generators, UPS, transformers, lifts, escalators) not in fault or offline.
- **Formula:** `available ÷ total × 100, where available = status ∉ {fault, offline}`
- **Source points:** `*.Alm_Trip`, `*.Alm_Fault`, `*.Fault`, `*.Comm_OK`
- **Data tier:** Proven · BMS hardwired I/O
- **Target:** ≥ 98 % · **Frequency:** Live · monthly average reported
- **SOPs acting on it:** SOP-HV-01 Chiller fault / trip; SOP-HV-04 Pressurisation unit / water treatment fault; SOP-HV-07 CRAC high temperature (IT room)

### EX-02 · Cooling Plant Efficiency

- **Domain:** Chilled water plant (central plant, project-wide)
- **Definition:** Electrical input of the whole plant per ton of cooling delivered.
- **Formula:** `(Σ chiller kW + Σ CHW/CW pump kW + Σ tower fan kW) ÷ plant TR`
- **Source points:** `$Chiller.Power_kW`, `$CHW_Pump.Motor_kW`, `$CW_Pump.Speed_Fb`, `$CoolingTower.Speed_Fb`, `$BTU_Meter.Power_kW`
- **Data tier:** Proven · BMS integration
- **Target:** ≤ 0.75 kW/TR · **Frequency:** Live · daily average
- **SOPs acting on it:** SOP-HV-01 Chiller fault / trip; SOP-HV-10 Chiller plant daily start, staging & lead rotation; SOP-MT-02 Low ΔT on a tenant

### EX-03 · Cooling Energy Delivered Today

- **Domain:** Metering
- **Definition:** Thermal energy delivered to buildings since midnight, from the 655 billing meters.
- **Formula:** `Σ (register now − register 00:00) over energy valves and bulk BTU meters`
- **Source points:** `$EnergyValve.Energy_kWh`, `$BTU_Meter.Energy_MWh`
- **Data tier:** Proven · BMS integration
- **Target:** Trend vs last week · **Frequency:** Hourly
- **SOPs acting on it:** SOP-MT-01 Billing meter data gap

### EX-04 · Billing Data Completeness

- **Domain:** Metering
- **Definition:** Share of the 655 cooling billing meters (590 SP90 energy valves + 65 Kamstrup meters) delivering valid data.
- **Formula:** `meters with Comm_OK and Info_Code = 0 ÷ meters × 100`
- **Source points:** `$EnergyValve.Comm_OK`, `$BTU_Meter.Comm_OK`, `$BTU_Meter.Info_Code`
- **Data tier:** Proven · BMS integration
- **Target:** ≥ 99.5 % · **Frequency:** Live · month-end gate
- **SOPs acting on it:** SOP-BM-01 Device communication loss; SOP-MT-01 Billing meter data gap; SOP-MT-03 Monthly cooling billing close

### EX-05 · Thermal Comfort Compliance

- **Domain:** Fan coil units
- **Definition:** Occupied rooms held within ±1.5 K of their set point.
- **Formula:** `FCUs on with |Room_Temp − Setpoint| ≤ 1.5 K ÷ FCUs on × 100`
- **Source points:** `$FCU_TC903.Room_Temp`, `$FCU_TC903.Setpoint`, `$FCU_TC903.OnOff`
- **Data tier:** Proven · BMS integration
- **Target:** ≥ 95 % · **Frequency:** Live · weekly
- **SOPs acting on it:** SOP-BM-02 Alarm limit & schedule change control; SOP-HV-05 FAHU / AHU trip or supply air out of range; SOP-HV-08 Comfort complaint / room too warm

### EX-06 · Life-Safety Readiness

- **Domain:** Smoke control & fire
- **Definition:** Smoke extract and stair-pressurisation fans in Auto and healthy, and fire panels without faults.
- **Formula:** `(fans with Sts_Auto ∧ ¬Alm_Trip + panels ¬Fault) ÷ (fans + panels) × 100`
- **Source points:** `$SmokeFan.Sts_Auto`, `$SmokeFan.Alm_Trip`, `$StairPressFan.Sts_Auto`, `$FireAlarmPanel.Fault`
- **Data tier:** Proven · BMS hardwired I/O
- **Target:** 100 % · **Frequency:** Live
- **SOPs acting on it:** SOP-CP-02 Car-park fan trip; SOP-LS-01 Fire alarm activation; SOP-LS-02 Life-safety fan not available; SOP-LS-03 Duct smoke detector; SOP-LS-04 Fire alarm system fault / disablement; SOP-LS-06 Weekly life-safety fan test

### EX-07 · Electrical Demand

- **Domain:** Electrical
- **Definition:** Live demand at the main and emergency distribution boards (the incomers; MCC / EMCC are sub-boards and not added).
- **Formula:** `Σ MDB + EMDB incomer kW (digital power meters)`
- **Source points:** `$PowerMeter.kW`
- **Data tier:** In scope · AVEVA integration
- **Target:** Below contracted demand · **Frequency:** Live · 15-min demand
- **SOPs acting on it:** SOP-EL-01 Utility (mains) failure; SOP-EL-05 Board overload / power quality

### EX-08 · Standby Power Readiness

- **Domain:** Electrical
- **Definition:** Generators ready to take load: in Auto, no shutdown, day tank ≥ 40 %.
- **Formula:** `ready generators ÷ generators × 100`
- **Source points:** `$Genset.Sts_Auto`, `$Genset.Alm_Shutdown`, `$Genset.Fuel_Level`
- **Data tier:** In scope · AVEVA integration
- **Target:** 100 % · **Frequency:** Live
- **SOPs acting on it:** SOP-EL-01 Utility (mains) failure; SOP-EL-02 Generator not available; SOP-EL-03 Generator fuel low; SOP-EL-06 UPS on battery; SOP-EL-07 Monthly generator test

### EX-09 · Vertical Transport Availability

- **Domain:** Lifts & escalators
- **Definition:** Lifts and escalators in service (escalators outside opening hours count as available).
- **Formula:** `(lifts In_Service + escalators ¬Fault ∧ ¬E_Stop) ÷ units × 100`
- **Source points:** `$Elevator.In_Service`, `$Escalator.Fault`, `$Escalator.E_Stop`
- **Data tier:** In scope · AVEVA integration
- **Target:** ≥ 98 % · **Frequency:** Live · monthly
- **SOPs acting on it:** SOP-VT-01 Lift out of service; SOP-VT-02 Passenger entrapment; SOP-VT-03 Escalator stop / fault

### EX-10 · Open Critical Alarms

- **Domain:** All systems
- **Definition:** Critical (P1) alarms active right now.
- **Formula:** `count(alarms where severity = critical)`
- **Source points:** `AVEVA alarm database`
- **Data tier:** Calculated
- **Target:** 0 · **Frequency:** Live
- **SOPs acting on it:** SOP-GN-01 Alarm handling & acknowledgement

### EX-11 · Work-Order SLA Compliance

- **Domain:** CAFM (assumed)
- **Definition:** Corrective work orders closed within their priority SLA (rolling 30 days).
- **Formula:** `WOs closed within SLA ÷ WOs closed × 100`
- **Source points:** `CAFM work orders`
- **Data tier:** Assumed · system by others
- **Target:** ≥ 90 % · **Frequency:** Daily
- **SOPs acting on it:** SOP-FM-01 Corrective work-order lifecycle

### EX-12 · PPM Compliance

- **Domain:** CAFM (assumed)
- **Definition:** Planned maintenance completed in its window this month.
- **Formula:** `PPM done on time ÷ PPM due × 100`
- **Source points:** `CAFM PPM schedule`, `$*.Run_Hours`
- **Data tier:** Assumed · system by others
- **Target:** ≥ 95 % · **Frequency:** Weekly
- **SOPs acting on it:** SOP-HV-06 Dirty filter; SOP-EL-07 Monthly generator test; SOP-LS-06 Weekly life-safety fan test; SOP-FM-02 Planned preventive maintenance (run-hour based)

### EX-13 · Car-Park Air Quality

- **Domain:** Car park
- **Definition:** Car-park zones below 50 ppm CO (the boost threshold).
- **Formula:** `zones with Zone_CO < 50 ppm ÷ zones × 100`
- **Source points:** `$CarParkExhaustFan.Zone_CO`
- **Data tier:** Proven · BMS hardwired I/O
- **Target:** 100 % (≥ 99 % of hours) · **Frequency:** Live
- **SOPs acting on it:** SOP-CP-01 Car-park high CO

### EX-14 · Carbon Emissions Today

- **Domain:** Sustainability
- **Definition:** Scope-2 emissions of today’s electricity.
- **Formula:** `Σ MDB + EMDB kWh today × grid factor (0.46 kgCO₂e/kWh, Egypt grid — assumed)`
- **Source points:** `$PowerMeter.kWh`
- **Data tier:** In scope · AVEVA integration
- **Target:** −5 % year on year · **Frequency:** Daily
- **SOPs acting on it:** — (reporting KPI)

## Operations KPIs

### OP-01 · Active Alarms

- **Domain:** All systems
- **Definition:** All active alarms by severity, each linked to its SOP.
- **Formula:** `count by severity`
- **Source points:** `AVEVA alarm database`
- **Data tier:** Calculated
- **Target:** No P1 older than 15 min · **Frequency:** Live
- **SOPs acting on it:** SOP-GN-01 Alarm handling & acknowledgement

### OP-02 · Chiller Staging

- **Domain:** Chilled water plant (central plant, project-wide)
- **Definition:** Chillers running against what the load needs.
- **Formula:** `count(Sts_Run) vs staging demand`
- **Source points:** `$Chiller.Sts_Run`, `$Chiller.Load_Pct`
- **Data tier:** Proven · BMS hardwired I/O
- **Target:** Running = required · **Frequency:** Live
- **SOPs acting on it:** SOP-HV-01 Chiller fault / trip; SOP-HV-10 Chiller plant daily start, staging & lead rotation

### OP-03 · CHW Supply Temperature

- **Domain:** Chilled water plant (central plant, project-wide)
- **Definition:** Average leaving chilled-water temperature of running chillers.
- **Formula:** `mean(CHWS_Temp | Sts_Run)`
- **Source points:** `$Chiller.CHWS_Temp`, `$Chiller.CHW_Setpoint`
- **Data tier:** Proven · BMS hardwired I/O
- **Target:** Set point 6.7 °C ± 0.5 K · **Frequency:** Live
- **SOPs acting on it:** SOP-HV-01 Chiller fault / trip

### OP-04 · Plant ΔT

- **Domain:** Chilled water plant (central plant, project-wide)
- **Definition:** Return minus supply across running chillers; low ΔT wastes pumping and chiller capacity.
- **Formula:** `mean(CHWR_Temp − CHWS_Temp | Sts_Run)`
- **Source points:** `$Chiller.CHWR_Temp`, `$Chiller.CHWS_Temp`, `$EnergyValve.DeltaT`
- **Data tier:** Proven · BMS hardwired I/O
- **Target:** ≥ 4.5 K (design 5.5 K) · **Frequency:** Live
- **SOPs acting on it:** SOP-MT-02 Low ΔT on a tenant

### OP-05 · Cooling Tower Approach

- **Domain:** Heat rejection (central plant, project-wide)
- **Definition:** Leaving tower water minus outdoor wet bulb (SHO2 outdoor T/RH sensor).
- **Formula:** `mean(Approach_K | Sts_Run)`
- **Source points:** `$CoolingTower.CW_Out_Temp`, `Outdoor T/RH (SHO2)`
- **Data tier:** Calculated
- **Target:** ≤ 4 K · **Frequency:** Live
- **SOPs acting on it:** SOP-HV-03 Cooling tower trip / basin low level

### OP-06 · Supply Air Compliance

- **Domain:** Air handling
- **Definition:** Running FAHU / AHU within ±1.5 K of supply set point.
- **Formula:** `units in band ÷ running units × 100`
- **Source points:** `$FAHU.Supply_Temp`, `$FAHU.Supply_Setpoint`
- **Data tier:** Proven · BMS hardwired I/O
- **Target:** ≥ 95 % · **Frequency:** Live
- **SOPs acting on it:** SOP-HV-05 FAHU / AHU trip or supply air out of range

### OP-07 · Equipment in Hand

- **Domain:** All starters
- **Definition:** Motor starters out of Auto (BMS cannot control them).
- **Formula:** `count(Sts_Auto = False)`
- **Source points:** `*.Sts_Auto`
- **Data tier:** Proven · BMS hardwired I/O
- **Target:** 0 unplanned · **Frequency:** Live
- **SOPs acting on it:** SOP-GN-02 Hand/Off/Auto overrides

### OP-08 · Field Device Comms

- **Domain:** BMS network
- **Definition:** Networked field devices answering (thermostats, energy valves, meters).
- **Formula:** `Comm_OK ÷ devices × 100`
- **Source points:** `$FCU_TC903.Comm_OK`, `$EnergyValve.Comm_OK`, `$PowerMeter.Comm_OK`
- **Data tier:** Proven · BMS integration
- **Target:** ≥ 99 % · **Frequency:** Live
- **SOPs acting on it:** SOP-BM-01 Device communication loss

### OP-09 · Dirty Filters

- **Domain:** Air handling
- **Definition:** Air handling units with a pre- or bag-filter ΔP switch made.
- **Formula:** `count(PreFilter_DPS ∨ BagFilter_DPS)`
- **Source points:** `$FAHU.PreFilter_DPS`, `$FAHU.BagFilter_DPS`
- **Data tier:** Proven · BMS hardwired I/O
- **Target:** 0 older than 5 days · **Frequency:** Live
- **SOPs acting on it:** SOP-HV-06 Dirty filter

### OP-10 · Car-Park Fans in Boost

- **Domain:** Car park
- **Definition:** Exhaust fans at 100 % because zone CO > 50 ppm.
- **Formula:** `count(Zone_CO > 50)`
- **Source points:** `$CarParkExhaustFan.Zone_CO`, `$CarParkExhaustFan.Speed_Fb`
- **Data tier:** Proven · BMS hardwired I/O
- **Target:** Trend only · **Frequency:** Live
- **SOPs acting on it:** SOP-CP-01 Car-park high CO

### OP-11 · Sump High Levels

- **Domain:** Drainage
- **Definition:** Sump pits at high level now.
- **Formula:** `count(High_Level)`
- **Source points:** `$DuplexSumpPumps.High_Level`
- **Data tier:** Proven · BMS hardwired I/O
- **Target:** 0 · **Frequency:** Live
- **SOPs acting on it:** SOP-DR-01 Sump pit high level

### OP-12 · Peak Transformer Loading

- **Domain:** Electrical
- **Definition:** Most loaded transformer in scope.
- **Formula:** `max(Load_Pct)`
- **Source points:** `$Transformer.Load_Pct`, `$Transformer.Winding_Temp`
- **Data tier:** In scope · AVEVA integration
- **Target:** ≤ 80 % · **Frequency:** Live
- **SOPs acting on it:** SOP-EL-04 Transformer / RMU alarm

### OP-13 · Power Factor

- **Domain:** Electrical
- **Definition:** kW-weighted power factor of the MDB incomers.
- **Formula:** `Σ(kW·PF) ÷ Σ kW`
- **Source points:** `$PowerMeter.PF`, `$PowerMeter.kW`
- **Data tier:** In scope · AVEVA integration
- **Target:** ≥ 0.92 · **Frequency:** Live
- **SOPs acting on it:** SOP-EL-05 Board overload / power quality

### OP-14 · Lift Faults & Entrapments

- **Domain:** Lifts
- **Definition:** Lifts out of service; entrapments are P1.
- **Formula:** `count(Fault), count(Entrapment)`
- **Source points:** `$Elevator.Fault`, `$Elevator.Entrapment`
- **Data tier:** In scope · AVEVA integration
- **Target:** 0 entrapments · **Frequency:** Live
- **SOPs acting on it:** SOP-VT-02 Passenger entrapment

### OP-15 · Fire System Impairments

- **Domain:** Fire alarm (assumed)
- **Definition:** Fire panel faults and disabled devices.
- **Formula:** `count(Fault) + Σ Disabled_Pts`
- **Source points:** `$FireAlarmPanel.Fault`, `$FireAlarmPanel.Disabled_Pts`
- **Data tier:** Assumed · system by others
- **Target:** 0 without permit · **Frequency:** Live
- **SOPs acting on it:** SOP-LS-01 Fire alarm activation; SOP-LS-04 Fire alarm system fault / disablement

### OP-16 · PA Health

- **Domain:** Public address (assumed)
- **Definition:** PA racks without amplifier or line faults.
- **Formula:** `healthy racks ÷ racks × 100`
- **Source points:** `$PublicAddress.Amp_Fault`, `$PublicAddress.Line_Fault`
- **Data tier:** Assumed · system by others
- **Target:** 100 % · **Frequency:** Live
- **SOPs acting on it:** SOP-LS-05 Public address fault

### OP-17 · Security Events Today

- **Domain:** CCTV & access (assumed)
- **Definition:** Door-forced / held alarms and camera losses today.
- **Formula:** `count(events today)`
- **Source points:** `$AccessDoor.Forced`, `$AccessDoor.Held`, `$Camera.Online`
- **Data tier:** Assumed · system by others
- **Target:** Trend only · **Frequency:** Daily
- **SOPs acting on it:** SOP-SC-01 Door forced / held open; SOP-SC-02 Camera offline

## Maintenance KPIs

### MT-01 · Plant Run Hours vs Service

- **Domain:** Chilled water plant (central plant, project-wide)
- **Definition:** Chillers within 200 h of their 2,000 h service interval.
- **Formula:** `count((Run_Hours mod 2000) > 1800)`
- **Source points:** `$Chiller.Run_Hours`
- **Data tier:** Proven · BMS integration
- **Target:** Serviced before interval · **Frequency:** Daily
- **SOPs acting on it:** SOP-FM-02 Planned preventive maintenance (run-hour based)

### MT-02 · Trips Today

- **Domain:** Motors
- **Definition:** Motor trips active (pumps, fans, towers, air handlers).
- **Formula:** `count(Alm_Trip)`
- **Source points:** `*.Alm_Trip`
- **Data tier:** Proven · BMS hardwired I/O
- **Target:** Trend down · **Frequency:** Live · per 1,000 run h monthly
- **SOPs acting on it:** SOP-HV-02 CHW / CW pump trip; SOP-HV-09 Exhaust / make-up fan trip; SOP-CP-02 Car-park fan trip

### MT-03 · Mean Time To Repair

- **Domain:** CAFM (assumed)
- **Definition:** Average time from WO creation to close (30 days).
- **Formula:** `mean(closed − created)`
- **Source points:** `CAFM work orders`
- **Data tier:** Assumed · system by others
- **Target:** ≤ 8 h (P2) · **Frequency:** Weekly
- **SOPs acting on it:** SOP-FM-01 Corrective work-order lifecycle

### MT-04 · Open Work Orders

- **Domain:** CAFM (assumed)
- **Definition:** Corrective work orders open now.
- **Formula:** `count(status ≠ closed)`
- **Source points:** `CAFM work orders`
- **Data tier:** Assumed · system by others
- **Target:** Backlog ≤ 1 week · **Frequency:** Live
- **SOPs acting on it:** SOP-FM-01 Corrective work-order lifecycle

### MT-05 · Sump Pump Starts

- **Domain:** Drainage
- **Definition:** Average starts per sump set today; high counts point to infiltration or a stuck float.
- **Formula:** `mean(Starts_Today)`
- **Source points:** `$DuplexSumpPumps.P1_Run`, `$DuplexSumpPumps.P2_Run`
- **Data tier:** Calculated
- **Target:** ≤ 20 per day · **Frequency:** Daily
- **SOPs acting on it:** SOP-DR-02 Sump pump trip

### MT-06 · Duty Rotation Balance

- **Domain:** Pumps (central plant, project-wide)
- **Definition:** Spread of run hours across the 7 primary CHW pumps (lead rotation working?).
- **Formula:** `(max − min) ÷ mean × 100 of Run_Hours`
- **Source points:** `$CHW_Pump.Run_Hours`
- **Data tier:** Proven · BMS integration
- **Target:** ≤ 10 % · **Frequency:** Weekly
- **SOPs acting on it:** SOP-HV-02 CHW / CW pump trip; SOP-HV-10 Chiller plant daily start, staging & lead rotation
