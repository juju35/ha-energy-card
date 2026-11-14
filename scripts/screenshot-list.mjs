// The README screenshots (PNG) and animations (GIF) rendered by scripts/screenshots.mjs.
// Every capture has a twin in the other theme ("-dark" for a light capture, "-light" for a dark one)
// that shows exactly the same state: only the theme differs (checked by test/screenshots.test.mjs).
import { evening, night, outage } from "./mock-states.mjs";

const both = (file, type, width, config, extra = {}) => [
  { file, type, theme: "light", width, config, ...extra },
  { file: `${file}-dark`, type, theme: "dark", width, config, ...extra },
];
const bothDark = (file, type, width, config, extra = {}) => [
  { file, type, theme: "dark", width, config, ...extra },
  { file: `${file}-light`, type, theme: "light", width, config, ...extra },
];

export const shots = [
  // Enphase IQ Gateway + IQ Battery at midday, the default system.
  ...both("card", "energy-card", 460, { collapsed: [] }),
  ...both("mini-card", "energy-mini-card", 380, {}),
  // Huawei SUN2000 + LUNA2000: exporting and charging, with today's import and export.
  ...bothDark("card-huawei", "energy-card", 460, { integration: "huawei_solar" }),
  ...bothDark("mini-card-huawei", "energy-mini-card", 380, { integration: "huawei_solar" }),
  // Tesla Powerwall in the evening, on the battery.
  ...both("card-powerwall", "energy-card", 460, { integration: "powerwall" }),
  ...both("mini-card-powerwall", "energy-mini-card", 380, { integration: "powerwall" }),
  // Fronius Symo without battery: the diagram is a triangle.
  ...bothDark("card-fronius", "energy-card", 460, { integration: "fronius" }),
  // SolarEdge: unsigned powers read with their flow direction sensors.
  ...both("card-solaredge", "energy-card", 460, { integration: "solaredge" }),
  // Fox ESS hybrid inverter with APsystems micro-inverters on the same home (solar_sources): production by source and
  // the power of each panel input.
  ...bothDark("card-foxess", "energy-card", 460, {
    integration: "foxess_modbus",
    solar_sources: [{ integration: "apsystems_ecu_reader", name: "APsystems" }],
    show_strings: true,
    show_week: false,
  }),
  // Mini card switched to the full card by its detail button.
  ...both("mini-card-zoom", "energy-mini-card", 460, {}, { clicks: [".zoom"] }),
  // Confirmation popup of a switch.
  ...both("card-confirm", "energy-card", 460, { collapsed: [] }, { clicks: ['[data-action="switch"]'] }),
  // Narrow cards: the full card at its minimum width (9 of 12 columns of a 320 px Sections view, 238 px) and the
  // mini card at 6 columns of a phone's Sections view (170 px).
  ...both("card-narrow", "energy-card", 238, {}),
  ...both("mini-card-narrow", "energy-mini-card", 170, {}),
];

// One looping GIF per distinct animated state (each plays different keyframes):
//   sunny   — dots from the sun to the home, the battery and the grid, the sun's halo, the charging ring pulsing
//   evening — dots from the battery to the home, no halo, the ring still
//   night   — dots from the grid to the home, the battery at its reserve
//   outage  — the grid crossed out and still, the battery and the last sun covering the home
// Each one is followed by its twin in the other theme: "-dark" for a light capture, "-light" for a dark one.
export const gifs = [
  ...both("sunny", "energy-card", 460, { show_today: false, show_options: false }),
  ...bothDark("evening", "energy-card", 460, { show_today: false, show_options: false }, { overrides: evening }),
  ...both("night", "energy-card", 460, { show_today: false, show_options: false }, { overrides: night }),
  ...bothDark("outage", "energy-card", 460, { integration: "powerwall", show_today: false, show_options: false }, { overrides: outage }),
];
