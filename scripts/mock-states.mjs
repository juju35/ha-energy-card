// Mock Home Assistant registries and states shaped like the integrations the cards read: Enphase Envoy (an IQ Gateway
// with an IQ Battery, midday), Huawei Solar (a SUN2000 with a LUNA2000, exporting), Tesla Powerwall (evening, on the
// battery), Fronius (a Symo without battery) and SolarEdge (unsigned powers with flow direction sensors), used to
// render the screenshots and run the tests.
// Entity ids are in French on purpose (the cards never rely on them, except for GoodWe); the names shown are in English.
export const states = {};
export const entities = {};
export const devices = {};

const device = (id, name, model, manufacturer) => (devices[id] = { id, name, model, manufacturer, name_by_user: null });
const entity = (entity_id, device_id, platform, translation_key, state, attributes = {}, entity_category = null) => {
  entities[entity_id] = { entity_id, device_id, platform, translation_key: translation_key || null, entity_category };
  states[entity_id] = { entity_id, state: String(state), attributes };
};
const W = { device_class: "power", unit_of_measurement: "W" };
const KW = { device_class: "power", unit_of_measurement: "kW" };
const KWH = { device_class: "energy", unit_of_measurement: "kWh" };
const WH = { device_class: "energy", unit_of_measurement: "Wh" };
const PCT = { device_class: "battery", unit_of_measurement: "%" };

// Enphase IQ Gateway + IQ Battery 10T: midday, the sun covers the home, charges the battery and exports the rest.
device("envoy", "Envoy 122301", "IQ Gateway", "Enphase");
device("encharge", "Encharge 482301", "IQ Battery 10T", "Enphase");
const en = (id, dev, key, state, attrs, cat) => entity(id, dev, "enphase_envoy", key, state, attrs, cat);
en("sensor.envoy_production", "envoy", "current_power_production", 5200, W);
en("sensor.envoy_consommation", "envoy", "current_power_consumption", 1450, W);
en("sensor.envoy_net", "envoy", "balanced_net_consumption", -1650, W);
en("sensor.envoy_decharge", "envoy", "battery_discharge", -2100, W);
en("sensor.envoy_production_jour", "envoy", "daily_production", 18.4, KWH);
en("sensor.envoy_consommation_jour", "envoy", "daily_consumption", 9.2, KWH);
en("sensor.encharge_niveau", "encharge", "aggregated_soc", 64, PCT);
en("sensor.encharge_energie", "encharge", "aggregated_available_energy", 6451, WH);
en("sensor.encharge_capacite", "encharge", "aggregated_max_capacity", 10080, WH);
en("number.envoy_reserve", "envoy", "reserve_soc", 20, { unit_of_measurement: "%" }, "config");
en("select.envoy_mode", "envoy", "storage_mode", "self_consumption", { options: ["backup", "self_consumption", "savings"], friendly_name: "Envoy 122301 Storage mode" }, "config");
en("binary_sensor.envoy_reseau", "envoy", "grid_status", "on", { friendly_name: "Envoy 122301 Grid status" });
en("switch.envoy_charge_reseau", "envoy", "charge_from_grid", "off", { friendly_name: "Envoy 122301 Charge from grid" });
en("switch.envoy_reseau_actif", "envoy", "grid_enabled", "on", { friendly_name: "Envoy 122301 Grid enabled" });

// Huawei SUN2000 + LUNA2000 (Huawei Solar): exporting and charging; its meter is positive when exporting and its
// battery positive when charging.
device("sun2000", "SUN2000-6KTL-M1", "SUN2000-6KTL-M1", "Huawei");
device("luna", "LUNA2000-10-S0", "LUNA2000-10-S0", "Huawei");
device("meter", "Power meter", "DTSU666-H", "Huawei");
const hw = (id, dev, key, state, attrs, cat) => entity(id, dev, "huawei_solar", key, state, attrs, cat);
hw("sensor.onduleur_puissance_entree", "sun2000", "input_power", 3800, W);
hw("sensor.onduleur_charge", "sun2000", "load_power", 1700, W);
hw("sensor.compteur_puissance", "meter", "power_meter_active_power", 1200, W);
hw("sensor.luna_puissance", "luna", "storage_charge_discharge_power", 900, W);
hw("sensor.luna_niveau", "luna", "storage_state_of_capacity", 81, PCT);
hw("sensor.onduleur_production_jour", "sun2000", "daily_yield_energy", 21.6, KWH);
hw("sensor.onduleur_conso_jour", "sun2000", "consumption_today", 11.3, KWH);
hw("sensor.compteur_achat_jour", "meter", "supply_from_grid_today", 2.1, KWH);
hw("sensor.compteur_vente_jour", "meter", "feed_in_to_grid_today", 8.7, KWH);
hw("sensor.luna_charge_jour", "luna", "storage_current_day_charge_capacity", 4.2, KWH);
hw("sensor.luna_decharge_jour", "luna", "storage_current_day_discharge_capacity", 3.4, KWH);
hw("sensor.luna_capacite", "luna", "storage_rated_capacity", 10000, WH);
hw("number.luna_reserve", "luna", "storage_backup_power_state_of_charge", 15, { unit_of_measurement: "%" }, "config");
hw("select.luna_mode", "luna", "storage_working_mode_settings", "maximise_self_consumption", { friendly_name: "LUNA2000-10-S0 Working mode" }, "config");
hw("sensor.onduleur_etat", "sun2000", "device_status", "On-grid", {});
hw("switch.luna_charge_reseau", "luna", "storage_charge_from_grid_function", "off", { friendly_name: "LUNA2000-10-S0 Charge from grid" }, "config");

// Tesla Powerwall 2: evening, the battery covers the home.
device("powerwall", "Powerwall", "Powerwall 2", "Tesla");
const tp = (id, key, state, attrs) => entity(id, "powerwall", "powerwall", key, state, attrs);
tp("sensor.powerwall_solaire", "solar_instant_power", 0.12, KW);
tp("sensor.powerwall_maison", "load_instant_power", 2.3, KW);
tp("sensor.powerwall_site", "site_instant_power", 0.08, KW);
tp("sensor.powerwall_batterie", "battery_instant_power", 2.1, KW);
tp("sensor.powerwall_charge", "charge", 47, PCT);
tp("sensor.powerwall_restant", "battery_remaining", 6.3, KWH);
tp("sensor.powerwall_capacite", "battery_capacity", 13.5, KWH);
tp("sensor.powerwall_reserve", "backup_reserve", 20, { unit_of_measurement: "%" });
tp("sensor.powerwall_mode", "operation_mode", "self_consumption", {});
tp("binary_sensor.powerwall_reseau", "grid_status", "on", { device_class: "power" });
tp("switch.powerwall_hors_reseau", "off_grid_operation", "off", { friendly_name: "Powerwall Off-grid operation" });

// Fronius Symo (no battery): its load power is negative while the home consumes.
device("symo", "Symo 8.2-3-M", "Symo 8.2-3-M", "Fronius");
const fr = (id, key, state, attrs) => entity(id, "symo", "fronius", key, state, attrs);
fr("sensor.symo_pv", "power_photovoltaics", 4100, W);
fr("sensor.symo_charge", "power_load", -1300, W);
fr("sensor.symo_reseau", "power_grid", -2800, W);
fr("sensor.symo_energie_jour", "energy_day", 14.2, KWH);
fr("sensor.symo_etat", "inverter_state", "Running", {});
fr("sensor.symo_erreur", "error_message", "No error", {});

// SolarEdge (monitoring API): unsigned powers in kW, with flow direction sensors.
device("se", "SolarEdge site", "SE5000H", "SolarEdge");
const se = (id, key, state, attrs) => entity(id, "se", "solaredge", key, state, attrs);
se("sensor.se_solaire", "solar_power", 2.4, KW);
se("sensor.se_conso", "power_consumption", 0.9, KW);
se("sensor.se_reseau", "grid_power", 0.3, KW);
se("sensor.se_sens_reseau", "grid_flow_direction", "export", {});
se("sensor.se_stockage", "storage_power", 1.2, KW);
se("sensor.se_sens_stockage", "storage_flow_direction", "charge", {});
se("sensor.se_niveau", "storage_level", 38, PCT);
se("sensor.se_production", "production_energy", 9.8, KWH);
se("sensor.se_consommation", "consumption_energy", 7.9, KWH);
se("sensor.se_achat", "purchased_energy", 1.2, KWH);
se("sensor.se_vente", "feedin_energy", 3.1, KWH);

// A device of another integration (a smart plug): never a system of its own.
device("prise", "Plug", "Plug S", "Shelly");
entity("sensor.prise_puissance", "prise", "shelly", "power", 42, W);

// Overrides of the states for the animated captures and the tests.
// Evening on the Enphase: the battery covers the home.
export const evening = {
  "sensor.envoy_production": { state: "0" },
  "sensor.envoy_consommation": { state: "980" },
  "sensor.envoy_net": { state: "0" },
  "sensor.envoy_decharge": { state: "980" },
  "sensor.encharge_niveau": { state: "52" },
};
// Night on the Enphase: the battery is at its reserve, the grid covers the home.
export const night = {
  "sensor.envoy_production": { state: "0" },
  "sensor.envoy_consommation": { state: "620" },
  "sensor.envoy_net": { state: "620" },
  "sensor.envoy_decharge": { state: "0" },
  "sensor.encharge_niveau": { state: "20" },
};
// Grid outage on the Powerwall: off the grid, the battery and the last sun cover the home.
export const outage = {
  "binary_sensor.powerwall_reseau": { state: "off" },
  "sensor.powerwall_site": { state: "0" },
  "sensor.powerwall_batterie": { state: "2.18" },
};
