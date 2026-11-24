// ---------------------------------------------------------------------------
// Visual editors (ha-form)
// ---------------------------------------------------------------------------
import { DEFAULT_COLLAPSED } from "./brands-integrations.js";
import { lang, t } from "./helpers.js";
import { listSystems } from "./registry-based-resolution.js";
import { sameDeps } from "./forecast-savings.js";
import { EnergyCard } from "./full-card.js";

export const LANGUAGES = [
  ["en", "English"],
  ["fr", "Français"],
  ["de", "Deutsch"],
  ["es", "Español"],
  ["sr", "Српски"],
  ["sr-Latn", "Srpski (latinica)"],
  ["it", "Italiano"],
  ["nl", "Nederlands"],
  ["pt", "Português (Portugal)"],
  ["pl", "Polski"],
  ["ro", "Română"],
  ["da", "Dansk"],
  ["sv", "Svenska"],
  ["bg", "Български"],
  ["ru", "Русский"],
  ["uk", "Українська"],
  ["hu", "Magyar"],
  ["sk", "Slovenčina"],
  ["cs", "Čeština"],
  ["sl", "Slovenščina"],
  ["lv", "Latviešu"],
  ["el", "Ελληνικά"],
];

export class EnergyEditorBase extends HTMLElement {
  // [name, default]
  static get toggles() {
    return [];
  }

  static get selects() {
    return {};
  }

  static extraFields() {
    return [];
  }

  setConfig(config) {
    this._config = { ...config };
    this._render();
  }

  set hass(hass) {
    this._hass = hass;
    this._render();
  }

  _schema() {
    const tr = (k) => t(this._hass, this._config, k);
    const systems = listSystems(this._hass);
    return [
      { name: "integration", selector: { select: { mode: "dropdown", custom_value: true, options: systems } } },
      { name: "solar_sources", selector: { select: { multiple: true, mode: "dropdown", custom_value: true, options: systems } } },
      { name: "title", selector: { text: {} } },
      ...this.constructor.extraFields(tr),
      { type: "grid", name: "", schema: this.constructor.toggles.map(([name]) => ({ name, selector: { boolean: {} } })) },
      {
        name: "language",
        selector: { select: { mode: "dropdown", options: [{ value: "", label: tr("lang_auto") }, ...LANGUAGES.map(([value, label]) => ({ value, label }))] } },
      },
    ];
  }

  _render() {
    if (!this._hass || !this._config) return;
    const toggles = this.constructor.toggles;
    if (!this._form) {
      this._form = document.createElement("ha-form");
      this._form.computeLabel = (s) => t(this._hass, this._config, s.name);
      this._form.computeHelper = (s) => (s.name === "zoom" ? t(this._hass, this._config, "zoom_helper") : undefined);
      this._form.addEventListener("value-changed", (ev) => {
        ev.stopPropagation();
        const config = { ...ev.detail.value };
        const defaults = { ...Object.fromEntries(toggles), ...this.constructor.selects };
        if (config.entities && typeof config.entities === "object") {
          const ents = Object.fromEntries(Object.entries(config.entities).filter(([, v]) => v));
          if (Object.keys(ents).length) config.entities = ents;
          else delete config.entities;
        }
        if (Array.isArray(config.solar_sources) && !config.solar_sources.length) delete config.solar_sources;
        // The integration the form shows for a card without one is the card's own pick: not written to the YAML until
        // another one is chosen.
        const auto = !this._config.integration && !this._config.entities && !config.entities;
        if (auto && config.integration === EnergyCard.getStubConfig(this._hass).integration) delete config.integration;
        // Keep the YAML minimal: drop empty values and options left at their default.
        for (const [k, v] of Object.entries(config)) {
          if (v === "" || v === undefined || v === null || (k in defaults && JSON.stringify(v) === JSON.stringify(defaults[k]))) delete config[k];
        }
        this._config = config;
        this.dispatchEvent(new CustomEvent("config-changed", { detail: { config }, bubbles: true, composed: true }));
      });
      this.appendChild(this._form);
    }
    const data = { ...this.constructor.selects, ...this._config };
    for (const [name, def] of toggles) if (data[name] === undefined) data[name] = def;
    if (!data.integration && !data.entities) data.integration = EnergyCard.getStubConfig(this._hass).integration;
    this._form.hass = this._hass;
    // A new data or schema object re-renders the whole form: only hand over new ones when they changed.
    const h = this._hass;
    const dataDeps = [this._config, h.entities, h.devices];
    if (!sameDeps(this._dataDeps, dataDeps)) {
      this._dataDeps = dataDeps;
      this._form.data = data;
    }
    const deps = [lang(h, this._config), h.entities, h.devices];
    if (!sameDeps(this._schemaDeps, deps)) {
      this._schemaDeps = deps;
      this._form.schema = this._schema();
    }
  }
}

export class EnergyCardEditor extends EnergyEditorBase {
  static get toggles() {
    return [
      ["show_title", true],
      ["show_subtitle", true],
      ["illustration", true],
      ["show_flow", true],
      ["show_sources", true],
      ["show_strings", false],
      ["show_battery", true],
      ["show_forecast", true],
      ["show_today", true],
      ["show_savings", true],
      ["show_week", true],
      ["show_options", true],
      ["show_controls", true],
      ["invert_grid", false],
      ["invert_battery", false],
    ];
  }

  static get selects() {
    return { collapsed: DEFAULT_COLLAPSED, illustration_theme: "auto" };
  }

  static extraFields(tr) {
    const power = { entity: { domain: "sensor", device_class: "power" } };
    return [
      {
        name: "illustration_theme",
        selector: { select: { mode: "dropdown", options: ["auto", "day", "night"].map((v) => ({ value: v, label: tr(`theme_${v}`) })) } },
      },
      {
        name: "collapsed",
        selector: { select: { multiple: true, mode: "list", options: ["sources", "battery", "forecast", "today", "savings", "week", "options"].map((value) => ({ value, label: tr(value) })) } },
      },
      { name: "forecast", selector: { entity: { domain: "sensor" } } },
      // price_buy and price_sell stay YAML-only: a number or a sensor, which a number selector would turn to NaN.
      { name: "tempo", selector: { entity: {} } },
      { name: "system_cost", selector: { number: { min: 0, max: 1000000, step: 1, mode: "box" } } },
      {
        type: "expandable",
        name: "entities",
        title: tr("entities"),
        schema: [
          { name: "solar", selector: power },
          { name: "grid", selector: power },
          { name: "battery", selector: power },
          { name: "soc", selector: { entity: { domain: "sensor", device_class: "battery" } } },
          { name: "home", selector: power },
        ],
      },
    ];
  }
}

// The mini card's detail button shows the full card: its editor offers the full card's options as well.
export class EnergyMiniCardEditor extends EnergyCardEditor {
  static get toggles() {
    return [["zoom", true], ...EnergyCardEditor.toggles];
  }
}
