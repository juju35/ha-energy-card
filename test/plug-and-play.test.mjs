import assert from "node:assert/strict";
import { test } from "node:test";
import { devices, entities, redDay, states } from "../scripts/mock-states.mjs";
import { load } from "./load.mjs";

const ec = load();
const plain = (v) => JSON.parse(JSON.stringify(v));
const withOverrides = (overrides = {}) => {
  const st = { ...states };
  for (const [id, o] of Object.entries(overrides)) st[id] = { ...st[id], ...o };
  return st;
};
const makeHass = (st = states) => ({ entities, devices, states: st, language: "en", callService() {} });
const newCard = (hass, config = {}, Card = ec.EnergyCard) => {
  const card = new Card();
  card.setConfig({ collapsed: [], ...config });
  card.hass = hass;
  return card;
};
const powers = (integration, overrides, config = {}) => {
  const hass = makeHass(withOverrides(overrides));
  const { sys } = ec.findSystem(hass, { integration, ...config });
  return plain(ec.powersOf(hass, sys, config));
};
const section = (html, name) => {
  const i = html.indexOf(`data-section="${name}"`);
  return i < 0 ? "" : html.slice(i, html.indexOf('data-action="toggle_section"', i + 30) >>> 0 || undefined);
};

test("plug-and-play integrations are brands of their own, balcony kits", () => {
  for (const [platform, brand] of [
    ["hoymiles_wifi", "hoymiles"],
    ["ecoflow_cloud", "ecoflow"],
    ["anker_solix", "anker"],
    ["zendure_ha", "zendure"],
    ["marstek_local_api", "marstek"],
    ["beem_energy", "beem"],
  ]) {
    assert.equal(ec.PLATFORMS[platform], brand, platform);
    assert.equal(ec.BRANDS[brand].balcony, true, brand);
    assert.ok(ec.KEYS[platform].length, platform);
  }
});

test("Anker SOLIX: roles by translation key, battery positive while charging, grid positive on import", () => {
  const { sys } = ec.findSystem(makeHass(), { integration: "anker_solix" });
  assert.equal(sys.brand, "anker");
  assert.equal(sys.roles.solar, "sensor.solarbank_solaire");
  assert.equal(sys.roles.soc, "sensor.solarbank_niveau");
  assert.equal(sys.roles.solar_today, "sensor.solarbank_production_jour");
  assert.equal(sys.roles.export_today, "sensor.solarbank_export_jour");
  const p = powers("anker_solix");
  assert.equal(p.solar, 640);
  // +280 W charging in Anker's convention: the card's battery power is positive while discharging.
  assert.equal(p.battery, -280);
  assert.equal(p.grid, -50);
  assert.equal(p.home, 310);
  // Its grid-charge switch is in the options.
  assert.ok(sys.switches.includes("switch.solarbank_charge_prioritaire"));
});

test("EcoFlow PowerStream: solar is the sum of its inputs, battery by entity id alone", () => {
  const { sys } = ec.findSystem(makeHass(), { integration: "ecoflow_cloud" });
  assert.equal(sys.roles.solar, undefined);
  assert.deepEqual(plain(sys.strings), ["sensor.powerstream_solar_1_watts", "sensor.powerstream_solar_2_watts"]);
  assert.equal(sys.roles.battery, "sensor.powerstream_battery_input_watts");
  assert.equal(sys.roles.soc, "sensor.powerstream_battery_charge");
  const p = powers("ecoflow_cloud");
  assert.equal(p.solar, 405);
  assert.equal(p.battery, -120);
});

test("a roof system wins the automatic pick over a balcony kit as complete", () => {
  assert.equal(ec.findSystem(makeHass(), {}).sys.platform, "enphase_envoy");
});

test("the balcony kit's panels hang on the balcony, not on the roof", () => {
  const roof = newCard(makeHass()).shadowRoot.innerHTML;
  const balcony = newCard(makeHass(), { integration: "anker_solix" }).shadowRoot.innerHTML;
  assert.doesNotMatch(roof, /class="ec-rail"/);
  assert.match(balcony, /class="ec-rail"/);
  assert.match(balcony, /M36 22Q100 22 138 66/);
});

test("forecast: the solar forecast integrations are found, and can be set or turned off", () => {
  const hass = makeHass();
  assert.deepEqual(plain(ec.forecastOf(hass, {})), {
    today: ["sensor.prevision_production_jour"],
    remaining: ["sensor.prevision_production_reste"],
    tomorrow: ["sensor.prevision_production_demain"],
  });
  assert.equal(ec.forecastOf(hass, { forecast: false }), null);
  assert.deepEqual(plain(ec.forecastOf(hass, { forecast: "sensor.prevision_production_jour" }).today), ["sensor.prevision_production_jour"]);
});

// A second Forecast.Solar plane: its own entry, its own device.
const twoPlanes = () => {
  const ents = { ...entities };
  const st = { ...states };
  const add = (id, key, v) => {
    ents[id] = { entity_id: id, device_id: "forecast_west", platform: "forecast_solar", translation_key: key };
    st[id] = { entity_id: id, state: String(v), attributes: { unit_of_measurement: "kWh", device_class: "energy" } };
  };
  add("sensor.prevision_ouest_jour", "energy_production_today", 5.4);
  add("sensor.prevision_ouest_reste", "energy_production_today_remaining", 1.1);
  add("sensor.prevision_ouest_demain", "energy_production_tomorrow", 6.7);
  return { entities: ents, devices, states: st, language: "en", callService() {} };
};

test("forecast: the planes of Forecast.Solar add up", () => {
  const fc = plain(ec.forecastOf(twoPlanes(), {}));
  assert.deepEqual(fc.today, ["sensor.prevision_production_jour", "sensor.prevision_ouest_jour"]);
  const html = section(newCard(twoPlanes()).shadowRoot.innerHTML, "forecast");
  // 24.6 + 5.4 = 30 kWh forecast, 3.9 + 1.1 = 5 kWh still to come.
  assert.match(html, /of 30\.0 kWh/);
  assert.match(html, /Still to come[\s\S]*5\.0 kWh/);
});

test("forecast: none by default for a balcony kit, the home's forecast being its roof's", () => {
  const { sys } = ec.findSystem(makeHass(), { integration: "anker_solix" });
  assert.equal(ec.forecastOf(makeHass(), {}, sys), null);
  assert.doesNotMatch(newCard(makeHass(), { integration: "anker_solix" }).shadowRoot.innerHTML, /data-section="forecast"/);
  assert.ok(ec.forecastOf(makeHass(), { forecast: "sensor.prevision_production_jour" }, sys));
});

test("forecast section: production of the forecast, the gap to what was expected by now, still to come and tomorrow", () => {
  const html = newCard(makeHass()).shadowRoot.innerHTML;
  const fc = section(html, "forecast");
  assert.match(fc, /18\.4 of 24\.6 kWh/);
  // 24.6 − 3.9 = 20.7 kWh expected by now; 18.4 is 11 % behind.
  assert.match(fc, /expected by now: 20\.7 kWh/);
  assert.match(fc, /11% behind/);
  assert.match(fc, /class="mark"/);
  assert.match(fc, /Still to come[\s\S]*3\.9 kWh/);
  assert.match(fc, /Tomorrow[\s\S]*27\.3 kWh/);
  const ahead = section(newCard(makeHass(withOverrides({ "sensor.envoy_production_jour": { state: "23" } }))).shadowRoot.innerHTML, "forecast");
  assert.match(ahead, /11% ahead/);
  assert.doesNotMatch(newCard(makeHass(), { show_forecast: false }).shadowRoot.innerHTML, /data-section="forecast"/);
  assert.doesNotMatch(newCard(makeHass(), { forecast: false }).shadowRoot.innerHTML, /data-section="forecast"/);
});

// Monthly statistics of the last 12 months (`months` back, this month included) for production and export.
const yearStats = (hass, months, perMonth = { prod: 400, exp: 100 }) => {
  const calls = [];
  hass.callWS = (msg) => {
    calls.push(msg);
    if (msg.period !== "month") return Promise.resolve({});
    const [prod, exp] = msg.statistic_ids;
    const now = new Date();
    const row = (back, change) => ({ start: new Date(now.getFullYear(), now.getMonth() - back, 1).getTime(), change });
    const list = Array.from({ length: months }, (_, i) => months - 1 - i);
    return Promise.resolve({ [prod]: list.map((b) => row(b, perMonth.prod)), [exp]: list.map((b) => row(b, perMonth.exp)) });
  };
  return calls;
};

test("savings: hidden without a price; self-consumption and export valued, month and year from monthly statistics, payback", async () => {
  assert.doesNotMatch(newCard(makeHass()).shadowRoot.innerHTML, /data-section="savings"/);
  const hass = makeHass();
  const calls = yearStats(hass, 12);
  const card = newCard(hass, { integration: "anker_solix", price_buy: 0.25, price_sell: 0.04, system_cost: 1000 });
  await new Promise((r) => setTimeout(r, 10));
  const month = calls.find((c) => c.period === "month");
  assert.ok(month, "monthly statistics queried");
  assert.deepEqual(plain(month.types), ["change"]);
  // The last 12 months: the payback is worked out over a whole year, not the calendar year so far.
  assert.ok(month.statistic_ids.includes("sensor.solarbank_production_jour"));
  const sv = section(card.shadowRoot.innerHTML, "savings");
  assert.match(sv, /Self-consumed/);
  assert.match(sv, /Sold/);
  assert.match(sv, /This month/);
  // The year is a tile, like the month.
  assert.match(sv, /This year<\/span><\/div><div class="v">/);
  // This month: 300 kWh self-consumed × 0.25 + 100 kWh × 0.04 = €79.00.
  assert.match(sv, /79\.00/);
  // Self-consumed and sold both shown: today's total is a tag of its own.
  assert.match(sv, /Today €/);
  assert.match(sv, /Payback/);
});

test("savings: self-consumption never exceeds what the home consumed", () => {
  assert.equal(ec.selfConsumed(18.4, null, 9.2), 9.2);
  assert.ok(Math.abs(ec.selfConsumed(18.4, 10, 12) - 8.4) < 1e-9);
  assert.equal(ec.selfConsumed(5, null, null), 5);
  assert.equal(ec.selfConsumed(null, 1, 2), null);
});

test("savings: no today tag that only repeats the self-consumed tile", () => {
  const sv = section(newCard(makeHass(), { integration: "anker_solix", price_buy: 0.25 }).shadowRoot.innerHTML, "savings");
  assert.match(sv, /Self-consumed/);
  assert.doesNotMatch(sv, /Today €/);
});

test("savings: no payback before 90 days of statistics", async () => {
  const hass = makeHass();
  yearStats(hass, 2);
  const card = newCard(hass, { integration: "anker_solix", price_buy: 0.25, system_cost: 1000 });
  await new Promise((r) => setTimeout(r, 10));
  assert.doesNotMatch(section(card.shadowRoot.innerHTML, "savings"), /Payback/);
});

test("savings: past days are valued at the base price, not at today's Tempo colour", async () => {
  const hass = makeHass(withOverrides(redDay));
  yearStats(hass, 12, { prod: 100, exp: 0 });
  const card = newCard(hass, { integration: "anker_solix", tempo: "sensor.tempo_couleur", tempo_prices: { blue: 0.13, white: 0.16, red: 0.76 } });
  await new Promise((r) => setTimeout(r, 10));
  const sv = section(card.shadowRoot.innerHTML, "savings");
  // Today at the red price; this month's 100 kWh at the year's average Tempo price (≈ €0.1715): €17.15, not €76.00.
  assert.match(sv, /× €0\.76/);
  assert.match(sv, /17\.15/);
  assert.doesNotMatch(sv, /76\.00/);
  const flat = newCard(makeHass(withOverrides(redDay)), { integration: "anker_solix", price_buy: 0.2, tempo: "sensor.tempo_couleur", tempo_prices: { red: 0.76 } });
  assert.equal(flat._historyPrice(), 0.2);
});

test("savings: the EDF Tempo colour sets the price, a red day shows a banner", () => {
  assert.equal(ec.tempoColor({ state: "Rouge" }), "red");
  assert.equal(ec.tempoColor({ state: "BLANC" }), "white");
  assert.equal(ec.tempoColor({ state: "blue" }), "blue");
  assert.equal(ec.tempoColor(undefined), null);
  const config = { tempo: "sensor.tempo_couleur", tempo_prices: { blue: 0.13, white: 0.16, red: 0.76 } };
  assert.doesNotMatch(newCard(makeHass(), config).shadowRoot.innerHTML, /class="alert-line red-day/);
  const red = newCard(makeHass(withOverrides(redDay)), config).shadowRoot.innerHTML;
  assert.match(red, /class="alert-line red-day/);
  // The red day's price: the self-consumed solar is worth 0.76 a kWh.
  assert.match(red, /× €0\.76/);
});

test("prices: a number, an entity or a numeric string", () => {
  const hass = makeHass(withOverrides({ "sensor.envoy_production_jour": { state: "0.2" } }));
  assert.equal(ec.priceOf(hass, 0.25), 0.25);
  assert.equal(ec.priceOf(hass, "0.3"), 0.3);
  assert.equal(ec.priceOf(hass, "sensor.envoy_production_jour"), 0.2);
  assert.equal(ec.priceOf(hass, undefined), null);
});

test("mini card: the forecast chip in the compact subtitle", () => {
  const mini = newCard(makeHass(), {}, ec.EnergyMiniCard).shadowRoot.innerHTML;
  assert.match(mini, /18\.4 \/ 24\.6 kWh forecast/);
});
