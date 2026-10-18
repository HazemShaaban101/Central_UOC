# Central — SOP Library

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

Alarm-driven SOPs are meant to run as AVEVA Work Task workflows (AVEVA BoQ): the alarm opens the task, each step is acknowledged by its role, and the close-out check reads the points back before the task can be closed.

## Summary (41 SOPs)

| ID | Procedure | System | Category | Priority | Data tier |
|---|---|---|---|---|---|
| SOP-GN-01 | Alarm handling & acknowledgement | All systems | Administrative | P2 | Calculated |
| SOP-GN-02 | Hand/Off/Auto overrides | All motor starters | Alarm response | P3 | Proven · BMS hardwired I/O |
| SOP-BM-01 | Device communication loss | BMS network / gateways | Alarm response | P3 | Proven · BMS integration |
| SOP-BM-02 | Alarm limit & schedule change control | BMS | Administrative | P4 | Calculated |
| SOP-HV-01 | Chiller fault / trip | Chilled water plant | Alarm response | P1 | Proven · BMS hardwired I/O |
| SOP-HV-02 | CHW / CW pump trip | Chilled & condenser water | Alarm response | P2 | Proven · BMS hardwired I/O |
| SOP-HV-03 | Cooling tower trip / basin low level | Heat rejection (B03 roof) | Alarm response | P2 | Proven · BMS hardwired I/O |
| SOP-HV-04 | Pressurisation unit / water treatment fault | Chilled water plant | Alarm response | P3 | Proven · BMS hardwired I/O |
| SOP-HV-05 | FAHU / AHU trip or supply air out of range | Air side | Alarm response | P2 | Proven · BMS hardwired I/O |
| SOP-HV-06 | Dirty filter | Air side | Alarm response | P4 | Proven · BMS hardwired I/O |
| SOP-HV-07 | CRAC high temperature (IT room) | Computer room A/C | Alarm response | P1 | Proven · BMS integration |
| SOP-HV-08 | Comfort complaint / room too warm | Fan coil units | Alarm response | P3 | Proven · BMS integration |
| SOP-HV-09 | Exhaust / make-up fan trip | Ventilation | Alarm response | P3 | Proven · BMS hardwired I/O |
| SOP-HV-10 | Chiller plant daily start, staging & lead rotation | Chilled water plant | Routine | P4 | Proven · BMS hardwired I/O |
| SOP-CP-01 | Car-park high CO | Car-park ventilation (B1/B2) | Emergency | P1 | Proven · BMS hardwired I/O |
| SOP-CP-02 | Car-park fan trip | Car-park ventilation (B1/B2) | Alarm response | P2 | Proven · BMS hardwired I/O |
| SOP-DR-01 | Sump pit high level | Drainage (B2) | Emergency | P1 | Proven · BMS hardwired I/O |
| SOP-DR-02 | Sump pump trip | Drainage (B2) | Alarm response | P2 | Proven · BMS hardwired I/O |
| SOP-MT-01 | Billing meter data gap | Cooling metering & billing | Alarm response | P2 | Proven · BMS integration |
| SOP-MT-02 | Low ΔT on a tenant | Cooling metering | Alarm response | P4 | Proven · BMS integration |
| SOP-MT-03 | Monthly cooling billing close | Cooling billing (by others) | Administrative | P4 | Assumed · system by others |
| SOP-EL-01 | Utility (mains) failure | Electrical | Emergency | P1 | In scope · AVEVA integration |
| SOP-EL-02 | Generator not available | Standby power | Alarm response | P2 | In scope · AVEVA integration |
| SOP-EL-03 | Generator fuel low | Standby power | Alarm response | P3 | In scope · AVEVA integration |
| SOP-EL-04 | Transformer / RMU alarm | MV / LV distribution | Alarm response | P2 | In scope · AVEVA integration |
| SOP-EL-05 | Board overload / power quality | LV distribution | Alarm response | P3 | In scope · AVEVA integration |
| SOP-EL-06 | UPS on battery | UPS | Emergency | P1 | In scope · AVEVA integration |
| SOP-EL-07 | Monthly generator test | Standby power | Routine | P4 | In scope · AVEVA integration |
| SOP-VT-01 | Lift out of service | Elevators | Alarm response | P2 | In scope · AVEVA integration |
| SOP-VT-02 | Passenger entrapment | Elevators | Emergency | P1 | Assumed · system by others |
| SOP-VT-03 | Escalator stop / fault | Escalators | Alarm response | P2 | In scope · AVEVA integration |
| SOP-LS-01 | Fire alarm activation | Fire alarm (by others) | Emergency | P1 | Assumed · system by others |
| SOP-LS-02 | Life-safety fan not available | Smoke control | Alarm response | P1 | Proven · BMS hardwired I/O |
| SOP-LS-03 | Duct smoke detector | Air side / fire | Emergency | P1 | Proven · BMS hardwired I/O |
| SOP-LS-04 | Fire alarm system fault / disablement | Fire alarm (by others) | Alarm response | P2 | Assumed · system by others |
| SOP-LS-05 | Public address fault | Public address (by others) | Alarm response | P2 | Assumed · system by others |
| SOP-LS-06 | Weekly life-safety fan test | Smoke control | Routine | P4 | Proven · BMS hardwired I/O |
| SOP-SC-01 | Door forced / held open | Access control (by others) | Alarm response | P2 | Assumed · system by others |
| SOP-SC-02 | Camera offline | CCTV (by others) | Alarm response | P3 | Assumed · system by others |
| SOP-FM-01 | Corrective work-order lifecycle | CAFM (by others) | Administrative | P3 | Assumed · system by others |
| SOP-FM-02 | Planned preventive maintenance (run-hour based) | CAFM (by others) | Routine | P4 | Calculated |

## SOP-GN-01 · Alarm handling & acknowledgement

| | |
|---|---|
| System | All systems |
| Category | Administrative |
| Priority / response | P2 · Acknowledge P1 ≤ 1 min, P2 ≤ 5 min, P3 ≤ 15 min |
| Data tier | Calculated |
| Roles | BMS Operator, Shift Supervisor |

**Trigger.** Any alarm raised in AVEVA Operations Control (BMS, electrical, transport, third-party).

**Trigger points.** `*.Alm_*`, `*.Comm_OK`, `*.Fault`

**Steps**

1. Acknowledge the alarm in AVEVA; the linked SOP opens as an AVEVA Work Task.
2. Read the asset’s live points and recent trend to confirm it is real (not a sensor or comms fault).
3. Classify: real fault → follow the linked SOP; nuisance → log reason and raise SOP-BM-02 to tune the limit.
4. Dispatch the owning role; record who and when in the task.
5. Keep the alarm shelved only with a reason and an expiry (max. one shift).

**Close-out check (read from points).** Alarm returns to normal in AVEVA and the Work Task carries every step’s acknowledgement.

**Escalation.** Unacknowledged P1 after 1 min → Shift Supervisor; after 5 min → Facility Manager.

**KPIs protected.** EX-10 Open Critical Alarms; OP-01 Active Alarms

## SOP-GN-02 · Hand/Off/Auto overrides

| | |
|---|---|
| System | All motor starters |
| Category | Alarm response |
| Priority / response | P3 · ≤ 30 min |
| Data tier | Proven · BMS hardwired I/O |
| Roles | BMS Operator, HVAC Technician |

**Trigger.** A starter’s Hand/Auto selector is out of Auto (Sts_Auto = False).

**Trigger points.** `$FAHU.Sts_Auto`, `$CHW_Pump.Sts_Auto`, `$CoolingTower.Sts_Auto`, `$Fan.Sts_Auto`, `$CarParkExhaustFan.Sts_Auto`

**Steps**

1. Check the permit / maintenance log: is the override planned?
2. If unplanned, send a technician to the MCC to find out why it was switched to Hand.
3. Return the selector to Auto once safe; confirm the BMS takes control (Cmd_Start ↔ Sts_Run follow).
4. If it must stay in Hand, log the reason and expiry in the Work Task.

**Close-out check (read from points).** Sts_Auto = True and Sts_Run follows Cmd_Start for 15 min.

**Escalation.** Life-safety fan in Hand → treat as SOP-LS-02 (P1).

**KPIs protected.** OP-07 Equipment in Hand

## SOP-BM-01 · Device communication loss

| | |
|---|---|
| System | BMS network / gateways |
| Category | Alarm response |
| Priority / response | P3 · ≤ 4 h |
| Data tier | Proven · BMS integration |
| Roles | BMS Operator, HVAC Technician |

**Trigger.** A Modbus / BACnet device stops answering (Comm_OK = False): FCU thermostats, energy valves, BTU and power meters.

**Trigger points.** `$FCU_TC903.Comm_OK`, `$EnergyValve.Comm_OK`, `$BTU_Meter.Comm_OK`, `$PowerMeter.Comm_OK`

**Steps**

1. Check whether a whole segment is down (same PAS600 gateway / LCP): if yes, check gateway power and the IP link first.
2. Single device: check its address and RS-485 wiring at the device; power-cycle the device.
3. For billing meters, note the gap start time so SOP-MT-01 can back-fill from the meter register.
4. Replace the device if it does not recover; update the asset in CAFM.

**Close-out check (read from points).** Comm_OK = True and values update for 30 min.

**Escalation.** More than 5 % of a building’s devices offline → P2, Shift Supervisor.

**KPIs protected.** OP-08 Field Device Comms; EX-04 Billing Data Completeness

## SOP-BM-02 · Alarm limit & schedule change control

| | |
|---|---|
| System | BMS |
| Category | Administrative |
| Priority / response | P4 · Next working day |
| Data tier | Calculated |
| Roles | Shift Supervisor, Facility Manager |

**Trigger.** Request to change a set point, alarm limit or time schedule.

**Trigger points.** `$FAHU.Supply_Setpoint`, `$FCU_TC903.Setpoint`

**Steps**

1. Raise the change in CAFM with the reason and the expected effect.
2. Facility Manager approves.
3. BMS engineer applies the change in EcoStruxure; AVEVA logs it.
4. Review effect on comfort and energy KPIs after one week.

**Close-out check (read from points).** New value active in the BMS and recorded in the AVEVA audit trail.

**Escalation.** Changes to life-safety logic need the fire consultant’s approval.

**KPIs protected.** EX-05 Thermal Comfort Compliance

## SOP-HV-01 · Chiller fault / trip

| | |
|---|---|
| System | Chilled water plant |
| Category | Alarm response |
| Priority / response | P1 · ≤ 15 min on site |
| Data tier | Proven · BMS hardwired I/O |
| Roles | BMS Operator, HVAC Technician, Shift Supervisor |

**Trigger.** A chiller reports a fault, or loses evaporator / condenser flow while commanded on.

**Trigger points.** `$Chiller.Alm_Fault`, `$Chiller.CHW_Flow_Sw`, `$Chiller.CW_Flow_Sw`, `$Chiller.Sts_Run`

**Steps**

1. Confirm the BMS staged the next chiller (lead/lag) and its butterfly valves opened (Sts_CHW_Valve / Sts_CW_Valve).
2. Check common CHW supply temperature: if above 8 °C for 10 min, reduce non-critical load (FAHU valves) per supervisor.
3. Read the chiller’s BACnet alarm text; check flow switches and the matching CHW / CW pumps.
4. Do not reset more than once; a repeat trip needs the chiller vendor.
5. Raise a corrective work order with the fault code.

**Close-out check (read from points).** Plant holds CHWS ≤ set point + 1 K; faulted chiller either healthy (Alm_Fault = False) or isolated with valves closed.

**Escalation.** Two chillers unavailable at peak → Facility Manager and chiller vendor (4 h response).

**KPIs protected.** EX-02 Cooling Plant Efficiency; OP-02 Chiller Staging; OP-03 CHW Supply Temperature; EX-01 Critical Systems Availability

## SOP-HV-02 · CHW / CW pump trip

| | |
|---|---|
| System | Chilled & condenser water |
| Category | Alarm response |
| Priority / response | P2 · ≤ 30 min |
| Data tier | Proven · BMS hardwired I/O |
| Roles | BMS Operator, HVAC Technician |

**Trigger.** Pump trip, or no flow proven (Flow_DPS = False) while running.

**Trigger points.** `$CHW_Pump.Alm_Trip`, `$CHW_Pump.Flow_DPS`, `$CHW_Pump.Fault_Code`, `$CW_Pump.Alm_Trip`

**Steps**

1. Confirm the standby pump started (7th pump) and flow is proven.
2. Read the VSD fault code (PCHWP, Modbus) and the motor current before the trip.
3. Inspect the pump: strainer, seals, coupling, motor temperature.
4. Reset once; if it trips again, isolate and raise a work order.

**Close-out check (read from points).** Duty pump count matches running chillers; Flow_DPS = True on all running pumps.

**Escalation.** No standby available → P1, Shift Supervisor.

**KPIs protected.** MT-02 Trips Today; MT-06 Duty Rotation Balance

## SOP-HV-03 · Cooling tower trip / basin low level

| | |
|---|---|
| System | Heat rejection (B03 roof) |
| Category | Alarm response |
| Priority / response | P2 · ≤ 30 min |
| Data tier | Proven · BMS hardwired I/O |
| Roles | HVAC Technician, Plumbing Technician |

**Trigger.** Tower fan trip, or basin low-level switch.

**Trigger points.** `$CoolingTower.Alm_Trip`, `$CoolingTower.Basin_Level_Sw`, `$CoolingTower.CW_Out_Temp`

**Steps**

1. Check make-up water supply and the float valve.
2. Check the fan VSD and motor.
3. Watch condenser water temperature: above 35 °C leaving, add a cell.
4. Raise work order.

**Close-out check (read from points).** Basin level normal, CW_Out_Temp within 4 K approach to wet bulb.

**Escalation.** Two cells out at peak → P1.

**KPIs protected.** OP-05 Cooling Tower Approach

## SOP-HV-04 · Pressurisation unit / water treatment fault

| | |
|---|---|
| System | Chilled water plant |
| Category | Alarm response |
| Priority / response | P3 · ≤ 2 h |
| Data tier | Proven · BMS hardwired I/O |
| Roles | HVAC Technician |

**Trigger.** Expansion tank & pressurisation unit or water treatment station general fault.

**Trigger points.** `$PlantPackage.Alm_Fault`, `$Chiller.CHW_Press`

**Steps**

1. Check system static pressure on the chiller pressure transmitters.
2. Inspect the package panel for its own fault text.
3. Top up / restart per vendor manual.
4. Log chemical dosing if WTS.

**Close-out check (read from points).** Alm_Fault = False; CHW pressure stable.

**Escalation.** Pressure falling → P1 (risk to pumps).

**KPIs protected.** EX-01 Critical Systems Availability

## SOP-HV-05 · FAHU / AHU trip or supply air out of range

| | |
|---|---|
| System | Air side |
| Category | Alarm response |
| Priority / response | P2 · ≤ 1 h |
| Data tier | Proven · BMS hardwired I/O |
| Roles | BMS Operator, HVAC Technician |

**Trigger.** Supply fan trip, no airflow proven while running, or supply air > set point + 2.5 K.

**Trigger points.** `$FAHU.Alm_Trip`, `$FAHU.Airflow_DPS`, `$FAHU.Supply_Temp`, `$FAHU.Valve_Fb`

**Steps**

1. Fan trip: check the MCC overload and belt / motor; reset once.
2. High supply air: check valve feedback follows command (PIBCV); if valve is 100 % open, check CHW supply temperature at the plant.
3. Check the fresh-air damper end switch opened.
4. Raise work order with the trend.

**Close-out check (read from points).** Sts_Run = True, Airflow_DPS = True, Supply_Temp within ±1.5 K of set point for 30 min.

**Escalation.** Unit serving a whole building out > 4 h → Facility Manager.

**KPIs protected.** OP-06 Supply Air Compliance; EX-05 Thermal Comfort Compliance

## SOP-HV-06 · Dirty filter

| | |
|---|---|
| System | Air side |
| Category | Alarm response |
| Priority / response | P4 · Within 5 days (planned) |
| Data tier | Proven · BMS hardwired I/O |
| Roles | CAFM Coordinator, HVAC Technician |

**Trigger.** Pre-filter or bag-filter ΔP switch made.

**Trigger points.** `$FAHU.PreFilter_DPS`, `$FAHU.BagFilter_DPS`, `$AHU.PreFilter_DPS`, `$AHU.BagFilter_DPS`

**Steps**

1. Auto-raise a planned work order in CAFM.
2. Replace the filter at the next stop window.
3. Record filter type and date.

**Close-out check (read from points).** ΔP switch returns to normal after replacement.

**Escalation.** Not replaced within 10 days → Facility Manager.

**KPIs protected.** OP-09 Dirty Filters; EX-12 PPM Compliance

## SOP-HV-07 · CRAC high temperature (IT room)

| | |
|---|---|
| System | Computer room A/C |
| Category | Alarm response |
| Priority / response | P1 · ≤ 15 min |
| Data tier | Proven · BMS integration |
| Roles | BMS Operator, HVAC Technician |

**Trigger.** CRAC common alarm or return air above 27 °C.

**Trigger points.** `$CRAC.Alm_Common`, `$CRAC.Return_Temp`

**Steps**

1. Confirm the second CRAC is running.
2. Inform the IT room owner.
3. Check the unit alarm text over BACnet and the CHW supply.
4. Deploy temporary cooling if the room exceeds 30 °C.

**Close-out check (read from points).** Return_Temp ≤ 25 °C and Alm_Common = False.

**Escalation.** Room > 30 °C → Facility Manager and IT.

**KPIs protected.** EX-01 Critical Systems Availability

## SOP-HV-08 · Comfort complaint / room too warm

| | |
|---|---|
| System | Fan coil units |
| Category | Alarm response |
| Priority / response | P3 · ≤ 2 h |
| Data tier | Proven · BMS integration |
| Roles | BMS Operator, HVAC Technician |

**Trigger.** Thermostat temperature alarm, or room ≥ set point + 3 K for 30 min while on.

**Trigger points.** `$FCU_TC903.Alm_Temp`, `$FCU_TC903.Room_Temp`, `$FCU_TC903.Setpoint`, `$FCU_TC903.Valve_Out`, `$EnergyValve.Flow_m3h`

**Steps**

1. Check fan speed and mode on the thermostat (not in Fan or Economy).
2. Check valve output is high; if so check the tenant energy valve shows flow.
3. No flow → PIBCV / actuator fault; flow but warm → coil / filter / airflow.
4. Inform the tenant of the expected fix time.

**Close-out check (read from points).** Room_Temp within ±1.5 K of set point for 30 min.

**Escalation.** Repeat complaint within 7 days → Facility Manager review.

**KPIs protected.** EX-05 Thermal Comfort Compliance

## SOP-HV-09 · Exhaust / make-up fan trip

| | |
|---|---|
| System | Ventilation |
| Category | Alarm response |
| Priority / response | P3 · ≤ 1 h (kitchen MAF: 30 min) |
| Data tier | Proven · BMS hardwired I/O |
| Roles | HVAC Technician |

**Trigger.** Fan trip or airflow not proven.

**Trigger points.** `$Fan.Alm_Trip`, `$Fan.Airflow_DPS`

**Steps**

1. Kitchen make-up fan (B07): tell the F&B tenant; kitchen hood exhaust balance is affected.
2. Check overload / belt / motor.
3. Reset once; raise work order.

**Close-out check (read from points).** Sts_Run = True and Airflow_DPS = True.

**Escalation.** Kitchen MAF out > 2 h → Facility Manager.

**KPIs protected.** MT-02 Trips Today

## SOP-HV-10 · Chiller plant daily start, staging & lead rotation

| | |
|---|---|
| System | Chilled water plant |
| Category | Routine |
| Priority / response | P4 · Daily 05:30 |
| Data tier | Proven · BMS hardwired I/O |
| Roles | BMS Operator |

**Trigger.** Daily schedule; chiller staging on plant load.

**Trigger points.** `$Chiller.Cmd_Start`, `$Chiller.Load_Pct`, `$Chiller.CHWS_Temp`, `$CHW_Pump.Speed_Fb`, `$CoolingTower.Speed_Fb`

**Steps**

1. Before opening hours, confirm the lead chiller, its pumps and tower cell started in sequence (valves → pumps → tower → chiller).
2. Stage up when running chillers exceed 90 % load for 15 min; stage down below 40 %.
3. Rotate lead chiller and duty pumps daily to balance run hours.
4. Review plant kW/TR at the end of the day.

**Close-out check (read from points).** CHWS within ±0.5 K of set point; run-hour spread across chillers < 10 %.

**Escalation.** kW/TR above 0.85 for a day → Energy Analyst review.

**KPIs protected.** EX-02 Cooling Plant Efficiency; OP-02 Chiller Staging; MT-06 Duty Rotation Balance

## SOP-CP-01 · Car-park high CO

| | |
|---|---|
| System | Car-park ventilation (B1/B2) |
| Category | Emergency |
| Priority / response | P1 · Immediate (automatic) · security on site ≤ 10 min |
| Data tier | Proven · BMS hardwired I/O |
| Roles | BMS Operator, Security Control, Shift Supervisor |

**Trigger.** Zone CO above 50 ppm (boost) or above 100 ppm (evacuate zone).

**Trigger points.** `$CarParkExhaustFan.Zone_CO`, `$CarParkExhaustFan.Speed_Fb`, `$CarParkSupplyFan.Speed_Fb`

**Steps**

1. Above 50 ppm: confirm exhaust and supply fans in the zone ramped to 100 %.
2. Above 100 ppm: Security closes the zone ramp; PA announcement for the car-park level (if PA zoning allows).
3. CCTV check for idling vehicles / queues at exits.
4. Check sensors read consistently (one sensor high → suspect sensor, raise work order).

**Close-out check (read from points).** Zone_CO < 35 ppm for 15 min; fans return to CO-controlled speed.

**Escalation.** > 200 ppm or fans unavailable → Civil Defence per site emergency plan.

**KPIs protected.** EX-13 Car-Park Air Quality; OP-10 Car-Park Fans in Boost

## SOP-CP-02 · Car-park fan trip

| | |
|---|---|
| System | Car-park ventilation (B1/B2) |
| Category | Alarm response |
| Priority / response | P2 · ≤ 1 h |
| Data tier | Proven · BMS hardwired I/O |
| Roles | HVAC Technician |

**Trigger.** Car-park exhaust or supply fan trip.

**Trigger points.** `$CarParkExhaustFan.Alm_Trip`, `$CarParkSupplyFan.Alm_Trip`

**Steps**

1. Check neighbouring fans in the zone took up speed.
2. Inspect VSD (Modbus fault) and motor.
3. Note: car-park fans also serve smoke clearance — tell the Fire Warden if more than one fan in a zone is out.

**Close-out check (read from points).** Sts_Run = True and Airflow_DPS = True.

**Escalation.** Two fans in one zone out → P1 (smoke clearance compromised).

**KPIs protected.** EX-06 Life-Safety Readiness; MT-02 Trips Today

## SOP-DR-01 · Sump pit high level

| | |
|---|---|
| System | Drainage (B2) |
| Category | Emergency |
| Priority / response | P1 · ≤ 15 min on site |
| Data tier | Proven · BMS hardwired I/O |
| Roles | BMS Operator, Plumbing Technician, Shift Supervisor |

**Trigger.** High-level float switch made in a sump pit.

**Trigger points.** `$DuplexSumpPumps.High_Level`, `$DuplexSumpPumps.P1_Run`, `$DuplexSumpPumps.P2_Run`, `$DuplexSumpPumps.P1_Trip`

**Steps**

1. Check both pumps are running (assist mode).
2. If a pump is tripped, reset at the panel; check for blockage.
3. Deploy portable pump if level keeps rising; protect electrical rooms on B2.
4. Look for the source (pipe burst, rain, chiller plant drain).

**Close-out check (read from points).** High_Level = False and pumps cycle normally for 1 h.

**Escalation.** Water reaching LV rooms → Electrical Technician isolates, Facility Manager.

**KPIs protected.** OP-11 Sump High Levels

## SOP-DR-02 · Sump pump trip

| | |
|---|---|
| System | Drainage (B2) |
| Category | Alarm response |
| Priority / response | P2 · ≤ 2 h |
| Data tier | Proven · BMS hardwired I/O |
| Roles | Plumbing Technician |

**Trigger.** One pump of a duplex set tripped.

**Trigger points.** `$DuplexSumpPumps.P1_Trip`, `$DuplexSumpPumps.P2_Trip`

**Steps**

1. Confirm the second pump covers duty.
2. Lift and clean the pump; check impeller and float.
3. Raise work order.

**Close-out check (read from points).** Both pumps available (no trip).

**Escalation.** Both pumps tripped → SOP-DR-01.

**KPIs protected.** MT-05 Sump Pump Starts

## SOP-MT-01 · Billing meter data gap

| | |
|---|---|
| System | Cooling metering & billing |
| Category | Alarm response |
| Priority / response | P2 · ≤ 1 working day |
| Data tier | Proven · BMS integration |
| Roles | Energy Analyst, BMS Operator |

**Trigger.** Energy valve or bulk BTU meter offline, or meter info code ≠ 0.

**Trigger points.** `$EnergyValve.Comm_OK`, `$BTU_Meter.Comm_OK`, `$BTU_Meter.Info_Code`, `$BTU_Meter.Energy_MWh`

**Steps**

1. Restore communication (SOP-BM-01).
2. Back-fill the gap from the meter’s own totaliser register (Energy_kWh / Energy_MWh) — no estimate needed if the register advanced.
3. If the register did not advance (meter fault), estimate from the same tenant’s previous 4 weeks and flag the bill line.
4. Info code: read the meter diagnostics with the optical head (KAOPTC).

**Close-out check (read from points).** No gap in the billing period export; meter Comm_OK = True.

**Escalation.** Gap at month-end close → Facility Manager before invoices are issued.

**KPIs protected.** EX-04 Billing Data Completeness; EX-03 Cooling Energy Delivered Today

## SOP-MT-02 · Low ΔT on a tenant

| | |
|---|---|
| System | Cooling metering |
| Category | Alarm response |
| Priority / response | P4 · Weekly review |
| Data tier | Proven · BMS integration |
| Roles | Energy Analyst, HVAC Technician |

**Trigger.** Tenant energy valve ΔT below 3.6 K over a week.

**Trigger points.** `$EnergyValve.DeltaT`, `$EnergyValve.Flow_m3h`, `$EnergyValve.Valve_Pos`

**Steps**

1. List the worst tenants by ΔT.
2. Check their FCU valves and coil condition.
3. Low ΔT raises pumping and chiller energy: agree corrective action with the tenant.

**Close-out check (read from points).** Weekly ΔT ≥ 4 K.

**Escalation.** Persistent → commercial review (lease clause).

**KPIs protected.** OP-04 Plant ΔT; EX-02 Cooling Plant Efficiency

## SOP-MT-03 · Monthly cooling billing close

| | |
|---|---|
| System | Cooling billing (by others) |
| Category | Administrative |
| Priority / response | P4 · Month end + 3 days |
| Data tier | Assumed · system by others |
| Roles | Energy Analyst, Facility Manager |

**Trigger.** Calendar: last day of the month 23:59.

**Trigger points.** `$EnergyValve.Energy_kWh`, `$BTU_Meter.Energy_MWh`

**Steps**

1. AVEVA freezes month-end register readings for all 655 meters.
2. Validate completeness and outliers (> 2× previous month).
3. Export to the cooling billing system.
4. Approve and issue.

**Close-out check (read from points).** 100 % of meters with a valid month-end reading.

**Escalation.** Disputed bills → Facility Manager.

**KPIs protected.** EX-04 Billing Data Completeness

## SOP-EL-01 · Utility (mains) failure

| | |
|---|---|
| System | Electrical |
| Category | Emergency |
| Priority / response | P1 · Immediate |
| Data tier | In scope · AVEVA integration |
| Roles | BMS Operator, Electrical Technician, Shift Supervisor, Lift Contractor |

**Trigger.** ATS transfers to generator; MV ring de-energised.

**Trigger points.** `$ATS.Position`, `$ATS.Mains_OK`, `$Genset.GCB_Closed`, `$UPS.On_Battery`

**Steps**

1. Confirm generators started and closed on load (≤ 10 s) in each building.
2. Confirm UPS units transferred back from battery.
3. Check lifts for trapped passengers (SOP-VT-02); escalators stop by design.
4. Shed non-essential load if any generator exceeds 90 %.
5. Inform the utility; log the event start.
6. On restoration, verify ATS back on mains and generators cool down.

**Close-out check (read from points).** All ATS on mains, generators back in Auto standby, UPS online.

**Escalation.** Any generator failing to start → SOP-EL-02 as P1.

**KPIs protected.** EX-08 Standby Power Readiness; EX-07 Electrical Demand

## SOP-EL-02 · Generator not available

| | |
|---|---|
| System | Standby power |
| Category | Alarm response |
| Priority / response | P2 · ≤ 1 h |
| Data tier | In scope · AVEVA integration |
| Roles | Electrical Technician |

**Trigger.** Generator not in Auto, or shutdown alarm.

**Trigger points.** `$Genset.Sts_Auto`, `$Genset.Alm_Shutdown`, `$Genset.Battery_V`

**Steps**

1. Find why it is out of Auto (maintenance permit?).
2. Check battery voltage and charger.
3. Return to Auto; run an off-load test if it was repaired.

**Close-out check (read from points).** Sts_Auto = True, no shutdown alarm.

**Escalation.** More than one generator unavailable in a building → P1.

**KPIs protected.** EX-08 Standby Power Readiness

## SOP-EL-03 · Generator fuel low

| | |
|---|---|
| System | Standby power |
| Category | Alarm response |
| Priority / response | P3 · Order fuel same day |
| Data tier | In scope · AVEVA integration |
| Roles | Electrical Technician, Facility Manager |

**Trigger.** Day-tank level below 40 %.

**Trigger points.** `$Genset.Fuel_Level`

**Steps**

1. Check bulk tank and transfer pump.
2. Order diesel delivery.
3. Log consumption.

**Close-out check (read from points).** Fuel_Level ≥ 80 %.

**Escalation.** Below 25 % → P1.

**KPIs protected.** EX-08 Standby Power Readiness

## SOP-EL-04 · Transformer / RMU alarm

| | |
|---|---|
| System | MV / LV distribution |
| Category | Alarm response |
| Priority / response | P2 · ≤ 1 h |
| Data tier | In scope · AVEVA integration |
| Roles | Electrical Technician, Shift Supervisor |

**Trigger.** Transformer winding temperature alarm, RMU SF6 low or earth fault.

**Trigger points.** `$Transformer.Winding_Temp`, `$Transformer.Alm_Temp`, `$RMU.SF6_Low`, `$RMU.Earth_Fault`

**Steps**

1. Check the transformer loading (DPM on its MDB).
2. Check room ventilation and cooling fans.
3. SF6 low / earth fault: do not operate the switch; call the MV contractor.
4. Shift load to the other transformer if available.

**Close-out check (read from points).** Winding_Temp below alarm stage; RMU healthy.

**Escalation.** Temperature trip stage or earth fault → P1, utility notified.

**KPIs protected.** OP-12 Peak Transformer Loading

## SOP-EL-05 · Board overload / power quality

| | |
|---|---|
| System | LV distribution |
| Category | Alarm response |
| Priority / response | P3 · ≤ 4 h |
| Data tier | In scope · AVEVA integration |
| Roles | Electrical Technician, Energy Analyst |

**Trigger.** Incomer above 90 % of rating, or current THD above 9.5 %.

**Trigger points.** `$PowerMeter.Load_Pct`, `$PowerMeter.THD_I`, `$PowerMeter.PF`

**Steps**

1. Identify the outgoing feeders driving the load.
2. Defer non-essential loads.
3. THD: check VSD-heavy boards (MCC) and harmonic filters.

**Close-out check (read from points).** Load_Pct < 85 %.

**Escalation.** Repeated > 90 % → capacity study.

**KPIs protected.** EX-07 Electrical Demand; OP-13 Power Factor

## SOP-EL-06 · UPS on battery

| | |
|---|---|
| System | UPS |
| Category | Emergency |
| Priority / response | P1 · Immediate |
| Data tier | In scope · AVEVA integration |
| Roles | BMS Operator, Electrical Technician |

**Trigger.** UPS transfers to battery.

**Trigger points.** `$UPS.On_Battery`, `$UPS.Autonomy_Min`, `$UPS.Battery_Pct`

**Steps**

1. Check whether the input failed (mains / ATS / breaker).
2. Watch autonomy; warn system owners if below 10 min.
3. Restore input supply.

**Close-out check (read from points).** On_Battery = False, battery recharging.

**Escalation.** Autonomy < 10 min → orderly shutdown of IT loads.

**KPIs protected.** EX-08 Standby Power Readiness

## SOP-EL-07 · Monthly generator test

| | |
|---|---|
| System | Standby power |
| Category | Routine |
| Priority / response | P4 · Monthly |
| Data tier | In scope · AVEVA integration |
| Roles | Electrical Technician, CAFM Coordinator |

**Trigger.** PPM calendar.

**Trigger points.** `$Genset.Sts_Running`, `$Genset.Frequency`, `$Genset.Voltage_LL`, `$Genset.Coolant_Temp`

**Steps**

1. Run each generator 30 min off-load (on-load quarterly via ATS test).
2. Record voltage, frequency, coolant and oil readings from AVEVA.
3. Close the PPM in CAFM with the readings attached.

**Close-out check (read from points).** Readings within limits; set returned to Auto.

**Escalation.** Failed test → SOP-EL-02.

**KPIs protected.** EX-12 PPM Compliance; EX-08 Standby Power Readiness

## SOP-VT-01 · Lift out of service

| | |
|---|---|
| System | Elevators |
| Category | Alarm response |
| Priority / response | P2 · Contractor ≤ 1 h |
| Data tier | In scope · AVEVA integration |
| Roles | BMS Operator, Lift Contractor |

**Trigger.** Lift fault (In_Service = False).

**Trigger points.** `$Elevator.Fault`, `$Elevator.In_Service`

**Steps**

1. Confirm no passenger inside (CCTV / intercom).
2. Call the lift contractor; log call time.
3. Place signage at the landing.

**Close-out check (read from points).** In_Service = True.

**Escalation.** Last lift in a core out → P1.

**KPIs protected.** EX-09 Vertical Transport Availability

## SOP-VT-02 · Passenger entrapment

| | |
|---|---|
| System | Elevators |
| Category | Emergency |
| Priority / response | P1 · Contractor ≤ 30 min · speak to passenger ≤ 2 min |
| Data tier | Assumed · system by others |
| Roles | Security Control, Lift Contractor, Shift Supervisor |

**Trigger.** Passenger alarm from the car (point depends on the lift vendor’s Modbus map).

**Trigger points.** `$Elevator.Entrapment`, `$Elevator.Floor`

**Steps**

1. Talk to the passenger on the intercom and reassure them.
2. Dispatch the lift contractor (rescue-trained).
3. Security at the landing; first aid if needed.
4. Never attempt release without trained staff.

**Close-out check (read from points).** Passenger released; lift out of service until inspected.

**Escalation.** > 30 min or medical issue → Civil Defence.

**KPIs protected.** EX-09 Vertical Transport Availability; OP-14 Lift Faults & Entrapments

## SOP-VT-03 · Escalator stop / fault

| | |
|---|---|
| System | Escalators |
| Category | Alarm response |
| Priority / response | P2 · ≤ 30 min |
| Data tier | In scope · AVEVA integration |
| Roles | Security Control, Lift Contractor |

**Trigger.** Escalator fault or emergency stop pressed.

**Trigger points.** `$Escalator.Fault`, `$Escalator.E_Stop`

**Steps**

1. Check CCTV for an injured person first.
2. Barricade both ends.
3. Restart only after a walk-down inspection.

**Close-out check (read from points).** Running = True.

**Escalation.** Injury → incident report.

**KPIs protected.** EX-09 Vertical Transport Availability

## SOP-LS-01 · Fire alarm activation

| | |
|---|---|
| System | Fire alarm (by others) |
| Category | Emergency |
| Priority / response | P1 · Immediate |
| Data tier | Assumed · system by others |
| Roles | Security Control, Fire Warden, Shift Supervisor, BMS Operator |

**Trigger.** Fire alarm from a fire alarm control panel (BACnet IP to AVEVA).

**Trigger points.** `$FireAlarmPanel.Fire_Alarm`, `$SmokeFan.Sts_Run`, `$StairPressFan.Stair_DP`, `$FAHU.Sts_Run`, `$Elevator.Fire_Recall`, `$PublicAddress.Evac_Active`

**Steps**

1. Verify: CCTV on the zone, Fire Warden to the location (2-min investigation if the cause-and-effect allows).
2. Confirm cause-and-effect ran (proven by BMS points): smoke fans running, stair pressurisation ΔP ≥ 40 Pa, FAHUs in the building stopped, lifts recalled.
3. Confirmed fire: PA evacuation for the building, call Civil Defence, open access-control doors on the escape routes.
4. False alarm: silence, reset with Fire Warden approval, record the cause.

**Close-out check (read from points).** Panel reset; smoke fans back to standby in Auto; FAHUs and lifts back in service.

**Escalation.** Confirmed fire → Civil Defence (180) and Facility Manager immediately.

**KPIs protected.** EX-06 Life-Safety Readiness; OP-15 Fire System Impairments

## SOP-LS-02 · Life-safety fan not available

| | |
|---|---|
| System | Smoke control |
| Category | Alarm response |
| Priority / response | P1 · ≤ 30 min |
| Data tier | Proven · BMS hardwired I/O |
| Roles | HVAC Technician, Fire Warden, Shift Supervisor |

**Trigger.** Smoke extract or stair pressurisation fan tripped or not in Auto.

**Trigger points.** `$SmokeFan.Alm_Trip`, `$SmokeFan.Sts_Auto`, `$StairPressFan.Alm_Trip`, `$StairPressFan.Sts_Auto`

**Steps**

1. Inform the Fire Warden: the zone’s smoke control is impaired.
2. Restore the fan (reset / return to Auto).
3. If not restorable within 4 h, apply the fire-impairment procedure (fire watch).

**Close-out check (read from points).** Sts_Auto = True, Alm_Trip = False; weekly test passes.

**Escalation.** Impairment > 24 h → notify the fire consultant / authority as required.

**KPIs protected.** EX-06 Life-Safety Readiness

## SOP-LS-03 · Duct smoke detector

| | |
|---|---|
| System | Air side / fire |
| Category | Emergency |
| Priority / response | P1 · ≤ 10 min on site |
| Data tier | Proven · BMS hardwired I/O |
| Roles | BMS Operator, Fire Warden, HVAC Technician |

**Trigger.** FAHU / AHU duct smoke detector (hardwired to the BMS) — unit shuts down.

**Trigger points.** `$FAHU.Smoke_Det`, `$AHU.Smoke_Det_Supply`, `$AHU.Smoke_Det_Return`

**Steps**

1. Confirm the unit stopped and its damper closed.
2. Fire Warden inspects the unit and the duct.
3. If no fire: clean / test the detector, reset, restart the unit.

**Close-out check (read from points).** Smoke_Det = False, unit running.

**Escalation.** Smoke confirmed → SOP-LS-01.

**KPIs protected.** EX-06 Life-Safety Readiness

## SOP-LS-04 · Fire alarm system fault / disablement

| | |
|---|---|
| System | Fire alarm (by others) |
| Category | Alarm response |
| Priority / response | P2 · ≤ 4 h |
| Data tier | Assumed · system by others |
| Roles | Fire Warden, CAFM Coordinator |

**Trigger.** Panel fault, or devices disabled.

**Trigger points.** `$FireAlarmPanel.Fault`, `$FireAlarmPanel.Disabled_Pts`

**Steps**

1. Call the fire alarm contractor.
2. Every disablement needs a permit with an expiry.
3. Fire watch for disabled areas.

**Close-out check (read from points).** Fault cleared; disabled devices = 0 or under a valid permit.

**Escalation.** Disablement past its permit → Facility Manager.

**KPIs protected.** OP-15 Fire System Impairments; EX-06 Life-Safety Readiness

## SOP-LS-05 · Public address fault

| | |
|---|---|
| System | Public address (by others) |
| Category | Alarm response |
| Priority / response | P2 · ≤ 4 h |
| Data tier | Assumed · system by others |
| Roles | Security Control, CAFM Coordinator |

**Trigger.** Amplifier or speaker-line fault.

**Trigger points.** `$PublicAddress.Amp_Fault`, `$PublicAddress.Line_Fault`

**Steps**

1. Identify the affected zones.
2. Arrange alternative alerting (wardens with megaphones) for those zones.
3. Call the PA contractor.

**Close-out check (read from points).** All zones healthy.

**Escalation.** Evacuation zones without PA > 24 h → fire impairment.

**KPIs protected.** OP-16 PA Health

## SOP-LS-06 · Weekly life-safety fan test

| | |
|---|---|
| System | Smoke control |
| Category | Routine |
| Priority / response | P4 · Weekly |
| Data tier | Proven · BMS hardwired I/O |
| Roles | BMS Operator, Fire Warden |

**Trigger.** PPM calendar (outside opening hours).

**Trigger points.** `$SmokeFan.Cmd_Start`, `$SmokeFan.Airflow_DPS`, `$StairPressFan.Stair_DP`

**Steps**

1. Command each smoke and pressurisation fan from the BMS.
2. Record airflow proven and stair ΔP (target 40–50 Pa).
3. Return to Auto; AVEVA attaches the trend to the PPM record.

**Close-out check (read from points).** Each fan: Airflow_DPS proven ≤ 30 s; Stair_DP in range.

**Escalation.** Failed test → SOP-LS-02.

**KPIs protected.** EX-06 Life-Safety Readiness; EX-12 PPM Compliance

## SOP-SC-01 · Door forced / held open

| | |
|---|---|
| System | Access control (by others) |
| Category | Alarm response |
| Priority / response | P2 · Guard on site ≤ 5 min |
| Data tier | Assumed · system by others |
| Roles | Security Control |

**Trigger.** Door forced or held-open alarm (BACnet IP to AVEVA).

**Trigger points.** `$AccessDoor.Forced`, `$AccessDoor.Held`

**Steps**

1. Call up the nearest camera.
2. Dispatch a guard.
3. Identify the person (badge / CCTV); report.

**Close-out check (read from points).** Door secured; incident logged.

**Escalation.** Intruder confirmed → police.

**KPIs protected.** OP-17 Security Events Today

## SOP-SC-02 · Camera offline

| | |
|---|---|
| System | CCTV (by others) |
| Category | Alarm response |
| Priority / response | P3 · ≤ 1 working day |
| Data tier | Assumed · system by others |
| Roles | Security Control, CAFM Coordinator |

**Trigger.** Camera video loss (BACnet IP to AVEVA).

**Trigger points.** `$Camera.Online`

**Steps**

1. Check whether a whole switch is down.
2. Raise a work order to the CCTV contractor.
3. Increase patrols in the blind area.

**Close-out check (read from points).** Camera online and recording.

**Escalation.** Critical camera (cash, entrances) → P2.

**KPIs protected.** OP-17 Security Events Today

## SOP-FM-01 · Corrective work-order lifecycle

| | |
|---|---|
| System | CAFM (by others) |
| Category | Administrative |
| Priority / response | P3 · Per priority SLA |
| Data tier | Assumed · system by others |
| Roles | CAFM Coordinator, HVAC Technician, Electrical Technician |

**Trigger.** Alarm escalated from AVEVA, tenant request, or inspection finding.

**Trigger points.** `AVEVA Work Task → CAFM WO`

**Steps**

1. Create the WO with the asset tag, alarm and SOP reference (auto from AVEVA).
2. Assign by trade; SLA starts.
3. Technician attends, records cause / action / parts.
4. Close only after the SOP’s verification reads true in AVEVA.

**Close-out check (read from points).** WO closed with cause code and the point read-back attached.

**Escalation.** SLA breach → Facility Manager weekly review.

**KPIs protected.** EX-11 Work-Order SLA Compliance; MT-03 Mean Time To Repair; MT-04 Open Work Orders

## SOP-FM-02 · Planned preventive maintenance (run-hour based)

| | |
|---|---|
| System | CAFM (by others) |
| Category | Routine |
| Priority / response | P4 · Per plan |
| Data tier | Calculated |
| Roles | CAFM Coordinator |

**Trigger.** Calendar PPM, or run hours from the BMS crossing the service interval.

**Trigger points.** `$Chiller.Run_Hours`, `$CHW_Pump.Run_Hours`, `$CW_Pump.Run_Hours`, `$Genset.Run_Hours`

**Steps**

1. AVEVA pushes run hours to CAFM daily.
2. CAFM raises PPM when the interval is reached (e.g. chiller 2,000 h, pumps 4,000 h).
3. Plan into the stop window; record findings.

**Close-out check (read from points).** PPM closed within its window.

**Escalation.** Overdue PPM > 14 days → Facility Manager.

**KPIs protected.** EX-12 PPM Compliance; MT-01 Plant Run Hours vs Service
