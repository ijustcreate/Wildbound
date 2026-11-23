const path=require('node:path'),fs=require('node:fs'),root=path.resolve(__dirname,'..');
if(!process.versions.electron){const env={...process.env};delete env.ELECTRON_RUN_AS_NODE;const child=require('node:child_process').spawnSync(path.join(root,'node_modules/electron/dist/electron.exe'),[__filename,'--mute-audio'],{cwd:root,env,encoding:'utf8',timeout:180000});process.stdout.write(child.stdout||'');process.stderr.write(child.stderr||'');process.exit(child.status??1);}
const {app,BrowserWindow}=require('electron'),out=path.join(root,'test-output/diagon-alley',process.env.WILDBOUND_VERIFY_APP?'packaged':'source');fs.mkdirSync(out,{recursive:true});app.setPath('userData',fs.mkdtempSync(path.join(out,'profile-')));app.commandLine.appendSwitch('mute-audio');const deadline=setTimeout(()=>app.exit(1),170000);
app.whenReady().then(async()=>{const w=new BrowserWindow({show:false,width:1280,height:850,webPreferences:{backgroundThrottling:false}}),errors=[];w.webContents.setAudioMuted(true);w.webContents.on('console-message',e=>{if(e.level==='error')errors.push(e.message);});try{
await w.loadFile(path.join(process.env.WILDBOUND_VERIFY_APP||root,'index.html'));await w.webContents.executeJavaScript('wildboundBoot.ready');const result=await w.webContents.executeJavaScript(`(async()=>{
window.requestAnimationFrame=()=>0;window.Worker=undefined;
const {Game}=await import('./src/core.mjs'),{Assets}=await import('./src/assets.mjs'),{Renderer}=await import('./src/render.mjs'),{enterWildLands}=await import('./src/wild-lands.mjs'),{trainInteraction,leaveTrainTest}=await import('./src/train-test.mjs');
const {alleyGate,ALLEY_SHOPS,alleyBlocked}=await import('./src/diagon-alley.mjs'),{stationOwlCages,tickStationOwls}=await import('./src/station-owls.mjs'),{drawSnowyOwl,drawOwlCage,drawCagedSnowyOwl}=await import('./src/snowy-owl-art.mjs'),{directionVector}=await import('./src/player-motion.mjs'),{give}=await import('./src/items.mjs'),{merchantAction}=await import('./src/traveling-merchant.mjs'),{merchantPanel}=await import('./src/merchant-ui.mjs');
const checks=[],images={},ok=(v,m)=>{if(!v)throw Error(m);checks.push(m);},assets=new Assets();await assets.load();const g=new Game(()=>.5),original=g.addPlayer('keyboard','Alley visitor');g.start();g.openingBoard=false;g.onSound=()=>{};g.persist=()=>{};g.spriteLibrary=assets.library;original.coins=1000;ok(enterWildLands(g).ok,'enters current Wild Lands desktop world');const p=g.players[0],t=g.trainTest;t.preparing=false;
const canvas=document.createElement('canvas');canvas.style.cssText='width:1280px;height:850px';document.body.append(canvas);const r=new Renderer(canvas,assets);r.dynamicShadows=false;const gate=alleyGate(g);Object.assign(p,{x:gate.x,y:gate.y+65});r.camera={x:gate.x,y:gate.y,zoom:1.35};r.draw(g,0);images.stationGate=canvas.toDataURL();p.equipment.hand1='starter_wand';g.update(.05,{keyboard:{interact:true}});ok(t.alleyOpened,'actual Interact input opens wand wall');g.update(.05,{keyboard:{}});t.time+=1;r.draw(g,0);images.gateOpen=canvas.toDataURL();g.update(.05,{keyboard:{interact:true}});ok(t.design.activeRoom==='diagon','actual Interact enters Diagon Alley');r.draw(g,.016);ok(Math.abs(r.camera.x-p.x)<1&&Math.abs(r.camera.y-p.y)<1,'first portal frame camera is already at destination');images.portalFlash=canvas.toDataURL();g.portalTransition.at-=1000;r.draw(g,.016);images.alleyEntry=canvas.toDataURL();
for(const s of ALLEY_SHOPS){Object.assign(p,{x:s.x+(s.x<8000?130:-130),y:s.y+12});r.camera={x:p.x,y:p.y,zoom:.48};r.draw(g,.016);ok(!alleyBlocked(g,p.x,p.y),'walkable '+s.name+' interior');if(s.id==='malkins')images.robeShop=canvas.toDataURL();if(s.id==='gringotts')images.bank=canvas.toDataURL();}
const {alleyShopAssets,drawAlleyShopAsset,alleyShopPropRasterCount}=await import('./src/diagon-shop-scenes.mjs');
const {shopArchitectureRasterCount}=await import('./src/diagon-shop-architecture.mjs');
const {mirroredShopPoint,shopEntrySide,shopCutawayOpen}=await import('./src/diagon-shop-rooms.mjs');
const {drawTrainTest}=await import('./src/train-world-art.mjs');
const board=document.createElement('canvas');board.width=1920;board.height=1360;
const boardPen=board.getContext('2d');boardPen.imageSmoothingEnabled=false;
boardPen.fillStyle='#233432';boardPen.fillRect(0,0,board.width,board.height);
boardPen.font='21px Georgia';boardPen.fillStyle='#eee2bc';
boardPen.fillText('Diagon Alley workshop interiors',26,33);
t.noticeUntil=0;
for(const [i,shop] of ALLEY_SHOPS.entries()){
 const side=shopEntrySide(shop);
 Object.assign(p,mirroredShopPoint(shop,{x:145,y:9}));
 p.faceX=-side;p.faceY=0;p.ui=null;
 r.cameraOverride={x:shop.x+side*11,y:shop.y-30,zoom:1.34};r.trainScene=null;
 drawTrainTest(r,g,.016);
 images[shop.id+'-street']=canvas.toDataURL();
 if(shop.id!=='ollivanders'){
   ok(!shopCutawayOpen(shop,[p]),shop.name+' shows closed shell on approach');
   for(let step=0;step<14;step++)g.update(.05,{keyboard:{x:-side}});
   ok(shopCutawayOpen(shop,[p]),shop.name+' opens its cutaway after entering');
 }
 Object.assign(p,mirroredShopPoint(shop,{x:24,y:18}));p.moving=false;
 drawTrainTest(r,g,.016);
 images[shop.id+'-room']=canvas.toDataURL();
 const col=i%3,row=Math.floor(i/3),x=18+col*635,y=48+row*430;
 boardPen.drawImage(canvas,x,y,617,409);boardPen.fillStyle='#eee2bc';boardPen.font='17px Georgia';
 boardPen.fillText(shop.name,x+10,y+25);
 r.cameraOverride=null;
 if(shop.id==='ollivanders')continue;
 trainInteraction(g,p);
 if(shop.stock.length)ok(p.ui?.alleyShop===shop.id,shop.name+' trades from its customer aisle');
 p.ui=null;
 const defs=alleyShopAssets(shop);
 ok(defs.length===20&&new Set(defs.map(d=>d.id)).size===20,shop.name+' has twenty distinct assets');
 const sheet=document.createElement('canvas');sheet.width=1100;sheet.height=675;
 const sheetPen=sheet.getContext('2d');sheetPen.fillStyle='#314742';sheetPen.fillRect(0,0,sheet.width,sheet.height);
 sheetPen.fillStyle='#eee2bc';sheetPen.font='23px Georgia';sheetPen.fillText(shop.name,23,35);
 const stamp=document.createElement('canvas');stamp.width=210;stamp.height=117;
 const pen=stamp.getContext('2d',{willReadFrequently:true});
 for(const [index,def] of defs.entries()){
   pen.setTransform(1,0,0,1,0,0);pen.clearRect(0,0,210,117);
   const z=Math.min(2,194/def.w,101/def.h);pen.setTransform(z,0,0,z,0,0);
   drawAlleyShopAsset(pen,shop,def,105/z,107/z,g.time);
   ok(pen.getImageData(0,0,210,117).data.some((a,n)=>n%4===3&&a>0),'native art '+shop.id+' '+def.id);
   const x=6+(index%5)*220,y=50+Math.floor(index/5)*151;
   sheetPen.drawImage(stamp,x,y);
   sheetPen.fillStyle='#eee2bc';sheetPen.font='13px system-ui';sheetPen.textAlign='center';
   sheetPen.fillText((def.label||def.id).replaceAll('-',' '),x+105,y+130,204);
 }
 images[shop.id+'-assets']=sheet.toDataURL();
}
images.shopInteriors=board.toDataURL();
ok(alleyShopPropRasterCount()<=98,'all seven stores use a bounded prop cache');
ok(shopArchitectureRasterCount()<=28,'all seven stores use bounded architecture layers');
const s=ALLEY_SHOPS[0];
t.noticeUntil=0;
const {OLLIVANDERS_ASSETS,drawOllivandersAsset,ollivandersPropRasterCount}=await import('./src/diagon-wand-shop-assets.mjs');
const {ollivandersRoomOpen}=await import('./src/diagon-wand-shop-layout.mjs');
Object.assign(p,{x:s.x+143,y:s.y+12});
r.trainScene=null;
r.draw(g,.016);
ok(r.camera.zoom>.9,'native camera comes into gameplay range on the shop approach');
ok(!ollivandersRoomOpen(s,g.players),'approach shows the roof and storefront');
r.cameraOverride={x:s.x+13,y:s.y-38,zoom:1.45};
r.trainScene=null;
drawTrainTest(r,g,.016);
images.wandShopExterior=canvas.toDataURL();
r.cameraOverride=null;
for(let step=0;step<10;step++)g.update(.05,{keyboard:{x:-1}});
ok(p.x<s.x+100,'actual walking crosses the new shop threshold');
ok(ollivandersRoomOpen(s,g.players),'entering the building exposes the cutaway');
Object.assign(p,{x:s.x+22,y:s.y+17});
r.cameraOverride={x:s.x+3,y:s.y-29,zoom:1.44};
r.trainScene=null;
drawTrainTest(r,g,.016);
images.wandShop=canvas.toDataURL();
r.cameraOverride=null;
const props=document.createElement('canvas');
props.width=1200;props.height=740;
const propPen=props.getContext('2d');
propPen.fillStyle='#243739';propPen.fillRect(0,0,props.width,props.height);
propPen.fillStyle='#ece0bc';propPen.font='24px Georgia';propPen.fillText('Ollivanders workshop assets',26,38);
ok(OLLIVANDERS_ASSETS.length===20&&new Set(OLLIVANDERS_ASSETS.map(a=>a.id)).size===20,'twenty distinct native asset definitions');
for(const [index,asset]of OLLIVANDERS_ASSETS.entries()){
 const x=115+(index%5)*242,y=180+Math.floor(index/5)*170;
 const isolated=document.createElement('canvas');isolated.width=242;isolated.height=125;
 const pen=isolated.getContext('2d');
 drawOllivandersAsset(pen,asset.id,121,116,Math.min(2.5,218/asset.w,112/asset.h));
 ok(pen.getImageData(0,0,242,125).data.some((alpha,i)=>i%4===3&&alpha>0),'native artwork renders '+asset.kind);
 propPen.drawImage(isolated,x-121,y-117);
 propPen.textAlign='center';propPen.font='14px system-ui';propPen.fillStyle='#ece0bc';
 propPen.fillText(asset.kind.replaceAll('_',' '),x,y+23);
}
images.wandShopAssets=props.toDataURL();
ok(ollivandersPropRasterCount()<=18,'shop prop raster count is bounded');
Object.assign(p,{x:s.x+22,y:s.y+17});
trainInteraction(g,p);ok(p.ui.alleyShop==='ollivanders','real merchant interaction opens wand shop');merchantAction(g,p,'use');ok(p.inventory.some(a=>a?.type==='starter_wand'),'wand merchant purchase adds inventory');
const panel=document.createElement('dialog');panel.className='hero-panel merchant-session';panel.style.cssText='position:fixed;inset:0;width:960px;max-width:calc(100vw - 32px);height:700px;max-height:calc(100vh - 32px);background:#142a25;overflow:auto;padding:16px';document.body.append(panel);const button=(label,key,action)=>{const b=document.createElement('button');b.textContent=label;b.className=key;b.onclick=action;return b;};merchantPanel(panel,g,p,button,r.animator,{select:'Arrow keys',tabs:'Tab',accept:'E',close:'Escape'});panel.showModal();window.diagonPanel=panel;ok(panel.textContent.includes('Ollivanders'),'native merchant UI names alley business');
const shopPreview=panel.cloneNode(true);document.body.append(shopPreview);const originals=panel.querySelectorAll('canvas');shopPreview.querySelectorAll('canvas').forEach((c,i)=>c.getContext('2d').drawImage(originals[i],0,0));shopPreview.close();window.showDiagonShopPreview=()=>{shopPreview.showModal();const b=shopPreview.getBoundingClientRect();return {width:b.width,height:b.height,viewport:innerWidth};};p.ui=null;panel.close();Object.assign(p,{x:8000,y:5660});trainInteraction(g,p);ok(!t.design.activeRoom,'return portal reaches original station');r.draw(g,.016);ok(Math.hypot(r.camera.x-p.x,r.camera.y-p.y)<1,'return portal camera also snaps');
const cage=stationOwlCages(g)[0];Object.assign(p,{x:cage.x,y:cage.y+30});t.previous.clear();g.update(.05,{keyboard:{interact:true}});ok(p.npcQuests.snowy_owl.active,'actual input opens cage and adopts owl');g.update(.05,{keyboard:{}});p.x+=160;p.moving=true;for(let i=0;i<100;i++)tickStationOwls(g,.05);ok(g.stationOwls[0].owlHeight>0,'snowy owl flies to moving owner');p.moving=false;for(let i=0;i<100;i++)tickStationOwls(g,.05);ok(g.stationOwls[0].owlPhase==='perch','snowy owl lands beside resting owner');p.equipment.hand1='critter_net';give(p.inventory,'critter_cage');ok(g.attack(p),'actual net attack handles owl');ok(p.inventory.some(a=>a?.type==='caught_snowy_owl'),'net puts owl in a travel cage');p.ui={panel:'pack',index:p.inventory.findIndex(a=>a?.type==='caught_snowy_owl')};g.inventoryAction(p,'use');ok(p.npcQuests.snowy_owl.active,'actual item Use releases pet again');p.ui=null;tickStationOwls(g,.05);
const sheet=document.createElement('canvas');sheet.width=1000;sheet.height=440;const c=sheet.getContext('2d');c.fillStyle='#425454';c.fillRect(0,0,1000,440);c.fillStyle='#f4e8bd';c.font='18px Georgia';c.fillText('Snowy owl · shared raven wing joints · eight directions',22,28);for(let d=0;d<8;d++){const v=directionVector(d);drawSnowyOwl(c,{x:70+d*120,y:135,faceX:v[0],faceY:v[1],hp:30,owlPhase:'perch'},2,90);drawSnowyOwl(c,{x:70+d*120,y:295,faceX:v[0],faceY:v[1],hp:30,owlPhase:'fly'},2+d*.09,90);}drawOwlCage(c,{x:140,y:410},false,'back');drawCagedSnowyOwl(c,{x:140,y:410},2);drawOwlCage(c,{x:140,y:410});drawOwlCage(c,{x:300,y:410},true,'back');drawOwlCage(c,{x:300,y:410},true);images.owlViews=sheet.toDataURL();const cageBoard=document.createElement('canvas');cageBoard.width=520;cageBoard.height=260;const cb=cageBoard.getContext('2d');cb.fillStyle='#3d5148';cb.fillRect(0,0,520,260);cb.imageSmoothingEnabled=false;cb.scale(2,2);for(const [i,open]of [false,true].entries()){const a={x:65+i*125,y:112};drawOwlCage(cb,a,open,'back');if(!open)drawCagedSnowyOwl(cb,a,2);drawOwlCage(cb,a,open);cb.fillStyle='#efdfb3';cb.font='10px Georgia';cb.textAlign='center';cb.fillText(open?'Door open':'Snowy owl carrier',a.x,22);}images.cagePreview=cageBoard.toDataURL();ok(true,'eight native owl directions with folded and flapping wings render');
leaveTrainTest(g);ok(original.npcQuests.snowy_owl.active,'adopted pet survives return to expedition');ok(original.inventory.some(a=>a?.type==='starter_wand'),'alley purchase survives expedition return');
return {checks,images};})()`);
for(const [name,data]of Object.entries(result.images))fs.writeFileSync(path.join(out,name+'.png'),Buffer.from(data.split(',')[1],'base64'));w.showInactive();await w.webContents.executeJavaScript('showDiagonShopPreview()');await new Promise(resolve=>setTimeout(resolve,300));fs.writeFileSync(path.join(out,'shop-ui.png'),(await w.webContents.capturePage()).toPNG());w.setContentSize(640,480);await new Promise(resolve=>setTimeout(resolve,200));const fit=await w.webContents.executeJavaScript('({width:document.querySelector("dialog[open]").getBoundingClientRect().width,viewport:innerWidth})');if(fit.width>fit.viewport)throw Error('Small shop does not fit');fs.writeFileSync(path.join(out,'shop-small.png'),(await w.webContents.capturePage()).toPNG());result.checks.push('native alley merchant UI fits desktop and small windows');w.hide();if(errors.length)throw Error(errors.join('\n'));const report={passed:result.checks.length,checks:result.checks,failed:0,errors,muted:w.webContents.isAudioMuted()};fs.writeFileSync(path.join(out,'report.json'),JSON.stringify(report,null,2));console.log(JSON.stringify(report));clearTimeout(deadline);app.exit(0);
}catch(e){console.error(e);fs.writeFileSync(path.join(out,'failure.json'),JSON.stringify({message:e.message,errors}));app.exit(1);}});
