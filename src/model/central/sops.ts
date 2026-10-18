import type { SourceTier } from '@/model/central/project';

/**
 * Standard operating procedures for Central. Each SOP is triggered by points the submittal proves can
 * be read (tier io / bms / aveva) — the trigger, the verification and the close-out all name real
 * Template.Attribute points. SOPs for systems by others (fire alarm, PA, CCTV, access control, CAFM)
 * are marked "assumed" and follow common practice; confirm them with the system vendors.
 *
 * In the platform, alarm-driven SOPs run as AVEVA Work Task workflows (in the AVEVA BoQ): the alarm
 * opens the task, each step is acknowledged by the role that owns it, and the close-out check reads
 * the points back before the task can be closed.
 */

export type SopCategory = 'Emergency' | 'Alarm response' | 'Routine' | 'Administrative';
export type Role = 'BMS Operator' | 'Shift Supervisor' | 'HVAC Technician' | 'Electrical Technician' | 'Facility Manager' | 'Security Control' | 'Fire Warden' | 'Lift Contractor' | 'Plumbing Technician' | 'Energy Analyst' | 'CAFM Coordinator';

export interface Sop {
  id: string;
  title: string;
  system: string;
  category: SopCategory;
  tier: SourceTier;
  /** When it starts, in words. */
  trigger: string;
  /** Points that raise it (Template.Attribute). */
  points: string[];
  priority: 'P1' | 'P2' | 'P3' | 'P4';
  /** Target to acknowledge / to be on site. */
  response: string;
  roles: Role[];
  steps: string[];
  /** Close-out: what the points must read before the task closes. */
  verify: string;
  escalation: string;
  kpis: string[];
}

export const SOPS: Sop[] = [
  /* ---------------------------------------------------------------- General / BMS */
  {
    id: 'SOP-GN-01', title: 'Alarm handling & acknowledgement', system: 'All systems', category: 'Administrative', tier: 'calc', priority: 'P2', response: 'Acknowledge P1 ≤ 1 min, P2 ≤ 5 min, P3 ≤ 15 min',
    trigger: 'Any alarm raised in AVEVA Operations Control (BMS, electrical, transport, third-party).',
    points: ['*.Alm_*', '*.Comm_OK', '*.Fault'],
    roles: ['BMS Operator', 'Shift Supervisor'],
    steps: [
      'Acknowledge the alarm in AVEVA; the linked SOP opens as an AVEVA Work Task.',
      'Read the asset’s live points and recent trend to confirm it is real (not a sensor or comms fault).',
      'Classify: real fault → follow the linked SOP; nuisance → log reason and raise SOP-BM-02 to tune the limit.',
      'Dispatch the owning role; record who and when in the task.',
      'Keep the alarm shelved only with a reason and an expiry (max. one shift).',
    ],
    verify: 'Alarm returns to normal in AVEVA and the Work Task carries every step’s acknowledgement.',
    escalation: 'Unacknowledged P1 after 1 min → Shift Supervisor; after 5 min → Facility Manager.',
    kpis: ['EX-10', 'OP-01'],
  },
  {
    id: 'SOP-GN-02', title: 'Hand/Off/Auto overrides', system: 'All motor starters', category: 'Alarm response', tier: 'io', priority: 'P3', response: '≤ 30 min',
    trigger: 'A starter’s Hand/Auto selector is out of Auto (Sts_Auto = False).',
    points: ['$FAHU.Sts_Auto', '$CHW_Pump.Sts_Auto', '$CoolingTower.Sts_Auto', '$Fan.Sts_Auto', '$CarParkExhaustFan.Sts_Auto'],
    roles: ['BMS Operator', 'HVAC Technician'],
    steps: [
      'Check the permit / maintenance log: is the override planned?',
      'If unplanned, send a technician to the MCC to find out why it was switched to Hand.',
      'Return the selector to Auto once safe; confirm the BMS takes control (Cmd_Start ↔ Sts_Run follow).',
      'If it must stay in Hand, log the reason and expiry in the Work Task.',
    ],
    verify: 'Sts_Auto = True and Sts_Run follows Cmd_Start for 15 min.',
    escalation: 'Life-safety fan in Hand → treat as SOP-LS-02 (P1).',
    kpis: ['OP-07'],
  },
  {
    id: 'SOP-BM-01', title: 'Device communication loss', system: 'BMS network / gateways', category: 'Alarm response', tier: 'bms', priority: 'P3', response: '≤ 4 h',
    trigger: 'A Modbus / BACnet device stops answering (Comm_OK = False): FCU thermostats, energy valves, BTU and power meters.',
    points: ['$FCU_TC903.Comm_OK', '$EnergyValve.Comm_OK', '$BTU_Meter.Comm_OK', '$PowerMeter.Comm_OK'],
    roles: ['BMS Operator', 'HVAC Technician'],
    steps: [
      'Check whether a whole segment is down (same PAS600 gateway / LCP): if yes, check gateway power and the IP link first.',
      'Single device: check its address and RS-485 wiring at the device; power-cycle the device.',
      'For billing meters, note the gap start time so SOP-MT-01 can back-fill from the meter register.',
      'Replace the device if it does not recover; update the asset in CAFM.',
    ],
    verify: 'Comm_OK = True and values update for 30 min.',
    escalation: 'More than 5 % of a building’s devices offline → P2, Shift Supervisor.',
    kpis: ['OP-08', 'EX-04'],
  },
  {
    id: 'SOP-BM-02', title: 'Alarm limit & schedule change control', system: 'BMS', category: 'Administrative', tier: 'calc', priority: 'P4', response: 'Next working day',
    trigger: 'Request to change a set point, alarm limit or time schedule.',
    points: ['$FAHU.Supply_Setpoint', '$FCU_TC903.Setpoint'],
    roles: ['Shift Supervisor', 'Facility Manager'],
    steps: ['Raise the change in CAFM with the reason and the expected effect.', 'Facility Manager approves.', 'BMS engineer applies the change in EcoStruxure; AVEVA logs it.', 'Review effect on comfort and energy KPIs after one week.'],
    verify: 'New value active in the BMS and recorded in the AVEVA audit trail.',
    escalation: 'Changes to life-safety logic need the fire consultant’s approval.',
    kpis: ['EX-05'],
  },

  /* ---------------------------------------------------------------- HVAC */
  {
    id: 'SOP-HV-01', title: 'Chiller fault / trip', system: 'Chilled water plant', category: 'Alarm response', tier: 'io', priority: 'P1', response: '≤ 15 min on site',
    trigger: 'A chiller reports a fault, or loses evaporator / condenser flow while commanded on.',
    points: ['$Chiller.Alm_Fault', '$Chiller.CHW_Flow_Sw', '$Chiller.CW_Flow_Sw', '$Chiller.Sts_Run'],
    roles: ['BMS Operator', 'HVAC Technician', 'Shift Supervisor'],
    steps: [
      'Confirm the BMS staged the next chiller (lead/lag) and its butterfly valves opened (Sts_CHW_Valve / Sts_CW_Valve).',
      'Check common CHW supply temperature: if above 8 °C for 10 min, reduce non-critical load (FAHU valves) per supervisor.',
      'Read the chiller’s BACnet alarm text; check flow switches and the matching CHW / CW pumps.',
      'Do not reset more than once; a repeat trip needs the chiller vendor.',
      'Raise a corrective work order with the fault code.',
    ],
    verify: 'Plant holds CHWS ≤ set point + 1 K; faulted chiller either healthy (Alm_Fault = False) or isolated with valves closed.',
    escalation: 'Two chillers unavailable at peak → Facility Manager and chiller vendor (4 h response).',
    kpis: ['EX-02', 'OP-02', 'OP-03', 'EX-01'],
  },
  {
    id: 'SOP-HV-02', title: 'CHW / CW pump trip', system: 'Chilled & condenser water', category: 'Alarm response', tier: 'io', priority: 'P2', response: '≤ 30 min',
    trigger: 'Pump trip, or no flow proven (Flow_DPS = False) while running.',
    points: ['$CHW_Pump.Alm_Trip', '$CHW_Pump.Flow_DPS', '$CHW_Pump.Fault_Code', '$CW_Pump.Alm_Trip'],
    roles: ['BMS Operator', 'HVAC Technician'],
    steps: [
      'Confirm the standby pump started (7th pump) and flow is proven.',
      'Read the VSD fault code (PCHWP, Modbus) and the motor current before the trip.',
      'Inspect the pump: strainer, seals, coupling, motor temperature.',
      'Reset once; if it trips again, isolate and raise a work order.',
    ],
    verify: 'Duty pump count matches running chillers; Flow_DPS = True on all running pumps.',
    escalation: 'No standby available → P1, Shift Supervisor.',
    kpis: ['MT-02', 'MT-06'],
  },
  {
    id: 'SOP-HV-03', title: 'Cooling tower trip / basin low level', system: 'Heat rejection (B03 roof)', category: 'Alarm response', tier: 'io', priority: 'P2', response: '≤ 30 min',
    trigger: 'Tower fan trip, or basin low-level switch.',
    points: ['$CoolingTower.Alm_Trip', '$CoolingTower.Basin_Level_Sw', '$CoolingTower.CW_Out_Temp'],
    roles: ['HVAC Technician', 'Plumbing Technician'],
    steps: ['Check make-up water supply and the float valve.', 'Check the fan VSD and motor.', 'Watch condenser water temperature: above 35 °C leaving, add a cell.', 'Raise work order.'],
    verify: 'Basin level normal, CW_Out_Temp within 4 K approach to wet bulb.',
    escalation: 'Two cells out at peak → P1.',
    kpis: ['OP-05'],
  },
  {
    id: 'SOP-HV-04', title: 'Pressurisation unit / water treatment fault', system: 'Chilled water plant', category: 'Alarm response', tier: 'io', priority: 'P3', response: '≤ 2 h',
    trigger: 'Expansion tank & pressurisation unit or water treatment station general fault.',
    points: ['$PlantPackage.Alm_Fault', '$Chiller.CHW_Press'],
    roles: ['HVAC Technician'],
    steps: ['Check system static pressure on the chiller pressure transmitters.', 'Inspect the package panel for its own fault text.', 'Top up / restart per vendor manual.', 'Log chemical dosing if WTS.'],
    verify: 'Alm_Fault = False; CHW pressure stable.',
    escalation: 'Pressure falling → P1 (risk to pumps).',
    kpis: ['EX-01'],
  },
  {
    id: 'SOP-HV-05', title: 'FAHU / AHU trip or supply air out of range', system: 'Air side', category: 'Alarm response', tier: 'io', priority: 'P2', response: '≤ 1 h',
    trigger: 'Supply fan trip, no airflow proven while running, or supply air > set point + 2.5 K.',
    points: ['$FAHU.Alm_Trip', '$FAHU.Airflow_DPS', '$FAHU.Supply_Temp', '$FAHU.Valve_Fb'],
    roles: ['BMS Operator', 'HVAC Technician'],
    steps: [
      'Fan trip: check the MCC overload and belt / motor; reset once.',
      'High supply air: check valve feedback follows command (PIBCV); if valve is 100 % open, check CHW supply temperature at the plant.',
      'Check the fresh-air damper end switch opened.',
      'Raise work order with the trend.',
    ],
    verify: 'Sts_Run = True, Airflow_DPS = True, Supply_Temp within ±1.5 K of set point for 30 min.',
    escalation: 'Unit serving a whole building out > 4 h → Facility Manager.',
    kpis: ['OP-06', 'EX-05'],
  },
  {
    id: 'SOP-HV-06', title: 'Dirty filter', system: 'Air side', category: 'Alarm response', tier: 'io', priority: 'P4', response: 'Within 5 days (planned)',
    trigger: 'Pre-filter or bag-filter ΔP switch made.',
    points: ['$FAHU.PreFilter_DPS', '$FAHU.BagFilter_DPS', '$AHU.PreFilter_DPS', '$AHU.BagFilter_DPS'],
    roles: ['CAFM Coordinator', 'HVAC Technician'],
    steps: ['Auto-raise a planned work order in CAFM.', 'Replace the filter at the next stop window.', 'Record filter type and date.'],
    verify: 'ΔP switch returns to normal after replacement.',
    escalation: 'Not replaced within 10 days → Facility Manager.',
    kpis: ['OP-09', 'EX-12'],
  },
  {
    id: 'SOP-HV-07', title: 'CRAC high temperature (IT room)', system: 'Computer room A/C', category: 'Alarm response', tier: 'bms', priority: 'P1', response: '≤ 15 min',
    trigger: 'CRAC common alarm or return air above 27 °C.',
    points: ['$CRAC.Alm_Common', '$CRAC.Return_Temp'],
    roles: ['BMS Operator', 'HVAC Technician'],
    steps: ['Confirm the second CRAC is running.', 'Inform the IT room owner.', 'Check the unit alarm text over BACnet and the CHW supply.', 'Deploy temporary cooling if the room exceeds 30 °C.'],
    verify: 'Return_Temp ≤ 25 °C and Alm_Common = False.',
    escalation: 'Room > 30 °C → Facility Manager and IT.',
    kpis: ['EX-01'],
  },
  {
    id: 'SOP-HV-08', title: 'Comfort complaint / room too warm', system: 'Fan coil units', category: 'Alarm response', tier: 'bms', priority: 'P3', response: '≤ 2 h',
    trigger: 'Thermostat temperature alarm, or room ≥ set point + 3 K for 30 min while on.',
    points: ['$FCU_TC903.Alm_Temp', '$FCU_TC903.Room_Temp', '$FCU_TC903.Setpoint', '$FCU_TC903.Valve_Out', '$EnergyValve.Flow_m3h'],
    roles: ['BMS Operator', 'HVAC Technician'],
    steps: [
      'Check fan speed and mode on the thermostat (not in Fan or Economy).',
      'Check valve output is high; if so check the tenant energy valve shows flow.',
      'No flow → PIBCV / actuator fault; flow but warm → coil / filter / airflow.',
      'Inform the tenant of the expected fix time.',
    ],
    verify: 'Room_Temp within ±1.5 K of set point for 30 min.',
    escalation: 'Repeat complaint within 7 days → Facility Manager review.',
    kpis: ['EX-05'],
  },
  {
    id: 'SOP-HV-09', title: 'Exhaust / make-up fan trip', system: 'Ventilation', category: 'Alarm response', tier: 'io', priority: 'P3', response: '≤ 1 h (kitchen MAF: 30 min)',
    trigger: 'Fan trip or airflow not proven.',
    points: ['$Fan.Alm_Trip', '$Fan.Airflow_DPS'],
    roles: ['HVAC Technician'],
    steps: ['Kitchen make-up fan (B07): tell the F&B tenant; kitchen hood exhaust balance is affected.', 'Check overload / belt / motor.', 'Reset once; raise work order.'],
    verify: 'Sts_Run = True and Airflow_DPS = True.',
    escalation: 'Kitchen MAF out > 2 h → Facility Manager.',
    kpis: ['MT-02'],
  },
  {
    id: 'SOP-HV-10', title: 'Chiller plant daily start, staging & lead rotation', system: 'Chilled water plant', category: 'Routine', tier: 'io', priority: 'P4', response: 'Daily 05:30',
    trigger: 'Daily schedule; chiller staging on plant load.',
    points: ['$Chiller.Cmd_Start', '$Chiller.Load_Pct', '$Chiller.CHWS_Temp', '$CHW_Pump.Speed_Fb', '$CoolingTower.Speed_Fb'],
    roles: ['BMS Operator'],
    steps: [
      'Before opening hours, confirm the lead chiller, its pumps and tower cell started in sequence (valves → pumps → tower → chiller).',
      'Stage up when running chillers exceed 90 % load for 15 min; stage down below 40 %.',
      'Rotate lead chiller and duty pumps daily to balance run hours.',
      'Review plant kW/TR at the end of the day.',
    ],
    verify: 'CHWS within ±0.5 K of set point; run-hour spread across chillers < 10 %.',
    escalation: 'kW/TR above 0.85 for a day → Energy Analyst review.',
    kpis: ['EX-02', 'OP-02', 'MT-06'],
  },

  /* ---------------------------------------------------------------- Car park & drainage */
  {
    id: 'SOP-CP-01', title: 'Car-park high CO', system: 'Car-park ventilation (B1/B2)', category: 'Emergency', tier: 'io', priority: 'P1', response: 'Immediate (automatic) · security on site ≤ 10 min',
    trigger: 'Zone CO above 50 ppm (boost) or above 100 ppm (evacuate zone).',
    points: ['$CarParkExhaustFan.Zone_CO', '$CarParkExhaustFan.Speed_Fb', '$CarParkSupplyFan.Speed_Fb'],
    roles: ['BMS Operator', 'Security Control', 'Shift Supervisor'],
    steps: [
      'Above 50 ppm: confirm exhaust and supply fans in the zone ramped to 100 %.',
      'Above 100 ppm: Security closes the zone ramp; PA announcement for the car-park level (if PA zoning allows).',
      'CCTV check for idling vehicles / queues at exits.',
      'Check sensors read consistently (one sensor high → suspect sensor, raise work order).',
    ],
    verify: 'Zone_CO < 35 ppm for 15 min; fans return to CO-controlled speed.',
    escalation: '> 200 ppm or fans unavailable → Civil Defence per site emergency plan.',
    kpis: ['EX-13', 'OP-10'],
  },
  {
    id: 'SOP-CP-02', title: 'Car-park fan trip', system: 'Car-park ventilation (B1/B2)', category: 'Alarm response', tier: 'io', priority: 'P2', response: '≤ 1 h',
    trigger: 'Car-park exhaust or supply fan trip.',
    points: ['$CarParkExhaustFan.Alm_Trip', '$CarParkSupplyFan.Alm_Trip'],
    roles: ['HVAC Technician'],
    steps: ['Check neighbouring fans in the zone took up speed.', 'Inspect VSD (Modbus fault) and motor.', 'Note: car-park fans also serve smoke clearance — tell the Fire Warden if more than one fan in a zone is out.'],
    verify: 'Sts_Run = True and Airflow_DPS = True.',
    escalation: 'Two fans in one zone out → P1 (smoke clearance compromised).',
    kpis: ['EX-06', 'MT-02'],
  },
  {
    id: 'SOP-DR-01', title: 'Sump pit high level', system: 'Drainage (B2)', category: 'Emergency', tier: 'io', priority: 'P1', response: '≤ 15 min on site',
    trigger: 'High-level float switch made in a sump pit.',
    points: ['$DuplexSumpPumps.High_Level', '$DuplexSumpPumps.P1_Run', '$DuplexSumpPumps.P2_Run', '$DuplexSumpPumps.P1_Trip'],
    roles: ['BMS Operator', 'Plumbing Technician', 'Shift Supervisor'],
    steps: [
      'Check both pumps are running (assist mode).',
      'If a pump is tripped, reset at the panel; check for blockage.',
      'Deploy portable pump if level keeps rising; protect electrical rooms on B2.',
      'Look for the source (pipe burst, rain, chiller plant drain).',
    ],
    verify: 'High_Level = False and pumps cycle normally for 1 h.',
    escalation: 'Water reaching LV rooms → Electrical Technician isolates, Facility Manager.',
    kpis: ['OP-11'],
  },
  {
    id: 'SOP-DR-02', title: 'Sump pump trip', system: 'Drainage (B2)', category: 'Alarm response', tier: 'io', priority: 'P2', response: '≤ 2 h',
    trigger: 'One pump of a duplex set tripped.',
    points: ['$DuplexSumpPumps.P1_Trip', '$DuplexSumpPumps.P2_Trip'],
    roles: ['Plumbing Technician'],
    steps: ['Confirm the second pump covers duty.', 'Lift and clean the pump; check impeller and float.', 'Raise work order.'],
    verify: 'Both pumps available (no trip).',
    escalation: 'Both pumps tripped → SOP-DR-01.',
    kpis: ['MT-05'],
  },

  /* ---------------------------------------------------------------- Metering */
  {
    id: 'SOP-MT-01', title: 'Billing meter data gap', system: 'Cooling metering & billing', category: 'Alarm response', tier: 'bms', priority: 'P2', response: '≤ 1 working day',
    trigger: 'Energy valve or bulk BTU meter offline, or meter info code ≠ 0.',
    points: ['$EnergyValve.Comm_OK', '$BTU_Meter.Comm_OK', '$BTU_Meter.Info_Code', '$BTU_Meter.Energy_MWh'],
    roles: ['Energy Analyst', 'BMS Operator'],
    steps: [
      'Restore communication (SOP-BM-01).',
      'Back-fill the gap from the meter’s own totaliser register (Energy_kWh / Energy_MWh) — no estimate needed if the register advanced.',
      'If the register did not advance (meter fault), estimate from the same tenant’s previous 4 weeks and flag the bill line.',
      'Info code: read the meter diagnostics with the optical head (KAOPTC).',
    ],
    verify: 'No gap in the billing period export; meter Comm_OK = True.',
    escalation: 'Gap at month-end close → Facility Manager before invoices are issued.',
    kpis: ['EX-04', 'EX-03'],
  },
  {
    id: 'SOP-MT-02', title: 'Low ΔT on a tenant', system: 'Cooling metering', category: 'Alarm response', tier: 'bms', priority: 'P4', response: 'Weekly review',
    trigger: 'Tenant energy valve ΔT below 3.6 K over a week.',
    points: ['$EnergyValve.DeltaT', '$EnergyValve.Flow_m3h', '$EnergyValve.Valve_Pos'],
    roles: ['Energy Analyst', 'HVAC Technician'],
    steps: ['List the worst tenants by ΔT.', 'Check their FCU valves and coil condition.', 'Low ΔT raises pumping and chiller energy: agree corrective action with the tenant.'],
    verify: 'Weekly ΔT ≥ 4 K.',
    escalation: 'Persistent → commercial review (lease clause).',
    kpis: ['OP-04', 'EX-02'],
  },
  {
    id: 'SOP-MT-03', title: 'Monthly cooling billing close', system: 'Cooling billing (by others)', category: 'Administrative', tier: 'assumed', priority: 'P4', response: 'Month end + 3 days',
    trigger: 'Calendar: last day of the month 23:59.',
    points: ['$EnergyValve.Energy_kWh', '$BTU_Meter.Energy_MWh'],
    roles: ['Energy Analyst', 'Facility Manager'],
    steps: ['AVEVA freezes month-end register readings for all 655 meters.', 'Validate completeness and outliers (> 2× previous month).', 'Export to the cooling billing system.', 'Approve and issue.'],
    verify: '100 % of meters with a valid month-end reading.',
    escalation: 'Disputed bills → Facility Manager.',
    kpis: ['EX-04'],
  },

  /* ---------------------------------------------------------------- Electrical */
  {
    id: 'SOP-EL-01', title: 'Utility (mains) failure', system: 'Electrical', category: 'Emergency', tier: 'aveva', priority: 'P1', response: 'Immediate',
    trigger: 'ATS transfers to generator; MV ring de-energised.',
    points: ['$ATS.Position', '$ATS.Mains_OK', '$Genset.GCB_Closed', '$UPS.On_Battery'],
    roles: ['BMS Operator', 'Electrical Technician', 'Shift Supervisor', 'Lift Contractor'],
    steps: [
      'Confirm generators started and closed on load (≤ 10 s) in each building.',
      'Confirm UPS units transferred back from battery.',
      'Check lifts for trapped passengers (SOP-VT-02); escalators stop by design.',
      'Shed non-essential load if any generator exceeds 90 %.',
      'Inform the utility; log the event start.',
      'On restoration, verify ATS back on mains and generators cool down.',
    ],
    verify: 'All ATS on mains, generators back in Auto standby, UPS online.',
    escalation: 'Any generator failing to start → SOP-EL-02 as P1.',
    kpis: ['EX-08', 'EX-07'],
  },
  {
    id: 'SOP-EL-02', title: 'Generator not available', system: 'Standby power', category: 'Alarm response', tier: 'aveva', priority: 'P2', response: '≤ 1 h',
    trigger: 'Generator not in Auto, or shutdown alarm.',
    points: ['$Genset.Sts_Auto', '$Genset.Alm_Shutdown', '$Genset.Battery_V'],
    roles: ['Electrical Technician'],
    steps: ['Find why it is out of Auto (maintenance permit?).', 'Check battery voltage and charger.', 'Return to Auto; run an off-load test if it was repaired.'],
    verify: 'Sts_Auto = True, no shutdown alarm.',
    escalation: 'More than one generator unavailable in a building → P1.',
    kpis: ['EX-08'],
  },
  {
    id: 'SOP-EL-03', title: 'Generator fuel low', system: 'Standby power', category: 'Alarm response', tier: 'aveva', priority: 'P3', response: 'Order fuel same day',
    trigger: 'Day-tank level below 40 %.',
    points: ['$Genset.Fuel_Level'],
    roles: ['Electrical Technician', 'Facility Manager'],
    steps: ['Check bulk tank and transfer pump.', 'Order diesel delivery.', 'Log consumption.'],
    verify: 'Fuel_Level ≥ 80 %.',
    escalation: 'Below 25 % → P1.',
    kpis: ['EX-08'],
  },
  {
    id: 'SOP-EL-04', title: 'Transformer / RMU alarm', system: 'MV / LV distribution', category: 'Alarm response', tier: 'aveva', priority: 'P2', response: '≤ 1 h',
    trigger: 'Transformer winding temperature alarm, RMU SF6 low or earth fault.',
    points: ['$Transformer.Winding_Temp', '$Transformer.Alm_Temp', '$RMU.SF6_Low', '$RMU.Earth_Fault'],
    roles: ['Electrical Technician', 'Shift Supervisor'],
    steps: ['Check the transformer loading (DPM on its MDB).', 'Check room ventilation and cooling fans.', 'SF6 low / earth fault: do not operate the switch; call the MV contractor.', 'Shift load to the other transformer if available.'],
    verify: 'Winding_Temp below alarm stage; RMU healthy.',
    escalation: 'Temperature trip stage or earth fault → P1, utility notified.',
    kpis: ['OP-12'],
  },
  {
    id: 'SOP-EL-05', title: 'Board overload / power quality', system: 'LV distribution', category: 'Alarm response', tier: 'aveva', priority: 'P3', response: '≤ 4 h',
    trigger: 'Incomer above 90 % of rating, or current THD above 9.5 %.',
    points: ['$PowerMeter.Load_Pct', '$PowerMeter.THD_I', '$PowerMeter.PF'],
    roles: ['Electrical Technician', 'Energy Analyst'],
    steps: ['Identify the outgoing feeders driving the load.', 'Defer non-essential loads.', 'THD: check VSD-heavy boards (MCC) and harmonic filters.'],
    verify: 'Load_Pct < 85 %.',
    escalation: 'Repeated > 90 % → capacity study.',
    kpis: ['EX-07', 'OP-13'],
  },
  {
    id: 'SOP-EL-06', title: 'UPS on battery', system: 'UPS', category: 'Emergency', tier: 'aveva', priority: 'P1', response: 'Immediate',
    trigger: 'UPS transfers to battery.',
    points: ['$UPS.On_Battery', '$UPS.Autonomy_Min', '$UPS.Battery_Pct'],
    roles: ['BMS Operator', 'Electrical Technician'],
    steps: ['Check whether the input failed (mains / ATS / breaker).', 'Watch autonomy; warn system owners if below 10 min.', 'Restore input supply.'],
    verify: 'On_Battery = False, battery recharging.',
    escalation: 'Autonomy < 10 min → orderly shutdown of IT loads.',
    kpis: ['EX-08'],
  },
  {
    id: 'SOP-EL-07', title: 'Monthly generator test', system: 'Standby power', category: 'Routine', tier: 'aveva', priority: 'P4', response: 'Monthly',
    trigger: 'PPM calendar.',
    points: ['$Genset.Sts_Running', '$Genset.Frequency', '$Genset.Voltage_LL', '$Genset.Coolant_Temp'],
    roles: ['Electrical Technician', 'CAFM Coordinator'],
    steps: ['Run each generator 30 min off-load (on-load quarterly via ATS test).', 'Record voltage, frequency, coolant and oil readings from AVEVA.', 'Close the PPM in CAFM with the readings attached.'],
    verify: 'Readings within limits; set returned to Auto.',
    escalation: 'Failed test → SOP-EL-02.',
    kpis: ['EX-12', 'EX-08'],
  },

  /* ---------------------------------------------------------------- Vertical transport */
  {
    id: 'SOP-VT-01', title: 'Lift out of service', system: 'Elevators', category: 'Alarm response', tier: 'aveva', priority: 'P2', response: 'Contractor ≤ 1 h',
    trigger: 'Lift fault (In_Service = False).',
    points: ['$Elevator.Fault', '$Elevator.In_Service'],
    roles: ['BMS Operator', 'Lift Contractor'],
    steps: ['Confirm no passenger inside (CCTV / intercom).', 'Call the lift contractor; log call time.', 'Place signage at the landing.'],
    verify: 'In_Service = True.',
    escalation: 'Last lift in a core out → P1.',
    kpis: ['EX-09'],
  },
  {
    id: 'SOP-VT-02', title: 'Passenger entrapment', system: 'Elevators', category: 'Emergency', tier: 'assumed', priority: 'P1', response: 'Contractor ≤ 30 min · speak to passenger ≤ 2 min',
    trigger: 'Passenger alarm from the car (point depends on the lift vendor’s Modbus map).',
    points: ['$Elevator.Entrapment', '$Elevator.Floor'],
    roles: ['Security Control', 'Lift Contractor', 'Shift Supervisor'],
    steps: ['Talk to the passenger on the intercom and reassure them.', 'Dispatch the lift contractor (rescue-trained).', 'Security at the landing; first aid if needed.', 'Never attempt release without trained staff.'],
    verify: 'Passenger released; lift out of service until inspected.',
    escalation: '> 30 min or medical issue → Civil Defence.',
    kpis: ['EX-09', 'OP-14'],
  },
  {
    id: 'SOP-VT-03', title: 'Escalator stop / fault', system: 'Escalators', category: 'Alarm response', tier: 'aveva', priority: 'P2', response: '≤ 30 min',
    trigger: 'Escalator fault or emergency stop pressed.',
    points: ['$Escalator.Fault', '$Escalator.E_Stop'],
    roles: ['Security Control', 'Lift Contractor'],
    steps: ['Check CCTV for an injured person first.', 'Barricade both ends.', 'Restart only after a walk-down inspection.'],
    verify: 'Running = True.',
    escalation: 'Injury → incident report.',
    kpis: ['EX-09'],
  },

  /* ---------------------------------------------------------------- Life safety (by others: assumed) */
  {
    id: 'SOP-LS-01', title: 'Fire alarm activation', system: 'Fire alarm (by others)', category: 'Emergency', tier: 'assumed', priority: 'P1', response: 'Immediate',
    trigger: 'Fire alarm from a fire alarm control panel (BACnet IP to AVEVA).',
    points: ['$FireAlarmPanel.Fire_Alarm', '$SmokeFan.Sts_Run', '$StairPressFan.Stair_DP', '$FAHU.Sts_Run', '$Elevator.Fire_Recall', '$PublicAddress.Evac_Active'],
    roles: ['Security Control', 'Fire Warden', 'Shift Supervisor', 'BMS Operator'],
    steps: [
      'Verify: CCTV on the zone, Fire Warden to the location (2-min investigation if the cause-and-effect allows).',
      'Confirm cause-and-effect ran (proven by BMS points): smoke fans running, stair pressurisation ΔP ≥ 40 Pa, FAHUs in the building stopped, lifts recalled.',
      'Confirmed fire: PA evacuation for the building, call Civil Defence, open access-control doors on the escape routes.',
      'False alarm: silence, reset with Fire Warden approval, record the cause.',
    ],
    verify: 'Panel reset; smoke fans back to standby in Auto; FAHUs and lifts back in service.',
    escalation: 'Confirmed fire → Civil Defence (180) and Facility Manager immediately.',
    kpis: ['EX-06', 'OP-15'],
  },
  {
    id: 'SOP-LS-02', title: 'Life-safety fan not available', system: 'Smoke control', category: 'Alarm response', tier: 'io', priority: 'P1', response: '≤ 30 min',
    trigger: 'Smoke extract or stair pressurisation fan tripped or not in Auto.',
    points: ['$SmokeFan.Alm_Trip', '$SmokeFan.Sts_Auto', '$StairPressFan.Alm_Trip', '$StairPressFan.Sts_Auto'],
    roles: ['HVAC Technician', 'Fire Warden', 'Shift Supervisor'],
    steps: ['Inform the Fire Warden: the zone’s smoke control is impaired.', 'Restore the fan (reset / return to Auto).', 'If not restorable within 4 h, apply the fire-impairment procedure (fire watch).'],
    verify: 'Sts_Auto = True, Alm_Trip = False; weekly test passes.',
    escalation: 'Impairment > 24 h → notify the fire consultant / authority as required.',
    kpis: ['EX-06'],
  },
  {
    id: 'SOP-LS-03', title: 'Duct smoke detector', system: 'Air side / fire', category: 'Emergency', tier: 'io', priority: 'P1', response: '≤ 10 min on site',
    trigger: 'FAHU / AHU duct smoke detector (hardwired to the BMS) — unit shuts down.',
    points: ['$FAHU.Smoke_Det', '$AHU.Smoke_Det_Supply', '$AHU.Smoke_Det_Return'],
    roles: ['BMS Operator', 'Fire Warden', 'HVAC Technician'],
    steps: ['Confirm the unit stopped and its damper closed.', 'Fire Warden inspects the unit and the duct.', 'If no fire: clean / test the detector, reset, restart the unit.'],
    verify: 'Smoke_Det = False, unit running.',
    escalation: 'Smoke confirmed → SOP-LS-01.',
    kpis: ['EX-06'],
  },
  {
    id: 'SOP-LS-04', title: 'Fire alarm system fault / disablement', system: 'Fire alarm (by others)', category: 'Alarm response', tier: 'assumed', priority: 'P2', response: '≤ 4 h',
    trigger: 'Panel fault, or devices disabled.',
    points: ['$FireAlarmPanel.Fault', '$FireAlarmPanel.Disabled_Pts'],
    roles: ['Fire Warden', 'CAFM Coordinator'],
    steps: ['Call the fire alarm contractor.', 'Every disablement needs a permit with an expiry.', 'Fire watch for disabled areas.'],
    verify: 'Fault cleared; disabled devices = 0 or under a valid permit.',
    escalation: 'Disablement past its permit → Facility Manager.',
    kpis: ['OP-15', 'EX-06'],
  },
  {
    id: 'SOP-LS-05', title: 'Public address fault', system: 'Public address (by others)', category: 'Alarm response', tier: 'assumed', priority: 'P2', response: '≤ 4 h',
    trigger: 'Amplifier or speaker-line fault.',
    points: ['$PublicAddress.Amp_Fault', '$PublicAddress.Line_Fault'],
    roles: ['Security Control', 'CAFM Coordinator'],
    steps: ['Identify the affected zones.', 'Arrange alternative alerting (wardens with megaphones) for those zones.', 'Call the PA contractor.'],
    verify: 'All zones healthy.',
    escalation: 'Evacuation zones without PA > 24 h → fire impairment.',
    kpis: ['OP-16'],
  },
  {
    id: 'SOP-LS-06', title: 'Weekly life-safety fan test', system: 'Smoke control', category: 'Routine', tier: 'io', priority: 'P4', response: 'Weekly',
    trigger: 'PPM calendar (outside opening hours).',
    points: ['$SmokeFan.Cmd_Start', '$SmokeFan.Airflow_DPS', '$StairPressFan.Stair_DP'],
    roles: ['BMS Operator', 'Fire Warden'],
    steps: ['Command each smoke and pressurisation fan from the BMS.', 'Record airflow proven and stair ΔP (target 40–50 Pa).', 'Return to Auto; AVEVA attaches the trend to the PPM record.'],
    verify: 'Each fan: Airflow_DPS proven ≤ 30 s; Stair_DP in range.',
    escalation: 'Failed test → SOP-LS-02.',
    kpis: ['EX-06', 'EX-12'],
  },

  /* ---------------------------------------------------------------- Security (by others: assumed) */
  {
    id: 'SOP-SC-01', title: 'Door forced / held open', system: 'Access control (by others)', category: 'Alarm response', tier: 'assumed', priority: 'P2', response: 'Guard on site ≤ 5 min',
    trigger: 'Door forced or held-open alarm (BACnet IP to AVEVA).',
    points: ['$AccessDoor.Forced', '$AccessDoor.Held'],
    roles: ['Security Control'],
    steps: ['Call up the nearest camera.', 'Dispatch a guard.', 'Identify the person (badge / CCTV); report.'],
    verify: 'Door secured; incident logged.',
    escalation: 'Intruder confirmed → police.',
    kpis: ['OP-17'],
  },
  {
    id: 'SOP-SC-02', title: 'Camera offline', system: 'CCTV (by others)', category: 'Alarm response', tier: 'assumed', priority: 'P3', response: '≤ 1 working day',
    trigger: 'Camera video loss (BACnet IP to AVEVA).',
    points: ['$Camera.Online'],
    roles: ['Security Control', 'CAFM Coordinator'],
    steps: ['Check whether a whole switch is down.', 'Raise a work order to the CCTV contractor.', 'Increase patrols in the blind area.'],
    verify: 'Camera online and recording.',
    escalation: 'Critical camera (cash, entrances) → P2.',
    kpis: ['OP-17'],
  },

  /* ---------------------------------------------------------------- CAFM (assumed) */
  {
    id: 'SOP-FM-01', title: 'Corrective work-order lifecycle', system: 'CAFM (by others)', category: 'Administrative', tier: 'assumed', priority: 'P3', response: 'Per priority SLA',
    trigger: 'Alarm escalated from AVEVA, tenant request, or inspection finding.',
    points: ['AVEVA Work Task → CAFM WO'],
    roles: ['CAFM Coordinator', 'HVAC Technician', 'Electrical Technician'],
    steps: ['Create the WO with the asset tag, alarm and SOP reference (auto from AVEVA).', 'Assign by trade; SLA starts.', 'Technician attends, records cause / action / parts.', 'Close only after the SOP’s verification reads true in AVEVA.'],
    verify: 'WO closed with cause code and the point read-back attached.',
    escalation: 'SLA breach → Facility Manager weekly review.',
    kpis: ['EX-11', 'MT-03', 'MT-04'],
  },
  {
    id: 'SOP-FM-02', title: 'Planned preventive maintenance (run-hour based)', system: 'CAFM (by others)', category: 'Routine', tier: 'calc', priority: 'P4', response: 'Per plan',
    trigger: 'Calendar PPM, or run hours from the BMS crossing the service interval.',
    points: ['$Chiller.Run_Hours', '$CHW_Pump.Run_Hours', '$CW_Pump.Run_Hours', '$Genset.Run_Hours'],
    roles: ['CAFM Coordinator'],
    steps: ['AVEVA pushes run hours to CAFM daily.', 'CAFM raises PPM when the interval is reached (e.g. chiller 2,000 h, pumps 4,000 h).', 'Plan into the stop window; record findings.'],
    verify: 'PPM closed within its window.',
    escalation: 'Overdue PPM > 14 days → Facility Manager.',
    kpis: ['EX-12', 'MT-01'],
  },
];

export const sopById = (id: string | undefined) => SOPS.find((s) => s.id === id);
