const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '..');

if (!process.versions.electron) {
  const env = {...process.env};
  delete env.ELECTRON_RUN_AS_NODE;
  const run = require('node:child_process').spawnSync(
    path.join(root,'node_modules/electron/dist/electron.exe'),
    [__filename,'--mute-audio'], {cwd:root,env,encoding:'utf8',timeout:150000},
  );
  process.stdout.write(run.stdout||'');
  process.stderr.write(run.stderr||'');
  process.exit(run.status??1);
}

const {app,BrowserWindow} = require('electron');
const appRoot = process.env.WILDBOUND_VERIFY_APP || root;
const baseline = process.env.WILDBOUND_INTERIOR_BASELINE === '1';
const out = path.join(root,'test-output/interior-finish',
  baseline?'before':appRoot===root?'source':'packaged');
fs.mkdirSync(out,{recursive:true});
app.setPath('userData',fs.mkdtempSync(path.join(out,'profile-')));
app.commandLine.appendSwitch('mute-audio');
const watchdog = setTimeout(()=>app.exit(1),140000);

app.whenReady().then(async()=>{
  const win = new BrowserWindow({show:false,width:1280,height:850,webPreferences:{backgroundThrottling:false}});
  const errors=[];
  win.webContents.setAudioMuted(true);
  win.webContents.on('console-message',entry=>{if(entry.level==='error')errors.push(entry.message);});
  try {
    await win.loadFile(path.join(appRoot,'index.html'));
    await win.webContents.executeJavaScript('wildboundBoot.ready');
    const data=await win.webContents.executeJavaScript(`(async()=>{
      window.requestAnimationFrame=()=>0;
      window.Worker=undefined;
      const baseline=${baseline};
      const {Game}=await import('./src/core.mjs');
      const {Assets}=await import('./src/assets.mjs');
      const {Renderer}=await import('./src/render.mjs');
      const {drawExpansion,structureBlocked}=await import('./src/expansion.mjs');
      const {defaultHouse}=await import('./src/house-design.mjs');
      const {houseRoofSections}=await import('./src/house-roof.mjs');
      const {drawStorageBackdrop}=await import('./src/storage-art.mjs');
      const {drawUpperSanctum}=await import('./src/temple-upper-art.mjs');
      const {wildLandmarkBuildings,drawWildBuildingGround,wildBuildingSubjects,drawWildBuildingSubject}=await import('./src/wild-landmark-buildings.mjs');
      const {enterWildLands}=await import('./src/wild-lands.mjs');
      const {drawRoomScene}=await import('./src/hero-ui.mjs');
      const assets=new Assets();
      await assets.load();
      const g=new Game(()=>.5),p=g.addPlayer('keyboard','Willow');
      g.environment='house';g.start();g.house=defaultHouse();g.generatedEnvironment='house';
      g.weather=null;g.event=null;g.enemies=[];g.time=2;g.sky.elapsed=100;
      g.openingBoard=false;g.onSound=()=>{};g.persist=()=>{};g.spriteLibrary=assets.library;
      const images={},checks=[];
      const ok=(value,label)=>{if(!value)throw Error(label);checks.push(label);};
      const canvas=document.createElement('canvas');
      canvas.style.cssText='width:1280px;height:850px';document.body.replaceChildren(canvas);
      const renderer=new Renderer(canvas,assets);renderer.dynamicShadows=false;
      const native=canvas.getContext('2d');
      function canvasScene(name,w,h,x,y,zoom,paint){
        const scene=document.createElement('canvas');scene.width=w;scene.height=h;
        const c=scene.getContext('2d');c.imageSmoothingEnabled=false;
        c.fillStyle='#394d43';c.fillRect(0,0,w,h);
        c.translate(w/2,h/2);c.scale(zoom,zoom);c.translate(-x,-y);
        paint(c);
        images[name]=scene.toDataURL();
      }
      Object.assign(p,{x:800,y:1150,faceX:0,faceY:-1});
      renderer.camera={x:790,y:985,zoom:.72};renderer.draw(g,0);
      ok(houseRoofSections(g).every(s=>s.visible),'Villa roofs remain visible from outside');
      Object.assign(p,{x:780,y:526,faceX:0,faceY:1});
      renderer.camera={x:792,y:589,zoom:1.18};renderer.draw(g,0);
      ok(!houseRoofSections(g)[0].visible,'Standing inside opens the main villa roof');
      images['villa-gameplay']=canvas.toDataURL();
      canvasScene('villa-interior',1180,820,788,609,1.47,c=>{
        drawExpansion(c,g,()=>true,{floorOnly:true});
        drawExpansion(c,g,()=>true,{structuresOnly:true});
        renderer.animator.draw(c,p,g.time,43);
      });
      ok(!structureBlocked(g,790,551,7),'Finished central villa gallery remains walkable');
      const solid=g.house.walls.find(w=>w.kind==='wall'&&w.y===480&&w.w>=35);
      ok(solid&&structureBlocked(g,solid.x+solid.w/2,solid.y+solid.h/2,7),'Existing villa wall remains solid');
      if(!baseline){
        const {drawHouseInteriorWalls}=await import('./src/house-interior-art.mjs');
        const probe=document.createElement('canvas');probe.width=168;probe.height=110;
        const c=probe.getContext('2d',{willReadFrequently:true});
        const wall={kind:'wall',x:20,y:55,w:120,h:10,sectionDamage:{1:{broken:true,damage:200}}};
        const house={floors:[{x:20,y:55,w:120,h:40}],walls:[wall]};
        drawHouseInteriorWalls(c,house,[{x:52,y:74,hp:1}]);
        const pixel=(x,y)=>c.getImageData(x,y,1,1).data[3];
        ok(pixel(36,37)>0&&pixel(69,37)===0&&pixel(111,37)>0,'Wall face stays open through a destroyed center cell');
        wall.destroyed=true;c.clearRect(0,0,168,110);drawHouseInteriorWalls(c,house,[{x:52,y:74,hp:1}]);
        ok(pixel(36,37)===0,'Fully destroyed wall has no detached decorative face');
        wall.destroyed=false;c.clearRect(0,0,168,110);drawHouseInteriorWalls(c,house,[{x:6,y:6,hp:1}]);
        ok(pixel(36,37)===0,'Projected faces appear only in an active house cutaway');
      }
      canvasScene('storage-room',960,720,160,120,3,c=>{
        const id='verified-storage';
        const actor={...p,room:id,roomX:160,roomY:130};
        const room={id,owner:p.id};
        g.players=[actor];
        drawRoomScene(c,g,actor,room,renderer);
        g.players=[p];
      });
      canvasScene('jade-sanctum',960,720,160,120,3,c=>{
        drawUpperSanctum(c,g,null);
        renderer.animator.draw(c,{...p,x:160,y:158},g.time,43);
      });
      ok(enterWildLands(g).ok,'Wild Lands landmark source can load through normal world entry');
      const d=g.trainTest.design,party=g.players[0];
      for(const h of wildLandmarkBuildings(d)){
        const f=h.floors[0],x=f.x+f.w/2,y=f.y+Math.min(142,f.h/2);
        const bounds={left:x-430,top:y-310,right:x+430,bottom:y+310};
        canvasScene(h.id+'-landmark',1050,740,x,y,1.23,c=>{
          drawWildBuildingGround(c,d,bounds);
          for(const item of wildBuildingSubjects(d))if(item.x>=bounds.left&&item.x<=bounds.right&&item.y>=bounds.top&&item.y<=bounds.bottom)drawWildBuildingSubject(c,g,item);
          renderer.animator.draw(c,{...party,x,y},g.time,43);
        });
        ok(images[h.id+'-landmark'].startsWith('data:image/png'),'Rendered live landmark '+h.id);
      }
      ok(native.canvas.width>0,'Native game canvas remained available through all scene changes');
      return {checks,images};
    })()`);
    for (const [name,image] of Object.entries(data.images)) {
      fs.writeFileSync(path.join(out,name+'.png'),Buffer.from(image.split(',')[1],'base64'));
    }
    if(errors.length)throw Error(errors.join('\n'));
    const report={passed:data.checks.length,checks:data.checks,errors,muted:win.webContents.isAudioMuted()};
    fs.writeFileSync(path.join(out,'report.json'),JSON.stringify(report,null,2));
    console.log(JSON.stringify(report));
    clearTimeout(watchdog);
    app.exit(0);
  } catch(error) {
    fs.writeFileSync(path.join(out,'failure.json'),JSON.stringify({message:error.message,errors},null,2));
    console.error(error);
    app.exit(1);
  }
});
