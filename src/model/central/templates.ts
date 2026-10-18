import type { AttrDef, AttrType, TemplateDef } from '@/model/assets/galaxy';
import type { SourceTier } from '@/model/central/project';

/**
 * Galaxy templates for every equipment type on Central. Point lists follow the EL schematics and I/O
 * list (hardwired points, tier "io"), the integration matrices (Modbus RTU / BACnet IP / Modbus TCP,
 * tiers "bms" and "aveva", with registers from the data sheets: TC903 thermostat, Kamstrup KD meter,
 * SP90 energy valve, PAS600 gateway) and, for systems by others, an assumed typical list ("assumed").
 */

type Opt = { unit?: string; decimals?: number; states?: Record<number, string> };
const p =
  (src: SourceTier) =>
  (name: string, type: AttrType, desc: string, opt: Opt = {}): AttrDef => ({ name, type, desc, src, ...opt });
const io = p('io');
const bms = p('bms');
const av = p('aveva');
const calc = p('calc');
const asm = p('assumed');

const B = 'Boolean' as const;
const F = 'Float' as const;
const I = 'Integer' as const;

/** The four points every hardwired motor starter gives (EL schematics: start/stop, status, A/M, trip). */
const starter = (what = 'Motor') => [
  io('Cmd_Start', B, `${what} start/stop command (DO)`),
  io('Sts_Run', B, `${what} on/off status (DI)`),
  io('Sts_Auto', B, 'MCC hand/auto selector in Auto (DI)'),
  io('Alm_Trip', B, 'Power fail / overload trip (DI)'),
];

export const CHILLER: TemplateDef = {
  name: '$Chiller',
  desc: 'Water-cooled chiller, central plant (Basement 01)',
  io: 'Hardwired I/O on AS-P (LCP-BS1-03) + BACnet IP to the chiller controller',
  attrs: [
    io('Cmd_Start', B, 'Chiller enable (DO)'),
    io('Sts_Run', B, 'Chiller on/off status (DI)'),
    io('Alm_Fault', B, 'Normal / fault (DI)'),
    io('Cmd_CHW_Valve', B, 'Evaporator butterfly valve open command (DO)'),
    io('Sts_CHW_Valve', B, 'Evaporator butterfly valve feedback (DI)'),
    io('Cmd_CW_Valve', B, 'Condenser butterfly valve open command (DO)'),
    io('Sts_CW_Valve', B, 'Condenser butterfly valve feedback (DI)'),
    io('CHW_Flow_Sw', B, 'Evaporator liquid flow switch (DI)'),
    io('CW_Flow_Sw', B, 'Condenser liquid flow switch (DI)'),
    io('CHWS_Temp', F, 'Leaving chilled-water temperature (immersion sensor)', { unit: '°C', decimals: 1 }),
    io('CHWR_Temp', F, 'Entering chilled-water temperature (immersion sensor)', { unit: '°C', decimals: 1 }),
    io('CHW_Press', F, 'Evaporator pressure (transmitter 0–1000 kPa)', { unit: 'kPa', decimals: 0 }),
    io('CWS_Temp', F, 'Condenser water entering temperature', { unit: '°C', decimals: 1 }),
    io('CWR_Temp', F, 'Condenser water leaving temperature', { unit: '°C', decimals: 1 }),
    bms('Load_Pct', F, 'Compressor load (% RLA), chiller BACnet object', { unit: '%', decimals: 0 }),
    bms('Power_kW', F, 'Chiller input power, chiller BACnet object', { unit: 'kW', decimals: 0 }),
    bms('CHW_Setpoint', F, 'Active leaving-water set point, chiller BACnet object', { unit: '°C', decimals: 1 }),
    bms('Run_Hours', F, 'Compressor run hours, chiller BACnet object', { unit: 'h', decimals: 0 }),
    calc('Cooling_TR', F, 'Evaporator duty from ΔT and the plant BTU share', { unit: 'TR', decimals: 0 }),
    calc('kW_per_TR', F, 'Chiller efficiency', { unit: 'kW/TR', decimals: 2 }),
  ],
};

const vsdPump = (what: string, modbus: boolean): AttrDef[] => [
  ...starter(what),
  io('Flow_DPS', B, 'Differential pressure switch: flow proven (DI)'),
  io('Speed_Cmd', F, 'VSD speed signal (AO)', { unit: '%', decimals: 0 }),
  io('Speed_Fb', F, 'VSD speed feedback (AI)', { unit: '%', decimals: 0 }),
  ...(modbus
    ? [
        bms('Motor_kW', F, 'Drive output power (VSD Modbus RTU)', { unit: 'kW', decimals: 1 }),
        bms('Motor_Current', F, 'Motor current (VSD Modbus RTU)', { unit: 'A', decimals: 1 }),
        bms('Energy_kWh', F, 'Drive energy counter (VSD Modbus RTU)', { unit: 'kWh', decimals: 0 }),
        bms('Run_Hours', F, 'Drive run hours (VSD Modbus RTU)', { unit: 'h', decimals: 0 }),
        bms('Fault_Code', I, 'Last drive fault code (VSD Modbus RTU)'),
      ]
    : [calc('Run_Hours', F, 'Run hours totalised from Sts_Run', { unit: 'h', decimals: 0 })]),
];

export const PCHWP: TemplateDef = {
  name: '$CHW_Pump',
  desc: 'Primary chilled-water pump with VSD (6 duty + 1 standby)',
  io: 'Hardwired I/O on AS-P + VSD Modbus RTU (LCP-BS1-03)',
  attrs: vsdPump('Pump', true),
};

export const CWP: TemplateDef = {
  name: '$CW_Pump',
  desc: 'Condenser-water pump (6 duty + 1 standby)',
  io: 'Hardwired I/O on AS-P (LCP-BS1-03)',
  attrs: vsdPump('Pump', false),
};

export const COOLING_TOWER: TemplateDef = {
  name: '$CoolingTower',
  desc: 'Cooling tower cell with fan VSD (Building 03 roof)',
  io: 'Hardwired I/O on MP-C (LCP-B03-ROOF-01/02)',
  attrs: [
    ...starter('Fan'),
    io('Speed_Cmd', F, 'Fan VSD speed signal (AO)', { unit: '%', decimals: 0 }),
    io('Speed_Fb', F, 'Fan VSD speed feedback (AI)', { unit: '%', decimals: 0 }),
    io('Basin_Level_Sw', B, 'Basin low-level switch (DI)'),
    io('Cmd_Valve', B, 'Inlet butterfly valve command (DO)'),
    io('Sts_Valve', B, 'Inlet butterfly valve feedback (DI)'),
    io('CW_Out_Temp', F, 'Tower leaving water temperature', { unit: '°C', decimals: 1 }),
    calc('Approach_K', F, 'Leaving water minus outdoor wet bulb (SHO2 sensor)', { unit: 'K', decimals: 1 }),
  ],
};

export const PLANT_AUX: TemplateDef = {
  name: '$PlantPackage',
  desc: 'Packaged plant equipment: expansion tank & pressurisation unit, water treatment station',
  io: 'Hardwired I/O on AS-P (LCP-BS1-03)',
  attrs: [io('Sts_Normal', B, 'Package healthy (DI)'), io('Alm_Fault', B, 'Package general fault (DI)')],
};

export const FAHU: TemplateDef = {
  name: '$FAHU',
  desc: 'Fresh air handling unit, chilled-water coil with PIBCV',
  io: 'Hardwired I/O on MP-C (roof LCP): AO 1 · AI 2 · DO 2 · DI 8',
  attrs: [
    ...starter('Supply fan'),
    io('Airflow_DPS', B, 'Fan differential pressure switch: airflow proven (DI)'),
    io('PreFilter_DPS', B, 'Pre-filter dirty, ΔP switch (DI)'),
    io('BagFilter_DPS', B, 'Bag filter dirty, ΔP switch (DI)'),
    io('Smoke_Det', B, 'Duct smoke detector (DI)'),
    io('Cmd_Damper', B, 'Fresh-air damper open command, spring return (DO)'),
    io('Sts_Damper', B, 'Fresh-air damper end switch (DI)'),
    io('Valve_Cmd', F, 'PIBCV modulating command (AO)', { unit: '%', decimals: 0 }),
    io('Valve_Fb', F, 'PIBCV actuator feedback (AI)', { unit: '%', decimals: 0 }),
    io('Supply_Temp', F, 'Supply air temperature, duct sensor (AI)', { unit: '°C', decimals: 1 }),
    calc('Supply_Setpoint', F, 'Supply air set point (BMS program)', { unit: '°C', decimals: 1 }),
  ],
};

export const AHU: TemplateDef = {
  name: '$AHU',
  desc: 'Air handling unit with return air and modulating mixing dampers (Building 06)',
  io: 'Hardwired I/O on MP-C (LCP-B06-ROOF-01): AO 3 · AI 5 · DO 2 · DI 8',
  attrs: [
    ...starter('Supply fan'),
    io('Airflow_DPS', B, 'Fan differential pressure switch (DI)'),
    io('PreFilter_DPS', B, 'Pre-filter dirty (DI)'),
    io('BagFilter_DPS', B, 'Bag filter dirty (DI)'),
    io('Smoke_Det_Supply', B, 'Supply duct smoke detector (DI)'),
    io('Smoke_Det_Return', B, 'Return duct smoke detector (DI)'),
    io('FA_Damper_Cmd', F, 'Fresh-air damper modulating command (AO)', { unit: '%', decimals: 0 }),
    io('FA_Damper_Fb', F, 'Fresh-air damper feedback (AI)', { unit: '%', decimals: 0 }),
    io('RA_Damper_Cmd', F, 'Return-air damper modulating command (AO)', { unit: '%', decimals: 0 }),
    io('Valve_Cmd', F, 'PIBCV modulating command (AO)', { unit: '%', decimals: 0 }),
    io('Valve_Fb', F, 'PIBCV feedback (AI)', { unit: '%', decimals: 0 }),
    io('Supply_Temp', F, 'Supply air temperature (AI)', { unit: '°C', decimals: 1 }),
    io('Return_Temp', F, 'Return air temperature (AI)', { unit: '°C', decimals: 1 }),
  ],
};

export const CRAC: TemplateDef = {
  name: '$CRAC',
  desc: 'Computer room air conditioner (Basement 01)',
  io: 'BACnet IP software interface (unit controller)',
  attrs: [
    bms('Sts_Run', B, 'Unit running'),
    bms('Alm_Common', B, 'Common alarm'),
    bms('Return_Temp', F, 'Room / return air temperature', { unit: '°C', decimals: 1 }),
    bms('Supply_Temp', F, 'Supply air temperature', { unit: '°C', decimals: 1 }),
    bms('Return_RH', F, 'Return air humidity', { unit: '%', decimals: 0 }),
    bms('Setpoint', F, 'Temperature set point', { unit: '°C', decimals: 1 }),
  ],
};

export const FCU: TemplateDef = {
  name: '$FCU_TC903',
  desc: 'Fan coil unit, SpaceLogic TC903 thermostat with MP300 PIBCV actuator',
  io: 'Modbus RTU (TC903 networked thermostat) via PAS600 gateway',
  attrs: [
    bms('OnOff', B, 'Unit on/off'),
    bms('Room_Temp', F, 'Room temperature (thermostat NTC)', { unit: '°C', decimals: 1 }),
    bms('Setpoint', F, 'Occupant set point', { unit: '°C', decimals: 1 }),
    bms('Fan_Speed', I, 'Fan speed', { states: { 0: 'Auto', 1: 'Low', 2: 'Med', 3: 'High' } }),
    bms('Mode', I, 'Operating mode', { states: { 0: 'Cool', 1: 'Fan', 2: 'Economy' } }),
    bms('Occupied', B, 'Occupied (card-reader / occupancy input)'),
    bms('Valve_Out', F, 'Cooling valve output', { unit: '%', decimals: 0 }),
    bms('Alm_Temp', B, 'Temperature alarm'),
    bms('Comm_OK', B, 'Thermostat communicating'),
  ],
};

export const BTU_TENANT: TemplateDef = {
  name: '$EnergyValve',
  desc: 'Tenant cooling energy meter: SpaceLogic SP90 PIBCV energy valve',
  io: 'Modbus / BACnet MS-TP (SP90 fieldbus actuator) → BMS → AVEVA',
  attrs: [
    bms('Energy_kWh', F, 'Cooling energy totaliser', { unit: 'kWh', decimals: 0 }),
    bms('Power_kW', F, 'Cooling power', { unit: 'kW', decimals: 1 }),
    bms('Flow_m3h', F, 'Water flow', { unit: 'm³/h', decimals: 2 }),
    bms('Supply_Temp', F, 'Supply water temperature (immersion sensor)', { unit: '°C', decimals: 1 }),
    bms('Return_Temp', F, 'Return water temperature', { unit: '°C', decimals: 1 }),
    bms('Valve_Pos', F, 'Valve position', { unit: '%', decimals: 0 }),
    bms('Comm_OK', B, 'Device communicating'),
    calc('DeltaT', F, 'Return − supply', { unit: 'K', decimals: 1 }),
  ],
};

export const BTU_BULK: TemplateDef = {
  name: '$BTU_Meter',
  desc: 'Bulk cooling energy meter: Kamstrup KD series, ultrasonic, DN40–DN65',
  io: 'Modbus RTU (K-series KAMODR module) → AVEVA → cooling billing system',
  attrs: [
    bms('Energy_MWh', F, 'Cooling energy register', { unit: 'MWh', decimals: 2 }),
    bms('Power_kW', F, 'Instantaneous power', { unit: 'kW', decimals: 1 }),
    bms('Flow_m3h', F, 'Flow', { unit: 'm³/h', decimals: 2 }),
    bms('Volume_m3', F, 'Volume register', { unit: 'm³', decimals: 0 }),
    bms('Supply_Temp', F, 'Flow temperature', { unit: '°C', decimals: 1 }),
    bms('Return_Temp', F, 'Return temperature', { unit: '°C', decimals: 1 }),
    bms('Info_Code', I, 'Meter info / error code (0 = OK)'),
    bms('Comm_OK', B, 'Meter communicating'),
  ],
};

export const FAN: TemplateDef = {
  name: '$Fan',
  desc: 'Exhaust / make-up / kitchen make-up fan (DOL)',
  io: 'Hardwired I/O on MP-C: DO 1 · DI 4',
  attrs: [...starter('Fan'), io('Airflow_DPS', B, 'Differential pressure switch: airflow proven (DI)')],
};

export const SMOKE_FAN: TemplateDef = {
  name: '$SmokeFan',
  desc: 'Smoke extract fan (life-safety; fire-mode commanded by the fire alarm panel)',
  io: 'Hardwired I/O on MP-C: DO 1 · DI 4',
  attrs: [...starter('Fan'), io('Airflow_DPS', B, 'Differential pressure switch (DI)'), asm('Fire_Mode', B, 'Fire-alarm override active (FACP interface)')],
};

export const PRESS_FAN: TemplateDef = {
  name: '$StairPressFan',
  desc: 'Stair pressurisation fan with VSD and stair ΔP control',
  io: 'Hardwired I/O on MP-C: AO 1 · AI 2 · DO 1 · DI 4',
  attrs: [
    ...starter('Fan'),
    io('Airflow_DPS', B, 'Differential pressure switch (DI)'),
    io('Speed_Cmd', F, 'VSD speed signal (AO)', { unit: '%', decimals: 0 }),
    io('Speed_Fb', F, 'VSD feedback (AI)', { unit: '%', decimals: 0 }),
    io('Stair_DP', F, 'Stair-case differential pressure transmitter (AI)', { unit: 'Pa', decimals: 0 }),
    asm('Fire_Mode', B, 'Fire-alarm start signal (FACP interface)'),
  ],
};

export const PARK_EXHAUST: TemplateDef = {
  name: '$CarParkExhaustFan',
  desc: 'Car-park exhaust fan with VSD, CO-controlled',
  io: 'Hardwired I/O on MP-C + VSD Modbus RTU (LCP-BS1/BS2)',
  attrs: [
    ...starter('Fan'),
    io('Airflow_DPS', B, 'Differential pressure switch (DI)'),
    io('Speed_Cmd', F, 'VSD speed signal (AO)', { unit: '%', decimals: 0 }),
    io('Speed_Fb', F, 'VSD feedback (AI)', { unit: '%', decimals: 0 }),
    io('Zone_CO', F, 'Zone CO, highest of the zone’s EasyLogic CP sensors (0–250 ppm)', { unit: 'ppm', decimals: 0 }),
    bms('Motor_kW', F, 'Drive output power (VSD Modbus RTU)', { unit: 'kW', decimals: 1 }),
    bms('Energy_kWh', F, 'Drive energy counter (VSD Modbus RTU)', { unit: 'kWh', decimals: 0 }),
  ],
};

export const PARK_SUPPLY: TemplateDef = {
  name: '$CarParkSupplyFan',
  desc: 'Car-park supply (jet / make-up) fan with VSD',
  io: 'Hardwired I/O on MP-C + VSD Modbus RTU (LCP-BS1/BS2)',
  attrs: [
    ...starter('Fan'),
    io('Airflow_DPS', B, 'Differential pressure switch (DI)'),
    io('Speed_Cmd', F, 'VSD speed signal (AO)', { unit: '%', decimals: 0 }),
    io('Speed_Fb', F, 'VSD feedback (AI)', { unit: '%', decimals: 0 }),
    bms('Motor_kW', F, 'Drive output power (VSD Modbus RTU)', { unit: 'kW', decimals: 1 }),
  ],
};

export const SUMP: TemplateDef = {
  name: '$DuplexSumpPumps',
  desc: 'Duplex submersible pump set (2 pumps) with high/low float switch (Basement 02)',
  io: 'Hardwired I/O on MP-C (LCP-BS2): DI 4 + float switch',
  attrs: [
    io('P1_Run', B, 'Pump 1 on/off status (DI)'),
    io('P2_Run', B, 'Pump 2 on/off status (DI)'),
    io('P1_Trip', B, 'Pump 1 power fail / trip (DI)'),
    io('P2_Trip', B, 'Pump 2 power fail / trip (DI)'),
    io('High_Level', B, 'Pit high-level float switch (DI)'),
    io('Low_Level', B, 'Pit low-level float switch (DI)'),
    calc('Starts_Today', I, 'Pump starts counted from status changes'),
  ],
};

/* ---- AVEVA integrations (electrical, transport) ---------------------------------------------- */

export const GENSET: TemplateDef = {
  name: '$Genset',
  desc: 'Diesel generator set',
  io: 'Modbus RTU (genset controller) → AVEVA',
  attrs: [
    av('Sts_Running', B, 'Engine running'),
    av('Sts_Auto', B, 'Controller in Auto (available)'),
    av('GCB_Closed', B, 'Generator breaker closed (on load)'),
    av('Load_kW', F, 'Active power', { unit: 'kW', decimals: 0 }),
    av('Load_Pct', F, 'Load against rating', { unit: '%', decimals: 0 }),
    av('Voltage_LL', F, 'Line voltage', { unit: 'V', decimals: 0 }),
    av('Frequency', F, 'Frequency', { unit: 'Hz', decimals: 2 }),
    av('Fuel_Level', F, 'Day-tank level', { unit: '%', decimals: 0 }),
    av('Battery_V', F, 'Starter battery', { unit: 'V', decimals: 1 }),
    av('Coolant_Temp', F, 'Coolant temperature', { unit: '°C', decimals: 0 }),
    av('Run_Hours', F, 'Engine hours', { unit: 'h', decimals: 0 }),
    av('Alm_Common', B, 'Common warning'),
    av('Alm_Shutdown', B, 'Shutdown alarm'),
  ],
};

export const TRANSFORMER: TemplateDef = {
  name: '$Transformer',
  desc: 'MV/LV distribution transformer',
  io: 'Modbus RTU (temperature relay / protection) → AVEVA',
  attrs: [
    av('Load_Pct', F, 'Loading against rating', { unit: '%', decimals: 0 }),
    av('Winding_Temp', F, 'Winding temperature', { unit: '°C', decimals: 0 }),
    av('Alm_Temp', B, 'Temperature alarm stage'),
    av('Trip_Temp', B, 'Temperature trip stage'),
  ],
};

export const RMU: TemplateDef = {
  name: '$RMU',
  desc: 'Ring main unit (MV)',
  io: 'Modbus RTU → AVEVA',
  attrs: [
    av('Ring1_Closed', B, 'Ring switch 1 closed'),
    av('Ring2_Closed', B, 'Ring switch 2 closed'),
    av('TX_CB_Closed', B, 'Transformer feeder breaker closed'),
    av('Earth_Fault', B, 'Earth-fault passage indicator'),
    av('SF6_Low', B, 'SF6 gas low'),
  ],
};

export const ATS: TemplateDef = {
  name: '$ATS',
  desc: 'Automatic transfer switch',
  io: 'Modbus RTU → AVEVA',
  attrs: [
    av('Position', I, 'Switch position', { states: { 0: 'Mains', 1: 'Generator', 2: 'Off' } }),
    av('Mains_OK', B, 'Normal source available'),
    av('Gen_OK', B, 'Emergency source available'),
    av('Transfers', I, 'Transfer count'),
  ],
};

export const DPM: TemplateDef = {
  name: '$PowerMeter',
  desc: 'Digital power meter on the incomer (MDB / EMDB / MCC / EMCC)',
  io: 'Modbus RTU (DPM by others) → AVEVA',
  attrs: [
    av('kW', F, 'Active power', { unit: 'kW', decimals: 0 }),
    av('kWh', F, 'Active energy import', { unit: 'kWh', decimals: 0 }),
    av('Current_Avg', F, 'Average phase current', { unit: 'A', decimals: 0 }),
    av('Voltage_LL', F, 'Line voltage', { unit: 'V', decimals: 0 }),
    av('PF', F, 'Power factor', { decimals: 2 }),
    av('THD_I', F, 'Current THD', { unit: '%', decimals: 1 }),
    av('Load_Pct', F, 'Load against incomer rating', { unit: '%', decimals: 0 }),
    av('Comm_OK', B, 'Meter communicating'),
  ],
};

export const UPS: TemplateDef = {
  name: '$UPS',
  desc: 'Uninterruptible power supply',
  io: 'Modbus TCP → AVEVA',
  attrs: [
    av('On_Battery', B, 'Running on battery'),
    av('On_Bypass', B, 'On static bypass'),
    av('Load_Pct', F, 'Output load', { unit: '%', decimals: 0 }),
    av('Battery_Pct', F, 'Battery charge', { unit: '%', decimals: 0 }),
    av('Autonomy_Min', F, 'Estimated runtime', { unit: 'min', decimals: 0 }),
    av('Alm_Common', B, 'Common alarm'),
  ],
};

export const ELEVATOR: TemplateDef = {
  name: '$Elevator',
  desc: 'Passenger / service lift',
  io: 'Modbus TCP (lift group controller, vendor map) → AVEVA',
  attrs: [
    av('In_Service', B, 'In normal service'),
    av('Floor', I, 'Car position'),
    av('Direction', I, 'Direction', { states: { 0: 'Idle', 1: 'Up', 2: 'Down' } }),
    av('Door_Open', B, 'Door open'),
    av('Fault', B, 'Lift fault'),
    av('Fire_Recall', B, 'Fire-service recall active'),
    av('Trips_Today', I, 'Trips today'),
    asm('Entrapment', B, 'Passenger alarm / entrapment (vendor dependent)'),
  ],
};

export const ESCALATOR: TemplateDef = {
  name: '$Escalator',
  desc: 'Escalator',
  io: 'Modbus TCP (vendor map) → AVEVA',
  attrs: [
    av('Running', B, 'Running'),
    av('Direction', I, 'Direction', { states: { 1: 'Up', 2: 'Down' } }),
    av('Fault', B, 'Fault / safety chain open'),
    av('E_Stop', B, 'Emergency stop pressed'),
  ],
};

/* ---- Systems by others (assumed content) -------------------------------------------------------- */

export const FACP: TemplateDef = {
  name: '$FireAlarmPanel',
  desc: 'Fire alarm control panel (by others)',
  io: 'BACnet IP → AVEVA (object list assumed)',
  attrs: [
    asm('Fire_Alarm', B, 'Fire alarm (any zone)'),
    asm('Pre_Alarm', B, 'Pre-alarm / verification'),
    asm('Fault', B, 'System fault'),
    asm('Supervisory', B, 'Supervisory (sprinkler valve, pump)'),
    asm('Disabled_Pts', I, 'Disabled devices'),
    asm('Zones_In_Alarm', I, 'Zones in alarm'),
  ],
};

export const PA: TemplateDef = {
  name: '$PublicAddress',
  desc: 'Public address / voice evacuation (by others)',
  io: 'BACnet IP → AVEVA (object list assumed)',
  attrs: [
    asm('Evac_Active', B, 'Evacuation message playing'),
    asm('Alert_Active', B, 'Alert message playing'),
    asm('Amp_Fault', B, 'Amplifier fault'),
    asm('Line_Fault', B, 'Speaker line fault'),
    asm('Zones_Healthy', I, 'Zones healthy'),
  ],
};
