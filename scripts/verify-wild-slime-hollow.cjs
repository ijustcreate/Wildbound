const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const {spawnSync} = require('node:child_process');

const root = path.resolve(__dirname, '..');
const source = path.resolve(process.env.WILDBOUND_VERIFY_APP || root);

if (!process.versions.electron) {
  const env = {...process.env};
  delete env.ELECTRON_RUN_AS_NODE;
  const binary = process.platform === 'win32' ? 'electron.exe' : 'electron';
  const electron = path.join(root, 'node_modules', 'electron', 'dist', binary);
  const result = spawnSync(electron, [__filename, '--mute-audio'], {
    cwd: root, env, encoding: 'utf8', timeout: 160000, windowsHide: true,
  });
  process.stdout.write(result.stdout || '');
  process.stderr.write(result.stderr || '');
  if (result.error) console.error(result.error);
  process.exit(result.status ?? 1);
}

const {app, BrowserWindow} = require('electron');
const output = path.join(root, 'test-output', 'wild-slime-hollow', source === root ? 'source' : 'packaged');
fs.mkdirSync(output, {recursive: true});
app.setPath('userData', fs.mkdtempSync(path.join(os.tmpdir(), 'wildbound-slime-hollow-')));
app.commandLine.appendSwitch('mute-audio');
const deadline = setTimeout(() => {
  console.error('Mossbell Hollow verification timed out.');
  app.exit(1);
}, 150000);

app.whenReady().then(async () => {
  const win = new BrowserWindow({show: false, width: 1130, height: 780, webPreferences: {backgroundThrottling: false}});
  win.webContents.setAudioMuted(true);
  const errors = [];
  win.webContents.on('console-message', event => {
    if (event.level === 'error') errors.push(event.message);
  });
  try {
    await win.loadFile(path.join(source, 'index.html'), {query: {tools: '1'}});
    const {images, ...result} = await win.webContents.executeJavaScript('(' + verify + ')()');
    const report = {...result, source, errors, muted: win.webContents.isAudioMuted()};
    for (const [name, data] of Object.entries(images)) {
      fs.writeFileSync(path.join(output, name + '.png'), Buffer.from(data.split(',')[1], 'base64'));
    }
    fs.writeFileSync(path.join(output, 'report.json'), JSON.stringify(report, null, 2));
    console.log(JSON.stringify(report));
    app.exit(report.failure || errors.length || !report.muted ? 1 : 0);
  } catch (error) {
    console.error(error.stack, errors);
    app.exit(1);
  } finally {
    clearTimeout(deadline);
  }
});

async function verify() {
  await wildboundBoot.ready;
  const tools = wildboundPolishTest;
  const [core, renderer, world, travel, hollow, sessions, items, combat, defeat] = await Promise.all([
    import('./src/core.mjs'), import('./src/render.mjs'), import('./src/wild-lands.mjs'),
    import('./src/wild-lands-world.mjs'), import('./src/wild-slime-hollow-site.mjs'), import('./src/session.mjs'),
    import('./src/items.mjs'), import('./src/enemy-damage.mjs'), import('./src/defeat-flow.mjs'),
  ]);
  const {WILD_SLIME_HOLLOW: site} = hollow;
  const checks = [], images = {}, measurements = {};
  const expect = (actual, label) => {
    if (!actual) throw Error(label);
    checks.push(label);
  };
  const distance = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);
  const fixture = site.checkpointApproach;
  const entry = {x: site.entrance.x, y: site.entrance.y - 60};
  const clearGround = {x: site.x - 60, y: site.y + 70};
  const canvas = document.getElementById('game-canvas');
  const r = new renderer.Renderer(canvas, tools.assets);

  // Drive the real Game and Renderer on a fixed clock in an unfocused window.
  const raf = window.requestAnimationFrame.bind(window);
  window.requestAnimationFrame = () => 0;
  await new Promise(resolve => raf(resolve));
  window.Worker = undefined;
  const newExpedition = () => {
    const next = new core.Game(() => .5, {deferWorld: true});
    next.addPlayer('keyboard', 'Hollow explorer');
    return next;
  };
  let g, p;
  function useGame(next) {
    g = next;
    p = g.players[0];
    tools.game = g;
    tools.renderer = r;
    tools.show('play');
    g.random = () => .5;
    g.spriteLibrary = tools.assets.library;
    g.persist = g.onSound = () => {};
    if (tools.paused) tools.resume();
  }
  useGame(newExpedition());
  const tick = (input = {}) => g.update(.05, {keyboard: input});
  const advance = frames => { for (let i = 0; i < frames; i++) tick(); };
  const until = (ready, label, limit = 240) => {
    for (let i = 0; i < limit && !ready(); i++) tick();
    if (!ready()) throw Error(label);
  };
  const state = () => g.trainTest?.wildSlimeHollow;
  const slimes = () => g.enemies.filter(e => e.wildSlimeRole && e.hp > 0);
  const boss = () => slimes().find(e => e.wildSlimeRole === 'boss');
  const move = () => boss()?.wildSlimeMove;
  const at = point => Object.assign(p, {x: point.x, y: point.y, ui: null});
  const press = action => {
    tick({[action]: true});
    tick();
  };
  const walk = (point, label, reach = 12) => {
    for (let i = 0; i < 140 && distance(p, point) > reach; i++) {
      const length = distance(p, point);
      const stride = Math.min(1, length / 16) / length;
      tick({x: (point.x - p.x) * stride, y: (point.y - p.y) * stride});
    }
    expect(distance(p, point) <= reach, label);
  };
  const frame = (name, focus, zoom = 1.2) => {
    r.trainScene = null;
    r.cameraOverride = focus && {...focus, zoom};
    r.draw(g, .05, {sealCapture: !!focus});
    images[name] = canvas.toDataURL();
  };
  const reload = () => {
    const saved = JSON.parse(JSON.stringify(sessions.saveSession(g)));
    useGame(sessions.restoreSession(saved));
    g.trainTest.preparing = false;
    return saved;
  };
  const setHealth = hp => Object.assign(p, {hp, invuln: 0, stun: 0, frozen: 0});
  const catchSlam = () => until(() => move()?.phase === 'windup', 'Boss did not wind up for a slam');
  const catchRecovery = () => until(() => move()?.phase === 'recover', 'Boss did not recover after its slam', 60);
  const hit = target => combat.damageEnemy(target, target.hp * 10, 'physical', {g, p, secondary: true});

  try {
    expect(world.enterWildLands(g, {persistent: true, homeStart: true}).ok, 'Normal Wilds expedition starts at the Homestead');
    g.trainTest.preparing = false;
    expect(travel.wildLandsTravel(g, site.id).ok, 'Mossbell Hollow is a registered Wilds destination');
    walk(fixture, 'The woodland approach is walkable to the checkpoint', 3);
    expect(!boss(), 'The checkpoint approach does not start the fight');
    items.take(p.inventory, 'potion', items.count(p, 'potion'));
    press('interact');
    expect(state()?.checkpointPlayers.includes(p.id), 'Native Interact binds this explorer to the checkpoint');
    expect(items.count(p, 'potion') === 1, 'Checkpoint refills one missing Health potion');
    press('interact');
    expect(items.count(p, 'potion') === 1, 'Repeated checkpoint interaction leaves the stocked potion alone');
    frame('01-checkpoint', {x: site.entrance.x, y: site.entrance.y - 34}, 1.45);

    walk(entry, 'Walking through the opening leads into the clearing');
    until(() => boss(), 'The boss did not appear after crossing the entrance', 25);
    expect(move()?.phase === 'entry' && slimes().filter(e => e.wildSlimeRole === 'add').length === 4,
      'The oversized boss enters with four native slime adds');
    const entryBoss = boss(), entryHp = entryBoss.hp;
    hit(entryBoss);
    expect(entryBoss.unattackable && entryBoss.hp === entryHp, 'Arrival protection stops incoming damage until the boss lands');
    const ids = slimes().map(e => e.id);
    until(() => move()?.phase === 'entry' && move().elapsed >= .70, 'Boss did not finish its visible drop', 25);
    frame('02-arrival', null);
    expect(slimes().map(e => e.id).join() === ids.join(), 'Remaining in the entrance starts one set of encounter actors');
    reload();
    tick();
    expect(state().active && slimes().map(e => e.id).join() === ids.join(), 'An active save restores the same attempt and actor IDs');

    at(clearGround);
    Object.assign(p, {maxHp: 300, hp: 300});
    catchSlam();
    const firstTarget = {...move().target};
    const radius = move().radius;
    expect(distance(firstTarget, p) < 12 && radius >= 40, 'Heavy slam locks a visible area at the explorer’s location');
    frame('03-slam-warning', firstTarget, 1.5);
    const beforeEvade = p.hp;
    const hurt = g.hurt.bind(g);
    const bossHits = [];
    g.hurt = (target, amount, attacker, options) => {
      const previous = target.hp;
      const result = hurt(target, amount, attacker, options);
      if (attacker?.wildSlimeRole === 'boss') bossHits.push({previous, after: target.hp});
      return result;
    };
    const escapeDirection = p.x < site.x ? 1 : -1;
    tick({x: escapeDirection, dodge: true});
    for (let i = 0; i < 18 && distance(p, firstTarget) < radius + 20; i++) {
      tick({x: escapeDirection});
    }
    expect(distance(p, firstTarget) >= radius, 'Native dodge clears the marked ground area');
    expect(distance(firstTarget, move().target) < .01, 'Slam marker remains fixed while the explorer moves');
    until(() => move()?.phase === 'slam', 'The boss did not leap after the warning', 40);
    advance(3);
    frame('04-slam-airborne', {x: firstTarget.x, y: firstTarget.y - 24}, 1.5);
    catchRecovery();
    measurements.evadeDamage = beforeEvade - p.hp;
    expect(!bossHits.length, 'Leaving the warning prevents the landing hit');
    frame('05-slam-impact', {x: (firstTarget.x + p.x) / 2, y: firstTarget.y}, 1.5);

    setHealth(300);
    catchSlam();
    const secondTarget = {...move().target};
    const priorBossHits = bossHits.length;
    until(() => move()?.phase === 'slam' && move().elapsed >= move().duration - .055,
      'The second marked leap did not reach its landing', 45);
    at(secondTarget);
    setHealth(300);
    catchRecovery();
    const strikes = bossHits.slice(priorBossHits).filter(hit => hit.after < hit.previous);
    measurements.slamHits = bossHits.slice(priorBossHits);
    expect(strikes.length === 1, 'Standing on the marker takes one native slam hit');
    measurements.slamDamage = strikes[0].previous - strikes[0].after;
    advance(5);
    frame('06-recovery', {x: boss().x, y: boss().y}, 1.5);

    const recovering = boss();
    const healthBeforeSword = recovering.hp;
    at({x: recovering.x - 35, y: recovering.y});
    Object.assign(p, {faceX: 1, faceY: 0, attack: 0, stun: 0});
    p.equipment = {...p.equipment, hand1: 'sword', hand2: null};
    tick({attack: true, aimX: 1});
    tick({aimX: 1});
    until(() => recovering.hp < healthBeforeSword, 'Native sword missed the recovery opening', 20);
    expect(move()?.phase === 'recover', 'Native sword damage lands inside the recovery window');
    measurements.recoverySwordDamage = healthBeforeSword - recovering.hp;

    at(site.approach);
    until(() => !slimes().length, 'Encounter did not reset after the party left', 100);
    expect(!state().cleared, 'Leaving removes the current attempt without marking a victory');
    walk(fixture, 'The approach is still walkable after retreat');
    walk(entry, 'The party can naturally re-enter the hollow');
    until(() => boss(), 'Boss did not return after retreat', 25);
    expect(!ids.includes(boss().id), 'Re-entering after retreat starts a fresh attempt');

    at(clearGround);
    setHealth(1);
    g.hurt(p, 10000, boss());
    until(() => g.phase === 'lost', 'Fallen solo explorer did not enter native defeat flow', 10);
    expect(defeat.continueAfterDefeat(g), 'Native Continue handles a complete defeat');
    expect(distance(p, site.checkpoint) < 75 && p.hp > 0 && !slimes().length,
      'Continue revives the bound explorer near the checkpoint and clears the failed attempt');
    walk(entry, 'Checkpoint recovery can walk into a new attempt');
    until(() => boss(), 'Boss did not return after defeat', 25);
    until(() => move()?.phase !== 'entry', 'Boss introduction did not finish after defeat', 55);

    at(entry);
    hit(boss());
    advance(8);
    expect(!state().cleared && !state().reward, 'Defeating the boss alone leaves the remaining adds to clear');
    for (const add of slimes()) hit(add);
    until(() => state().reward, 'Clearing all slimes did not award native ground loot', 25);
    expect(state().cleared, 'Defeating the boss and its four adds records victory');
    const reward = {...state().reward};
    frame('07-victory-loot', reward, 1.5);
    const savedVictory = reload();
    advance(6);
    expect(state().cleared && state().checkpointPlayers.includes(p.id) && !!state().reward && !slimes().length,
      'Serialized victory reload restores the checkpoint binding and unclaimed reward without foes');
    expect(savedVictory.wilds?.progress?.wildSlimeHollow?.cleared === true, 'Victory is in the normal expedition save record');
    const loot = g.loot.find(drop => drop.id === reward.id);
    expect(!!loot, 'Unclaimed reward returns as a native ground item');
    const beforeReward = items.count(p, loot.type);
    at(loot);
    press('loot');
    until(() => !state().reward, 'The native loot claim did not advance encounter state', 30);
    expect(items.count(p, loot.type) === beforeReward + loot.qty, 'The player receives the ground reward through native pickup');
    reload();
    at(entry);
    advance(30);
    expect(state().cleared && !state().reward && !slimes().length &&
      items.count(p, loot.type) === beforeReward + loot.qty, 'A claimed victory remains cleared after reload and re-entry');

    const coop = newExpedition();
    coop.addPlayer('pad:0', 'Eastwood explorer');
    useGame(coop);
    const partner = g.players[1];
    expect(world.enterWildLands(g, {persistent: true, homeStart: true}).ok &&
      travel.wildLandsTravel(g, site.id).ok, 'A two-player expedition can reach the hollow');
    const partnerStart = {x: partner.x, y: partner.y};
    walk(fixture, 'The expedition leader reaches the lantern with a partner outside', 3);
    press('interact');
    expect(state()?.checkpointPlayers.length === 1 && state().checkpointPlayers[0] === p.id &&
      !boss(), 'Lighting the lantern binds the nearby explorer and leaves the encounter dormant');
    walk(entry, 'A single explorer can challenge the boss while a partner stays outside');
    until(() => boss(), 'No boss for the local co-op challenger', 25);
    at(clearGround);
    g.hurt(p, 10000, boss());
    tick();
    expect(g.phase === 'play' && partner.hp > 0 && distance(partner, partnerStart) < .01,
      'A local knockout leaves the distant living partner in control');
    g.hurt(partner, 10000);
    until(() => g.phase === 'lost', 'A fully downed co-op party did not reach defeat flow', 10);
    expect(defeat.continueAfterDefeat(g) && distance(p, site.checkpoint) < 75 &&
      distance(partner, partnerStart) < .01 && partner.hp > 0 && !slimes().length,
      'Co-op Continue revives the distant player in place and sends the local player to the lantern');
    return {checks, measurements, images};
  } catch (error) {
    return {checks, measurements, images, failure: error.stack, diagnostic: {
      explorer: {x: p.x, y: p.y, hp: p.hp},
      state: state(), boss: move(),
    }};
  }
}
