import { migrateEquipment } from "./items.mjs";
import { Game } from "./core.mjs";
import { snapshot } from "./rooms.mjs";
import { generateWorld } from "./world.mjs";
import { initHero } from "./adventure.mjs";
import {upgradeHouseFeatures} from './house-design.mjs';
import {initLivingEcosystem} from './living-ecosystem.mjs';
import {restoreForestLandscape} from './forest-landscape.mjs';
export function saveSession(game) {
  return { version: 1, state: snapshot(game) };
}
export function restoreSession(saved) {
  if (
    saved?.version !== 1 ||
    !Array.isArray(saved.state?.players) ||
    saved.state.players.length < 1 ||
    saved.state.players.length > 6
  )
    throw Error("Invalid expedition save");
  const g = new Game();
  Object.assign(g, saved.state);
  g.forestLandscape=null;
  restoreForestLandscape(g,saved.state.forestLandscapeVersion??0);
  if(g.house)upgradeHouseFeatures(g.house);
  if (!saved.state.turnOrder) {
    g.turnOrder = g.players.map((p) => p.id);
    g.locked = true;
  }
  if (saved.state.openingBoard === undefined)
    g.openingBoard = !g.event && !g.players.some((p) => p.rolls > 0);
  g.explored = new Set(saved.state.explored || []);
  g.scenery =
    g.phase === "won"
      ? []
      : saved.state.scenery || generateWorld(g.seed).scenery;
  for (const p of g.players) {
    const data = structuredClone(p);
    initHero(p);
    Object.assign(p, data);
    migrateEquipment(p);
    p.previousInput = {};
    p.charge = 0;
    p.ui = null;
    p.dashHeld = false;
  }
  initLivingEcosystem(g);
  return g;
}
