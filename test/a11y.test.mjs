// Keyboard access and names of the clickable elements, in both cards.
import assert from "node:assert/strict";
import { test } from "node:test";
import { devices, entities, states } from "../scripts/mock-states.mjs";
import { load } from "./load.mjs";

const ec = load();
const makeHass = () => ({ entities, devices, states, language: "en", callService() {} });
const newCard = (config = {}, Card = ec.EnergyCard) => {
  const card = new Card();
  card.setConfig({ collapsed: [], ...config });
  card.hass = makeHass();
  return card;
};

// Opening tags of the elements a click acts on: an entity (more-info) or an action.
const clickables = (html) => html.match(/<[a-z-]+\b[^>]*\bdata-(?:entity|action)="[^"]*"[^>]*>/g) || [];

test("every clickable element of the full and mini cards can be reached and used from the keyboard", () => {
  const pages = [newCard(), newCard({ integration: "huawei_solar" }), newCard({}, ec.EnergyMiniCard)];
  for (const card of pages) {
    const tags = clickables(card.shadowRoot.innerHTML).filter((tag) => !/data-action="confirm_backdrop"/.test(tag));
    assert.ok(tags.length > 3, "the card has clickable elements");
    for (const tag of tags) {
      if (tag.startsWith("<button")) continue;
      assert.match(tag, /\brole="button"/, tag);
      assert.match(tag, /\btabindex="0"/, tag);
    }
  }
});

test("the nodes of the diagram and the stats of the mini card have a name", () => {
  const html = newCard().shadowRoot.innerHTML;
  assert.match(html, /<g class="node" role="button" tabindex="0" data-entity="sensor\.envoy_production" aria-label="Solar 5\.2 kW">/);
  assert.match(html, /<svg class="flow" [^>]*role="group" aria-label="Power flow">/);
  assert.match(newCard({}, ec.EnergyMiniCard).shadowRoot.innerHTML, /aria-label="Home 1\.5 kW"/);
});

test("the section titles tell whether they are unfolded, the toggles are switches", () => {
  const html = newCard({ collapsed: ["today"] }).shadowRoot.innerHTML;
  assert.match(html, /data-section="today" aria-expanded="false"/);
  assert.match(html, /data-section="battery" aria-expanded="true"/);
  assert.match(html, /<button class="toggle-btn on" role="switch" aria-checked="true" aria-label="Grid enabled"/);
});

test("Escape closes the confirmation popup", () => {
  const card = newCard();
  card._onClick({ composedPath: () => [{ dataset: { action: "switch", entity: "switch.envoy_charge_reseau", label: "Charge from grid" } }], stopPropagation() {} });
  assert.match(card.shadowRoot.innerHTML, /dialog-open/);
  ec.window.fire("keydown", { key: "Escape", stopPropagation() {} });
  assert.doesNotMatch(card.shadowRoot.innerHTML, /dialog-open/);
});

test("the animations honour prefers-reduced-motion", () => {
  assert.match(newCard().shadowRoot.innerHTML, /prefers-reduced-motion: reduce/);
});
