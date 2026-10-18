# Central — Asset & Point Basis

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

## Served equipment per zone (from the EL)

| Type | B01 | B02 | B03 | B04 | B05 | B06 | B07 | BS | Total | Data tier |
|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|---|
| Chillers | · | · | · | · | · | · | · | 6 | 6 | Proven · BMS hardwired I/O |
| Primary CHW pumps | · | · | · | · | · | · | · | 7 | 7 | Proven · BMS hardwired I/O |
| Condenser-water pumps | · | · | · | · | · | · | · | 7 | 7 | Proven · BMS hardwired I/O |
| Cooling towers | · | · | 6 | · | · | · | · | · | 6 | Proven · BMS hardwired I/O |
| Expansion tanks & water treatment | · | · | · | · | · | · | · | 4 | 4 | Proven · BMS hardwired I/O |
| Fresh air handling units | 4 | 4 | 4 | 4 | 4 | 1 | 5 | · | 26 | Proven · BMS hardwired I/O |
| Air handling units | · | · | · | · | · | 4 | · | · | 4 | Proven · BMS hardwired I/O |
| Computer room A/C | · | · | · | · | · | · | · | 2 | 2 | Proven · BMS integration |
| Fan coil units | 56 | 56 | 50 | 58 | 64 | 9 | 10 | 352 | 655 | Proven · BMS integration |
| Tenant energy valves (SP90) | 97 | 97 | 173 | 107 | 107 | 8 | 1 | · | 590 | Proven · BMS integration |
| Bulk BTU meters (Kamstrup) | 8 | 8 | 3 | 11 | 11 | 7 | 17 | · | 65 | Proven · BMS integration |
| Exhaust fans | 2 | 2 | 2 | 2 | 2 | 1 | 10 | · | 21 | Proven · BMS hardwired I/O |
| Make-up fans | 4 | 4 | 4 | 4 | 4 | · | · | · | 20 | Proven · BMS hardwired I/O |
| Kitchen make-up fans | · | · | · | · | · | · | 17 | · | 17 | Proven · BMS hardwired I/O |
| Smoke extract fans | 2 | 2 | 2 | 2 | 2 | · | · | · | 10 | Proven · BMS hardwired I/O |
| Stair pressurisation fans | 4 | 4 | 4 | 4 | 4 | · | · | · | 20 | Proven · BMS hardwired I/O |
| Car-park exhaust fans | · | · | · | · | · | · | · | 96 | 96 | Proven · BMS hardwired I/O |
| Car-park supply fans | · | · | · | · | · | · | · | 96 | 96 | Proven · BMS hardwired I/O |
| Duplex submersible pump sets | · | · | · | · | · | · | · | 32 | 32 | Proven · BMS hardwired I/O |
| Generators | 2 | 2 | 2 | 2 | 2 | 1 | 2 | 6 | 19 | In scope · AVEVA integration |
| Transformers | 2 | 2 | 2 | 2 | 2 | 1 | 2 | 9 | 22 | In scope · AVEVA integration |
| Ring main units | 2 | 2 | 2 | 2 | 2 | 1 | 2 | 9 | 22 | In scope · AVEVA integration |
| Transfer switches | 2 | 2 | 2 | 2 | 2 | 1 | 2 | 7 | 20 | In scope · AVEVA integration |
| Main distribution boards | 2 | 2 | 2 | 2 | 2 | 1 | 2 | 9 | 22 | In scope · AVEVA integration |
| Emergency MDBs | 2 | 2 | 2 | 2 | 2 | 1 | 2 | 6 | 19 | In scope · AVEVA integration |
| Motor control centres | 2 | 2 | 2 | 2 | 2 | 1 | 5 | 7 | 23 | In scope · AVEVA integration |
| Emergency MCCs | 2 | 2 | 2 | 2 | 2 | 1 | 2 | 76 | 89 | In scope · AVEVA integration |
| UPS units | · | · | · | · | · | · | · | 9 | 9 | In scope · AVEVA integration |
| Elevators | 9 | 9 | 8 | 9 | 9 | 5 | 5 | · | 54 | In scope · AVEVA integration |
| Escalators | · | · | · | · | · | · | · | 19 | 19 | In scope · AVEVA integration |
| Fire alarm panels | 1 | 1 | 1 | 1 | 1 | 1 | 1 | 1 | 8 | Assumed · system by others |
| Public address racks | 1 | 1 | 1 | 1 | 1 | 1 | 1 | 1 | 8 | Assumed · system by others |

## Point templates

### $Chiller — Water-cooled chiller, central plant (Basement 01)

Interface: Hardwired I/O on AS-P (LCP-BS1-03) + BACnet IP to the chiller controller

| Attribute | Type | Unit | Description | Tier |
|---|---|---|---|---|
| Cmd_Start | Boolean |  | Chiller enable (DO) | Proven · BMS hardwired I/O |
| Sts_Run | Boolean |  | Chiller on/off status (DI) | Proven · BMS hardwired I/O |
| Alm_Fault | Boolean |  | Normal / fault (DI) | Proven · BMS hardwired I/O |
| Cmd_CHW_Valve | Boolean |  | Evaporator butterfly valve open command (DO) | Proven · BMS hardwired I/O |
| Sts_CHW_Valve | Boolean |  | Evaporator butterfly valve feedback (DI) | Proven · BMS hardwired I/O |
| Cmd_CW_Valve | Boolean |  | Condenser butterfly valve open command (DO) | Proven · BMS hardwired I/O |
| Sts_CW_Valve | Boolean |  | Condenser butterfly valve feedback (DI) | Proven · BMS hardwired I/O |
| CHW_Flow_Sw | Boolean |  | Evaporator liquid flow switch (DI) | Proven · BMS hardwired I/O |
| CW_Flow_Sw | Boolean |  | Condenser liquid flow switch (DI) | Proven · BMS hardwired I/O |
| CHWS_Temp | Float | °C | Leaving chilled-water temperature (immersion sensor) | Proven · BMS hardwired I/O |
| CHWR_Temp | Float | °C | Entering chilled-water temperature (immersion sensor) | Proven · BMS hardwired I/O |
| CHW_Press | Float | kPa | Evaporator pressure (transmitter 0–1000 kPa) | Proven · BMS hardwired I/O |
| CWS_Temp | Float | °C | Condenser water entering temperature | Proven · BMS hardwired I/O |
| CWR_Temp | Float | °C | Condenser water leaving temperature | Proven · BMS hardwired I/O |
| Load_Pct | Float | % | Compressor load (% RLA), chiller BACnet object | Proven · BMS integration |
| Power_kW | Float | kW | Chiller input power, chiller BACnet object | Proven · BMS integration |
| CHW_Setpoint | Float | °C | Active leaving-water set point, chiller BACnet object | Proven · BMS integration |
| Run_Hours | Float | h | Compressor run hours, chiller BACnet object | Proven · BMS integration |
| Cooling_TR | Float | TR | Evaporator duty from ΔT and the plant BTU share | Calculated |
| kW_per_TR | Float | kW/TR | Chiller efficiency | Calculated |

### $CHW_Pump — Primary chilled-water pump with VSD (6 duty + 1 standby)

Interface: Hardwired I/O on AS-P + VSD Modbus RTU (LCP-BS1-03)

| Attribute | Type | Unit | Description | Tier |
|---|---|---|---|---|
| Cmd_Start | Boolean |  | Pump start/stop command (DO) | Proven · BMS hardwired I/O |
| Sts_Run | Boolean |  | Pump on/off status (DI) | Proven · BMS hardwired I/O |
| Sts_Auto | Boolean |  | MCC hand/auto selector in Auto (DI) | Proven · BMS hardwired I/O |
| Alm_Trip | Boolean |  | Power fail / overload trip (DI) | Proven · BMS hardwired I/O |
| Flow_DPS | Boolean |  | Differential pressure switch: flow proven (DI) | Proven · BMS hardwired I/O |
| Speed_Cmd | Float | % | VSD speed signal (AO) | Proven · BMS hardwired I/O |
| Speed_Fb | Float | % | VSD speed feedback (AI) | Proven · BMS hardwired I/O |
| Motor_kW | Float | kW | Drive output power (VSD Modbus RTU) | Proven · BMS integration |
| Motor_Current | Float | A | Motor current (VSD Modbus RTU) | Proven · BMS integration |
| Energy_kWh | Float | kWh | Drive energy counter (VSD Modbus RTU) | Proven · BMS integration |
| Run_Hours | Float | h | Drive run hours (VSD Modbus RTU) | Proven · BMS integration |
| Fault_Code | Integer |  | Last drive fault code (VSD Modbus RTU) | Proven · BMS integration |

### $CW_Pump — Condenser-water pump (6 duty + 1 standby)

Interface: Hardwired I/O on AS-P (LCP-BS1-03)

| Attribute | Type | Unit | Description | Tier |
|---|---|---|---|---|
| Cmd_Start | Boolean |  | Pump start/stop command (DO) | Proven · BMS hardwired I/O |
| Sts_Run | Boolean |  | Pump on/off status (DI) | Proven · BMS hardwired I/O |
| Sts_Auto | Boolean |  | MCC hand/auto selector in Auto (DI) | Proven · BMS hardwired I/O |
| Alm_Trip | Boolean |  | Power fail / overload trip (DI) | Proven · BMS hardwired I/O |
| Flow_DPS | Boolean |  | Differential pressure switch: flow proven (DI) | Proven · BMS hardwired I/O |
| Speed_Cmd | Float | % | VSD speed signal (AO) | Proven · BMS hardwired I/O |
| Speed_Fb | Float | % | VSD speed feedback (AI) | Proven · BMS hardwired I/O |
| Run_Hours | Float | h | Run hours totalised from Sts_Run | Calculated |

### $CoolingTower — Cooling tower cell with fan VSD (Building 03 roof)

Interface: Hardwired I/O on MP-C (LCP-B03-ROOF-01/02)

| Attribute | Type | Unit | Description | Tier |
|---|---|---|---|---|
| Cmd_Start | Boolean |  | Fan start/stop command (DO) | Proven · BMS hardwired I/O |
| Sts_Run | Boolean |  | Fan on/off status (DI) | Proven · BMS hardwired I/O |
| Sts_Auto | Boolean |  | MCC hand/auto selector in Auto (DI) | Proven · BMS hardwired I/O |
| Alm_Trip | Boolean |  | Power fail / overload trip (DI) | Proven · BMS hardwired I/O |
| Speed_Cmd | Float | % | Fan VSD speed signal (AO) | Proven · BMS hardwired I/O |
| Speed_Fb | Float | % | Fan VSD speed feedback (AI) | Proven · BMS hardwired I/O |
| Basin_Level_Sw | Boolean |  | Basin low-level switch (DI) | Proven · BMS hardwired I/O |
| Cmd_Valve | Boolean |  | Inlet butterfly valve command (DO) | Proven · BMS hardwired I/O |
| Sts_Valve | Boolean |  | Inlet butterfly valve feedback (DI) | Proven · BMS hardwired I/O |
| CW_Out_Temp | Float | °C | Tower leaving water temperature | Proven · BMS hardwired I/O |
| Approach_K | Float | K | Leaving water minus outdoor wet bulb (SHO2 sensor) | Calculated |

### $PlantPackage — Packaged plant equipment: expansion tank & pressurisation unit, water treatment station

Interface: Hardwired I/O on AS-P (LCP-BS1-03)

| Attribute | Type | Unit | Description | Tier |
|---|---|---|---|---|
| Sts_Normal | Boolean |  | Package healthy (DI) | Proven · BMS hardwired I/O |
| Alm_Fault | Boolean |  | Package general fault (DI) | Proven · BMS hardwired I/O |

### $FAHU — Fresh air handling unit, chilled-water coil with PIBCV

Interface: Hardwired I/O on MP-C (roof LCP): AO 1 · AI 2 · DO 2 · DI 8

| Attribute | Type | Unit | Description | Tier |
|---|---|---|---|---|
| Cmd_Start | Boolean |  | Supply fan start/stop command (DO) | Proven · BMS hardwired I/O |
| Sts_Run | Boolean |  | Supply fan on/off status (DI) | Proven · BMS hardwired I/O |
| Sts_Auto | Boolean |  | MCC hand/auto selector in Auto (DI) | Proven · BMS hardwired I/O |
| Alm_Trip | Boolean |  | Power fail / overload trip (DI) | Proven · BMS hardwired I/O |
| Airflow_DPS | Boolean |  | Fan differential pressure switch: airflow proven (DI) | Proven · BMS hardwired I/O |
| PreFilter_DPS | Boolean |  | Pre-filter dirty, ΔP switch (DI) | Proven · BMS hardwired I/O |
| BagFilter_DPS | Boolean |  | Bag filter dirty, ΔP switch (DI) | Proven · BMS hardwired I/O |
| Smoke_Det | Boolean |  | Duct smoke detector (DI) | Proven · BMS hardwired I/O |
| Cmd_Damper | Boolean |  | Fresh-air damper open command, spring return (DO) | Proven · BMS hardwired I/O |
| Sts_Damper | Boolean |  | Fresh-air damper end switch (DI) | Proven · BMS hardwired I/O |
| Valve_Cmd | Float | % | PIBCV modulating command (AO) | Proven · BMS hardwired I/O |
| Valve_Fb | Float | % | PIBCV actuator feedback (AI) | Proven · BMS hardwired I/O |
| Supply_Temp | Float | °C | Supply air temperature, duct sensor (AI) | Proven · BMS hardwired I/O |
| Supply_Setpoint | Float | °C | Supply air set point (BMS program) | Calculated |

### $AHU — Air handling unit with return air and modulating mixing dampers (Building 06)

Interface: Hardwired I/O on MP-C (LCP-B06-ROOF-01): AO 3 · AI 5 · DO 2 · DI 8

| Attribute | Type | Unit | Description | Tier |
|---|---|---|---|---|
| Cmd_Start | Boolean |  | Supply fan start/stop command (DO) | Proven · BMS hardwired I/O |
| Sts_Run | Boolean |  | Supply fan on/off status (DI) | Proven · BMS hardwired I/O |
| Sts_Auto | Boolean |  | MCC hand/auto selector in Auto (DI) | Proven · BMS hardwired I/O |
| Alm_Trip | Boolean |  | Power fail / overload trip (DI) | Proven · BMS hardwired I/O |
| Airflow_DPS | Boolean |  | Fan differential pressure switch (DI) | Proven · BMS hardwired I/O |
| PreFilter_DPS | Boolean |  | Pre-filter dirty (DI) | Proven · BMS hardwired I/O |
| BagFilter_DPS | Boolean |  | Bag filter dirty (DI) | Proven · BMS hardwired I/O |
| Smoke_Det_Supply | Boolean |  | Supply duct smoke detector (DI) | Proven · BMS hardwired I/O |
| Smoke_Det_Return | Boolean |  | Return duct smoke detector (DI) | Proven · BMS hardwired I/O |
| FA_Damper_Cmd | Float | % | Fresh-air damper modulating command (AO) | Proven · BMS hardwired I/O |
| FA_Damper_Fb | Float | % | Fresh-air damper feedback (AI) | Proven · BMS hardwired I/O |
| RA_Damper_Cmd | Float | % | Return-air damper modulating command (AO) | Proven · BMS hardwired I/O |
| Valve_Cmd | Float | % | PIBCV modulating command (AO) | Proven · BMS hardwired I/O |
| Valve_Fb | Float | % | PIBCV feedback (AI) | Proven · BMS hardwired I/O |
| Supply_Temp | Float | °C | Supply air temperature (AI) | Proven · BMS hardwired I/O |
| Return_Temp | Float | °C | Return air temperature (AI) | Proven · BMS hardwired I/O |

### $CRAC — Computer room air conditioner (Basement 01)

Interface: BACnet IP software interface (unit controller)

| Attribute | Type | Unit | Description | Tier |
|---|---|---|---|---|
| Sts_Run | Boolean |  | Unit running | Proven · BMS integration |
| Alm_Common | Boolean |  | Common alarm | Proven · BMS integration |
| Return_Temp | Float | °C | Room / return air temperature | Proven · BMS integration |
| Supply_Temp | Float | °C | Supply air temperature | Proven · BMS integration |
| Return_RH | Float | % | Return air humidity | Proven · BMS integration |
| Setpoint | Float | °C | Temperature set point | Proven · BMS integration |

### $FCU_TC903 — Fan coil unit, SpaceLogic TC903 thermostat with MP300 PIBCV actuator

Interface: Modbus RTU (TC903 networked thermostat) via PAS600 gateway

| Attribute | Type | Unit | Description | Tier |
|---|---|---|---|---|
| OnOff | Boolean |  | Unit on/off | Proven · BMS integration |
| Room_Temp | Float | °C | Room temperature (thermostat NTC) | Proven · BMS integration |
| Setpoint | Float | °C | Occupant set point | Proven · BMS integration |
| Fan_Speed | Integer |  | Fan speed | Proven · BMS integration |
| Mode | Integer |  | Operating mode | Proven · BMS integration |
| Occupied | Boolean |  | Occupied (card-reader / occupancy input) | Proven · BMS integration |
| Valve_Out | Float | % | Cooling valve output | Proven · BMS integration |
| Alm_Temp | Boolean |  | Temperature alarm | Proven · BMS integration |
| Comm_OK | Boolean |  | Thermostat communicating | Proven · BMS integration |

### $EnergyValve — Tenant cooling energy meter: SpaceLogic SP90 PIBCV energy valve

Interface: Modbus / BACnet MS-TP (SP90 fieldbus actuator) → BMS → AVEVA

| Attribute | Type | Unit | Description | Tier |
|---|---|---|---|---|
| Energy_kWh | Float | kWh | Cooling energy totaliser | Proven · BMS integration |
| Power_kW | Float | kW | Cooling power | Proven · BMS integration |
| Flow_m3h | Float | m³/h | Water flow | Proven · BMS integration |
| Supply_Temp | Float | °C | Supply water temperature (immersion sensor) | Proven · BMS integration |
| Return_Temp | Float | °C | Return water temperature | Proven · BMS integration |
| Valve_Pos | Float | % | Valve position | Proven · BMS integration |
| Comm_OK | Boolean |  | Device communicating | Proven · BMS integration |
| DeltaT | Float | K | Return − supply | Calculated |

### $BTU_Meter — Bulk cooling energy meter: Kamstrup KD series, ultrasonic, DN40–DN65

Interface: Modbus RTU (K-series KAMODR module) → AVEVA → cooling billing system

| Attribute | Type | Unit | Description | Tier |
|---|---|---|---|---|
| Energy_MWh | Float | MWh | Cooling energy register | Proven · BMS integration |
| Power_kW | Float | kW | Instantaneous power | Proven · BMS integration |
| Flow_m3h | Float | m³/h | Flow | Proven · BMS integration |
| Volume_m3 | Float | m³ | Volume register | Proven · BMS integration |
| Supply_Temp | Float | °C | Flow temperature | Proven · BMS integration |
| Return_Temp | Float | °C | Return temperature | Proven · BMS integration |
| Info_Code | Integer |  | Meter info / error code (0 = OK) | Proven · BMS integration |
| Comm_OK | Boolean |  | Meter communicating | Proven · BMS integration |

### $Fan — Exhaust / make-up / kitchen make-up fan (DOL)

Interface: Hardwired I/O on MP-C: DO 1 · DI 4

| Attribute | Type | Unit | Description | Tier |
|---|---|---|---|---|
| Cmd_Start | Boolean |  | Fan start/stop command (DO) | Proven · BMS hardwired I/O |
| Sts_Run | Boolean |  | Fan on/off status (DI) | Proven · BMS hardwired I/O |
| Sts_Auto | Boolean |  | MCC hand/auto selector in Auto (DI) | Proven · BMS hardwired I/O |
| Alm_Trip | Boolean |  | Power fail / overload trip (DI) | Proven · BMS hardwired I/O |
| Airflow_DPS | Boolean |  | Differential pressure switch: airflow proven (DI) | Proven · BMS hardwired I/O |

### $SmokeFan — Smoke extract fan (life-safety; fire-mode commanded by the fire alarm panel)

Interface: Hardwired I/O on MP-C: DO 1 · DI 4

| Attribute | Type | Unit | Description | Tier |
|---|---|---|---|---|
| Cmd_Start | Boolean |  | Fan start/stop command (DO) | Proven · BMS hardwired I/O |
| Sts_Run | Boolean |  | Fan on/off status (DI) | Proven · BMS hardwired I/O |
| Sts_Auto | Boolean |  | MCC hand/auto selector in Auto (DI) | Proven · BMS hardwired I/O |
| Alm_Trip | Boolean |  | Power fail / overload trip (DI) | Proven · BMS hardwired I/O |
| Airflow_DPS | Boolean |  | Differential pressure switch (DI) | Proven · BMS hardwired I/O |
| Fire_Mode | Boolean |  | Fire-alarm override active (FACP interface) | Assumed · system by others |

### $StairPressFan — Stair pressurisation fan with VSD and stair ΔP control

Interface: Hardwired I/O on MP-C: AO 1 · AI 2 · DO 1 · DI 4

| Attribute | Type | Unit | Description | Tier |
|---|---|---|---|---|
| Cmd_Start | Boolean |  | Fan start/stop command (DO) | Proven · BMS hardwired I/O |
| Sts_Run | Boolean |  | Fan on/off status (DI) | Proven · BMS hardwired I/O |
| Sts_Auto | Boolean |  | MCC hand/auto selector in Auto (DI) | Proven · BMS hardwired I/O |
| Alm_Trip | Boolean |  | Power fail / overload trip (DI) | Proven · BMS hardwired I/O |
| Airflow_DPS | Boolean |  | Differential pressure switch (DI) | Proven · BMS hardwired I/O |
| Speed_Cmd | Float | % | VSD speed signal (AO) | Proven · BMS hardwired I/O |
| Speed_Fb | Float | % | VSD feedback (AI) | Proven · BMS hardwired I/O |
| Stair_DP | Float | Pa | Stair-case differential pressure transmitter (AI) | Proven · BMS hardwired I/O |
| Fire_Mode | Boolean |  | Fire-alarm start signal (FACP interface) | Assumed · system by others |

### $CarParkExhaustFan — Car-park exhaust fan with VSD, CO-controlled

Interface: Hardwired I/O on MP-C + VSD Modbus RTU (LCP-BS1/BS2)

| Attribute | Type | Unit | Description | Tier |
|---|---|---|---|---|
| Cmd_Start | Boolean |  | Fan start/stop command (DO) | Proven · BMS hardwired I/O |
| Sts_Run | Boolean |  | Fan on/off status (DI) | Proven · BMS hardwired I/O |
| Sts_Auto | Boolean |  | MCC hand/auto selector in Auto (DI) | Proven · BMS hardwired I/O |
| Alm_Trip | Boolean |  | Power fail / overload trip (DI) | Proven · BMS hardwired I/O |
| Airflow_DPS | Boolean |  | Differential pressure switch (DI) | Proven · BMS hardwired I/O |
| Speed_Cmd | Float | % | VSD speed signal (AO) | Proven · BMS hardwired I/O |
| Speed_Fb | Float | % | VSD feedback (AI) | Proven · BMS hardwired I/O |
| Zone_CO | Float | ppm | Zone CO, highest of the zone’s EasyLogic CP sensors (0–250 ppm) | Proven · BMS hardwired I/O |
| Motor_kW | Float | kW | Drive output power (VSD Modbus RTU) | Proven · BMS integration |
| Energy_kWh | Float | kWh | Drive energy counter (VSD Modbus RTU) | Proven · BMS integration |

### $CarParkSupplyFan — Car-park supply (jet / make-up) fan with VSD

Interface: Hardwired I/O on MP-C + VSD Modbus RTU (LCP-BS1/BS2)

| Attribute | Type | Unit | Description | Tier |
|---|---|---|---|---|
| Cmd_Start | Boolean |  | Fan start/stop command (DO) | Proven · BMS hardwired I/O |
| Sts_Run | Boolean |  | Fan on/off status (DI) | Proven · BMS hardwired I/O |
| Sts_Auto | Boolean |  | MCC hand/auto selector in Auto (DI) | Proven · BMS hardwired I/O |
| Alm_Trip | Boolean |  | Power fail / overload trip (DI) | Proven · BMS hardwired I/O |
| Airflow_DPS | Boolean |  | Differential pressure switch (DI) | Proven · BMS hardwired I/O |
| Speed_Cmd | Float | % | VSD speed signal (AO) | Proven · BMS hardwired I/O |
| Speed_Fb | Float | % | VSD feedback (AI) | Proven · BMS hardwired I/O |
| Motor_kW | Float | kW | Drive output power (VSD Modbus RTU) | Proven · BMS integration |

### $DuplexSumpPumps — Duplex submersible pump set (2 pumps) with high/low float switch (Basement 02)

Interface: Hardwired I/O on MP-C (LCP-BS2): DI 4 + float switch

| Attribute | Type | Unit | Description | Tier |
|---|---|---|---|---|
| P1_Run | Boolean |  | Pump 1 on/off status (DI) | Proven · BMS hardwired I/O |
| P2_Run | Boolean |  | Pump 2 on/off status (DI) | Proven · BMS hardwired I/O |
| P1_Trip | Boolean |  | Pump 1 power fail / trip (DI) | Proven · BMS hardwired I/O |
| P2_Trip | Boolean |  | Pump 2 power fail / trip (DI) | Proven · BMS hardwired I/O |
| High_Level | Boolean |  | Pit high-level float switch (DI) | Proven · BMS hardwired I/O |
| Low_Level | Boolean |  | Pit low-level float switch (DI) | Proven · BMS hardwired I/O |
| Starts_Today | Integer |  | Pump starts counted from status changes | Calculated |

### $Genset — Diesel generator set

Interface: Modbus RTU (genset controller) → AVEVA

| Attribute | Type | Unit | Description | Tier |
|---|---|---|---|---|
| Sts_Running | Boolean |  | Engine running | In scope · AVEVA integration |
| Sts_Auto | Boolean |  | Controller in Auto (available) | In scope · AVEVA integration |
| GCB_Closed | Boolean |  | Generator breaker closed (on load) | In scope · AVEVA integration |
| Load_kW | Float | kW | Active power | In scope · AVEVA integration |
| Load_Pct | Float | % | Load against rating | In scope · AVEVA integration |
| Voltage_LL | Float | V | Line voltage | In scope · AVEVA integration |
| Frequency | Float | Hz | Frequency | In scope · AVEVA integration |
| Fuel_Level | Float | % | Day-tank level | In scope · AVEVA integration |
| Battery_V | Float | V | Starter battery | In scope · AVEVA integration |
| Coolant_Temp | Float | °C | Coolant temperature | In scope · AVEVA integration |
| Run_Hours | Float | h | Engine hours | In scope · AVEVA integration |
| Alm_Common | Boolean |  | Common warning | In scope · AVEVA integration |
| Alm_Shutdown | Boolean |  | Shutdown alarm | In scope · AVEVA integration |

### $Transformer — MV/LV distribution transformer

Interface: Modbus RTU (temperature relay / protection) → AVEVA

| Attribute | Type | Unit | Description | Tier |
|---|---|---|---|---|
| Load_Pct | Float | % | Loading against rating | In scope · AVEVA integration |
| Winding_Temp | Float | °C | Winding temperature | In scope · AVEVA integration |
| Alm_Temp | Boolean |  | Temperature alarm stage | In scope · AVEVA integration |
| Trip_Temp | Boolean |  | Temperature trip stage | In scope · AVEVA integration |

### $RMU — Ring main unit (MV)

Interface: Modbus RTU → AVEVA

| Attribute | Type | Unit | Description | Tier |
|---|---|---|---|---|
| Ring1_Closed | Boolean |  | Ring switch 1 closed | In scope · AVEVA integration |
| Ring2_Closed | Boolean |  | Ring switch 2 closed | In scope · AVEVA integration |
| TX_CB_Closed | Boolean |  | Transformer feeder breaker closed | In scope · AVEVA integration |
| Earth_Fault | Boolean |  | Earth-fault passage indicator | In scope · AVEVA integration |
| SF6_Low | Boolean |  | SF6 gas low | In scope · AVEVA integration |

### $ATS — Automatic transfer switch

Interface: Modbus RTU → AVEVA

| Attribute | Type | Unit | Description | Tier |
|---|---|---|---|---|
| Position | Integer |  | Switch position | In scope · AVEVA integration |
| Mains_OK | Boolean |  | Normal source available | In scope · AVEVA integration |
| Gen_OK | Boolean |  | Emergency source available | In scope · AVEVA integration |
| Transfers | Integer |  | Transfer count | In scope · AVEVA integration |

### $PowerMeter — Digital power meter on the incomer (MDB / EMDB / MCC / EMCC)

Interface: Modbus RTU (DPM by others) → AVEVA

| Attribute | Type | Unit | Description | Tier |
|---|---|---|---|---|
| kW | Float | kW | Active power | In scope · AVEVA integration |
| kWh | Float | kWh | Active energy import | In scope · AVEVA integration |
| Current_Avg | Float | A | Average phase current | In scope · AVEVA integration |
| Voltage_LL | Float | V | Line voltage | In scope · AVEVA integration |
| PF | Float |  | Power factor | In scope · AVEVA integration |
| THD_I | Float | % | Current THD | In scope · AVEVA integration |
| Load_Pct | Float | % | Load against incomer rating | In scope · AVEVA integration |
| Comm_OK | Boolean |  | Meter communicating | In scope · AVEVA integration |

### $UPS — Uninterruptible power supply

Interface: Modbus TCP → AVEVA

| Attribute | Type | Unit | Description | Tier |
|---|---|---|---|---|
| On_Battery | Boolean |  | Running on battery | In scope · AVEVA integration |
| On_Bypass | Boolean |  | On static bypass | In scope · AVEVA integration |
| Load_Pct | Float | % | Output load | In scope · AVEVA integration |
| Battery_Pct | Float | % | Battery charge | In scope · AVEVA integration |
| Autonomy_Min | Float | min | Estimated runtime | In scope · AVEVA integration |
| Alm_Common | Boolean |  | Common alarm | In scope · AVEVA integration |

### $Elevator — Passenger / service lift

Interface: Modbus TCP (lift group controller, vendor map) → AVEVA

| Attribute | Type | Unit | Description | Tier |
|---|---|---|---|---|
| In_Service | Boolean |  | In normal service | In scope · AVEVA integration |
| Floor | Integer |  | Car position | In scope · AVEVA integration |
| Direction | Integer |  | Direction | In scope · AVEVA integration |
| Door_Open | Boolean |  | Door open | In scope · AVEVA integration |
| Fault | Boolean |  | Lift fault | In scope · AVEVA integration |
| Fire_Recall | Boolean |  | Fire-service recall active | In scope · AVEVA integration |
| Trips_Today | Integer |  | Trips today | In scope · AVEVA integration |
| Entrapment | Boolean |  | Passenger alarm / entrapment (vendor dependent) | Assumed · system by others |

### $Escalator — Escalator

Interface: Modbus TCP (vendor map) → AVEVA

| Attribute | Type | Unit | Description | Tier |
|---|---|---|---|---|
| Running | Boolean |  | Running | In scope · AVEVA integration |
| Direction | Integer |  | Direction | In scope · AVEVA integration |
| Fault | Boolean |  | Fault / safety chain open | In scope · AVEVA integration |
| E_Stop | Boolean |  | Emergency stop pressed | In scope · AVEVA integration |

### $FireAlarmPanel — Fire alarm control panel (by others)

Interface: BACnet IP → AVEVA (object list assumed)

| Attribute | Type | Unit | Description | Tier |
|---|---|---|---|---|
| Fire_Alarm | Boolean |  | Fire alarm (any zone) | Assumed · system by others |
| Pre_Alarm | Boolean |  | Pre-alarm / verification | Assumed · system by others |
| Fault | Boolean |  | System fault | Assumed · system by others |
| Supervisory | Boolean |  | Supervisory (sprinkler valve, pump) | Assumed · system by others |
| Disabled_Pts | Integer |  | Disabled devices | Assumed · system by others |
| Zones_In_Alarm | Integer |  | Zones in alarm | Assumed · system by others |

### $PublicAddress — Public address / voice evacuation (by others)

Interface: BACnet IP → AVEVA (object list assumed)

| Attribute | Type | Unit | Description | Tier |
|---|---|---|---|---|
| Evac_Active | Boolean |  | Evacuation message playing | Assumed · system by others |
| Alert_Active | Boolean |  | Alert message playing | Assumed · system by others |
| Amp_Fault | Boolean |  | Amplifier fault | Assumed · system by others |
| Line_Fault | Boolean |  | Speaker line fault | Assumed · system by others |
| Zones_Healthy | Integer |  | Zones healthy | Assumed · system by others |
