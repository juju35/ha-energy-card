// ---------------------------------------------------------------------------
// Full card
// ---------------------------------------------------------------------------
import { FLOW_MIN_W, ICONS, WEEK_ROLES } from "./brands-integrations.js";
import { clamp, esc, fmtEnergy, fmtHours, fmtNum, fmtPct, fmtPower, kwh, levelClass, num, svgIcon, valid, watts } from "./helpers.js";
import { findSystem, primary, resolve } from "./registry-based-resolution.js";
import { TEMPO_DAYS, dayOf, forecastOf, midnightOf, priceOf, selfConsumed, sumOf, tempoColor, wall } from "./forecast-savings.js";
import { flowSpeed, flowsOf } from "./power-flow.js";
import { BASE_STYLE, EnergyBase } from "./shared-styles.js";

// Positions of the nodes in the flow diagram (viewBox 320 wide): the sun on top, the grid on the left, the home on
// the right, the battery below. Without a battery the diagram is a triangle and shorter; without the sun, the grid
// and the home move up.
export const NODE_R = 34;
export const layoutOf = (hasSolar, hasBattery) => {
  const top = hasSolar ? 42 : 0;
  const mid = hasSolar ? 132 : 46;
  const pos = { grid: [52, mid], home: [268, mid] };
  if (hasSolar) pos.solar = [160, top];
  if (hasBattery) pos.battery = [160, mid + 90];
  return { pos, height: (hasBattery ? mid + 90 : mid) + NODE_R + 8 };
};

// Segment between two nodes, stopping at their edges (with a small gap).
export const segment = ([ax, ay], [bx, by]) => {
  const len = Math.hypot(bx - ax, by - ay);
  const ux = (bx - ax) / len;
  const uy = (by - ay) / len;
  const g = NODE_R + 5;
  const f = (v) => Math.round(v * 10) / 10;
  return `M${f(ax + ux * g)} ${f(ay + uy * g)} L${f(bx - ux * g)} ${f(by - uy * g)}`;
};

export const FULL_STYLE = `
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
  .tile .s { font-size: 11px; color: var(--secondary-text-color); overflow-wrap: anywhere; }
  .options { display: flex; flex-direction: column; gap: 4px; }
  .source { display: flex; flex-direction: column; gap: 4px; }
  .source .tags { padding-left: 22px; }
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
  /* Forecast: produced against today's forecast, the mark of what was expected by now, the gap. */
  .fc { display: flex; flex-direction: column; gap: 8px; }
  .fc-top { display: flex; align-items: baseline; gap: 8px; flex-wrap: wrap; }
  .fc-big { font-size: 20px; font-weight: 600; } .fc-big small { font-size: 13px; font-weight: 400; color: var(--secondary-text-color); }
  .fc-gap { margin-left: auto; font-size: 12px; font-weight: 600; padding: 2px 8px; border-radius: 10px; white-space: nowrap;
            color: color-mix(in srgb, var(--c) 55%, var(--primary-text-color)); background: color-mix(in srgb, var(--c) 15%, transparent); }
  .fc .bar { height: 8px; --c: var(--ec-solar); overflow: visible; }
  .fc .bar .mark { position: absolute; top: -3px; bottom: -3px; width: 2px; background: var(--primary-text-color); border-radius: 1px; }
  .fc-note { font-size: 12px; color: var(--secondary-text-color); }
  /* Savings: the EDF Tempo red day banner, tinted. */
  .alert-line.red-day { padding: 8px 10px; border-radius: 10px; background: color-mix(in srgb, var(--ec-crit) 10%, transparent); }
  /* Narrow card: the diagram scales down with the card, so its figures grow in its own units and the labels go. */
  @container (max-width: 360px) {
    .tiles { grid-template-columns: repeat(2, minmax(0, 1fr)); }
    .flow .value { font-size: 16px; transform: translateY(5px); }
    .flow .label { display: none; }
  }
  @container (max-width: 220px) { .tiles { grid-template-columns: minmax(0, 1fr); } }
`;

export class EnergyCard extends EnergyBase {
  static getConfigElement() {
    return document.createElement("energy-card-editor");
  }

  static getStubConfig(hass) {
    const m = hass && resolve(hass);
    const p = m && primary(m);
    return p ? { integration: p.platform } : {};
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
    if (c.show_sources !== false) parts.push(this._sourcesSection());
    if (c.show_battery !== false) parts.push(this._battery(p));
    if (c.show_forecast !== false) parts.push(this._forecastSection());
    if (c.show_today !== false) parts.push(this._todaySection());
    if (c.show_savings !== false) parts.push(this._savingsSection());
    if (c.show_week !== false) parts.push(this._weekSection());
    if (c.show_options !== false) parts.push(this._options());
    return `<style>${BASE_STYLE}${FULL_STYLE}${this._sceneStyle()}${this._accent()}</style>
      <ha-card>
        ${this._header(this._status(p), this._subtitle(c.illustration !== false), p)}
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

  // Production by source (with `solar_sources`): each integration's power and energy today, and with `show_strings`
  // the power of each of its panel inputs (strings, micro-inverter channels).
  _sourcesSection() {
    const strings = this._config.show_strings === true;
    const main = { name: this._sys.name || this._t("solar"), solar: this._sys.roles.solar, solar_today: this._sys.roles.solar_today, strings: this._sys.strings };
    const sources = [main, ...this._sys.extra];
    if (sources.length < 2 && !(strings && main.strings.length)) return "";
    const title = this._sectionTitle("sources", ICONS.solar, this._t("sources"));
    if (this._isCollapsed("sources")) return `<div>${title}</div>`;
    const L = this._locale();
    const rows = sources.map((x) => {
      const w = watts(this._s(x.solar));
      const e = kwh(this._s(x.solar_today));
      const val = [w === null ? null : fmtPower(w, L), e === null ? null : fmtEnergy(e, L)].filter(Boolean).join(" · ");
      const id = x.solar || x.solar_today || "";
      const tags = strings
        ? x.strings
            .map((sid) => this._s(sid))
            .filter((st) => st && watts(st) !== null)
            .map((st) => `<span class="tag clickable" role="button" tabindex="0" data-entity="${esc(st.entity_id)}" title="${esc(this._shortName(st))}">${svgIcon(ICONS.panel)}<span>${esc(fmtPower(watts(st), L))}</span></span>`)
            .join("")
        : "";
      return `<div class="source"><div class="option${id ? ` clickable" role="button" tabindex="0" data-entity="${esc(id)}` : ""}"><span class="lbl">${svgIcon(ICONS.solar)}${esc(x.name)}</span><span class="val">${esc(val)}</span></div>${tags ? `<div class="tags">${tags}</div>` : ""}</div>`;
    });
    return `<div>${title}<div class="options">${rows.join("")}</div></div>`;
  }

  // Sum of the energy (kWh) of some sensors, null when none has a value.
  _kwhSum(ids) {
    return sumOf((ids || []).map((id) => kwh(this._s(id))));
  }

  // Forecast: today's production against the forecast (Forecast.Solar, Solcast, Open-Meteo), with the mark of what the
  // forecast expected by now (today's forecast less what is still to come) and the gap to it; the rest of today and
  // tomorrow in two tiles.
  _forecastSection() {
    const fc = forecastOf(this._hass, this._config, this._sys);
    if (!fc) return "";
    const total = this._kwhSum(fc.today);
    if (total === null) return "";
    const L = this._locale();
    const title = this._sectionTitle("forecast", ICONS.forecast, this._t("forecast"));
    if (this._isCollapsed("forecast")) return `<div>${title}</div>`;
    const produced = this._today().produced;
    const remaining = this._kwhSum(fc.remaining);
    const tomorrow = this._kwhSum(fc.tomorrow);
    const expected = remaining === null ? null : Math.max(0, total - remaining);
    const pct = (v) => clamp((v / Math.max(total, produced ?? 0, 0.001)) * 100, 0, 100);
    let gap = "";
    if (produced !== null && expected !== null && expected >= 0.2) {
      const d = Math.round((produced / expected - 1) * 100);
      const ahead = d >= 0;
      gap = `<span class="fc-gap" style="--c:${ahead ? "var(--ec-ok)" : "var(--ec-warn)"}">${esc(this._t(ahead ? "ahead" : "behind", { pct: fmtNum(Math.abs(d), 0, L) }))}</span>`;
    }
    const big =
      produced === null
        ? `<span class="fc-big clickable" role="button" tabindex="0" data-entity="${esc(fc.today[0])}">${esc(fmtEnergy(total, L))}</span>`
        : `<span class="fc-big clickable" role="button" tabindex="0" data-entity="${esc(fc.today[0])}">${esc(this._t("forecast_of", { x: fmtEnergy(produced, L).replace(/ kWh$/, ""), y: fmtEnergy(total, L) }))}</span>`;
    const bar = `<div class="bar"><div style="width:${produced === null ? 0 : pct(produced)}%"></div>${expected === null ? "" : `<span class="mark" style="left:calc(${pct(expected)}% - 1px)" title="${esc(this._t("expected_now", { v: fmtEnergy(expected, L) }))}"></span>`}</div>`;
    const note = expected === null ? "" : `<div class="fc-note">${esc(this._t("expected_now", { v: fmtEnergy(expected, L) }))}</div>`;
    const tile = (id, icon, key, value) =>
      value === null ? "" : `<div class="tile clickable" role="button" tabindex="0" data-entity="${esc(id)}" style="--c:var(--ec-solar)"><div class="k">${svgIcon(icon)}<span>${esc(this._t(key))}</span></div><div class="v">${esc(fmtEnergy(value, L))}</div></div>`;
    const tiles = [tile(fc.remaining[0], ICONS.clock, "to_come", remaining), tile(fc.tomorrow[0], ICONS.calendar, "tomorrow", tomorrow)].join("");
    return `<div>${title}<div class="fc"><div class="fc-top">${big}${gap}</div>${bar}${note}${tiles ? `<div class="tiles">${tiles}</div>` : ""}</div></div>`;
  }

  // The price of a kWh bought today: the EDF Tempo price of today's colour (`tempo` and `tempo_prices`), else
  // `price_buy`.
  _buyPrice() {
    const c = this._config;
    const color = c.tempo ? tempoColor(this._s(c.tempo)) : null;
    const tp = c.tempo_prices && typeof c.tempo_prices === "object" ? priceOf(this._hass, c.tempo_prices[color]) : null;
    return tp ?? priceOf(this._hass, c.price_buy);
  }

  // The price of a kWh bought over past days, for the month, the year and the payback: `price_buy`, else the Tempo
  // prices weighted by the number of days of each colour in a year (300 blue, 43 white, 22 red); never the price of
  // today's colour alone, which a red day would apply to the whole year.
  _historyPrice() {
    const c = this._config;
    const base = priceOf(this._hass, c.price_buy);
    if (base !== null || !c.tempo_prices || typeof c.tempo_prices !== "object") return base;
    let sum = 0;
    let days = 0;
    for (const [color, n] of TEMPO_DAYS) {
      const v = priceOf(this._hass, c.tempo_prices[color]);
      if (v === null) continue;
      sum += v * n;
      days += n;
    }
    return days ? sum / days : null;
  }

  _money(v) {
    const cur = this._hass.config?.currency || "EUR";
    try {
      return new Intl.NumberFormat(this._locale(), { style: "currency", currency: cur, minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(v);
    } catch (_err) {
      return `${fmtNum(v, 2, this._locale())} ${cur}`;
    }
  }

  // The production, export and home consumption of the last 12 months, from the monthly change of the "today" energy
  // sensors in the recorder's statistics: one query, again every hour; rendered again when it comes.
  _fetchYear() {
    const r = this._sys.roles;
    const ids = [r.solar_today, r.export_today, r.home_today].filter(Boolean);
    const key = ids.join(",");
    if (!r.solar_today || !this._hass.callWS || this._yearBusy) return;
    if (this._yearKey === key && Date.now() - (this._yearAt || 0) < 3600000) return;
    this._yearBusy = true;
    this._yearKey = key;
    this._yearAt = Date.now();
    const tz = this._tz();
    const now = wall(Date.now(), tz);
    const start = midnightOf(tz, now.y, now.mo - 11, 1);
    this._hass
      .callWS({ type: "recorder/statistics_during_period", statistic_ids: ids, period: "month", types: ["change"], start_time: new Date(start).toISOString(), units: { energy: "kWh" } })
      .then((x) => {
        this._year = { tz, year: now.y, month: now.mo, rows: x || {} };
      })
      .catch(() => {
        this._yearAt = Date.now() - 3600000 + 300000;
      })
      .finally(() => {
        this._yearBusy = false;
        this._html = null;
        this._update();
      });
  }

  // Produced, exported and consumed (kWh) this month, this calendar year and over the last 12 months, null where
  // unknown; `since`: the start of the first month the production has statistics for.
  _yearTotals() {
    if (!this._year) return null;
    const { rows, tz, year: thisYear, month: thisMonth } = this._year;
    let since = null;
    const of = (id, first) => {
      const out = { month: null, year: null, rolling: null };
      for (const r of rows[id] || []) {
        const v = Number(r.change);
        if (!Number.isFinite(v)) continue;
        const t = typeof r.start === "number" ? r.start : Date.parse(r.start);
        const w = wall(t + 43200000, tz);
        const add = Math.max(0, v);
        out.rolling = (out.rolling ?? 0) + add;
        if (w.y === thisYear) out.year = (out.year ?? 0) + add;
        if (w.y === thisYear && w.mo === thisMonth) out.month = (out.month ?? 0) + add;
        if (first && (since === null || t < since)) since = t;
      }
      return out;
    };
    const r = this._sys.roles;
    const none = { month: null, year: null, rolling: null };
    return { produced: of(r.solar_today, true), exported: r.export_today ? of(r.export_today) : none, consumed: r.home_today ? of(r.home_today) : none, since };
  }

  // Savings: what the energy self-consumed saved (at the price of a kWh bought: Tempo's colour of the day for today,
  // `price_buy` or the year's average Tempo price before) and what the exported energy earned (feed-in tariff), today,
  // this month and this year, and the payback of the system over the last 12 months; on an EDF Tempo red day, a banner.
  _savingsSection() {
    const c = this._config;
    const buy = this._buyPrice();
    const sell = priceOf(this._hass, c.price_sell);
    if (buy === null && sell === null) return "";
    this._fetchYear();
    const L = this._locale();
    const title = this._sectionTitle("savings", ICONS.savings, this._t("savings"));
    if (this._isCollapsed("savings")) return `<div>${title}</div>`;
    const d = this._today();
    const past = this._historyPrice() ?? buy;
    const value = (produced, exported, consumed, price) => {
      const s = selfConsumed(produced, exported, consumed);
      return s === null ? null : s * (price ?? 0) + (exported ?? 0) * (sell ?? 0);
    };
    const selfToday = selfConsumed(d.produced, d.exported, d.consumed);
    const tiles = [];
    const tile = (role, icon, color, key, v, sub) => {
      if (v === null) return false;
      const id = role && this._sys.roles[role];
      const attrs = id ? ` clickable" role="button" tabindex="0" data-entity="${esc(id)}` : "";
      tiles.push(`<div class="tile${attrs}" style="--c:${color}"><div class="k">${svgIcon(icon)}<span>${esc(this._t(key))}</span></div><div class="v">${esc(this._money(v))}</div>${sub ? `<div class="s">${esc(sub)}</div>` : ""}</div>`);
      return true;
    };
    const selfTile = buy !== null && tile("solar_today", ICONS.home, "var(--ec-solar)", "self_consumed", selfToday === null ? null : selfToday * buy, selfToday === null ? "" : `${fmtEnergy(selfToday, L)} × ${this._money(buy)}`);
    const soldTile = sell !== null && tile("export_today", ICONS.up, "var(--ec-export)", "sold", d.exported === null ? null : d.exported * sell, d.exported === null ? "" : `${fmtEnergy(d.exported, L)} × ${this._money(sell)}`);
    const y = this._yearTotals();
    const at = (k) => (y ? value(y.produced[k], y.exported[k], y.consumed[k], past) : null);
    tile(null, ICONS.calendar, "var(--ec-ok)", "this_month", at("month"));
    tile(null, ICONS.calendar, "var(--ec-ok)", "this_year", at("year"));
    const tags = [];
    // Today's total, only when it is not one of the tiles already (self-consumed and sold both shown).
    const today = value(d.produced, d.exported, d.consumed, buy);
    if (today !== null && selfTile && soldTile) tags.push(this._t("today_value", { v: this._money(today) }));
    const cost = priceOf(this._hass, c.system_cost);
    const rolling = at("rolling");
    if (cost && rolling && y.since !== null) {
      // The last 12 months brought to a whole year pay the system back in… — once 90 days of data are in, so that a
      // first winter (or summer) does not stand for the year.
      const days = Math.min(365, (Date.now() - y.since) / 86400000);
      const perYear = (rolling / days) * 365;
      if (days >= 90 && perYear > 0) tags.push(this._t("payback", { years: fmtNum(cost / perYear, 1, L) }));
    }
    const red = c.tempo && tempoColor(this._s(c.tempo)) === "red" && buy !== null;
    const banner = red ? `<div class="alert-line red-day clickable" role="button" tabindex="0" data-entity="${esc(c.tempo)}">${svgIcon(ICONS.alert)}<span>${esc(this._t("red_day", { price: this._money(buy) }))}</span></div>` : "";
    if (!tiles.length && !tags.length && !banner) return "";
    return `<div>${title}${banner}${tiles.length ? `<div class="tiles">${tiles.join("")}</div>` : ""}${tags.length ? `<div class="tags">${tags.map((x) => `<span class="tag"><span>${esc(x)}</span></span>`).join("")}</div>` : ""}</div>`;
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
    const roles = this._sys.extra.length ? WEEK_ROLES : WEEK_ROLES.slice(0, 2);
    const ids = [...roles.map((role) => this._sys.roles[role]), ...this._sys.extra.map((x) => x.solar_today)].filter(Boolean);
    const key = ids.join(",");
    if (!key || !this._hass.callWS || this._weekBusy) return;
    if (this._weekKey === key && Date.now() - (this._weekAt || 0) < 3600000) return;
    this._weekBusy = true;
    this._weekKey = key;
    this._weekAt = Date.now();
    // The recorder's days are those of Home Assistant's time zone, not the browser's.
    const tz = this._tz();
    const today = wall(Date.now(), tz);
    const start = midnightOf(tz, today.y, today.mo, today.d - 6);
    this._hass
      .callWS({ type: "recorder/statistics_during_period", statistic_ids: ids, period: "day", types: ["change"], start_time: new Date(start).toISOString(), units: { energy: "kWh" } })
      .then((x) => {
        this._week = { start, tz, rows: x || {} };
      })
      .catch(() => {
        // Tried again in 5 minutes rather than in an hour.
        this._weekAt = Date.now() - 3600000 + 300000;
      })
      .finally(() => {
        this._weekBusy = false;
        this._html = null;
        this._update();
      });
  }

  // The 7 days, oldest first: { day (ms), produced, consumed } (null where unknown).
  _weekDays() {
    if (!this._week) return [];
    const byDay = (role, id = this._sys.roles[role]) => {
      const out = new Map();
      for (const r of this._week.rows[id] || []) {
        const t = typeof r.start === "number" ? r.start : Date.parse(r.start);
        if (Number.isFinite(Number(r.change))) out.set(dayOf(t, this._week.tz), Math.max(0, Number(r.change)));
      }
      return out;
    };
    const extra = this._sys.extra;
    const prods = [byDay("solar_today"), ...extra.map((x) => byDay(null, x.solar_today))];
    const cons = byDay("home_today");
    const [imp, exp, chg, dis] = ["import_today", "export_today", "charge_today", "discharge_today"].map((r) => byDay(r));
    const first = wall(this._week.start, this._week.tz);
    return Array.from({ length: 7 }, (_, i) => {
      const t = midnightOf(this._week.tz, first.y, first.mo, first.d + i);
      const produced = sumOf(prods.map((m) => m.get(t) ?? null));
      // With other sources, the day's consumption from the balance (the main inverter's own load misses them).
      const balance =
        extra.length && produced !== null && imp.has(t) && exp.has(t) ? Math.max(0, produced + imp.get(t) - exp.get(t) + (dis.get(t) ?? 0) - (chg.get(t) ?? 0)) : null;
      return { day: t, produced, consumed: balance ?? cons.get(t) ?? null };
    });
  }

  _weekSection() {
    this._fetchWeek();
    const days = this._weekDays();
    if (!days.some((d) => d.produced !== null || d.consumed !== null)) return "";
    const L = this._locale();
    const max = Math.max(...days.flatMap((d) => [d.produced || 0, d.consumed || 0]), 0.001);
    // Short names: the narrow letters repeat (T W T F S S M).
    const tz = this._week.tz ? { timeZone: this._week.tz } : {};
    const weekday = new Intl.DateTimeFormat(L, { weekday: "short", ...tz });
    const longDay = new Intl.DateTimeFormat(L, { weekday: "long", day: "numeric", month: "short", ...tz });
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
