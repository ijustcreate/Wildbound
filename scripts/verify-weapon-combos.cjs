const {app, BrowserWindow} = require('electron');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');

const root = path.resolve(__dirname, '..');
const base = process.env.WILDBOUND_VERIFY_APP || root;
const stage = process.env.WILDBOUND_VERIFY_APP ? 'packaged' : 'source';
const out = path.join(root, 'test-output', 'weapon-combos', stage);
fs.mkdirSync(out, {recursive: true});
app.setPath('userData', fs.mkdtempSync(path.join(os.tmpdir(), 'wildbound-weapon-combos-')));
app.commandLine.appendSwitch('mute-audio');
app.disableHardwareAcceleration();

async function review() {
  await wildboundBoot.ready;
  if (wildboundBoot.error) throw Error(wildboundBoot.error);
  window.requestAnimationFrame = () => 0;
  const {Game} = await import('./src/core.mjs');
  const {Assets} = await import('./src/assets.mjs');
  const {Renderer} = await import('./src/render.mjs');
  const {rangedLaunchOrigin} = await import('./src/ranged-launch.mjs');
  const {saveSession, restoreSession} = await import('./src/session.mjs');
  const {knownWeaponCombos} = await import('./src/weapon-combo-discovery.mjs');
  const {initializeTacticalEnemy, tacticalPhase} = await import('./src/combat-tactics-state.mjs');
  const {readCounterOpening} = await import('./src/counterattack.mjs');
  const checks = [];
  const images = {};
  const verify = (value, name) => {
    checks.push({name, passed: !!value});
    if (!value) throw Error(name);
  };
  const assets = new Assets();
  await assets.load();
  const canvas = document.createElement('canvas');
  canvas.style.cssText = 'position:fixed;inset:0;width:100vw;height:100vh;z-index:2147483647';
  document.body.append(canvas);
  const renderer = new Renderer(canvas, assets);
  renderer.setDynamicShadows(false);

  let game = new Game(() => .5);
  let player = game.addPlayer('keyboard', 'Alder');
  game.start();
  Object.assign(game, {openingBoard: false, scenery: [], weather: null, house: null, event: null, enemies: [], spriteLibrary: assets.library});
  game.terrain.fill('grass');
  game.sky.elapsed = 100;
  game.onSound = game.persist = () => {};
  const spawn = (x, y, state = {}) => {
    const enemy = {id: game.nextId++, kind: 'skeleton_unarmed', sprite: 'skeleton', x, y,
      hp: 220, maxHp: 220, speed: 0, damage: 0, state: 'hunt', cooldown: 99, tacticTime: 99, faceX: -1, faceY: 0, flash: 0, ...state};
    game.enemies.push(enemy);
    return enemy;
  };
  const tick = (kind, times, onTick = () => {}) => {
    for (let i = 0; i < times; i++) {
      game.time += .02;
      game[kind](.02);
      onTick();
    }
  };
  const paint = name => {
    renderer.camera = {x: 643, y: 559, zoom: 1.9};
    renderer.draw(game, 0);
    images[name] = canvas.toDataURL('image/png');
  };
  const point = (x, y, hand1) => Object.assign(player, {x, y, room: null, faceX: 1, faceY: 0,
    equipment: {hand1}, attack: 0, charge: 0, previousInput: {}, invincible: true});

  point(440, 560, 'bow');
  player.inventory = [{type: 'arrow', qty: 3}];
  const origin = rangedLaunchOrigin(player, game.time, 'bow', {charge: 0});
  game.villageCampState = {campId: 'combo-review', fire: {x: origin.x + 75, y: origin.y}};
  const burning = spawn(origin.x + 155, origin.y);
  verify(game.fireArrow(player, 0), 'equipped bow releases an ordinary arrow');
  const arrow = game.arrows[0];
  tick('tickProjectiles', 50, () => {
    if (!images['flame-arrow'] && arrow.flameDistance > 0 && !arrow.stuck && arrow.x > origin.x + 100) paint('flame-arrow');
  });
  verify(!!images['flame-arrow'] && arrow.stuck && burning.burning > 0, 'campfire visibly ignites the real arrow and the arrow burns a surviving enemy');

  point(burning.x - 46, burning.y, 'sword');
  const second = spawn(burning.x + 59, burning.y);
  const third = spawn(burning.x + 118, burning.y);
  player.attackClip = 'swipe_big';
  game.resolveMelee(player, 0, {damage: 1.3});
  tick('tickCombatActors', 32);
  verify(second.hp < 220 && third.hp < 220, 'heavy strike sends an enemy into a second enemy, then into a third');
  verify(second.burning > 0 && third.burning > 0, 'arrow fire spreads along the collision chain');
  paint('fire-chain');

  game.enemies = [];
  game.effects = [];
  game.arrows = [];
  point(560, 560, 'ice_wand');
  const wand = rangedLaunchOrigin(player, game.time, 'wand');
  const frozen = spawn(wand.x + 87, wand.y);
  const nearby = spawn(frozen.x + 48, frozen.y + 30);
  verify(game.fireSpell(player, 1.2), 'charged ice wand launches its real bolt');
  tick('tickProjectiles', 22);
  verify(frozen.frozen > 1.6, 'charged ice bolt freezes the target');
  point(frozen.x - 44, frozen.y, 'sword');
  player.attackClip = 'swipe_big';
  const before = frozen.hp;
  game.resolveMelee(player, 0, {damage: 1.3});
  verify(!frozen.frozen && frozen.hp < before - 31, 'heavy melee consumes the freeze and adds shatter damage');
  verify(nearby.frozen > 0 && nearby.hp < 220, 'shatter splinters hit and prime a nearby enemy');
  paint('ice-shatter');

  game.enemies = [];
  game.effects = [];
  game.house = {walls: [{kind: 'wall', x: 682, y: 530, w: 8, h: 60}], doors: [], furniture: [], floors: [], pools: []};
  point(576, 560, 'sword');
  const slammed = spawn(620, 560);
  const protectedEnemy = spawn(712, 560);
  player.attackClip = 'swipe_big';
  game.resolveMelee(player, .2, {damage: 1.3});
  const afterStrike = slammed.hp;
  tick('tickCombatActors', 17);
  verify(slammed.x > 620 && slammed.x < 682 && slammed.hp < afterStrike && protectedEnemy.hp === 220, 'indoor wall stops and damages the thrown enemy while shielding the other side');
  verify(game.effects.some(effect => effect.gameplayFx === 'wall-impact'), 'wall contact makes its own editable debris cue');
  paint('wall-slam');

  game.enemies = [];
  game.effects = [];
  game.house = null;
  point(654, 560, 'sword');
  player.inventory = [{type: 'trap', qty: 1}];
  player.field.trap = 'capture';
  verify(game.trap(player), 'real trap placement spends a trap');
  point(576, 560, 'sword');
  const snared = spawn(620, 560);
  player.attackClip = 'swipe_big';
  game.resolveMelee(player, .2, {damage: 1.3});
  tick('tickCombatActors', 13);
  verify(snared.state === 'snared' && game.traps[0].life === 0, 'knockback crosses and consumes the armed trap');
  paint('trap-bowling');

  const restored = restoreSession(JSON.parse(JSON.stringify(saveSession(game))));
  const required = ['fire_arrows', 'body_collision', 'chain_reaction', 'fire_bowling', 'ice_shatter', 'wall_slam', 'trap_bowling'];
  verify(required.every(id => knownWeaponCombos(restored.players[0]).includes(id)), 'all seven discoveries survive a real expedition save round trip');

  game.enemies = [];
  game.effects = [];
  game.traps = [];
  game.supplyChests = [];
  point(576,560,'sword');
  player.attackClip = 'swipe_one';
  const cut = spawn(620,560);
  const contactSounds=[];
  game.onSound=(cue)=>contactSounds.push(cue);
  game.resolveMelee(player,0,{damage:1});
  verify(cut.hp < 220 && game.effects.some(effect => effect.gameplayFx === 'cut-impact') && contactSounds.includes('bladeContact'),
    'a normal sword strike damages and recoils with distinct cut particles and a contact cue');

  game = new Game(() => .5);
  player = game.addPlayer('keyboard','Alder');
  game.start();
  Object.assign(game,{openingBoard:false,scenery:[],enemies:[],traps:[],event:null,weather:null,
    house:null,time:20,spriteLibrary:assets.library});
  game.terrain.fill('grass');
  game.sky.elapsed=100;
  game.onSound = game.persist = () => {};
  const partner = game.addPlayer('pad:1','Ember');
  point(600,600,'sword');
  player.equipment.hand2 = 'shield';
  player.invincible = false;
  player.invuln = 0;
  Object.assign(partner,{x:595,y:605,faceX:1,faceY:0,equipment:{hand1:'sword'},attackClip:'swipe_big'});
  game.enemies = [];
  game.effects = [];
  game.combatHitstop = 0;
  const charger = spawn(633,600,{kind:'lion',combatRole:'charger',speed:65,damage:18,dx:-1,dy:0});
  initializeTacticalEnemy(charger);
  tacticalPhase(charger,'active',.12).targetId = player.id;
  const health = player.hp;
  game.update(.02,{keyboard:{block:true}});
  const opening=readCounterOpening(game,charger,partner);
  verify(player.hp === health && opening?.ownerId === player.id &&
    game.effects.some(effect => effect.gameplayFx === 'parry'),'a fresh shield block catches the real charge and exposes a partner opening');
  paint('guard-opening');
  const teamworkTrap = {x:691,y:600,life:5,owner:player.id,variant:'capture',capture:1};
  game.traps.push(teamworkTrap);
  game.resolveMelee(partner,0,{damage:1.3});
  verify(!readCounterOpening(game,charger,partner) && [player,partner].every(hero=>knownWeaponCombos(hero).includes('team_guard')),
    'one heavy counter claims the opening and both explorers receive Guard and Strike');
  for(let i=0;i<25;i++)game.update(.02,{keyboard:{}});
  verify(charger.state === 'snared' && teamworkTrap.life <= 0 && [player,partner].every(hero=>knownWeaponCombos(hero).includes('team_trap')),
    'the player-owned trap catches the launched charger and awards both collaborators Trap Assist');

  game.enemies = [];
  game.effects = [];
  game.spells = [];
  point(525,560,'ice_wand');
  player.mana = 100;
  const ice = rangedLaunchOrigin(player,game.time,'wand');
  const thermalTarget = spawn(ice.x+85,ice.y);
  game.fireSpell(player,1.2);
  tick('tickProjectiles',22);
  verify(thermalTarget.frozen > 0,'a second ice setup remains active for the ranged finisher');
  Object.assign(partner,{x:522,y:560,faceX:1,faceY:0,attack:0,mana:100,equipment:{hand1:'fire_wand'}});
  const beforeThermal = thermalTarget.hp;
  verify(game.fireSpell(partner,0),'the teammate releases the fire bolt through the normal wand entry point');
  tick('tickProjectiles',22);
  verify(thermalTarget.frozen === 0 && thermalTarget.hp < beforeThermal &&
    game.effects.some(effect=>effect.text === 'THERMAL SHOCK') &&
    [player,partner].every(hero=>knownWeaponCombos(hero).includes('team_elements')),
    'the ranged Thermal Shock consumes ice exactly once and credits both explorers');
  paint('thermal-shock');
  return {checks, images};
}

app.whenReady().then(async () => {
  const win = new BrowserWindow({show: false, width: 1180, height: 760, webPreferences: {backgroundThrottling: false}});
  win.webContents.setAudioMuted(true);
  const errors = [];
  win.webContents.on('console-message', event => { if (event.level === 'error') errors.push(event.message); });
  try {
    await win.loadFile(path.join(base, 'index.html'));
    const result = await win.webContents.executeJavaScript(`(${review.toString()})().catch(error => { throw Error(error.stack || String(error)); })`);
    for (const [name, data] of Object.entries(result.images)) {
      fs.writeFileSync(path.join(out, name + '.png'), Buffer.from(data.split(',')[1], 'base64'));
    }
    const report = {base, stage, checks: result.checks, errors, failed: errors.length + result.checks.filter(check => !check.passed).length};
    fs.writeFileSync(path.join(out, 'report.json'), JSON.stringify(report, null, 2));
    console.log(JSON.stringify({stage, checks: report.checks.length, failed: report.failed, errors}));
    win.destroy();
    app.exit(report.failed ? 1 : 0);
  } catch (error) {
    fs.writeFileSync(path.join(out, 'report.json'), JSON.stringify({base, stage, error: String(error), errors, failed: 1}, null, 2));
    console.error(error);
    win.destroy();
    app.exit(1);
  }
});
