// Bundles src/energy-card.js into the Marketplace file dist/energy-card.js; the brand logos of the supported
// integrations go to dist/energy-card.logo.<brand>.js next to it (loaded on demand, like the translations).
// Usage: node scripts/build.mjs  (dist/ is not committed: CI and the release workflow build it)
import { mkdirSync, readFileSync, realpathSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { splitDist } from "./i18n-split.mjs";

const root = fileURLToPath(new URL("..", import.meta.url));
const pkg = JSON.parse(readFileSync(`${root}package.json`, "utf8"));
const dataUri = (file) => `data:image/png;base64,${readFileSync(`${root}images/${file}`).toString("base64")}`;
export const LOGOS = ["enphase", "solaredge", "fronius", "huawei", "sma", "tesla", "growatt", "apsystems", "solax", "goodwe", "foxess", "hoymiles", "ecoflow", "anker", "zendure", "marstek", "beem"];

let out = readFileSync(`${root}src/energy-card.js`, "utf8").replace("__VERSION__", pkg.version);
mkdirSync(`${root}dist`, { recursive: true });
// Each logo in its own file, fetched by the card only for the integration it shows.
for (const brand of LOGOS) {
  out = out.replace(`__IMG_LOGO_${brand.toUpperCase()}__`, `logo:${brand}`);
  writeFileSync(`${root}dist/energy-card.logo.${brand}.js`, `export default ${JSON.stringify(dataUri(`${brand}.png`))};\n`);
}

writeFileSync(`${root}dist/energy-card.js`, out);
console.log(`Built dist/energy-card.js (${(out.length / 1024).toFixed(1)} KB)`);

// Translations: English stays in the bundle, each other language goes to dist/energy-card.i18n.<lang>.js,
// fetched when a card needs it (scripts/i18n-split.mjs).
if (process.argv[1] && realpathSync(process.argv[1]) === realpathSync(fileURLToPath(import.meta.url))) splitDist(`${root}dist`, "energy-card.js", { version: pkg.version });
