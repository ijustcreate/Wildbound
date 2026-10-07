// Actual Electron rendering and integrated game input in an isolated save profile.
const {app,BrowserWindow}=require('electron'),fs=require('node:fs'),path=require('node:path');
const root=path.resolve(__dirname,'..'),base=process.env.WILDBOUND_VERIFY_APP||root,out=path.join(root,'test-output','house-finale');
fs.mkdirSync(out,{recursive:true});app.disableHardwareAcceleration();app.setPath('userData',fs.mkdtempSync(path.join(out,'profile-')));
const timer=setTimeout(()=>app.exit(1),110000);
app.whenReady().then(async()=>{
 const w=new BrowserWindow({show:false,width:1280,height:900,useContentSize:true,webPreferences:{offscreen:true}}),errors=[];
 w.webContents.on('console-message',event=>{if(event.level==='error')errors.push(event.message);});
 const run=s=>w.webContents.executeJavaScript('(async()=>{'+s+'})()');
 try{
  await w.loadFile(path.join(base,'index.html'),{query:{tools:'1'}});
  await run('await window.wildboundBoot.ready;const raf=requestAnimationFrame.bind(window);window.requestAnimationFrame=()=>0;await new Promise(raf);');
  const report=await run(`
   const [{Game,EVENTS},{Renderer},{Assets},{rules},{SealVortex},well,{waterAt}]=await Promise.all([import('./src/core.mjs'),import('./src/render.mjs'),import('./src/assets.mjs'),import('./src/definitions.mjs'),import('./src/seal-vortex.mjs'),import('./src/old-well.mjs'),import('./src/environment.mjs')]);
   const checks=[],check=(v,m)=>{if(!v)throw Error(m);checks.push(m);},pictures={};
   const assets=new Assets();await assets.load();const canvas=document.createElement('canvas');canvas.style='width:1280px;height:900px;position:fixed;left:0;top:0';document.body.append(canvas);
   const g=new Game(()=>.5);g.environment='house';const p=g.addPlayer('keyboard','House QA');g.start();g.openingBoard=false;g.bloom=3;g.time=30;g.event=g.reveal=null;
   Object.assign(p,{x:800,y:870,progress:48});g.house.doors[0].open=true;
   g.enemies=[{id:910,kind:'lion',hp:100,maxHp:100,x:620,y:850,faceX:1,faceY:0,state:'idle',faction:'hostile'},
    {id:911,kind:'lion',hp:80,maxHp:100,x:980,y:880,faceX:-1,faceY:0,state:'idle',faction:'ally',allyOwner:p.id},
    {id:912,kind:'pig',hp:40,maxHp:40,x:600,y:1230,faceX:1,faceY:0,state:'idle',faction:'neutral',wildlife:true}];
   const r=new Renderer(canvas,assets);r.camera={x:800,y:800,zoom:.5};r.draw(g,0);pictures.floorplan=canvas.toDataURL();
   check(g.house.floorplanVersion===2&&g.house.rooms.length===6,'New default six-room layout loads through the real Game');
   const before=JSON.stringify({house:g.house,scenery:g.scenery,terrain:g.terrain});
   check(g.beginSeal(p),'Actual house victory starts');r.sealVortex=new SealVortex({backend:'canvas'});r.draw(g,0);
   check(!!r.sealHouseBackdrop,'Real house backdrop is separated from the enemy warp');
   const backdrop=r.sealHouseBackdrop.toDataURL(),pixels=r.sealVortex.snapshot.getContext('2d').getImageData(0,0,r.sealVortex.snapshot.width,r.sealVortex.snapshot.height).data;
   let occupied=0;for(let i=3;i<pixels.length;i+=4)if(pixels[i])occupied++;
   check(occupied>40&&occupied<pixels.length/4*.12,'Warp layer contains actual hostile art, not opaque scenery');
   const captures=r.sealVortex.stats.captures;
   for(const progress of [.2,.55,.9]){g.sealTime=rules.sealDuration*progress;r.draw(g,0);pictures['seal-'+Math.round(progress*100)]=canvas.toDataURL();check(r.sealHouseBackdrop.toDataURL()===backdrop,'House stays fixed at '+Math.round(progress*100)+'% recall');}
   check(r.sealVortex.stats.captures===captures,'Finale reuses one bounded enemy capture');
   check(r.sealHouseBackdrop.width<=960&&r.sealHouseBackdrop.height<=540,'Preserved-house surface stays bounded');
   g.sealTime=0;while(g.phase==='sealing')g.update(.05,{});
   check(JSON.stringify({house:g.house,scenery:g.scenery,terrain:g.terrain})===before,'Completed victory preserves exact house, trees, yard and open doors');
   check(g.enemies.map(e=>e.id).join(',')==='911,912','Only hostile enemies are removed; friends and ambient animals stay');
   r.draw(g,0);pictures.victory=canvas.toDataURL();check(!r.sealHouseBackdrop&&!r.sealVortex.snapshot,'House finale surfaces are released after completion');
   const pool=g.house.pools[0];Object.assign(p,{x:pool.x+pool.w/2,y:pool.y+pool.h/2,consumeInput:false,jumpHeight:0,groundHeight:0});
   check(waterAt(g,p.x,p.y)==='water','Pool remains water after victory');g.update(.05,{});check(p.swimming,'Integrated won-state player swims in pool');
   for(let n=0;n<15;n++)g.update(.05,{keyboard:{attack:true}});check(p.diveDepth>0,'Pool supports diving after victory');r.camera={x:p.x,y:p.y,zoom:1.4};r.draw(g,0);pictures.pool=canvas.toDataURL();
   for(const env of ['forest','house']){
    const wg=new Game(()=>.37);wg.environment=env;const wp=wg.addPlayer('keyboard','Rope QA');wg.start();wg.openingBoard=false;wg.bloom=3;
    wg.spawnEvent(EVENTS.findIndex(e=>e.kind==='old_well'));const d=wg.portals.find(d=>d.oldWell);Object.assign(wp,{x:d.x,y:d.y+50});
    wg.update(.05,{keyboard:{interact:true}});check(wp.room===d.id,env+' integrated Interact descends into well');
    check(Math.hypot(wp.roomX-d.well.exit.x,wp.roomY-d.well.exit.y)>45,env+' arrival is outside exit zone');
    for(let n=0;n<12;n++){wp.previousInput={};wg.update(.05,{keyboard:{interact:true}});}
    check(wp.room===d.id,env+' held entry input cannot immediately eject player');
    Object.assign(wp,{roomX:d.well.exit.x,roomY:d.well.exit.y,previousInput:{}});wg.update(.05,{keyboard:{interact:true}});check(wp.room===d.id,env+' rope requires releasing arrival button');
    wg.update(.05,{});check(wp.room===d.id,env+' standing under rope never auto-exits');wg.update(.05,{keyboard:{interact:true}});check(wp.room===null,env+' fresh Use/Interact climbs rope out');
   }
   return {checks,pictures,hostileLayerPixels:occupied,hostileLayerFraction:occupied/(pixels.length/4)};
  `);
  for(const [name,png]of Object.entries(report.pictures))fs.writeFileSync(path.join(out,name+'.png'),Buffer.from(png.split(',')[1],'base64'));delete report.pictures;
  if(errors.length)throw Error(errors.join('\n'));fs.writeFileSync(path.join(out,'report.json'),JSON.stringify({...report,base,errors},null,2));console.log(JSON.stringify({...report,errors}));clearTimeout(timer);app.exit(0);
 }catch(e){console.error(e);clearTimeout(timer);app.exit(1);}
});
