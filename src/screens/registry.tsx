import { lazy, type ComponentType, type LazyExoticComponent } from 'react';
import { SourceNote } from '@/screens/central/kit';

type Screen = LazyExoticComponent<ComponentType>;
const named = <K extends string>(loader: () => Promise<Record<K, ComponentType>>, key: K): Screen =>
  lazy(() => loader().then((m) => ({ default: m[key] })));

const command = () => import('@/screens/central/CommandScreens');
const hvac = () => import('@/screens/central/HvacScreens');
const power = () => import('@/screens/central/PowerMeteringScreens');
const safety = () => import('@/screens/central/SafetyFacilitiesScreens');
/** CCTV and access control are in the AVEVA matrix (BACnet IP) but their content is by others: badge them as assumed. */
const security = () =>
  import('@/screens/security/SecurityScreens').then((m) => {
    const wrap = (S: ComponentType) => () => (
      <>
        <S />
        <SourceNote tiers={['assumed']}>CCTV and access control are integrated to AVEVA over BACnet IP; cameras, doors and events shown are illustrative.</SourceNote>
      </>
    );
    return { CctvScreen: wrap(m.CctvScreen), AccessScreen: wrap(m.AccessScreen) };
  });

/** Screen for each `${system}/${subsystem}` route. */
export const SCREENS: Record<string, Screen> = {
  'command/executive': named(command, 'ExecutiveScreen'),
  'command/operations': named(command, 'OperationsScreen'),
  'command/kpis': named(command, 'KpiRegisterScreen'),
  'command/sops': named(command, 'SopLibraryScreen'),
  'command/coverage': named(command, 'CoverageScreen'),
  'hvac/plant': named(hvac, 'ChillerPlantScreen'),
  'hvac/towers': named(hvac, 'HeatRejectionScreen'),
  'hvac/air': named(hvac, 'AirHandlingScreen'),
  'hvac/fcu': named(hvac, 'FcuScreen'),
  'hvac/carpark': named(hvac, 'CarParkScreen'),
  'hvac/ventilation': named(hvac, 'VentilationScreen'),
  'electric/mv': named(power, 'MvScreen'),
  'electric/distribution': named(power, 'DistributionScreen'),
  'electric/standby': named(power, 'StandbyScreen'),
  'electric/ups': named(power, 'UpsScreen'),
  'electric/sld': lazy(() => import('@/screens/electric/ElectricSldScreen').then((m) => ({ default: m.ElectricSldScreen }))),
  'metering/btu': named(power, 'CoolingMetersScreen'),
  'metering/billing': named(power, 'CoolingBillingScreen'),
  'metering/energy': named(power, 'EnergyScreen'),
  'safety/fire': named(safety, 'FireAlarmScreen'),
  'safety/smoke': named(safety, 'SmokeControlScreen'),
  'safety/pa': named(safety, 'PublicAddressScreen'),
  'security/cctv': named(security, 'CctvScreen'),
  'security/access': named(security, 'AccessScreen'),
  'facilities/transport': named(safety, 'TransportScreen'),
  'facilities/drainage': named(safety, 'DrainageScreen'),
  'facilities/lighting': named(safety, 'LightingScreen'),
  'cafm/orders': named(safety, 'WorkOrdersScreen'),
  'cafm/ppm': named(safety, 'PpmScreen'),
  'cafm/assets': named(safety, 'AssetRegisterScreen'),
};
