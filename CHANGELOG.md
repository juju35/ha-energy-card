# Changelog

## 1.0.0 - 2026-11-09

### Features
- First release: a full **Energy Card** (`custom:energy-card`) and a compact **Energy Mini Card** (`custom:energy-mini-card`) for solar inverters and home batteries, whatever the integration.
- Known integrations read in depth: Enphase Envoy, SolarEdge, Fronius, Huawei Solar, SMA, Tesla Powerwall, Growatt, APsystems, SolaX and GoodWe, with each one's sign conventions; any other integration's power sensors read by their name, and every role settable by hand (`entities`, `invert_grid`, `invert_battery`).
- Animated power flow between the sun, the grid, the home and the battery, worked out the way the energy is used, faster with more power; triangle layout without a battery; grid outage shown.
- Battery level with the backup reserve, charging or discharging power, time to full or to the reserve, mode and capacity.
- Today's produced, consumed, imported, exported, charged and discharged energy, self-consumption and self-sufficiency.
- The integration's switches as toggles with a confirmation, its selects with their value.
- Visual editor for both cards, 22 languages, light and dark themes, narrow layouts for the Sections view.
