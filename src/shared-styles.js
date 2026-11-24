// ---------------------------------------------------------------------------
// Shared styles
// ---------------------------------------------------------------------------
import { VERSION } from "./core.js";
import { BRANDS, COLORS, DEFAULT_COLLAPSED, FLOW_MIN_W, ICONS, PENDING_MS } from "./brands-integrations.js";
import { clamp, esc, fmtEnergy, fmtNum, fmtPower, intlLocale, kwh, levelClass, num, pretty, svgIcon, t, valid } from "./helpers.js";
import { findSystem } from "./registry-based-resolution.js";
import { forecastIds, priceIds, sameDeps, sumOf } from "./forecast-savings.js";
import { EC_SCENE_STYLE, ecIsNight, ecSceneSvg, flowsOf, powersOf, textWidth } from "./power-flow.js";

export let _ecUid = 0;

export const BASE_STYLE = `
  :host { --ec-accent: #a35f00; --ec-ok: var(--success-color, #43a047); --ec-warn: var(--warning-color, #ffa600);
          --ec-crit: var(--error-color, #db4437); --ec-idle: var(--disabled-text-color, #9e9e9e); --ec-active: ${COLORS.solar};
          --ec-solar: ${COLORS.solar}; --ec-grid: ${COLORS.grid}; --ec-export: ${COLORS.export}; --ec-battery: ${COLORS.battery};
          --ec-charge: ${COLORS.charge}; --ec-home: ${COLORS.home};
          /* Text in a state or brand color is mixed with the text color so that it reads at 4.5:1 at least. */
          --ec-accent-text: color-mix(in srgb, var(--ec-accent) 50%, var(--primary-text-color)); }
  ha-card { overflow: hidden; container: ec-card / inline-size; }
  /* A size container has no width of its own content: this empty grid gives the card a natural width. */
  :host { display: block; min-width: 0; --ec-natural-width: 380px; }
  :host::before { content: ""; display: grid; grid-template-columns: minmax(0, var(--ec-natural-width)); height: 0; }
  .icon { width: 18px; height: 18px; fill: currentColor; flex: none; }
  .clickable { cursor: pointer; }
  [role="button"]:focus-visible { outline: 2px solid var(--primary-color, var(--ec-accent)); outline-offset: 2px; border-radius: 4px; }
  @media (prefers-reduced-motion: reduce) { *, *::before, *::after { transition: none !important; animation: none !important; } }
  .ok { --c: var(--ec-ok); } .warn { --c: var(--ec-warn); } .crit { --c: var(--ec-crit); } .idle { --c: var(--ec-idle); } .active { --c: var(--ec-active); }
  .dot { width: 6px; height: 6px; border-radius: 50%; background: var(--c, var(--ec-ok)); flex: none; display: inline-block; }
  .chip { display: inline-flex; align-items: center; gap: 4px; padding: 1px 8px; border-radius: 12px; font-size: 11px; font-weight: 500; white-space: nowrap;
          background: color-mix(in srgb, var(--c, var(--ec-ok)) 15%, transparent); color: color-mix(in srgb, var(--c, var(--ec-ok)) 50%, var(--primary-text-color));
          flex: 0 1 auto; min-width: 0; max-width: 50%; overflow: hidden; box-sizing: border-box; }
  .chip-text { min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
  .bar { position: relative; height: 4px; border-radius: 3px; background: var(--divider-color, rgba(127,127,127,.25)); overflow: hidden; }
  .bar > div { height: 100%; border-radius: 3px; background: var(--c, var(--ec-ok)); transition: width .6s ease; }
  .header { position: relative; display: flex; align-items: center; gap: 10px; padding: 12px 12px 0; }
  .header:has(.zoom) { padding-right: 34px; }
  .logo { width: 40px; height: 40px; object-fit: contain; flex: none; }
  a.logo-link { display: flex; flex: none; text-decoration: none; }
  .type-icon { position: relative; width: 40px; height: 40px; border-radius: 50%; display: flex; align-items: center; justify-content: center; flex: none;
               background: color-mix(in srgb, var(--ec-accent) 16%, transparent); }
  /* The header icon's color always gives the status: producing (sun), battery in use, idle (grey), low battery
     (amber), error or grid outage (red). */
  .type-icon .icon.type { width: 24px; height: 24px; fill: var(--c, var(--ec-idle)); }
  .type-icon.ok { --c: var(--ec-battery); }
  .type-icon .logo { position: absolute; right: -4px; bottom: -4px; width: 18px; height: 18px; border-radius: 5px;
                     background: var(--card-background-color, #fff);
                     box-shadow: 0 0 0 1px var(--divider-color, rgba(0,0,0,.12)), 0 0 0 3px var(--card-background-color, #fff); }
  .titles { flex: 1 1 0; min-width: 5ch; font-size: 16px; container: ec-titles / inline-size; }
  /* The title line: the title, then the status pill, when the whole title and its whole label fit there; otherwise
     the pill goes on its own line under the subtitle (kept to one line), and when even that is too tight only its dot
     is left (its text stays in its title and aria-label). Decided by measure (see _fitPill). */
  .title-row { display: flex; align-items: center; gap: 8px; min-width: 0; }
  .title-row .name { flex: 0 1 auto; min-width: 0; }
  .title-row .chip { flex: none; max-width: none; }
  .chip.ok { --c: var(--ec-battery); }
  .titles.pill-below { display: flex; flex-direction: column; }
  .titles.pill-below .title-row { display: contents; }
  .titles.pill-below .title-row .chip { order: 3; align-self: flex-start; margin-top: 3px; max-width: 100%; }
  .titles.pill-dot .title-row .chip { padding: 4px; } .titles.pill-dot .chip-text { display: none; }
  :host([hide-title]) .title-row > .name, :host([hide-subtitle]) .titles > .sub { display: none; }
  .name { font-size: 16px; font-weight: 500; line-height: 1.25; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
  .sub { font-size: 12px; color: var(--secondary-text-color); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
  .warning { padding: 16px; color: color-mix(in srgb, var(--ec-warn) 50%, var(--primary-text-color)); }
  .btn { display: inline-flex; align-items: center; justify-content: center; gap: 6px; border: none; cursor: pointer; font: inherit; font-size: 13px;
         font-weight: 500; padding: 6px 12px; border-radius: 18px; background: var(--secondary-background-color, rgba(127,127,127,.12));
         color: var(--primary-text-color); min-width: 0; }
  .btn span { min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
  .btn.primary { background: color-mix(in srgb, var(--ec-accent) 16%, transparent); color: var(--ec-accent-text); }
  .btn.primary:hover { background: color-mix(in srgb, var(--ec-accent) 24%, transparent); }
  /* The mini card's detail button: 24 px round, in the top right corner. */
  .zoom { all: unset; position: absolute; z-index: 2; top: 5px; right: 5px; cursor: pointer; width: 24px; height: 24px; border-radius: 50%;
          display: grid; place-items: center; color: var(--secondary-text-color); box-shadow: inset 0 0 0 1px var(--divider-color, rgba(127,127,127,.3)); }
  .zoom .icon { width: 16px; height: 16px; }
  .zoom:hover { background: color-mix(in srgb, var(--ec-idle) 16%, transparent); color: var(--primary-text-color); }
  .zoom:focus-visible { outline: 2px solid var(--primary-color, var(--ec-accent)); outline-offset: 1px; }
  /* Very narrow card: only the pill's dot stays, on the title's line. */
  @container ec-card (max-width: 200px) {
    .title-row .chip { padding: 4px; }
    .chip-text { display: none; }
  }
  @container (max-width: 200px) { .header { gap: 6px; } }
`;

// In-card confirmation popup, as in the other ha-* cards: a backdrop over the card with a small dialog at the top.
export const DIALOG_STYLE = `
  ha-card.dialog-open { position: relative; min-height: 160px; }
  .backdrop { position: absolute; inset: 0; background: rgba(0,0,0,.45); display: flex; align-items: flex-start; justify-content: center;
              padding-top: 12px; box-sizing: border-box; z-index: 9; border-radius: inherit; }
  .modal { background: var(--card-background-color, #1c1c1c); color: var(--primary-text-color); width: min(92%, 340px); max-height: calc(100% - 24px);
           box-sizing: border-box; border-radius: 14px; padding: 16px; box-shadow: 0 8px 30px rgba(0,0,0,.4); display: flex; flex-direction: column; gap: 12px; }
  .modal .msg { font-size: 14px; line-height: 1.4; }
  .modal-actions { display: flex; justify-content: flex-end; gap: 8px; }
`;

// Element names of Home Assistant dialogs (more-info opened from the card, among others).
export const DIALOG_TAGS = new Set(["HA-MORE-INFO-DIALOG", "HA-DIALOG", "DIALOG"]);
export const isOutside = (card, ev) => {
  const path = ev.composedPath();
  return !path.includes(card) && !path.some((n) => DIALOG_TAGS.has(n.tagName));
};

// "A click elsewhere" is caught on the pointer, not only on the click event: on iOS (Safari and the companion app) a
// tap on something that is not clickable (the background, an empty spot, a card with no action) sends no click to the
// page. It counts when the press and the release are both outside the card (a slider dragged out of the card does not
// fold it), and a scroll does not count (the browser cancels the pointer). Keyboard clicks still go through the click
// event. `tap(ev)` (a press and a release at the same spot) is for the tests.
export const watchOutside = (isOut, handler) => {
  let downOutside = false;
  const onDown = (ev) => {
    downOutside = isOut(ev);
  };
  const onUp = (ev) => {
    if (downOutside && isOut(ev)) handler(ev);
    downOutside = false;
  };
  const onClick = (ev) => {
    if (ev.detail === 0 && isOut(ev)) handler(ev);
  };
  return {
    on() {
      document.addEventListener("pointerdown", onDown, true);
      document.addEventListener("pointerup", onUp, true);
      document.addEventListener("click", onClick, true);
    },
    tap(ev) {
      onDown(ev);
      onUp(ev);
    },
    off() {
      document.removeEventListener("pointerdown", onDown, true);
      document.removeEventListener("pointerup", onUp, true);
      document.removeEventListener("click", onClick, true);
    },
  };
};

// After the confirmation popup closes, clicks on the card are ignored for this long (the rest of a double click).
export const CONFIRM_GUARD_MS = 400;

// The built card ships each brand logo in its own file next to it (energy-card.logo.<brand>.js, a data: URI), named
// "logo:<brand>" here: only the logo of the integration shown is downloaded, once. Preloaded logos
// (window.ENERGY_CARD_LOGOS, the screenshot harness) are used as they are; any other src is used directly.
export const LOGOS = {};
export const LOGO_LOADS = {};
export const LOGO_WAITING = {};
export let logoBase;
export const logoBaseUrl = () => {
  if (logoBase !== undefined) return logoBase;
  logoBase = null;
  const re = /\/energy-card\.js(\?|$)/;
  try {
    const src = document.currentScript?.src;
    if (src && re.test(src)) logoBase = src;
    const entries = logoBase ? [] : performance.getEntriesByType("resource");
    for (let i = entries.length - 1; i >= 0 && !logoBase; i--) if (re.test(entries[i].name)) logoBase = entries[i].name;
    if (!logoBase) for (const el of document.querySelectorAll("script[src]")) if (re.test(el.src)) logoBase = el.src;
  } catch (_err) {
    /* no DOM */
  }
  return logoBase;
};
logoBaseUrl();
// Gives `img` its picture: at once when known, else when its file is in.
export const setLogo = (img, src) => {
  const brand = typeof src === "string" && src.startsWith("logo:") ? src.slice(5) : null;
  if (!brand) return img.setAttribute("src", src);
  const known = LOGOS[brand] ?? globalThis.ENERGY_CARD_LOGOS?.[brand];
  if (known) return img.setAttribute("src", known);
  // Hidden until it has a picture: no alt text nor broken-image glyph in the badge meanwhile.
  img.style.visibility = "hidden";
  (LOGO_WAITING[brand] ||= new Set()).add(img);
  if (LOGO_LOADS[brand]) return;
  const base = logoBaseUrl();
  if (!base) return;
  LOGO_LOADS[brand] = import(new URL(`energy-card.logo.${brand}.js?v=${VERSION}`, base).href).then(
    (m) => {
      LOGOS[brand] = m.default;
      for (const el of LOGO_WAITING[brand]) {
        el.setAttribute("src", m.default);
        el.style.visibility = "";
      }
      delete LOGO_WAITING[brand];
    },
    (err) => console.warn(`energy-card: ${brand} logo not loaded (${err?.message ?? err})`),
  );
};

// Logos are written as <img data-img="id"> and get their src once, then the same node is moved into every later
// render: the HTML stays small and the picture is not decoded again on each update.
export const DATA_IMGS = [];
export const DATA_IMG_IDS = new Map();
export const imgTag = (src, attrs) => {
  let id = DATA_IMG_IDS.get(src);
  if (id === undefined) {
    id = DATA_IMGS.push(src) - 1;
    DATA_IMG_IDS.set(src, id);
  }
  return `<img data-img="${id}" ${attrs}>`;
};

// Error sensor values that mean "no error".
export const NO_ERROR = new Set(["none", "no_error", "ok", "0", "", "no error", "-"]);

// Elements a click acts on, and how one is told from the others across renders (see _focusedSpot).
export const FOCUS_SELECTOR = "[data-action], [data-entity]";
export const focusKey = (el) => {
  const data = Object.entries({ ...el.dataset });
  return data.length ? `${el.tagName}|${JSON.stringify(data)}` : "";
};

export class EnergyBase extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: "open" });
    this._html = "";
    // Ids of the illustration's gradients, apart from those of the other cards on the page.
    this._uid = ++_ecUid;
    // No rewrite of the card between a press and its click: Home Assistant updates the card several times a second,
    // and a rewrite under the pointer replaces the element pressed, so that the click lands on the card itself and
    // does nothing. The update held back is drawn once released: by the click (registered before the card's own
    // handler, which renders at once), else right after the release.
    this._onPress = () => {
      this._byPointer = true;
      this._pressing = true;
      window.addEventListener("pointerup", this._onPressEnd, true);
      window.addEventListener("pointercancel", this._onPressEnd, true);
    };
    this._onPressEnd = () => {
      window.removeEventListener("pointerup", this._onPressEnd, true);
      window.removeEventListener("pointercancel", this._onPressEnd, true);
      setTimeout(() => {
        this._pressing = false;
        if (this._dirty) this._update();
      }, 0);
    };
    this._onPressClick = (ev) => {
      if (ev.detail === 0) this._byPointer = false;
      this._pressing = false;
    };
    this.shadowRoot.addEventListener("pointerdown", this._onPress);
    this.shadowRoot.addEventListener("click", this._onPressClick);
    // From the keyboard, the focus is kept across rewrites (with the pointer it would draw the focus ring).
    this.shadowRoot.addEventListener("keydown", () => {
      this._byPointer = false;
    });
    this.shadowRoot.addEventListener("click", (ev) => this._onClick(ev));
    // Enter / Space on an element with the button role acts as a click, as on a <button>.
    this.shadowRoot.addEventListener("keydown", (ev) => {
      if ((ev.key !== "Enter" && ev.key !== " ") || ev.target?.getAttribute?.("role") !== "button") return;
      ev.preventDefault();
      ev.target.click();
    });
    // Escape closes the confirmation popup (as Cancel).
    this._onKey = (ev) => {
      if (ev.key !== "Escape" || !this._confirm) return;
      ev.stopPropagation();
      this._closeConfirm();
    };
  }

  // Home Assistant pushes a new hass on every state change of the whole instance: the card is only rebuilt when
  // something it shows changed (see _deps).
  set hass(hass) {
    this._hass = hass;
    const deps = this._deps();
    if (deps && sameDeps(this._lastDeps, deps)) return;
    this._lastDeps = deps;
    this._update();
  }

  get hass() {
    return this._hass;
  }

  // What a render reads from hass: the registries, the language, the theme and the state objects of the system's
  // entities. null (no system found): always render.
  _deps() {
    const h = this._hass;
    if (!h || !this._config) return null;
    const { sys } = findSystem(h, this._config);
    if (!sys) return null;
    const extra = sys.extra.flatMap((x) => [x.solar, x.solar_today, ...(this._config.show_strings ? x.strings : [])]);
    const strings = this._config.show_strings || !sys.roles.solar ? sys.strings : [];
    const ids = [...Object.values(sys.roles), ...extra, ...strings, ...sys.switches, ...sys.selects, ...forecastIds(h, this._config, sys), ...priceIds(this._config)];
    return [h.entities, h.devices, h.language, h.locale, h.themes?.darkMode, ...ids.map((id) => h.states[id])];
  }

  // A click elsewhere on the page folds the sections back to their defaults and closes the popup.
  connectedCallback() {
    this._outside ??= watchOutside(
      (ev) => isOutside(this, ev),
      () => {
        if (!this._toggled?.size && !this._confirm) return;
        this._toggled = new Map();
        if (this._confirm) this._closeConfirm();
        else this._update();
      },
    );
    this._outside.on();
    // A new width (or the web font loaded): the status pill is fitted again, in the next frame.
    if (typeof ResizeObserver === "function") {
      this._pillResize ??= new ResizeObserver((entries) => {
        const w = Math.round(entries.at(-1).contentRect.width);
        if (w === this._pillWidth) return;
        this._pillWidth = w;
        cancelAnimationFrame(this._pillFrame);
        this._pillFrame = requestAnimationFrame(() => this._fitPill());
      });
      this._pillResize.observe(this);
    }
    document.fonts?.ready?.then(() => this._fitPill());
    if (this._confirm) window.addEventListener("keydown", this._onKey);
    // Back on the page after leaving it: rendered again in its default state.
    if (this._hass && this._config) this._update();
  }

  disconnectedCallback() {
    this._pillResize?.disconnect();
    this._pillWidth = null;
    this._pressing = this._dirty = false;
    window.removeEventListener("pointerup", this._onPressEnd, true);
    window.removeEventListener("pointercancel", this._onPressEnd, true);
    this._outside?.off();
    window.removeEventListener("keydown", this._onKey);
    clearTimeout(this._pendingTimer);
    // Left (another dashboard view, a conditional card hidden): back to the defaults, so that the card does not come
    // back unfolded, with its popup open or a day of the week picked.
    this._toggled = new Map();
    this._confirm = null;
    this._weekSel = null;
  }

  // Service call whose failure Home Assistant already reports (toast); `onError` undoes what the card showed.
  _call(domain, service, data, onError) {
    return Promise.resolve(this._hass.callService(domain, service, data)).catch(() => onError?.());
  }

  setConfig(config) {
    if (!config) throw new Error("Invalid configuration");
    this._config = { ...config };
    // show_title / show_subtitle: the header's title / subtitle, hidden by the stylesheet
    this.toggleAttribute?.("hide-title", config.show_title === false);
    this.toggleAttribute?.("hide-subtitle", config.show_subtitle === false);
    this._html = "";
    this._lastDeps = null;
    this._update();
  }

  _t(key, vars) {
    return t(this._hass, this._config, key, vars);
  }

  // Home Assistant's time zone when the browser knows it, else undefined (the browser's own).
  _tz() {
    const tz = this._hass?.config?.time_zone;
    if (!tz) return undefined;
    try {
      new Intl.DateTimeFormat("en-US", { timeZone: tz });
      return tz;
    } catch (_err) {
      return undefined;
    }
  }

  _locale() {
    return intlLocale(this._hass, this._config);
  }

  _s(id) {
    return id ? this._hass.states[id] : undefined;
  }

  // State of a role of the system.
  _r(role) {
    return this._s(this._sys?.roles[role]);
  }

  // The status pill goes on the title row, right after the title, only when the whole title and the pill's whole
  // label fit there; otherwise it takes its own line under the subtitle (.pill-below) and the title keeps its row
  // (cut only when it does not fit alone). The subtitle then keeps one line (its whole text in its tooltip), and when
  // the block still runs out of the banner or into its ground strip, or the label does not fit its own line, the pill
  // keeps its dot alone (.pill-dot, the label in its tooltip and aria-label). Measured after each render and on each
  // new width, never by a fixed width, so that every language fits.
  _fitPill() {
    for (const t of this.shadowRoot?.querySelectorAll?.(".titles") || []) {
      const chips = [...t.querySelectorAll(".chip")];
      if (!chips[0]?.getBoundingClientRect) continue;
      t.classList.remove("pill-below", "pill-dot");
      const sub = t.querySelector(".sub");
      sub?.removeAttribute("title");
      if (!chips[0].querySelector(".chip-text")?.getClientRects().length) continue;
      const avail = t.getBoundingClientRect().width;
      const gap = parseFloat(getComputedStyle(chips[0].parentElement).columnGap) || 0;
      const widths = chips.map((c) => {
        const cs = getComputedStyle(c);
        return c.getBoundingClientRect().width + (parseFloat(cs.marginLeft) || 0) + (parseFloat(cs.marginRight) || 0);
      });
      if (textWidth(t.querySelector(".name")) + widths.reduce((w, c) => w + gap + c, 0) <= avail + 0.01) continue;
      t.classList.add("pill-below");
      if (sub && sub.scrollWidth > sub.clientWidth) sub.title = sub.textContent.trim();
      const banner = t.closest(".banner");
      const box = banner?.getBoundingClientRect();
      const floor = banner?.querySelector(".ec-ground")?.getBoundingClientRect().top ?? box?.bottom;
      const r = t.getBoundingClientRect();
      const out = box && (r.top < box.top - 0.5 || r.bottom > floor + 0.5);
      const room = avail;
      if (out || widths.some((w) => w > room + 0.01)) t.classList.add("pill-dot");
    }
  }

  _update() {
    if (!this._hass || !this._config) return;
    // Held back under a press (see the constructor): drawn once released.
    if (this._pressing) {
      this._dirty = true;
      return;
    }
    this._dirty = false;
    let html = this._render();
    if (this._confirm) {
      html = html.replace(/<ha-card>([\s\S]*)<\/ha-card>\s*$/, (_, inner) => `<ha-card class="dialog-open">${inner}${this._confirmHtml()}</ha-card>`);
    }
    if (html === this._html) return;
    const focused = this._confirm && this.shadowRoot.activeElement?.dataset?.action;
    const kept = this._confirm || this._byPointer ? null : this._focusedSpot();
    this._html = html;
    this.shadowRoot.innerHTML = html;
    this._fitPill();
    this._placeImages();
    if (kept) this._restoreFocus(kept);
    if (this._confirm) {
      const sel = focused === "confirm_cancel" ? '[data-action="confirm_cancel"]' : ".modal .primary";
      this.shadowRoot.querySelector(sel)?.focus({ preventScroll: true });
    }
  }

  _focusedSpot() {
    const el = this.shadowRoot.activeElement;
    if (!el?.dataset) return null;
    const key = focusKey(el);
    if (!key) return null;
    const index = this._focusables(key).indexOf(el);
    return index < 0 ? null : { key, index };
  }

  _focusables(key) {
    return [...this.shadowRoot.querySelectorAll(FOCUS_SELECTOR)].filter((n) => focusKey(n) === key);
  }

  _restoreFocus({ key, index }) {
    this._focusables(key)[index]?.focus({ preventScroll: true });
  }

  _placeImages() {
    const kept = this._imgNodes || new Map();
    this._imgNodes = new Map();
    for (const img of this.shadowRoot.querySelectorAll("img[data-img]")) {
      const key = `${img.dataset.img}|${img.className}`;
      const old = kept.get(key);
      if (old) {
        kept.delete(key);
        img.replaceWith(old);
        this._imgNodes.set(key, old);
      } else {
        setLogo(img, DATA_IMGS[img.dataset.img]);
        this._imgNodes.set(key, img);
      }
    }
  }

  // Switches only change state on the next poll of the integration: the requested state is shown meanwhile.
  _setPending(id, state) {
    this._pending = { ...this._pending, [id]: { state, until: Date.now() + PENDING_MS } };
    clearTimeout(this._pendingTimer);
    this._pendingTimer = setTimeout(() => this._update(), PENDING_MS + 100);
    this._update();
  }

  _isOn(id) {
    const s = this._s(id);
    const p = this._pending?.[id];
    if (p && (Date.now() > p.until || s?.state === p.state)) delete this._pending[id];
    else if (p) return p.state === "on";
    return s?.state === "on";
  }

  _onClick(ev) {
    const path = ev.composedPath();
    const el = path.find((n) => n.dataset && (n.dataset.entity || n.dataset.action));
    if (!this._confirm && Date.now() - (this._confirmClosedAt ?? 0) < CONFIRM_GUARD_MS) {
      ev.stopPropagation();
      return;
    }
    // Confirmation popup open: only its buttons and the backdrop itself act.
    if (this._confirm) {
      ev.stopPropagation();
      const action = el?.dataset.action;
      if (action === "confirm_ok") {
        const { entity, on } = this._confirm;
        this._closeConfirm();
        this._setPending(entity, on ? "off" : "on");
        this._call("switch", on ? "turn_off" : "turn_on", { entity_id: entity }, () => {
          if (this._pending) delete this._pending[entity];
          this._update();
        });
      } else if (action === "confirm_cancel" || (action === "confirm_backdrop" && path[0] === el)) {
        this._closeConfirm();
      }
      return;
    }
    if (!el) return;
    ev.stopPropagation();
    const { action, entity, label } = el.dataset;
    if (action === "zoom") return this._toggleZoom(ev);
    if (action === "week_day") {
      const day = Number(el.dataset.day);
      this._weekSel = this._weekSel === day ? null : day;
      this._html = null;
      return this._update();
    }
    if (action === "toggle_section") {
      const key = el.dataset.section;
      this._toggled = new Map(this._toggled).set(key, !this._isCollapsed(key));
      return this._update();
    }
    if (action === "switch") {
      // A switch of an inverter or a battery (charge from the grid, off-grid operation…) asks first.
      const on = this._isOn(entity);
      return this._openConfirm({ entity, on, text: this._t(on ? "confirm_off" : "confirm_on", { name: label }), ok: this._t(on ? "turn_off" : "turn_on") });
    }
    if (entity) this.dispatchEvent(new CustomEvent("hass-more-info", { detail: { entityId: entity }, bubbles: true, composed: true }));
  }

  _openConfirm(confirm) {
    this._confirm = confirm;
    window.addEventListener("keydown", this._onKey);
    this._update();
    this.shadowRoot.querySelector(".modal .primary")?.focus();
  }

  _closeConfirm() {
    this._confirm = null;
    this._confirmClosedAt = Date.now();
    window.removeEventListener("keydown", this._onKey);
    this._update();
  }

  _confirmHtml() {
    const c = this._confirm;
    return `<style>${DIALOG_STYLE}</style><div class="backdrop" data-action="confirm_backdrop">
      <div class="modal" role="dialog" aria-modal="true">
        <div class="msg">${esc(c.text)}</div>
        <div class="modal-actions">
          <button class="btn" data-action="confirm_cancel"><span>${esc(this._t("cancel"))}</span></button>
          <button class="btn primary" data-action="confirm_ok"><span>${esc(c.ok)}</span></button>
        </div>
      </div>
    </div>`;
  }

  // Translated state: Home Assistant's own translation of the integration, else a readable version of the value.
  _fmt(stateObj) {
    if (!stateObj) return "—";
    if (this._hass.formatEntityState) {
      try {
        return this._hass.formatEntityState(stateObj);
      } catch (_e) {
        /* older Home Assistant */
      }
    }
    return pretty(stateObj.state);
  }

  // Name of an entity without the device or integration name it starts with.
  _shortName(s) {
    let name = s.attributes?.friendly_name || s.entity_id;
    const dev = this._hass.devices?.[this._hass.entities?.[s.entity_id]?.device_id];
    for (const p of [dev?.name_by_user, dev?.name, this._sys?.name]) if (p && name.startsWith(`${p} `)) name = name.slice(p.length + 1);
    return name;
  }

  _powers() {
    return powersOf(this._hass, this._sys, this._config);
  }

  _soc() {
    const v = num(this._r("soc"));
    return v === null ? null : clamp(v, 0, 100);
  }

  _hasBattery(p) {
    return p.battery !== null || this._soc() !== null;
  }

  // Error of the inverter (error sensor), or null.
  _error() {
    const err = this._r("error");
    return valid(err) && !NO_ERROR.has(String(err.state).toLowerCase()) ? { entity: err.entity_id, text: this._fmt(err) } : null;
  }

  // The grid is down: the grid status binary sensor is off.
  _gridDown() {
    return this._r("grid_status")?.state === "off";
  }

  // Status chip of the header: error, grid outage, producing, battery state, or not producing.
  _status(p) {
    const err = this._error();
    if (err) return { cls: "crit", text: err.text, entity: err.entity };
    if (this._gridDown()) return { cls: "crit", text: this._t("grid_outage"), entity: this._sys.roles.grid_status };
    if (p.solar !== null && p.solar >= FLOW_MIN_W) return { cls: "active", text: this._t("producing"), entity: this._sys.roles.solar };
    if (p.solar === null && p.battery !== null) {
      const b = this._batteryState(p);
      return { cls: b === "idle" ? "idle" : "ok", text: this._t(b), entity: this._sys.roles.battery || this._sys.roles.soc };
    }
    return { cls: "idle", text: this._t("not_producing"), entity: this._sys.roles.solar };
  }

  _batteryState(p) {
    if (p.battery === null || Math.abs(p.battery) < FLOW_MIN_W) return "idle";
    return p.battery < 0 ? "charging" : "discharging";
  }

  // Today's energy, in kWh: produced, consumed, imported, exported, charged, discharged, with the consumption worked
  // out from the others when the integration gives none.
  _today() {
    const g = (role) => kwh(this._r(role));
    const extra = this._sys.extra || [];
    const produced = sumOf([g("solar_today"), ...extra.map((x) => kwh(this._s(x.solar_today)))]);
    const d = { produced, consumed: g("home_today"), imported: g("import_today"), exported: g("export_today"), charged: g("charge_today"), discharged: g("discharge_today") };
    if (extra.length && d.produced !== null && d.imported !== null && d.exported !== null) d.consumed = null;
    if (d.consumed === null && d.produced !== null && d.imported !== null && d.exported !== null)
      d.consumed = Math.max(0, d.produced + d.imported - d.exported + (d.discharged ?? 0) - (d.charged ?? 0));
    d.selfConsumption = d.produced > 0 && d.exported !== null ? clamp((d.produced - d.exported) / d.produced, 0, 1) * 100 : null;
    d.selfSufficiency = d.consumed > 0 && d.imported !== null ? clamp((d.consumed - d.imported) / d.consumed, 0, 1) * 100 : null;
    return d;
  }

  // Subtitle: today's self-sufficiency, else the inverter status. `produced` (the body shows the live powers): today's
  // production first, where the illustrated header would otherwise repeat the power shown in the diagram.
  _subtitle(produced = false) {
    const d = this._today();
    const L = this._locale();
    const parts = [];
    if (produced && d.produced !== null) parts.push(this._t("produced_today", { energy: fmtEnergy(d.produced, L) }));
    if (d.selfSufficiency !== null) parts.push(this._t("self_sufficient", { pct: fmtNum(Math.round(d.selfSufficiency), 0, L) }));
    else {
      const st = this._r("status");
      if (valid(st)) parts.push(this._fmt(st));
    }
    return parts.join(" · ");
  }

  // Icon of the card, colored by the status (`cls`), with the integration's logo as a badge.
  _logo(cls) {
    const b = BRANDS[this._sys.brand];
    const icon = svgIcon(ICONS.flash, "type");
    if (!b.logo) return `<span class="type-icon ${cls}">${icon}</span>`;
    return `<a class="logo-link type-icon ${cls}" href="${b.site}" target="_blank" rel="noopener noreferrer" title="${esc(b.name)}">${imgTag(b.logo, `class="logo" alt="${esc(b.name)}"`)}${icon}</a>`;
  }

  // Color of the header icon: the status, the battery's color while it runs (the sun down), or amber when the
  // battery runs low while nothing else is wrong.
  _iconClass(status, p) {
    if (status.cls === "crit" || status.cls === "active") return status.cls;
    const soc = this._soc();
    if (soc !== null && levelClass(soc) === "crit") return "warn";
    return this._batteryState(p) === "idle" ? status.cls : "ok";
  }

  // The status pill, in the header icon's colour (`cls`).
  _chip(status, cls) {
    return `<span class="chip ${status.entity ? "clickable " : ""}${cls}"${status.entity ? ` role="button" tabindex="0" data-entity="${esc(status.entity)}"` : ""} title="${esc(status.text)}" aria-label="${esc(
      status.text,
    )}"><span class="dot"></span><span class="chip-text">${esc(status.text)}</span></span>`;
  }

  // The header: the illustration with the title on its sky (see ecSceneSvg), or the classic header
  // (`illustration: false`).
  // The title, then the status pill right after it, or on a line of its own under the subtitle (see _fitPill); on a
  // very narrow card only its dot stays (its text stays in its title and aria-label).
  _titles(title, sub, pill) {
    return `<div class="titles">
          <div class="title-row"><div class="name">${esc(title)}</div>${pill}</div>
          ${sub ? `<div class="sub">${esc(sub)}</div>` : ""}
        </div>`;
  }

  _header(status, sub, p) {
    const title = this._config.title || this._sys.name || this._t("solar");
    const cls = this._iconClass(status, p);
    const icon = this._logo(cls);
    const pill = this._chip(status, cls);
    if (this._config.illustration === false) {
      return `
      <div class="header">
        ${icon}
        ${this._titles(title, sub, pill)}
        ${this._zoomButton()}
      </div>`;
    }
    // The compact mini card's subtitle tells the live power; where the body's diagram shows it (full card, expanded
    // mini card), the subtitle tells today's figures instead (see _subtitle).
    const L = this._locale();
    const power = !this._heroInBody() && (status.cls === "active" ? fmtPower(p.solar, L) : status.cls === "ok" && p.battery !== null ? fmtPower(Math.abs(p.battery), L) : "");
    const night = ecIsNight(this._hass, this._config);
    const scene = ecSceneSvg(this._uid, {
      solar: p.solar,
      flows: flowsOf(p),
      hasBattery: this._hasBattery(p),
      hasGrid: p.grid !== null || !!this._sys.roles.grid_status,
      soc: this._soc(),
      batteryState: this._batteryState(p),
      gridDown: this._gridDown(),
      error: !!this._error(),
      night,
      balcony: !!BRANDS[this._sys.brand].balcony,
    });
    return `
      <div class="banner${night ? " night" : ""}">
        ${scene}<div class="ec-ground"></div>
        <div class="htext">
          ${icon}
          ${this._titles(title, [power, sub].filter(Boolean).join(" · "), pill)}
        </div>
        ${this._zoomButton()}
      </div>`;
  }

  // Whether the body shows the live powers (the diagram): always on the full card, only expanded on the mini card.
  _heroInBody() {
    return true;
  }

  // The illustration's styles, only when it is shown.
  _sceneStyle() {
    return this._config.illustration === false ? "" : EC_SCENE_STYLE;
  }

  // Detail button at the far right of the header (mini card only).
  _zoomButton() {
    return "";
  }

  _errorCard(key) {
    const extra = key === "unknown_integration" ? `: ${this._config.integration}` : "";
    return `<style>${BASE_STYLE}</style><ha-card><div class="warning">${esc(this._t(key) + extra)}</div></ha-card>`;
  }

  _accent() {
    return `:host { --ec-accent: ${BRANDS[this._sys.brand].accent[this._hass?.themes?.darkMode ? 1 : 0]}; }`;
  }

  // Collapsible sections: `collapsed` lists the sections folded by default; a click on a section title folds or
  // unfolds it, and a click elsewhere on the page folds it back.
  _isCollapsed(key) {
    if (this._toggled?.has(key)) return this._toggled.get(key);
    const c = this._config.collapsed ?? DEFAULT_COLLAPSED;
    return (Array.isArray(c) ? c : [c]).includes(key);
  }

  _sectionTitle(key, icon, label) {
    const closed = this._isCollapsed(key);
    return `<div class="section-title toggle" role="button" tabindex="0" data-action="toggle_section" data-section="${key}" aria-expanded="${!closed}">${svgIcon(icon)}<span>${esc(
      label,
    )}</span>${svgIcon(ICONS.chevron_down, "chevron")}</div>`;
  }
}
