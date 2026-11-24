const path=require('node:path'),fs=require('node:fs'),root=path.resolve(__dirname,'..');
if(!process.versions.electron){const env={...process.env};delete env.ELECTRON_RUN_AS_NODE;const child=require('node:child_process').spawnSync(path.join(root,'node_modules/electron/dist/electron.exe'),[__filename,'--mute-audio'],{cwd:root,env,encoding:'utf8',timeout:180000});process.stdout.write(child.stdout||'');process.stderr.write(child.stderr||'');process.exit(child.status??1);}
const {app,BrowserWindow}=require('electron'),out=path.join(root,'test-output/diagon-alley',process.env.WILDBOUND_VERIFY_APP?'packaged':'source');fs.mkdirSync(out,{recursive:true});app.setPath('userData',fs.mkdtempSync(path.join(out,'profile-')));app.commandLine.appendSwitch('mute-audio');const deadline=setTimeout(()=>app.exit(1),170000);
app.whenReady().then(async()=>{const w=new BrowserWindow({show:false,width:1280,height:850,webPreferences:{backgroundThrottling:false}}),errors=[];w.webContents.setAudioMuted(true);w.webContents.on('console-message',e=>{if(e.level==='error')errors.push(e.message);});try{
await w.loadFile(path.join(process.env.WILDBOUND_VERIFY_APP||root,'index.html'));await w.webContents.executeJavaScript('wildboundBoot.ready');const result=await w.webContents.executeJavaScript(`(async()=>{
window.requestAnimationFrame=()=>0;window.Worker=undefined;
const {Game}=await import('./src/core.mjs'),{Assets}=await import('./src/assets.mjs'),{Renderer}=await import('./src/render.mjs'),{enterWildLands}=await import('./src/wild-lands.mjs'),{trainInteraction,leaveTrainTest}=await import('./src/train-test.mjs');
const {alleyGate,alleyPrompt,ALLEY_SHOPS,ALLEY_CLOSED_FRONTAGES,alleyBlocked,nearbyAlleyShop,insideNocturne,DIAGON_STREET}=await import('./src/diagon-alley.mjs'),{stationOwlCages,tickStationOwls}=await import('./src/station-owls.mjs'),{drawSnowyOwl,drawOwlCage,drawCagedSnowyOwl}=await import('./src/snowy-owl-art.mjs'),{directionVector}=await import('./src/player-motion.mjs'),{give}=await import('./src/items.mjs'),{merchantAction}=await import('./src/traveling-merchant.mjs'),{merchantPanel}=await import('./src/merchant-ui.mjs');
const checks=[],images={},ok=(v,m)=>{if(!v)throw Error(m);checks.push(m);},assets=new Assets();await assets.load();const g=new Game(()=>.5),original=g.addPlayer('keyboard','Alley visitor');g.start();g.openingBoard=false;g.onSound=()=>{};g.persist=()=>{};g.spriteLibrary=assets.library;original.coins=1000;ok(enterWildLands(g).ok,'enters current Wild Lands desktop world');const p=g.players[0],t=g.trainTest;t.preparing=false;
const canvas=document.createElement('canvas');canvas.style.cssText='width:1280px;height:850px';document.body.append(canvas);const r=new Renderer(canvas,assets);r.dynamicShadows=false;const gate=alleyGate(g);Object.assign(p,{x:gate.x,y:gate.y+65});r.camera={x:gate.x,y:gate.y,zoom:1.35};r.draw(g,0);images.stationGate=canvas.toDataURL();p.equipment.hand1='starter_wand';g.update(.05,{keyboard:{interact:true}});ok(t.alleyOpened,'actual Interact input opens wand wall');g.update(.05,{keyboard:{}});t.time+=1;r.draw(g,0);images.gateOpen=canvas.toDataURL();g.update(.05,{keyboard:{interact:true}});ok(t.design.activeRoom==='diagon','actual Interact enters Diagon Alley');r.draw(g,.016);ok(Math.abs(r.camera.x-p.x)<1&&Math.abs(r.camera.y-p.y)<1,'first portal frame camera is already at destination');images.portalFlash=canvas.toDataURL();g.portalTransition.at-=1000;r.draw(g,.016);images.alleyEntry=canvas.toDataURL();
for(const s of ALLEY_SHOPS){Object.assign(p,s.frontEntrance?{x:s.x,y:s.y+108}:{x:s.x+(s.x<8000?130:-130),y:s.y+12});r.camera={x:p.x,y:p.y,zoom:.48};r.draw(g,.016);ok(!alleyBlocked(g,p.x,p.y),'walkable '+s.name+' approach');if(s.id==='malkins')images.robeShop=canvas.toDataURL();if(s.id==='gringotts')images.bank=canvas.toDataURL();}
const {alleyShopAssets,drawAlleyShopAsset,alleyShopPropRasterCount}=await import('./src/diagon-shop-scenes.mjs');
const {shopArchitectureRasterCount}=await import('./src/diagon-shop-architecture.mjs');
const {mirroredShopPoint,shopEntrySide,shopCutawayOpen}=await import('./src/diagon-shop-rooms.mjs');
const {drawTrainTest}=await import('./src/train-world-art.mjs');
Object.assign(p,{x:8000,y:4830});r.trainScene=null;r.draw(g,.016);
ok(r.camera.zoom>=.73,'Avenue camera reads at walking scale');images.avenue=canvas.toDataURL();
for(const frontage of ALLEY_CLOSED_FRONTAGES){
 const side=frontage.x<8000?1:-1;
 const start=frontage.x+side*(frontage.halfWidth+32);
 Object.assign(p,{x:start,y:frontage.y});
 ok(!Object.hasOwn(frontage,'sign')&&!nearbyAlleyShop(g,p),frontage.theme+' decorative facade has no sign or merchant');
 if(alleyBlocked(g,p.x,p.y))continue;
 for(let step=0;step<14;step++)g.update(.05,{keyboard:{x:-side}});
 ok(alleyBlocked(g,frontage.x,frontage.y)&&!alleyBlocked(g,p.x,p.y),frontage.theme+' facade stops actual walking from the avenue');
}
Object.assign(p,{x:DIAGON_STREET.x+16,y:4823});r.trainScene=null;r.draw(g,.016);images.facades=canvas.toDataURL();
Object.assign(p,{x:DIAGON_STREET.x+16,y:4530});
const partner={...p,id:'alley-camera-partner',device:'pad:0',x:DIAGON_STREET.x+DIAGON_STREET.w-16,y:5450};
g.players.push(partner);
for(let frame=0;frame<14;frame++)r.draw(g,.05);
ok(r.splitViews?.length===2&&[p,partner].every(player=>r.splitViews.some(view=>view.players.includes(player))),'Distant alley explorers each get their own camera');
images.alleyCoop=canvas.toDataURL();
g.players.pop();
for(let frame=0;frame<6;frame++)r.draw(g,.05);
const {ALLEY_STREET_PROPS}=await import('./src/diagon-alley-props.mjs');
const {pixelRecipeFrameAt}=await import('./src/pixel-recipe.mjs');
ok(ALLEY_STREET_PROPS.length===13&&new Set(ALLEY_STREET_PROPS.map(prop=>prop.id)).size===13,'Thirteen distinct editable street prop recipes appear in Diagon Alley');
for(const prop of ALLEY_STREET_PROPS){
 const side=prop.x<8000?1:-1;
 const start=prop.x+side*(prop.halfWidth+26);
 Object.assign(p,{x:start,y:prop.y});
 for(let step=0;step<10;step++)g.update(.05,{keyboard:{x:-side}});
 ok(Math.abs(p.x-start)>2&&alleyBlocked(g,prop.x,prop.y)&&!alleyBlocked(g,p.x,p.y),prop.id+' stops the explorer at its actual base');
}
for(const [id,after] of [['clock',4400],['basin',252],['brazier',170]]){
 const prop=ALLEY_STREET_PROPS.find(p=>p.id===id);
 const first=pixelRecipeFrameAt(prop.recipe,0),next=pixelRecipeFrameAt(prop.recipe,after);
 ok(first.pixels.some((pixel,index)=>pixel!==next.pixels[index]),id+' plays distinct native animation frames');
}
for(const [name,x,y] of [['street-props-north',8000,4220],['street-props-market',8000,4560],['street-props-apothecary',8000,5010],['street-props-south',8000,5520]]){
 Object.assign(p,{x,y});r.trainScene=null;r.draw(g,.016);images[name]=canvas.toDataURL();
}
const board=document.createElement('canvas');board.width=1920;board.height=64+Math.ceil(ALLEY_SHOPS.length/3)*430;
const boardPen=board.getContext('2d');boardPen.imageSmoothingEnabled=false;
boardPen.fillStyle='#233432';boardPen.fillRect(0,0,board.width,board.height);
boardPen.font='21px Georgia';boardPen.fillStyle='#eee2bc';
boardPen.fillText('Diagon Alley workshop interiors',26,33);
t.noticeUntil=0;
Object.assign(p,{x:8080,y:5225});
g.moveActor(p,970,0);
ok(insideNocturne(p.x,p.y)&&p.x>9000&&!alleyBlocked(g,p.x,p.y),'The east connector is walkable from Diagon into Nocturne');
ok(alleyBlocked(g,8900,5450),'The dark service yard beside Nocturne is outside the path');
r.cameraOverride={x:8950,y:5230,zoom:.68};r.trainScene=null;drawTrainTest(r,g,.016);images.nocturneLane=canvas.toDataURL();r.cameraOverride=null;
const bank=ALLEY_SHOPS.find(s=>s.id==='gringotts');
ok(ALLEY_SHOPS.every(shop=>shop===bank||shop.district==='garden'||bank.y<shop.y)&&bank.x===DIAGON_STREET.x+DIAGON_STREET.w/2,'Gringotts anchors the centered north end of Diagon Alley');
for(const [i,shop] of ALLEY_SHOPS.entries()){
 const side=shopEntrySide(shop);
 Object.assign(p,mirroredShopPoint(shop,shop.frontEntrance?{x:0,y:108}:{x:145,y:9}));
 p.faceX=shop.frontEntrance?0:-side;p.faceY=shop.frontEntrance?-1:0;p.ui=null;
 r.cameraOverride={x:shop.frontEntrance?shop.x:shop.x+side*11,y:shop.y-30,zoom:1.34};r.trainScene=null;
 drawTrainTest(r,g,.016);
 images[shop.id+'-street']=canvas.toDataURL();
 if(shop.id!=='ollivanders'){
   ok(!shopCutawayOpen(shop,[p]),shop.name+' shows closed shell on approach');
   for(let step=0;step<14;step++)g.update(.05,{keyboard:shop.frontEntrance?{y:-1}:{x:-side}});
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
 if(shop.id==='gringotts')ok(alleyPrompt(g,p).includes('TALK TO GRIPHOOK'),'The central bank entrance leads to its interactive teller counter');
 trainInteraction(g,p);
 if(shop.stock.length)ok(p.ui?.alleyShop===shop.id,shop.name+' trades from its customer aisle');
 if(shop.district==='nocturne'){
  merchantAction(g,p,'use');
  ok(p.inventory.some(item=>item?.type===shop.stock[0][0]),shop.name+' sells its actual stock');
 }
 p.ui=null;
 const defs=alleyShopAssets(shop);
 const expected=shop.district==='garden'?11:shop.id==='quidditch'?21:20;
 ok(defs.length===expected&&new Set(defs.map(d=>d.id)).size===expected,shop.name+' has '+expected+' distinct assets');
 const sheet=document.createElement('canvas');sheet.width=1100;sheet.height=70+Math.ceil(expected/5)*151;
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
const {ALLEY_SHOP_HEARTH}=await import('./src/diagon-alley.mjs');
const {HOMESTEAD_HEARTH,flooFireGreen}=await import('./src/floo-travel.mjs');
const {trainPrompt}=await import('./src/train-test.mjs');
const {merchantRows}=await import('./src/traveling-merchant.mjs');
const powder=()=>p.inventory.find(item=>item?.type==='floo_powder')?.qty||0;
const frame=(input={})=>g.update(.05,{keyboard:input});
const arrive=hearth=>{
 Object.assign(p,{x:hearth.x,y:hearth.y+19,faceX:0,faceY:-1});
 ok(!trainPrompt(g,p).includes('FLOO'),'Outside the '+hearth.id+' hearth there is no travel prompt');
 g.moveActor(p,0,-25);
};
const captureHearth=(hearth,name)=>{
 r.cameraOverride={x:hearth.x,y:hearth.y-40,zoom:1.5};r.trainScene=null;
 if(g.portalTransition)g.portalTransition.at-=1000;
 drawTrainTest(r,g,.016);images[name]=canvas.toDataURL();r.cameraOverride=null;
};
const curios=ALLEY_SHOPS.find(shop=>shop.id==='nocturne-curios');
Object.assign(p,mirroredShopPoint(curios,{x:69,y:12}));
frame();frame({interact:true});
ok(p.ui?.alleyShop===curios.id,'Interact with Nocturne Curios to buy travel powder');
p.ui.index=merchantRows(g,p).find(row=>row.item.type==='floo_powder').index;
merchantAction(g,p,'use');merchantAction(g,p,'use');
ok(powder()===2,'Nocturne Curios sells two paid pinches of Floo Powder');
p.ui=null;frame();arrive(ALLEY_SHOP_HEARTH);
ok(trainPrompt(g,p).includes('FLOO TO THE HOMESTEAD'),'The shop hearth offers travel from inside');
frame({interact:true});
ok(flooFireGreen(g,ALLEY_SHOP_HEARTH.id),'Activating the shop hearth starts the green flame');
captureHearth(ALLEY_SHOP_HEARTH,'floo-curios-green');
for(let i=0;i<7;i++)frame();
ok(!t.design.activeRoom&&powder()===1&&flooFireGreen(g,HOMESTEAD_HEARTH.id),'A single pinch arrives at the lit Homestead hearth');
captureHearth(HOMESTEAD_HEARTH,'floo-homestead-green');
arrive(HOMESTEAD_HEARTH);
ok(trainPrompt(g,p).includes('FLOO TO DIAGON ALLEY'),'The house hearth offers travel back from inside');
frame({interact:true});for(let i=0;i<7;i++)frame();
ok(t.design.activeRoom==='diagon'&&powder()===0,'Return trip uses the final pinch and arrives at the shop');
arrive(ALLEY_SHOP_HEARTH);
ok(!trainPrompt(g,p).includes('FLOO'),'An empty supply hides travel even inside the hearth');
const {NOCTURNE_SPIDER_MERCHANT:wizard}=await import('./src/nocturne-spider-merchant.mjs');
const {npcDialoguePanel,drawNpcDialoguePortraits}=await import('./src/npc-dialogue-ui.mjs');
const darkEssence=actor=>actor.inventory.filter(item=>item?.type==='dark_essence').reduce((n,item)=>n+item.qty,0);
give(original.inventory,'dark_essence',8);give(p.inventory,'dark_essence',8);
Object.assign(p,{x:wizard.x-36,y:wizard.y});frame();
captureHearth(wizard,'nocturne-spider-stall');
ok(trainPrompt(g,p).includes('SILAS THREADNEEDLE'),'Silas Threadneedle is reachable from public Nocturne paving');
frame({interact:true});frame({interact:true});
ok(p.ui?.nocturneSpiderMerchant&&!p.hunterPet,'Fresh keyboard Interact opens spider offers without buying one');
const spiderPanel=document.createElement('dialog');spiderPanel.className='hero-panel npc-dialogue-session';
spiderPanel.style.cssText='position:fixed;inset:0;width:720px;max-width:calc(100vw - 32px);padding:16px;background:#142a25';
document.body.append(spiderPanel);
npcDialoguePanel(spiderPanel,g,p,(_label,_id,fn)=>{const b=document.createElement('button');b.onclick=fn;return b;});
drawNpcDialoguePortraits(spiderPanel,g,p,r.animator);
const spiderButtons=[...spiderPanel.querySelectorAll('.npc-dialogue-choice')];
ok(spiderButtons.length===4&&spiderButtons[1].textContent.includes('6 Dark Essence'),'Native dialogue presents three spider choices and Dark Essence prices');
window.showSpiderPreview=()=>spiderPanel.showModal();
const coinsBeforeSpider=p.coins;
spiderButtons[1].click();
ok(p.hunterPet?.kind==='tarantula'&&darkEssence(p)===2&&p.coins===coinsBeforeSpider,'Native purchase button adopts a real spider for Dark Essence');
p.ui=null;frame();
const spiderStart=p.hunterPet.x;p.x-=110;
for(let i=0;i<18;i++)frame();
ok(p.hunterPet.x<spiderStart-25,'The adopted spider follows the player through Nocturne');
captureHearth({x:p.x,y:p.y},'nocturne-spider-companion');
const {drawItem}=await import('./src/item-art.mjs');
const {EMPORIUM_OWLS}=await import('./src/owl-emporium.mjs');
const emporium=ALLEY_SHOPS.find(shop=>shop.id==='eeylops');
Object.assign(p,mirroredShopPoint(emporium,{x:24,y:18}));p.ui=null;
trainInteraction(g,p);
ok(p.ui?.alleyShop==='eeylops','The owl cages use the real Eeylops merchant counter');
for(const [type,owl]of Object.entries(EMPORIUM_OWLS)){
 const row=merchantRows(g,p).find(row=>row.item.type===type);
 ok(row?.price===owl.price,owl.name+' cage is in the actual Eeylops stock');
 const coins=p.coins;
 merchantAction(g,p,'select:'+row.index);merchantAction(g,p,'use');
 ok(p.inventory.some(i=>i?.type===type)&&p.coins===coins-owl.price,owl.name+' purchase charges once and grants its cage');
}
p.ui=null;
const nocturneStock=ALLEY_SHOPS.filter(shop=>shop.district==='nocturne').flatMap(shop=>shop.stock);
const cabinet=document.createElement('canvas');cabinet.width=860;cabinet.height=6+Math.ceil(nocturneStock.length/4)*112;
const cabinetPen=cabinet.getContext('2d');cabinetPen.fillStyle='#283e36';cabinetPen.fillRect(0,0,860,230);
cabinetPen.imageSmoothingEnabled=false;
for(const [i,[type]] of nocturneStock.entries()){
 const x=90+(i%4)*215,y=47+Math.floor(i/4)*112;
 drawItem(cabinetPen,type,x,y,51);
 cabinetPen.textAlign='center';cabinetPen.font='12px system-ui';cabinetPen.fillStyle='#eee0ba';cabinetPen.fillText(type.replace(/^alley_/,'').replaceAll('_',' '),x,y+48);
}
images.wizardingStock=cabinet.toDataURL();
ok(alleyShopPropRasterCount()<=(ALLEY_SHOPS.length-1)*14,'the shops use a bounded prop cache');
ok(shopArchitectureRasterCount()<=(ALLEY_SHOPS.length-1)*4,'the shops use bounded architecture layers');
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
const {inventoryToolbar}=await import('./src/inventory-toolbar.mjs');
const owlBoard=document.createElement('canvas');owlBoard.width=900;owlBoard.height=375;
const op=owlBoard.getContext('2d');op.imageSmoothingEnabled=false;op.fillStyle='#314541';op.fillRect(0,0,900,375);
for(const [i,[type,owl]]of Object.entries(EMPORIUM_OWLS).entries()){
 const index=p.inventory.findIndex(item=>item?.type===type);
 p.ui={panel:'pack',index};
 const call=inventoryToolbar(g,p,[]).options.find(x=>x.id==='use');
 ok(call?.label==='Call owl'&&!call.reason,owl.name+' cage is usable through the backpack toolbar');
 g.inventoryAction(p,call.action);
 ok(g.stationOwls.filter(a=>a.owner===p.id).length===1&&g.stationOwls[0].owlVariant===owl.variant&&p.inventory[index]?.type===type,owl.name+' summons with the cage intact');
 g.stationOwls.length=0;g.inventoryAction(p,call.action);tickStationOwls(g,.05);
 ok(g.stationOwls[0]?.owlVariant===owl.variant&&g.stationOwls[0].moving&&p.inventory[index]?.qty===1,owl.name+' can be recalled and take off after its runtime actor disappears');
 const x=150+i*300;
 op.fillStyle='#f0e2ba';op.font='19px Georgia';op.textAlign='center';op.fillText(owl.name,x,34);
 drawItem(op,type,x,88,50);
 for(const [j,phase]of ['perch','fly'].entries())
  for(let d=0;d<8;d++){
   const [faceX,faceY]=directionVector(d);
   drawSnowyOwl(op,{x:i*300+56+(d%4)*63,y:165+Math.floor(d/4)*54+j*104,
    faceX,faceY,hp:30,owlPhase:phase,owlVariant:owl.variant},2+d*.09,45);
  }
}
p.ui=null;
images.emporiumOwls=owlBoard.toDataURL();
const sheet=document.createElement('canvas');sheet.width=1000;sheet.height=440;const c=sheet.getContext('2d');c.fillStyle='#425454';c.fillRect(0,0,1000,440);c.fillStyle='#f4e8bd';c.font='18px Georgia';c.fillText('Snowy owl · shared raven wing joints · eight directions',22,28);for(let d=0;d<8;d++){const v=directionVector(d);drawSnowyOwl(c,{x:70+d*120,y:135,faceX:v[0],faceY:v[1],hp:30,owlPhase:'perch'},2,90);drawSnowyOwl(c,{x:70+d*120,y:295,faceX:v[0],faceY:v[1],hp:30,owlPhase:'fly'},2+d*.09,90);}drawOwlCage(c,{x:140,y:410},false,'back');drawCagedSnowyOwl(c,{x:140,y:410},2);drawOwlCage(c,{x:140,y:410});drawOwlCage(c,{x:300,y:410},true,'back');drawOwlCage(c,{x:300,y:410},true);images.owlViews=sheet.toDataURL();const cageBoard=document.createElement('canvas');cageBoard.width=520;cageBoard.height=260;const cb=cageBoard.getContext('2d');cb.fillStyle='#3d5148';cb.fillRect(0,0,520,260);cb.imageSmoothingEnabled=false;cb.scale(2,2);for(const [i,open]of [false,true].entries()){const a={x:65+i*125,y:112};drawOwlCage(cb,a,open,'back');if(!open)drawCagedSnowyOwl(cb,a,2);drawOwlCage(cb,a,open);cb.fillStyle='#efdfb3';cb.font='10px Georgia';cb.textAlign='center';cb.fillText(open?'Door open':'Snowy owl carrier',a.x,22);}images.cagePreview=cageBoard.toDataURL();ok(true,'eight native owl directions with folded and flapping wings render');
leaveTrainTest(g);ok(original.npcQuests.snowy_owl.active,'adopted pet survives return to expedition');ok(original.inventory.some(a=>a?.type==='starter_wand'),'alley purchase survives expedition return');
ok(Object.keys(EMPORIUM_OWLS).every(type=>original.inventory.some(i=>i?.type===type))&&original.npcQuests.owl_emporium.active==='eeylops_archimedes_cage','Purchased cages and the selected call survive return to the expedition');
ok(original.hunterPet?.kind==='tarantula'&&darkEssence(original)===2,'Spider companion and its exact debit survive preview exit');
return {checks,images};})().catch(error=>({error:error.stack||String(error)}))`);
if(result.error)throw Error(result.error);
for(const [name,data]of Object.entries(result.images))fs.writeFileSync(path.join(out,name+'.png'),Buffer.from(data.split(',')[1],'base64'));w.showInactive();await w.webContents.executeJavaScript('showSpiderPreview()');await new Promise(resolve=>setTimeout(resolve,250));fs.writeFileSync(path.join(out,'nocturne-spider-ui.png'),(await w.webContents.capturePage()).toPNG());await w.webContents.executeJavaScript('document.querySelector("dialog[open]")?.close();showDiagonShopPreview()');await new Promise(resolve=>setTimeout(resolve,300));fs.writeFileSync(path.join(out,'shop-ui.png'),(await w.webContents.capturePage()).toPNG());w.setContentSize(640,480);await new Promise(resolve=>setTimeout(resolve,200));const fit=await w.webContents.executeJavaScript('({width:document.querySelector("dialog[open]").getBoundingClientRect().width,viewport:innerWidth})');if(fit.width>fit.viewport)throw Error('Small shop does not fit');fs.writeFileSync(path.join(out,'shop-small.png'),(await w.webContents.capturePage()).toPNG());result.checks.push('native alley merchant UI fits desktop and small windows');w.hide();if(errors.length)throw Error(errors.join('\n'));const report={passed:result.checks.length,checks:result.checks,failed:0,errors,muted:w.webContents.isAudioMuted()};fs.writeFileSync(path.join(out,'report.json'),JSON.stringify(report,null,2));console.log(JSON.stringify(report));clearTimeout(deadline);app.exit(0);
}catch(e){console.error(e);fs.writeFileSync(path.join(out,'failure.json'),JSON.stringify({message:e.message,errors}));app.exit(1);}});
