import {initializeBoundlessWorld} from './boundless-world.mjs';
import {restoreFollowerControl} from './follower-control.mjs';
import { migrateEquipment, migrateLegacySupplies } from "./items.mjs";
import { Game } from "./core.mjs";
import { snapshot } from "./rooms.mjs";
import { generateWorld } from "./world.mjs";
import { initHero } from "./adventure.mjs";
import {upgradeHouseFeatures} from './house-design.mjs';
import {initLivingEcosystem} from './living-ecosystem.mjs';
import {restoreForestLandscape} from './forest-landscape.mjs';
import {cancelRobotRepair} from './storage-repair.mjs';
import {tickCharmStatuses} from './succubus-charm.mjs';
import {ensureOldWells} from './old-well.mjs';
import {houseKeepsWorld} from './house-victory.mjs';
import {upgradeCemeteryFeatures} from './graveyard-world.mjs';
import {trialState} from './expedition-trials.mjs';
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
  g.portals=(g.portals||[]).filter(d=>!d.forestTravel);
  delete g.forestJourney;
  if(!saved.state.expeditionTrials){delete g.expeditionTrials;trialState(g);}
  migrateLegacySupplies(g.sharedStash);
  // World drops retain their original anchors; do not merge distant arrows.
  for(const item of g.loot||[])migrateLegacySupplies([item]);
  for(const a of g.arrows||[])a.ammoType='arrow';
  for(const e of g.enemies||[])delete e.iceArrowsLeft;
  g.arrowIcePatches=[];
  // Old automatic lion->tiger cosmetic rolls were mislabeled encounters.
  // True tiger actors and explicit authored sprite/rig overrides are untouched.
  for(const e of g.enemies||[])if(e.kind==='lion'&&e.skin==='tiger'&&!e.sprite&&!e.rigOverride)e.skin='lion';
  g.forestLandscape=null;
  restoreForestLandscape(g,saved.state.forestLandscapeVersion??0);
  if(g.house&&!g.house.temple)upgradeHouseFeatures(g.house);
  if (!saved.state.turnOrder) {
    g.turnOrder = g.players.map((p) => p.id);
    g.locked = true;
  }
  if (saved.state.openingBoard === undefined)
    g.openingBoard = !g.event && !g.players.some((p) => p.rolls > 0);
  g.explored = new Set(saved.state.explored || []);
  g.boundlessLoadedChunks=[];
  g.scenery =
    g.phase === "won"&&!houseKeepsWorld(g)
      ? []
      : saved.state.scenery || generateWorld(g.seed).scenery;
  for (const p of g.players) {
    const data = structuredClone(p);
    initHero(p);
    Object.assign(p, data);
    // Older saves carry the original 125 impulse and no gravity setting.
    // Restore the quick-rise, quick-fall player arc without changing custom
    // jump values on newer saves.
    if (p.jumpImpulse === undefined || p.jumpImpulse === 125 || p.jumpImpulse === 180 || p.jumpImpulse === 205) p.jumpImpulse = 230;
    if (p.jumpGravity === undefined || p.jumpGravity === 360 || p.jumpGravity === 720) p.jumpGravity = 1200;
    migrateEquipment(p);
    p.previousInput = {};
    p.charge = 0;
    p.ui = null;
    cancelRobotRepair(p);
    p.dashHeld = false;
  }
  initializeBoundlessWorld(g);
  for(const p of g.players)restoreFollowerControl(g,p);
  initLivingEcosystem(g);
  tickCharmStatuses(g,0);
  ensureOldWells(g);
  upgradeCemeteryFeatures(g);
  return g;
}
