// ---------------------------------------------------------------------------
// Brands and integrations
// ---------------------------------------------------------------------------
import { IMG_LOGO_ANKER, IMG_LOGO_APSYSTEMS, IMG_LOGO_BEEM, IMG_LOGO_ECOFLOW, IMG_LOGO_ENPHASE, IMG_LOGO_FOXESS, IMG_LOGO_FRONIUS, IMG_LOGO_GOODWE, IMG_LOGO_GROWATT, IMG_LOGO_HOYMILES, IMG_LOGO_HUAWEI, IMG_LOGO_MARSTEK, IMG_LOGO_SMA, IMG_LOGO_SOLAREDGE, IMG_LOGO_SOLAX, IMG_LOGO_TESLA, IMG_LOGO_ZENDURE } from "./core.js";

// The integration gives the logo of the header badge and the accent color of the card: [light theme, dark theme].
// The light-theme shades are darker so that tinted buttons keep a contrast of about 3.5:1 on a white card.
export const BRANDS = {
  enphase: { logo: IMG_LOGO_ENPHASE, name: "Enphase", site: "https://enphase.com", accent: ["#b35000", "#ff9a4d"] },
  solaredge: { logo: IMG_LOGO_SOLAREDGE, name: "SolarEdge", site: "https://www.solaredge.com", accent: ["#a3201b", "#ff8a75"] },
  fronius: { logo: IMG_LOGO_FRONIUS, name: "Fronius", site: "https://www.fronius.com", accent: ["#b5121b", "#ff7a80"] },
  huawei: { logo: IMG_LOGO_HUAWEI, name: "Huawei FusionSolar", site: "https://solar.huawei.com", accent: ["#c7000b", "#ff6b70"] },
  sma: { logo: IMG_LOGO_SMA, name: "SMA", site: "https://www.sma.de", accent: ["#0b4f9c", "#5aa0f0"] },
  tesla: { logo: IMG_LOGO_TESLA, name: "Tesla Powerwall", site: "https://www.tesla.com/powerwall", accent: ["#3a3f44", "#c9ced3"] },
  growatt: { logo: IMG_LOGO_GROWATT, name: "Growatt", site: "https://www.growatt.com", accent: ["#127a5b", "#4fd1a5"] },
  apsystems: { logo: IMG_LOGO_APSYSTEMS, name: "APsystems", site: "https://apsystems.com", accent: ["#0d6aa8", "#4fb0ef"] },
  solax: { logo: IMG_LOGO_SOLAX, name: "SolaX", site: "https://www.solaxpower.com", accent: ["#0060a8", "#4ea8f0"] },
  goodwe: { logo: IMG_LOGO_GOODWE, name: "GoodWe", site: "https://www.goodwe.com", accent: ["#b3141a", "#ff7a7f"] },
  foxess: { logo: IMG_LOGO_FOXESS, name: "Fox ESS", site: "https://www.fox-ess.com", accent: ["#00796b", "#4fc3b7"] },
  // Plug-and-play solar: balcony panels on micro-inverters, balcony batteries.
  hoymiles: { logo: IMG_LOGO_HOYMILES, name: "Hoymiles", site: "https://www.hoymiles.com", accent: ["#00796b", "#4fc3b7"], balcony: true },
  ecoflow: { logo: IMG_LOGO_ECOFLOW, name: "EcoFlow", site: "https://www.ecoflow.com", accent: ["#2f5d73", "#7fc4e0"], balcony: true },
  anker: { logo: IMG_LOGO_ANKER, name: "Anker SOLIX", site: "https://www.ankersolix.com", accent: ["#0064c8", "#5fa8ff"], balcony: true },
  zendure: { logo: IMG_LOGO_ZENDURE, name: "Zendure", site: "https://zendure.com", accent: ["#0d7a4f", "#4fd19a"], balcony: true },
  marstek: { logo: IMG_LOGO_MARSTEK, name: "Marstek", site: "https://www.marstekenergy.com", accent: ["#3a3f44", "#c9ced3"], balcony: true },
  beem: { logo: IMG_LOGO_BEEM, name: "Beem", site: "https://beem.energy", accent: ["#c24d00", "#ff9a4d"], balcony: true },
  generic: { logo: null, name: "", site: "", accent: ["#a35f00", "#ffb74d"] },
};

// Integrations the cards know → their brand.
export const PLATFORMS = {
  enphase_envoy: "enphase",
  solaredge: "solaredge",
  solaredge_modbus: "solaredge",
  fronius: "fronius",
  huawei_solar: "huawei",
  sma: "sma",
  powerwall: "tesla",
  growatt_server: "growatt",
  apsystems: "apsystems",
  apsystems_ecu_reader: "apsystems",
  apsystems_modbus: "apsystems",
  solax: "solax",
  goodwe: "goodwe",
  foxess_modbus: "foxess",
  hoymiles_wifi: "hoymiles",
  ecoflow_cloud: "ecoflow",
  anker_solix: "anker",
  zendure_ha: "zendure",
  marstek_local_api: "marstek",
  beem_energy: "beem",
};
export const brandOf = (platform) => PLATFORMS[platform] || "generic";

// Roles the cards read, and the entity domains each one may come from.
//   power (W, kW…): solar, home, grid (+ import / − export), battery (+ discharge / − charge), and the one-way
//                   grid_import, grid_export, battery_charge, battery_discharge
//   direction:      grid_dir ("import" / "export"), battery_dir ("charge" / "discharge"), for unsigned power sensors
//   energy (kWh):   solar_today, home_today, import_today, export_today, charge_today, discharge_today,
//                   battery_energy (stored now), battery_capacity
//   other:          soc (%), reserve (%), mode, status, error, grid_status (binary, on while the grid is up)
export const POWER_ROLES = ["solar", "home", "grid", "grid_import", "grid_export", "battery", "battery_charge", "battery_discharge"];
export const ROLE_DOMAINS = {
  reserve: ["number", "sensor"],
  mode: ["select", "sensor"],
  grid_status: ["binary_sensor"],
};
export const roleDomainOk = (role, domain) => (ROLE_DOMAINS[role] || ["sensor"]).includes(domain);

// Per integration: [key, role] pairs, by order of preference. A key matches the entity's translation_key, else the
// end of its entity id ("…_<key>"), for the integrations that have no translation keys (GoodWe).
export const KEYS = {
  enphase_envoy: [
    ["current_power_production", "solar"],
    ["current_power_consumption", "home"],
    ["balanced_net_consumption", "grid"],
    ["net_consumption", "grid"],
    ["battery_discharge", "battery"],
    ["aggregated_soc", "soc"],
    ["acb_battery_soc", "soc"],
    ["daily_production", "solar_today"],
    ["daily_consumption", "home_today"],
    ["aggregated_available_energy", "battery_energy"],
    ["available_energy", "battery_energy"],
    ["aggregated_max_capacity", "battery_capacity"],
    ["max_capacity", "battery_capacity"],
    ["reserve_soc", "reserve"],
    ["storage_mode", "mode"],
    ["grid_status", "grid_status"],
  ],
  solaredge: [
    ["solar_power", "solar"],
    ["current_power", "solar"],
    ["power_consumption", "home"],
    ["grid_power", "grid"],
    ["grid_flow_direction", "grid_dir"],
    ["storage_power", "battery"],
    ["storage_flow_direction", "battery_dir"],
    ["storage_level", "soc"],
    ["battery_state_of_charge", "soc"],
    ["energy_today", "solar_today"],
    ["production_energy", "solar_today"],
    ["consumption_energy", "home_today"],
    ["purchased_energy", "import_today"],
    ["feedin_energy", "export_today"],
    ["storage_charge_energy", "charge_today"],
    ["storage_discharge_energy", "discharge_today"],
  ],
  fronius: [
    ["power_photovoltaics", "solar"],
    ["power_load", "home"],
    ["power_grid", "grid"],
    ["power_grid_import", "grid_import"],
    ["power_grid_export", "grid_export"],
    ["power_battery", "battery"],
    ["power_battery_charge", "battery_charge"],
    ["power_battery_discharge", "battery_discharge"],
    ["state_of_charge", "soc"],
    ["energy_day", "solar_today"],
    ["capacity_maximum", "battery_capacity"],
    ["battery_minimum_reserve", "reserve"],
    ["inverter_state", "status"],
    ["error_message", "error"],
  ],
  huawei_solar: [
    ["input_power", "solar"],
    ["load_power", "home"],
    ["power_meter_active_power", "grid"],
    ["storage_charge_discharge_power", "battery"],
    ["storage_state_of_capacity", "soc"],
    ["daily_yield_energy", "solar_today"],
    ["consumption_today", "home_today"],
    ["supply_from_grid_today", "import_today"],
    ["feed_in_to_grid_today", "export_today"],
    ["storage_current_day_charge_capacity", "charge_today"],
    ["storage_current_day_discharge_capacity", "discharge_today"],
    ["storage_rated_capacity", "battery_capacity"],
    ["storage_backup_power_state_of_charge", "reserve"],
    ["storage_working_mode_settings", "mode"],
    ["device_status", "status"],
  ],
  sma: [
    ["pv_power", "solar"],
    ["metering_current_consumption", "home"],
    ["metering_power_absorbed", "grid_import"],
    ["metering_power_supplied", "grid_export"],
    ["battery_power_charge_total", "battery_charge"],
    ["battery_power_discharge_total", "battery_discharge"],
    ["battery_soc_total", "soc"],
    ["daily_yield", "solar_today"],
    ["battery_capacity_total", "battery_capacity"],
    ["status", "status"],
  ],
  powerwall: [
    ["solar_instant_power", "solar"],
    ["load_instant_power", "home"],
    ["site_instant_power", "grid"],
    ["battery_instant_power", "battery"],
    ["charge", "soc"],
    ["battery_remaining", "battery_energy"],
    ["battery_capacity", "battery_capacity"],
    ["backup_reserve", "reserve"],
    ["operation_mode", "mode"],
    ["grid_status", "grid_status"],
  ],
  growatt_server: [
    ["mix_wattage_pv_all", "solar"],
    ["mix_load_consumption", "home"],
    ["mix_import_from_grid", "grid_import"],
    ["mix_export_to_grid", "grid_export"],
    ["mix_battery_charge", "battery_charge"],
    ["mix_battery_discharge_w", "battery_discharge"],
    ["mix_statement_of_charge", "soc"],
    ["storage_battery_percentage", "soc"],
    ["mix_solar_generation_today", "solar_today"],
    ["inverter_energy_today", "solar_today"],
    ["mix_load_consumption_today", "home_today"],
    ["mix_import_from_grid_today", "import_today"],
    ["mix_export_to_grid_today", "export_today"],
    ["mix_battery_charge_today", "charge_today"],
    ["mix_battery_discharge_today", "discharge_today"],
  ],
  apsystems: [
    ["total_power", "solar"],
    ["today_production", "solar_today"],
  ],
  // APsystems ECU Reader (ECU-B / ECU-R / ECU-C): no translation keys, entity ids ecu_<ECU id>_<field>. The ECU-C's
  // CTs give the grid (+ import) and the consumption, per phase (A on a single-phase home).
  apsystems_ecu_reader: [
    ["current_power", "solar"],
    ["grid_ct_a", "grid"],
    ["consumed_a", "home"],
    ["today_energy", "solar_today"],
  ],
  // APsystems Modbus (ECU over Modbus TCP): the ECU's totals; its inverters have the same keys (see the via_device
  // preference in resolve).
  apsystems_modbus: [
    ["power", "solar"],
    ["energy_today", "solar_today"],
  ],
  // Fox ESS Modbus: no translation keys, entity ids [<prefix>_]<key>, powers in kW.
  foxess_modbus: [
    ["pv_power_now", "solar"],
    ["load_power", "home"],
    ["grid_consumption", "grid_import"],
    ["feed_in", "grid_export"],
    ["battery_discharge", "battery_discharge"],
    ["battery_charge", "battery_charge"],
    ["battery_soc", "soc"],
    ["solar_energy_today", "solar_today"],
    ["load_energy_today", "home_today"],
    ["grid_consumption_energy_today", "import_today"],
    ["feed_in_energy_today", "export_today"],
    ["battery_charge_today", "charge_today"],
    ["battery_discharge_today", "discharge_today"],
    ["min_soc_on_grid", "reserve"],
    ["work_mode", "mode"],
    ["inverter_state", "status"],
  ],
  goodwe: [
    ["pv_power", "solar"],
    ["house_consumption", "home"],
    ["active_power", "grid"],
    ["battery_power", "battery"],
    ["battery_state_of_charge", "soc"],
    ["today_s_pv_generation", "solar_today"],
    ["todays_pv_generation", "solar_today"],
    ["today_s_load", "home_today"],
    ["work_mode", "status"],
  ],
};
// Plug-and-play solar. Hoymiles (HMS micro-inverters through their DTU, MS-A2 batteries): the DTU's own total comes
// first (its inverters have the same keys, see the via_device preference in resolve). Its phase_total_power is the
// inverters' AC output, not a grid meter: no grid role.
KEYS.hoymiles_wifi = [
  ["ac_active_power", "solar"],
  ["state_of_charge", "soc"],
  ["ac_daily_energy", "solar_today"],
  ["working_mode", "mode"],
];
// EcoFlow Cloud (PowerStream, Delta, River…): no translation keys, entity ids <device>_<name>. Its solar is the sum
// of its inputs (Solar 1 Watts, Solar 2 Watts…, see STRING_KEYS); the PowerStream's battery input is positive while
// the battery discharges into the inverter.
KEYS.ecoflow_cloud = [
  ["battery_input_watts", "battery"],
  ["battery_charge", "soc"],
  ["main_battery_level", "soc"],
  ["battery_level", "soc"],
  ["solar_in_power", "solar"],
];
// Anker SOLIX (Solarbank, smart meter, site totals): the site's totals first, then the Solarbank's own; its battery
// power is positive while charging.
KEYS.anker_solix = [
  ["solar_power_total", "solar"],
  ["solarbank_input_power", "solar"],
  ["home_load_power", "home"],
  ["grid_power_signed", "grid"],
  ["battery_power_signed_total", "battery"],
  ["battery_power_signed", "battery"],
  ["state_of_charge_total", "soc"],
  ["solarbank_state_of_charge", "soc"],
  ["state_of_charge", "soc"],
  ["daily_solar_production", "solar_today"],
  ["daily_home_usage", "home_today"],
  ["daily_grid_import", "import_today"],
  ["daily_export_energy", "export_today"],
  ["daily_charge_energy", "charge_today"],
  ["daily_discharge_energy", "discharge_today"],
  ["battery_energy", "battery_energy"],
];
// Zendure (SolarFlow, Hyper, AIO): translation keys are its property names in snake case.
KEYS.zendure_ha = [
  ["solar_input_power", "solar"],
  ["output_pack_power", "battery_charge"],
  ["pack_input_power", "battery_discharge"],
  ["electric_level", "soc"],
  ["available_kwh", "battery_energy"],
  ["total_kwh", "battery_capacity"],
];
// Marstek Venus (local API): the system's totals when several batteries, else the battery's own. The grid is its
// documented grid_power (+ import); the CT meter's ct_total_power has no documented sign, so it is not read.
KEYS.marstek_local_api = [
  ["system_total_solar_power", "solar"],
  ["pv_power_es", "solar"],
  ["pv_power", "solar"],
  ["grid_power", "grid"],
  ["battery_power_out", "battery_discharge"],
  ["battery_power_in", "battery_charge"],
  ["system_average_soc", "soc"],
  ["battery_soc", "soc"],
  ["battery_available_capacity", "battery_energy"],
  ["battery_rated_capacity", "battery_capacity"],
  ["operating_mode", "mode"],
];
// Beem (Beem On / Beem Battery): no translation keys on its sensors, entity ids <device>_<name>. The sign of its grid
// and battery powers is not documented: only its production and battery level are read (`entities` sets the rest).
KEYS.beem_energy = [
  ["solar_power", "solar"],
  ["soc", "soc"],
];
KEYS.solaredge_modbus = KEYS.solaredge;

// Power of each panel input (string, micro-inverter channel), shown with `show_strings`: matched on the translation
// key, else on the end of the entity id.
export const STRING_KEYS = {
  apsystems_ecu_reader: /_power_ch_\d+$/,
  apsystems_modbus: /^dc_power$/,
  foxess_modbus: /(^|_)pv\d+_power$/,
  huawei_solar: /^pv_\d+_power$|_pv_\d+_power$/,
  goodwe: /_ppv\d+$/,
  hoymiles_wifi: /^port_dc_power$/,
  ecoflow_cloud: /_solar_\d_watts$/,
  zendure_ha: /^solar_power\d$/,
};
export const isString = (e, domain) => {
  const re = STRING_KEYS[e.platform];
  return !!re && domain === "sensor" && (re.test(e.translation_key || "") || re.test(e.entity_id.slice(domain.length + 1)));
};

// Sign of the integration's signed power sensors, when it is not the cards' own (grid + import, battery + discharge):
// Huawei Solar's power meter is positive when exporting and its battery positive when charging; GoodWe's active power
// is positive when exporting; Anker SOLIX's and Beem's batteries are positive when charging.
export const SIGNS = { huawei_solar: { grid: -1, battery: -1 }, goodwe: { grid: -1 }, anker_solix: { battery: -1 } };

// Unmapped power sensors of an unknown integration: their role guessed from the entity id and name.
export const GUESSES = [
  [/battery|storage|batt/, "battery"],
  [/solar|pv|photovolt|production|yield|generation/, "solar"],
  [/grid|meter|net_|site/, "grid"],
  [/load|consumption|house|home/, "home"],
];

export const DEFAULT_COLLAPSED = ["options"];
// Energy sensors of the last 7 days: production and consumption, and with `solar_sources` the grid and battery ones
// for the balance.
export const WEEK_ROLES = ["solar_today", "home_today", "import_today", "export_today", "charge_today", "discharge_today"];
export const PENDING_MS = 30000;
// Below this, a flow is drawn at rest (inverter standby draw, meter noise).
export const FLOW_MIN_W = 10;

// Colors of the flows, as in Home Assistant's energy dashboard.
export const COLORS = { solar: "#ff9800", grid: "#488fc2", export: "#8353d1", battery: "#4db6ac", charge: "#f06292", home: "#8d6e63" };

export const ICONS = {
  // mdi:white-balance-sunny
  solar:
    "M3.55,18.54L4.96,19.95L6.76,18.16L5.34,16.74M11,22.45C11.32,22.45 13,22.45 13,22.45V19.5H11M12,5.5A6,6 0 0,0 6,11.5A6,6 0 0,0 12,17.5A6,6 0 0,0 18,11.5C18,8.18 15.31,5.5 12,5.5M20,12.5H23V10.5H20M17.24,18.16L19.04,19.95L20.45,18.54L18.66,16.74M20.45,4.46L19.04,3.05L17.24,4.84L18.66,6.26M13,0.55H11V3.5H13M4,10.5H1V12.5H4M6.76,4.84L4.96,3.05L3.55,4.46L5.34,6.26L6.76,4.84Z",
  // mdi:transmission-tower
  grid: "M8.28,5.45L6.5,4.55L7.76,2H16.23L17.5,4.55L15.72,5.44L15,4H9L8.28,5.45M18.62,8H14.09L13.3,5H10.7L9.91,8H5.38L4.1,10.55L5.89,11.44L6.62,10H17.38L18.1,11.45L19.89,10.56L18.62,8M17.77,22H15.7L15.46,21.1L12,15.9L8.53,21.1L8.3,22H6.23L9.12,11H11.19L10.83,12.35L12,14.1L13.16,12.35L12.81,11H14.88L17.77,22M11.4,15L10.5,13.65L9.32,18.13L11.4,15M14.68,18.12L13.5,13.64L12.6,15L14.68,18.12Z",
  home: "M10,20V14H14V20H19V12H22L12,3L2,12H5V20H10Z",
  battery: "M16.67,4H15V2H9V4H7.33A1.33,1.33 0 0,0 6,5.33V20.67C6,21.4 6.6,22 7.33,22H16.67A1.33,1.33 0 0,0 18,20.67V5.33C18,4.6 17.4,4 16.67,4Z",
  // mdi:flash (header icon)
  flash: "M7,2V13H10V22L17,10H13L17,2H7Z",
  // mdi:solar-panel
  panel: "M4,2H20A2,2 0 0,1 22,4V14A2,2 0 0,1 20,16H15V20H18V22H13V16H11V22H6V20H9V16H4A2,2 0 0,1 2,14V4A2,2 0 0,1 4,2M4,4V8H11V4H4M4,14H11V10H4V14M20,14V10H13V14H20M20,4H13V8H20V4Z",
  bolt: "M11,15H6L13,1V9H18L11,23V15Z",
  down: "M11,4H13V16L18.5,10.5L19.92,11.92L12,19.84L4.08,11.92L5.5,10.5L11,16V4Z",
  up: "M13,20H11V8L5.5,13.5L4.08,12.08L12,4.16L19.92,12.08L18.5,13.5L13,8V20Z",
  leaf: "M17,8C8,10 5.9,16.17 3.82,21.34L5.71,22L6.66,19.7C7.14,19.87 7.64,20 8,20C19,20 22,3 22,3C21,5 14,5.25 9,6.25C4,7.25 2,11.5 2,13.5C2,15.5 3.75,17.25 3.75,17.25C7,8 17,8 17,8Z",
  shield: "M12,1L3,5V11C3,16.55 6.84,21.74 12,23C17.16,21.74 21,16.55 21,11V5L12,1Z",
  clock:
    "M12,20A8,8 0 0,0 20,12A8,8 0 0,0 12,4A8,8 0 0,0 4,12A8,8 0 0,0 12,20M12,2A10,10 0 0,1 22,12A10,10 0 0,1 12,22C6.47,22 2,17.5 2,12A10,10 0 0,1 12,2M12.5,7V12.25L17,14.92L16.25,16.15L11,13V7H12.5Z",
  calendar: "M19,19H5V8H19M16,1V3H8V1H6V3H5C3.89,3 3,3.89 3,5V19A2,2 0 0,0 5,21H19A2,2 0 0,0 21,19V5C21,3.89 20.1,3 19,3H18V1M17,12H12V17H17V12Z",
  mode: "M3,3H11V11H3V3M13,3H21V11H13V3M3,13H11V21H3V13M18,13H16V16H13V18H16V21H18V18H21V16H18V13Z",
  options: "M3,17V19H9V17H3M3,5V7H13V5H3M13,21V19H21V17H13V15H11V21H13M7,9V11H3V13H7V15H9V9H7M21,13V11H11V13H21M15,9H17V7H21V5H17V3H15V9Z",
  alert: "M13 14H11V9H13M13 18H11V16H13M1 21H23L12 2L1 21Z",
  chevron_down: "M7.41,8.58L12,13.17L16.59,8.58L18,10L12,16L6,10L7.41,8.58Z",
  // mdi:arrow-expand and mdi:arrow-collapse (mini card detail button)
  expand: "M10,21V19H6.41L10.91,14.5L9.5,13.09L5,17.59V14H3V21H10M14.5,10.91L19,6.41V10H21V3H14V5H17.59L13.09,9.5L14.5,10.91Z",
  collapse: "M19.5,3.09L15,7.59V4H13V11H20V9H16.41L20.91,4.5L19.5,3.09M4,13V15H7.59L3.09,19.5L4.5,20.91L9,16.41V20H11V13H4Z",
  capacity: "M3,3H21V21H3V3M5,5V19H19V5H5M7,13H17V17H7V13Z",
  // mdi:sun-clock (forecast) and mdi:piggy-bank-outline (savings)
  forecast:
    "M18.1 9.3L19.6 6L15.5 5.6C16.1 6.1 16.6 6.7 17 7.5C17.3 8.1 17.5 8.6 17.7 9.2C17.2 9.1 16.6 9 16 9H15.6C14.8 7.2 13.1 6 11 6C8.2 6 6 8.2 6 11C6 13.1 7.2 14.8 9 15.6V16C9 19.9 12.1 23 16 23S23 19.9 23 16C23 12.9 20.9 10.2 18.1 9.3M16 21C13.2 21 11 18.8 11 16S13.2 11 16 11 21 13.2 21 16 18.8 21 16 21M16.5 16.2L19.4 17.9L18.6 19.1L15 17V12H16.5V16.2M11 4C10.2 4 9.4 4.2 8.6 4.4L11 1L13.4 4.4C12.6 4.2 11.8 4 11 4M4.9 14.5C5.3 15.2 5.9 15.9 6.5 16.4L2.4 16L4.2 12.2C4.3 13 4.5 13.8 4.9 14.5M4.1 9.8L2.3 6L6.5 5.7C5.9 6.2 5.4 6.8 4.9 7.5C4.5 8.2 4.2 9 4.1 9.8Z",
  savings:
    "M15 10C15 9.45 15.45 9 16 9S17 9.45 17 10 16.55 11 16 11 15 10.55 15 10M8 9H13V7H8V9M22 7.5V14.5L19.18 15.44L17.5 21H12V19H10V21H4.5C4.5 21 2 12.54 2 9.5S4.46 4 7.5 4H12.5C13.41 2.79 14.86 2 16.5 2C17.33 2 18 2.67 18 3.5C18 3.71 17.96 3.9 17.88 4.08C17.74 4.42 17.62 4.81 17.56 5.23L19.83 7.5H22M20 9.5H19L15.5 6C15.5 5.35 15.59 4.71 15.76 4.09C14.79 4.34 14 5.06 13.67 6H7.5C5.57 6 4 7.57 4 9.5C4 11.38 5.22 16.15 6 19H8V17H14V19H16L17.56 13.85L20 13.03V9.5Z",
};
