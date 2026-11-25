import {activeCounterOpening} from './counterattack.mjs';
import {activeLevelUp} from './level-up.mjs';

function serializedEncounter(state) {
  const { trainAudio, ...saved } = state;
  if (state.eventActionRun instanceof Set) saved.eventActionRun = [...state.eventActionRun];
  return saved;
}

export function snapshot(g, {combatPresentation = false} = {}) {
  const omit = new Set([
    "random",
    "saving",
    "saveError",
    "controlLabels",
    "uiRevision",
    "fieldRevision",
    "onSound",
    "trainAudio",
    "persist",
    "spriteLibrary",
    "explored",
    "forestLandscape",
    "boundlessLoadedChunks",
    "realmViewerId",
  ]);
  const state = serializedEncounter(Object.fromEntries(
    Object.entries(g).filter(([key, value]) => !omit.has(key) && typeof value !== "function"),
  ));
  if (state.players?.some(actor => actor.levelUp)) {
    state.players = state.players.map(actor => {
      if (!actor.levelUp || combatPresentation && activeLevelUp(actor, g.time)) return actor;
      const {levelUp, ...player} = actor;
      return player;
    });
  }
  if (state.enemies) {
    state.enemies = state.enemies.map(enemy => {
      const opening = activeCounterOpening(enemy, g.time);
      if (!opening && !Object.hasOwn(enemy, 'counterOpeningCue')) return enemy;
      const actor = Object.fromEntries(Object.entries(enemy));
      delete actor.counterOpeningCue;
      if (opening && combatPresentation) {
        const {kind, startedAt, expiresAt} = opening;
        actor.counterOpeningCue = {kind, startedAt, expiresAt};
      }
      return actor;
    });
  }
  if (state.houseWorlds?.worlds) {
    state.houseWorlds = {
      ...state.houseWorlds,
      worlds: Object.fromEntries(Object.entries(state.houseWorlds.worlds)
        .map(([key, world]) => [key, serializedEncounter(world)])),
    };
  }
  return { ...state, explored: [...g.explored] };
}
export function cleanInput(input) {
  const out = {};
  const aimX = Number.isFinite(input?.aimX) ? input.aimX : 0;
  const aimY = Number.isFinite(input?.aimY) ? input.aimY : 0;
  const aimLength = Math.max(1, Math.hypot(aimX, aimY));
  for (const [key, v] of Object.entries(input || {})) {
    if (key === 'aimX' || key === 'aimY') out[key] = (key === 'aimX' ? aimX : aimY) / aimLength;
    else if (["x", "y"].includes(key))
      out[key] = Number.isFinite(v) ? Math.max(-1, Math.min(1, v)) : 0;
    else if (
      [
        "attack",
        "summon",
        "dodge",
        "jump",
        "loot",
        "quidditchBall",
        "trap",
        "interact",
        "potion",
        "block",
        "inventory",
        "portal",
        "bait",
        "next",
        "prev",
        "up",
        "down",
        "panel",
        "use",
        "store",
        "offhand",
        "sockets",
        "controlCycle",
        "salvage",
        "drop",
        "dropOne",
        "split",
        "pick",
        "close",
      ].includes(key)
    )
      out[key] = !!v;
  }
  return out;
}
export class Rooms {
  constructor(onEvent) {
    this.role = null;
    this.inputs = {};
    this.peer = null;
    this.age = 0;
    window.desktop?.onRoom((data) => onEvent(data));
  }
  send(data) {
    window.desktop?.sendRoom(data);
  }
  async host() {
    await this.stop();
    const result = await window.desktop.hostRoom();
    this.role = "host";
    return result.address;
  }
  async join(address, name) {
    await this.stop();
    this.role = "client";
    try {
      await window.desktop.joinRoom(address, name);
    } catch (e) {
      this.role = null;
      throw e;
    }
  }
  tick(g, dt, inputs) {
    if (this.role === "host") {
      this.age += dt;
      if (this.age > 0.1) {
        this.send({ type: "state", state: snapshot(g, {combatPresentation:true}) });
        this.age = 0;
      }
      return { ...inputs, ...this.inputs };
    }
    if (this.role === "client") {
      const local =
        Object.entries(inputs).find(
          ([k, v]) =>
            k.startsWith("pad:") &&
            (v.x || v.y || v.attack || v.block || v.dodge || v.interact || v.inventory ||
              v.portal || v.loot || v.drop || v.dropOne || v.quidditchBall),
        )?.[1] || inputs.keyboard;
      this.send({ type: "input", input: local });
      return {};
    }
    return inputs;
  }
  async stop(){this.role=null;this.peer=null;this.inputs={};this.playerId=null;await window.desktop?.stopRoom?.();}
}
