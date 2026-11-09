# ha-energy-card

[![Marketplace](https://img.shields.io/badge/Marketplace-Custom-41BDF5.svg)](https://www.home-assistant.io/integrations/marketplace/)
[![HACS Validation](https://github.com/juju35/ha-energy-card/actions/workflows/hacs.yml/badge.svg)](https://github.com/juju35/ha-energy-card/actions/workflows/hacs.yml)
[![Validate](https://github.com/juju35/ha-energy-card/actions/workflows/validate.yml/badge.svg)](https://github.com/juju35/ha-energy-card/actions/workflows/validate.yml)
[![Lint](https://github.com/juju35/ha-energy-card/actions/workflows/lint.yml/badge.svg)](https://github.com/juju35/ha-energy-card/actions/workflows/lint.yml)
[![Release](https://img.shields.io/github/v/release/juju35/ha-energy-card)](https://github.com/juju35/ha-energy-card/releases/latest)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://github.com/juju35/ha-energy-card/blob/main/LICENSE)
[![Buy Me a Coffee](https://img.shields.io/badge/Buy%20Me%20a%20Coffee-FFDD00?logo=buymeacoffee&logoColor=black)](https://buymeacoffee.com/julienstep9)

<p align="center">
  <img src="https://raw.githubusercontent.com/juju35/ha-energy-card/main/images/enphase.png" alt="Enphase" width="56">&nbsp;&nbsp;
  <img src="https://raw.githubusercontent.com/juju35/ha-energy-card/main/images/solaredge.png" alt="SolarEdge" width="56">&nbsp;&nbsp;
  <img src="https://raw.githubusercontent.com/juju35/ha-energy-card/main/images/fronius.png" alt="Fronius" width="56">&nbsp;&nbsp;
  <img src="https://raw.githubusercontent.com/juju35/ha-energy-card/main/images/huawei.png" alt="Huawei" width="56">&nbsp;&nbsp;
  <img src="https://raw.githubusercontent.com/juju35/ha-energy-card/main/images/sma.png" alt="SMA" width="56">&nbsp;&nbsp;
  <img src="https://raw.githubusercontent.com/juju35/ha-energy-card/main/images/tesla.png" alt="Tesla" width="56">&nbsp;&nbsp;
  <img src="https://raw.githubusercontent.com/juju35/ha-energy-card/main/images/growatt.png" alt="Growatt" width="56">&nbsp;&nbsp;
  <img src="https://raw.githubusercontent.com/juju35/ha-energy-card/main/images/apsystems.png" alt="APsystems" width="56">&nbsp;&nbsp;
  <img src="https://raw.githubusercontent.com/juju35/ha-energy-card/main/images/solax.png" alt="SolaX" width="56">&nbsp;&nbsp;
  <img src="https://raw.githubusercontent.com/juju35/ha-energy-card/main/images/goodwe.png" alt="GoodWe" width="56">
</p>

Lovelace cards for Home Assistant to follow solar inverters and home batteries from **[Enphase](https://enphase.com)**, **[SolarEdge](https://www.solaredge.com)**, **[Fronius](https://www.fronius.com)**, **[Huawei](https://solar.huawei.com)** (SUN2000, LUNA2000), **[SMA](https://www.sma.de)**, **[Tesla](https://www.tesla.com/powerwall)** (Powerwall), **[Growatt](https://www.growatt.com)**, **[APsystems](https://apsystems.com)**, **[SolaX](https://www.solaxpower.com)** and **[GoodWe](https://www.goodwe.com)** — and any other integration that provides power sensors: live power flow between the sun, the grid, the home and the battery, battery level and time to full or empty, today's energy, self-consumption and self-sufficiency, and the integration's switches.

The cards work on top of the integrations you already use — [Enphase Envoy](https://www.home-assistant.io/integrations/enphase_envoy/), [SolarEdge](https://www.home-assistant.io/integrations/solaredge/), [Fronius](https://www.home-assistant.io/integrations/fronius/), [Huawei Solar](https://github.com/wlcrs/huawei_solar), [SMA](https://www.home-assistant.io/integrations/sma/), [Tesla Powerwall](https://www.home-assistant.io/integrations/powerwall/), [Growatt](https://www.home-assistant.io/integrations/growatt_server/), [APsystems](https://www.home-assistant.io/integrations/apsystems/), [SolaX](https://www.home-assistant.io/integrations/solax/), [GoodWe](https://www.home-assistant.io/integrations/goodwe/)… Entities are **discovered automatically** from the Home Assistant registries, whatever your Home Assistant language or entity ids, and each integration's sign conventions (a meter positive when exporting, a battery positive when charging, a load negative while consuming, unsigned powers with a direction sensor) are taken care of. Any role can also be set by hand.

[![Open your Home Assistant instance and open a repository inside the Marketplace.](https://my.home-assistant.io/badges/hacs_repository.svg)](https://my.home-assistant.io/redirect/marketplace_repository/?owner=juju35&repository=ha-energy-card&category=plugin)

| <img src="https://raw.githubusercontent.com/juju35/ha-energy-card/main/images/enphase.png" alt="" width="20"> Enphase | <img src="https://raw.githubusercontent.com/juju35/ha-energy-card/main/images/huawei.png" alt="" width="20"> Huawei | <img src="https://raw.githubusercontent.com/juju35/ha-energy-card/main/images/tesla.png" alt="" width="20"> Tesla Powerwall |
|---|---|---|
| <img src="https://raw.githubusercontent.com/juju35/ha-energy-card/main/screenshots/card.png" alt="enphase card" width="400"> | <img src="https://raw.githubusercontent.com/juju35/ha-energy-card/main/screenshots/card-huawei.png" alt="huawei card" width="400"> | <img src="https://raw.githubusercontent.com/juju35/ha-energy-card/main/screenshots/card-powerwall.png" alt="powerwall card" width="400"> |
| <img src="https://raw.githubusercontent.com/juju35/ha-energy-card/main/screenshots/mini-card.png" alt="enphase mini card" width="400"> | <img src="https://raw.githubusercontent.com/juju35/ha-energy-card/main/screenshots/mini-card-huawei.png" alt="huawei mini card" width="400"> | <img src="https://raw.githubusercontent.com/juju35/ha-energy-card/main/screenshots/mini-card-powerwall.png" alt="powerwall mini card" width="400"> |

| <img src="https://raw.githubusercontent.com/juju35/ha-energy-card/main/images/solaredge.png" alt="" width="20"> SolarEdge | <img src="https://raw.githubusercontent.com/juju35/ha-energy-card/main/images/fronius.png" alt="" width="20"> Fronius (no battery) |
|---|---|
| <img src="https://raw.githubusercontent.com/juju35/ha-energy-card/main/screenshots/card-solaredge.png" alt="solaredge card" width="400"> | <img src="https://raw.githubusercontent.com/juju35/ha-energy-card/main/screenshots/card-fronius.png" alt="fronius card" width="400"> |

## Features

- Two cards: a full **Energy Card** (`custom:energy-card`) and a compact **Energy Mini Card** (`custom:energy-mini-card`)
- Live **power flow** between the sun, the grid, the home and the battery: dots move along the links that carry power, in the color of their source (Home Assistant's energy dashboard colors), faster with more power; the sun glows while it produces, the battery ring shows its level and pulses while it charges
- The flows are worked out the way the energy is used: the sun serves the home first, then charges the battery and exports the rest; the grid covers what is left; the battery serves the home
- Without a battery the diagram is a triangle; without solar panels (a battery alone), the grid, the home and the battery
- Grid outage (backup): the grid is crossed out, nothing flows from or to it, the status says so
- Battery: level with the backup reserve marked on its bar, charging or discharging power, time to full or to the reserve, mode, reserve and capacity
- Today: produced, consumed, imported, exported, charged and discharged energy, self-consumption and self-sufficiency (worked out from the others), self-sufficiency in the header
- Last 7 days: production and consumption bars per day, with the week's totals, from the recorder's statistics of the daily energy sensors
- Options: the integration's switches (charge from the grid, off-grid operation…) as toggles that ask for a confirmation, and its selects (storage or work mode) with their value
- Status chip: producing, not producing, battery charging or discharging, grid outage, inverter error
- Header icon of a solar panel with the brand logo as a badge, opening the brand's site, in the brand's color, readable in the light and dark themes
- The missing one of the grid and home powers is worked out from the others; powers in W, kW or MW and energies in Wh, kWh or MWh are all read
- Collapsible sections (options folded by default)
- Sections view: the full card takes 12 columns by default and at least 9, the mini card 6; narrow widths get their own layout (see [Screenshots](#screenshots))
- Detail button on the mini card (top right): it switches the mini card to the full card's content and back; a click anywhere outside the card brings the compact view back
- Click any value to open its Home Assistant history (more-info dialog)
- Visual editor in the dashboard UI for both cards (no YAML needed)
- Light and dark mode, English, French, German, Spanish, Serbian (Cyrillic and Latin), Italian, Dutch, European Portuguese, Polish, Romanian, Danish, Swedish, Bulgarian, Russian, Ukrainian, Hungarian, Slovak, Czech, Slovenian, Latvian and Greek
- Single file, no external dependency, the logos are embedded

## Supported integrations

| Integration | Brands | What the cards show |
|---|---|---|
| <img src="https://raw.githubusercontent.com/juju35/ha-energy-card/main/images/enphase.png" alt="" width="16"> [Enphase Envoy](https://www.home-assistant.io/integrations/enphase_envoy/) (core) | Enphase IQ Gateway, IQ Battery | Production, consumption, net grid power, battery power and level, available energy and capacity, reserve, storage mode, grid status, production and consumption today, charge-from-grid and grid switches |
| <img src="https://raw.githubusercontent.com/juju35/ha-energy-card/main/images/solaredge.png" alt="" width="16"> [SolarEdge](https://www.home-assistant.io/integrations/solaredge/) (core) | SolarEdge | Solar, consumption, grid and storage power with their flow direction, storage level, production, consumption, purchased and fed-in energy |
| <img src="https://raw.githubusercontent.com/juju35/ha-energy-card/main/images/fronius.png" alt="" width="16"> [Fronius](https://www.home-assistant.io/integrations/fronius/) (core) | Fronius Symo, Primo, GEN24 | PV, load, grid and battery power, battery level and capacity, minimum reserve, energy today, inverter state and error |
| <img src="https://raw.githubusercontent.com/juju35/ha-energy-card/main/images/huawei.png" alt="" width="16"> [Huawei Solar](https://github.com/wlcrs/huawei_solar) (custom) | Huawei SUN2000, LUNA2000 | Input power, load, power meter, battery power and level, yield, consumption, grid supply and feed-in today, battery charge and discharge today, rated capacity, backup reserve, working mode, device status, charge-from-grid switch |
| <img src="https://raw.githubusercontent.com/juju35/ha-energy-card/main/images/sma.png" alt="" width="16"> [SMA](https://www.home-assistant.io/integrations/sma/) (core) | SMA Sunny Boy, Sunny Tripower, Sunny Island | PV power, grid absorbed and supplied power, battery charge and discharge power, level and capacity, daily yield, status |
| <img src="https://raw.githubusercontent.com/juju35/ha-energy-card/main/images/tesla.png" alt="" width="16"> [Tesla Powerwall](https://www.home-assistant.io/integrations/powerwall/) (core) | Tesla Powerwall | Solar, load, site and battery power, charge, remaining energy and capacity, backup reserve, operation mode, grid status (outage), off-grid switch |
| <img src="https://raw.githubusercontent.com/juju35/ha-energy-card/main/images/growatt.png" alt="" width="16"> [Growatt](https://www.home-assistant.io/integrations/growatt_server/) (core) | Growatt | PV, load, grid import and export, battery charge and discharge power, level, and their energy today |
| <img src="https://raw.githubusercontent.com/juju35/ha-energy-card/main/images/apsystems.png" alt="" width="16"> [APsystems](https://www.home-assistant.io/integrations/apsystems/) (core) | APsystems EZ1 | Total power and production today |
| <img src="https://raw.githubusercontent.com/juju35/ha-energy-card/main/images/solax.png" alt="" width="16"> [SolaX](https://www.home-assistant.io/integrations/solax/) (core) | SolaX | Power and battery level sensors, read by their name |
| <img src="https://raw.githubusercontent.com/juju35/ha-energy-card/main/images/goodwe.png" alt="" width="16"> [GoodWe](https://www.home-assistant.io/integrations/goodwe/) (core) | GoodWe | PV, house consumption, active (grid) and battery power, battery level, PV generation today, work mode |
| Any other | — | Power sensors read by their name (solar / PV, grid / meter, battery / storage, load / consumption), battery level by its device class, or every role set by hand with `entities` |

Details in [Integrations](#integrations).

## Prerequisites

Home Assistant 2024.8 or later, with an integration providing power sensors for your solar inverter, your battery or your energy meter.

## Installation

### Via the Marketplace (recommended)

Click the button below to add the repository directly:

[![Add to the Marketplace](https://my.home-assistant.io/badges/hacs_repository.svg)](https://my.home-assistant.io/redirect/marketplace_repository/?owner=juju35&repository=ha-energy-card&category=plugin)

Then click **Install**, and reload your browser when the Marketplace asks you to.

Or manually:

1. Open **Settings → Marketplace → Add from link** (top right; this needs a GitHub account connected)
2. Add `https://github.com/juju35/ha-energy-card` — Type: **Dashboard**
3. Open **Energy Card** and click **Install**
4. Clear your browser cache and refresh

### Manual

1. Download `energy-card.js` and the `energy-card.i18n.*.js` translation files from the [latest release](https://github.com/juju35/ha-energy-card/releases/latest)
2. Copy them all to `/config/www/` (without the translation files, the cards show in English)
3. Go to **Settings → Dashboards → ⋮ → Resources** → Add resource:
   - URL: `/local/energy-card.js`
   - Type: **JavaScript Module**
4. Clear your browser cache and refresh

## Configuration

### Card types

| Card | Type |
|---|---|
| Energy Card | `custom:energy-card` |
| Energy Mini Card | `custom:energy-mini-card` |

### Visual editor

Both cards have a visual editor: add the card from the dashboard UI, pick the integration and the options. No YAML needed.

### Minimal

```yaml
type: custom:energy-card
```

```yaml
type: custom:energy-mini-card
```

Without `integration`, the cards show the first supported integration found.

### Full options

```yaml
type: custom:energy-card
integration: enphase_envoy    # integration domain (enphase_envoy, solaredge, fronius, huawei_solar, sma, powerwall…)
title: Solar                  # optional, defaults to the brand
show_flow: true
show_battery: true
show_today: true
show_options: true
show_controls: true           # toggles of the switches (false: their state only)
collapsed:                    # sections folded by default
  - options
entities:                     # optional, sets or replaces any role
  solar: sensor.pv_power
  grid: sensor.grid_power
  battery: sensor.battery_power
  soc: sensor.battery_level
  home: sensor.house_power
invert_grid: false            # true: the grid sensor is positive when exporting
invert_battery: false         # true: the battery sensor is positive when charging
language: en                  # optional, defaults to the Home Assistant language
```

```yaml
type: custom:energy-mini-card
integration: huawei_solar
zoom: true                    # detail button at the top right
```

A card can also be built from `entities` alone, without `integration` (a meter and a few sensors of different integrations, say).

### Options reference

| Option | Card | Default | Description |
|---|---|---|---|
| `integration` | both | First supported integration | Integration domain to display (`enphase_envoy`, `solaredge`, `fronius`, `huawei_solar`, `sma`, `powerwall`, `growatt_server`, `apsystems`, `solax`, `goodwe`, or any other domain with power sensors) |
| `title` | both | Brand name | Card title |
| `zoom` | mini | `true` | Detail button at the top right of the mini card: it shows the full card's content (with the same options, so `show_today`, `collapsed`… can be set on the mini card too) and switches back to the compact view; a click outside the card also brings the compact view back. `false` removes the button |
| `show_flow` | full | `true` | Power flow diagram |
| `show_battery` | full | `true` | Battery section |
| `show_today` | full | `true` | Today's energy |
| `show_week` | full | `true` | Production and consumption of each of the last 7 days (bars, the day's figures on hover) and their totals, from the daily change of the *today* energy sensors in the recorder's statistics (one query an hour) |
| `show_options` | full | `true` | Options: the integration's switches and selects |
| `show_controls` | full | `true` | Toggles of the switches; `false` shows their state only |
| `collapsed` | full | `[options]` | Sections folded by default, among `battery`, `today`, `week` and `options` (`[]` to unfold everything). Click a section title (or Tab to it and press Enter or Space) to fold or unfold it |
| `entities` | both | — | Entities set by hand, by role: `solar`, `home`, `grid` (+ import, − export), `grid_import`, `grid_export`, `battery` (+ discharge, − charge), `battery_charge`, `battery_discharge`, `soc`, `solar_today`, `home_today`, `import_today`, `export_today`, `charge_today`, `discharge_today`, `battery_energy`, `battery_capacity`, `reserve`, `mode`, `status`, `error`, `grid_status` |
| `invert_grid` | both | `false` | The grid sensor is positive when exporting |
| `invert_battery` | both | `false` | The battery sensor is positive when charging |
| `language` | both | Auto | Force language: `fr`, `en`, `de`, `es`, `sr`, `sr-Latn`, `it`, `nl`, `pt`, `pl`, `ro`, `da`, `sv`, `bg`, `ru`, `uk`, `hu`, `sk`, `cs`, `sl`, `lv` or `el` (auto-detects from HA settings) |

## Screenshots

### Animations

The dots move along the links that carry power and settle when nothing flows. Each state plays its own animation, and every one of them honours `prefers-reduced-motion`.

Midday, the sun covers the home, charges the battery (its ring pulses) and exports the rest:

| Light | Dark |
|---|---|
| <img src="https://raw.githubusercontent.com/juju35/ha-energy-card/main/screenshots/sunny.gif" alt="sunny animation" width="400"> | <img src="https://raw.githubusercontent.com/juju35/ha-energy-card/main/screenshots/sunny-dark.gif" alt="sunny animation dark" width="400"> |

In the evening, the battery takes over:

| Light | Dark |
|---|---|
| <img src="https://raw.githubusercontent.com/juju35/ha-energy-card/main/screenshots/evening-light.gif" alt="evening animation" width="400"> | <img src="https://raw.githubusercontent.com/juju35/ha-energy-card/main/screenshots/evening.gif" alt="evening animation dark" width="400"> |

At night, the battery at its reserve, the grid covers the home:

| Light | Dark |
|---|---|
| <img src="https://raw.githubusercontent.com/juju35/ha-energy-card/main/screenshots/night.gif" alt="night animation" width="400"> | <img src="https://raw.githubusercontent.com/juju35/ha-energy-card/main/screenshots/night-dark.gif" alt="night animation dark" width="400"> |

During a grid outage, the Powerwall and the last sun keep the home running, the grid is crossed out:

| Light | Dark |
|---|---|
| <img src="https://raw.githubusercontent.com/juju35/ha-energy-card/main/screenshots/outage-light.gif" alt="grid outage animation" width="400"> | <img src="https://raw.githubusercontent.com/juju35/ha-energy-card/main/screenshots/outage.gif" alt="grid outage animation dark" width="400"> |

### Light and dark

| Light | Dark |
|---|---|
| <img src="https://raw.githubusercontent.com/juju35/ha-energy-card/main/screenshots/card.png" alt="card" width="400"> | <img src="https://raw.githubusercontent.com/juju35/ha-energy-card/main/screenshots/card-dark.png" alt="card dark" width="400"> |
| <img src="https://raw.githubusercontent.com/juju35/ha-energy-card/main/screenshots/card-huawei-light.png" alt="huawei card" width="400"> | <img src="https://raw.githubusercontent.com/juju35/ha-energy-card/main/screenshots/card-huawei.png" alt="huawei card dark" width="400"> |
| <img src="https://raw.githubusercontent.com/juju35/ha-energy-card/main/screenshots/card-fronius-light.png" alt="fronius card" width="400"> | <img src="https://raw.githubusercontent.com/juju35/ha-energy-card/main/screenshots/card-fronius.png" alt="fronius card dark" width="400"> |
| <img src="https://raw.githubusercontent.com/juju35/ha-energy-card/main/screenshots/card-solaredge.png" alt="solaredge card" width="400"> | <img src="https://raw.githubusercontent.com/juju35/ha-energy-card/main/screenshots/card-solaredge-dark.png" alt="solaredge card dark" width="400"> |
| <img src="https://raw.githubusercontent.com/juju35/ha-energy-card/main/screenshots/card-powerwall.png" alt="powerwall card" width="400"> | <img src="https://raw.githubusercontent.com/juju35/ha-energy-card/main/screenshots/card-powerwall-dark.png" alt="powerwall card dark" width="400"> |
| <img src="https://raw.githubusercontent.com/juju35/ha-energy-card/main/screenshots/mini-card.png" alt="mini card" width="400"> | <img src="https://raw.githubusercontent.com/juju35/ha-energy-card/main/screenshots/mini-card-dark.png" alt="mini card dark" width="400"> |
| <img src="https://raw.githubusercontent.com/juju35/ha-energy-card/main/screenshots/mini-card-huawei-light.png" alt="huawei mini card" width="400"> | <img src="https://raw.githubusercontent.com/juju35/ha-energy-card/main/screenshots/mini-card-huawei.png" alt="huawei mini card dark" width="400"> |
| <img src="https://raw.githubusercontent.com/juju35/ha-energy-card/main/screenshots/mini-card-powerwall.png" alt="powerwall mini card" width="400"> | <img src="https://raw.githubusercontent.com/juju35/ha-energy-card/main/screenshots/mini-card-powerwall-dark.png" alt="powerwall mini card dark" width="400"> |

### Mini card detail button

The detail button at the top right switches the mini card to the full card's content; a click anywhere outside brings the compact view back:

| Light | Dark |
|---|---|
| <img src="https://raw.githubusercontent.com/juju35/ha-energy-card/main/screenshots/mini-card-zoom.png" alt="mini card zoomed" width="400"> | <img src="https://raw.githubusercontent.com/juju35/ha-energy-card/main/screenshots/mini-card-zoom-dark.png" alt="mini card zoomed dark" width="400"> |

### Confirmation

Switches ask for a confirmation at the top of the card:

| Light | Dark |
|---|---|
| <img src="https://raw.githubusercontent.com/juju35/ha-energy-card/main/screenshots/card-confirm.png" alt="confirmation popup" width="400"> | <img src="https://raw.githubusercontent.com/juju35/ha-energy-card/main/screenshots/card-confirm-dark.png" alt="confirmation popup dark" width="400"> |

### Narrow widths

The full card at its minimum width (9 of 12 columns of a narrow Sections view) and the mini card at 6 columns of a phone's Sections view:

| Full card | Mini card |
|---|---|
| <img src="https://raw.githubusercontent.com/juju35/ha-energy-card/main/screenshots/card-narrow.png" alt="narrow card" width="238"> <img src="https://raw.githubusercontent.com/juju35/ha-energy-card/main/screenshots/card-narrow-dark.png" alt="narrow card dark" width="238"> | <img src="https://raw.githubusercontent.com/juju35/ha-energy-card/main/screenshots/mini-card-narrow.png" alt="narrow mini card" width="170"> <img src="https://raw.githubusercontent.com/juju35/ha-energy-card/main/screenshots/mini-card-narrow-dark.png" alt="narrow mini card dark" width="170"> |

## How it works

### Integrations

The cards group the entities of an integration (its domain), whatever the device they belong to: an Enphase gateway and its batteries, a Huawei inverter, its battery and its meter make one system. Each entity gets a role (solar, home, grid, battery, battery level, today's energy, reserve, mode…) from its `translation_key`, mapped per integration; integrations without translation keys (GoodWe) are read by the end of their entity ids. Power sensors the mapping leaves out are read by their name (`pv`, `solar`, `grid`, `meter`, `battery`, `storage`, `load`, `consumption`…), and a battery level by its `battery` device class. `entities` sets or replaces any role.

### Signs and units

The cards use one convention: grid positive when importing, battery positive when discharging. Integrations with the other convention are turned around (Huawei Solar's meter and battery, GoodWe's active power), unsigned powers are read with their direction sensor (SolarEdge's grid and storage flow directions), and a negative load (Fronius) is read as a consumption. `invert_grid` and `invert_battery` turn around a meter wired the other way. Powers in W, kW or MW and energies in Wh, kWh or MWh are converted; a sensor in the wrong kind of unit is ignored.

### Power flow

The flows between the nodes are worked out from the four powers: the sun serves the home first, then charges the battery, and exports what is left; the grid covers the rest of the home and of the charge; the battery serves the home, and exports beyond what the sun exports. When the integration gives no home power it is worked out from the others (sun + grid + battery), and the grid from the home the other way round.

### Today

Self-consumption is the share of the production used at home (produced − exported) / produced, self-sufficiency the share of the consumption not taken from the grid (consumed − imported) / consumed. When the integration gives no consumption, it is worked out from the production, the import and the export (and the battery's charge and discharge).

### Brands

The integration gives the logo of the header badge and the accent color of the card, lighter in the dark theme. Unknown integrations get the solar panel icon alone and an amber accent.

## Development

```bash
npm install
npm run build        # bundles src/energy-card.js + the logos of images/ into dist/energy-card.js
npm run check        # builds and checks the card (run in CI)
npm test             # unit tests (node --test)
npm run screenshots  # renders the cards (and one GIF per animated state, needs ffmpeg) with mock data into screenshots/
```

`dist/` is not committed: `npm run build` creates it locally, CI builds it on every push, and the release workflow attaches the built file to the release, which is where the Marketplace installs it from.

### Releasing

1. Bump `version` in `package.json`
2. Add a `## <version>` section at the top of [CHANGELOG.md](https://github.com/juju35/ha-energy-card/blob/main/CHANGELOG.md)
3. Push to `main`: the **Release** workflow builds the card, creates the tag and the GitHub release with the changelog section as notes, and attaches `energy-card.js`

## Translations

The cards auto-detect the language from your Home Assistant settings. Currently supported:

| Language | Code |
|---|---|
| English | `en` |
| Français | `fr` |
| Deutsch | `de` |
| Español | `es` |
| Српски | `sr` |
| Srpski (latinica) | `sr-Latn` |
| Italiano | `it` |
| Nederlands | `nl` |
| Português (European; also used for `pt-BR`) | `pt` |
| Polski | `pl` |
| Română | `ro` |
| Dansk | `da` |
| Svenska | `sv` |
| Български | `bg` |
| Русский | `ru` |
| Українська | `uk` |
| Magyar | `hu` |
| Slovenčina | `sk` |
| Čeština | `cs` |
| Slovenščina | `sl` |
| Latviešu | `lv` |
| Ελληνικά | `el` |

Contributions for additional languages are welcome!

## Credits

Enphase, SolarEdge, Fronius, Huawei, FusionSolar, SMA, Tesla, Powerwall, Growatt, APsystems, SolaX and GoodWe are trademarks of their respective owners. The logos come from the [Home Assistant brands](https://github.com/home-assistant/brands) repository. This project is not affiliated with any of these companies.

## License

[MIT](https://github.com/juju35/ha-energy-card/blob/main/LICENSE)

## Support

If you find this project useful, you can support its development:

<a href="https://buymeacoffee.com/julienstep9"><img src="https://cdn.buymeacoffee.com/buttons/v2/default-yellow.png" alt="Buy Me a Coffee" height="50"></a>
