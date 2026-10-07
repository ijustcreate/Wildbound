// Actual Electron bird QA. Run with Node; only the QA child/profile is managed.
// WILDBOUND_VERIFY_APP may point to a source directory or resources/app.asar.
const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '..');
const base = path.resolve(process.env.WILDBOUND_VERIFY_APP || root);

if (!process.versions.electron) {
  const candidates = [process.env.WILDBOUND_QA_ELECTRON,
    path.join(root, 'test-output', 'electron-41.10.7', 'electron.exe'),
    path.join(root, 'node_modules', 'electron', 'dist', 'electron.exe')];
  const binary = candidates.find(p => p && fs.existsSync(p));
  if (!binary) throw Error('QA Electron missing; set WILDBOUND_QA_ELECTRON');
  const env = {...process.env};
  delete env.ELECTRON_RUN_AS_NODE;
  const child = require('node:child_process').spawnSync(binary, [__filename], {
    cwd: root, env, encoding: 'utf8', windowsHide: true, timeout: 120000,
    maxBuffer: 8 * 1024 * 1024,
  });
  if (child.stdout) process.stdout.write(child.stdout);
  if (child.stderr) process.stderr.write(child.stderr);
  if (child.error) console.error(child.error);
  process.exit(child.error ? 1 : child.status ?? 1);
}

const {app, BrowserWindow} = require('electron');
const outputRoot = path.join(root, 'test-output', 'graveyard-birds');
fs.mkdirSync(outputRoot, {recursive: true});
const out = fs.mkdtempSync(path.join(outputRoot, 'run-'));
const profile = path.join(out, 'profile');
app.setPath('userData', profile);
app.disableHardwareAcceleration();
const errors = [];
let finished = false;
const identityFiles = ['src/raven.mjs','src/raven-art.mjs','src/animation.mjs','src/core.mjs','src/render.mjs'];
const fingerprint = () => Object.fromEntries(identityFiles.map(file => {
  try {return [file,require('node:crypto').createHash('sha256').update(fs.readFileSync(path.join(base,file))).digest('hex')];}
  catch {return [file,null];}
}));
const loadedSource = fingerprint();

function finish(result, exitCode) {
  if (finished) return;
  finished = true;
  const screenshots = [];
  for (const [name, picture] of Object.entries(result.pictures || {})) {
    const file = path.join(out, name + '.png');
    fs.writeFileSync(file, Buffer.from(picture.data.split(',')[1], 'base64'));
    screenshots.push({name, file, width: picture.width, height: picture.height, kind: picture.kind});
  }
  delete result.pictures;
  result.checks ||= [];
  result.errors = [...new Set([...(result.errors || []), ...errors])];
  result.passed = result.checks.filter(c => c.passed).length;
  result.failed = result.checks.filter(c => !c.passed).length + result.errors.length;
  if (exitCode && !result.failed) result.failed = 1;
  Object.assign(result, {base, out, profile, screenshots, electron: process.versions.electron,
    hardwareAcceleration: false, sourceHashes:loadedSource,
    sourceChangedDuringRun:JSON.stringify(fingerprint())!==JSON.stringify(loadedSource),
    completedAt: new Date().toISOString()});
  fs.writeFileSync(path.join(out, 'report.json'), JSON.stringify(result, null, 2));
  // A small latest pointer preserves all preceding screenshots and profiles.
  fs.writeFileSync(path.join(outputRoot, 'latest.json'), JSON.stringify({out, report: path.join(out, 'report.json'), passed: result.passed, failed: result.failed}, null, 2));
  console.log(JSON.stringify(result, null, 2));
  app.exit(exitCode || result.failed ? 1 : 0);
}

const deadline = setTimeout(() => {
  errors.push('QA exceeded its 110-second deadline');
  finish({checks: [], errors: []}, 1);
}, 110000);

app.whenReady().then(async () => {
  const win = new BrowserWindow({show: false, width: 1280, height: 900, useContentSize: true,
    webPreferences: {offscreen: true, backgroundThrottling: false}});
  win.webContents.setAudioMuted(true);
  win.webContents.on('console-message', event => {
    if (event.level === 'error' || event.level === 3) errors.push(event.message);
  });
  win.webContents.on('render-process-gone', (_, details) => errors.push('Renderer exited: ' + JSON.stringify(details)));
  const run = code => win.webContents.executeJavaScript(code);
  try {
    await win.loadFile(path.join(base, 'index.html'), {query: {tools: '1'}});
    await run(`(async()=>{
      window.__birdErrors=[];
      window.addEventListener('error',e=>window.__birdErrors.push(e.error?.stack||e.message));
      window.addEventListener('unhandledrejection',e=>window.__birdErrors.push(String(e.reason?.stack||e.reason)));
      await window.wildboundBoot.ready;
      const raf=requestAnimationFrame.bind(window);window.requestAnimationFrame=()=>0;
      await new Promise(raf);
    })()`);
    const result = await run('(' + verifyBirds.toString() + ')()');
    // Also capture Chromium's composed page, not just exported canvas pixels.
    await new Promise(resolve => setTimeout(resolve, 120));
    const composed = await win.webContents.capturePage();
    result.pictures['electron-composited'] = {data: composed.toDataURL(), ...composed.getSize(), kind: 'Chromium page capture'};
    result.errors.push(...await run('window.__birdErrors || []'));
    clearTimeout(deadline);
    finish(result, 0);
  } catch (e) {
    errors.push(e.stack || String(e));
    const partial = await run('window.__result || {checks:[],errors:[],pictures:{}}').catch(() => ({checks: [], errors: []}));
    clearTimeout(deadline);
    finish(partial, 1);
  }
}).catch(e => {errors.push(e.stack || String(e));clearTimeout(deadline);finish({checks: []}, 1);});

// This function is sent verbatim to the real renderer; no mocked Canvas/Game.
async function verifyBirds() {
  const result = window.__result = {checks: [], errors: [], pictures: {}, timings: {}, routes: [],
    observedPhases: [], limits: {livingBirds: 48, normalFlock: 3, murderFlock: 6,
      failedRoutesPerBird: 8, routePoints: 129, primitiveMarksPerPose: 5000,
      timingScope: 'Software offscreen Electron CPU timings; no hardware FPS claim'}};
  const check = (name, passed, detail) => result.checks.push({name, passed: !!passed, ...(detail === undefined ? {} : {detail})});
  const section = async (name, fn) => {
    try {await fn();} catch (e) {check(name, false, e.stack || String(e));}
  };
  const clone = value => JSON.parse(JSON.stringify(value));
  const isBird = e => ['raven', 'crow'].includes(e.kind);
  const liveBirds = g => g.enemies.filter(e => isBird(e) && e.hp > 0);
  const stats = samples => {
    const sorted = [...samples].sort((a,b) => a-b);
    return {samples: sorted.length, meanMs: samples.reduce((a,b)=>a+b,0)/Math.max(1,samples.length),
      p95Ms: sorted[Math.min(sorted.length-1,Math.floor(sorted.length*.95))] || 0, maxMs: sorted.at(-1) || 0};
  };
  const picture = (name, canvas, kind) => {
    result.pictures[name] = {data: canvas.toDataURL('image/png'), width: canvas.width, height: canvas.height, kind};
  };
  const [{Game, EVENTS}, {Assets}, {Renderer}, {Animator}, birdAPI, art, {structureBlocked}, {canSee}, session] = await Promise.all([
    import('./src/core.mjs'), import('./src/assets.mjs'), import('./src/render.mjs'), import('./src/animation.mjs'),
    import('./src/raven.mjs'), import('./src/raven-art.mjs'), import('./src/expansion.mjs'),
    import('./src/adventure.mjs'), import('./src/session.mjs'),
  ]);
  const assets = new Assets();
  await assets.load();
  const animator = new Animator(assets);
  const canvas = document.createElement('canvas');
  canvas.style.cssText = 'position:fixed;left:0;top:0;width:1280px;height:900px;z-index:2147483647';
  document.body.append(canvas);
  const renderer = new Renderer(canvas, assets);
  const renderTimes = [], tickTimes = [];
  const step = (g, count, callback) => {
    for (let i=0;i<count;i++) {
      const start = performance.now();g.update(.05, {});tickTimes.push(performance.now()-start);
      callback?.(i);
    }
  };
  const setup = (environment = 'forest', start = false) => {
    const g = new Game(() => .42);g.environment = environment;
    const p = g.addPlayer('keyboard', 'Bird QA');
    if (start) g.start();
    else {
      Object.assign(g, {generatedEnvironment: environment, phase: 'play', house: null, scenery: [],
        forestLandscape: null, graveyard: null, enemies: [], loot: [], pickups: [], portals: [], ghosts: []});
      g.terrain.fill('grass');
    }
    Object.assign(g, {openingBoard: false, bloom: 3, event: null, reveal: null, time: 15});
    g.sky = {elapsed: 15, days: 0, phase: 'day'};
    g.explored = new Set(Array.from({length: 2500}, (_,i)=>i));
    Object.assign(p, {x:1500,y:1500,hp:100,maxHp:100,consumeInput:false,previousInput:{},ui:null});
    return {g,p};
  };
  const focus = birds => {
    const left = Math.min(...birds.map(e=>e.x)), right = Math.max(...birds.map(e=>e.x));
    const top = Math.min(...birds.map(e=>e.y-(e.raven?.height || 0)-45)), bottom = Math.max(...birds.map(e=>e.y));
    return {x:(left+right)/2,y:(top+bottom)/2,zoom:Math.min(2.2,600/(right-left+180),410/(bottom-top+120))};
  };
  const world = (name, g, camera, kind = 'Actual Game/Renderer snapshot') => {
    renderer.camera = camera;
    const seen = new Set(), original = renderer.animator.draw;
    renderer.animator.draw = function(c,e,...args) {if (isBird(e)) seen.add(e.id);return original.call(this,c,e,...args);};
    const start = performance.now();
    try {renderer.draw(g,0);} finally {renderer.animator.draw = original;}
    renderTimes.push(performance.now()-start);
    picture(name,canvas,kind);
    return seen;
  };

  await section('actual graveyard initial group and full Renderer', () => {
    const {g,p} = setup('graveyard',true), birds = liveBirds(g);
    check('Game.start seeds exactly three normal ravens',birds.length===3 && birds.every(e=>e.kind==='raven'&&!e.raven.flock.murder));
    if (!birds.length) throw Error('No initial graveyard birds');
    const midX = birds.reduce((sum,e)=>sum+e.x,0)/birds.length, midY = birds.reduce((sum,e)=>sum+e.y,0)/birds.length;
    Object.assign(p,{x:midX+200,y:midY});
    check('All three initial ravens are visible to the actual party',birds.every(e=>canSee(g,e)));
    const seen = world('graveyard-three-ravens',g,focus(birds));
    check('Full graveyard Renderer calls Animator for all three custom bird actors',birds.every(e=>seen.has(e.id)),{actorIds:[...seen]});
    check('Initial perches use native tree/stone/roof anchors',birds.every(e=>e.raven.phase==='perch'&&e.raven.perch&&e.raven.height===e.raven.perch.height));
    picture('perched',canvas,'Actual initial Game.start perches');
    // A controlled ground placement, followed by genuine Game.update AI phases.
    for (const [i,e] of birds.entries()) {
      Object.assign(e,{x:740+i*60,y:1040,aggro:false,state:'idle'});
      Object.assign(e.raven,{phase:'perch',phaseTime:0,height:0,route:null,
        perch:{x:e.x,y:e.y,height:0,kind:'ground',key:null}});
    }
    Object.assign(p,{x:800,y:1120});
    world('grounded',g,focus(birds),'Controlled grounded placement through actual Renderer');
    const observed = new Set(), captured = new Set();
    step(g,110,()=>{
      for (const e of birds) {
        const phase=e.raven.phase;observed.add(phase);
        if (['wing_open','takeoff','fly','attack','recover'].includes(phase)&&!captured.has(phase)) {
          captured.add(phase);world(phase==='fly'?'flying':phase,g,focus(birds),'Observed Game.update phase');
        }
      }
    });
    result.observedPhases=[...observed];
    check('Integrated Game.update opens wings, takes off, flies, attacks and recovers',
      ['wing_open','takeoff','fly','attack','recover'].every(phase=>observed.has(phase)),result.observedPhases);
    check('Observed pecks damage the actual player',p.hp<100,{remainingHp:p.hp});
    // Observe disengagement/landing using the actual hidden-target game path.
    // Restore an observer only while drawing so sight culling doesn't erase QA.
    p.room='bird-qa-hidden';
    let landed=false;
    step(g,360,()=>{
      if(!landed && birds.some(e=>e.raven.phase==='landing')) {
        landed=true;
        const position={x:p.x,y:p.y,room:p.room};
        const e=birds.find(e=>e.raven.phase==='landing');
        Object.assign(p,{x:e.x+200,y:e.y,room:null});
        world('landing',g,focus(birds),'Observed Game.update landing; observer restored for capture only');
        Object.assign(p,position);
      }
    });
    check('Player disengagement produces an actual landing phase',landed);
    if(landed)result.observedPhases.push('landing');
    result.initialBirds=birds.map(e=>({id:e.id,kind:e.kind,flockId:e.raven.flock.id}));
  });

  await section('actual Animator native pixel poses', () => {
    const {g}=setup(), source=birdAPI.spawnRavenFlock(g,{x:500,y:500,count:3})[0];
    const sheet=document.createElement('canvas');sheet.width=1280;sheet.height=1050;
    const c=sheet.getContext('2d');c.imageSmoothingEnabled=false;c.fillStyle='#34413e';c.fillRect(0,0,sheet.width,sheet.height);
    c.fillStyle='#e7dec0';c.font='bold 22px monospace';c.fillText('RAVENS / ACTUAL ANIMATOR / NATIVE PIXEL POSES',20,30);
    const phases=['idle','perch','wing_open','takeoff','fly','flap','attack','landing','death'];
    const probe=document.createElement('canvas');probe.width=probe.height=160;
    const expected=document.createElement('canvas');expected.width=expected.height=160;
    const pc=probe.getContext('2d'),ec=expected.getContext('2d');
    const nativeFill=pc.fillRect.bind(pc),nativeImage=pc.drawImage.bind(pc);
    let marks=0,images=0,maxMarks=0,opaque=0,sheen=0;
    pc.fillRect=(...args)=>{marks++;return nativeFill(...args);};
    pc.drawImage=(...args)=>{images++;return nativeImage(...args);};
    const hashes=new Set(),poseTimes=[];
    const hash = bytes => {let n=2166136261;for(let i=0;i<bytes.length;i++)n=Math.imul(n^bytes[i],16777619);return n>>>0;};
    for(const [row,phase] of phases.entries()) {
      c.fillStyle='#e7dec0';c.font='14px monospace';c.fillText(phase,12,100+row*100);
      for(let d=0;d<8;d++) {
        const e=clone(source);Object.assign(e,{hp:phase==='death'?0:36,x:80,y:116,faceX:-Math.sin(d*Math.PI/4),faceY:Math.cos(d*Math.PI/4),sprite:'bat'});
        Object.assign(e.raven,{phase,phaseTime:.18,height:phase==='perch'?35:24});
        pc.clearRect(0,0,160,160);ec.clearRect(0,0,160,160);marks=0;
        const before=JSON.stringify(e),start=performance.now();animator.draw(pc,e,.2,48);poseTimes.push(performance.now()-start);
        art.drawRaven(ec,e,.2,48);
        const pixels=pc.getImageData(0,0,160,160).data,reference=ec.getImageData(0,0,160,160).data;
        check('Custom Animator path matches raven art: '+phase+' / direction '+d,hash(pixels)===hash(reference)&&JSON.stringify(e)===before);
        hashes.add(hash(pixels));maxMarks=Math.max(maxMarks,marks);
        for(let i=0;i<pixels.length;i+=4)if(pixels[i+3]>100){opaque++;if(pixels[i+2]>pixels[i]&&pixels[i+1]>25)sheen++;}
        animator.draw(c,{...e,x:190+d*140,y:120+row*100},.2,68);
      }
    }
    picture('animator-phase-sheet',sheet,'Controlled phase/direction snapshots; actual Animator and Canvas');
    const flapHashes=new Set();
    for(let frame=0;frame<6;frame++) {
      const e=clone(source);Object.assign(e,{x:80,y:116,faceX:0,faceY:1});
      Object.assign(e.raven,{phase:'fly',height:24});pc.clearRect(0,0,160,160);
      animator.draw(pc,e,frame/12,48);flapHashes.add(hash(pc.getImageData(0,0,160,160).data));
    }
    check('Real Animator flaps change over consecutive flight samples',flapHashes.size>=3,{distinctFlapFrames:flapHashes.size});
    check('Bird art has opaque body pixels and blue-grey feather sheen',opaque>1000&&sheen>200,{opaque,sheen});
    check('Eight directions and articulated poses yield distinct native frames',hashes.size>=50,{distinctFrames:hashes.size});
    check('Native bird poses use no drawImage and bounded pixel marks',images===0&&maxMarks<=5000,{drawImageCalls:images,maxMarks});
    result.timings.animatorPose=stats(poseTimes);result.maxPixelMarksPerPose=maxMarks;
  });

  await section('integrated replenishment, carry/death loot and save/reload', () => {
    const {g}=setup(), birds=birdAPI.spawnRavenFlock(g,{x:400,y:500});
    birds[1].hp=birds[2].hp=0;step(g,1199);
    check('Idle survivor does not replenish before sixty seconds',liveBirds(g).length===1);
    step(g,2);check('Actual Game.update replenishes one survivor to three',liveBirds(g).length===3);
    const lead=liveBirds(g)[0];Object.assign(lead.raven,{phase:'fly',phaseTime:1,height:24});
    const item={id:g.nextId++,type:'moon_boomerang',qty:2,x:lead.x+8,y:lead.y,sockets:['moon_prism'],manualPickup:true};
    g.loot=[item];step(g,1);
    const carrier=liveBirds(g).find(e=>e.raven.carrying?.id===item.id);
    check('Integrated idle flight picks up the original rare stack',!!carrier&&!g.loot.some(l=>l.id===item.id));
    if(!carrier)throw Error('No loot carrier');
    const saved=session.restoreSession(JSON.parse(JSON.stringify(session.saveSession(g))));
    check('Real expedition save/reload retains flock and carried sockets',saved.enemies.find(e=>e.id===carrier.id)?.raven.carrying?.sockets?.[0]==='moon_prism');
    carrier.hp=0;step(g,1);g.enemyLoot(carrier);
    const recovered=g.loot.filter(l=>l.type==='moon_boomerang');
    check('Actual death/enemyLoot recovers the full socketed stack exactly once',recovered.length===1&&recovered[0].qty===2&&recovered[0].sockets?.[0]==='moon_prism'&&carrier.raven.lootDropped);
  });

  await section('integrated murder event and continuous timeout', () => {
    const {g,p}=setup('graveyard',true);g.enemies=[];
    const index=EVENTS.findIndex(e=>e.type==='murder_of_crows');
    if(index<0)throw Error('Murder event missing');
    g.spawnEvent(index);
    check('Actual murder event spawns exactly six hunting crows',g.eventSpawnCount===6&&liveBirds(g).length===6&&liveBirds(g).every(e=>e.kind==='crow'&&e.raven.flock.murder));
    step(g,40);
    check('Reachable player keeps murder aggression active',liveBirds(g).every(e=>e.raven.flock.murder&&e.raven.flock.unreachableFor===0));
    // Room-hidden players are intentionally unavailable to the surface flock.
    p.room='bird-qa-hidden';step(g,580);
    check('Twenty-nine unavailable seconds do not end murder',liveBirds(g).every(e=>e.raven.flock.murder));
    step(g,22);
    check('Thirty continuously unavailable seconds restore ordinary crow behavior',liveBirds(g).every(e=>!e.raven.flock.murder));
  });

  await section('actual house collision routes', () => {
    for(const mode of ['open-door','closed-door','broken-window','intact-window','intact-wall','offset-open-door']) {
      const {g,p}=setup('house'),offset=mode==='offset-open-door',top=offset?294:465,bottom=offset?366:535;
      const opening={x:440,y:top,w:12,h:bottom-top};
      const walls=[{x:440,y:24,w:12,h:top-24,kind:'wall'},{x:440,y:bottom,w:12,h:1576-bottom,kind:'wall'}],doors=[];
      if(mode.includes('door'))doors.push({...opening,open:mode!=='closed-door'});
      else walls.push({...opening,kind:mode==='intact-wall'?'wall':'window',broken:mode==='broken-window'});
      g.house={floors:[{x:452,y:300,w:300,h:420}],paths:[],pools:[],trees:[],rooms:[],furniture:[],walls,doors};
      Object.assign(p,{x:550,y:500});
      const e=birdAPI.spawnRavenFlock(g,{count:1,x:390,y:500,aggroRange:300,disengageRange:900})[0];
      if(!e)throw Error('No house-route bird: '+mode);
      Object.assign(e.raven,{phase:'fly',phaseTime:1,height:24});
      let blockedCalls=0,penetrations=0,crossedOpening=false;
      const realBlocked=g.blocked.bind(g),before=JSON.stringify({walls,doors}),times=[];
      g.blocked=(...args)=>{blockedCalls++;return realBlocked(...args);};
      const start=performance.now();
      step(g,200,()=>{
        if(structureBlocked(g,e.x,e.y,6,false,0,Math.max(16,e.raven.height),false,e))penetrations++;
        if(e.x>=434&&e.x<=458&&e.y>=top+6&&e.y<=bottom-6)crossedOpening=true;
        const last=tickTimes.at(-1);times.push(last);
      });
      const allowed=['open-door','broken-window','offset-open-door'].includes(mode);
      check(mode+' real Game.update obeys structure collision',penetrations===0&&(allowed?e.x>452&&p.hp<100:e.x<434&&p.hp===100),{x:e.x,y:e.y,hp:p.hp,penetrations});
      check(mode+' never opens a closed door or breaks intact glass',before===JSON.stringify({walls,doors}));
      if(offset)check('Offset door is found by actual navigation',crossedOpening);
      check(mode+' navigation metadata stays bounded',(!e.raven.route||e.raven.route.path.length<=129)&&e.raven.failedRoutes.length<=8);
      result.routes.push({mode,allowed,blockedCalls,elapsedMs:performance.now()-start,tick:stats(times),end:{x:e.x,y:e.y},penetrations});
      world('route-'+mode,g,{x:455,y:offset?425:500,zoom:1.65});
    }
  });

  await section('world flock cap', () => {
    const {g}=setup();for(let i=0;i<20;i++)birdAPI.spawnRavenFlock(g,{x:400,y:500,murder:true});
    check('Living birds remain globally capped at forty-eight',liveBirds(g).length===48&&birdAPI.spawnRavenFlock(g,{x:400,y:500}).length===0);
  });
  result.timings.gameUpdate=stats(tickTimes);
  result.timings.renderer=stats(renderTimes);
  const density=Math.min(2,window.devicePixelRatio||1);
  result.limits.rendererSurface={cssWidth:1280,cssHeight:900,cappedDensity:density,maxWidth:Math.round(1280*density),maxHeight:Math.round(900*density)};
  check('Renderer surface obeys the viewport and capped display density',
    canvas.width<=result.limits.rendererSurface.maxWidth&&canvas.height<=result.limits.rendererSurface.maxHeight,
    {width:canvas.width,height:canvas.height,devicePixelRatio:window.devicePixelRatio});
  // The final native sheet is visible in the composed page capture.
  const phaseSheet=result.pictures['animator-phase-sheet'];
  if(phaseSheet) {
    const image=new Image();image.src=phaseSheet.data;await image.decode();
    const c=canvas.getContext('2d');c.setTransform(1,0,0,1,0,0);c.clearRect(0,0,canvas.width,canvas.height);
    c.imageSmoothingEnabled=false;c.drawImage(image,0,0,canvas.width,canvas.height);
  }
  return result;
}
