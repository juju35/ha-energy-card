// ---------------------------------------------------------------------------
// Power flow
// ---------------------------------------------------------------------------
import { FLOW_MIN_W } from "./brands-integrations.js";
import { levelClass, valid, watts } from "./helpers.js";
import { sumOf } from "./forecast-savings.js";

/**
 * Live powers of a system, in watts: solar (≥ 0), grid (+ import / − export), battery (+ discharge / − charge), home
 * (≥ 0), each null when unknown. The missing one of grid and home is worked out from the others.
 */
export const powersOf = (hass, sys, config) => {
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
  // An integration with no total of its own (EcoFlow, Zendure): its solar is the sum of its panel inputs.
  const own = r.solar ? watts(s("solar")) : sumOf((sys.strings || []).map((id) => watts(hass.states[id])));
  const solarW = sumOf([own, ...(sys.extra || []).map((x) => watts(hass.states[x.solar]))]);
  const solar = solarW === null ? null : Math.max(0, solarW);
  let grid = signed("grid", "grid_dir", "export", config.invert_grid);
  if (grid === null) grid = pair("grid_import", "grid_export");
  let battery = signed("battery", "battery_dir", "charg", config.invert_battery);
  if (battery === null) battery = pair("battery_discharge", "battery_charge");
  const homeW = watts(s("home"));
  // With other sources, the main inverter's own load reading misses what they produce: the home is what the balance
  // at the grid meter gives.
  let home = homeW === null || (sys.extra?.length && grid !== null) ? null : Math.abs(homeW);
  if (home === null && grid !== null) home = Math.max(0, (solar ?? 0) + grid + (battery ?? 0));
  if (grid === null && home !== null) grid = home - (solar ?? 0) - (battery ?? 0);
  return { solar, grid, battery, home };
};

/**
 * Split of the powers into the flows between the nodes: the sun serves the home first, then charges the battery,
 * and exports what is left; the grid covers the rest of the home and of the charge; the battery serves the home
 * (and exports beyond what the sun exports).
 */
export const flowsOf = ({ solar, grid, battery, home }) => {
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
export const flowSpeed = (w) => (w >= 3000 ? 0.75 : w >= 1000 ? 1 : w >= 300 ? 1.5 : 3);

// ---------------------------------------------------------------------------
// The illustrated header ("banner"): the title on the sky at the left, and at the right a house with solar panels
// on its roof, its home battery and the grid's pylon, linked by the live power flows (the colors of the flow
// diagram), over a 10 px lawn strip edge to edge. The sun (or the moon at night) feeds the panels while they
// produce. Drawn in a 200 × 80 picture anchored at the bottom right of the banner, above the strip.
// ---------------------------------------------------------------------------


// Sky positions of the stars (night).
export const EC_STARS = [
  [12, 8, 0.6],
  [44, 18, 0.5],
  [96, 6, 0.6],
  [132, 24, 0.5],
  [168, 10, 0.6],
  [188, 30, 0.5],
  [70, 30, 0.45],
];

// The width of an element's whole text in fractional pixels, even while it is cut with an ellipsis (0 when hidden).
export const textWidth = (el) => {
  if (!el?.getClientRects?.().length || typeof document.createRange !== "function") return 0;
  const range = document.createRange();
  range.selectNodeContents(el);
  return range.getBoundingClientRect().width;
};

// Night picture: forced by illustration_theme, else Home Assistant's dark theme alone (a light theme keeps the day
// picture after sunset).
export const ecIsNight = (hass, config) => {
  const theme = config.illustration_theme;
  if (theme === "night") return true;
  if (theme === "day") return false;
  return !!hass?.themes?.darkMode;
};

// One flow of the picture, drawn from where the power comes from to where it goes; `w` sets its speed.
export const ecFlow = (d, color, w) => `<path class="ec-flow" d="${d}" style="stroke:var(--ec-${color});animation-duration:${flowSpeed(w)}s"/>`;

// The picture. `s`: { solar, flows, hasBattery, hasGrid, soc, batteryState, gridDown, error, balcony }; `uid` keeps
// the ids of each card apart on a page with several cards. `balcony` (plug-and-play solar): the panels hang on the
// balcony's rail instead of the roof.
export const ecSceneSvg = (uid, s) => {
  const f = s.flows;
  const producing = s.solar !== null && s.solar >= FLOW_MIN_W;
  const stars = EC_STARS.map(([x, y, r], i) => `<circle class="ec-star${i % 3 ? "" : " tw"}" cx="${x}" cy="${y}" r="${r}"/>`).join("");
  const panels = [0, 1, 2].map((i) => `<rect class="ec-pv" x="${i * 9}" y="-12" width="8" height="12"/>`).join("");
  const win = (x, lit) => `<rect class="ec-win${lit ? " lit" : ""}" x="${x}" y="12" width="10" height="9" rx=".6"/>`;
  const flows = [];
  if (producing) flows.push(ecFlow(s.balcony ? "M36 22Q100 22 138 66" : "M36 22Q74 18 122 32", "solar", s.solar));
  const toBattery = (f.solarToBattery || 0) + (f.gridToBattery || 0);
  const fromBattery = (f.batteryToHome || 0) + (f.batteryToGrid || 0);
  if (s.hasBattery && toBattery >= FLOW_MIN_W) flows.push(ecFlow("M152 70H159", "charge", toBattery));
  else if (s.hasBattery && fromBattery >= FLOW_MIN_W) flows.push(ecFlow("M159 70H152", "battery", fromBattery));
  const imp = (f.gridToHome || 0) + (f.gridToBattery || 0);
  const exp = (f.solarToGrid || 0) + (f.batteryToGrid || 0);
  if (s.hasGrid && !s.gridDown && imp >= FLOW_MIN_W) flows.push(ecFlow("M188 34Q172 42 152 54", "grid", imp));
  else if (s.hasGrid && !s.gridDown && exp >= FLOW_MIN_W) flows.push(ecFlow("M152 54Q172 42 188 34", "export", exp));
  const soc = s.soc === null ? 0.6 : s.soc / 100;
  const level = 14 * soc;
  const battery = s.hasBattery
    ? `<g class="ec-batt ${s.batteryState}" transform="translate(159 58)"><rect class="ec-batt-body" width="11" height="22" rx="2"/><rect class="ec-batt-cap" x="3.5" y="-1.6" width="4" height="2" rx=".6"/><rect class="ec-batt-in" x="2" y="4" width="7" height="14" rx="1"/><rect class="ec-batt-lvl ${levelClass(s.soc)}" x="2" y="${(18 - level).toFixed(2)}" width="7" height="${level.toFixed(2)}" rx="1"/></g>`
    : "";
  const pylon = s.hasGrid
    ? `<g class="ec-pylon${s.gridDown ? " down" : ""}"><path d="M181 80 L188 30 L195 80 M183 42 h10 M181.5 54 h13 M185 42 L191 54 M191 42 L185 54"/><path class="ec-wire" d="M176 34 H200"/>${
        s.gridDown ? '<path class="ec-cut" d="M183 60 l10 10 M193 60 l-10 10"/>' : ""
      }</g>`
    : "";
  const alert = s.error ? '<g class="ec-alert" transform="translate(124 6)"><path d="M0 12 L7 0 L14 12Z"/><path class="mark" d="M7 4v4.2M7 9.6v.6"/></g>' : "";
  return `<svg class="ec-scene${producing ? " producing" : ""}" viewBox="0 0 200 80" preserveAspectRatio="xMaxYMax meet" aria-hidden="true" focusable="false">
    <defs><radialGradient id="ec-glow-${uid}"><stop offset="0" stop-color="#ffd65a" stop-opacity=".55"/><stop offset="1" stop-color="#ffd65a" stop-opacity="0"/></radialGradient></defs>
    <g class="ec-day"><circle class="ec-halo" cx="30" cy="18" r="13" fill="url(#ec-glow-${uid})"/><circle class="ec-sun" cx="30" cy="18" r="6"/>
      <path class="ec-cloud" d="M66,16 C63,16 62,12 65.5,11 C66,7 72,6 74,9 C76,4 84,4 85,10 C89,9 92,12 90,16 Z"/></g>
    <g class="ec-night">${stars}<circle class="ec-moon" cx="30" cy="18" r="5.5"/><circle class="ec-moon-cut" cx="32.5" cy="16" r="4.5"/></g>
    <path class="ec-hill far" d="M0,80 C30,70 60,64 100,66 C140,68 170,60 200,62 L200,80Z"/>
    <path class="ec-hill" d="M0,80 C40,74 90,75 200,72 L200,80Z"/>
    <g class="ec-house" transform="translate(96 44)">
      <rect class="ec-wall" width="56" height="36"/><path class="ec-roof" d="M-6 1 L28 -22 L62 1Z"/>
      ${s.balcony ? "" : `<g class="ec-panels" transform="translate(30 -4) skewX(-34)">${panels}<rect class="ec-glint" x="0" y="-12" width="3" height="12"/></g>`}
      ${win(8, s.night)}<rect class="ec-door" x="24" y="18" width="10" height="18"/>${win(40, false)}
      ${
        s.balcony
          ? `<g class="ec-balcony"><rect class="ec-rail" x="36" y="22" width="18" height="1.2"/><rect class="ec-rail" x="36" y="22" width="1.2" height="12"/><rect class="ec-rail" x="52.8" y="22" width="1.2" height="12"/>
        <g transform="translate(37.4 24) skewY(-8)"><rect class="ec-pv" width="7" height="10"/><rect class="ec-pv" x="8" width="7" height="10"/><rect class="ec-glint" width="2" height="10"/></g></g>`
          : ""
      }
    </g>
    ${battery}${pylon}${flows.join("")}${alert}
  </svg>`;
};

// The banner's colors and animations, day and night.
export const EC_SCENE_STYLE = `
  .banner { position: relative; overflow: hidden; height: 90px; --ec-g: 10px; --ec-scene-w: min(calc((90px - var(--ec-g)) * 2.5), 38%);
            color: #0d2a45; background: linear-gradient(90deg, #f1f8ff 0%, #e2f1fd 34%, #b9def8 70%, #9fd0f3 100%); }
  .banner.night { color: #fff; background: linear-gradient(90deg, #1b2f52 0%, #15284a 36%, #0f1f3d 72%, #0a1830 100%); }
  .ec-scene { position: absolute; right: 0; bottom: var(--ec-g); height: calc(100% - var(--ec-g)); width: var(--ec-scene-w); overflow: visible; }
  .ec-ground { position: absolute; left: 0; right: 0; bottom: 0; height: var(--ec-g);
               background: repeating-linear-gradient(90deg, #5aa83d 0 22px, #6cbb4c 22px 44px); }
  .night .ec-ground { background: repeating-linear-gradient(90deg, #1f4a2a 0 22px, #245433 22px 44px); }
  .htext { position: absolute; z-index: 1; left: 0; top: 0; bottom: var(--ec-g); right: var(--ec-scene-w); padding: 6px 8px 6px 12px;
           display: flex; align-items: center; gap: 10px; min-width: 0; box-sizing: border-box; }
  .htext .titles { display: flex; flex-direction: column; gap: 2px; }
  .banner .type-icon { background: rgba(255,255,255,.62); box-shadow: inset 0 0 0 1px rgba(47,128,237,.18); }
  .banner.night .type-icon { background: rgba(255,255,255,.12); box-shadow: inset 0 0 0 1px rgba(255,255,255,.14); }
  .banner .type-icon .logo { background: #fff; box-shadow: 0 0 0 1px rgba(13,42,69,.16), 0 1px 3px rgba(13,42,69,.18); }
  .banner .name { font-weight: 500; }
  .banner .sub { color: #3b5b78; }
  .banner.night .sub { color: rgba(255,255,255,.78); }
  .banner .chip { line-height: 16px; background: color-mix(in srgb, var(--c) 18%, rgba(255,255,255,.78)); color: color-mix(in srgb, var(--c) 45%, #0d2a45); }
  .banner.night .chip { background: color-mix(in srgb, var(--c) 30%, rgba(8,18,38,.55)); color: color-mix(in srgb, var(--c) 35%, #ffffff); }
  .banner .zoom { color: #33506b; background: rgba(255,255,255,.55); box-shadow: inset 0 0 0 1px rgba(255,255,255,.7);
                  -webkit-backdrop-filter: blur(4px); backdrop-filter: blur(4px); }
  .banner.night .zoom { color: #fff; background: rgba(255,255,255,.12); box-shadow: inset 0 0 0 1px rgba(255,255,255,.2); }
  .banner .zoom:hover { background: rgba(255,255,255,.75); }
  .banner.night .zoom:hover { background: rgba(255,255,255,.22); }
  /* Narrow card: no room for the picture beside the text, the sky and the lawn stay. */
  @container (max-width: 300px) { .ec-scene { display: none; } .htext { right: 36px; } }
  .ec-night, .night .ec-day { display: none; }
  .night .ec-night { display: inline; }
  .ec-sun { fill: #ffd65a; } .ec-halo { opacity: .5; }
  .producing .ec-halo { animation: ec-halo-pulse 3s ease-in-out infinite; transform-box: fill-box; transform-origin: center; }
  .ec-cloud { fill: #fff; opacity: .92; animation: ec-drift 4s ease-in-out infinite alternate; }
  .ec-star { fill: #fff; opacity: .8; } .ec-star.tw { animation: ec-twinkle 3s ease-in-out infinite alternate; }
  .ec-moon { fill: #f3eed2; } .ec-moon-cut { fill: #13254a; }
  .ec-hill.far { fill: #a7d39f; } .ec-hill { fill: #86c27f; }
  .night .ec-hill.far { fill: #1d3a4a; } .night .ec-hill { fill: #17303d; }
  .ec-wall { fill: #f3e6d3; } .night .ec-wall { fill: #2a3646; }
  .ec-roof { fill: #c0603a; } .night .ec-roof { fill: #3a2a2a; }
  .ec-door { fill: #8a5a3a; }
  .ec-win { fill: #86b9de; } .night .ec-win { fill: #3b4b5e; } .night .ec-win.lit { fill: #ffcf6e; filter: drop-shadow(0 0 1.4px #ffb347); }
  .ec-pv { fill: #1e3a6e; stroke: #9cc3ff; stroke-width: .5; }
  .ec-rail { fill: #8a8f96; } .night .ec-rail { fill: #5d6672; }
  .ec-glint { fill: #fff; opacity: 0; }
  .producing .ec-glint { animation: ec-glint 3s ease-in-out infinite; }
  .ec-batt-body { fill: #e9edf1; stroke: #9aa3ae; stroke-width: .6; } .night .ec-batt-body { fill: #3d475c; stroke: #6b7587; }
  .ec-batt-cap { fill: #9aa3ae; }
  .ec-batt-in { fill: #2a3038; }
  .ec-batt-lvl { fill: var(--c, var(--ec-ok)); }
  .ec-batt.charging .ec-batt-lvl { animation: ec-blink 1.5s ease-in-out infinite; }
  .ec-pylon path { stroke: #5f6b7a; stroke-width: 1.2; fill: none; stroke-linejoin: round; }
  .night .ec-pylon path { stroke: #7d8793; }
  .ec-pylon .ec-wire { stroke-width: .5; }
  .ec-pylon.down path:not(.ec-cut) { opacity: .55; }
  .ec-pylon .ec-cut, .night .ec-pylon .ec-cut { stroke: var(--ec-crit); stroke-width: 2; stroke-linecap: round; opacity: 1; }
  .ec-flow { fill: none; stroke-width: 1.8; stroke-linecap: round; stroke-dasharray: 0 5; animation: ec-dots linear infinite; }
  .ec-alert path { fill: var(--ec-crit); } .ec-alert .mark { fill: none; stroke: #fff; stroke-width: 1.6; stroke-linecap: round; }
  .ec-alert { animation: ec-blink 1.2s ease-in-out infinite; }
  @keyframes ec-dots { to { stroke-dashoffset: -10; } }
  @keyframes ec-halo-pulse { 0%, 100% { opacity: .45; transform: scale(1); } 50% { opacity: .9; transform: scale(1.15); } }
  @keyframes ec-drift { to { transform: translateX(4px); } }
  @keyframes ec-twinkle { from { opacity: .3; } to { opacity: 1; } }
  @keyframes ec-glint { 0%, 55% { opacity: 0; transform: translateX(0); } 70% { opacity: .55; } 85%, 100% { opacity: 0; transform: translateX(24px); } }
  @keyframes ec-blink { 50% { opacity: .45; } }
`;
