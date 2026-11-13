# Changelog

## 1.3.1 - 2026-11-13

### Fixes
- Folding back on a tap elsewhere now works on iOS (Safari and the companion app): a tap on something that is not clickable sent no click to the page, so the unfolded sections, the confirmation and the detailed view of the mini card stayed open. The press and the release are caught instead; a slider dragged out of the card and a scroll do not fold anything.
- Leaving the card (another dashboard view, a conditional card hidden) brings it back in its default state: sections folded as configured, confirmation closed, mini card compact.

## 1.3.0 - 2026-11-12

### Features
- `show_title` and `show_subtitle` options (also in the visual editor) hide the header's title and its subtitle, separately, for a card placed under a section heading of its own (asked in juju35/ha-vehicle-card#72).

## 1.2.2 - 2026-11-09

### Improvements
- Last 7 days: short day names (*Tue*, *Wed*…) instead of the letters that repeat (*T W T F S S M*), and a tapped day shows its own production and consumption in place of the week's totals (tap it again for the totals) — the hover tooltip didn't work on a phone.

## 1.2.1 - 2026-11-09

### Maintenance
- No code change: released again to check the installation from the Marketplace.

## 1.2.0 - 2026-11-09

### Features
- **Last 7 days**: a section with the production and consumption of each of the last 7 days as bars (the day's figures on hover) and the week's totals, from the daily change of the *today* energy sensors in the recorder's statistics (one query an hour). `show_week: false` hides it; `week` can be folded like the other sections.

## 1.1.1 - 2026-11-09

### Fixes
- Translations: the cards are defined once the page's language file has arrived (at most 1.5 s; Home Assistant builds a card when its element gets defined), so the first render is already translated instead of English then redrawn; until a language file is in, a missing text reads the English one wherever the card has no fallback of its own.

## 1.1.0 - 2026-11-09

### Performance
- **Translations load on demand**: the bundle keeps English only (155 KB → 123 KB) and each other language is its own `energy-card.i18n.<lang>.js` file next to it, fetched the first time a card needs it. Home Assistant loads every dashboard resource on every dashboard, so each page used to download and parse all 22 languages to use one. Until a language file has arrived (a few milliseconds), texts fall back to English, and the cards redraw once it is there.

### Maintenance
- Build: `scripts/i18n-split.mjs` splits the built bundle and rebuilds every table from the split files to check them (the build fails on any difference); `src/` keeps every language as before.
- Release: every file of `dist/` is attached. Manual installation copies the translation files too.

## 1.0.0 - 2026-11-09

### Features
- First release: a full **Energy Card** (`custom:energy-card`) and a compact **Energy Mini Card** (`custom:energy-mini-card`) for solar inverters and home batteries, whatever the integration.
- Known integrations read in depth: Enphase Envoy, SolarEdge, Fronius, Huawei Solar, SMA, Tesla Powerwall, Growatt, APsystems, SolaX and GoodWe, with each one's sign conventions; any other integration's power sensors read by their name, and every role settable by hand (`entities`, `invert_grid`, `invert_battery`).
- Animated power flow between the sun, the grid, the home and the battery, worked out the way the energy is used, faster with more power; triangle layout without a battery; grid outage shown.
- Battery level with the backup reserve, charging or discharging power, time to full or to the reserve, mode and capacity.
- Today's produced, consumed, imported, exported, charged and discharged energy, self-consumption and self-sufficiency.
- The integration's switches as toggles with a confirmation, its selects with their value.
- Visual editor for both cards, 22 languages, light and dark themes, narrow layouts for the Sections view.
