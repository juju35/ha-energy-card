// ---------------------------------------------------------------------------
// Registration
// ---------------------------------------------------------------------------
import { pickerDefine } from "./card-picker.js";
import { VERSION } from "./core.js";
import { EnergyCard } from "./full-card.js";
import { EnergyMiniCard } from "./mini-card.js";
import { EnergyCardEditor, EnergyMiniCardEditor } from "./visual-editors.js";

export const define = (name, cls) => {
  if (!customElements.get(name)) pickerDefine(name, cls);
};
define("energy-card", EnergyCard);
define("energy-mini-card", EnergyMiniCard);
define("energy-card-editor", EnergyCardEditor);
define("energy-mini-card-editor", EnergyMiniCardEditor);

window.customCards = window.customCards || [];
for (const card of [
  {
    type: "energy-card",
    name: "Energy Card",
    description: "Solar inverter and home battery (Enphase, SolarEdge, Fronius, Huawei, SMA, Tesla Powerwall, Growatt…): live power flow, battery, today's energy and options.",
  },
  {
    type: "energy-mini-card",
    name: "Energy Mini Card",
    description: "Compact solar and battery overview: solar, home, grid and battery at a glance.",
  },
]) {
  if (!window.customCards.some((c) => c.type === card.type))
    window.customCards.push({ ...card, preview: true, documentationURL: "https://github.com/juju35/ha-energy-card" });
}

console.info(`%c ENERGY-CARD %c v${VERSION} `, "color: white; background: #a35f00; font-weight: 700;", "color: #a35f00; background: white; font-weight: 700;");
