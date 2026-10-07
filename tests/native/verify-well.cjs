// Run: node tests/native/verify-well.cjs
// Uses a unique hidden Electron/profile and never opens or changes player saves.
const fs = require('node:fs'), path = require('node:path');
const root = path.resolve(__dirname, '../..'), output = path.join(root, 'test-output');
fs.mkdirSync(output, {recursive: true});
if (!process.versions.electron) {
  const {spawnSync} = require('node:child_process');
  const dir = fs.mkdtempSync(path.join(output, 'well-qa-'));
  const candidates = [process.env.WILDBOUND_WELL_ELECTRON,
    path.join(root, 'node_modules/electron/dist/electron.exe'),
    path.join(output, 'electron-41.10.7/electron.exe')].filter(Boolean);
  const binary = candidates.find(file => fs.existsSync(file));
  if (!binary) throw Error('No local QA Electron available. Set WILDBOUND_WELL_ELECTRON.');
  const env = {...process.env, WILDBOUND_WELL_OUTPUT: dir}; delete env.ELECTRON_RUN_AS_NODE;
  const child = spawnSync(binary, [__filename], {cwd: root, env, windowsHide: true,
    encoding: 'utf8', timeout: 150000, maxBuffer: 8 * 1024 * 1024});
  process.stdout.write(child.stdout || ''); process.stderr.write(child.stderr || '');
  console.log('Well QA artifacts: ' + dir);
  if (child.error || child.status !== 0) {console.error(child.error || 'Well QA failed'); process.exitCode = 1;}
} else {
  const {app, BrowserWindow} = require('electron');
  const dir = process.env.WILDBOUND_WELL_OUTPUT || fs.mkdtempSync(path.join(output, 'well-qa-'));
  app.setPath('userData', fs.mkdtempSync(path.join(dir, 'profile-')));
  app.disableHardwareAcceleration();
  app.commandLine.appendSwitch('disable-renderer-backgrounding');
  const timer = setTimeout(() => {console.error('Well QA timeout'); app.exit(1);}, 140000);
  app.whenReady().then(async () => {
    const win = new BrowserWindow({show: false, width: 1100, height: 760, useContentSize: true,
      webPreferences: {offscreen: true}}), errors = [];
    win.webContents.on('render-process-gone', (_, detail) => errors.push(detail));
    const run = source => win.webContents.executeJavaScript('(async()=>{' + source + '})()');
    const shot = async name => {
      await run('await new Promise(window.wellQA.raf);await new Promise(window.wellQA.raf);');
      fs.writeFileSync(path.join(dir, name + '.png'), (await win.webContents.capturePage()).toPNG());
    };
    try {
      await win.loadFile(path.join(process.env.WILDBOUND_VERIFY_APP || root, 'index.html'), {query: {tools: '1'}});
      await run(`
        await window.wildboundBoot.ready;
        const raf = requestAnimationFrame.bind(window); window.requestAnimationFrame = () => 0;
        await new Promise(raf);
        window.addEventListener('error', e => window.wellQA?.errors.push(e.message));
        window.addEventListener('unhandledrejection', e => window.wellQA?.errors.push(String(e.reason)));
        const [{Game,EVENTS}, {Assets}, {Renderer}, {HeroUI}, well, session] = await Promise.all([
          import('./src/core.mjs'), import('./src/assets.mjs'), import('./src/render.mjs'),
          import('./src/hero-ui.mjs'), import('./src/old-well.mjs'), import('./src/session.mjs')]);
        const assets = new Assets(); await assets.load();
        const overlay = document.createElement('div');
        overlay.style.cssText = 'position:fixed;inset:0;z-index:2147483647;background:#101218;display:grid;place-items:center;color:#ead6ac;font:16px sans-serif';
        const canvas = document.createElement('canvas'); canvas.width = 960; canvas.height = 720;
        canvas.style.cssText = 'width:min(960px,95vw);height:auto;image-rendering:pixelated';
        overlay.append(canvas); document.body.append(overlay);
        const uiRoot=document.createElement('div');uiRoot.style.cssText='position:fixed;inset:0;z-index:2147483647;display:none';
        document.body.append(uiRoot);const heroUI=new HeroUI(uiRoot);
        const pen = canvas.getContext('2d'); pen.scale(3,3);
        const worldCanvas = document.createElement('canvas');
        worldCanvas.style.cssText = 'position:fixed;width:1100px;height:760px;left:0;top:0';
        document.body.append(worldCanvas);
        const renderer = new Renderer(worldCanvas, assets);
        const checks = []; const check = (name, result) => {checks.push({name, passed: !!result}); if (!result) throw Error(name);};
        const make = env => {
          const g = new Game(()=>.37);g.environment=env;g.seed=738;
          const p=g.addPlayer('keyboard','Well QA');g.start();g.openingBoard=false;
          g.explored=new Set(Array.from({length:2500},(_,i)=>i));
          g.spawnEvent(EVENTS.findIndex(e=>e.kind==='old_well'));
          const d=g.portals.find(d=>d.oldWell);check(env+' real spawnEvent surface spawn',!!d);
          Object.assign(p,{x:d.x,y:d.y+50,progress:19});return {g,p,d};
        };
        const outer = g => JSON.stringify({terrain:g.terrain,scenery:g.scenery,house:g.house,
          loot:g.loot,enemyIds:g.enemies.map(e=>e.id),seed:g.seed,turn:g.turn,round:g.round,progress:g.players.map(p=>p.progress)});
        const walk = (g,p,target) => {
          const s=well.wellForPlayer(g,p).well,w=s.width,start=Math.floor(p.roomY/16)*w+Math.floor(p.roomX/16),end=Math.floor(target.y/16)*w+Math.floor(target.x/16);
          const previous=new Map([[start,null]]),queue=[start];
          for(let i=0;i<queue.length&&!previous.has(end);i++){
            const n=queue[i],x=n%w,y=Math.floor(n/w);
            for(const [dx,dy]of [[1,0],[-1,0],[0,1],[0,-1]]){
              const nx=x+dx,ny=y+dy,next=ny*w+nx;
              if(nx>=0&&ny>=0&&nx<w&&ny<s.height&&s.tiles[next]&&!previous.has(next)){previous.set(next,n);queue.push(next);}
            }
          }
          check('reachable tunnel target',previous.has(end));
          const route=[];for(let n=end;n!=null;n=previous.get(n))route.unshift(n);
          for(const n of route){
            const x=n%w*16+8,y=Math.floor(n/w)*16+8;
            for(let i=0;Math.hypot(x-p.roomX,y-p.roomY)>1;i++){
              if(i>50)throw Error('Tunnel collision stalled');
              const dx=x-p.roomX,dy=y-p.roomY,len=Math.hypot(dx,dy);
              well.oldWellRoomStep(g,p,{x:dx/len,y:dy/len},Math.min(.05,len/78));p.previousInput={};
            }
          }
        };
        const render = () => {
          const {g,p}=window.wellQA;pen.clearRect(0,0,320,240);
          check('native room draw',well.drawOldWellRoom(pen,g,p,renderer.animator));
        };
        const showUI=()=>{const q=window.wellQA;uiRoot.style.display='block';heroUI.draw(q.g,renderer,q.p.id);};
        const hideUI=()=>{uiRoot.style.display='none';};
        window.wellQA={raf,Game,well,session,renderer,pen,canvas,worldCanvas,overlay,heroUI,uiRoot,showUI,hideUI,
          checks,check,make,outer,walk,render,errors:[],...make('forest')};
      `);
      await run(`
        const q=window.wellQA,{g,p,d,renderer,well,overlay,worldCanvas}=q;
        overlay.style.display='none';renderer.camera={x:d.x,y:d.y,zoom:1.6};renderer.draw(g,0);
        q.before=q.outer(g);q.anchor={x:p.x,y:p.y};
      `);
      await shot('forest-surface');
      await run(`const q=window.wellQA;q.overlay.style.display='grid';q.g.update(.05,{keyboard:{interact:true}});q.check('enter by main g.update investigate',q.p.room===q.d.id);q.before=q.outer(q.g);q.render();`);
      await shot('forest-shaft');
      for (const [name, room] of [['roots', 1], ['bats', 2], ['silk', 4], ['vault', 5]]) {
        await run(`const q=window.wellQA,r=q.d.well.rooms[${room}];q.walk(q.g,q.p,{x:(r.x+Math.floor(r.w/2))*16+8,y:(r.y+Math.floor(r.h/2))*16+8});q.g.time+=1.1;q.render();`);
        await shot('forest-' + name);
      }
      await run(`
        const q=window.wellQA,{g,p,d,well,check}=q;
        const bag=JSON.stringify(p.inventory);p.previousInput={};g.update(.05,{keyboard:{interact:true}});
        check('normal chest UI opens without transfer',p.ui?.storage==='old-well'&&bag===JSON.stringify(p.inventory));
        q.showUI();check('real chest UI title',q.uiRoot.querySelector('header').textContent.includes('Buried well treasure'));
        check('real chest UI item slots',q.uiRoot.querySelectorAll('.storage-slots [data-mode="chest"]').length===24);
        const slot=q.uiRoot.querySelector('[data-mode="chest"][data-index="0"]');slot.showItemTooltip();
        check('real item tooltip',q.uiRoot.querySelector('.item-tooltip strong').textContent==='Magic Essence');
        const box=slot.getBoundingClientRect();check('chest slots visibly laid out',box.width>0&&box.height>0&&box.left>=0&&box.top>=0&&box.right<=innerWidth&&box.bottom<=innerHeight);
      `);
      await shot('forest-chest-item-ui');
      await run(`
        const q=window.wellQA,{g,p,d,check}=q;
        g.update(.05,{keyboard:{use:true}});check('main update transfers selected slot',d.well.chest.items[0]===null);
        g.inventoryAction(p,'lootAll');
        check('one-time item-slot chest loot',!d.well.chest.items.some(Boolean));
        const bag=JSON.stringify(p.inventory);g.inventoryAction(p,'lootAll');check('no duplicate chest loot',bag===JSON.stringify(p.inventory));
        g.update(.05,{keyboard:{close:true}});q.hideUI();q.before=q.outer(g);q.render();
      `);
      await shot('forest-open-chest');
      await run(`
        const q=window.wellQA,{session,well,check}=q;
        const restored=session.restoreSession(JSON.parse(JSON.stringify(session.saveSession(q.g))));well.ensureOldWells(restored);
        const rp=restored.players[0],rd=well.wellForPlayer(restored,rp);
        check('save restore depleted chest',!rd.well.chest.items.some(Boolean));
        check('save restore tunnel exploration',JSON.stringify(rd.well.explored)===JSON.stringify(q.d.well.explored));
        q.walk(restored,rp,rd.well.exit);rp.previousInput={};restored.update(.05,{keyboard:{interact:true}});
        check('restore and rope exit',rp.room===null&&rp.x===q.anchor.x&&rp.y===q.anchor.y);
        check('board/world/loot/progress unchanged',q.outer(restored)===q.before);
        Object.assign(q,q.make('house'));q.before=q.outer(q.g);q.anchor={x:q.p.x,y:q.p.y};
        const partner=q.g.addPlayer('pad:0','Co-op QA');Object.assign(partner,{x:q.d.x+48,y:q.d.y});
        q.check('house enter',well.interactOldWell(q.g,q.p));q.check('co-op enter',well.enterOldWell(q.g,partner,q.d));
        q.partner=partner;q.walk(q.g,q.p,q.d.well.chest);q.walk(q.g,partner,q.d.well.chest);q.render();
      `);
      await shot('house-coop-vault');
      await run(`
        const q=window.wellQA,{g,p,d,partner,well,check}=q;
        p.inventory=Array.from({length:24},()=>({type:'sword',qty:1}));well.lootOldWellChest(g,p);g.inventoryAction(p,'use');
        check('full bag retains all treasure',d.well.chest.items.filter(Boolean).length===3);
        check('normal chest UI full-pack notice',/full/i.test(p.ui.notice));
        well.lootOldWellChest(g,partner);g.inventoryAction(partner,'lootAll');g.inventoryAction(partner,'close');
        check('partner can take shared treasure',!d.well.chest.items.some(Boolean));
        const room=partner.room;check('first co-op player exits',well.leaveOldWell(g,p));
        check('partner remains underground',partner.room===room&&g.portals.includes(d));
        q.healer=p;q.p=partner;q.render();
      `);
      await shot('house-partner-remains');
      await run(`
        const q=window.wellQA,{g,p,d,healer,check}=q;
        check('healer reenters through integrated enterRoom',g.enterRoom(healer,d));
        Object.assign(healer,{roomX:180,roomY:104,faceX:1,faceY:0,mana:100,previousInput:{}});
        Object.assign(p,{roomX:220,roomY:104,hp:20});
        healer.equipment.hand1=null;healer.equipment.hand2='healing_wand';healer.equipment.head='halo';p.equipment.head='halo';
        d.well.enemies.forEach(e=>{e.speed=0;e.cooldown=999;});const enemyHP=JSON.stringify(d.well.enemies.map(e=>e.hp));
        for(let n=0;n<24;n++)g.tickAdventure(.05,{keyboard:{attack:true,aimX:1,aimY:0}});
        check('healing holds charge until release',d.well.bolts.length===0&&healer.charge===1.2);
        g.tickAdventure(.05,{keyboard:{aimX:1,aimY:0}});
        check('selected offhand reaches healing helper',d.well.bolts.some(b=>b.healing&&b.slot==='hand2'&&b.healingAmount===45));
        for(let n=0;n<5;n++)g.tickAdventure(.05,{keyboard:{}});
        check('room-local charged healing hits ally',p.hp===76.25);
        check('healing never damages well enemies',JSON.stringify(d.well.enemies.map(e=>e.hp))===enemyHP);
        check('one tagged green healing number',g.effects.filter(f=>f.room===d.id&&f.text==='+56.25').length===1);
        check('one tagged lightblue healing rise',g.effects.filter(f=>f.room===d.id&&f.healingRise).length===1);
        q.render();
      `);
      await shot('house-healing-effects');
      const report = await run(`
        const q=window.wellQA;q.well.leaveOldWell(q.g,q.healer);q.check('last player exits safely',q.well.leaveOldWell(q.g,q.p));
        q.check('persistent portal after last exit',q.g.portals.includes(q.d)&&q.d.closing===null);
        const pixels=q.pen.getImageData(0,0,320*3,240*3).data,colors=new Set();
        for(let i=0;i<pixels.length;i+=4)colors.add(pixels[i]+','+pixels[i+1]+','+pixels[i+2]);
        q.check('native tunnel pixel art has detail',colors.size>35);
        return {checks:q.checks,failed:q.checks.filter(c=>!c.passed).length,rendererErrors:q.errors,pixelColors:colors.size,
          note:'Integrated spawnEvent, adventure input, real HeroUI item slots/tooltip, world renderer, restore and shared healing helpers.'};
      `);
      report.processErrors = errors;
      report.appPath = path.resolve(process.env.WILDBOUND_VERIFY_APP || root);
      fs.writeFileSync(path.join(dir, 'report.json'), JSON.stringify(report, null, 2));
      console.log(JSON.stringify({checks: report.checks.length, failed: report.failed,
        rendererErrors: report.rendererErrors, processErrors: errors, pixelColors: report.pixelColors}));
      clearTimeout(timer);app.exit(report.failed || report.rendererErrors.length || errors.length ? 1 : 0);
    } catch (error) {
      fs.writeFileSync(path.join(dir, 'failure.txt'), String(error.stack || error));
      console.error(error);clearTimeout(timer);app.exit(1);
    }
  });
}
