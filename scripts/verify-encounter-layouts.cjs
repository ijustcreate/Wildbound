const {app, BrowserWindow} = require('electron');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');

const root = path.resolve(__dirname, '..');
const base = process.env.WILDBOUND_VERIFY_APP || root;
const stage = process.env.WILDBOUND_VERIFY_APP ? 'packaged' : 'source';
const out = path.join(root, 'test-output', 'encounter-layouts', stage);
const profile = fs.mkdtempSync(path.join(os.tmpdir(), 'wildbound-encounters-'));
fs.mkdirSync(out, {recursive: true});
app.setPath('userData', profile);
app.commandLine.appendSwitch('mute-audio');
app.disableHardwareAcceleration();

async function review() {
  await wildboundBoot.ready;
  if (wildboundBoot.error) throw Error(wildboundBoot.error);
  window.requestAnimationFrame = () => 0;
  const {Game, EVENTS} = await import('./src/core.mjs');
  const {Assets} = await import('./src/assets.mjs');
  const {Renderer} = await import('./src/render.mjs');
  const {ENCOUNTER_LAYOUTS, encounterCampfires} = await import('./src/encounter-layout-data.mjs');
  const {findEncounterSite} = await import('./src/encounter-layouts.mjs');
  const {knownWeaponCombos} = await import('./src/weapon-combo-discovery.mjs');
  const {lightSources} = await import('./src/night-cycle.mjs');
  const {saveSession, restoreSession} = await import('./src/session.mjs');
  const checks = [];
  const images = {};
  const verify = (condition, name) => {
    checks.push({name, passed: !!condition});
    if (!condition) throw Error(name);
  };

  document.getElementById('lobby-studio').click();
  const studio = [...document.querySelectorAll('dialog[open]')].find(dialog =>
    [...dialog.querySelectorAll('button')].some(button => button.textContent.trim() === 'Events'));
  verify(studio, 'native Studio opened from the lobby');
  [...studio.querySelectorAll('button')].find(button => button.textContent.trim() === 'Events').click();
  const roster = [...studio.querySelectorAll('select')].find(select => [...select.options].some(option => option.text === 'Shieldgate Ruins'));
  verify(roster, 'native Events editor lists the new board encounters');
  roster.value = String(EVENTS.findIndex(event => event.name === 'Shieldgate Ruins'));
  roster.dispatchEvent(new Event('change', {bubbles: true}));
  const picker = () => studio.querySelector('select[aria-label="Encounter layout"]');
  const preview = () => studio.querySelector('canvas[aria-label*="placement preview"]');
  verify(picker()?.value === 'shieldgate' && preview() && !preview().hidden, 'opening Shieldgate shows its real layout and role placement');
  images['editor-shieldgate-preview'] = preview().toDataURL('image/png');
  picker().value = 'snare_pass';
  picker().dispatchEvent(new Event('change', {bubbles: true}));
  verify(preview()?.getAttribute('aria-label').startsWith('Snare Pass'), 'changing presets redraws the lane, supplies, and spawn preview');
  picker().value = 'shieldgate';
  picker().dispatchEvent(new Event('change', {bubbles: true}));
  studio.close();

  const assets = new Assets();
  await assets.load();
  const canvas = document.createElement('canvas');
  canvas.style.cssText = 'position:fixed;inset:0;width:100vw;height:100vh;z-index:2147483647';
  document.body.append(canvas);
  const renderer = new Renderer(canvas, assets);
  renderer.setDynamicShadows(false);
  const game = new Game(() => .35);
  const player = game.addPlayer('keyboard', 'Alder');
  game.environment = 'forest';
  game.start();
  game.spriteLibrary = assets.library;
  game.bloom = 3;
  const boardSide = {x: player.x, y: player.y};
  const roll = progress => {
    Object.assign(player, boardSide);
    game.roll = null;
    game.rollCooldown = 0;
    game.turnOrder = [];
    game.locked = false;
    player.progress = progress;
    verify(game.hitTable(player), 'explorer rolls at the normal board');
    game.resolveRoll();
  };
  const site = id => game.scenery.find(prop => prop.encounterVenue?.id === id)?.encounterVenue;
  const move = (actor, {x, y}) => Object.assign(actor, {x, y});
  const point = (anchor, [x, y]) => ({x: anchor.x + x, y: anchor.y + y});
  const walkRoute = (actor, anchor, route) => {
    move(actor, point(anchor, route[0]));
    return route.slice(1).every(offset => {
      const end = point(anchor, offset);
      game.moveActor(actor, end.x - actor.x, end.y - actor.y);
      return Math.hypot(end.x - actor.x, end.y - actor.y) < 3;
    });
  };
  const collect = (actor, type, quick = false) => {
    const loot = game.loot.find(drop => drop.type === type);
    verify(loot && loot.manualPickup !== false, `${type} is reachable as prepared loot`);
    move(actor, loot);
    verify(game.collect(actor, loot, quick), `explorer picks up ${type} through the ordinary loot path`);
  };
  const tick = (method, frames) => {
    for (let i = 0; i < frames; i++) {
      game.time += .02;
      game[method](.02);
    }
  };
  const paint = (id, name) => {
    const where = site(id);
    renderer.camera = {x: where.x, y: where.y - 4, zoom: 1.55};
    game.reveal = null;
    const time = game.time;
    game.time += 3;
    renderer.draw(game, 0);
    game.time = time;
    images[name] = canvas.toDataURL('image/png');
  };

  roll(0);
  const ember = site('ember_clearing');
  const first = game.enemies.find(enemy => enemy.comboLayout === 'ember_clearing');
  const fire = encounterCampfires(game)[0];
  verify(game.event.name === 'Ember Clearing' && ember && first && fire, 'a first solo forest board roll places the real campfire and wing walls');
  verify(lightSources(game).some(source => source.x === fire.x && source.y === fire.y), 'the native fire also emits world light');
  collect(player, 'starter_bow', true);
  collect(player, 'arrow');
  move(player, point(ember, ENCOUNTER_LAYOUTS.ember_clearing.entry));
  Object.assign(player, {faceX: 0, faceY: -1});
  paint('ember_clearing', 'ember-clearing');
  game.time = first.spawnReadyAt + .01;
  verify(game.fireArrow(player, .5), 'starter bow launches a real arrow from the approach lane');
  tick('tickProjectiles', 50);
  verify(first.burning > 0 && knownWeaponCombos(player).includes('fire_arrows'), 'the campfire itself ignites the arrow and the front slime burns');

  game.enemies = [];
  roll(6);
  const pass = site('snare_pass');
  verify(game.event.name === 'Snare Pass' && pass, 'the subsequent board roll places Snare Pass');
  verify(walkRoute(player, pass, ENCOUNTER_LAYOUTS.snare_pass.routes[1]), 'an explorer can walk the full side route behind the snare lane');
  const partner = game.addPlayer('pad:1', 'Ember');
  const trapPoint = point(pass, ENCOUNTER_LAYOUTS.snare_pass.trap);
  const lead = game.enemies.find(enemy => enemy.comboLayout === 'snare_pass');
  collect(partner, 'trap');
  Object.assign(partner, {x: trapPoint.x, y: trapPoint.y + 34, faceX: 0, faceY: -1});
  verify(game.trap(partner), 'co-op explorer arms the lane using actual trap stock');
  Object.assign(player, {x: lead.x, y: lead.y - 43, faceX: 0, faceY: 1, equipment: {hand1: 'sword'}, attackClip: 'swipe_big'});
  paint('snare_pass', 'snare-pass');
  game.time = lead.spawnReadyAt + .01;
  game.resolveMelee(player, .2, {damage: 1.3});
  tick('tickCombatActors', 18);
  verify(game.traps[0].life === 0 && knownWeaponCombos(player).includes('trap_bowling'), 'attack from behind launches the real zombie into the partner’s trap');

  game.enemies = [];
  roll(12);
  const gate = site('shieldgate');
  const roles = game.enemies.filter(enemy => enemy.comboLayout === 'shieldgate');
  if (game.event.name !== 'Shieldgate Ruins' || !gate) {
    const card = EVENTS.find(event => event.name === 'Shieldgate Ruins');
    const siteWithAssets = findEncounterSite(game, card);
    game.spriteLibrary = {};
    const siteWithoutAssets = findEncounterSite(game, card);
    throw Error(`Expected Shieldgate, drew ${game.event.name} at progress ${player.progress}. Sites ${JSON.stringify({siteWithAssets, siteWithoutAssets, ember, pass, card})}`);
  }
  verify(game.event.name === 'Shieldgate Ruins' && gate && roles.map(enemy => enemy.combatRole).join(',') === 'shield,charger,archer', 'mid-board forest roll starts a real shield, rush and archer encounter');
  verify(walkRoute(player, gate, ENCOUNTER_LAYOUTS.shieldgate.routes[1]), 'an explorer can cross behind the center wall from the lit flank');
  collect(player, 'ice_wand', true);
  verify(player.equipment.hand1 === 'ice_wand', 'the manual pickup can equip the Frost wand without a class or vendor visit');
  const charger = roles.find(enemy => enemy.combatRole === 'charger');
  const wall = game.scenery.find(prop => prop.id === 'encounter:shieldgate:wall:1');
  move(partner, point(gate, [-62, 54]));
  Object.assign(player, {x: charger.x, y: charger.y + 44, faceX: 0, faceY: -1, equipment: {hand1: 'sword'}, attackClip: 'swipe_big'});
  paint('shieldgate', 'shieldgate-ruins');
  game.time = charger.spawnReadyAt + .01;
  game.resolveMelee(player, .2, {damage: 1.3});
  tick('tickCombatActors', 24);
  verify(knownWeaponCombos(player).includes('wall_slam') && charger.y > wall.y, 'the actual stone backdrop stops the moving enemy and awards Wall Slam');
  const restored = restoreSession(JSON.parse(JSON.stringify(saveSession(game))));
  verify(encounterCampfires(restored).length === 2 && restored.scenery.filter(prop => prop.encounterVenue).length === 3, 'all camps and solid layouts survive an expedition save round trip');
  return {checks, images};
}

app.whenReady().then(async () => {
  const window = new BrowserWindow({show: false, width: 1200, height: 820, webPreferences: {backgroundThrottling: false}});
  window.webContents.setAudioMuted(true);
  const errors = [];
  window.webContents.on('console-message', event => { if (event.level === 'error') errors.push(event.message); });
  try {
    await window.loadFile(path.join(base, 'index.html'));
    const result = await window.webContents.executeJavaScript(`(${review.toString()})()`);
    for (const [name, url] of Object.entries(result.images)) fs.writeFileSync(path.join(out, `${name}.png`), Buffer.from(url.split(',')[1], 'base64'));
    const report = {stage, base, checks: result.checks, errors, failed: errors.length};
    fs.writeFileSync(path.join(out, 'report.json'), JSON.stringify(report, null, 2));
    console.log(JSON.stringify({stage, checks: report.checks.length, failed: report.failed}));
    app.exit(report.failed ? 1 : 0);
  } catch (error) {
    fs.writeFileSync(path.join(out, 'report.json'), JSON.stringify({stage, base, error: String(error), errors, failed: 1}, null, 2));
    console.error(error);
    app.exit(1);
  }
});
