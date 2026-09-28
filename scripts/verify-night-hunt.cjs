// Run: .\node_modules\.bin\electron.cmd scripts/verify-night-hunt.cjs
// If the npm shim lacks its binary, use the installed node_modules/.pnpm/electron@*/node_modules/electron/dist/electron.exe.
// Own Electron process, fresh profile, no desktop preload or project-writing IPC.
const { app, BrowserWindow } = require('electron');
const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '..');
// Optional archive path verifies the actual packaged renderer, not just source.
const appRoot = process.argv[2] ? path.resolve(process.argv[2]) : root;
const output = path.join(root, 'test-output');
fs.mkdirSync(output, { recursive: true });
const profile = fs.mkdtempSync(path.join(output, 'night-hunt-profile-'));
app.setPath('userData', profile);
app.disableHardwareAcceleration();
app.commandLine.appendSwitch('disable-renderer-backgrounding');
app.commandLine.appendSwitch('disable-background-timer-throttling');
app.commandLine.appendSwitch('force-device-scale-factor', '1');
const report = { profile, screenshots: [], checks: {}, consoleErrors: [], warnings: [] };
let finished = false;
function finish(code, error) {
  if (finished) return;
  finished = true;
  if (error) report.error = String(error.stack || error);
  report.ok = code === 0;
  fs.writeFileSync(path.join(output, 'night-hunt-report.json'), JSON.stringify(report, null, 2));
  console.log(JSON.stringify(report, null, 2));
  app.exit(code); // Exits only this dedicated harness process, never the user's game.
}
const watchdog = setTimeout(() => finish(1, Error('Night Hunt QA exceeded 120 seconds')), 120000);
watchdog.unref();

async function browserSetup() {
  const [{ Game, EVENTS }, { Renderer }, { Assets }, { Animator }, rigs, subjects, eco, night, enemies, definitions, { ITEMS }, { RigStudio }, { generateWorld }] = await Promise.all([
    import('./src/core.mjs'), import('./src/render.mjs'), import('./src/assets.mjs'), import('./src/animation.mjs'),
    import('./src/night-rigs.mjs'), import('./src/rig-subjects.mjs'), import('./src/living-ecosystem.mjs'),
    import('./src/night-cycle.mjs'), import('./src/night-enemies.mjs'), import('./src/definitions.mjs'),
    import('./src/items.mjs'), import('./src/player-studio.mjs'), import('./src/world.mjs'),
  ]);
  const assert = (condition, message) => { if (!condition) throw Error(message); };
  const assets = new Assets(); await assets.load();
  assert(Object.keys(assets.library).length > 0, 'Asset library is empty');
  const overlay = document.createElement('div');
  overlay.id = 'night-hunt-qa';
  overlay.style.cssText = 'position:fixed;inset:0;z-index:2147483647;background:#142d28;color:#f2e7c9;overflow:auto;font:16px monospace';
  document.body.append(overlay);
  function heading(title, subtitle) {
    overlay.replaceChildren();
    const h = document.createElement('div');
    h.style.cssText = 'height:70px;box-sizing:border-box;padding:12px 22px;background:#10231f';
    const strong = document.createElement('strong'); strong.textContent = title;
    const sub = document.createElement('div'); sub.textContent = subtitle;sub.style.cssText='font-size:12px;margin-top:7px;color:#b4cab7';
    h.append(strong,sub);overlay.append(h);
  }
  function canvas() {
    const c = document.createElement('canvas'); c.width=1440;c.height=890;
    c.style.cssText='display:block;width:1440px;height:890px;image-rendering:pixelated';overlay.append(c);return c;
  }
  function game(environment) {
    const g = new Game(() => .237); g.environment=environment;g.generatedEnvironment=environment;
    Object.assign(g,generateWorld(g.seed,environment));
    const p=g.addPlayer('keyboard','QA Explorer');g.start();
    g.openingBoard=false;g.spriteLibrary=assets.library;g.time=32;g.sky={elapsed:100,days:0,phase:'day'};
    g.explored=new Set(Array.from({length:2500},(_,i)=>i));
    eco.initLivingEcosystem(g);return g;
  }
  function drawWorld(c,g,x,y,zoom=1) {
    const renderer=new Renderer(c,assets);renderer.camera={x,y,zoom};
    const ctx=renderer.ctx,save=ctx.save.bind(ctx),restore=ctx.restore.bind(ctx);
    let depth=0,minDepth=0,maxDepth=0;
    ctx.save=()=>{depth++;maxDepth=Math.max(maxDepth,depth);save();};
    ctx.restore=()=>{depth--;minDepth=Math.min(minDepth,depth);restore();};
    try {renderer.draw(g,0);} finally {ctx.save=save;ctx.restore=restore;}
    assert(depth===0&&minDepth===0,`Canvas save/restore imbalance: final=${depth}, minimum=${minDepth}`);
    return {finalDepth:depth,minDepth,maxDepth};
  }
  window.nightHuntQA = {
    async forest() {
      heading('NIGHT HUNT · FOREST PLAY SCENE','Real Game + Renderer · lantern and torch · new enemies · keyboard movement smoke check');
      const c=canvas(),g=game('forest'),p=g.players[0];
      // Deliberate staging: a small clearing gives the lineup readable sight lines.
      g.scenery=g.scenery.filter(s=>Math.hypot(s.x-650,s.y-560)>230);
      for(let ty=11;ty<=24;ty++)for(let tx=13;tx<=27;tx++)g.terrain[ty*50+tx]='grass';
      Object.assign(p,{x:650,y:560,faceX:1,faceY:0,equipment:{hand1:'lantern',hand2:'torch'},invuln:100});
      g.sky={elapsed:360,days:0,phase:'night'};
      g.firePatches=[{x:700,y:585,life:20,damage:0}];
      g.enemies=enemies.NIGHT_EVENTS.filter(e=>!rigs.STAMPEDE_KINDS.includes(e.kind)).map((event,i)=>{
        const angle=i*Math.PI*2/7;
        return {...event,id:100+i,x:650+Math.cos(angle)*105,y:560+Math.sin(angle)*90,maxHp:event.hp,
          faceX:-Math.cos(angle),faceY:-Math.sin(angle),cooldown:2,state:'hunt',moving:true,flash:event.kind==='night_stalker'?.3:0};
      });
      const start={x:p.x,y:p.y};
      for(let i=0;i<6;i++)g.update(1/60,{keyboard:{x:1,y:0}});
      assert(Math.hypot(p.x-start.x,p.y-start.y)>0,'Game.update keyboard movement did not move player');
      assert(g.enemies.every(e=>e.night),'New enemies did not initialize their AI');
      assert(night.timeOfDay(g)==='night'&&night.lightSources(g).length>=2,'Night/light sources missing');
      assert(night.lightAt(g,p) > night.lightAt(g,{x:1500,y:1500}),'Carried light does not illuminate player');
      const canvasStack=drawWorld(c,g,650,560,1.65);
      return {enemyKinds:g.enemies.map(e=>e.kind),lightSources:night.lightSources(g).length,moved:Math.hypot(p.x-start.x,p.y-start.y),canvasStack};
    },
    async lineup() {
      heading('DAYLIGHT · NEW RIG LINEUP','All ten registered rigs through Animator · independent transparent-pixel checks');
      const c=canvas(),ctx=c.getContext('2d'),animator=new Animator(assets);
      ctx.imageSmoothingEnabled=false;ctx.fillStyle='#c6d3b0';ctx.fillRect(0,0,c.width,c.height);
      const counts={},signatures=new Set();
      rigs.NIGHT_KINDS.forEach((kind,i)=>{
        assert(subjects.RIG_SUBJECTS[kind],`Rig picker registration missing: ${kind}`);
        const surface=document.createElement('canvas');surface.width=256;surface.height=280;
        const cc=surface.getContext('2d');cc.imageSmoothingEnabled=false;
        animator.draw(cc,{kind,x:128,y:185,faceX:1,faceY:.5,hp:100,moving:true,playerFrame:2},1,120);
        const pixels=cc.getImageData(0,0,256,280).data;let count=0,hash=2166136261;
        for(let n=0;n<pixels.length;n++){hash=Math.imul(hash^pixels[n],16777619);if(n%4===3&&pixels[n])count++;}
        assert(count>100,`Rig did not paint enough pixels: ${kind}`);counts[kind]=count;signatures.add(hash);
        const x=12+i%5*286,y=10+Math.floor(i/5)*435;
        ctx.fillStyle=i%2?'#b7c7a2':'#bdcdab';ctx.fillRect(x,y,274,420);
        ctx.drawImage(surface,x+9,y+30);ctx.fillStyle='#203c31';ctx.font='16px monospace';
        ctx.fillText(kind.replaceAll('_',' '),x+10,y+344);
        ctx.font='12px monospace';ctx.fillText(`${Object.keys(rigs.nightMotions[kind].clips).length} editable clips`,x+10,y+370);
      });
      assert(signatures.size===rigs.NIGHT_KINDS.length,'Two new rigs painted identical output');
      return counts;
    },
    async ice() {
      heading('ICE · WHITE MICE AND FAIRIES','Real ice world · ambient fauna · six-times world-space detail insets');
      const c=canvas(),g=game('ice'),animals=eco.livingAnimals(g);
      const mouse=animals.find(a=>a.kind==='white_mouse'),fairy=animals.find(a=>a.kind==='fairy');
      assert(mouse&&fairy,'Ice mice/fairies were not populated');
      Object.assign(g.players[0],{x:mouse.x+25,y:mouse.y+20});
      eco.updateLivingEcosystem(g,.1);const canvasStack=drawWorld(c,g,mouse.x,mouse.y,1.3);
      const ctx=c.getContext('2d');
      for(const [i,a] of [mouse,fairy].entries()) {
        const x=14+i*195,y=c.height-128;
        ctx.save();ctx.fillStyle='#cbdfe5';ctx.fillRect(x,y,180,115);ctx.beginPath();ctx.rect(x,y,180,115);ctx.clip();
        ctx.translate(x+90,y+76);ctx.scale(6,6);ctx.translate(-a.x,-a.y);
        eco.drawLivingEcosystem(ctx,g);ctx.restore();
        ctx.fillStyle='#243f50';ctx.font='9px monospace';ctx.textAlign='left';ctx.fillText(a.kind.replaceAll('_',' '),x+10,y+14);
      }
      return {population:animals.length,kinds:[...new Set(animals.map(a=>a.kind))],canvasStack};
    },
    async studio() {
      heading('RIG STUDIO · EDIT / SAVE / RELOAD','Every new subject selected through the real picker; saves use this QA profile only');
      const panel=document.createElement('div');panel.style.cssText='height:880px';overlay.append(panel);
      let saves=0;
      const studio=new RigStudio(async()=>{
        localStorage.setItem('wildbound-design',JSON.stringify(definitions.definitionPack(EVENTS,ITEMS)));saves++;
        return 'Saved to isolated Night Hunt QA profile';
      });
      studio.mount(panel);const expected={};
      for(const kind of rigs.NIGHT_KINDS) {
        const picker=panel.querySelector('.ps-subject');
        assert([...picker.options].some(o=>o.value===kind),`Studio picker missing ${kind}`);
        picker.value=kind;picker.dispatchEvent(new Event('change'));
        const input=panel.querySelector('[data-shape="headRadius"]');assert(input,`No shape editor for ${kind}`);
        expected[kind]=Number(input.value)+.5;input.value=expected[kind];input.dispatchEvent(new Event('change'));
        panel.querySelector('[data-do="save"]').click();await Promise.resolve();
        assert(rigs.nightMotions[kind].shape.headRadius===expected[kind],`Studio edit failed: ${kind}`);
      }
      assert(saves===rigs.NIGHT_KINDS.length,'Studio save callbacks missing');
      localStorage.setItem('night-hunt-expected',JSON.stringify(expected));
      return {savedSubjects:saves,expected};
    },
    verifyReload() {
      const expected=JSON.parse(localStorage.getItem('night-hunt-expected'));
      assert(expected,'Roundtrip expectations missing');
      for(const [kind,value] of Object.entries(expected))assert(rigs.nightMotions[kind].shape.headRadius===value,`App reload lost saved rig: ${kind}`);
      return {subjects:Object.keys(expected).length,reloadedThroughApp:true};
    },
  };
  return {assets:Object.keys(assets.library).length,rigs:rigs.NIGHT_KINDS.length};
}

app.whenReady().then(async()=>{
  const win=new BrowserWindow({show:false,width:1440,height:960,useContentSize:true,
    webPreferences:{offscreen:true,contextIsolation:true,nodeIntegration:false,backgroundThrottling:false}});
  win.webContents.on('console-message',(_event,level,message)=>{
    const detail=typeof level==='object'?level:_event;
    const severity=typeof level==='number'?level:detail.level;
    const text=typeof message==='string'?message:detail.message;
    if(severity===3||severity==='error')report.consoleErrors.push(text);
    else if(severity===2||severity==='warning')report.warnings.push(text);
  });
  win.webContents.on('render-process-gone',(_event,details)=>finish(1,Error(JSON.stringify(details))));
  const evaluate=code=>win.webContents.executeJavaScript(code,true);
  async function boot() {
    await win.loadFile(path.join(appRoot,'index.html'),{query:{tools:'1'}});
    await evaluate('window.wildboundBoot.ready');
    await evaluate(`window.__nightHuntErrors=[];window.addEventListener('error',e=>window.__nightHuntErrors.push(e.message));window.addEventListener('unhandledrejection',e=>window.__nightHuntErrors.push(String(e.reason?.stack||e.reason)))`);
    return evaluate(`(${browserSetup.toString()})()`);
  }
  async function capture(stage) {
    await evaluate('new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve)))');
    const viewport=await evaluate('({width:innerWidth,height:innerHeight})');
    if(viewport.width<1440||viewport.height<960)throw Error(`QA viewport clipped: ${JSON.stringify(viewport)}`);
    const file=path.join(output,`night-hunt-${stage}.png`);
    const image=await win.webContents.capturePage();
    if(image.isEmpty())throw Error(`Empty screenshot: ${stage}`);
    fs.writeFileSync(file,image.toPNG());report.screenshots.push(file);
  }
  try {
    report.checks.boot=await boot();
    for(const stage of ['forest','lineup','ice','studio']) {
      report.checks[stage]=await evaluate(`window.nightHuntQA.${stage}()`);
      await capture(stage);
    }
    report.consoleErrors.push(...await evaluate('window.__nightHuntErrors'));
    await boot();report.checks.roundtrip=await evaluate('window.nightHuntQA.verifyReload()');
    report.consoleErrors.push(...await evaluate('window.__nightHuntErrors'));
    if(report.consoleErrors.length)throw Error('Browser console/runtime errors; see report');
    finish(0);
  } catch(error) {finish(1,error);}
}).catch(error=>finish(1,error));
