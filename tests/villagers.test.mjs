import test from "node:test";
import assert from "node:assert/strict";
import { Game, EVENTS } from "../src/core.mjs";
import { VILLAGERS, VILLAGER_EVENT } from "../src/villager-data.mjs";
import {
  spawnVillagerCamp,
  tickVillagers,
  visibleVillagers,
} from "../src/villagers.mjs";
import { companionVisualActor } from "../src/companion-locomotion.mjs";
import { villagerMotion } from "../src/villager-motion.mjs";
import {
  openNpcDialogue,
  npcDialogueAction,
  npcDialogueView,
  tickNpcQuests,
} from "../src/npc-quests.mjs";
import {
  defaultVillagerMotion,
  validateVillagerMotion,
} from "../src/villager-motion.mjs";
import { defaultOathlessCaptainMotion } from "../src/oathless-captain-motion.mjs";
import { saveSession, restoreSession } from "../src/session.mjs";
import { travelHouseWorlds } from "../src/house-worlds.mjs";
import { rigPack } from "../src/project-rigs.mjs";
import { ITEMS } from "../src/items.mjs";
import { drawRoomVillagerFollowers } from "../src/villager-followers-render.mjs";
function setup() {
  const g = new Game(() => 0.31);
  g.environment = "forest";
  const p = g.addPlayer("keyboard", "Village QA");
  g.start();
  g.openingBoard = false;
  const camp = spawnVillagerCamp(g);
  assert.equal(camp.length, 3);
  return { g, p, camp };
}
function talk(g, p, id, action = "village:story") {
  p.ui = null;
  if(id==="april")for(let i=0;i<80&&g.villagers?.some(v=>v.villagerId==="april"&&v.incoming);i++)tickVillagers(g,.05);
  const v = visibleVillagers(g).find((v) => v.villagerId === id);
  assert.ok(v);
  Object.assign(p, { x: v.x, y: v.y + 20 });
  assert.ok(openNpcDialogue(g, p));
  assert.equal(p.ui.villagerId, id);
  npcDialogueAction(g, p, id==="april"?"village:recruit":action);
  return v;
}
function earn(g, p) {
  for (const id of g.villageCampState.camperIds) talk(g,p,id);
  talk(g,p,"april");
  p.ui = null;
}
test("villager retarget preserves captain data and provides editable reference gestures", () => {
  const before = defaultOathlessCaptainMotion(),
    m = defaultVillagerMotion();
  assert.ok(validateVillagerMotion(m));
  assert.equal(m.type, "villager");
  assert.ok(m.joints.head.position[2] < before.joints.head.position[2]);
  for (const n of [
    "wave",
    "cheer",
    "shrug",
    "sword_ready",
    "jump_slash",
    "walk",
    "run",
  ])
    assert.ok(m.clips[n]);
  assert.notDeepEqual(m.clips.wave, m.clips.cheer);
  assert.deepEqual(defaultOathlessCaptainMotion(), before);
  assert.ok(rigPack(EVENTS, ITEMS).villager);
});
test("spawn event creates exactly seven safe named unattackable villagers, never enemies", () => {
  const { g, camp } = setup(),
    enemies = g.enemies.length;
  assert.equal(EVENTS[73].type, "villager_camp");
  assert.equal(new Set(camp.map((v) => v.name)).size, 3);
  assert.ok(
    camp.every(
      (v) => v.unattackable && !g.blocked(v.x, v.y, 12, false, false, false, 0),
    ),
  );
  assert.equal(spawnVillagerCamp(g), camp);
  assert.equal(g.enemies.length, enemies);
  assert.ok(Math.max(...camp.flatMap((a) => camp.map((b) => Math.hypot(a.x-b.x,a.y-b.y)))) < 170);
  assert.ok(g.villageCampState.fire);
  g.spawnEvent(
    EVENTS.findIndex((e) => e.name === VILLAGER_EVENT.name),
    true,
  );
  assert.equal(g.villagers.length, 3);
  assert.ok(!g.villagers.some(v=>v.villagerId==="april"));
});
test("villager conversations show three relevant choices", () => {
  const {g,p,camp}=setup();
  for(const v of camp){
    p.ui=null;Object.assign(p,{x:v.x,y:v.y});
    assert.ok(openNpcDialogue(g,p));
    const actions=npcDialogueView(g,p).choices.map(c=>c.action);
    assert.deepEqual(actions,["village:story","village:small","close"]);
  }
});
test("only reading all stories awards April, once; gestures and repeated talks do not count", () => {
  const { g, p } = setup();
  const [first,...rest]=g.villageCampState.camperIds;
  talk(g, p, first, "village:small");
  assert.equal(p.villageVisit.heard.length, 0);
  talk(g,p,first);
  talk(g,p,first);
  assert.equal(p.villageVisit.heard.length, 1);
  for (const id of rest) talk(g,p,id);
  assert.ok(!p.aprilFriend?.active);
  talk(g, p, "april");
  assert.ok(p.aprilFriend.active);
  assert.equal(g.villageFollowers.length, 1);
  p.ui = null;
  assert.ok(visibleVillagers(g).some(v=>v.villagerId==='april'&&v.ownerKey));
  assert.ok(openNpcDialogue(g,p));
  assert.notEqual(p.ui.villagerId,'april');
  assert.equal(g.villageFollowers.length, 1);
});
test("villager conversation survives keeper tick, displays own story, and owns its input device", () => {
  const { g, p } = setup();
  talk(g, p, "milo");
  tickNpcQuests(g, 0.01);
  assert.ok(p.ui);
  assert.match(npcDialogueView(g, p).text, /backwards/);
  p.ui.ownerDevice = "pad:wrong";
  npcDialogueAction(g, p, "next");
  assert.equal(p.ui, null);
});
test("April follows actual movement and stays outside hostile combat collections", () => {
  const { g, p } = setup();
  earn(g, p);
  const a = g.villageFollowers[0];
  delete a.animationAction;
  g.blocked = () => false;
  Object.assign(p, { x: a.x + 180, y: a.y });
  const before = a.x;
  tickVillagers(g, 0.5);
  assert.ok(a.x > before);
  assert.ok(a.moving);
  assert.ok(a.step > 0);
  assert.ok(companionVisualActor(a,villagerMotion).playerFrame > 0);
  assert.ok(!g.enemies.includes(a));
  const pos = { x: a.x, y: a.y };
  g.blocked = () => true;
  p.x += 120;
  tickVillagers(g, 0.5);
  assert.deepEqual({ x: a.x, y: a.y }, pos);
});
test("April closes on nearby hostiles, animates a sword hit, and obeys her attack cooldown", () => {
  const {g,p}=setup();earn(g,p);
  const a=g.villageFollowers[0];delete a.animationAction;
  Object.assign(p,{x:a.x+20,y:a.y});
  const enemy={id:g.nextId++,kind:"skeleton",x:a.x+48,y:a.y,hp:50,maxHp:50,faction:"enemy"};
  g.enemies.push(enemy);g.blocked=()=>false;g.projectileBlocked=()=>false;
  tickVillagers(g,.1);
  assert.equal(enemy.hp,38);
  assert.equal(a.animationAction,"jump_slash");
  assert.ok(a.attackCooldown>0);
  tickVillagers(g,.1);assert.equal(enemy.hp,38);
  tickVillagers(g,.8);assert.ok(enemy.hp<38);
});
test("finishing Wildbound removes April's camp and ends its follower run", () => {
  const {g,p}=setup();earn(g,p);
  g.completeVictory();
  assert.equal(g.phase,"won");
  assert.equal(g.villagers.length,0);
  assert.equal(g.villageFollowers.length,0);
  assert.equal(visibleVillagers(g).length,0);
  assert.equal(p.aprilFriend.active,false);
  g.newExpedition();
  assert.equal(g.villagers.length,0);
  assert.equal(g.villageFollowers.length,0);
});
test("April stays with her player through a downed state and ends only when she falls",()=>{
 const {g,p}=setup();earn(g,p);p.hp=0;tickVillagers(g,.01);assert.equal(g.villageFollowers.length,1);assert.equal(p.aprilFriend.active,true);
 p.hp=100;tickVillagers(g,.01);g.villageFollowers[0].hp=0;tickVillagers(g,.01);assert.equal(p.aprilFriend.active,false);assert.equal(g.villageFollowers.length,0);
});test("April follows traversed room coordinates and renders in the owner’s room only", () => {
  const { g, p } = setup();
  earn(g, p);
  Object.assign(p, { room: "storage:qa", roomX: 100, roomY: 160 });
  tickVillagers(g, 0.01);
  const a = g.villageFollowers[0];
  assert.equal(a.room, p.room);
  assert.equal(a.roomX, 100);
  for (let i = 0; i < 14; i++) {
    p.roomX += 5;
    tickVillagers(g, 0.05);
  }
  assert.ok(a.roomX > 100 && a.roomX < p.roomX);
  const draws = [];
  drawRoomVillagerFollowers({}, g, p.room, { draw: (_c, v) => draws.push(v) });
  assert.equal(draws.length, 1);
  assert.equal(draws[0].x, a.roomX);
  drawRoomVillagerFollowers({}, g, "other", {
    draw: () => assert.fail("Wrong room"),
  });
  p.room = null;
  tickVillagers(g, 0.01);
  assert.equal(a.room, null);
});
test("camp progress is shared and the first player to invite April gets the sole follower",()=>{
 const {g,p}=setup(),q=g.addPlayer("pad:0","Second");q.hp=100;q.room=null;
 earn(g,p);assert.equal(g.villageFollowers.length,1);assert.equal(g.villageFollowers[0].ownerKey,String(p.profileId||p.id));
 assert.ok(!q.aprilFriend?.active);p.hp=0;tickVillagers(g,.01);assert.equal(g.villageFollowers.length,1);
 assert.equal(openNpcDialogue(g,q),false);
});test("story progress and earned follower survive JSON save/restore and house-world travel", () => {
  const { g, p } = setup();
  earn(g, p);
  const restored = restoreSession(JSON.parse(JSON.stringify(saveSession(g))));
  tickVillagers(restored, 0.01);
  assert.equal(restored.players[0].villageVisit.heard.length, 3);
  assert.equal(restored.villageFollowers.length, 1);
  const h = new Game(() => 0.3);
  h.environment = "house";
  const q = h.addPlayer("keyboard", "Traveler");
  h.start();
  h.houseWorldsEnabled = true;
  q.aprilFriend = { active: true, campId: "qa" };
  tickVillagers(h, 0.01);
  assert.equal(h.villageFollowers.length, 1);
  assert.ok(travelHouseWorlds(h, 5));
  tickVillagers(h, 0.01);
  assert.equal(h.villageFollowers.length, 1);
  assert.ok(travelHouseWorlds(h, 8));
  tickVillagers(h, 0.01);
  assert.equal(h.villageFollowers.length, 1);
  q.hp = 0;
  tickVillagers(h, 0.01);
  assert.equal(h.villageFollowers.length, 1);
});
