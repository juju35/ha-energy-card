// ---------------------------------------------------------------------------
// Mini card
// ---------------------------------------------------------------------------
import { FLOW_MIN_W, ICONS } from "./brands-integrations.js";
import { esc, fmtEnergy, fmtNum, fmtPct, fmtPower, levelClass, svgIcon } from "./helpers.js";
import { findSystem } from "./registry-based-resolution.js";
import { forecastOf } from "./forecast-savings.js";
import { BASE_STYLE, isOutside, watchOutside } from "./shared-styles.js";
import { EnergyCard } from "./full-card.js";

export const MINI_STYLE = `
  :host { --ec-natural-width: 320px; }
  .content { padding: 8px 12px 12px; display: grid; grid-template-columns: repeat(var(--cols, 4), minmax(0, 1fr)); gap: 6px; }
  .stat { display: flex; flex-direction: column; align-items: center; gap: 2px; padding: 6px 4px; border-radius: 10px; min-width: 0;
          background: color-mix(in srgb, var(--c, var(--ec-idle)) 10%, var(--secondary-background-color, rgba(127,127,127,.08))); }
  .stat .icon { width: 20px; height: 20px; color: var(--c, var(--secondary-text-color)); }
  .stat .v { font-size: 13px; font-weight: 600; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; max-width: 100%; }
  .stat .k { font-size: 10.5px; color: var(--secondary-text-color); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; max-width: 100%; }
  .stat .bar { width: 80%; margin-top: 2px; }
  @container (max-width: 250px) { .content { grid-template-columns: repeat(2, minmax(0, 1fr)); } }
`;

// The mini card is a full card drawn compact: its detail button (top right, `zoom: false` removes it) switches it to
// the full card's content and back, and a click anywhere else on the page brings the compact view back.
export class EnergyMiniCard extends EnergyCard {
  constructor() {
    super();
    this._unzoom = watchOutside(
      (ev) => isOutside(this, ev),
      () => {
        if (this._zoomed) this._setZoom(false);
      },
    );
  }

  static getConfigElement() {
    return document.createElement("energy-mini-card-editor");
  }

  connectedCallback() {
    super.connectedCallback();
    this._unzoom.on();
  }

  disconnectedCallback() {
    super.disconnectedCallback();
    this._unzoom.off();
    // Back to the compact view once off the screen (see the full card).
    this._zoomed = false;
  }

  _heroInBody() {
    return !!this._zoomed;
  }

  getCardSize() {
    return this._zoomed ? super.getCardSize() : 3;
  }

  getGridOptions() {
    return { ...(this._zoomed ? super.getGridOptions() : { columns: 6, min_columns: 6 }), rows: "auto" };
  }

  // The compact view's subtitle: today's production against the forecast ("12.4 / 18.6 kWh forecast").
  _forecastChip() {
    if (this._config.show_forecast === false) return "";
    const fc = forecastOf(this._hass, this._config, this._sys);
    const total = fc ? this._kwhSum(fc.today) : null;
    if (total === null) return "";
    const L = this._locale();
    const produced = this._today().produced;
    return this._t("forecast_chip", { x: produced === null ? "—" : fmtNum(produced, 1, L), y: fmtEnergy(total, L) });
  }

  _zoomButton() {
    if (this._config.zoom === false) return "";
    const z = this._zoomed;
    const label = esc(this._t(z ? "zoom_out" : "zoom_in"));
    return `<button class="zoom" data-action="zoom" title="${label}" aria-label="${label}">${svgIcon(z ? ICONS.collapse : ICONS.expand)}</button>`;
  }

  _setZoom(on) {
    this._zoomed = on;
    this._update();
    // getCardSize()/getGridOptions() changed: tell the view to re-measure the card.
    this.dispatchEvent(new CustomEvent("iron-resize", { bubbles: true, composed: true }));
  }

  _toggleZoom(ev) {
    this._setZoom(!this._zoomed);
    if (ev.detail === 0) this.shadowRoot.querySelector(".zoom")?.focus({ preventScroll: true });
  }

  _render() {
    if (this._zoomed) return super._render();
    const { sys, error } = findSystem(this._hass, this._config);
    if (error) return this._errorCard(error);
    this._sys = sys;
    const p = this._powers();
    const L = this._locale();
    const r = sys.roles;
    const stats = [];
    const stat = (id, icon, color, value, label, extra = "") =>
      stats.push(
        `<div class="stat clickable" role="button" tabindex="0" data-entity="${esc(id || "")}" style="--c:${color}" aria-label="${esc(`${label} ${value}`)}">${svgIcon(icon)}<span class="v">${esc(value)}</span><span class="k">${esc(label)}</span>${extra}</div>`,
      );
    if (p.solar !== null) stat(r.solar, ICONS.solar, p.solar >= FLOW_MIN_W ? "var(--ec-solar)" : "var(--ec-idle)", fmtPower(p.solar, L), this._t("solar"));
    stat(r.home, ICONS.home, "var(--ec-home)", fmtPower(p.home, L), this._t("home"));
    if (p.grid !== null || r.grid_status) {
      const down = this._gridDown();
      const g = p.grid ?? 0;
      const color = down ? "var(--ec-crit)" : g >= FLOW_MIN_W ? "var(--ec-grid)" : g <= -FLOW_MIN_W ? "var(--ec-export)" : "var(--ec-idle)";
      const label = down ? this._t("grid_outage") : g >= FLOW_MIN_W ? this._t("import") : g <= -FLOW_MIN_W ? this._t("export") : this._t("grid");
      stat(r.grid || r.grid_import || r.grid_status, ICONS.grid, color, down ? "—" : fmtPower(p.grid, L), label);
    }
    if (this._hasBattery(p)) {
      const soc = this._soc();
      const state = this._batteryState(p);
      const color = state === "charging" ? "var(--ec-charge)" : state === "discharging" ? "var(--ec-battery)" : "var(--ec-idle)";
      const bar = soc === null ? "" : `<div class="bar ${levelClass(soc)}"><div style="width:${soc}%"></div></div>`;
      stat(r.soc || r.battery, state === "charging" ? ICONS.bolt : ICONS.battery, color, soc === null ? fmtPower(p.battery, L) : fmtPct(soc, L), this._t(state === "idle" ? "battery" : state), bar);
    }
    return `<style>${BASE_STYLE}${MINI_STYLE}${this._sceneStyle()}${this._accent()}</style>
      <ha-card>
        ${this._header(this._status(p), this._forecastChip(), p)}
        <div class="content" style="--cols:${stats.length}">${stats.join("")}</div>
      </ha-card>`;
  }
}
