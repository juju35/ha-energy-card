import assert from "node:assert/strict";
import { test } from "node:test";
import { devices, entities, evening, night, outage, states } from "../scripts/mock-states.mjs";
import { load } from "./load.mjs";

const ec = load();
// Values built inside the card's sandbox have another realm's prototypes: compared as plain data.
const plain = (v) => JSON.parse(JSON.stringify(v));

const withOverrides = (overrides = {}) => {
  const st = { ...states };
  for (const [id, o] of Object.entries(overrides)) st[id] = { ...st[id], ...o };
  return st;
};
const makeHass = (st = states) => {
  const calls = [];
  return { calls, entities, devices, states: st, language: "en", callService: (...a) => calls.push(a) };
};
const newCard = (hass, config = {}, Card = ec.EnergyCard) => {
  const card = new Card();
  card.setConfig({ collapsed: [], ...config });
  card.hass = hass;
  return card;
};
const click = (card, dataset) => card._onClick({ composedPath: () => [{ dataset }], stopPropagation() {} });
const powers = (integration, overrides, config = {}) => {
  const hass = makeHass(withOverrides(overrides));
  const { sys } = ec.findSystem(hass, { integration, ...config });
  return plain(ec.powersOf(hass, sys, config));
};

test("the known integrations are listed as systems, sorted by name, other integrations are not", () => {
  const m = ec.resolve(makeHass());
  assert.deepEqual(plain(m.systems.map((s) => [s.platform, s.name])), [
    ["enphase_envoy", "Enphase"],
    ["fronius", "Fronius"],
    ["huawei_solar", "Huawei FusionSolar"],
    ["solaredge", "SolarEdge"],
    ["powerwall", "Tesla Powerwall"],
  ]);
});

test("entities get their role from their translation key, by order of preference", () => {
  const m = ec.resolve(makeHass());
  const r = m.platforms.enphase_envoy.roles;
  assert.equal(r.solar, "sensor.envoy_production");
  assert.equal(r.grid, "sensor.envoy_net");
  assert.equal(r.soc, "sensor.encharge_niveau");
  assert.equal(r.reserve, "number.envoy_reserve");
  assert.equal(r.mode, "select.envoy_mode");
  assert.equal(r.grid_status, "binary_sensor.envoy_reseau");
  assert.equal(m.platforms.powerwall.roles.battery_capacity, "sensor.powerwall_capacite");
});

test("each integration's sign convention gives grid + import and battery + discharge", () => {
  // Enphase midday: exporting 1.65 kW, charging 2.1 kW.
  assert.deepEqual(powers("enphase_envoy"), { solar: 5200, grid: -1650, battery: -2100, home: 1450 });
  // Huawei: its meter is positive when exporting and its battery positive when charging.
  assert.deepEqual(powers("huawei_solar"), { solar: 3800, grid: -1200, battery: -900, home: 1700 });
  // Fronius: its load is negative while the home consumes.
  assert.deepEqual(powers("fronius"), { solar: 4100, grid: -2800, battery: null, home: 1300 });
  // SolarEdge: unsigned kW, read with the flow direction sensors.
  assert.deepEqual(powers("solaredge"), { solar: 2400, grid: -300, battery: -1200, home: 900 });
  assert.deepEqual(powers("solaredge", { "sensor.se_sens_reseau": { state: "import" }, "sensor.se_sens_stockage": { state: "discharge" } }), {
    solar: 2400,
    grid: 300,
    battery: 1200,
    home: 900,
  });
  // Tesla Powerwall in kW.
  assert.deepEqual(powers("powerwall"), { solar: 120, grid: 80, battery: 2100, home: 2300 });
  // invert_grid / invert_battery flip a meter wired the other way.
  assert.deepEqual(powers("enphase_envoy", {}, { invert_grid: true, invert_battery: true }), { solar: 5200, grid: 1650, battery: 2100, home: 1450 });
});

test("the missing one of grid and home is worked out from the others", () => {
  const hass = makeHass();
  const sys = { roles: { solar: "sensor.envoy_production", grid: "sensor.envoy_net", battery: "sensor.envoy_decharge" }, sign: {} };
  assert.equal(ec.powersOf(hass, sys, {}).home, 1450);
  const sys2 = { roles: { solar: "sensor.envoy_production", home: "sensor.envoy_consommation", battery: "sensor.envoy_decharge" }, sign: {} };
  assert.equal(ec.powersOf(hass, sys2, {}).grid, -1650);
});

test("the sun serves the home first, then charges the battery, and exports the rest", () => {
  assert.deepEqual(plain(ec.flowsOf({ solar: 5200, grid: -1650, battery: -2100, home: 1450 })), {
    solarToHome: 1450,
    solarToBattery: 2100,
    solarToGrid: 1650,
    gridToHome: 0,
    gridToBattery: 0,
    batteryToHome: 0,
    batteryToGrid: 0,
  });
  // Evening: the battery covers the home, the grid the rest.
  const f = plain(ec.flowsOf({ solar: 120, grid: 80, battery: 2100, home: 2300 }));
  assert.equal(f.solarToHome, 120);
  assert.equal(f.batteryToHome, 2100);
  assert.equal(f.gridToHome, 80);
  // Charging from the grid at night.
  const n = plain(ec.flowsOf({ solar: 0, grid: 3000, battery: -2500, home: 500 }));
  assert.equal(n.gridToBattery, 2500);
  assert.equal(n.gridToHome, 500);
});

test("the full card draws the header, the diagram, the battery, today's energy and the options", () => {
  const html = newCard(makeHass()).shadowRoot.innerHTML;
  assert.match(html, /class="name">Enphase</);
  assert.match(html, /chip clickable active"[^>]*title="Producing"/);
  assert.match(html, />5\.2 kW<\/text>/);
  assert.match(html, />Export<\/text>/);
  assert.match(html, /class="ring pulse"/, "charging ring");
  assert.match(html, /class="halo"/, "sun halo");
  // Three flows from the sun: home, battery, grid.
  assert.equal((html.match(/class="dash"/g) || []).length, 3);
  assert.match(html, /Charging · 2\.1 kW · full in 1 hr 44 min/);
  assert.match(html, /Reserve 20 %/);
  assert.match(html, />10\.1 kWh</);
  assert.match(html, /Produced[\s\S]*18\.4 kWh/);
  assert.match(html, /aria-label="Charge from grid"/);
  // The storage mode is a tag of the battery, not an option.
  assert.doesNotMatch(html, /class="option clickable" role="button" tabindex="0" data-entity="select\.envoy_mode"/);
});

test("today's self-consumption and self-sufficiency are worked out, the subtitle shows the self-sufficiency", () => {
  const html = newCard(makeHass(), { integration: "huawei_solar" }).shadowRoot.innerHTML;
  assert.match(html, /class="sub">81 % self-sufficient today</);
  assert.match(html, /Self-consumption[\s\S]*60 %/);
});

test("without a battery the diagram is a triangle and the battery section is left out", () => {
  const html = newCard(makeHass(), { integration: "fronius" }).shadowRoot.innerHTML;
  assert.doesNotMatch(html, /data-section="battery"/);
  assert.match(html, /viewBox="0 -2 320 174"/);
  assert.match(html, /class="sub">Running</);
});

test("evening and night: the battery, then the grid, cover the home", () => {
  const eve = newCard(makeHass(withOverrides(evening))).shadowRoot.innerHTML;
  assert.match(eve, /title="Not producing"/);
  assert.doesNotMatch(eve, /class="halo"/);
  assert.match(eve, /stroke:var\(--ec-battery\)/);
  const nig = newCard(makeHass(withOverrides(night))).shadowRoot.innerHTML;
  assert.match(nig, />Import<\/text>/);
  assert.match(nig, /stroke:var\(--ec-grid\);animation-duration:1\.5s/);
});

test("a grid outage is shown, and nothing flows from or to the grid", () => {
  const html = newCard(makeHass(withOverrides(outage)), { integration: "powerwall" }).shadowRoot.innerHTML;
  assert.match(html, /chip clickable crit"[^>]*title="Grid outage"/);
  assert.match(html, /class="outage"/);
  assert.doesNotMatch(html, /stroke:var\(--ec-grid\)/);
  assert.match(html, /empty in /);
});

test("a switch asks first, then turns on with the requested state shown at once", () => {
  const hass = makeHass();
  const card = newCard(hass);
  click(card, { action: "switch", entity: "switch.envoy_charge_reseau", label: "Charge from grid" });
  assert.match(card.shadowRoot.innerHTML, /Turn on Charge from grid\?/);
  assert.equal(hass.calls.length, 0);
  click(card, { action: "confirm_ok" });
  assert.deepEqual(plain(hass.calls), [["switch", "turn_on", { entity_id: "switch.envoy_charge_reseau" }]]);
  assert.match(card.shadowRoot.innerHTML, /class="toggle-btn on" role="switch" aria-checked="true" aria-label="Charge from grid"/);
});

test("Cancel leaves the switch as it is", () => {
  const hass = makeHass();
  const card = newCard(hass);
  click(card, { action: "switch", entity: "switch.envoy_reseau_actif", label: "Grid enabled" });
  assert.match(card.shadowRoot.innerHTML, /Turn off Grid enabled\?/);
  click(card, { action: "confirm_cancel" });
  assert.equal(hass.calls.length, 0);
  assert.doesNotMatch(card.shadowRoot.innerHTML, /dialog-open/);
});

test("show_controls: false shows the switches' state without toggles", () => {
  const html = newCard(makeHass(), { show_controls: false }).shadowRoot.innerHTML;
  assert.doesNotMatch(html, /data-action="switch"/);
  assert.match(html, /<span class="val">Off<\/span>/);
});

test("sections fold on a click on their title, and back on a click elsewhere", () => {
  const card = newCard(makeHass(), { collapsed: undefined });
  card.connectedCallback();
  assert.match(card.shadowRoot.innerHTML, /data-section="options" aria-expanded="false"/);
  click(card, { action: "toggle_section", section: "options" });
  assert.match(card.shadowRoot.innerHTML, /data-section="options" aria-expanded="true"/);
  card._outside.tap({ composedPath: () => [] });
  assert.match(card.shadowRoot.innerHTML, /data-section="options" aria-expanded="false"/);
});

test("folding: a tap elsewhere (pointer), not a drag that ends outside; leaving the page folds back too", () => {
  const card = newCard(makeHass(), { collapsed: undefined });
  card.connectedCallback();
  const open = /data-section="options" aria-expanded="true"/;
  click(card, { action: "toggle_section", section: "options" });
  // A slider pressed in the card and released outside of it: nothing folds.
  card._outside.tap({ composedPath: () => [card] });
  assert.match(card.shadowRoot.innerHTML, open);
  // Left with the section open and back: folded.
  card.disconnectedCallback();
  card.connectedCallback();
  assert.doesNotMatch(card.shadowRoot.innerHTML, open);
  card.disconnectedCallback();
  const mini = newCard(makeHass(), {}, ec.EnergyMiniCard);
  mini.connectedCallback();
  click(mini, { action: "zoom" });
  assert.match(mini.shadowRoot.innerHTML, /class="flow"/);
  mini.disconnectedCallback();
  mini.connectedCallback();
  assert.doesNotMatch(mini.shadowRoot.innerHTML, /class="flow"/, "back compact");
  mini.disconnectedCallback();
});

test("entities set by hand replace or complete the roles, and alone are enough", () => {
  const hass = makeHass();
  const html = newCard(hass, { entities: { solar: "sensor.symo_pv", grid: "sensor.symo_reseau" } }).shadowRoot.innerHTML;
  assert.match(html, />4\.1 kW<\/text>/);
  assert.match(html, />1\.3 kW<\/text>/, "home worked out from the sun and the grid");
  const { sys } = ec.findSystem(hass, { integration: "enphase_envoy", entities: { home: "sensor.prise_puissance" } });
  assert.equal(sys.roles.home, "sensor.prise_puissance");
  assert.equal(sys.roles.solar, "sensor.envoy_production");
});

test("errors: no registries, no system, unknown integration", () => {
  assert.match(newCard({ states: {}, language: "en" }).shadowRoot.innerHTML, /registries are not available/);
  assert.match(newCard({ entities: {}, devices: {}, states: {}, language: "en" }).shadowRoot.innerHTML, /No solar or battery integration found/);
  assert.match(newCard(makeHass(), { integration: "nope" }).shadowRoot.innerHTML, /Integration not found: nope/);
});

test("an unknown integration's power sensors get a role from their name", () => {
  const ent = { ...entities, "sensor.inv_pv_power": { entity_id: "sensor.inv_pv_power", platform: "my_inverter", device_id: "x" }, "sensor.inv_grid_power": { entity_id: "sensor.inv_grid_power", platform: "my_inverter", device_id: "x" } };
  const st = { ...states, "sensor.inv_pv_power": { entity_id: "sensor.inv_pv_power", state: "1500", attributes: { device_class: "power", unit_of_measurement: "W" } }, "sensor.inv_grid_power": { entity_id: "sensor.inv_grid_power", state: "-500", attributes: { device_class: "power", unit_of_measurement: "W" } } };
  const hass = { entities: ent, devices, states: st, language: "en" };
  const { sys } = ec.findSystem(hass, { integration: "my_inverter" });
  assert.equal(sys.roles.solar, "sensor.inv_pv_power");
  assert.equal(sys.roles.grid, "sensor.inv_grid_power");
  assert.equal(sys.brand, "generic");
});

test("the card is only rebuilt when something it shows changed", () => {
  const hass = makeHass();
  const card = newCard(hass);
  const before = card.shadowRoot.innerHTML;
  card.shadowRoot.innerHTML = "sentinel";
  card.hass = { ...hass, states: { ...states, "sensor.prise_puissance": { state: "99", attributes: {} } } };
  assert.equal(card.shadowRoot.innerHTML, "sentinel");
  card.hass = { ...hass, states: withOverrides({ "sensor.envoy_production": { state: "5300" } }) };
  assert.notEqual(card.shadowRoot.innerHTML, before);
});

test("the mini card shows the sun, the home, the grid and the battery, and its detail button switches views", () => {
  const card = newCard(makeHass(), {}, ec.EnergyMiniCard);
  let html = card.shadowRoot.innerHTML;
  assert.equal((html.match(/class="stat clickable"/g) || []).length, 4);
  assert.match(html, /64 %<\/span><span class="k">Charging/);
  assert.match(html, /data-action="zoom"/);
  assert.deepEqual(plain(card.getGridOptions()), { columns: 6, min_columns: 6, rows: "auto" });
  click(card, { action: "zoom" });
  html = card.shadowRoot.innerHTML;
  assert.match(html, /class="flow"/);
  assert.deepEqual(plain(card.getGridOptions()), { columns: 12, min_columns: 9, rows: "auto" });
  card._unzoom.tap({ composedPath: () => [] });
  assert.doesNotMatch(card.shadowRoot.innerHTML, /class="flow"/);
});

test("the editor offers the systems found and keeps the YAML minimal", () => {
  const ed = new ec.EnergyCardEditor();
  ed.setConfig({ type: "custom:energy-card" });
  ed.hass = makeHass();
  const form = ed._form;
  assert.deepEqual(plain(form.schema[0].selector.select.options.map((o) => o.value)), ["enphase_envoy", "fronius", "huawei_solar", "solaredge", "powerwall"]);
  assert.equal(form.data.integration, "enphase_envoy");
  const changes = [];
  ed.dispatchEvent = (ev) => changes.push(ev.detail.config);
  form.listeners["value-changed"]({ stopPropagation() {}, detail: { value: { type: "custom:energy-card", integration: "fronius", show_flow: true, collapsed: ["options"], entities: { solar: "" } } } });
  assert.deepEqual(plain(changes.at(-1)), { type: "custom:energy-card", integration: "fronius" });
});

test("both cards are registered for the card picker", () => {
  assert.deepEqual(plain(ec.window.customCards.map((c) => c.type)), ["energy-card", "energy-mini-card"]);
  for (const p of Object.keys(ec.PLATFORMS)) assert.ok(ec.BRANDS[ec.PLATFORMS[p]], p);
  for (const p of Object.keys(ec.KEYS)) assert.ok(ec.PLATFORMS[p], p);
});

test("last 7 days: production and consumption per day from one daily statistics query", async () => {
  const hass = makeHass();
  const calls = [];
  hass.callWS = (msg) => {
    calls.push(msg);
    const start = Date.parse(msg.start_time);
    const out = {};
    msg.statistic_ids.forEach((id, k) => {
      out[id] = Array.from({ length: 7 }, (_, i) => ({ start: start + i * 86400000 + 3600000, change: k === 0 ? 10 + i : 8 }));
    });
    return Promise.resolve(out);
  };
  const card = newCard(hass);
  await new Promise((r) => setTimeout(r, 10));
  assert.equal(calls.length, 1);
  assert.equal(calls[0].period, "day");
  assert.deepEqual(plain(calls[0].types), ["change"]);
  const html = card.shadowRoot.innerHTML;
  assert.match(html, /data-section="week"/);
  assert.equal((html.match(/class="wday"/g) || []).length, 7);
  // 10 + 11 + … + 16 kWh produced, 7 × 8 consumed.
  assert.match(html, /91\.0 kWh/);
  assert.match(html, /56\.0 kWh/);
  // Short day names, not the narrow letters that repeat (T W T F S S M).
  const names = [...html.matchAll(/<span class="wlbl">([^<]*)<\/span>/g)].map((m) => m[1]);
  assert.equal(names.length, 7);
  assert.equal(new Set(names).size, 7);
  assert.ok(names.every((n) => n.length >= 2), names.join(" "));
  // A tapped day shows its own values instead of the totals; tapped again, the totals are back.
  const tap = (day) => card._onClick({ composedPath: () => [{ dataset: { action: "week_day", day: String(day) } }], stopPropagation() {} });
  tap(2);
  let after = card.shadowRoot.innerHTML;
  assert.match(after, /class="wday sel" data-action="week_day" data-day="2" aria-pressed="true"/);
  assert.match(after, /class="wwhen"/);
  assert.match(after, /12\.0 kWh/);
  assert.doesNotMatch(after, /91\.0 kWh<\/span>/);
  tap(2);
  after = card.shadowRoot.innerHTML;
  assert.doesNotMatch(after, /class="wwhen"/);
  assert.match(after, /91\.0 kWh/);
  // Not queried again within the hour; hidden with show_week: false.
  card.hass = makeHass();
  card.hass.callWS = hass.callWS;
  await new Promise((r) => setTimeout(r, 10));
  assert.equal(calls.length, 1);
  assert.doesNotMatch(newCard(makeHass(), { show_week: false }).shadowRoot.innerHTML, /data-section="week"/);
});
