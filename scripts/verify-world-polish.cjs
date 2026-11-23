const fs=require('node:fs'),path=require('node:path'),root=path.resolve(__dirname,'..');
if(!process.versions.electron){const env={...process.env};delete env.ELECTRON_RUN_AS_NODE;const result=require('node:child_process').spawnSync(path.join(root,'node_modules/electron/dist/electron.exe'),[__filename,'--mute-audio'],{cwd:root,env,encoding:'utf8',timeout:180000});process.stdout.write(result.stdout||'');process.stderr.write(result.stderr||'');process.exit(result.status??1);}
const {app,BrowserWindow}=require('electron'),out=path.join(root,'test-output/world-polish',process.env.WILDBOUND_VERIFY_APP?'packaged':'source');fs.mkdirSync(out,{recursive:true});app.setPath('userData',path.join(out,'isolated-profile'));app.commandLine.appendSwitch('mute-audio');const deadline=setTimeout(()=>app.exit(1),170000);
app.whenReady().then(async()=>{const win=new BrowserWindow({show:false,width:1280,height:850,webPreferences:{backgroundThrottling:false}}),errors=[];win.webContents.setAudioMuted(true);win.webContents.on('console-message',e=>{if(e.level==='error')errors.push(e.message);});try{
 await win.loadFile(path.join(process.env.WILDBOUND_VERIFY_APP||root,'index.html'));await win.webContents.executeJavaScript('wildboundBoot.ready');
 const result=await win.webContents.executeJavaScript(`(async()=>{try{
 window.requestAnimationFrame=()=>0;
 const {Game}=await import('./src/core.mjs'),{Assets}=await import('./src/assets.mjs'),{Renderer}=await import('./src/render.mjs'),{DEFAULT_APPEARANCE}=await import('./src/appearance.mjs');
 const {paintSwordCharge}=await import('./src/sword-feel.mjs'),{drawBowAim}=await import('./src/bow-aim.mjs');
 const {defaultHouse}=await import('./src/house-design.mjs'),{drawHouseRoof,houseRoofSections,houseRoofCacheStats}=await import('./src/house-roof.mjs');
 const {drawChristmasTree,drawChristmasGift,unwrapChristmasGift}=await import('./src/holiday-decor.mjs');
 const {defaultTrainDesign,trainInterior}=await import('./src/train-design.mjs'),{drawTrainCar,drawTrainForeground,drawTrainTableForeground}=await import('./src/train-art.mjs');
 const {enterWildLands}=await import('./src/wild-lands.mjs'),{railwayStations,stationSubjects,drawStationGround,drawStationSubject,stationHouse,stationBlocked}=await import('./src/railway-station.mjs');
 const {stationEntrance}=await import('./src/station-building.mjs');
 const checks=[],images={},ok=(v,m)=>{if(!v)throw Error(m);checks.push(m);};
 const assets=new Assets();await assets.load();const g=new Game(()=>.5),p=g.addPlayer('keyboard','SCOUT');g.environment='house';g.start();g.persist=()=>{};g.onSound=()=>{};g.openingBoard=false;g.weather=null;g.event=null;g.enemies=[];g.time=2;g.sky.elapsed=100;g.spriteLibrary=assets.library;
 const canvas=document.createElement('canvas');canvas.width=1280;canvas.height=850;canvas.style.cssText='width:1280px;height:850px';document.body.replaceChildren(canvas);const renderer=new Renderer(canvas,assets);renderer.dynamicShadows=false;
 const sheet=(w,h,bg='#344b40')=>{const a=document.createElement('canvas');a.width=w;a.height=h;const c=a.getContext('2d');c.fillStyle=bg;c.fillRect(0,0,w,h);return [a,c];};
 // The same actual held actors on grass and sand at partial/full charge.
 const [telegraphs,c]=sheet(1440,840);const types=['sword','fire_wand','ice_wand','healing_wand'];
 for(let row=0;row<4;row++)for(let col=0;col<2;col++){
  const a={...p,x:70+col*720,y:150+row*205,hp:100,equipment:{hand1:types[row]},appearance:{...DEFAULT_APPEARANCE,shirt:'#497c6a'},charge:col?1.2:.3,faceX:1,faceY:0,holdingPosition:true,swordChargeAim:row===0,bowAiming:row!==0};
  c.save();c.beginPath();c.rect(col*720,row*205,720,205);c.clip();c.fillStyle=row%2?'#b5a078':'#3a5645';c.fillRect(col*720,row*205,720,205);if(row===0)paintSwordCharge(c,a,.8);else drawBowAim(c,a,1,.8);renderer.animator.draw(c,a,.8,43);c.restore();
  c.fillStyle='#f4e5b9';c.font='14px sans-serif';c.fillText(types[row]+' · '+(col?'fully charged':'partial charge'),col*720+25,row*205+30);ok(true,'held ground preview '+types[row]+' '+col);
 }images.telegraphs=telegraphs.toDataURL();
 // Real release input, swept body damage and one-hit behavior in all directions.
 const house=g.house;g.house=null;g.scenery=[];g.terrain.fill('grass');
 for(let d=0;d<8;d++){
  const a=d*Math.PI/4,dx=Math.cos(a),dy=Math.sin(a);Object.assign(p,{x:400,y:400,equipment:{hand1:'sword'},faceX:dx,faceY:dy,attack:0,charge:0,previousInput:{},invincible:true});
  const enemy={id:900+d,kind:'skeleton',x:400+dx*95-dy*20,y:400+dy*95+dx*20,hp:1000,maxHp:1000,speed:0,damage:0,frozen:100,state:'hunt',cooldown:99};g.enemies=[enemy];
  for(let i=0;i<60;i++)g.update(.02,{keyboard:{attack:true,holdPosition:true,aimX:dx,aimY:dy}});let hits=0,hp=enemy.hp;
  for(let i=0;i<45;i++){g.update(.02,{keyboard:{holdPosition:true,aimX:dx,aimY:dy}});if(enemy.hp<hp)hits++;hp=enemy.hp;}
  ok(hits===1&&enemy.hp<1000,'real swept sword damages overlapping body once '+d);
 }
 g.enemies=[];g.house=house;g.generatedEnvironment='house';Object.assign(p,{x:800,y:1200,swordChargeAim:false,charge:0,attack:0,holdingPosition:false,bowAiming:false});renderer.camera={x:750,y:900,zoom:.4};renderer.draw(g,0);images['house-exterior']=canvas.toDataURL();ok(houseRoofSections(g).every(s=>s.visible),'roof visible outside');g.sky.elapsed=350;renderer.draw(g,0);images['house-exterior-night']=canvas.toDataURL();g.sky.elapsed=100;
 Object.assign(p,{x:650,y:850});renderer.camera={x:670,y:805,zoom:1.5};renderer.draw(g,0);images['house-interior']=canvas.toDataURL();ok(!houseRoofSections(g)[0].visible,'roof cuts away inside left room');
 const tree=house.furniture.find(f=>f.kind==='christmas_tree'),gift=house.furniture.find(f=>f.kind==='wrapped_gift');ok(tree&&gift&&tree.x+tree.w<700,'tree and gift in room left of board');
 const [decor,dc]=sheet(600,680);dc.save();dc.translate(-tree.x*4+150,-tree.y*4+360);dc.scale(4,4);drawChristmasTree(dc,tree);drawChristmasGift(dc,gift);dc.restore();images['tree-gift']=decor.toDataURL();
 Object.assign(p,{x:gift.x+10,y:gift.y+25});ok(unwrapChristmasGift(g,p,gift),'real gift opens');ok(g.loot.filter(l=>l.source==='Christmas surprise').length===1,'exactly one surprise reward dropped');ok(!unwrapChristmasGift(g,p,gift),'opened gift cannot reroll');
 renderer.draw(g,0);images['gift-opened']=canvas.toDataURL();ok(houseRoofCacheStats().pixels<=houseRoofCacheStats().limit,'roof cache bounded');
 // Actual train art and native seated characters, over all eight view angles.
 let tablePixelChanges=0;const design=defaultTrainDesign(),[tables,tc]=sheet(1600,900,'#344849'),[wreaths,wc]=sheet(1440,720,'#344849');
 for(let d=0;d<8;d++){
  const car={...design.cars[2],index:2,x:0,y:0,z:0,a:Math.PI/2+d*Math.PI/4},table=trainInterior(design,car).find(o=>o.kind==='table'),seats=trainInterior(design,car).filter(o=>o.kind==='seat').slice(0,2);
  const ca=Math.cos(car.a),sa=Math.sin(car.a);tc.save();tc.beginPath();tc.rect(d%4*400,Math.floor(d/4)*450,400,450);tc.clip();tc.translate(d%4*400+200,Math.floor(d/4)*450+230);tc.scale(2,2);tc.translate(-(ca*table.x-sa*table.y),-(sa*table.x+ca*table.y));
  const riders=seats.map(seat=>({x:seat.x,y:seat.y,seat:seat.id,height:0})),opts={roofAlpha:0,riders,time:1,cocoaTaken:new Set()};drawTrainCar(tc,design,car,opts);
  for(const [i,seat]of seats.entries()){
   const pos={x:ca*seat.x-sa*seat.y,y:sa*seat.x+ca*seat.y},actor={...p,id:100+i,x:pos.x,y:pos.y-20,room:null,appearance:{...DEFAULT_APPEARANCE,shirt:i?'#b96352':'#5c8db2'},faceX:Math.cos(car.a+seat.facing*Math.PI/2),faceY:Math.sin(car.a+seat.facing*Math.PI/2),animationAction:'train_sit',attack:0,moving:false};
   renderer.animator.draw(tc,actor,1,43);const before=tc.getImageData(d%4*400,Math.floor(d/4)*450,400,450).data;drawTrainTableForeground(tc,design,car,riders[i],opts);const after=tc.getImageData(d%4*400,Math.floor(d/4)*450,400,450).data;if(after.some((v,j)=>v!==before[j]))tablePixelChanges++;drawTrainForeground(tc,design,car,opts);
  }tc.restore();tc.fillStyle='#e8d7a9';tc.font='14px sans-serif';tc.fillText('Seated tables · view '+d,d%4*400+15,Math.floor(d/4)*450+28);ok(true,'native seated table overlay '+d);
  wc.save();wc.beginPath();wc.rect(d%4*360,Math.floor(d/4)*360,360,360);wc.clip();wc.translate(d%4*360+170,Math.floor(d/4)*360+210);wc.scale(1.2,1.2);drawTrainCar(wc,design,{...design.cars[0],index:0,x:0,y:0,z:0,a:car.a},{time:1,roofAlpha:1});wc.restore();ok(true,'attached front wreath '+d);
 }ok(tablePixelChanges>=6,'table foreground actually covers native seated pixels across angles');images['seated-tables']=tables.toDataURL();images.wreath=wreaths.toDataURL();
 ok(enterWildLands(g).ok,'entered actual Wild Lands');g.trainTest.preparing=false;const d=g.trainTest.design,worlds=railwayStations(d),[stations,sc]=sheet(1800,1440,'#415947');
 for(const [i,world]of worlds.entries()){
  const s=world.station,entry=stationEntrance(s);ok(world._stationContext.angle===0&&!stationBlocked(d,entry.x,entry.y,6),'upright station with real accessible entrance '+s.name);
  const x=(i%2)*900,y=Math.floor(i/2)*360;sc.save();sc.beginPath();sc.rect(x,y,900,360);sc.clip();sc.translate(x+450,y+170);sc.scale(.9,.9);sc.translate(-s.x,-s.y);drawStationGround(sc,world,1);
  for(const o of stationSubjects(world,1,g.trainTest.stationCats).sort((a,b)=>a.depth-b.depth))drawStationSubject(sc,world,o,1,renderer,[],g);
  sc.restore();sc.fillStyle='#f4e1aa';sc.font='15px sans-serif';sc.fillText(s.name+' · entrance '+s.doorSide,x+20,y+26);
 }images.stations=stations.toDataURL();
 return {checks,images,roofCache:houseRoofCacheStats()};
 }catch(e){throw Error(e.stack)}})()`);
 for(const [name,data]of Object.entries(result.images))fs.writeFileSync(path.join(out,name+'.png'),Buffer.from(data.split(',')[1],'base64'));delete result.images;
 if(errors.length)throw Error(errors.join('\n'));const report={passed:result.checks.length,failed:0,...result,muted:win.webContents.isAudioMuted(),errors};fs.writeFileSync(path.join(out,'report.json'),JSON.stringify(report,null,2));console.log(JSON.stringify(report));clearTimeout(deadline);app.exit(0);
 }catch(e){console.error(e.stack,errors);clearTimeout(deadline);app.exit(1);}});
