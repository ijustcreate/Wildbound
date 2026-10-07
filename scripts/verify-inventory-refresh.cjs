const {app,BrowserWindow}=require('electron'),path=require('node:path'),fs=require('node:fs');
const root=path.resolve(__dirname,'..');app.disableHardwareAcceleration();app.setPath('userData',path.join(root,'test-output/inventory-refresh-profile'));
app.whenReady().then(async()=>{
 const w=new BrowserWindow({show:false,width:1280,height:820,useContentSize:true,webPreferences:{offscreen:true}});
 w.webContents.on('console-message',(_e,_level,message)=>{if(/Error|failed|Invalid/.test(message))console.error('Renderer:',message);});
 const resize=async(width,height,zoom)=>{
  w.setContentSize(width,height);w.webContents.setZoomFactor(zoom);
  for(let n=0;n<30;n++){await new Promise(r=>setTimeout(r,100));const viewport=await w.webContents.executeJavaScript('[innerWidth,innerHeight]');const [cw,ch]=w.getContentSize();if(Math.abs(viewport[0]-cw/zoom)<3&&Math.abs(viewport[1]-ch/zoom)<3)return;}
  throw Error('Electron viewport did not apply size/zoom');
 };
 try{
  await w.loadFile(path.join(process.env.WILDBOUND_VERIFY_APP||root,'index.html'),{query:{tools:'1'}});await w.webContents.executeJavaScript('window.wildboundBoot.ready');
  console.log(await w.webContents.executeJavaScript('window.verifyInventoryControllerIsolation()'));
  await w.webContents.executeJavaScript(`(async()=>{
   const {Game}=await import('./src/core.mjs'),{HeroUI}=await import('./src/hero-ui.mjs'),{Assets}=await import('./src/assets.mjs'),{ITEMS,SLOTS}=await import('./src/items.mjs');
   const assets=new Assets();await assets.load();const host=document.createElement('div');host.style.cssText='position:fixed;inset:0;z-index:99999;background:#193128';document.body.append(host);
   const g=new Game(()=>.5),p=g.addPlayer('pad:0');p.name='DAD';p.controllerFamily='xbox';p.level=9;p.coins=501;p.xp=260;
   p.inventory=Array(24).fill(null);const types=['stick','potion','relic_dust','magic_essence','necromancer_wand','arrow','sword','phantom_charm','trap','fruit','boots','caught_frog','charm','armor','pants','gloves','coconut','bow','azure_bead','hat','stamina_potion','meat'];
   types.forEach((type,i)=>p.inventory[i+1]={type:ITEMS[type]?type:'sword',qty:ITEMS[type]?.stack?i+1:1});
   for(const slot of SLOTS)p.equipment[slot]=Object.keys(ITEMS).find(type=>ITEMS[type].slot===slot&&!ITEMS[type].gmOnly)||null;
   g.openInventory(p);const ui=new HeroUI(host);ui.draw(g,assets);window.inventoryRefresh={g,p,ui,host,assets,SLOTS};
  })()`);
  console.log(await w.webContents.executeJavaScript(`(async()=>{
   const {g,p,ui,assets}=window.inventoryRefresh,panel=ui.panels.get(p.id),canvas=panel.querySelector('.equipment-preview'),frames=new Set(),worldFacing=[p.faceX,p.faceY],gameTime=g.time;
   const scene=panel.querySelector('.inventory-scene'),css=getComputedStyle(canvas);
   if(css.position!=='absolute'||Number(css.zIndex)<=Number(getComputedStyle(scene).zIndex))throw Error('Character canvas is covered by the scenery layer');
   const pixels=canvas.getContext('2d').getImageData(0,0,canvas.width,canvas.height).data;
   if(Array.from(pixels).filter((v,i)=>i%4===3&&v>0).length<500)throw Error('Character canvas is empty');
   for(let n=0;n<12;n++){ui.draw(g,assets);if(panel.querySelector('.equipment-preview')!==canvas)throw Error('Idle animation rebuilds the inventory');frames.add(canvas.toDataURL());await new Promise(r=>setTimeout(r,100));}
   if(frames.size<2||g.time!==gameTime)throw Error('Live portrait does not animate independently of paused simulation');
   const before=canvas.toDataURL();panel.querySelector('.preview-turn-right').click();ui.draw(g,assets);
   if(canvas.toDataURL()===before||p.ui.previewDirection!==1||JSON.stringify([p.faceX,p.faceY])!==JSON.stringify(worldFacing))throw Error('Live portrait rotation failed or changed world facing');
   panel.querySelector('.preview-turn-left').click();ui.draw(g,assets);
   return 'Live equipped portrait animates with paused simulation, rotates independently, and preserves its canvas between frames';
  })()`));
  const cases=[[1280,650,1],[1280,820,1.25],[960,850,1],[1280,850,1.5],[780,600,1],[600,430,1]];
  for(const [width,height,zoom]of cases){
   await resize(width,height,zoom);
   const result=await w.webContents.executeJavaScript(`(()=>{
    try{const {g,p,ui,host,assets,SLOTS}=window.inventoryRefresh,round=r=>[r.x,r.y,r.width,r.height].map(n=>Math.round(n*100)/100);
    const inside=(a,b,label)=>{if(a.left<b.left-1||a.top<b.top-1||a.right>b.right+1||a.bottom>b.bottom+1)throw Error(label+' escapes its container: '+JSON.stringify({a:round(a),b:round(b)}));};
    const overlaps=(a,b)=>a.left<b.right-.5&&a.right>b.left+.5&&a.top<b.bottom-.5&&a.bottom>b.top+.5;
    let baseline;
    for(const [mode,index]of [['pack',0],['pack',1],['pack',7],['pack',23],['gear',0],['gear',SLOTS.indexOf('feet')]]){
     p.ui={panel:mode,index,notice:''};ui.draw(g,assets);host.querySelector('.item-tooltip')?.remove();
     const panel=ui.panels.get(p.id),bounds=panel.getBoundingClientRect(),grid=panel.querySelector('.inventory-window .item-grid');inside(bounds,host.getBoundingClientRect(),'Inventory panel');
     const gear=[...panel.querySelectorAll('.paper-doll button[data-slot]')],bag=[...grid.querySelectorAll('button')],actions=[...panel.querySelectorAll('.current-inventory-actions button')];
     if(gear.length!==11||bag.length!==24||actions.length!==8)throw Error('Lost slots or toolbar actions');
     if(bounds.width>480.01)throw Error('Inventory is not thinner');
     for(const b of [...gear,...bag])inside(b.getBoundingClientRect(),bounds,'Button '+b.dataset.action);
     const portrait=panel.querySelector('.inventory-character').getBoundingClientRect(),doll=panel.querySelector('.paper-doll').getBoundingClientRect(),preview=panel.querySelector('.inventory-preview-column').getBoundingClientRect(),equipment=panel.querySelector('.equipment-window').getBoundingClientRect();
     inside(preview,equipment,'Live preview column');inside(portrait,preview,'Live character portrait');inside(doll,equipment,'Body-shaped equipment grid');
     inside(panel.querySelector('.equipment-preview').getBoundingClientRect(),portrait,'Visible character canvas');
     if(portrait.right>doll.left-1)throw Error('Live character is not left of the equipment');
     if(panel.querySelector('.quiver-slot,select[data-action="selectAmmo"]'))throw Error('Removed ammunition selector remains visible');
     const slots=Object.fromEntries(gear.map(b=>[b.dataset.slot,b.getBoundingClientRect()])),center=r=>(r.left+r.right)/2;
     for(const column of [['head','neck','chest','pants','feet'],['back','gloves','hand1'],['cape','shoulders','hand2']])for(let i=1;i<column.length;i++){const a=slots[column[i-1]],b=slots[column[i]];if(Math.abs(center(a)-center(b))>1||b.top<a.bottom)throw Error('Body grid is out of order: '+column.join(' / '));}
     if(!(center(slots.hand1)<center(slots.pants)&&center(slots.hand2)>center(slots.pants)))throw Error('Hands do not flank the legs');
     for(const b of gear)if(overlaps(b.getBoundingClientRect(),portrait))throw Error('Gear overlaps the live character');
     for(const b of gear){const label=b.querySelector('.equipment-slot-label'),r=b.getBoundingClientRect();inside(label.getBoundingClientRect(),r,'Equipment label '+b.dataset.slot);if(label.scrollWidth>label.clientWidth+1)throw Error('Clipped equipment label '+b.dataset.slot);}
     for(const b of gear){const icon=b.querySelector('canvas.item-icon'),ir=icon?.getBoundingClientRect();if(!ir||ir.width<18||ir.height<18)throw Error('Equipment icon collapsed: '+b.dataset.slot+' '+JSON.stringify(ir));inside(ir,b.getBoundingClientRect(),'Equipped icon '+b.dataset.slot);if(overlaps(ir,b.querySelector('.equipment-slot-label').getBoundingClientRect()))throw Error('Icon overlaps equipment label '+b.dataset.slot+' '+JSON.stringify({icon:round(ir),label:round(b.querySelector('.equipment-slot-label').getBoundingClientRect()),button:round(b.getBoundingClientRect()),rows:getComputedStyle(b).gridTemplateRows,columns:getComputedStyle(b).gridTemplateColumns}));}
     for(let i=0;i<gear.length;i++)for(let j=i+1;j<gear.length;j++)if(overlaps(gear[i].getBoundingClientRect(),gear[j].getBoundingClientRect()))throw Error('Overlapping equipment '+JSON.stringify([gear[i],gear[j]].map(b=>({slot:b.dataset.slot,area:getComputedStyle(b).gridArea,inset:getComputedStyle(b).inset,bounds:round(b.getBoundingClientRect())}))));
     for(const b of actions)for(const text of b.querySelectorAll('.inventory-key,.inventory-action-label')){inside(text.getBoundingClientRect(),b.getBoundingClientRect(),'Toolbar label');if(text.scrollWidth>text.clientWidth+1)throw Error('Clipped toolbar text '+b.dataset.action);}
     const bagRect=grid.getBoundingClientRect(),sheet=panel.querySelector('.inventory-window').getBoundingClientRect();if(sheet.bottom-bagRect.bottom>1)throw Error('Backpack still reserves an unused action row');
     if(bag.some(b=>b.getBoundingClientRect().height<20))throw Error('Bag slots collapsed '+JSON.stringify({cell:round(bag[0].getBoundingClientRect()),grid:round(grid.getBoundingClientRect()),rows:getComputedStyle(grid).gridTemplateRows,gap:getComputedStyle(grid).rowGap,sheetRows:getComputedStyle(panel.querySelector('.inventory-window')).gridTemplateRows}));
     const nav=panel.querySelector('.current-inventory-actions'),toolbar=nav.getBoundingClientRect();inside(toolbar,bounds,'Toolbar');
     if(actions.some(b=>Math.abs(b.getBoundingClientRect().top-actions[0].getBoundingClientRect().top)>1))throw Error('Actions wrap into another row');
     if(nav.scrollWidth>nav.clientWidth+1){nav.scrollLeft=nav.scrollWidth;const last=actions.at(-1).getBoundingClientRect();if(last.right>toolbar.right+1)throw Error('Cannot reach final action by scrolling');nav.scrollLeft=0;}
     else for(const b of actions)inside(b.getBoundingClientRect(),toolbar,'Action button');
     if(toolbar.bottom-Math.max(...actions.map(b=>b.getBoundingClientRect().bottom))>10)throw Error('Unused toolbar space');
     const geometry=JSON.stringify([round(grid.getBoundingClientRect()),round(panel.querySelector('.paper-doll').getBoundingClientRect()),round(toolbar)]);
     baseline??=geometry;if(baseline!==geometry)throw Error('Selection shifts the layout');
     if(mode==='pack'&&index===0&&actions.some(b=>!b.disabled))throw Error('Empty selection exposes an unsafe action');
    }
    p.ui={panel:'pack',index:0};ui.draw(g,assets);return {viewport:[innerWidth,innerHeight],dpr:devicePixelRatio,panel:round(ui.panels.get(p.id).getBoundingClientRect()),bagCell:round(host.querySelector('.inventory-window .item-grid button').getBoundingClientRect()),stable:true};}catch(e){return {error:e.stack};}
   })()`);
   if(result.error)throw Error(JSON.stringify({width,height,zoom,error:result.error}));
   console.log(JSON.stringify({width,height,zoom,...result}));
   if(width===1280&&height===650&&zoom===1){await new Promise(r=>setTimeout(r,350));const r=await w.webContents.executeJavaScript(`(()=>{const r=window.inventoryRefresh.ui.panels.get(window.inventoryRefresh.p.id).getBoundingClientRect();return {x:Math.floor(r.x),y:Math.floor(r.y),width:Math.ceil(r.width),height:Math.ceil(r.height)};})()`);fs.writeFileSync(path.join(root,'test-output/inventory-refresh-empty.png'),(await w.webContents.capturePage(r)).toPNG());}
  }
  await resize(1280,820,1.25);
  const party=await w.webContents.executeJavaScript(`(()=>{try{const {g,p,ui,host,assets}=window.inventoryRefresh;for(const family of ['switch','playstation']){const q=g.addPlayer('pad:'+g.players.length);q.name='Ember';q.controllerFamily=family;q.inventory=[{type:'sword',qty:1}];g.openInventory(q);ui.draw(g,assets);for(const panel of ui.panels.values()){
    const bounds=panel.getBoundingClientRect();for(const label of panel.querySelectorAll('.equipment-slot-label,.inventory-action-label,.inventory-key')){const r=label.getBoundingClientRect(),b=label.closest('button').getBoundingClientRect();if(r.right>b.right+1||r.bottom>b.bottom+1||label.scrollWidth>label.clientWidth+1)throw Error('Co-op label clips '+label.textContent+' '+JSON.stringify({owner:panel.hero.name,button:[b.width,b.height],label:[r.width,r.height],scroll:label.scrollWidth,client:label.clientWidth,panel:[bounds.width,bounds.height]}));}
  }}g.players=[p];ui.draw(g,assets);return {passed:'Two and three controller panels: all equipment labels and action badges fit'};}catch(e){return {error:e.stack};}})()`);if(party.error)throw Error(party.error);console.log(party.passed);
  await resize(1280,650,1);
  console.log(await w.webContents.executeJavaScript(`(()=>{const {g,p,ui,host,assets}=window.inventoryRefresh;p.ui={panel:'pack',index:7};ui.draw(g,assets);const equip=host.querySelector('.current-inventory-actions [data-action="use"]');if(equip.disabled)throw Error('Equip action unavailable');equip.click();ui.draw(g,assets);if(p.equipment.hand1!=='sword')throw Error('Visible Equip button does not work');return 'Visible equip button works';})()`));
  console.log(await w.webContents.executeJavaScript(`(()=>{const {g,p,ui,host,assets,SLOTS}=window.inventoryRefresh;g.phase='play';p.ui={panel:'gear',index:SLOTS.indexOf('hand1'),ownerDevice:p.device};p.equipmentSockets={hand1:['azure_bead']};ui.draw(g,assets);const drop=host.querySelector('.current-inventory-actions [data-action="drop"]');if(drop.disabled||!drop.textContent.includes('Drop gear'))throw Error('Visible gear drop unavailable');return 'Equipped Drop gear button is enabled with the controller shortcut';})()`));
  const r=await w.webContents.executeJavaScript(`(()=>{const panel=window.inventoryRefresh.ui.panels.get(window.inventoryRefresh.p.id);panel.querySelector('.item-tooltip')?.remove();const r=panel.getBoundingClientRect();return {x:Math.floor(r.x),y:Math.floor(r.y),width:Math.ceil(r.width),height:Math.ceil(r.height)};})()`);await new Promise(r=>setTimeout(r,350));fs.writeFileSync(path.join(root,'test-output/inventory-refresh-equipped.png'),(await w.webContents.capturePage(r)).toPNG());
  console.log(await w.webContents.executeJavaScript(`(()=>{const {g,p,ui,host,assets}=window.inventoryRefresh;host.querySelector('.current-inventory-actions [data-action="drop"]').click();if(p.equipment.hand1||g.loot.at(-1)?.type!=='sword'||g.loot.at(-1)?.sockets?.[0]!=='azure_bead')throw Error('Visible Drop gear failed or lost sockets');ui.draw(g,assets);return 'Visible Drop gear button moves equipped item and sockets onto ground';})()`));
  app.exit(0);
 }catch(e){console.error(e);app.exit(1);}
});
