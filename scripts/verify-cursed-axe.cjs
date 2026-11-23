const {app, BrowserWindow} = require('electron');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');

const root = path.resolve(__dirname, '..');
const base = process.env.WILDBOUND_VERIFY_APP || root;
const stage = process.env.WILDBOUND_VERIFY_APP ? 'packaged' : 'source';
const out = path.join(root, 'test-output', 'cursed-axe', stage);
app.setPath('userData', fs.mkdtempSync(path.join(os.tmpdir(), 'wildbound-cursed-axe-')));
app.commandLine.appendSwitch('mute-audio');

async function review() {
  await wildboundBoot.ready;
  if (wildboundBoot.error) throw Error(wildboundBoot.error);
  window.requestAnimationFrame = () => 0;
  const {Game} = await import('./src/core.mjs');
  const {Assets} = await import('./src/assets.mjs');
  const {Renderer} = await import('./src/render.mjs');
  const {HeroUI} = await import('./src/hero-ui.mjs');
  const {ITEMS, equip, unequip} = await import('./src/items.mjs');
  const {drawPlayer, DIRECTIONS} = await import('./src/player-motion.mjs');
  const {drawItem} = await import('./src/item-art.mjs');
  const {DEFAULT_APPEARANCE} = await import('./src/appearance.mjs');
  const {saveSession, restoreSession} = await import('./src/session.mjs');
  const assets = new Assets();
  await assets.load();
  const g = new Game(() => .5);
  const p = g.addPlayer('keyboard', 'Alder');
  g.start();
  Object.assign(g, {openingBoard:false, scenery:[], enemies:[], event:null, weather:null, spriteLibrary:assets.library});
  g.terrain.fill('grass');
  g.persist = g.onSound = () => {};
  p.inventory = [];
  p.equipment = {};
  p.appearance = {...DEFAULT_APPEARANCE, ...p.appearance, eyeColor:'#4e7b59'};
  g.dropLoot(p.x, p.y, 'cursed_axe', 1, 'Overlook Maze', true);
  const checks = [], images = {};
  const check = (ok, name) => { if (!ok) throw Error(name); checks.push(name); };
  check(g.collect(p, g.loot.find(item => item.type === 'cursed_axe')), 'Ground reward collects through the native loot path');
  const itemIndex = () => p.inventory.findIndex(item => item.type === 'cursed_axe');
  check(equip(p, itemIndex(), 'hand2') && p.equipment.hand2 === 'cursed_axe', 'Off-hand equip works from the normal backpack');
  check(unequip(p, 'hand2') && equip(p, itemIndex()), 'Axe moves back through the backpack and into the main hand');
  const restored = restoreSession(JSON.parse(JSON.stringify(saveSession(g))));
  check(restored.players[0].equipment.hand1 === 'cursed_axe' && restored.players[0].appearance.eyeColor === '#4e7b59', 'Axe and natural eye color round-trip through the expedition save');
  p.pickupTime = p.foundUnique = 0;
  const surface = (w,h) => Object.assign(document.createElement('canvas'), {width:w,height:h});
  const rig = (direction, props={}) => {
    const angle = direction * Math.PI / 4;
    return {...p, faceX:-Math.sin(angle), faceY:Math.cos(angle), ...props};
  };
  const draw = (actor,scale=4) => {
    const canvas = surface(96*scale,70*scale), c = canvas.getContext('2d');
    c.scale(scale,scale); c.translate(48,53); c.imageSmoothingEnabled = false;
    drawPlayer(c, actor, .12);
    return canvas;
  };
  const colorPixels = (canvas,color) => {
    const target = Number.parseInt(color.slice(1),16);
    const {data} = canvas.getContext('2d').getImageData(0,0,canvas.width,canvas.height);
    let total = 0;
    for (let i=0;i<data.length;i+=4) if (data[i+3] === 255 && (data[i]*65536+data[i+1]*256+data[i+2]) === target) total++;
    return total;
  };
  const paintedEyes = canvas => colorPixels(canvas,'#dc6b66') + colorPixels(canvas,ITEMS.cursed_axe.curseEyeColor) + colorPixels(canvas,'#902e39');
  const board = surface(768,398), bc = board.getContext('2d');
  bc.fillStyle='#182629';bc.fillRect(0,0,768,398);bc.font='15px system-ui';bc.textAlign='center';bc.imageSmoothingEnabled=false;
  for(let d=0;d<8;d++){
    const actor=rig(d), frame=draw(actor), x=(d%4)*192, y=Math.floor(d/4)*154;
    bc.drawImage(frame,x,y,192,140);bc.fillStyle='#e2d9c7';bc.fillText(DIRECTIONS[d],x+96,y+138);
    check((paintedEyes(frame)>0)===[0,1,2,6,7].includes(d), `${DIRECTIONS[d]} shows the curse only when the face is visible`);
  }
  check(!paintedEyes(draw(rig(0,{equipment:{}}))), 'Removing the axe restores the natural iris');
  check(!paintedEyes(draw(rig(0,{field:{cosmetics:{stow:true}}}))), 'Stowing the axe restores the natural iris');
  check(paintedEyes(draw(rig(0,{equipment:{hand2:'cursed_axe'}})))>0, 'Off-hand axe colors the visible eyes');
  check(!paintedEyes(draw(rig(0,{animationAction:'swim'}))), 'Swimming hides the held weapon and its curse');
  check(paintedEyes(draw(rig(0,{animationAction:'run', moving:true, field:{cosmetics:{stow:true}}})))>0, 'Moving with the weapon drawn restores the curse');
  check(paintedEyes(draw(rig(0,{animationAction:'swipe_big',attack:.2,playerFrame:5})))>0, 'The red eyes follow the face during a heavy swing');
  check(colorPixels(draw(rig(0,{equipment:{hand1:'cursed_axe',head:'ghost_hood'}})),ITEMS.cursed_axe.curseEyeColor)>0, 'The spectral hood keeps its eye opening and takes the held curse color');
  check(p.appearance.eyeColor==='#4e7b59', 'The renderer leaves the saved appearance alone');
  const boardPosition={x:p.x,y:p.y};
  Object.assign(p,{x:600,y:560,faceX:0,faceY:1,attackClip:'swipe_big'});
  const target={id:g.nextId++,kind:'skeleton_unarmed',sprite:'skeleton',x:p.x,y:p.y+52,hp:100,maxHp:100,speed:0,damage:0,faceX:0,faceY:-1};
  g.enemies.push(target);
  g.resolveMelee(p,0,{damage:1});
  check(target.hp<100, 'The equipped axe hits through the native melee resolution');
  g.enemies=[];
  Object.assign(p,boardPosition);
  drawItem(bc,'skeleton_long_axe',285,348,48);
  drawItem(bc,'cursed_axe',382,348,48);
  drawItem(bc,'cursed_axe',476,348,24);
  bc.fillStyle='#e2d9c7';bc.fillText('Long axe',285,386);bc.fillText('Cursed axe',382,386);bc.fillText('24px',476,386);
  images.rig = board.toDataURL();

  const canvas=surface(1000,680);
  canvas.style.cssText='position:fixed;inset:0;width:100%;height:100%;z-index:900;';
  document.body.append(canvas);
  const renderer=new Renderer(canvas,assets);
  renderer.camera={x:p.x,y:p.y-12,zoom:1.75};
  renderer.draw(g,0);
  images.world=canvas.toDataURL();
  const panelRoot=document.createElement('div');
  panelRoot.style.cssText='position:fixed;inset:0;z-index:1000;';
  document.body.append(panelRoot);
  const ui=new HeroUI(panelRoot);
  p.ui={panel:'gear',index:10,previewDirection:0};
  ui.draw(g,renderer);
  const slot=[...panelRoot.querySelectorAll('.equipment-window button')].find(button=>button.title.includes('Cursed Axe') || button.getAttribute('aria-label')?.includes('Cursed Axe'));
  const icon=slot?.querySelector('canvas'), portrait=panelRoot.querySelector('.equipment-preview');
  check(!!portrait && !!icon, 'Live equipment shows the icon in its occupied hand slot');
  images.equipment=portrait.toDataURL();
  images.icon=icon.toDataURL();
  return {checks,images};
}

app.whenReady().then(async () => {
  const win = new BrowserWindow({show:false,width:1000,height:680,webPreferences:{backgroundThrottling:false}});
  win.webContents.setAudioMuted(true);
  const errors=[];
  win.webContents.on('console-message', event => { if(event.level==='error')errors.push(event.message); });
  try {
    await win.loadFile(path.join(base,'index.html'));
    const {checks,images}=await win.webContents.executeJavaScript(`(${review.toString()})().catch(error => { throw Error(error.stack || String(error)); })`);
    fs.mkdirSync(out,{recursive:true});
    for(const [name,data] of Object.entries(images))fs.writeFileSync(path.join(out,name+'.png'),Buffer.from(data.split(',')[1],'base64'));
    const report={appPath:base,passed:checks.length,checks,errors,muted:win.webContents.isAudioMuted()};
    fs.writeFileSync(path.join(out,'report.json'),JSON.stringify(report,null,2));
    console.log(JSON.stringify(report));app.exit(errors.length?1:0);
  } catch(error){console.error(error);app.exit(1);}
});
