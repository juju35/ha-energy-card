// ---------------------------------------------------------------------------
// Forecast and savings
// ---------------------------------------------------------------------------
import { BRANDS } from "./brands-integrations.js";
import { num } from "./helpers.js";

// Solar forecast integrations, and their sensors' roles matched on "<translation key> <entity id>" (the rest of
// today before today itself: "energy_production_today_remaining" also ends with "today…").
export const FORECAST_PLATFORMS = ["forecast_solar", "solcast_solar", "open_meteo_solar_forecast"];
export const FORECAST_ROLES = [
  ["remaining", /(today_remaining|remaining_today|get_remaining_today)\b/],
  ["today", /(energy_production_today|forecast_today|total_kwh_forecast_today)\b/],
  ["tomorrow", /(energy_production_tomorrow|forecast_tomorrow|total_kwh_forecast_tomorrow)\b/],
];

// The forecast's sensors { today, remaining, tomorrow }, each a list whose values add up: one sensor per device of the
// forecast integration, so that the planes of Forecast.Solar (one entry, one device each) are all counted. `forecast`
// sets them (any sensor of a device, or a list of them); without it, the first forecast integration of the home in
// FORECAST_PLATFORMS order, never two of them (they would forecast the same panels twice), and none for a balcony kit
// (the home's forecast is that of its roof). Null without today's forecast, or with `forecast: false`.
export const forecastOf = (hass, config, sys) => {
  const f = config.forecast;
  if (f === false || !hass?.entities) return null;
  const reg = hass.entities;
  const sensors = Object.keys(reg).filter((id) => id.startsWith("sensor."));
  let pool;
  if (typeof f === "string" || Array.isArray(f)) {
    const set = (Array.isArray(f) ? f : [f]).filter((id) => typeof id === "string");
    const devs = new Set(set.map((id) => reg[id]?.device_id).filter(Boolean));
    pool = [...set, ...sensors.filter((id) => devs.has(reg[id].device_id))];
  } else {
    if (sys && BRANDS[sys.brand]?.balcony) return null;
    const platform = FORECAST_PLATFORMS.find((pl) => sensors.some((id) => reg[id].platform === pl));
    pool = platform ? sensors.filter((id) => reg[id].platform === platform) : [];
  }
  const out = { today: [], remaining: [], tomorrow: [] };
  const seen = new Set();
  for (const id of pool) {
    if (seen.has(id)) continue;
    seen.add(id);
    const key = `${reg[id]?.translation_key || ""} ${id}`;
    const role = FORECAST_ROLES.find(([, re]) => re.test(key))?.[0];
    const dev = reg[id]?.device_id || id;
    // One sensor of each role per device.
    if (role && !out[role].some((x) => (reg[x]?.device_id || x) === dev)) out[role].push(id);
  }
  return out.today.length ? out : null;
};
export const forecastIds = (hass, config, sys) => Object.values(forecastOf(hass, config, sys) || {}).flat();

// A price: a number, or the id of a sensor or input_number holding it.
export const isEntityId = (v) => typeof v === "string" && /^[a-z_]+\.\w+$/.test(v);
export const priceIds = (config) => [config.price_buy, config.price_sell, config.tempo].filter(isEntityId);
export const priceOf = (hass, v) => (typeof v === "number" ? v : isEntityId(v) ? num(hass.states[v]) : typeof v === "string" && v.trim() !== "" && Number.isFinite(Number(v)) ? Number(v) : null);

// Days of each EDF Tempo colour in a year, to average its prices over past days.
export const TEMPO_DAYS = [
  ["blue", 300],
  ["white", 43],
  ["red", 22],
];

// The solar energy used at home (kWh): the production less the export, and never more than the home consumed when
// it is known (without an export sensor, the production alone would count as self-consumed). Null without production.
export const selfConsumed = (produced, exported, consumed) => {
  if (produced === null || produced === undefined) return null;
  const s = Math.max(0, produced - (exported ?? 0));
  return consumed === null || consumed === undefined ? s : Math.min(s, Math.max(0, consumed));
};

// The colour of an EDF Tempo day from a sensor's state (English or French, any case): blue, white, red, or null.
export const tempoColor = (st) => {
  const v = String(st?.state ?? "").toLowerCase();
  return /red|rouge/.test(v) ? "red" : /white|blanc/.test(v) ? "white" : /blue|bleu/.test(v) ? "blue" : null;
};

// Sum of the values of some sensors, null when none has one.
// Wall-clock date of an instant in a time zone: { y, mo (1-12), d, h, mi }. An unknown zone: the browser's.
export const WALL = {};
export const wall = (ms, tz) => {
  let f = WALL[tz || ""];
  if (!f) {
    const opts = { hourCycle: "h23", year: "numeric", month: "numeric", day: "numeric", hour: "numeric", minute: "numeric" };
    try {
      f = new Intl.DateTimeFormat("en-US", tz ? { ...opts, timeZone: tz } : opts);
    } catch (_err) {
      f = new Intl.DateTimeFormat("en-US", opts);
    }
    WALL[tz || ""] = f;
  }
  const p = {};
  for (const x of f.formatToParts(new Date(ms))) if (x.type !== "literal") p[x.type] = Number(x.value);
  return { y: p.year, mo: p.month, d: p.day, h: p.hour % 24, mi: p.minute };
};

// Midnight of a calendar day in a time zone (the day may overflow: day 0, day 32), as an instant.
export const midnightOf = (tz, y, mo, d) => {
  const guess = Date.UTC(y, mo - 1, d);
  const w = wall(guess, tz);
  const at = guess - (Date.UTC(w.y, w.mo - 1, w.d, w.h, w.mi) - guess);
  // A DST change between the guess and midnight: corrected once more.
  const w2 = wall(at, tz);
  return at - (Date.UTC(w2.y, w2.mo - 1, w2.d, w2.h, w2.mi) - Date.UTC(y, mo - 1, d));
};

// Midnight of the day an instant belongs to, in a time zone.
export const dayOf = (ms, tz) => {
  const w = wall(ms, tz);
  return midnightOf(tz, w.y, w.mo, w.d);
};

export const sumOf = (values) => {
  const known = values.filter((v) => v !== null);
  return known.length ? known.reduce((t, v) => t + v, 0) : null;
};

// Same dependency list (same length, same objects): what a memoized value was built from has not changed.
export const sameDeps = (a, b) => !!a && a.length === b.length && a.every((d, i) => d === b[i]);
