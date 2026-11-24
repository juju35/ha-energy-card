// ---------------------------------------------------------------------------
// Registry-based resolution
// ---------------------------------------------------------------------------
import { BRANDS, GUESSES, KEYS, PLATFORMS, POWER_ROLES, SIGNS, brandOf, isString, roleDomainOk } from "./brands-integrations.js";
import { pretty, unitOf } from "./helpers.js";

// Role of a registry entry among the keys of its integration: [role, rank] (rank: the lower, the preferred), or null.
export const roleOf = (e, domain) => {
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
export const guessRole = (id, st) => {
  if (!st || !id.startsWith("sensor.")) return null;
  const a = st.attributes || {};
  if (a.device_class === "battery" && unitOf(st) === "%") return "soc";
  if (a.device_class !== "power" && !["W", "kW"].includes(unitOf(st))) return null;
  const text = `${id} ${a.friendly_name || ""}`.toLowerCase();
  // An auxiliary CT clamp (Fox ESS's CT2 meter…) measures a second source (another inverter, a generator), not the
  // grid: left unassigned here, it is added to the production by hand with `solar_sources`, not read as a grid meter.
  if (/\bct2\b|_ct2(_|\b)/.test(text)) return null;
  for (const [re, role] of GUESSES) if (re.test(text)) return role;
  return null;
};

export const _cache = new WeakMap();

/**
 * Build the model from hass.entities / hass.devices / hass.states:
 * { platforms: { <platform>: { platform, brand, name, roles: { role: entity_id }, switches: [...], selects: [...] } },
 *   systems: [the platforms the cards know, present in this instance] }
 */
export const resolve = (hass) => {
  if (!hass.entities || !hass.devices) return null;
  const cached = _cache.get(hass.entities);
  if (cached && cached.devices === hass.devices) return cached.model;

  const platforms = {};
  for (const e of Object.values(hass.entities)) {
    if (e.hidden || !e.platform) continue;
    const domain = e.entity_id.split(".")[0];
    const p = (platforms[e.platform] ||= { platform: e.platform, brand: brandOf(e.platform), ranks: {}, roles: {}, guessed: [], strings: [], switches: [], selects: [], devices: new Set() });
    if (e.device_id) p.devices.add(e.device_id);
    if (domain === "switch" && e.entity_category !== "diagnostic") p.switches.push(e.entity_id);
    if (domain === "select" && e.entity_category !== "diagnostic") p.selects.push(e.entity_id);
    if (isString(e, domain)) {
      p.strings.push(e.entity_id);
      continue;
    }
    const found = roleOf(e, domain);
    if (found) {
      const [role, rank] = found;
      // Same key on a hub and on the devices behind it (APsystems Modbus: the ECU and its inverters): the hub's.
      const sub = (id) => !!hass.devices[hass.entities[id]?.device_id]?.via_device_id;
      if (!(role in p.ranks) || rank < p.ranks[role] || (rank === p.ranks[role] && sub(p.roles[role]) && !sub(e.entity_id))) {
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
  for (const p of Object.values(platforms)) p.strings.sort((a, b) => a.localeCompare(b, undefined, { numeric: true }));
  const model = { platforms, systems };
  _cache.set(hass.entities, { devices: hass.devices, model });
  return model;
};

// Roles of a platform completed with the guesses on its unmapped sensors (read from the states, which change): guessed
// again only when one of those states changed, not on every state change of the home.
export const GUESSED = new WeakMap();
export const guessedRoles = (p, hass) => {
  const states = p.guessed.map((id) => hass.states[id]);
  const hit = GUESSED.get(p);
  if (hit && hit.states.every((st, i) => st === states[i])) return { ...hit.roles };
  const roles = { ...p.roles };
  p.guessed.forEach((id, i) => {
    const role = guessRole(id, states[i]);
    if (role && !roles[role]) roles[role] = id;
  });
  GUESSED.set(p, { states, roles });
  return { ...roles };
};

// The system a card without `integration` shows: the most complete one (a hybrid inverter with its battery and meter
// rather than micro-inverters that only report their production), the first by name between equals.
export const CAPABILITIES = [["solar"], ["home"], ["grid", "grid_import", "grid_export"], ["battery", "battery_charge", "battery_discharge", "soc"]];
export const primary = (m) => {
  // On a tie, a roof system wins over a plug-and-play balcony kit, the smaller of the two in a home that has both.
  const score = (p) => CAPABILITIES.filter((roles) => roles.some((r) => p.roles[r])).length * 2 + (BRANDS[p.brand]?.balcony ? 0 : 1);
  return m.systems.reduce((best, p) => (!best || score(p) > score(best) ? p : best), null);
};

export const listSystems = (hass) => {
  const m = hass && resolve(hass);
  return m ? m.systems.map((s) => ({ value: s.platform, label: s.name })) : [];
};

// The system the card shows: the integration set with `integration` (any platform, known or not), else the first
// known one; `entities` sets or replaces any role by hand, so that a card can also be built from entities alone.
export const findSystem = (hass, config) => {
  const m = resolve(hass);
  if (!m) return { error: "no_registry" };
  const manual = config.entities && typeof config.entities === "object" ? Object.fromEntries(Object.entries(config.entities).filter(([, v]) => v)) : {};
  let p = null;
  if (config.integration) {
    p = m.platforms[config.integration];
    if (!p && !Object.keys(manual).length) return { error: "unknown_integration" };
  } else if (!Object.keys(manual).length) {
    p = primary(m);
    if (!p) return { error: "no_system" };
  }
  const roles = { ...(p ? guessedRoles(p, hass) : {}), ...manual };
  // `solar_sources`: other production whose power adds to this system's. Each entry is an integration whose production
  // adds (micro-inverters next to a hybrid inverter) — an integration domain, or { integration, name } with an optional
  // `power` (a sensor, e.g. a CT clamp, read instead of the integration's own real-time production) and `energy` (its
  // energy-today) — or a single power sensor — an entity id, or { entity, name, energy } with an optional energy-today
  // sensor. A bare string is an entity id when it names one (holds a dot), otherwise an integration domain.
  const extra = (Array.isArray(config.solar_sources) ? config.solar_sources : [])
    .map((x) => (typeof x === "string" ? (x.includes(".") ? { entity: x } : { integration: x }) : x || {}))
    .map((x) => {
      if (x.entity) {
        if (!hass.states[x.entity]) return null;
        return { platform: "", brand: "generic", name: x.name || hass.states[x.entity].attributes?.friendly_name || x.entity, solar: x.entity, solar_today: x.energy, strings: [] };
      }
      const q = m.platforms[x.integration];
      if (!q || q === p) return null;
      const r = guessedRoles(q, hass);
      // `power` / `energy` replace the integration's real-time production / energy-today by a chosen sensor (a CT
      // clamp for an accurate, faster instantaneous reading), the integration still naming the source and the rest.
      return { platform: q.platform, brand: q.brand, name: x.name || q.name, solar: x.power || r.solar, solar_today: x.energy || r.solar_today, strings: q.strings };
    })
    .filter(Boolean);
  // A sensor added by hand as its own source must not also stand for a role guessed from its name (Fox ESS's CT2 meter,
  // read as "grid" by the mapping fallbacks): it would then be counted twice.
  const extraIds = new Set(extra.map((e) => e.solar).filter(Boolean));
  for (const role of Object.keys(roles)) if (extraIds.has(roles[role]) && !manual[role]) delete roles[role];
  return {
    sys: {
      platform: p?.platform || "",
      brand: p?.brand || "generic",
      name: p?.name || "",
      roles,
      strings: p?.strings || [],
      extra,
      switches: p?.switches || [],
      selects: p?.selects || [],
      sign: { ...SIGNS[p?.platform] },
    },
  };
};
