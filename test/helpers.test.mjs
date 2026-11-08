import assert from "node:assert/strict";
import { test } from "node:test";
import { load } from "./load.mjs";

const { fmtHours, fmtPower, fmtEnergy, watts, kwh, esc, flowSpeed } = load();

test("powers are written in W below 1 kW, in kW above, without their sign", () => {
  assert.equal(fmtPower(850, "en"), "850 W");
  assert.equal(fmtPower(-1650, "en"), "1.7 kW");
  assert.equal(fmtPower(5200, "en"), "5.2 kW");
  assert.equal(fmtPower(0, "en"), "0 W");
  assert.equal(fmtPower(null, "en"), "—");
  assert.equal(fmtPower(2400, "fr").replace(/[  ]/g, " "), "2,4 kW");
});

test("energies are written in Wh below 1 kWh, in kWh above", () => {
  assert.equal(fmtEnergy(0.45, "en"), "450 Wh");
  assert.equal(fmtEnergy(18.4, "en"), "18.4 kWh");
  assert.equal(fmtEnergy(1240, "en"), "1,240 kWh");
  assert.equal(fmtEnergy(null, "en"), "—");
});

test("power and energy sensors are read whatever their unit, and not mistaken for each other", () => {
  assert.equal(watts({ state: "2.4", attributes: { unit_of_measurement: "kW" } }), 2400);
  assert.equal(watts({ state: "850", attributes: { unit_of_measurement: "W" } }), 850);
  assert.equal(watts({ state: "12", attributes: { unit_of_measurement: "kWh" } }), null);
  assert.equal(watts({ state: "unavailable", attributes: { unit_of_measurement: "W" } }), null);
  assert.equal(kwh({ state: "10080", attributes: { unit_of_measurement: "Wh" } }), 10.08);
  assert.equal(kwh({ state: "1.2", attributes: { unit_of_measurement: "MWh" } }), 1200);
  assert.equal(kwh({ state: "3", attributes: { unit_of_measurement: "kW" } }), null);
});

test("durations are written with the units of the language", () => {
  assert.equal(fmtHours(1.73, "en"), "1 hr 44 min");
  assert.equal(fmtHours(0.2, "en"), "12 min");
  assert.equal(fmtHours(Number.POSITIVE_INFINITY, "en"), "—");
});

test("the dots move faster with more power, and every speed loops in a 3 s recording", () => {
  assert.ok(flowSpeed(5000) < flowSpeed(1500) && flowSpeed(1500) < flowSpeed(500) && flowSpeed(500) < flowSpeed(50));
  for (const w of [20, 400, 1200, 6000]) assert.equal((3 / flowSpeed(w)) % 1, 0, `${w} W`);
});

test("HTML is escaped", () => {
  assert.equal(esc(`<a href="x">'&'</a>`), "&lt;a href=&quot;x&quot;&gt;&#39;&amp;&#39;&lt;/a&gt;");
});
