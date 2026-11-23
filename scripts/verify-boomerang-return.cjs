const {app,BrowserWindow} = require('electron');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const root = path.resolve(__dirname, '..');
const base = process.env.WILDBOUND_VERIFY_APP || root;
const stage = process.env.WILDBOUND_VERIFY_APP ? 'packaged' : 'source';
const out = path.join(root, 'test-output', 'boomerang-return', stage);
fs.mkdirSync(out, {recursive:true});
app.setPath('userData',fs.mkdtempSync(path.join(os.tmpdir(),'wildbound-boomerang-')));
app.commandLine.appendSwitch('mute-audio');
app.disableHardwareAcceleration();

async function verify() {
  await wildboundBoot.ready;
  if (wildboundBoot.error) throw Error(wildboundBoot.error);
  window.requestAnimationFrame = () => 0;
  const {Game} = await import('./src/core.mjs');
  const {Assets} = await import('./src/assets.mjs');
  const {Renderer} = await import('./src/render.mjs');
  const {rangedLaunchOrigin} = await import('./src/ranged-launch.mjs');
  const checks = [];
  const images = {};
  function check(value, name) {
    if (!value) throw Error(name);
    checks.push(name);
  }
  const assets = new Assets();
  await assets.load();
  const canvas = document.createElement('canvas');
  canvas.style.cssText = 'position:fixed;inset:0;width:100vw;height:100vh;z-index:2147483647';
  document.body.append(canvas);
  const renderer = new Renderer(canvas, assets);
  renderer.setDynamicShadows(false);

  const g = new Game(() => .5), p = g.addPlayer('keyboard', 'Alder');
  g.start();
  Object.assign(g, {openingBoard:false, scenery:[], house:null, enemies:[], weather:null, event:null});
  g.terrain.fill('grass');
  g.sky.elapsed = 100;
  p.equipment.hand1 = 'starter_boomerang';
  Object.assign(p,{x:500,y:540,faceX:1,faceY:0});
  const tick = (duration) => {
    g.time += duration;
    g.tickProjectiles(duration);
  };
  const throwBlade = () => {
    const aim = {block:true,aimX:1,aimY:0};
    for (let i = 0; i < 6; i++) g.update(.05,{keyboard:{...aim,attack:true}});
    g.update(.02,{keyboard:{...aim,attack:false}});
    check(g.boomerangs.length === 1 && g.boomerangs[0].vx > 0, 'Actual held and released input launches right');
    return g.boomerangs[0];
  };
  const mob = (x,y) => ({id:g.nextId++,kind:'skeleton_unarmed',sprite:'skeleton',x,y,hp:100,maxHp:100,speed:0,damage:0,
    state:'hunt',cooldown:99,faceX:-1,faceY:0,flash:0});
  const paint = (name) => {
    renderer.camera = {x:610,y:600,zoom:1.65};
    renderer.draw(g, 0);
    images[name] = canvas.toDataURL('image/png');
  };
  function advanceToTurn(blade) {
    for (let i = 0; i < 50 && !blade.returning; i++) tick(.02);
    check(blade.returning && blade.turnRemaining > 0, 'Blade pauses before the return');
  }

  let blade = throwBlade();
  const oldY = blade.y;
  advanceToTurn(blade);
  check(g.moveActor(p,0,144) > 0, 'Thrower repositions through actual movement');
  g.update(.02,{keyboard:{}});
  const hand = rangedLaunchOrigin(p,g.time,'boomerang');
  const target = mob((blade.x+hand.x)/2,(blade.y+hand.y)/2);
  g.enemies = [target];
  tick(.025);
  check(blade.returnHand.y - oldY > 130, 'Visible return targets the new hand');
  paint('redirected-return');
  for (let i = 0; i < 65; i++) tick(.02);
  check(target.hp === 88 && g.boomerangs.length === 0 && p.equipment.hand1 === 'starter_boomerang', 'Redirected sweep hits the target and catches the equipped weapon');

  g.enemies = [];
  Object.assign(p,{x:500,y:540,faceX:1,faceY:0,attack:0,bowAiming:false,previousInput:{}});
  blade = throwBlade();
  const shield = mob(blade.x+86,blade.y);
  Object.assign(shield,{combatRole:'shield',tactics:{phase:'approach'},roleMind:{guard:100},equipment:{hand1:'sword',hand2:'shield'}});
  g.enemies = [shield];
  advanceToTurn(blade);
  check(shield.hp === 98 && shield.roleMind.guard === 82, 'The front guard chips damage');
  check(g.moveActor(p,0,30) > 0, 'The thrower moves laterally before the follow-up');
  for (let i = 0; i < 65; i++) tick(.02);
  check(shield.hp === 86 && shield.roleMind.guard === 82 && p.field.weaponCombos.includes('return_flank'), 'The rear return breaks through for full damage and discovers the flank');
  return {checks, images};
}

app.whenReady().then(async () => {
  const win = new BrowserWindow({show:false,width:1000,height:720,webPreferences:{backgroundThrottling:false}});
  win.webContents.setAudioMuted(true);
  const errors = [];
  win.webContents.on('console-message',event => { if(event.level==='error')errors.push(event.message); });
  try {
    await win.loadFile(path.join(base,'index.html'));
    const result = await win.webContents.executeJavaScript(`(${verify.toString()})().catch(error=>{throw Error(error.stack||String(error));})`);
    for(const [name,data] of Object.entries(result.images))fs.writeFileSync(path.join(out,name+'.png'),Buffer.from(data.split(',')[1],'base64'));
    const report = {base,stage,checks:result.checks,errors,failed:errors.length};
    fs.writeFileSync(path.join(out,'report.json'),JSON.stringify(report,null,2));
    console.log(JSON.stringify(report));
    app.exit(errors.length?1:0);
  } catch(error) {
    const report = {base,stage,error:String(error),errors,failed:1};
    fs.writeFileSync(path.join(out,'report.json'),JSON.stringify(report,null,2));
    console.error(error);
    app.exit(1);
  }
});
