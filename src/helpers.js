// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
import { STRINGS } from "./i18n/strings.js";

export const esc = (v) =>
  String(v ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);

export const lang = (hass, config) => {
  const l = config?.language || (hass && (hass.locale?.language || hass.language)) || "en";
  return STRINGS[l] ? l : STRINGS[l.split("-")[0]] ? l.split("-")[0] : "en";
};

// Locale for Intl / toLocale*: the card's language option, else HA's full locale (keeps its region) when its base
// matches the card language, else that language. A bare "pt" (European Portuguese) becomes "pt-PT".
export const intlLocale = (hass, config) => {
  const l = lang(hass, config);
  const src = config?.language || (hass && (hass.locale?.language || hass.language)) || "";
  const out = src && src.split("-")[0] === l.split("-")[0] ? src : l;
  return out === "pt" ? "pt-PT" : out;
};

export const t = (hass, config, key, vars = {}) =>
  String(STRINGS[lang(hass, config)][key] ?? STRINGS.en[key] ?? key).replace(/\{(\w+)\}/g, (_, k) => vars[k] ?? "");

export const valid = (s) => !!s && !["unknown", "unavailable", ""].includes(s.state);

export const num = (s) => {
  if (!valid(s)) return null;
  const v = parseFloat(s.state);
  return Number.isFinite(v) ? v : null;
};

export const pretty = (v) => {
  const s = String(v ?? "").replace(/_/g, " ");
  return s.charAt(0).toUpperCase() + s.slice(1);
};

export const unitOf = (s) => String(s?.attributes?.unit_of_measurement ?? "").trim();

// Power sensor → watts. A sensor in an energy unit is not a power sensor: null.
export const POWER_UNITS = { W: 1, kW: 1e3, MW: 1e6, "": 1 };
export const watts = (s) => {
  const v = num(s);
  const f = POWER_UNITS[unitOf(s)];
  return v === null || f === undefined ? null : v * f;
};

// Energy sensor → kWh. A sensor in a power unit is not an energy sensor: null.
export const ENERGY_UNITS = { Wh: 1e-3, kWh: 1, MWh: 1e3, "": 1 };
export const kwh = (s) => {
  const v = num(s);
  const f = ENERGY_UNITS[unitOf(s)];
  return v === null || f === undefined ? null : v * f;
};

export const fmtNum = (v, digits, locale) => Number(v).toLocaleString(locale, { minimumFractionDigits: digits, maximumFractionDigits: digits });

// Power in watts → "850 W", "2.4 kW", "12 kW".
export const fmtPower = (w, locale) => {
  if (w === null || w === undefined) return "—";
  const a = Math.abs(w);
  if (a < 1000) return `${fmtNum(Math.round(a), 0, locale)} W`;
  return `${fmtNum(a / 1000, a < 100000 ? 1 : 0, locale)} kW`;
};

// Energy in kWh → "12.4 kWh", "850 Wh", "1,240 kWh".
export const fmtEnergy = (e, locale) => {
  if (e === null || e === undefined) return "—";
  if (Math.abs(e) < 1) return `${fmtNum(Math.round(e * 1000), 0, locale)} Wh`;
  return `${fmtNum(e, Math.abs(e) < 100 ? 1 : 0, locale)} kWh`;
};

export const fmtPct = (v, locale) => `${fmtNum(Math.round(v), 0, locale)} %`;

// Duration in hours, written with the units of the language ("2 h 30 min"), rounded to the minute first.
export const UNIT_FMT = {};
export const fmtUnit = (v, unit, locale) => (UNIT_FMT[`${locale}|${unit}`] ??= new Intl.NumberFormat(locale, { style: "unit", unit, unitDisplay: "short" })).format(v);
export const fmtHours = (h, locale) => {
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

export const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));

export const svgIcon = (path, cls = "") => `<svg class="icon ${cls}" viewBox="0 0 24 24"><path d="${path}"/></svg>`;

// Battery level → color class.
export const levelClass = (v) => (v === null ? "idle" : v <= 15 ? "crit" : v <= 30 ? "warn" : "ok");
