/*
 * Energy Card for Home Assistant
 * https://github.com/juju35/ha-energy-card
 *
 * Lovelace cards for solar inverters and home batteries, whatever the integration: Enphase Envoy, SolarEdge, Fronius,
 * Huawei Solar (https://github.com/wlcrs/huawei_solar), SMA, Tesla Powerwall, Growatt, APsystems, SolaX, GoodWe and
 * any other integration that provides power sensors. Entities are resolved through the entity registry (platform and
 * translation_key, else the end of the entity id), so they work whatever the Home Assistant language or entity ids;
 * every role can also be set by hand (`entities:`).
 */

const VERSION = "__VERSION__";
const IMG_LOGO_ENPHASE = "__IMG_LOGO_ENPHASE__";
const IMG_LOGO_SOLAREDGE = "__IMG_LOGO_SOLAREDGE__";
const IMG_LOGO_FRONIUS = "__IMG_LOGO_FRONIUS__";
const IMG_LOGO_HUAWEI = "__IMG_LOGO_HUAWEI__";
const IMG_LOGO_SMA = "__IMG_LOGO_SMA__";
const IMG_LOGO_TESLA = "__IMG_LOGO_TESLA__";
const IMG_LOGO_GROWATT = "__IMG_LOGO_GROWATT__";
const IMG_LOGO_APSYSTEMS = "__IMG_LOGO_APSYSTEMS__";
const IMG_LOGO_SOLAX = "__IMG_LOGO_SOLAX__";
const IMG_LOGO_GOODWE = "__IMG_LOGO_GOODWE__";

// ---------------------------------------------------------------------------
// Brands and integrations
// ---------------------------------------------------------------------------

// The integration gives the logo of the header badge and the accent color of the card: [light theme, dark theme].
// The light-theme shades are darker so that tinted buttons keep a contrast of about 3.5:1 on a white card.
const BRANDS = {
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
  generic: { logo: null, name: "", site: "", accent: ["#a35f00", "#ffb74d"] },
};

// Integrations the cards know → their brand.
const PLATFORMS = {
  enphase_envoy: "enphase",
  solaredge: "solaredge",
  solaredge_modbus: "solaredge",
  fronius: "fronius",
  huawei_solar: "huawei",
  sma: "sma",
  powerwall: "tesla",
  growatt_server: "growatt",
  apsystems: "apsystems",
  solax: "solax",
  goodwe: "goodwe",
};
const brandOf = (platform) => PLATFORMS[platform] || "generic";

// Roles the cards read, and the entity domains each one may come from.
//   power (W, kW…): solar, home, grid (+ import / − export), battery (+ discharge / − charge), and the one-way
//                   grid_import, grid_export, battery_charge, battery_discharge
//   direction:      grid_dir ("import" / "export"), battery_dir ("charge" / "discharge"), for unsigned power sensors
//   energy (kWh):   solar_today, home_today, import_today, export_today, charge_today, discharge_today,
//                   battery_energy (stored now), battery_capacity
//   other:          soc (%), reserve (%), mode, status, error, grid_status (binary, on while the grid is up)
const POWER_ROLES = ["solar", "home", "grid", "grid_import", "grid_export", "battery", "battery_charge", "battery_discharge"];
const ROLE_DOMAINS = {
  reserve: ["number", "sensor"],
  mode: ["select", "sensor"],
  grid_status: ["binary_sensor"],
};
const roleDomainOk = (role, domain) => (ROLE_DOMAINS[role] || ["sensor"]).includes(domain);

// Per integration: [key, role] pairs, by order of preference. A key matches the entity's translation_key, else the
// end of its entity id ("…_<key>"), for the integrations that have no translation keys (GoodWe).
const KEYS = {
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
KEYS.solaredge_modbus = KEYS.solaredge;

// Sign of the integration's signed power sensors, when it is not the cards' own (grid + import, battery + discharge):
// Huawei Solar's power meter is positive when exporting and its battery positive when charging; GoodWe's active power
// is positive when exporting.
const SIGNS = { huawei_solar: { grid: -1, battery: -1 }, goodwe: { grid: -1 } };

// Unmapped power sensors of an unknown integration: their role guessed from the entity id and name.
const GUESSES = [
  [/battery|storage|batt/, "battery"],
  [/solar|pv|photovolt|production|yield|generation/, "solar"],
  [/grid|meter|net_|site/, "grid"],
  [/load|consumption|house|home/, "home"],
];

const DEFAULT_COLLAPSED = ["options"];
const PENDING_MS = 30000;
// Below this, a flow is drawn at rest (inverter standby draw, meter noise).
const FLOW_MIN_W = 10;

// Colors of the flows, as in Home Assistant's energy dashboard.
const COLORS = { solar: "#ff9800", grid: "#488fc2", export: "#8353d1", battery: "#4db6ac", charge: "#f06292", home: "#8d6e63" };

const ICONS = {
  // mdi:white-balance-sunny
  solar:
    "M3.55,18.54L4.96,19.95L6.76,18.16L5.34,16.74M11,22.45C11.32,22.45 13,22.45 13,22.45V19.5H11M12,5.5A6,6 0 0,0 6,11.5A6,6 0 0,0 12,17.5A6,6 0 0,0 18,11.5C18,8.18 15.31,5.5 12,5.5M20,12.5H23V10.5H20M17.24,18.16L19.04,19.95L20.45,18.54L18.66,16.74M20.45,4.46L19.04,3.05L17.24,4.84L18.66,6.26M13,0.55H11V3.5H13M4,10.5H1V12.5H4M6.76,4.84L4.96,3.05L3.55,4.46L5.34,6.26L6.76,4.84Z",
  // mdi:transmission-tower
  grid: "M8.28,5.45L6.5,4.55L7.76,2H16.23L17.5,4.55L15.72,5.44L15,4H9L8.28,5.45M18.62,8H14.09L13.3,5H10.7L9.91,8H5.38L4.1,10.55L5.89,11.44L6.62,10H17.38L18.1,11.45L19.89,10.56L18.62,8M17.77,22H15.7L15.46,21.1L12,15.9L8.53,21.1L8.3,22H6.23L9.12,11H11.19L10.83,12.35L12,14.1L13.16,12.35L12.81,11H14.88L17.77,22M11.4,15L10.5,13.65L9.32,18.13L11.4,15M14.68,18.12L13.5,13.64L12.6,15L14.68,18.12Z",
  home: "M10,20V14H14V20H19V12H22L12,3L2,12H5V20H10Z",
  battery: "M16.67,4H15V2H9V4H7.33A1.33,1.33 0 0,0 6,5.33V20.67C6,21.4 6.6,22 7.33,22H16.67A1.33,1.33 0 0,0 18,20.67V5.33C18,4.6 17.4,4 16.67,4Z",
  // mdi:solar-panel (header icon)
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
};

const STRINGS = {
  en: {
    solar: "Solar",
    grid: "Grid",
    home: "Home",
    battery: "Battery",
    import: "Import",
    export: "Export",
    charging: "Charging",
    discharging: "Discharging",
    idle: "Idle",
    producing: "Producing",
    not_producing: "Not producing",
    grid_outage: "Grid outage",
    self_sufficient: "{pct} % self-sufficient today",
    flow: "Power flow",
    today: "Today",
    produced: "Produced",
    consumed: "Consumed",
    imported: "Imported",
    exported: "Exported",
    charged: "Charged",
    discharged: "Discharged",
    self_consumption: "Self-consumption",
    self_sufficiency: "Self-sufficiency",
    full_in: "full in {time}",
    empty_in: "empty in {time}",
    reserve: "Reserve {pct} %",
    options: "Options",
    on: "On",
    off: "Off",
    cancel: "Cancel",
    turn_on: "Turn on",
    turn_off: "Turn off",
    confirm_on: "Turn on {name}?",
    confirm_off: "Turn off {name}?",
    no_registry: "Home Assistant registries are not available",
    no_system: "No solar or battery integration found",
    unknown_integration: "Integration not found",
    zoom_in: "Show details",
    zoom_out: "Show less",
    integration: "Integration",
    title: "Title",
    show_flow: "Power flow",
    show_title: "Title",
    show_subtitle: "Subtitle",
    show_battery: "Battery",
    show_today: "Today's energy",
    show_week: "Last 7 days (production and consumption per day)",
    week: "Last 7 days",
    show_options: "Options",
    show_controls: "Controls",
    invert_grid: "Grid power is positive when exporting",
    invert_battery: "Battery power is positive when charging",
    collapsed: "Folded sections",
    language: "Language",
    lang_auto: "Automatic",
    zoom: "Detail button",
    zoom_helper: "Switches the mini card to the full card and back",
    entities: "Entities (optional)",
    soc: "Battery level",
  },
  fr: {
    solar: "Solaire",
    grid: "Réseau",
    home: "Maison",
    battery: "Batterie",
    import: "Import",
    export: "Export",
    charging: "En charge",
    discharging: "En décharge",
    idle: "Au repos",
    producing: "En production",
    not_producing: "Pas de production",
    grid_outage: "Coupure réseau",
    self_sufficient: "Autonomie de {pct} % aujourd'hui",
    flow: "Flux d'énergie",
    today: "Aujourd'hui",
    produced: "Produite",
    consumed: "Consommée",
    imported: "Importée",
    exported: "Exportée",
    charged: "Chargée",
    discharged: "Déchargée",
    self_consumption: "Autoconsommation",
    self_sufficiency: "Autonomie",
    full_in: "pleine dans {time}",
    empty_in: "vide dans {time}",
    reserve: "Réserve {pct} %",
    options: "Options",
    on: "Activé",
    off: "Désactivé",
    cancel: "Annuler",
    turn_on: "Activer",
    turn_off: "Désactiver",
    confirm_on: "Activer {name} ?",
    confirm_off: "Désactiver {name} ?",
    no_registry: "Les registres de Home Assistant ne sont pas disponibles",
    no_system: "Aucune intégration solaire ou batterie trouvée",
    unknown_integration: "Intégration introuvable",
    zoom_in: "Afficher le détail",
    zoom_out: "Réduire",
    integration: "Intégration",
    title: "Titre",
    show_flow: "Flux d'énergie",
    show_title: "Titre",
    show_subtitle: "Sous-titre",
    show_battery: "Batterie",
    show_today: "Énergie du jour",
    show_week: "7 derniers jours (production et consommation par jour)",
    week: "7 derniers jours",
    show_options: "Options",
    show_controls: "Commandes",
    invert_grid: "Puissance réseau positive en export",
    invert_battery: "Puissance batterie positive en charge",
    collapsed: "Sections repliées",
    language: "Langue",
    lang_auto: "Automatique",
    zoom: "Bouton détail",
    zoom_helper: "Bascule la mini-carte vers la carte complète et inversement",
    entities: "Entités (facultatif)",
    soc: "Niveau de batterie",
  },
  de: {
    solar: "Solar",
    grid: "Netz",
    home: "Haus",
    battery: "Batterie",
    import: "Bezug",
    export: "Einspeisung",
    charging: "Lädt",
    discharging: "Entlädt",
    idle: "Ruhe",
    producing: "Produziert",
    not_producing: "Keine Produktion",
    grid_outage: "Netzausfall",
    self_sufficient: "Heute {pct} % autark",
    flow: "Energiefluss",
    today: "Heute",
    produced: "Erzeugt",
    consumed: "Verbraucht",
    imported: "Bezogen",
    exported: "Eingespeist",
    charged: "Geladen",
    discharged: "Entladen",
    self_consumption: "Eigenverbrauch",
    self_sufficiency: "Autarkie",
    full_in: "voll in {time}",
    empty_in: "leer in {time}",
    reserve: "Reserve {pct} %",
    options: "Optionen",
    on: "An",
    off: "Aus",
    cancel: "Abbrechen",
    turn_on: "Einschalten",
    turn_off: "Ausschalten",
    confirm_on: "{name} einschalten?",
    confirm_off: "{name} ausschalten?",
    no_registry: "Die Registries von Home Assistant sind nicht verfügbar",
    no_system: "Keine Solar- oder Batterie-Integration gefunden",
    unknown_integration: "Integration nicht gefunden",
    zoom_in: "Details anzeigen",
    zoom_out: "Weniger anzeigen",
    integration: "Integration",
    title: "Titel",
    show_flow: "Energiefluss",
    show_title: "Titel",
    show_subtitle: "Untertitel",
    show_battery: "Batterie",
    show_today: "Energie heute",
    show_week: "Letzte 7 Tage (Erzeugung und Verbrauch pro Tag)",
    week: "Letzte 7 Tage",
    show_options: "Optionen",
    show_controls: "Steuerung",
    invert_grid: "Netzleistung ist bei Einspeisung positiv",
    invert_battery: "Batterieleistung ist beim Laden positiv",
    collapsed: "Eingeklappte Bereiche",
    language: "Sprache",
    lang_auto: "Automatisch",
    zoom: "Detail-Schaltfläche",
    zoom_helper: "Schaltet die Mini-Karte auf die vollständige Karte um und zurück",
    entities: "Entitäten (optional)",
    soc: "Batteriestand",
  },
  es: {
    solar: "Solar",
    grid: "Red",
    home: "Casa",
    battery: "Batería",
    import: "Importación",
    export: "Exportación",
    charging: "Cargando",
    discharging: "Descargando",
    idle: "En reposo",
    producing: "Produciendo",
    not_producing: "Sin producción",
    grid_outage: "Corte de red",
    self_sufficient: "Autosuficiencia del {pct} % hoy",
    flow: "Flujo de energía",
    today: "Hoy",
    produced: "Producida",
    consumed: "Consumida",
    imported: "Importada",
    exported: "Exportada",
    charged: "Cargada",
    discharged: "Descargada",
    self_consumption: "Autoconsumo",
    self_sufficiency: "Autosuficiencia",
    full_in: "llena en {time}",
    empty_in: "vacía en {time}",
    reserve: "Reserva {pct} %",
    options: "Opciones",
    on: "Activado",
    off: "Desactivado",
    cancel: "Cancelar",
    turn_on: "Activar",
    turn_off: "Desactivar",
    confirm_on: "¿Activar {name}?",
    confirm_off: "¿Desactivar {name}?",
    no_registry: "Los registros de Home Assistant no están disponibles",
    no_system: "No se encontró ninguna integración solar o de batería",
    unknown_integration: "Integración no encontrada",
    zoom_in: "Mostrar detalles",
    zoom_out: "Mostrar menos",
    integration: "Integración",
    title: "Título",
    show_flow: "Flujo de energía",
    show_title: "Título",
    show_subtitle: "Subtítulo",
    show_battery: "Batería",
    show_today: "Energía de hoy",
    show_week: "Últimos 7 días (producción y consumo por día)",
    week: "Últimos 7 días",
    show_options: "Opciones",
    show_controls: "Controles",
    invert_grid: "La potencia de red es positiva al exportar",
    invert_battery: "La potencia de batería es positiva al cargar",
    collapsed: "Secciones plegadas",
    language: "Idioma",
    lang_auto: "Automático",
    zoom: "Botón de detalle",
    zoom_helper: "Cambia la minitarjeta a la tarjeta completa y viceversa",
    entities: "Entidades (opcional)",
    soc: "Nivel de batería",
  },
  sr: {
    solar: "Соларно",
    grid: "Мрежа",
    home: "Кућа",
    battery: "Батерија",
    import: "Увоз",
    export: "Извоз",
    charging: "Пуни се",
    discharging: "Празни се",
    idle: "Мирује",
    producing: "Производи",
    not_producing: "Нема производње",
    grid_outage: "Нестанак мреже",
    self_sufficient: "Данас {pct} % самодовољно",
    flow: "Ток енергије",
    today: "Данас",
    produced: "Произведено",
    consumed: "Потрошено",
    imported: "Увезено",
    exported: "Извезено",
    charged: "Напуњено",
    discharged: "Испражњено",
    self_consumption: "Сопствена потрошња",
    self_sufficiency: "Самодовољност",
    full_in: "пуна за {time}",
    empty_in: "празна за {time}",
    reserve: "Резерва {pct} %",
    options: "Опције",
    on: "Укључено",
    off: "Искључено",
    cancel: "Откажи",
    turn_on: "Укључи",
    turn_off: "Искључи",
    confirm_on: "Укључити {name}?",
    confirm_off: "Искључити {name}?",
    no_registry: "Регистри Home Assistant-а нису доступни",
    no_system: "Није пронађена ниједна соларна или батеријска интеграција",
    unknown_integration: "Интеграција није пронађена",
    zoom_in: "Прикажи детаље",
    zoom_out: "Прикажи мање",
    integration: "Интеграција",
    title: "Наслов",
    show_flow: "Ток енергије",
    show_title: "Наслов",
    show_subtitle: "Поднаслов",
    show_battery: "Батерија",
    show_today: "Данашња енергија",
    show_week: "Последњих 7 дана (производња и потрошња по дану)",
    week: "Последњих 7 дана",
    show_options: "Опције",
    show_controls: "Команде",
    invert_grid: "Снага мреже је позитивна при извозу",
    invert_battery: "Снага батерије је позитивна при пуњењу",
    collapsed: "Скупљени одељци",
    language: "Језик",
    lang_auto: "Аутоматски",
    zoom: "Дугме за детаље",
    zoom_helper: "Пребацује мини картицу на пуну картицу и назад",
    entities: "Ентитети (опционо)",
    soc: "Ниво батерије",
  },
  "sr-Latn": {
    solar: "Solarno",
    grid: "Mreža",
    home: "Kuća",
    battery: "Baterija",
    import: "Uvoz",
    export: "Izvoz",
    charging: "Puni se",
    discharging: "Prazni se",
    idle: "Miruje",
    producing: "Proizvodi",
    not_producing: "Nema proizvodnje",
    grid_outage: "Nestanak mreže",
    self_sufficient: "Danas {pct} % samodovoljno",
    flow: "Tok energije",
    today: "Danas",
    produced: "Proizvedeno",
    consumed: "Potrošeno",
    imported: "Uvezeno",
    exported: "Izvezeno",
    charged: "Napunjeno",
    discharged: "Ispražnjeno",
    self_consumption: "Sopstvena potrošnja",
    self_sufficiency: "Samodovoljnost",
    full_in: "puna za {time}",
    empty_in: "prazna za {time}",
    reserve: "Rezerva {pct} %",
    options: "Opcije",
    on: "Uključeno",
    off: "Isključeno",
    cancel: "Otkaži",
    turn_on: "Uključi",
    turn_off: "Isključi",
    confirm_on: "Uključiti {name}?",
    confirm_off: "Isključiti {name}?",
    no_registry: "Registri Home Assistant-a nisu dostupni",
    no_system: "Nije pronađena nijedna solarna ili baterijska integracija",
    unknown_integration: "Integracija nije pronađena",
    zoom_in: "Prikaži detalje",
    zoom_out: "Prikaži manje",
    integration: "Integracija",
    title: "Naslov",
    show_flow: "Tok energije",
    show_title: "Naslov",
    show_subtitle: "Podnaslov",
    show_battery: "Baterija",
    show_today: "Današnja energija",
    show_week: "Poslednjih 7 dana (proizvodnja i potrošnja po danu)",
    week: "Poslednjih 7 dana",
    show_options: "Opcije",
    show_controls: "Komande",
    invert_grid: "Snaga mreže je pozitivna pri izvozu",
    invert_battery: "Snaga baterije je pozitivna pri punjenju",
    collapsed: "Skupljeni odeljci",
    language: "Jezik",
    lang_auto: "Automatski",
    zoom: "Dugme za detalje",
    zoom_helper: "Prebacuje mini karticu na punu karticu i nazad",
    entities: "Entiteti (opciono)",
    soc: "Nivo baterije",
  },
  it: {
    solar: "Solare",
    grid: "Rete",
    home: "Casa",
    battery: "Batteria",
    import: "Prelievo",
    export: "Immissione",
    charging: "In carica",
    discharging: "In scarica",
    idle: "A riposo",
    producing: "In produzione",
    not_producing: "Nessuna produzione",
    grid_outage: "Interruzione di rete",
    self_sufficient: "Autosufficienza del {pct} % oggi",
    flow: "Flusso di energia",
    today: "Oggi",
    produced: "Prodotta",
    consumed: "Consumata",
    imported: "Prelevata",
    exported: "Immessa",
    charged: "Caricata",
    discharged: "Scaricata",
    self_consumption: "Autoconsumo",
    self_sufficiency: "Autosufficienza",
    full_in: "carica in {time}",
    empty_in: "scarica in {time}",
    reserve: "Riserva {pct} %",
    options: "Opzioni",
    on: "Attivo",
    off: "Disattivo",
    cancel: "Annulla",
    turn_on: "Attiva",
    turn_off: "Disattiva",
    confirm_on: "Attivare {name}?",
    confirm_off: "Disattivare {name}?",
    no_registry: "I registri di Home Assistant non sono disponibili",
    no_system: "Nessuna integrazione solare o batteria trovata",
    unknown_integration: "Integrazione non trovata",
    zoom_in: "Mostra dettagli",
    zoom_out: "Mostra meno",
    integration: "Integrazione",
    title: "Titolo",
    show_flow: "Flusso di energia",
    show_title: "Titolo",
    show_subtitle: "Sottotitolo",
    show_battery: "Batteria",
    show_today: "Energia di oggi",
    show_week: "Ultimi 7 giorni (produzione e consumo al giorno)",
    week: "Ultimi 7 giorni",
    show_options: "Opzioni",
    show_controls: "Comandi",
    invert_grid: "La potenza di rete è positiva in immissione",
    invert_battery: "La potenza della batteria è positiva in carica",
    collapsed: "Sezioni chiuse",
    language: "Lingua",
    lang_auto: "Automatica",
    zoom: "Pulsante dettagli",
    zoom_helper: "Passa dalla mini scheda alla scheda completa e viceversa",
    entities: "Entità (facoltativo)",
    soc: "Livello batteria",
  },
  nl: {
    solar: "Zon",
    grid: "Net",
    home: "Huis",
    battery: "Batterij",
    import: "Afname",
    export: "Teruglevering",
    charging: "Laden",
    discharging: "Ontladen",
    idle: "Inactief",
    producing: "Produceert",
    not_producing: "Geen productie",
    grid_outage: "Netuitval",
    self_sufficient: "Vandaag {pct} % zelfvoorzienend",
    flow: "Energiestroom",
    today: "Vandaag",
    produced: "Opgewekt",
    consumed: "Verbruikt",
    imported: "Afgenomen",
    exported: "Teruggeleverd",
    charged: "Geladen",
    discharged: "Ontladen",
    self_consumption: "Eigen verbruik",
    self_sufficiency: "Zelfvoorziening",
    full_in: "vol over {time}",
    empty_in: "leeg over {time}",
    reserve: "Reserve {pct} %",
    options: "Opties",
    on: "Aan",
    off: "Uit",
    cancel: "Annuleren",
    turn_on: "Inschakelen",
    turn_off: "Uitschakelen",
    confirm_on: "{name} inschakelen?",
    confirm_off: "{name} uitschakelen?",
    no_registry: "De registers van Home Assistant zijn niet beschikbaar",
    no_system: "Geen zonne- of batterij-integratie gevonden",
    unknown_integration: "Integratie niet gevonden",
    zoom_in: "Details tonen",
    zoom_out: "Minder tonen",
    integration: "Integratie",
    title: "Titel",
    show_flow: "Energiestroom",
    show_title: "Titel",
    show_subtitle: "Ondertitel",
    show_battery: "Batterij",
    show_today: "Energie vandaag",
    show_week: "Laatste 7 dagen (opwek en verbruik per dag)",
    week: "Laatste 7 dagen",
    show_options: "Opties",
    show_controls: "Bediening",
    invert_grid: "Netvermogen is positief bij teruglevering",
    invert_battery: "Batterijvermogen is positief bij laden",
    collapsed: "Ingeklapte secties",
    language: "Taal",
    lang_auto: "Automatisch",
    zoom: "Detailknop",
    zoom_helper: "Schakelt de minikaart naar de volledige kaart en terug",
    entities: "Entiteiten (optioneel)",
    soc: "Batterijniveau",
  },
  pt: {
    solar: "Solar",
    grid: "Rede",
    home: "Casa",
    battery: "Bateria",
    import: "Importação",
    export: "Exportação",
    charging: "A carregar",
    discharging: "A descarregar",
    idle: "Em repouso",
    producing: "A produzir",
    not_producing: "Sem produção",
    grid_outage: "Falha de rede",
    self_sufficient: "Autossuficiência de {pct} % hoje",
    flow: "Fluxo de energia",
    today: "Hoje",
    produced: "Produzida",
    consumed: "Consumida",
    imported: "Importada",
    exported: "Exportada",
    charged: "Carregada",
    discharged: "Descarregada",
    self_consumption: "Autoconsumo",
    self_sufficiency: "Autossuficiência",
    full_in: "cheia em {time}",
    empty_in: "vazia em {time}",
    reserve: "Reserva {pct} %",
    options: "Opções",
    on: "Ligado",
    off: "Desligado",
    cancel: "Cancelar",
    turn_on: "Ligar",
    turn_off: "Desligar",
    confirm_on: "Ligar {name}?",
    confirm_off: "Desligar {name}?",
    no_registry: "Os registos do Home Assistant não estão disponíveis",
    no_system: "Nenhuma integração solar ou de bateria encontrada",
    unknown_integration: "Integração não encontrada",
    zoom_in: "Mostrar detalhes",
    zoom_out: "Mostrar menos",
    integration: "Integração",
    title: "Título",
    show_flow: "Fluxo de energia",
    show_title: "Título",
    show_subtitle: "Subtítulo",
    show_battery: "Bateria",
    show_today: "Energia de hoje",
    show_week: "Últimos 7 dias (produção e consumo por dia)",
    week: "Últimos 7 dias",
    show_options: "Opções",
    show_controls: "Controlos",
    invert_grid: "A potência da rede é positiva ao exportar",
    invert_battery: "A potência da bateria é positiva ao carregar",
    collapsed: "Secções recolhidas",
    language: "Idioma",
    lang_auto: "Automático",
    zoom: "Botão de detalhe",
    zoom_helper: "Alterna o mini cartão para o cartão completo e vice-versa",
    entities: "Entidades (opcional)",
    soc: "Nível da bateria",
  },
  pl: {
    solar: "Słońce",
    grid: "Sieć",
    home: "Dom",
    battery: "Bateria",
    import: "Pobór",
    export: "Oddawanie",
    charging: "Ładowanie",
    discharging: "Rozładowanie",
    idle: "Bezczynna",
    producing: "Produkcja",
    not_producing: "Brak produkcji",
    grid_outage: "Awaria sieci",
    self_sufficient: "Dziś {pct} % samowystarczalności",
    flow: "Przepływ energii",
    today: "Dziś",
    produced: "Wyprodukowano",
    consumed: "Zużyto",
    imported: "Pobrano",
    exported: "Oddano",
    charged: "Naładowano",
    discharged: "Rozładowano",
    self_consumption: "Autokonsumpcja",
    self_sufficiency: "Samowystarczalność",
    full_in: "pełna za {time}",
    empty_in: "pusta za {time}",
    reserve: "Rezerwa {pct} %",
    options: "Opcje",
    on: "Wł.",
    off: "Wył.",
    cancel: "Anuluj",
    turn_on: "Włącz",
    turn_off: "Wyłącz",
    confirm_on: "Włączyć {name}?",
    confirm_off: "Wyłączyć {name}?",
    no_registry: "Rejestry Home Assistant są niedostępne",
    no_system: "Nie znaleziono integracji solarnej ani baterii",
    unknown_integration: "Nie znaleziono integracji",
    zoom_in: "Pokaż szczegóły",
    zoom_out: "Pokaż mniej",
    integration: "Integracja",
    title: "Tytuł",
    show_flow: "Przepływ energii",
    show_title: "Tytuł",
    show_subtitle: "Podtytuł",
    show_battery: "Bateria",
    show_today: "Energia dzisiaj",
    show_week: "Ostatnie 7 dni (produkcja i zużycie dziennie)",
    week: "Ostatnie 7 dni",
    show_options: "Opcje",
    show_controls: "Sterowanie",
    invert_grid: "Moc sieci jest dodatnia przy oddawaniu",
    invert_battery: "Moc baterii jest dodatnia przy ładowaniu",
    collapsed: "Zwinięte sekcje",
    language: "Język",
    lang_auto: "Automatycznie",
    zoom: "Przycisk szczegółów",
    zoom_helper: "Przełącza mini kartę na pełną kartę i z powrotem",
    entities: "Encje (opcjonalnie)",
    soc: "Poziom baterii",
  },
  ro: {
    solar: "Solar",
    grid: "Rețea",
    home: "Casă",
    battery: "Baterie",
    import: "Import",
    export: "Export",
    charging: "Se încarcă",
    discharging: "Se descarcă",
    idle: "În repaus",
    producing: "Produce",
    not_producing: "Fără producție",
    grid_outage: "Pană de rețea",
    self_sufficient: "Autonomie de {pct} % azi",
    flow: "Flux de energie",
    today: "Azi",
    produced: "Produsă",
    consumed: "Consumată",
    imported: "Importată",
    exported: "Exportată",
    charged: "Încărcată",
    discharged: "Descărcată",
    self_consumption: "Autoconsum",
    self_sufficiency: "Autonomie",
    full_in: "plină în {time}",
    empty_in: "goală în {time}",
    reserve: "Rezervă {pct} %",
    options: "Opțiuni",
    on: "Pornit",
    off: "Oprit",
    cancel: "Anulează",
    turn_on: "Pornește",
    turn_off: "Oprește",
    confirm_on: "Pornești {name}?",
    confirm_off: "Oprești {name}?",
    no_registry: "Registrele Home Assistant nu sunt disponibile",
    no_system: "Nu s-a găsit nicio integrare solară sau de baterie",
    unknown_integration: "Integrarea nu a fost găsită",
    zoom_in: "Afișează detalii",
    zoom_out: "Afișează mai puțin",
    integration: "Integrare",
    title: "Titlu",
    show_flow: "Flux de energie",
    show_title: "Titlu",
    show_subtitle: "Subtitlu",
    show_battery: "Baterie",
    show_today: "Energia de azi",
    show_week: "Ultimele 7 zile (producție și consum pe zi)",
    week: "Ultimele 7 zile",
    show_options: "Opțiuni",
    show_controls: "Comenzi",
    invert_grid: "Puterea rețelei este pozitivă la export",
    invert_battery: "Puterea bateriei este pozitivă la încărcare",
    collapsed: "Secțiuni restrânse",
    language: "Limbă",
    lang_auto: "Automat",
    zoom: "Buton detalii",
    zoom_helper: "Comută mini cardul la cardul complet și înapoi",
    entities: "Entități (opțional)",
    soc: "Nivelul bateriei",
  },
  da: {
    solar: "Sol",
    grid: "Net",
    home: "Hjem",
    battery: "Batteri",
    import: "Køb",
    export: "Salg",
    charging: "Oplader",
    discharging: "Aflader",
    idle: "Inaktiv",
    producing: "Producerer",
    not_producing: "Ingen produktion",
    grid_outage: "Netudfald",
    self_sufficient: "{pct} % selvforsynende i dag",
    flow: "Energiflow",
    today: "I dag",
    produced: "Produceret",
    consumed: "Forbrugt",
    imported: "Købt",
    exported: "Solgt",
    charged: "Opladet",
    discharged: "Afladet",
    self_consumption: "Eget forbrug",
    self_sufficiency: "Selvforsyning",
    full_in: "fuld om {time}",
    empty_in: "tom om {time}",
    reserve: "Reserve {pct} %",
    options: "Indstillinger",
    on: "Til",
    off: "Fra",
    cancel: "Annuller",
    turn_on: "Slå til",
    turn_off: "Slå fra",
    confirm_on: "Slå {name} til?",
    confirm_off: "Slå {name} fra?",
    no_registry: "Home Assistants registre er ikke tilgængelige",
    no_system: "Ingen sol- eller batteriintegration fundet",
    unknown_integration: "Integration ikke fundet",
    zoom_in: "Vis detaljer",
    zoom_out: "Vis mindre",
    integration: "Integration",
    title: "Titel",
    show_flow: "Energiflow",
    show_title: "Titel",
    show_subtitle: "Undertitel",
    show_battery: "Batteri",
    show_today: "Energi i dag",
    show_week: "Seneste 7 dage (produktion og forbrug pr. dag)",
    week: "Seneste 7 dage",
    show_options: "Indstillinger",
    show_controls: "Betjening",
    invert_grid: "Neteffekten er positiv ved salg",
    invert_battery: "Batterieffekten er positiv ved opladning",
    collapsed: "Sammenfoldede sektioner",
    language: "Sprog",
    lang_auto: "Automatisk",
    zoom: "Detaljeknap",
    zoom_helper: "Skifter minikortet til det fulde kort og tilbage",
    entities: "Enheder (valgfrit)",
    soc: "Batteriniveau",
  },
  sv: {
    solar: "Sol",
    grid: "Elnät",
    home: "Hem",
    battery: "Batteri",
    import: "Köp",
    export: "Försäljning",
    charging: "Laddar",
    discharging: "Laddar ur",
    idle: "Vilande",
    producing: "Producerar",
    not_producing: "Ingen produktion",
    grid_outage: "Strömavbrott",
    self_sufficient: "{pct} % självförsörjande i dag",
    flow: "Energiflöde",
    today: "I dag",
    produced: "Producerad",
    consumed: "Förbrukad",
    imported: "Köpt",
    exported: "Såld",
    charged: "Laddad",
    discharged: "Urladdad",
    self_consumption: "Egenförbrukning",
    self_sufficiency: "Självförsörjning",
    full_in: "full om {time}",
    empty_in: "tom om {time}",
    reserve: "Reserv {pct} %",
    options: "Alternativ",
    on: "På",
    off: "Av",
    cancel: "Avbryt",
    turn_on: "Slå på",
    turn_off: "Slå av",
    confirm_on: "Slå på {name}?",
    confirm_off: "Slå av {name}?",
    no_registry: "Home Assistants register är inte tillgängliga",
    no_system: "Ingen sol- eller batteriintegration hittades",
    unknown_integration: "Integrationen hittades inte",
    zoom_in: "Visa detaljer",
    zoom_out: "Visa mindre",
    integration: "Integration",
    title: "Titel",
    show_flow: "Energiflöde",
    show_title: "Rubrik",
    show_subtitle: "Underrubrik",
    show_battery: "Batteri",
    show_today: "Energi i dag",
    show_week: "Senaste 7 dagarna (produktion och förbrukning per dag)",
    week: "Senaste 7 dagarna",
    show_options: "Alternativ",
    show_controls: "Reglage",
    invert_grid: "Nätets effekt är positiv vid försäljning",
    invert_battery: "Batteriets effekt är positiv vid laddning",
    collapsed: "Hopfällda avsnitt",
    language: "Språk",
    lang_auto: "Automatiskt",
    zoom: "Detaljknapp",
    zoom_helper: "Växlar minikortet till det fullständiga kortet och tillbaka",
    entities: "Entiteter (valfritt)",
    soc: "Batterinivå",
  },
  bg: {
    solar: "Слънце",
    grid: "Мрежа",
    home: "Дом",
    battery: "Батерия",
    import: "Внос",
    export: "Износ",
    charging: "Зарежда се",
    discharging: "Разрежда се",
    idle: "В покой",
    producing: "Произвежда",
    not_producing: "Няма производство",
    grid_outage: "Спиране на мрежата",
    self_sufficient: "Днес {pct} % самостоятелност",
    flow: "Енергиен поток",
    today: "Днес",
    produced: "Произведена",
    consumed: "Консумирана",
    imported: "Внесена",
    exported: "Изнесена",
    charged: "Заредена",
    discharged: "Разредена",
    self_consumption: "Собствено потребление",
    self_sufficiency: "Самостоятелност",
    full_in: "пълна след {time}",
    empty_in: "празна след {time}",
    reserve: "Резерв {pct} %",
    options: "Опции",
    on: "Вкл.",
    off: "Изкл.",
    cancel: "Отказ",
    turn_on: "Включи",
    turn_off: "Изключи",
    confirm_on: "Да се включи ли {name}?",
    confirm_off: "Да се изключи ли {name}?",
    no_registry: "Регистрите на Home Assistant не са налични",
    no_system: "Не е намерена соларна или батерийна интеграция",
    unknown_integration: "Интеграцията не е намерена",
    zoom_in: "Покажи подробности",
    zoom_out: "Покажи по-малко",
    integration: "Интеграция",
    title: "Заглавие",
    show_flow: "Енергиен поток",
    show_title: "Заглавие",
    show_subtitle: "Подзаглавие",
    show_battery: "Батерия",
    show_today: "Енергия днес",
    show_week: "Последните 7 дни (производство и потребление на ден)",
    week: "Последните 7 дни",
    show_options: "Опции",
    show_controls: "Управление",
    invert_grid: "Мощността на мрежата е положителна при износ",
    invert_battery: "Мощността на батерията е положителна при зареждане",
    collapsed: "Свити секции",
    language: "Език",
    lang_auto: "Автоматично",
    zoom: "Бутон за подробности",
    zoom_helper: "Превключва мини картата към пълната карта и обратно",
    entities: "Обекти (по избор)",
    soc: "Ниво на батерията",
  },
  ru: {
    solar: "Солнце",
    grid: "Сеть",
    home: "Дом",
    battery: "Батарея",
    import: "Потребление",
    export: "Отдача",
    charging: "Заряжается",
    discharging: "Разряжается",
    idle: "Простой",
    producing: "Производит",
    not_producing: "Нет выработки",
    grid_outage: "Отключение сети",
    self_sufficient: "Сегодня {pct} % автономности",
    flow: "Поток энергии",
    today: "Сегодня",
    produced: "Выработано",
    consumed: "Потреблено",
    imported: "Из сети",
    exported: "В сеть",
    charged: "Заряжено",
    discharged: "Разряжено",
    self_consumption: "Собственное потребление",
    self_sufficiency: "Автономность",
    full_in: "заряд через {time}",
    empty_in: "разряд через {time}",
    reserve: "Резерв {pct} %",
    options: "Параметры",
    on: "Вкл.",
    off: "Выкл.",
    cancel: "Отмена",
    turn_on: "Включить",
    turn_off: "Выключить",
    confirm_on: "Включить {name}?",
    confirm_off: "Выключить {name}?",
    no_registry: "Реестры Home Assistant недоступны",
    no_system: "Не найдено ни солнечной, ни батарейной интеграции",
    unknown_integration: "Интеграция не найдена",
    zoom_in: "Подробнее",
    zoom_out: "Свернуть",
    integration: "Интеграция",
    title: "Заголовок",
    show_flow: "Поток энергии",
    show_title: "Заголовок",
    show_subtitle: "Подзаголовок",
    show_battery: "Батарея",
    show_today: "Энергия за сегодня",
    show_week: "Последние 7 дней (выработка и потребление за день)",
    week: "Последние 7 дней",
    show_options: "Параметры",
    show_controls: "Управление",
    invert_grid: "Мощность сети положительна при отдаче",
    invert_battery: "Мощность батареи положительна при зарядке",
    collapsed: "Свёрнутые разделы",
    language: "Язык",
    lang_auto: "Автоматически",
    zoom: "Кнопка подробностей",
    zoom_helper: "Переключает мини-карточку на полную и обратно",
    entities: "Объекты (необязательно)",
    soc: "Уровень заряда",
  },
  uk: {
    solar: "Сонце",
    grid: "Мережа",
    home: "Дім",
    battery: "Батарея",
    import: "Споживання",
    export: "Віддача",
    charging: "Заряджається",
    discharging: "Розряджається",
    idle: "Простій",
    producing: "Виробляє",
    not_producing: "Немає генерації",
    grid_outage: "Відключення мережі",
    self_sufficient: "Сьогодні {pct} % автономності",
    flow: "Потік енергії",
    today: "Сьогодні",
    produced: "Вироблено",
    consumed: "Спожито",
    imported: "З мережі",
    exported: "У мережу",
    charged: "Заряджено",
    discharged: "Розряджено",
    self_consumption: "Власне споживання",
    self_sufficiency: "Автономність",
    full_in: "заряд за {time}",
    empty_in: "розряд за {time}",
    reserve: "Резерв {pct} %",
    options: "Параметри",
    on: "Увімк.",
    off: "Вимк.",
    cancel: "Скасувати",
    turn_on: "Увімкнути",
    turn_off: "Вимкнути",
    confirm_on: "Увімкнути {name}?",
    confirm_off: "Вимкнути {name}?",
    no_registry: "Реєстри Home Assistant недоступні",
    no_system: "Не знайдено ні сонячної, ні батарейної інтеграції",
    unknown_integration: "Інтеграцію не знайдено",
    zoom_in: "Докладніше",
    zoom_out: "Згорнути",
    integration: "Інтеграція",
    title: "Заголовок",
    show_flow: "Потік енергії",
    show_title: "Заголовок",
    show_subtitle: "Підзаголовок",
    show_battery: "Батарея",
    show_today: "Енергія за сьогодні",
    show_week: "Останні 7 днів (вироблення та споживання за день)",
    week: "Останні 7 днів",
    show_options: "Параметри",
    show_controls: "Керування",
    invert_grid: "Потужність мережі додатна при віддачі",
    invert_battery: "Потужність батареї додатна при заряджанні",
    collapsed: "Згорнуті розділи",
    language: "Мова",
    lang_auto: "Автоматично",
    zoom: "Кнопка деталей",
    zoom_helper: "Перемикає міні-картку на повну й назад",
    entities: "Об'єкти (необов'язково)",
    soc: "Рівень заряду",
  },
  hu: {
    solar: "Napelem",
    grid: "Hálózat",
    home: "Otthon",
    battery: "Akkumulátor",
    import: "Vételezés",
    export: "Betáplálás",
    charging: "Töltődik",
    discharging: "Merül",
    idle: "Tétlen",
    producing: "Termel",
    not_producing: "Nincs termelés",
    grid_outage: "Hálózati kimaradás",
    self_sufficient: "Ma {pct} %-ban önellátó",
    flow: "Energiaáramlás",
    today: "Ma",
    produced: "Termelt",
    consumed: "Fogyasztott",
    imported: "Vételezett",
    exported: "Betáplált",
    charged: "Töltött",
    discharged: "Merített",
    self_consumption: "Saját fogyasztás",
    self_sufficiency: "Önellátás",
    full_in: "{time} múlva tele",
    empty_in: "{time} múlva üres",
    reserve: "Tartalék {pct} %",
    options: "Beállítások",
    on: "Be",
    off: "Ki",
    cancel: "Mégse",
    turn_on: "Bekapcsolás",
    turn_off: "Kikapcsolás",
    confirm_on: "Bekapcsolja: {name}?",
    confirm_off: "Kikapcsolja: {name}?",
    no_registry: "A Home Assistant nyilvántartásai nem érhetők el",
    no_system: "Nem található napelemes vagy akkumulátoros integráció",
    unknown_integration: "Az integráció nem található",
    zoom_in: "Részletek",
    zoom_out: "Kevesebb",
    integration: "Integráció",
    title: "Cím",
    show_flow: "Energiaáramlás",
    show_title: "Cím",
    show_subtitle: "Alcím",
    show_battery: "Akkumulátor",
    show_today: "Mai energia",
    show_week: "Utolsó 7 nap (napi termelés és fogyasztás)",
    week: "Utolsó 7 nap",
    show_options: "Beállítások",
    show_controls: "Vezérlők",
    invert_grid: "A hálózati teljesítmény betápláláskor pozitív",
    invert_battery: "Az akkumulátor teljesítménye töltéskor pozitív",
    collapsed: "Összecsukott szakaszok",
    language: "Nyelv",
    lang_auto: "Automatikus",
    zoom: "Részletek gomb",
    zoom_helper: "Átváltja a mini kártyát a teljes kártyára és vissza",
    entities: "Entitások (nem kötelező)",
    soc: "Akkumulátor töltöttsége",
  },
  sk: {
    solar: "Slnko",
    grid: "Sieť",
    home: "Dom",
    battery: "Batéria",
    import: "Odber",
    export: "Dodávka",
    charging: "Nabíja sa",
    discharging: "Vybíja sa",
    idle: "Nečinná",
    producing: "Vyrába",
    not_producing: "Bez výroby",
    grid_outage: "Výpadok siete",
    self_sufficient: "Dnes {pct} % sebestačnosť",
    flow: "Tok energie",
    today: "Dnes",
    produced: "Vyrobené",
    consumed: "Spotrebované",
    imported: "Odobraté",
    exported: "Dodané",
    charged: "Nabité",
    discharged: "Vybité",
    self_consumption: "Vlastná spotreba",
    self_sufficiency: "Sebestačnosť",
    full_in: "plná o {time}",
    empty_in: "prázdna o {time}",
    reserve: "Rezerva {pct} %",
    options: "Možnosti",
    on: "Zap.",
    off: "Vyp.",
    cancel: "Zrušiť",
    turn_on: "Zapnúť",
    turn_off: "Vypnúť",
    confirm_on: "Zapnúť {name}?",
    confirm_off: "Vypnúť {name}?",
    no_registry: "Registre Home Assistant nie sú k dispozícii",
    no_system: "Nenašla sa žiadna solárna ani batériová integrácia",
    unknown_integration: "Integrácia sa nenašla",
    zoom_in: "Zobraziť podrobnosti",
    zoom_out: "Zobraziť menej",
    integration: "Integrácia",
    title: "Názov",
    show_flow: "Tok energie",
    show_title: "Názov",
    show_subtitle: "Podnázov",
    show_battery: "Batéria",
    show_today: "Dnešná energia",
    show_week: "Posledných 7 dní (výroba a spotreba za deň)",
    week: "Posledných 7 dní",
    show_options: "Možnosti",
    show_controls: "Ovládanie",
    invert_grid: "Výkon siete je kladný pri dodávke",
    invert_battery: "Výkon batérie je kladný pri nabíjaní",
    collapsed: "Zbalené sekcie",
    language: "Jazyk",
    lang_auto: "Automaticky",
    zoom: "Tlačidlo podrobností",
    zoom_helper: "Prepne mini kartu na úplnú kartu a späť",
    entities: "Entity (voliteľné)",
    soc: "Úroveň batérie",
  },
  cs: {
    solar: "Slunce",
    grid: "Síť",
    home: "Dům",
    battery: "Baterie",
    import: "Odběr",
    export: "Přetok",
    charging: "Nabíjí se",
    discharging: "Vybíjí se",
    idle: "Nečinná",
    producing: "Vyrábí",
    not_producing: "Bez výroby",
    grid_outage: "Výpadek sítě",
    self_sufficient: "Dnes {pct} % soběstačnost",
    flow: "Tok energie",
    today: "Dnes",
    produced: "Vyrobeno",
    consumed: "Spotřebováno",
    imported: "Odebráno",
    exported: "Dodáno",
    charged: "Nabito",
    discharged: "Vybito",
    self_consumption: "Vlastní spotřeba",
    self_sufficiency: "Soběstačnost",
    full_in: "plná za {time}",
    empty_in: "prázdná za {time}",
    reserve: "Rezerva {pct} %",
    options: "Možnosti",
    on: "Zap.",
    off: "Vyp.",
    cancel: "Zrušit",
    turn_on: "Zapnout",
    turn_off: "Vypnout",
    confirm_on: "Zapnout {name}?",
    confirm_off: "Vypnout {name}?",
    no_registry: "Registry Home Assistant nejsou k dispozici",
    no_system: "Nebyla nalezena žádná solární ani bateriová integrace",
    unknown_integration: "Integrace nebyla nalezena",
    zoom_in: "Zobrazit podrobnosti",
    zoom_out: "Zobrazit méně",
    integration: "Integrace",
    title: "Název",
    show_flow: "Tok energie",
    show_title: "Název",
    show_subtitle: "Podnázev",
    show_battery: "Baterie",
    show_today: "Dnešní energie",
    show_week: "Posledních 7 dní (výroba a spotřeba za den)",
    week: "Posledních 7 dní",
    show_options: "Možnosti",
    show_controls: "Ovládání",
    invert_grid: "Výkon sítě je kladný při přetoku",
    invert_battery: "Výkon baterie je kladný při nabíjení",
    collapsed: "Sbalené sekce",
    language: "Jazyk",
    lang_auto: "Automaticky",
    zoom: "Tlačítko podrobností",
    zoom_helper: "Přepne mini kartu na úplnou kartu a zpět",
    entities: "Entity (volitelné)",
    soc: "Úroveň baterie",
  },
  sl: {
    solar: "Sonce",
    grid: "Omrežje",
    home: "Dom",
    battery: "Baterija",
    import: "Odjem",
    export: "Oddaja",
    charging: "Polni se",
    discharging: "Prazni se",
    idle: "Miruje",
    producing: "Proizvaja",
    not_producing: "Brez proizvodnje",
    grid_outage: "Izpad omrežja",
    self_sufficient: "Danes {pct} % samooskrbe",
    flow: "Tok energije",
    today: "Danes",
    produced: "Proizvedeno",
    consumed: "Porabljeno",
    imported: "Odvzeto",
    exported: "Oddano",
    charged: "Napolnjeno",
    discharged: "Izpraznjeno",
    self_consumption: "Lastna poraba",
    self_sufficiency: "Samooskrba",
    full_in: "polna čez {time}",
    empty_in: "prazna čez {time}",
    reserve: "Rezerva {pct} %",
    options: "Možnosti",
    on: "Vklop",
    off: "Izklop",
    cancel: "Prekliči",
    turn_on: "Vklopi",
    turn_off: "Izklopi",
    confirm_on: "Vklopim {name}?",
    confirm_off: "Izklopim {name}?",
    no_registry: "Registri Home Assistanta niso na voljo",
    no_system: "Ni najdene sončne ali baterijske integracije",
    unknown_integration: "Integracije ni mogoče najti",
    zoom_in: "Prikaži podrobnosti",
    zoom_out: "Prikaži manj",
    integration: "Integracija",
    title: "Naslov",
    show_flow: "Tok energije",
    show_title: "Naslov",
    show_subtitle: "Podnaslov",
    show_battery: "Baterija",
    show_today: "Današnja energija",
    show_week: "Zadnjih 7 dni (proizvodnja in poraba na dan)",
    week: "Zadnjih 7 dni",
    show_options: "Možnosti",
    show_controls: "Upravljanje",
    invert_grid: "Moč omrežja je pozitivna pri oddaji",
    invert_battery: "Moč baterije je pozitivna pri polnjenju",
    collapsed: "Strnjeni razdelki",
    language: "Jezik",
    lang_auto: "Samodejno",
    zoom: "Gumb za podrobnosti",
    zoom_helper: "Preklopi mini kartico na celotno kartico in nazaj",
    entities: "Entitete (neobvezno)",
    soc: "Raven baterije",
  },
  lv: {
    solar: "Saule",
    grid: "Tīkls",
    home: "Māja",
    battery: "Akumulators",
    import: "Patēriņš",
    export: "Nodošana",
    charging: "Lādējas",
    discharging: "Izlādējas",
    idle: "Dīkstāvē",
    producing: "Ražo",
    not_producing: "Nav ražošanas",
    grid_outage: "Tīkla atslēgums",
    self_sufficient: "Šodien {pct} % pašpietiekamība",
    flow: "Enerģijas plūsma",
    today: "Šodien",
    produced: "Saražots",
    consumed: "Patērēts",
    imported: "Saņemts",
    exported: "Nodots",
    charged: "Uzlādēts",
    discharged: "Izlādēts",
    self_consumption: "Pašpatēriņš",
    self_sufficiency: "Pašpietiekamība",
    full_in: "pilns pēc {time}",
    empty_in: "tukšs pēc {time}",
    reserve: "Rezerve {pct} %",
    options: "Opcijas",
    on: "Iesl.",
    off: "Izsl.",
    cancel: "Atcelt",
    turn_on: "Ieslēgt",
    turn_off: "Izslēgt",
    confirm_on: "Ieslēgt {name}?",
    confirm_off: "Izslēgt {name}?",
    no_registry: "Home Assistant reģistri nav pieejami",
    no_system: "Nav atrasta saules vai akumulatora integrācija",
    unknown_integration: "Integrācija nav atrasta",
    zoom_in: "Rādīt detaļas",
    zoom_out: "Rādīt mazāk",
    integration: "Integrācija",
    title: "Nosaukums",
    show_flow: "Enerģijas plūsma",
    show_title: "Virsraksts",
    show_subtitle: "Apakšvirsraksts",
    show_battery: "Akumulators",
    show_today: "Šodienas enerģija",
    show_week: "Pēdējās 7 dienas (ražošana un patēriņš dienā)",
    week: "Pēdējās 7 dienas",
    show_options: "Opcijas",
    show_controls: "Vadība",
    invert_grid: "Tīkla jauda ir pozitīva nodošanas laikā",
    invert_battery: "Akumulatora jauda ir pozitīva uzlādes laikā",
    collapsed: "Sakļautās sadaļas",
    language: "Valoda",
    lang_auto: "Automātiski",
    zoom: "Detaļu poga",
    zoom_helper: "Pārslēdz mini karti uz pilno karti un atpakaļ",
    entities: "Entītijas (neobligāti)",
    soc: "Akumulatora līmenis",
  },
  el: {
    solar: "Ηλιακά",
    grid: "Δίκτυο",
    home: "Σπίτι",
    battery: "Μπαταρία",
    import: "Κατανάλωση",
    export: "Έγχυση",
    charging: "Φορτίζει",
    discharging: "Εκφορτίζει",
    idle: "Αδρανής",
    producing: "Παράγει",
    not_producing: "Χωρίς παραγωγή",
    grid_outage: "Διακοπή δικτύου",
    self_sufficient: "Σήμερα {pct} % αυτάρκεια",
    flow: "Ροή ενέργειας",
    today: "Σήμερα",
    produced: "Παραγωγή",
    consumed: "Κατανάλωση",
    imported: "Από το δίκτυο",
    exported: "Προς το δίκτυο",
    charged: "Φόρτιση",
    discharged: "Εκφόρτιση",
    self_consumption: "Ιδιοκατανάλωση",
    self_sufficiency: "Αυτάρκεια",
    full_in: "πλήρης σε {time}",
    empty_in: "άδεια σε {time}",
    reserve: "Απόθεμα {pct} %",
    options: "Επιλογές",
    on: "Ενεργό",
    off: "Ανενεργό",
    cancel: "Ακύρωση",
    turn_on: "Ενεργοποίηση",
    turn_off: "Απενεργοποίηση",
    confirm_on: "Ενεργοποίηση {name};",
    confirm_off: "Απενεργοποίηση {name};",
    no_registry: "Τα μητρώα του Home Assistant δεν είναι διαθέσιμα",
    no_system: "Δεν βρέθηκε ηλιακή ή μπαταριακή ενσωμάτωση",
    unknown_integration: "Η ενσωμάτωση δεν βρέθηκε",
    zoom_in: "Εμφάνιση λεπτομερειών",
    zoom_out: "Λιγότερα",
    integration: "Ενσωμάτωση",
    title: "Τίτλος",
    show_flow: "Ροή ενέργειας",
    show_title: "Τίτλος",
    show_subtitle: "Υπότιτλος",
    show_battery: "Μπαταρία",
    show_today: "Ενέργεια σήμερα",
    show_week: "Τελευταίες 7 ημέρες (παραγωγή και κατανάλωση ανά ημέρα)",
    week: "Τελευταίες 7 ημέρες",
    show_options: "Επιλογές",
    show_controls: "Χειριστήρια",
    invert_grid: "Η ισχύς δικτύου είναι θετική κατά την έγχυση",
    invert_battery: "Η ισχύς μπαταρίας είναι θετική κατά τη φόρτιση",
    collapsed: "Συμπτυγμένες ενότητες",
    language: "Γλώσσα",
    lang_auto: "Αυτόματη",
    zoom: "Κουμπί λεπτομερειών",
    zoom_helper: "Εναλλάσσει τη μικρή κάρτα με την πλήρη κάρτα",
    entities: "Οντότητες (προαιρετικά)",
    soc: "Στάθμη μπαταρίας",
  },
};

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const esc = (v) =>
  String(v ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);

const lang = (hass, config) => {
  const l = config?.language || (hass && (hass.locale?.language || hass.language)) || "en";
  return STRINGS[l] ? l : STRINGS[l.split("-")[0]] ? l.split("-")[0] : "en";
};

// Locale for Intl / toLocale*: the card's language option, else HA's full locale (keeps its region) when its base
// matches the card language, else that language. A bare "pt" (European Portuguese) becomes "pt-PT".
const intlLocale = (hass, config) => {
  const l = lang(hass, config);
  const src = config?.language || (hass && (hass.locale?.language || hass.language)) || "";
  const out = src && src.split("-")[0] === l.split("-")[0] ? src : l;
  return out === "pt" ? "pt-PT" : out;
};

const t = (hass, config, key, vars = {}) =>
  String(STRINGS[lang(hass, config)][key] ?? STRINGS.en[key] ?? key).replace(/\{(\w+)\}/g, (_, k) => vars[k] ?? "");

const valid = (s) => !!s && !["unknown", "unavailable", ""].includes(s.state);

const num = (s) => {
  if (!valid(s)) return null;
  const v = parseFloat(s.state);
  return Number.isFinite(v) ? v : null;
};

const pretty = (v) => {
  const s = String(v ?? "").replace(/_/g, " ");
  return s.charAt(0).toUpperCase() + s.slice(1);
};

const unitOf = (s) => String(s?.attributes?.unit_of_measurement ?? "").trim();

// Power sensor → watts. A sensor in an energy unit is not a power sensor: null.
const POWER_UNITS = { W: 1, kW: 1e3, MW: 1e6, "": 1 };
const watts = (s) => {
  const v = num(s);
  const f = POWER_UNITS[unitOf(s)];
  return v === null || f === undefined ? null : v * f;
};

// Energy sensor → kWh. A sensor in a power unit is not an energy sensor: null.
const ENERGY_UNITS = { Wh: 1e-3, kWh: 1, MWh: 1e3, "": 1 };
const kwh = (s) => {
  const v = num(s);
  const f = ENERGY_UNITS[unitOf(s)];
  return v === null || f === undefined ? null : v * f;
};

const fmtNum = (v, digits, locale) => Number(v).toLocaleString(locale, { minimumFractionDigits: digits, maximumFractionDigits: digits });

// Power in watts → "850 W", "2.4 kW", "12 kW".
const fmtPower = (w, locale) => {
  if (w === null || w === undefined) return "—";
  const a = Math.abs(w);
  if (a < 1000) return `${fmtNum(Math.round(a), 0, locale)} W`;
  return `${fmtNum(a / 1000, a < 100000 ? 1 : 0, locale)} kW`;
};

// Energy in kWh → "12.4 kWh", "850 Wh", "1,240 kWh".
const fmtEnergy = (e, locale) => {
  if (e === null || e === undefined) return "—";
  if (Math.abs(e) < 1) return `${fmtNum(Math.round(e * 1000), 0, locale)} Wh`;
  return `${fmtNum(e, Math.abs(e) < 100 ? 1 : 0, locale)} kWh`;
};

const fmtPct = (v, locale) => `${fmtNum(Math.round(v), 0, locale)} %`;

// Duration in hours, written with the units of the language ("2 h 30 min"), rounded to the minute first.
const UNIT_FMT = {};
const fmtUnit = (v, unit, locale) => (UNIT_FMT[`${locale}|${unit}`] ??= new Intl.NumberFormat(locale, { style: "unit", unit, unitDisplay: "short" })).format(v);
const fmtHours = (h, locale) => {
  if (h === null || h === undefined || !Number.isFinite(h)) return "—";
  const total = Math.max(1, Math.round(h * 60));
  if (total < 60) return fmtUnit(total, "minute", locale);
  if (total < 600) {
    const m = total % 60;
    const H = fmtUnit(Math.floor(total / 60), "hour", locale);
    return m ? `${H} ${fmtUnit(m, "minute", locale)}` : H;
  }
  return fmtUnit(Math.round(h), "hour", locale);
};

const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));

const svgIcon = (path, cls = "") => `<svg class="icon ${cls}" viewBox="0 0 24 24"><path d="${path}"/></svg>`;

// Battery level → color class.
const levelClass = (v) => (v === null ? "idle" : v <= 15 ? "crit" : v <= 30 ? "warn" : "ok");

// ---------------------------------------------------------------------------
// Registry-based resolution
// ---------------------------------------------------------------------------

// Role of a registry entry among the keys of its integration: [role, rank] (rank: the lower, the preferred), or null.
const roleOf = (e, domain) => {
  const keys = KEYS[e.platform];
  if (!keys) return null;
  const tk = e.translation_key;
  const name = e.entity_id.slice(domain.length + 1);
  for (let i = 0; i < keys.length; i++) {
    const [key, role] = keys[i];
    if (!roleDomainOk(role, domain)) continue;
    if (tk ? tk === key : name === key || name.endsWith(`_${key}`)) return [role, i];
  }
  return null;
};

// Guessed role of a power or battery-level sensor (unknown integrations, and the gaps of the known ones).
const guessRole = (id, st) => {
  if (!st || !id.startsWith("sensor.")) return null;
  const a = st.attributes || {};
  if (a.device_class === "battery" && unitOf(st) === "%") return "soc";
  if (a.device_class !== "power" && !["W", "kW"].includes(unitOf(st))) return null;
  const text = `${id} ${a.friendly_name || ""}`.toLowerCase();
  for (const [re, role] of GUESSES) if (re.test(text)) return role;
  return null;
};

const _cache = new WeakMap();

/**
 * Build the model from hass.entities / hass.devices / hass.states:
 * { platforms: { <platform>: { platform, brand, name, roles: { role: entity_id }, switches: [...], selects: [...] } },
 *   systems: [the platforms the cards know, present in this instance] }
 */
const resolve = (hass) => {
  if (!hass.entities || !hass.devices) return null;
  const cached = _cache.get(hass.entities);
  if (cached && cached.devices === hass.devices) return cached.model;

  const platforms = {};
  for (const e of Object.values(hass.entities)) {
    if (e.hidden || !e.platform) continue;
    const domain = e.entity_id.split(".")[0];
    const p = (platforms[e.platform] ||= { platform: e.platform, brand: brandOf(e.platform), ranks: {}, roles: {}, guessed: [], switches: [], selects: [], devices: new Set() });
    if (e.device_id) p.devices.add(e.device_id);
    if (domain === "switch" && e.entity_category !== "diagnostic") p.switches.push(e.entity_id);
    if (domain === "select" && e.entity_category !== "diagnostic") p.selects.push(e.entity_id);
    const found = roleOf(e, domain);
    if (found) {
      const [role, rank] = found;
      if (!(role in p.ranks) || rank < p.ranks[role]) {
        p.ranks[role] = rank;
        p.roles[role] = e.entity_id;
        if (role === "solar" && e.device_id) p.solarDevice = e.device_id;
      }
    } else if (domain === "sensor" && !e.entity_category) {
      p.guessed.push(e.entity_id);
    }
  }
  for (const p of Object.values(platforms)) {
    const dev = hass.devices[p.solarDevice] || hass.devices[[...p.devices][0]];
    p.name = BRANDS[p.brand].name || dev?.name_by_user || dev?.name || pretty(p.platform);
  }
  const systems = Object.values(platforms)
    .filter((p) => PLATFORMS[p.platform] && Object.keys(p.roles).some((r) => POWER_ROLES.includes(r) || r === "soc"))
    .sort((a, b) => a.name.localeCompare(b.name));
  const model = { platforms, systems };
  _cache.set(hass.entities, { devices: hass.devices, model });
  return model;
};

// Roles of a platform completed with the guesses on its unmapped sensors (read from the states, which change).
const guessedRoles = (p, hass) => {
  const roles = { ...p.roles };
  for (const id of p.guessed) {
    const role = guessRole(id, hass.states[id]);
    if (role && !roles[role]) roles[role] = id;
  }
  return roles;
};

const listSystems = (hass) => {
  const m = hass && resolve(hass);
  return m ? m.systems.map((s) => ({ value: s.platform, label: s.name })) : [];
};

// The system the card shows: the integration set with `integration` (any platform, known or not), else the first
// known one; `entities` sets or replaces any role by hand, so that a card can also be built from entities alone.
const findSystem = (hass, config) => {
  const m = resolve(hass);
  if (!m) return { error: "no_registry" };
  const manual = config.entities && typeof config.entities === "object" ? Object.fromEntries(Object.entries(config.entities).filter(([, v]) => v)) : {};
  let p = null;
  if (config.integration) {
    p = m.platforms[config.integration];
    if (!p && !Object.keys(manual).length) return { error: "unknown_integration" };
  } else if (!Object.keys(manual).length) {
    p = m.systems[0];
    if (!p) return { error: "no_system" };
  }
  const roles = { ...(p ? guessedRoles(p, hass) : {}), ...manual };
  return {
    sys: {
      platform: p?.platform || "",
      brand: p?.brand || "generic",
      name: p?.name || "",
      roles,
      switches: p?.switches || [],
      selects: p?.selects || [],
      sign: { ...SIGNS[p?.platform] },
    },
  };
};

// Same dependency list (same length, same objects): what a memoized value was built from has not changed.
const sameDeps = (a, b) => !!a && a.length === b.length && a.every((d, i) => d === b[i]);

// ---------------------------------------------------------------------------
// Power flow
// ---------------------------------------------------------------------------

/**
 * Live powers of a system, in watts: solar (≥ 0), grid (+ import / − export), battery (+ discharge / − charge), home
 * (≥ 0), each null when unknown. The missing one of grid and home is worked out from the others.
 */
const powersOf = (hass, sys, config) => {
  const r = sys.roles;
  const s = (role) => hass.states[r[role]];
  const signed = (role, dirRole, negWord, invert) => {
    let v = watts(s(role));
    if (v !== null) {
      v *= (sys.sign[role] ?? 1) * (invert ? -1 : 1);
      const dir = s(dirRole);
      if (valid(dir)) v = Math.abs(v) * (String(dir.state).toLowerCase().startsWith(negWord) ? -1 : 1);
      return v;
    }
    return null;
  };
  const pair = (plus, minus) => {
    const a = watts(s(plus));
    const b = watts(s(minus));
    return a === null && b === null ? null : Math.abs(a ?? 0) - Math.abs(b ?? 0);
  };
  const solarW = watts(s("solar"));
  const solar = solarW === null ? null : Math.max(0, solarW);
  let grid = signed("grid", "grid_dir", "export", config.invert_grid);
  if (grid === null) grid = pair("grid_import", "grid_export");
  let battery = signed("battery", "battery_dir", "charg", config.invert_battery);
  if (battery === null) battery = pair("battery_discharge", "battery_charge");
  const homeW = watts(s("home"));
  let home = homeW === null ? null : Math.abs(homeW);
  if (home === null && grid !== null) home = Math.max(0, (solar ?? 0) + grid + (battery ?? 0));
  if (grid === null && home !== null) grid = home - (solar ?? 0) - (battery ?? 0);
  return { solar, grid, battery, home };
};

/**
 * Split of the powers into the flows between the nodes: the sun serves the home first, then charges the battery,
 * and exports what is left; the grid covers the rest of the home and of the charge; the battery serves the home
 * (and exports beyond what the sun exports).
 */
const flowsOf = ({ solar, grid, battery, home }) => {
  const S = solar ?? 0;
  const imp = Math.max(0, grid ?? 0);
  const exp = Math.max(0, -(grid ?? 0));
  const charge = Math.max(0, -(battery ?? 0));
  const discharge = Math.max(0, battery ?? 0);
  const solarToGrid = Math.min(S, exp);
  const solarToBattery = Math.min(S - solarToGrid, charge);
  const solarToHome = Math.max(0, Math.min(S - solarToGrid - solarToBattery, home ?? Number.POSITIVE_INFINITY));
  const gridToBattery = Math.max(0, Math.min(imp, charge - solarToBattery));
  const gridToHome = Math.max(0, imp - gridToBattery);
  const batteryToGrid = Math.max(0, Math.min(discharge, exp - solarToGrid));
  const batteryToHome = Math.max(0, discharge - batteryToGrid);
  return { solarToHome, solarToBattery, solarToGrid, gridToHome, gridToBattery, batteryToHome, batteryToGrid };
};

// Duration of one dot step along a flow: the more power, the faster. Every duration divides 3 s, so that a 3 s
// recording (README animations) loops without a jump.
const flowSpeed = (w) => (w >= 3000 ? 0.75 : w >= 1000 ? 1 : w >= 300 ? 1.5 : 3);

// ---------------------------------------------------------------------------
// Shared styles
// ---------------------------------------------------------------------------

const BASE_STYLE = `
  :host { --ec-accent: #a35f00; --ec-ok: var(--success-color, #43a047); --ec-warn: var(--warning-color, #ffa600);
          --ec-crit: var(--error-color, #db4437); --ec-idle: var(--disabled-text-color, #9e9e9e); --ec-active: ${COLORS.solar};
          --ec-solar: ${COLORS.solar}; --ec-grid: ${COLORS.grid}; --ec-export: ${COLORS.export}; --ec-battery: ${COLORS.battery};
          --ec-charge: ${COLORS.charge}; --ec-home: ${COLORS.home};
          /* Text in a state or brand color is mixed with the text color so that it reads at 4.5:1 at least. */
          --ec-accent-text: color-mix(in srgb, var(--ec-accent) 50%, var(--primary-text-color)); }
  ha-card { overflow: hidden; container-type: inline-size; }
  /* A size container has no width of its own content: this empty grid gives the card a natural width. */
  :host { display: block; min-width: 0; --ec-natural-width: 380px; }
  :host::before { content: ""; display: grid; grid-template-columns: minmax(0, var(--ec-natural-width)); height: 0; }
  .icon { width: 18px; height: 18px; fill: currentColor; flex: none; }
  .clickable { cursor: pointer; }
  [role="button"]:focus-visible { outline: 2px solid var(--primary-color, var(--ec-accent)); outline-offset: 2px; border-radius: 4px; }
  @media (prefers-reduced-motion: reduce) { *, *::before, *::after { transition: none !important; animation: none !important; } }
  .ok { --c: var(--ec-ok); } .warn { --c: var(--ec-warn); } .crit { --c: var(--ec-crit); } .idle { --c: var(--ec-idle); } .active { --c: var(--ec-active); }
  .dot { width: 6px; height: 6px; border-radius: 50%; background: var(--c, var(--ec-ok)); flex: none; display: inline-block; }
  .chip { display: inline-flex; align-items: center; gap: 4px; padding: 1px 8px; border-radius: 12px; font-size: 11px; font-weight: 500; white-space: nowrap;
          background: color-mix(in srgb, var(--c, var(--ec-ok)) 15%, transparent); color: color-mix(in srgb, var(--c, var(--ec-ok)) 50%, var(--primary-text-color));
          flex: 0 1 auto; min-width: 0; max-width: 50%; overflow: hidden; box-sizing: border-box; }
  .chip-text { min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
  .bar { position: relative; height: 4px; border-radius: 3px; background: var(--divider-color, rgba(127,127,127,.25)); overflow: hidden; }
  .bar > div { height: 100%; border-radius: 3px; background: var(--c, var(--ec-ok)); transition: width .6s ease; }
  .header { display: flex; align-items: center; gap: 10px; padding: 12px 12px 0; }
  .logo { width: 40px; height: 40px; object-fit: contain; flex: none; }
  a.logo-link { display: flex; flex: none; text-decoration: none; }
  .type-icon { position: relative; width: 40px; height: 40px; border-radius: 50%; display: flex; align-items: center; justify-content: center; flex: none;
               background: color-mix(in srgb, var(--ec-accent) 16%, transparent); }
  .type-icon .icon.type { width: 24px; height: 24px; fill: var(--ec-accent); }
  .type-icon .logo { position: absolute; right: -4px; bottom: -4px; width: 18px; height: 18px; border-radius: 5px;
                     background: var(--card-background-color, #fff);
                     box-shadow: 0 0 0 1px var(--divider-color, rgba(0,0,0,.12)), 0 0 0 3px var(--card-background-color, #fff); }
  .titles { flex: 1 1 0; min-width: 5ch; font-size: 16px; }
  :host([hide-title]) .titles > .name, :host([hide-subtitle]) .titles > .sub { display: none; }
  .name { font-size: 16px; font-weight: 500; line-height: 1.25; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
  .sub { font-size: 12px; color: var(--secondary-text-color); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
  .warning { padding: 16px; color: color-mix(in srgb, var(--ec-warn) 50%, var(--primary-text-color)); }
  .btn { display: inline-flex; align-items: center; justify-content: center; gap: 6px; border: none; cursor: pointer; font: inherit; font-size: 13px;
         font-weight: 500; padding: 6px 12px; border-radius: 18px; background: var(--secondary-background-color, rgba(127,127,127,.12));
         color: var(--primary-text-color); min-width: 0; }
  .btn span { min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
  .btn.primary { background: color-mix(in srgb, var(--ec-accent) 16%, transparent); color: var(--ec-accent-text); }
  .btn.primary:hover { background: color-mix(in srgb, var(--ec-accent) 24%, transparent); }
  .zoom { all: unset; flex: none; cursor: pointer; width: 24px; height: 24px; margin: -4px -4px -4px 0; border-radius: 50%;
          display: grid; place-items: center; color: var(--secondary-text-color); }
  .zoom .icon { width: 16px; height: 16px; }
  .zoom:hover { background: color-mix(in srgb, var(--ec-idle) 16%, transparent); color: var(--primary-text-color); }
  .zoom:focus-visible { outline: 2px solid var(--primary-color, var(--ec-accent)); outline-offset: 1px; }
  @container (max-width: 230px) {
    .chip { padding: 4px; flex: none; }
    .chip-text { display: none; }
  }
  @container (max-width: 200px) { .header { gap: 6px; } }
`;

// In-card confirmation popup, as in the other ha-* cards: a backdrop over the card with a small dialog at the top.
const DIALOG_STYLE = `
  ha-card.dialog-open { position: relative; min-height: 160px; }
  .backdrop { position: absolute; inset: 0; background: rgba(0,0,0,.45); display: flex; align-items: flex-start; justify-content: center;
              padding-top: 12px; box-sizing: border-box; z-index: 9; border-radius: inherit; }
  .modal { background: var(--card-background-color, #1c1c1c); color: var(--primary-text-color); width: min(92%, 340px); max-height: calc(100% - 24px);
           box-sizing: border-box; border-radius: 14px; padding: 16px; box-shadow: 0 8px 30px rgba(0,0,0,.4); display: flex; flex-direction: column; gap: 12px; }
  .modal .msg { font-size: 14px; line-height: 1.4; }
  .modal-actions { display: flex; justify-content: flex-end; gap: 8px; }
`;

// Element names of Home Assistant dialogs (more-info opened from the card, among others).
const DIALOG_TAGS = new Set(["HA-MORE-INFO-DIALOG", "HA-DIALOG", "DIALOG"]);
const isOutside = (card, ev) => {
  const path = ev.composedPath();
  return !path.includes(card) && !path.some((n) => DIALOG_TAGS.has(n.tagName));
};

// After the confirmation popup closes, clicks on the card are ignored for this long (the rest of a double click).
const CONFIRM_GUARD_MS = 400;

// Inlined logos (data: URIs) are written as <img data-img="id"> and get their src once, then the same node is moved
// into every later render: the HTML stays small and the picture is not decoded again on each update.
const DATA_IMGS = [];
const DATA_IMG_IDS = new Map();
const imgTag = (src, attrs) => {
  let id = DATA_IMG_IDS.get(src);
  if (id === undefined) {
    id = DATA_IMGS.push(src) - 1;
    DATA_IMG_IDS.set(src, id);
  }
  return `<img data-img="${id}" ${attrs}>`;
};

// Error sensor values that mean "no error".
const NO_ERROR = new Set(["none", "no_error", "ok", "0", "", "no error", "-"]);

// Elements a click acts on, and how one is told from the others across renders (see _focusedSpot).
const FOCUS_SELECTOR = "[data-action], [data-entity]";
const focusKey = (el) => {
  const data = Object.entries({ ...el.dataset });
  return data.length ? `${el.tagName}|${JSON.stringify(data)}` : "";
};

class EnergyBase extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: "open" });
    this._html = "";
    this.shadowRoot.addEventListener("click", (ev) => this._onClick(ev));
    // Enter / Space on an element with the button role acts as a click, as on a <button>.
    this.shadowRoot.addEventListener("keydown", (ev) => {
      if ((ev.key !== "Enter" && ev.key !== " ") || ev.target?.getAttribute?.("role") !== "button") return;
      ev.preventDefault();
      ev.target.click();
    });
    // Escape closes the confirmation popup (as Cancel).
    this._onKey = (ev) => {
      if (ev.key !== "Escape" || !this._confirm) return;
      ev.stopPropagation();
      this._closeConfirm();
    };
  }

  // Home Assistant pushes a new hass on every state change of the whole instance: the card is only rebuilt when
  // something it shows changed (see _deps).
  set hass(hass) {
    this._hass = hass;
    const deps = this._deps();
    if (deps && sameDeps(this._lastDeps, deps)) return;
    this._lastDeps = deps;
    this._update();
  }

  get hass() {
    return this._hass;
  }

  // What a render reads from hass: the registries, the language, the theme and the state objects of the system's
  // entities. null (no system found): always render.
  _deps() {
    const h = this._hass;
    if (!h || !this._config) return null;
    const { sys } = findSystem(h, this._config);
    if (!sys) return null;
    const ids = [...Object.values(sys.roles), ...sys.switches, ...sys.selects];
    return [h.entities, h.devices, h.language, h.locale, h.themes?.darkMode, ...ids.map((id) => h.states[id])];
  }

  // A click elsewhere on the page folds the sections back to their defaults and closes the popup.
  connectedCallback() {
    this._onOutside ??= (ev) => {
      if ((!this._toggled?.size && !this._confirm) || !isOutside(this, ev)) return;
      this._toggled = new Map();
      if (this._confirm) this._closeConfirm();
      else this._update();
    };
    document.addEventListener("click", this._onOutside, true);
    if (this._confirm) window.addEventListener("keydown", this._onKey);
  }

  disconnectedCallback() {
    document.removeEventListener("click", this._onOutside, true);
    window.removeEventListener("keydown", this._onKey);
    clearTimeout(this._pendingTimer);
  }

  // Service call whose failure Home Assistant already reports (toast); `onError` undoes what the card showed.
  _call(domain, service, data, onError) {
    return Promise.resolve(this._hass.callService(domain, service, data)).catch(() => onError?.());
  }

  setConfig(config) {
    if (!config) throw new Error("Invalid configuration");
    this._config = { ...config };
    // show_title / show_subtitle: the header's title / subtitle, hidden by the stylesheet
    this.toggleAttribute?.("hide-title", config.show_title === false);
    this.toggleAttribute?.("hide-subtitle", config.show_subtitle === false);
    this._html = "";
    this._lastDeps = null;
    this._update();
  }

  _t(key, vars) {
    return t(this._hass, this._config, key, vars);
  }

  _locale() {
    return intlLocale(this._hass, this._config);
  }

  _s(id) {
    return id ? this._hass.states[id] : undefined;
  }

  // State of a role of the system.
  _r(role) {
    return this._s(this._sys?.roles[role]);
  }

  _update() {
    if (!this._hass || !this._config) return;
    let html = this._render();
    if (this._confirm) {
      html = html.replace(/<ha-card>([\s\S]*)<\/ha-card>\s*$/, (_, inner) => `<ha-card class="dialog-open">${inner}${this._confirmHtml()}</ha-card>`);
    }
    if (html === this._html) return;
    const focused = this._confirm && this.shadowRoot.activeElement?.dataset?.action;
    const kept = this._confirm ? null : this._focusedSpot();
    this._html = html;
    this.shadowRoot.innerHTML = html;
    this._placeImages();
    if (kept) this._restoreFocus(kept);
    if (this._confirm) {
      const sel = focused === "confirm_cancel" ? '[data-action="confirm_cancel"]' : ".modal .primary";
      this.shadowRoot.querySelector(sel)?.focus({ preventScroll: true });
    }
  }

  _focusedSpot() {
    const el = this.shadowRoot.activeElement;
    if (!el?.dataset) return null;
    const key = focusKey(el);
    if (!key) return null;
    const index = this._focusables(key).indexOf(el);
    return index < 0 ? null : { key, index };
  }

  _focusables(key) {
    return [...this.shadowRoot.querySelectorAll(FOCUS_SELECTOR)].filter((n) => focusKey(n) === key);
  }

  _restoreFocus({ key, index }) {
    this._focusables(key)[index]?.focus({ preventScroll: true });
  }

  _placeImages() {
    const kept = this._imgNodes || new Map();
    this._imgNodes = new Map();
    for (const img of this.shadowRoot.querySelectorAll("img[data-img]")) {
      const key = `${img.dataset.img}|${img.className}`;
      const old = kept.get(key);
      if (old) {
        kept.delete(key);
        img.replaceWith(old);
        this._imgNodes.set(key, old);
      } else {
        img.setAttribute("src", DATA_IMGS[img.dataset.img]);
        this._imgNodes.set(key, img);
      }
    }
  }

  // Switches only change state on the next poll of the integration: the requested state is shown meanwhile.
  _setPending(id, state) {
    this._pending = { ...this._pending, [id]: { state, until: Date.now() + PENDING_MS } };
    clearTimeout(this._pendingTimer);
    this._pendingTimer = setTimeout(() => this._update(), PENDING_MS + 100);
    this._update();
  }

  _isOn(id) {
    const s = this._s(id);
    const p = this._pending?.[id];
    if (p && (Date.now() > p.until || s?.state === p.state)) delete this._pending[id];
    else if (p) return p.state === "on";
    return s?.state === "on";
  }

  _onClick(ev) {
    const path = ev.composedPath();
    const el = path.find((n) => n.dataset && (n.dataset.entity || n.dataset.action));
    if (!this._confirm && Date.now() - (this._confirmClosedAt ?? 0) < CONFIRM_GUARD_MS) {
      ev.stopPropagation();
      return;
    }
    // Confirmation popup open: only its buttons and the backdrop itself act.
    if (this._confirm) {
      ev.stopPropagation();
      const action = el?.dataset.action;
      if (action === "confirm_ok") {
        const { entity, on } = this._confirm;
        this._closeConfirm();
        this._setPending(entity, on ? "off" : "on");
        this._call("switch", on ? "turn_off" : "turn_on", { entity_id: entity }, () => {
          if (this._pending) delete this._pending[entity];
          this._update();
        });
      } else if (action === "confirm_cancel" || (action === "confirm_backdrop" && path[0] === el)) {
        this._closeConfirm();
      }
      return;
    }
    if (!el) return;
    ev.stopPropagation();
    const { action, entity, label } = el.dataset;
    if (action === "zoom") return this._toggleZoom(ev);
    if (action === "week_day") {
      const day = Number(el.dataset.day);
      this._weekSel = this._weekSel === day ? null : day;
      this._html = null;
      return this._update();
    }
    if (action === "toggle_section") {
      const key = el.dataset.section;
      this._toggled = new Map(this._toggled).set(key, !this._isCollapsed(key));
      return this._update();
    }
    if (action === "switch") {
      // A switch of an inverter or a battery (charge from the grid, off-grid operation…) asks first.
      const on = this._isOn(entity);
      return this._openConfirm({ entity, on, text: this._t(on ? "confirm_off" : "confirm_on", { name: label }), ok: this._t(on ? "turn_off" : "turn_on") });
    }
    if (entity) this.dispatchEvent(new CustomEvent("hass-more-info", { detail: { entityId: entity }, bubbles: true, composed: true }));
  }

  _openConfirm(confirm) {
    this._confirm = confirm;
    window.addEventListener("keydown", this._onKey);
    this._update();
    this.shadowRoot.querySelector(".modal .primary")?.focus();
  }

  _closeConfirm() {
    this._confirm = null;
    this._confirmClosedAt = Date.now();
    window.removeEventListener("keydown", this._onKey);
    this._update();
  }

  _confirmHtml() {
    const c = this._confirm;
    return `<style>${DIALOG_STYLE}</style><div class="backdrop" data-action="confirm_backdrop">
      <div class="modal" role="dialog" aria-modal="true">
        <div class="msg">${esc(c.text)}</div>
        <div class="modal-actions">
          <button class="btn" data-action="confirm_cancel"><span>${esc(this._t("cancel"))}</span></button>
          <button class="btn primary" data-action="confirm_ok"><span>${esc(c.ok)}</span></button>
        </div>
      </div>
    </div>`;
  }

  // Translated state: Home Assistant's own translation of the integration, else a readable version of the value.
  _fmt(stateObj) {
    if (!stateObj) return "—";
    if (this._hass.formatEntityState) {
      try {
        return this._hass.formatEntityState(stateObj);
      } catch (_e) {
        /* older Home Assistant */
      }
    }
    return pretty(stateObj.state);
  }

  // Name of an entity without the device or integration name it starts with.
  _shortName(s) {
    let name = s.attributes?.friendly_name || s.entity_id;
    const dev = this._hass.devices?.[this._hass.entities?.[s.entity_id]?.device_id];
    for (const p of [dev?.name_by_user, dev?.name, this._sys?.name]) if (p && name.startsWith(`${p} `)) name = name.slice(p.length + 1);
    return name;
  }

  _powers() {
    return powersOf(this._hass, this._sys, this._config);
  }

  _soc() {
    const v = num(this._r("soc"));
    return v === null ? null : clamp(v, 0, 100);
  }

  _hasBattery(p) {
    return p.battery !== null || this._soc() !== null;
  }

  // Error of the inverter (error sensor), or null.
  _error() {
    const err = this._r("error");
    return valid(err) && !NO_ERROR.has(String(err.state).toLowerCase()) ? { entity: err.entity_id, text: this._fmt(err) } : null;
  }

  // The grid is down: the grid status binary sensor is off.
  _gridDown() {
    return this._r("grid_status")?.state === "off";
  }

  // Status chip of the header: error, grid outage, producing, battery state, or not producing.
  _status(p) {
    const err = this._error();
    if (err) return { cls: "crit", text: err.text, entity: err.entity };
    if (this._gridDown()) return { cls: "crit", text: this._t("grid_outage"), entity: this._sys.roles.grid_status };
    if (p.solar !== null && p.solar >= FLOW_MIN_W) return { cls: "active", text: this._t("producing"), entity: this._sys.roles.solar };
    if (p.solar === null && p.battery !== null) {
      const b = this._batteryState(p);
      return { cls: b === "idle" ? "idle" : "ok", text: this._t(b), entity: this._sys.roles.battery || this._sys.roles.soc };
    }
    return { cls: "idle", text: this._t("not_producing"), entity: this._sys.roles.solar };
  }

  _batteryState(p) {
    if (p.battery === null || Math.abs(p.battery) < FLOW_MIN_W) return "idle";
    return p.battery < 0 ? "charging" : "discharging";
  }

  // Today's energy, in kWh: produced, consumed, imported, exported, charged, discharged, with the consumption worked
  // out from the others when the integration gives none.
  _today() {
    const g = (role) => kwh(this._r(role));
    const d = { produced: g("solar_today"), consumed: g("home_today"), imported: g("import_today"), exported: g("export_today"), charged: g("charge_today"), discharged: g("discharge_today") };
    if (d.consumed === null && d.produced !== null && d.imported !== null && d.exported !== null)
      d.consumed = Math.max(0, d.produced + d.imported - d.exported + (d.discharged ?? 0) - (d.charged ?? 0));
    d.selfConsumption = d.produced > 0 && d.exported !== null ? clamp((d.produced - d.exported) / d.produced, 0, 1) * 100 : null;
    d.selfSufficiency = d.consumed > 0 && d.imported !== null ? clamp((d.consumed - d.imported) / d.consumed, 0, 1) * 100 : null;
    return d;
  }

  // Subtitle: today's self-sufficiency, else the inverter status.
  _subtitle() {
    const d = this._today();
    if (d.selfSufficiency !== null) return this._t("self_sufficient", { pct: fmtNum(Math.round(d.selfSufficiency), 0, this._locale()) });
    const st = this._r("status");
    return valid(st) ? this._fmt(st) : "";
  }

  // Icon of the kind of device, tinted with the brand color, with the integration's logo as a badge.
  _logo() {
    const b = BRANDS[this._sys.brand];
    const icon = svgIcon(ICONS.panel, "type");
    if (!b.logo) return `<span class="type-icon">${icon}</span>`;
    return `<a class="logo-link type-icon" href="${b.site}" target="_blank" rel="noopener noreferrer" title="${esc(b.name)}">${imgTag(b.logo, `class="logo" alt="${esc(b.name)}"`)}${icon}</a>`;
  }

  _header(status, sub) {
    const title = this._config.title || this._sys.name || this._t("solar");
    return `
      <div class="header">
        ${this._logo()}
        <div class="titles">
          <div class="name">${esc(title)}</div>
          ${sub ? `<div class="sub">${esc(sub)}</div>` : ""}
        </div>
        <span class="chip ${status.entity ? "clickable " : ""}${status.cls}"${status.entity ? ` role="button" tabindex="0" data-entity="${esc(status.entity)}"` : ""} title="${esc(status.text)}" aria-label="${esc(
          status.text,
        )}"><span class="dot"></span><span class="chip-text">${esc(status.text)}</span></span>
        ${this._zoomButton()}
      </div>`;
  }

  // Detail button at the far right of the header (mini card only).
  _zoomButton() {
    return "";
  }

  _errorCard(key) {
    const extra = key === "unknown_integration" ? `: ${this._config.integration}` : "";
    return `<style>${BASE_STYLE}</style><ha-card><div class="warning">${esc(this._t(key) + extra)}</div></ha-card>`;
  }

  _accent() {
    return `:host { --ec-accent: ${BRANDS[this._sys.brand].accent[this._hass?.themes?.darkMode ? 1 : 0]}; }`;
  }

  // Collapsible sections: `collapsed` lists the sections folded by default; a click on a section title folds or
  // unfolds it, and a click elsewhere on the page folds it back.
  _isCollapsed(key) {
    if (this._toggled?.has(key)) return this._toggled.get(key);
    const c = this._config.collapsed ?? DEFAULT_COLLAPSED;
    return (Array.isArray(c) ? c : [c]).includes(key);
  }

  _sectionTitle(key, icon, label) {
    const closed = this._isCollapsed(key);
    return `<div class="section-title toggle" role="button" tabindex="0" data-action="toggle_section" data-section="${key}" aria-expanded="${!closed}">${svgIcon(icon)}<span>${esc(
      label,
    )}</span>${svgIcon(ICONS.chevron_down, "chevron")}</div>`;
  }
}

// ---------------------------------------------------------------------------
// Full card
// ---------------------------------------------------------------------------

// Positions of the nodes in the flow diagram (viewBox 320 wide): the sun on top, the grid on the left, the home on
// the right, the battery below. Without a battery the diagram is a triangle and shorter; without the sun, the grid
// and the home move up.
const NODE_R = 34;
const layoutOf = (hasSolar, hasBattery) => {
  const top = hasSolar ? 42 : 0;
  const mid = hasSolar ? 132 : 46;
  const pos = { grid: [52, mid], home: [268, mid] };
  if (hasSolar) pos.solar = [160, top];
  if (hasBattery) pos.battery = [160, mid + 90];
  return { pos, height: (hasBattery ? mid + 90 : mid) + NODE_R + 8 };
};

// Segment between two nodes, stopping at their edges (with a small gap).
const segment = ([ax, ay], [bx, by]) => {
  const len = Math.hypot(bx - ax, by - ay);
  const ux = (bx - ax) / len;
  const uy = (by - ay) / len;
  const g = NODE_R + 5;
  const f = (v) => Math.round(v * 10) / 10;
  return `M${f(ax + ux * g)} ${f(ay + uy * g)} L${f(bx - ux * g)} ${f(by - uy * g)}`;
};

const FULL_STYLE = `
  .content { padding: 8px 12px 12px; display: flex; flex-direction: column; gap: 12px; }
  .flow { width: 100%; display: block; overflow: visible; font-family: inherit; }
  .flow .track { fill: none; stroke: var(--divider-color, rgba(127,127,127,.25)); stroke-width: 2; }
  .flow .dash { fill: none; stroke-width: 5; stroke-linecap: round; stroke-dasharray: 0 14; animation: ec-flow linear infinite; }
  @keyframes ec-flow { to { stroke-dashoffset: -28; } }
  .flow .node { cursor: pointer; outline: none; }
  .flow .node circle.disc { fill: var(--card-background-color, #fff); stroke-width: 2.5; }
  .flow .node:focus-visible circle.disc { stroke-width: 4; }
  .flow .node .ico { transform-box: fill-box; }
  .flow .value { font-size: 13px; font-weight: 600; fill: var(--primary-text-color); }
  .flow .label { font-size: 9.5px; fill: var(--secondary-text-color); }
  .flow .ring-bg { fill: none; stroke: var(--divider-color, rgba(127,127,127,.25)); stroke-width: 4; }
  .flow .ring { fill: none; stroke-width: 4; stroke-linecap: round; }
  .flow .ring.pulse { animation: ec-pulse 1.5s ease-in-out infinite; }
  .flow .halo { fill: none; stroke: var(--ec-solar); stroke-width: 6; opacity: .25; animation: ec-halo 3s ease-in-out infinite; }
  .flow .outage { stroke: var(--ec-crit); stroke-width: 3; stroke-linecap: round; }
  @keyframes ec-pulse { 0%, 100% { opacity: 1; } 50% { opacity: .45; } }
  @keyframes ec-halo { 0%, 100% { opacity: .12; } 50% { opacity: .38; } }
  .section-title { display: flex; align-items: center; gap: 6px; font-size: 12px; font-weight: 500; text-transform: uppercase;
                   letter-spacing: .04em; color: var(--secondary-text-color); margin-bottom: 6px; }
  .section-title .icon { width: 16px; height: 16px; }
  .section-title span { min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
  .section-title.toggle { cursor: pointer; user-select: none; }
  .section-title.toggle[aria-expanded="false"] { margin-bottom: 0; }
  .section-title .chevron { margin-left: auto; width: 16px; height: 16px; transition: transform .2s ease; }
  .section-title.toggle[aria-expanded="false"] .chevron { transform: rotate(-90deg); }
  .batt { display: flex; flex-direction: column; gap: 6px; }
  .batt.out { --c: var(--ec-battery); }
  .batt-top { display: flex; align-items: baseline; gap: 8px; min-width: 0; }
  .batt-top .pct { font-size: 26px; line-height: 1; }
  .batt-top .pct small { font-size: 13px; margin-left: 2px; color: var(--secondary-text-color); }
  .batt-top .state { font-size: 13px; color: var(--secondary-text-color); min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
  .batt-top .state .icon { width: 14px; height: 14px; vertical-align: -2px; margin-right: 2px; color: var(--c); }
  .batt .bar { height: 6px; }
  .batt .bar .mark { position: absolute; top: 0; bottom: 0; width: 2px; background: var(--primary-text-color); opacity: .45; border-radius: 0; }
  .tags { display: flex; flex-wrap: wrap; gap: 4px; }
  .tag { display: inline-flex; align-items: center; gap: 4px; font-size: 11px; padding: 2px 6px; border-radius: 8px;
         background: var(--secondary-background-color, rgba(127,127,127,.12)); color: var(--primary-text-color); white-space: nowrap;
         max-width: 100%; min-width: 0; box-sizing: border-box; }
  .tag span { min-width: 0; overflow: hidden; text-overflow: ellipsis; }
  .tag .icon { width: 14px; height: 14px; color: var(--secondary-text-color); }
  .tiles { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 6px; }
  .week { display: grid; grid-template-columns: repeat(7, minmax(0, 1fr)); gap: 4px; height: 72px; align-items: end; }
  .wday { all: unset; box-sizing: border-box; display: flex; flex-direction: column; align-items: center; gap: 2px; height: 100%; cursor: pointer; border-radius: 6px; }
  .wday.sel { background: color-mix(in srgb, var(--primary-text-color) 8%, transparent); }
  .wday:focus-visible { outline: 2px solid var(--primary-color, #03a9f4); outline-offset: 1px; }
  .wbars { flex: 1; width: 100%; display: flex; align-items: flex-end; justify-content: center; gap: 2px; }
  .wbar { width: 40%; max-width: 10px; border-radius: 3px 3px 0 0; }
  .wbar.prod { background: var(--ec-solar); }
  .wbar.cons { background: var(--ec-home); }
  .wlbl { font-size: 10px; color: var(--secondary-text-color); }
  .wtotals { display: flex; flex-wrap: wrap; gap: 4px 12px; font-size: 12px; margin-top: 4px; }
  .wwhen { color: var(--secondary-text-color); }
  .wtotals > span { display: inline-flex; align-items: center; gap: 4px; }
  .wtotals .icon { width: 14px; height: 14px; }
  .wtotals .prod .icon { color: var(--ec-solar); }
  .wtotals .cons .icon { color: var(--ec-home); }
  .tile { display: flex; flex-direction: column; gap: 2px; padding: 6px 10px; border-radius: 10px; min-width: 0;
          background: var(--secondary-background-color, rgba(127,127,127,.08)); }
  .tile .k { display: flex; align-items: center; gap: 4px; font-size: 11px; color: var(--secondary-text-color); white-space: nowrap; overflow: hidden; }
  .tile .k span { min-width: 0; overflow: hidden; text-overflow: ellipsis; }
  .tile .k .icon { width: 14px; height: 14px; color: var(--c, var(--secondary-text-color)); }
  .tile .v { font-size: 14px; font-weight: 500; line-height: 1.3; overflow-wrap: anywhere; }
  .options { display: flex; flex-direction: column; gap: 4px; }
  .option { display: flex; align-items: center; gap: 8px; font-size: 13px; min-width: 0; }
  .option .lbl { flex: 1; min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
  .option .lbl .icon { width: 16px; height: 16px; color: var(--secondary-text-color); vertical-align: -3px; margin-right: 6px; }
  .option .val { font-size: 12px; color: var(--secondary-text-color); max-width: 45%; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
  .toggle-btn { all: unset; cursor: pointer; width: 34px; height: 18px; border-radius: 9px; position: relative; flex: none;
                background: var(--divider-color, rgba(127,127,127,.3)); transition: background .2s ease; }
  .toggle-btn::after { content: ""; position: absolute; top: 2px; left: 2px; width: 14px; height: 14px; border-radius: 50%; background: #fff;
                       box-shadow: 0 1px 2px rgba(0,0,0,.3); transition: transform .2s ease; }
  .toggle-btn.on { background: var(--ec-accent); }
  .toggle-btn.on::after { transform: translateX(16px); }
  .toggle-btn:focus-visible { outline: 2px solid var(--primary-color, var(--ec-accent)); outline-offset: 2px; }
  .alert-line { display: flex; align-items: center; gap: 6px; font-size: 13px; color: color-mix(in srgb, var(--ec-crit) 50%, var(--primary-text-color)); }
  .alert-line .icon { width: 16px; height: 16px; color: var(--ec-crit); }
  /* Narrow card: the diagram scales down with the card, so its figures grow in its own units and the labels go. */
  @container (max-width: 360px) {
    .tiles { grid-template-columns: repeat(2, minmax(0, 1fr)); }
    .flow .value { font-size: 16px; transform: translateY(5px); }
    .flow .label { display: none; }
  }
  @container (max-width: 220px) { .tiles { grid-template-columns: minmax(0, 1fr); } }
`;

class EnergyCard extends EnergyBase {
  static getConfigElement() {
    return document.createElement("energy-card-editor");
  }

  static getStubConfig(hass) {
    const m = hass && resolve(hass);
    return m?.systems[0] ? { integration: m.systems[0].platform } : {};
  }

  getCardSize() {
    return 8;
  }

  // Below 9 of 12 columns (~240 px in the narrowest Sections view) the diagram's figures get too small to read.
  getGridOptions() {
    return { columns: 12, min_columns: 9 };
  }

  _render() {
    const { sys, error } = findSystem(this._hass, this._config);
    if (error) return this._errorCard(error);
    this._sys = sys;
    const c = this._config;
    const p = this._powers();
    const parts = [];
    const err = this._error();
    if (err) parts.push(`<div class="alert-line clickable" role="button" tabindex="0" data-entity="${esc(err.entity)}">${svgIcon(ICONS.alert)}<span>${esc(err.text)}</span></div>`);
    if (c.show_flow !== false) parts.push(this._flow(p));
    if (c.show_battery !== false) parts.push(this._battery(p));
    if (c.show_today !== false) parts.push(this._todaySection());
    if (c.show_week !== false) parts.push(this._weekSection());
    if (c.show_options !== false) parts.push(this._options());
    return `<style>${BASE_STYLE}${FULL_STYLE}${this._accent()}</style>
      <ha-card>
        ${this._header(this._status(p), this._subtitle())}
        <div class="content">${parts.filter(Boolean).join("")}</div>
      </ha-card>`;
  }

  // Live power flow: one node per source or sink, a track between the nodes, and moving dots along the tracks that
  // carry power, in the color of their source, faster with more power.
  _flow(p) {
    const hasSolar = p.solar !== null;
    const hasBattery = this._hasBattery(p);
    if (!hasSolar && p.grid === null && !hasBattery) return "";
    const { pos, height } = layoutOf(hasSolar, hasBattery);
    const f = flowsOf(p);
    const L = this._locale();
    const links = [
      ["solar", "home", f.solarToHome, "solar"],
      ["solar", "battery", f.solarToBattery, "solar"],
      ["solar", "grid", f.solarToGrid, "solar"],
      ["grid", "home", f.gridToHome, "grid"],
      ["grid", "battery", f.gridToBattery, "grid"],
      ["battery", "home", f.batteryToHome, "battery"],
      ["battery", "grid", f.batteryToGrid, "battery"],
    ].filter(([a, b]) => pos[a] && pos[b]);
    const tracks = links.map(([a, b]) => `<path class="track" d="${segment(pos[a], pos[b])}"/>`).join("");
    // Off the grid, nothing flows from or to it, whatever its meter still reads.
    const down = this._gridDown();
    const dashes = links
      .filter(([a, b, w]) => w >= FLOW_MIN_W && !(down && (a === "grid" || b === "grid")))
      .map(([a, b, w, col]) => `<path class="dash" d="${segment(pos[a], pos[b])}" style="stroke:var(--ec-${col});animation-duration:${flowSpeed(w)}s"/>`)
      .join("");

    const soc = this._soc();
    const bState = this._batteryState(p);
    const imp = (p.grid ?? 0) >= FLOW_MIN_W;
    const exp = (p.grid ?? 0) <= -FLOW_MIN_W;
    const nodes = [];
    if (hasSolar) {
      const on = p.solar >= FLOW_MIN_W;
      nodes.push(this._node("solar", pos.solar, ICONS.solar, on ? "var(--ec-solar)" : null, fmtPower(p.solar, L), this._t("solar"), on ? `<circle class="halo" cx="${pos.solar[0]}" cy="${pos.solar[1]}" r="${NODE_R + 4}"/>` : ""));
    }
    const gridLabel = down ? this._t("grid_outage") : imp ? this._t("import") : exp ? this._t("export") : this._t("grid");
    const [gx, gy] = pos.grid;
    nodes.push(
      this._node(
        "grid",
        pos.grid,
        ICONS.grid,
        down ? "var(--ec-crit)" : imp ? "var(--ec-grid)" : exp ? "var(--ec-export)" : null,
        down ? "—" : fmtPower(p.grid, L),
        gridLabel,
        "",
        down ? `<path class="outage" d="M${gx + 18} ${gy - 30} l10 10 m0 -10 l-10 10"/>` : "",
        this._sys.roles.grid ? "grid" : this._sys.roles.grid_import ? "grid_import" : "grid_status",
      ),
    );
    nodes.push(this._node("home", pos.home, ICONS.home, p.home !== null && p.home >= FLOW_MIN_W ? "var(--ec-home)" : null, fmtPower(p.home, L), this._t("home")));
    if (hasBattery) {
      const [bx, by] = pos.battery;
      const color = bState === "charging" ? "var(--ec-charge)" : bState === "discharging" ? "var(--ec-battery)" : null;
      const ring =
        soc === null
          ? ""
          : `<circle class="ring-bg" cx="${bx}" cy="${by}" r="${NODE_R + 5}"/><circle class="ring${bState === "charging" ? " pulse" : ""}" cx="${bx}" cy="${by}" r="${NODE_R + 5}" pathLength="100" stroke-dasharray="${Math.round(soc)} 100" transform="rotate(-90 ${bx} ${by})" style="stroke:var(--ec-${levelClass(soc)})"/>`;
      const value = p.battery === null ? fmtPct(soc, L) : fmtPower(p.battery, L);
      const label = soc === null ? this._t(bState) : `${fmtPct(soc, L)}`;
      nodes.push(this._node("battery", pos.battery, ICONS.battery, color, value, p.battery === null ? this._t("battery") : label, ring, "", this._sys.roles.battery ? "battery" : this._sys.roles.battery_discharge ? "battery_discharge" : "soc"));
    }
    return `<svg class="flow" viewBox="0 -2 320 ${height}" role="group" aria-label="${esc(this._t("flow"))}">${tracks}${dashes}${nodes.join("")}</svg>`;
  }

  // A node of the diagram: a disc in the color of what it does (or neutral at rest), its icon, its power and a label;
  // `under` is drawn below the disc (halo, battery ring), `over` above it (grid outage cross).
  _node(key, [cx, cy], icon, color, value, label, under = "", over = "", role = key) {
    const id = this._sys.roles[role] || "";
    const stroke = color || "var(--divider-color, rgba(127,127,127,.35))";
    const iconColor = color || "var(--secondary-text-color)";
    return `<g class="node" role="button" tabindex="0" data-entity="${esc(id)}" aria-label="${esc(`${this._t(key)} ${value}`)}">
      ${under}<circle class="disc" cx="${cx}" cy="${cy}" r="${NODE_R}" style="stroke:${stroke}"/>
      <path class="ico" d="${icon}" transform="translate(${cx - 10} ${cy - 27}) scale(.84)" style="fill:${iconColor}"/>
      <text class="value" x="${cx}" y="${cy + 7}" text-anchor="middle">${esc(value)}</text>
      <text class="label" x="${cx}" y="${cy + 20}" text-anchor="middle">${esc(label)}</text>${over}
    </g>`;
  }

  // Battery: level with the backup reserve marked on its bar, charging or discharging power and the time to full or
  // to the reserve, the mode, the reserve and the capacity.
  _battery(p) {
    const soc = this._soc();
    if (soc === null && p.battery === null) return "";
    const L = this._locale();
    const title = this._sectionTitle("battery", ICONS.battery, this._t("battery"));
    if (this._isCollapsed("battery")) return `<div>${title}</div>`;
    const state = this._batteryState(p);
    const reserve = num(this._r("reserve"));
    const cap = kwh(this._r("battery_capacity"));
    const stored = kwh(this._r("battery_energy")) ?? (cap !== null && soc !== null ? (cap * soc) / 100 : null);
    let eta = "";
    if (cap && stored !== null && Math.abs(p.battery ?? 0) >= 50) {
      const kw = Math.abs(p.battery) / 1000;
      if (state === "charging") eta = this._t("full_in", { time: fmtHours(Math.max(0, cap - stored) / kw, L) });
      else if (state === "discharging") eta = this._t("empty_in", { time: fmtHours(Math.max(0, stored - (cap * (reserve ?? 0)) / 100) / kw, L) });
    }
    const cls = levelClass(soc);
    const stateIcon = state === "charging" ? ICONS.bolt : state === "discharging" ? ICONS.down : "";
    const stateText = [state === "idle" ? this._t("idle") : `${this._t(state)} · ${fmtPower(p.battery, L)}`, eta].filter(Boolean).join(" · ");
    const socId = this._sys.roles.soc;
    const tags = [];
    const tag = (role, icon, text) => {
      const id = this._sys.roles[role];
      if (text) tags.push(`<span class="tag${id ? ` clickable" role="button" tabindex="0" data-entity="${esc(id)}` : ""}">${svgIcon(icon)}<span>${esc(text)}</span></span>`);
    };
    const mode = this._r("mode");
    if (valid(mode)) tag("mode", ICONS.mode, this._fmt(mode));
    if (reserve !== null) tag("reserve", ICONS.shield, this._t("reserve", { pct: fmtNum(Math.round(reserve), 0, L) }));
    if (cap) tag("battery_capacity", ICONS.capacity, fmtEnergy(cap, L));
    return `<div>
      ${title}
      <div class="batt ${state === "charging" ? "ok" : state === "discharging" ? "out" : "idle"}">
        <div class="batt-top">
          ${
            soc === null
              ? ""
              : `<span class="pct clickable ${cls}" role="button" tabindex="0" data-entity="${esc(socId)}">${fmtNum(Math.round(soc), 0, L)}<small>%</small></span>`
          }
          <span class="state">${stateIcon ? svgIcon(stateIcon) : ""}${esc(stateText)}</span>
        </div>
        ${
          soc === null
            ? ""
            : `<div class="bar ${cls}"><div style="width:${soc}%"></div>${reserve ? `<span class="mark" style="left:calc(${clamp(reserve, 0, 100)}% - 1px)"></span>` : ""}</div>`
        }
        ${tags.length ? `<div class="tags">${tags.join("")}</div>` : ""}
      </div>
    </div>`;
  }

  // Today's energy: one tile per figure the integration gives, plus self-consumption and self-sufficiency.
  _todaySection() {
    const d = this._today();
    const L = this._locale();
    const tiles = [];
    const tile = (role, icon, color, key, value) => {
      if (value === null) return;
      const id = role && this._sys.roles[role];
      const attrs = id ? ` clickable" role="button" tabindex="0" data-entity="${esc(id)}` : "";
      tiles.push(`<div class="tile${attrs}" style="--c:${color}"><div class="k">${svgIcon(icon)}<span>${esc(this._t(key))}</span></div><div class="v">${esc(value)}</div></div>`);
    };
    const e = (v) => (v === null ? null : fmtEnergy(v, L));
    tile("solar_today", ICONS.solar, "var(--ec-solar)", "produced", e(d.produced));
    tile("home_today", ICONS.home, "var(--ec-home)", "consumed", e(d.consumed));
    tile("import_today", ICONS.down, "var(--ec-grid)", "imported", e(d.imported));
    tile("export_today", ICONS.up, "var(--ec-export)", "exported", e(d.exported));
    tile("charge_today", ICONS.bolt, "var(--ec-charge)", "charged", e(d.charged));
    tile("discharge_today", ICONS.battery, "var(--ec-battery)", "discharged", e(d.discharged));
    tile(null, ICONS.solar, "var(--ec-solar)", "self_consumption", d.selfConsumption === null ? null : fmtPct(d.selfConsumption, L));
    tile(null, ICONS.leaf, "var(--ec-ok)", "self_sufficiency", d.selfSufficiency === null ? null : fmtPct(d.selfSufficiency, L));
    if (!tiles.length) return "";
    return `<div>
      ${this._sectionTitle("today", ICONS.calendar, this._t("today"))}
      ${this._isCollapsed("today") ? "" : `<div class="tiles">${tiles.join("")}</div>`}
    </div>`;
  }

  // Production and consumption of each of the last 7 days (today included), from the daily change of the "today"
  // energy sensors in the recorder's statistics: one query, again every hour; rendered again when it comes.
  _fetchWeek() {
    const ids = ["solar_today", "home_today"].map((role) => this._sys.roles[role]).filter(Boolean);
    const key = ids.join(",");
    if (!key || !this._hass.callWS || this._weekBusy) return;
    if (this._weekKey === key && Date.now() - (this._weekAt || 0) < 3600000) return;
    this._weekBusy = true;
    this._weekKey = key;
    this._weekAt = Date.now();
    const start = new Date();
    start.setHours(0, 0, 0, 0);
    start.setDate(start.getDate() - 6);
    this._hass
      .callWS({ type: "recorder/statistics_during_period", statistic_ids: ids, period: "day", types: ["change"], start_time: start.toISOString(), units: { energy: "kWh" } })
      .then((x) => {
        this._week = { start: start.getTime(), rows: x || {} };
      })
      .catch(() => {})
      .finally(() => {
        this._weekBusy = false;
        this._html = null;
        this._update();
      });
  }

  // The 7 days, oldest first: { day (ms), produced, consumed } (null where unknown).
  _weekDays() {
    if (!this._week) return [];
    const byDay = (role) => {
      const out = new Map();
      for (const r of this._week.rows[this._sys.roles[role]] || []) {
        const t = typeof r.start === "number" ? r.start : Date.parse(r.start);
        const d = new Date(t);
        d.setHours(0, 0, 0, 0);
        if (Number.isFinite(Number(r.change))) out.set(d.getTime(), Math.max(0, Number(r.change)));
      }
      return out;
    };
    const prod = byDay("solar_today");
    const cons = byDay("home_today");
    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date(this._week.start);
      d.setDate(d.getDate() + i);
      const t = d.getTime();
      return { day: t, produced: prod.get(t) ?? null, consumed: cons.get(t) ?? null };
    });
  }

  _weekSection() {
    this._fetchWeek();
    const days = this._weekDays();
    if (!days.some((d) => d.produced !== null || d.consumed !== null)) return "";
    const L = this._locale();
    const max = Math.max(...days.flatMap((d) => [d.produced || 0, d.consumed || 0]), 0.001);
    // Short names: the narrow letters repeat (T W T F S S M).
    const weekday = new Intl.DateTimeFormat(L, { weekday: "short" });
    const longDay = new Intl.DateTimeFormat(L, { weekday: "long", day: "numeric", month: "short" });
    // A day tapped (or clicked): its values replace the week's totals until it is tapped again.
    const sel = Number.isInteger(this._weekSel) && days[this._weekSel] ? this._weekSel : null;
    const total = (k) => days.reduce((sum, d) => sum + (d[k] || 0), 0);
    const bars = days
      .map((d, i) => {
        const h = (v) => `${v === null ? 0 : Math.max(2, Math.round((v / max) * 100))}%`;
        const title = `${longDay.format(d.day)} · ${this._t("produced")} ${fmtEnergy(d.produced, L)} · ${this._t("consumed")} ${fmtEnergy(d.consumed, L)}`;
        return `<button class="wday${i === sel ? " sel" : ""}" data-action="week_day" data-day="${i}" aria-pressed="${i === sel}" title="${esc(title)}"><span class="wbars"><span class="wbar prod" style="height:${h(d.produced)}"></span><span class="wbar cons" style="height:${h(d.consumed)}"></span></span><span class="wlbl">${esc(weekday.format(d.day))}</span></button>`;
      })
      .join("");
    const pick = sel === null ? null : days[sel];
    return `<div>
      ${this._sectionTitle("week", ICONS.calendar, this._t("week"))}
      ${
        this._isCollapsed("week")
          ? ""
          : `<div class="week">${bars}</div><div class="wtotals" aria-live="polite">${pick ? `<span class="wwhen">${esc(longDay.format(pick.day))}</span>` : ""}<span class="prod">${svgIcon(ICONS.solar)}${esc(fmtEnergy(pick ? pick.produced : total("produced"), L))}</span><span class="cons">${svgIcon(ICONS.home)}${esc(fmtEnergy(pick ? pick.consumed : total("consumed"), L))}</span></div>`
      }
    </div>`;
  }

  // Switches of the integration (charge from the grid, off-grid operation…) as toggles that ask first, and its selects
  // (storage mode, work mode…) with their value, opening their dialog.
  _options() {
    const items = (ids) =>
      ids
        .map((id) => this._s(id))
        .filter((s) => s && s.state !== "unavailable" && s.entity_id !== this._sys.roles.mode)
        .map((s) => ({ id: s.entity_id, name: this._shortName(s), s }))
        .sort((a, b) => a.name.localeCompare(b.name));
    const switches = items(this._sys.switches);
    const selects = items(this._sys.selects);
    if (!switches.length && !selects.length) return "";
    const title = this._sectionTitle("options", ICONS.options, this._t("options"));
    if (this._isCollapsed("options")) return `<div>${title}</div>`;
    const controls = this._config.show_controls !== false;
    const rows = [
      ...switches.map((o) => {
        const on = this._isOn(o.id);
        const ctl = controls
          ? `<button class="toggle-btn${on ? " on" : ""}" role="switch" aria-checked="${on}" aria-label="${esc(o.name)}" data-action="switch" data-entity="${esc(o.id)}" data-label="${esc(o.name)}"></button>`
          : `<span class="val">${esc(this._t(on ? "on" : "off"))}</span>`;
        return `<div class="option"><span class="lbl clickable" role="button" tabindex="0" data-entity="${esc(o.id)}">${svgIcon(ICONS.options)}${esc(o.name)}</span>${ctl}</div>`;
      }),
      ...selects.map(
        (o) =>
          `<div class="option clickable" role="button" tabindex="0" data-entity="${esc(o.id)}"><span class="lbl">${svgIcon(ICONS.mode)}${esc(o.name)}</span><span class="val">${esc(this._fmt(o.s))}</span></div>`,
      ),
    ];
    return `<div>${title}<div class="options">${rows.join("")}</div></div>`;
  }
}

// ---------------------------------------------------------------------------
// Mini card
// ---------------------------------------------------------------------------

const MINI_STYLE = `
  :host { --ec-natural-width: 320px; }
  .content { padding: 8px 12px 12px; display: grid; grid-template-columns: repeat(var(--cols, 4), minmax(0, 1fr)); gap: 6px; }
  .stat { display: flex; flex-direction: column; align-items: center; gap: 2px; padding: 6px 4px; border-radius: 10px; min-width: 0;
          background: color-mix(in srgb, var(--c, var(--ec-idle)) 10%, var(--secondary-background-color, rgba(127,127,127,.08))); }
  .stat .icon { width: 20px; height: 20px; color: var(--c, var(--secondary-text-color)); }
  .stat .v { font-size: 13px; font-weight: 600; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; max-width: 100%; }
  .stat .k { font-size: 10.5px; color: var(--secondary-text-color); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; max-width: 100%; }
  .stat .bar { width: 80%; margin-top: 2px; }
  @container (max-width: 250px) { .content { grid-template-columns: repeat(2, minmax(0, 1fr)); } }
`;

// The mini card is a full card drawn compact: its detail button (top right, `zoom: false` removes it) switches it to
// the full card's content and back, and a click anywhere else on the page brings the compact view back.
class EnergyMiniCard extends EnergyCard {
  constructor() {
    super();
    this._onUnzoom = (ev) => {
      if (this._zoomed && isOutside(this, ev)) this._setZoom(false);
    };
  }

  static getConfigElement() {
    return document.createElement("energy-mini-card-editor");
  }

  connectedCallback() {
    super.connectedCallback();
    document.addEventListener("click", this._onUnzoom, true);
  }

  disconnectedCallback() {
    super.disconnectedCallback();
    document.removeEventListener("click", this._onUnzoom, true);
  }

  getCardSize() {
    return this._zoomed ? super.getCardSize() : 3;
  }

  getGridOptions() {
    return { ...(this._zoomed ? super.getGridOptions() : { columns: 6, min_columns: 6 }), rows: "auto" };
  }

  _zoomButton() {
    if (this._config.zoom === false) return "";
    const z = this._zoomed;
    const label = esc(this._t(z ? "zoom_out" : "zoom_in"));
    return `<button class="zoom" data-action="zoom" title="${label}" aria-label="${label}">${svgIcon(z ? ICONS.collapse : ICONS.expand)}</button>`;
  }

  _setZoom(on) {
    this._zoomed = on;
    this._update();
    // getCardSize()/getGridOptions() changed: tell the view to re-measure the card.
    this.dispatchEvent(new CustomEvent("iron-resize", { bubbles: true, composed: true }));
  }

  _toggleZoom(ev) {
    this._setZoom(!this._zoomed);
    if (ev.detail === 0) this.shadowRoot.querySelector(".zoom")?.focus({ preventScroll: true });
  }

  _render() {
    if (this._zoomed) return super._render();
    const { sys, error } = findSystem(this._hass, this._config);
    if (error) return this._errorCard(error);
    this._sys = sys;
    const p = this._powers();
    const L = this._locale();
    const r = sys.roles;
    const stats = [];
    const stat = (id, icon, color, value, label, extra = "") =>
      stats.push(
        `<div class="stat clickable" role="button" tabindex="0" data-entity="${esc(id || "")}" style="--c:${color}" aria-label="${esc(`${label} ${value}`)}">${svgIcon(icon)}<span class="v">${esc(value)}</span><span class="k">${esc(label)}</span>${extra}</div>`,
      );
    if (p.solar !== null) stat(r.solar, ICONS.solar, p.solar >= FLOW_MIN_W ? "var(--ec-solar)" : "var(--ec-idle)", fmtPower(p.solar, L), this._t("solar"));
    stat(r.home, ICONS.home, "var(--ec-home)", fmtPower(p.home, L), this._t("home"));
    if (p.grid !== null || r.grid_status) {
      const down = this._gridDown();
      const g = p.grid ?? 0;
      const color = down ? "var(--ec-crit)" : g >= FLOW_MIN_W ? "var(--ec-grid)" : g <= -FLOW_MIN_W ? "var(--ec-export)" : "var(--ec-idle)";
      const label = down ? this._t("grid_outage") : g >= FLOW_MIN_W ? this._t("import") : g <= -FLOW_MIN_W ? this._t("export") : this._t("grid");
      stat(r.grid || r.grid_import || r.grid_status, ICONS.grid, color, down ? "—" : fmtPower(p.grid, L), label);
    }
    if (this._hasBattery(p)) {
      const soc = this._soc();
      const state = this._batteryState(p);
      const color = state === "charging" ? "var(--ec-charge)" : state === "discharging" ? "var(--ec-battery)" : "var(--ec-idle)";
      const bar = soc === null ? "" : `<div class="bar ${levelClass(soc)}"><div style="width:${soc}%"></div></div>`;
      stat(r.soc || r.battery, state === "charging" ? ICONS.bolt : ICONS.battery, color, soc === null ? fmtPower(p.battery, L) : fmtPct(soc, L), this._t(state === "idle" ? "battery" : state), bar);
    }
    return `<style>${BASE_STYLE}${MINI_STYLE}${this._accent()}</style>
      <ha-card>
        ${this._header(this._status(p), "")}
        <div class="content" style="--cols:${stats.length}">${stats.join("")}</div>
      </ha-card>`;
  }
}

// ---------------------------------------------------------------------------
// Visual editors (ha-form)
// ---------------------------------------------------------------------------

const LANGUAGES = [
  ["en", "English"],
  ["fr", "Français"],
  ["de", "Deutsch"],
  ["es", "Español"],
  ["sr", "Српски"],
  ["sr-Latn", "Srpski (latinica)"],
  ["it", "Italiano"],
  ["nl", "Nederlands"],
  ["pt", "Português (Portugal)"],
  ["pl", "Polski"],
  ["ro", "Română"],
  ["da", "Dansk"],
  ["sv", "Svenska"],
  ["bg", "Български"],
  ["ru", "Русский"],
  ["uk", "Українська"],
  ["hu", "Magyar"],
  ["sk", "Slovenčina"],
  ["cs", "Čeština"],
  ["sl", "Slovenščina"],
  ["lv", "Latviešu"],
  ["el", "Ελληνικά"],
];

class EnergyEditorBase extends HTMLElement {
  // [name, default]
  static get toggles() {
    return [];
  }

  static get selects() {
    return {};
  }

  static extraFields() {
    return [];
  }

  setConfig(config) {
    this._config = { ...config };
    this._render();
  }

  set hass(hass) {
    this._hass = hass;
    this._render();
  }

  _schema() {
    const tr = (k) => t(this._hass, this._config, k);
    const systems = listSystems(this._hass);
    return [
      { name: "integration", selector: { select: { mode: "dropdown", custom_value: true, options: systems } } },
      { name: "title", selector: { text: {} } },
      ...this.constructor.extraFields(tr),
      { type: "grid", name: "", schema: this.constructor.toggles.map(([name]) => ({ name, selector: { boolean: {} } })) },
      {
        name: "language",
        selector: { select: { mode: "dropdown", options: [{ value: "", label: tr("lang_auto") }, ...LANGUAGES.map(([value, label]) => ({ value, label }))] } },
      },
    ];
  }

  _render() {
    if (!this._hass || !this._config) return;
    const toggles = this.constructor.toggles;
    if (!this._form) {
      this._form = document.createElement("ha-form");
      this._form.computeLabel = (s) => t(this._hass, this._config, s.name);
      this._form.computeHelper = (s) => (s.name === "zoom" ? t(this._hass, this._config, "zoom_helper") : undefined);
      this._form.addEventListener("value-changed", (ev) => {
        ev.stopPropagation();
        const config = { ...ev.detail.value };
        const defaults = { ...Object.fromEntries(toggles), ...this.constructor.selects };
        if (config.entities && typeof config.entities === "object") {
          const ents = Object.fromEntries(Object.entries(config.entities).filter(([, v]) => v));
          if (Object.keys(ents).length) config.entities = ents;
          else delete config.entities;
        }
        // Keep the YAML minimal: drop empty values and options left at their default.
        for (const [k, v] of Object.entries(config)) {
          if (v === "" || v === undefined || v === null || (k in defaults && JSON.stringify(v) === JSON.stringify(defaults[k]))) delete config[k];
        }
        this._config = config;
        this.dispatchEvent(new CustomEvent("config-changed", { detail: { config }, bubbles: true, composed: true }));
      });
      this.appendChild(this._form);
    }
    const data = { ...this.constructor.selects, ...this._config };
    for (const [name, def] of toggles) if (data[name] === undefined) data[name] = def;
    if (!data.integration && !data.entities) data.integration = EnergyCard.getStubConfig(this._hass).integration;
    this._form.hass = this._hass;
    // A new data or schema object re-renders the whole form: only hand over new ones when they changed.
    const h = this._hass;
    const dataDeps = [this._config, h.entities, h.devices];
    if (!sameDeps(this._dataDeps, dataDeps)) {
      this._dataDeps = dataDeps;
      this._form.data = data;
    }
    const deps = [lang(h, this._config), h.entities, h.devices];
    if (!sameDeps(this._schemaDeps, deps)) {
      this._schemaDeps = deps;
      this._form.schema = this._schema();
    }
  }
}

class EnergyCardEditor extends EnergyEditorBase {
  static get toggles() {
    return [
      ["show_title", true],
      ["show_subtitle", true],
      ["show_flow", true],
      ["show_battery", true],
      ["show_today", true],
      ["show_week", true],
      ["show_options", true],
      ["show_controls", true],
      ["invert_grid", false],
      ["invert_battery", false],
    ];
  }

  static get selects() {
    return { collapsed: DEFAULT_COLLAPSED };
  }

  static extraFields(tr) {
    const power = { entity: { domain: "sensor", device_class: "power" } };
    return [
      {
        name: "collapsed",
        selector: { select: { multiple: true, mode: "list", options: ["battery", "today", "options"].map((value) => ({ value, label: tr(value) })) } },
      },
      {
        type: "expandable",
        name: "entities",
        title: tr("entities"),
        schema: [
          { name: "solar", selector: power },
          { name: "grid", selector: power },
          { name: "battery", selector: power },
          { name: "soc", selector: { entity: { domain: "sensor", device_class: "battery" } } },
          { name: "home", selector: power },
        ],
      },
    ];
  }
}

class EnergyMiniCardEditor extends EnergyEditorBase {
  static get toggles() {
    return [["zoom", true]];
  }
}

// ---------------------------------------------------------------------------
// Registration
// ---------------------------------------------------------------------------

const define = (name, cls) => {
  if (!customElements.get(name)) customElements.define(name, cls);
};
define("energy-card", EnergyCard);
define("energy-mini-card", EnergyMiniCard);
define("energy-card-editor", EnergyCardEditor);
define("energy-mini-card-editor", EnergyMiniCardEditor);

window.customCards = window.customCards || [];
for (const card of [
  {
    type: "energy-card",
    name: "Energy Card",
    description: "Solar inverter and home battery (Enphase, SolarEdge, Fronius, Huawei, SMA, Tesla Powerwall, Growatt…): live power flow, battery, today's energy and options.",
  },
  {
    type: "energy-mini-card",
    name: "Energy Mini Card",
    description: "Compact solar and battery overview: solar, home, grid and battery at a glance.",
  },
]) {
  if (!window.customCards.some((c) => c.type === card.type))
    window.customCards.push({ ...card, preview: true, documentationURL: "https://github.com/juju35/ha-energy-card" });
}

console.info(`%c ENERGY-CARD %c v${VERSION} `, "color: white; background: #a35f00; font-weight: 700;", "color: #a35f00; background: white; font-weight: 700;");
