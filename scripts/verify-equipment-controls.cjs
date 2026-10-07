const fs=require('node:fs'),path=require('node:path'),root=path.resolve(__dirname,'..');
if(!process.versions.electron){const env={...process.env};delete env.ELECTRON_RUN_AS_NODE;const result=require('node:child_process').spawnSync(path.join(root,'node_modules/electron/dist/electron.exe'),[__filename],{cwd:root,env,windowsHide:true,stdio:'inherit',timeout:120000});process.exit(result.status??1);}
const {app,BrowserWindow}=require('electron'),base=process.env.WILDBOUND_VERIFY_APP||root;
if(base!==root){
  const asar=require('@electron/asar');
  if(!base.endsWith('app.asar'))throw Error('WILDBOUND_VERIFY_APP must be the packaged app.asar');
  for(const file of ['src/hero-ui.mjs','src/expansion.mjs','src/debug-tools.mjs','src/equipment-actions.mjs']){
    if(!fs.readFileSync(path.join(root,file)).equals(asar.extractFile(base,path.normalize(file))))throw Error('Packaged file differs from source: '+file);
  }
  const version=require(path.join(root,'package.json')).version,build=JSON.parse(fs.readFileSync(path.join(path.dirname(base),'..','wildbound-build.json')));
  if(build.version!==version||build.preview)throw Error('Packaged build identity mismatch');
}
const out=path.join(root,'test-output','equipment-controls-'+Date.now());
fs.mkdirSync(out,{recursive:true});app.setPath('userData',path.join(out,'profile'));app.disableHardwareAcceleration();
app.whenReady().then(async()=>{
  const w=new BrowserWindow({show:false,width:1280,height:850,useContentSize:true,webPreferences:{backgroundThrottling:false}}),errors=[];
  w.webContents.setAudioMuted(true);
  w.webContents.on('console-message',(_event,level,message)=>{if(typeof level==='object'){message=level.message;level=level.level;}if(level===3||level==='error')errors.push(message);});
  const run=s=>w.webContents.executeJavaScript(`(async()=>{${s}})()`),checks=[];
  try{
    await w.loadFile(path.join(base,'index.html'),{query:{tools:'1'}});await run('await window.wildboundBoot.ready;');
    checks.push(await run('return await window.verifyInventoryControllerIsolation();'));
    await run(`const {Game}=await import('./src/core.mjs'),{HeroUI}=await import('./src/hero-ui.mjs'),{SLOTS,ITEMS}=await import('./src/items.mjs');
      const host=document.createElement('div');host.style='position:fixed;inset:0;z-index:99999;background:#243b30';document.body.append(host);
      const g=new Game(()=>.5),p=g.addPlayer('pad:0');g.phase='play';p.controllerFamily='xbox';p.inventory=[];p.equipment.head='hat';p.equipment.hand1='bow';p.equipment.hand2='occupied';p.equipmentSockets={hand1:['azure_bead']};g.openInventory(p);
      const ui=new HeroUI(host);window.gearQA={g,p,ui,host,SLOTS,ITEMS};ui.draw(g,{});`);
    for(const [width,height] of [[1280,850],[600,430]]){
      w.setContentSize(width,height);
      for(let n=0;n<30;n++){
        await new Promise(r=>setTimeout(r,100));
        const viewport=await run('return [innerWidth,innerHeight];'),size=w.getContentSize();
        if(viewport.every((value,index)=>Math.abs(value-size[index])<3))break;
      }
      await new Promise(r=>setTimeout(r,250));
      checks.push(await run(`const {g,p,ui,host,SLOTS,ITEMS}=window.gearQA;const assert=(v,m)=>{if(!v)throw Error(m);};
        p.ui.panel='pack';p.ui.index=23;g.uiRevision++;ui.draw(g,{});
        const panel=ui.panels.get(p.id),head=panel.querySelector('[data-slot="head"]');
        head.dispatchEvent(new PointerEvent('pointerenter'));ui.draw(g,{});ui.draw(g,{});
        let tip=panel.querySelector('.item-tooltip');assert(tip&&!tip.hidden&&tip.textContent.includes(ITEMS.hat.name),'Hover on equipped gear must survive controller redraw with empty pack selection');
        const r=tip.getBoundingClientRect(),pr=panel.getBoundingClientRect();assert(pr.right<=innerWidth+1&&pr.bottom<=innerHeight+1,'Inventory panel clipped by window');assert(r.left>=pr.left&&r.right<=pr.right+1&&r.top>=pr.top&&r.bottom<=pr.bottom+1,'Equipped tooltip clipped');
        head.dispatchEvent(new PointerEvent('pointerleave'));ui.draw(g,{});assert(panel.querySelector('.item-tooltip').hidden,'Leaving gear with empty selection should hide tooltip');
        p.inventory[23]={type:'sword',qty:1};g.uiRevision++;ui.draw(g,{});
        const occupiedHead=panel.querySelector('[data-slot="head"]');occupiedHead.dispatchEvent(new PointerEvent('pointerenter'));ui.draw(g,{});
        assert(panel.querySelector('.item-tooltip').textContent.includes(ITEMS.hat.name),'Gear hover must take priority over controller selection');
        g.inventoryAction(p,'next');ui.draw(g,{});
        assert(!panel.querySelector('.item-tooltip')||panel.querySelector('.item-tooltip').hidden,'Controller navigation must clear stale hover after selection changes');
        p.inventory[23]=null;g.uiRevision++;
        g.inventoryAction(p,'panel:gear');g.inventoryAction(p,'select:'+SLOTS.indexOf('hand2'));ui.draw(g,{});
        tip=panel.querySelector('.item-tooltip');assert(!tip.hidden&&tip.textContent.includes(ITEMS.bow.name),'Linked hand must show weapon tooltip');
        assert(panel.querySelector('[data-action="use"]').textContent.includes('Unequip'),'Gear primary action must say Unequip');
        return 'Equipped hover, controller selection, linked hand, tooltip bounds at '+innerWidth+'x'+innerHeight;`));
      await new Promise(r=>setTimeout(r,300));fs.writeFileSync(path.join(out,'gear-'+width+'.png'),(await w.webContents.capturePage()).toPNG());
    }
    checks.push(await run(`const {g,p,ui,SLOTS}=window.gearQA;const panel=ui.panels.get(p.id);panel.querySelector('[data-action="use"]').click();ui.draw(g,{});
      if(p.equipment.hand1||p.equipment.hand2||p.inventory.filter(i=>i?.type==='bow').length!==1||p.inventory.find(i=>i?.type==='bow').sockets[0]!=='azure_bead')throw Error('Unequip button lost linked weapon/socket');return 'Visible Unequip button returns one two-handed weapon with sockets';`));
    checks.push(await run(`const {tickSpider}=await import('./src/expansion.mjs');const {g,p}=window.gearQA;
      g.house=null;g.scenery=[];g.terrain.fill('grass');g.traps=[];g.webs=[{group:77,x:500,y:600,radius:145}];
      const spider={id:77,group:77,kind:'spider',x:650,y:600,hp:70,speed:68,damage:11,cooldown:0,state:'hunt'};g.enemies=[spider];
      Object.assign(p,{x:850,y:600,room:null});const hp=p.hp;
      for(let n=0;n<90;n++){g.time+=.05;tickSpider(g,spider,.05,[p]);}
      if(spider.x<=800||p.hp>=hp)throw Error('Packaged adult spider failed to leave web and bite nearby player');
      p.room='storage';const before=spider.x;tickSpider(g,spider,.05,[]);
      if(spider.x>=before)throw Error('Packaged spider failed to return to web');
      return 'Packaged adult spider leaves web, hunts and returns when prey is gone';`));
    if(errors.length)throw Error(errors.join('\n'));
    fs.writeFileSync(path.join(out,'report.json'),JSON.stringify({checks,errors},null,2));console.log(JSON.stringify({checks,errors,out}));app.exit(0);
  }catch(error){fs.writeFileSync(path.join(out,'failure.json'),JSON.stringify({error:String(error),checks,errors},null,2));console.error(error);console.log(out);app.exit(1);}
});
