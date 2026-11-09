# Changelog

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
