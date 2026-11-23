const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '..');

if (!process.versions.electron) {
  const env = {...process.env};
  delete env.ELECTRON_RUN_AS_NODE;
  const result = require('node:child_process').spawnSync(
    path.join(root, 'node_modules/electron/dist/electron.exe'),
    [__filename, '--mute-audio'],
    {cwd: root, env, encoding: 'utf8', timeout: 180000},
  );
  process.stdout.write(result.stdout || '');
  process.stderr.write(result.stderr || '');
  process.exit(result.status ?? 1);
}

const {app, BrowserWindow} = require('electron');
const resources = process.env.WILDBOUND_VERIFY_APP || root;
const label = process.env.WILDBOUND_CAVE_CAPTURE || (process.env.WILDBOUND_VERIFY_APP ? 'packaged' : 'source');
const output = path.join(root, 'test-output/cavern-edges', label);
fs.mkdirSync(output, {recursive: true});
app.setPath('userData', fs.mkdtempSync(path.join(output, 'profile-')));
app.commandLine.appendSwitch('mute-audio');
const deadline = setTimeout(() => app.exit(1), 170000);

app.whenReady().then(async () => {
  const window = new BrowserWindow({show: false, width: 1280, height: 850, webPreferences: {backgroundThrottling: false}});
  window.webContents.setAudioMuted(true);
  const errors = [];
  window.webContents.on('console-message', info => {
    if (info.level === 'error') errors.push(info.message);
  });
  try {
    await window.loadFile(path.join(resources, 'index.html'));
    await window.webContents.executeJavaScript('window.wildboundBoot.ready');
    const result = await window.webContents.executeJavaScript(`(async () => {
      window.requestAnimationFrame=()=>0;
      window.Worker=undefined;
      const {Assets}=await import('./src/assets.mjs');
      const {Game}=await import('./src/core.mjs');
      const {Renderer}=await import('./src/render.mjs');
      const {drawRealmGround}=await import('./src/realm-art.mjs');
      const {drawOldWellRoom,enterOldWell,generateWellTunnels,wellTunnelBlocked}=await import('./src/old-well.mjs');
      const {enterWildLands}=await import('./src/wild-lands.mjs');
      const {wildLandsTravel,wildLandsInteract,wildLandsBlocked}=await import('./src/wild-lands-world.mjs');
      const {nativeWildTile,drawNativeWildTile}=await import('./src/wild-native-biomes.mjs');
      const {installCavernRoomSlice}=await import('./src/cavern-room-slice.mjs');
      const rock=await import('./src/cave-wall-art.mjs').catch(()=>null);
      const floorArt=await import('./src/cave-floor-art.mjs').catch(()=>null);
      const assets=new Assets();await assets.load();
      const checks=[],images={};
      const check=(okay,message)=>{if(!okay)throw Error(message);checks.push(message);};
      const surface=(w,h)=>{const canvas=document.createElement('canvas');canvas.width=w;canvas.height=h;
        canvas.style.cssText='width:'+w+'px;height:'+h+'px';document.body.append(canvas);return canvas;};
      const makeGame=environment=>{
        const g=new Game(()=>.5,{deferWorld:true});g.environment=environment;g.seed=42;
        const p=g.addPlayer('keyboard','Cave review');g.start();g.phase='play';g.openingBoard=false;
        g.persist=()=>{};g.onSound=()=>{};g.weather=null;g.time=12;g.bloom=3;g.enemies=[];g.supplyChests=[];
        g.spriteLibrary=assets.library;
        p.equipment={...p.equipment,hand1:'lantern'};
        return {g,p};
      };
      const fillFrame=(canvas,renderer,g,x,y,zoom)=>{
        renderer.camera={x,y,zoom};renderer.draw(g,0);
        return canvas.toDataURL();
      };
      const canvas=surface(1280,850),r=new Renderer(canvas,assets);
      const hollow=makeGame('caverns');
      const state=hollow.g.terrain.join(',');
      let boundary;
      for(let y=8;y<42&&!boundary;y++)for(let x=13;x<35;x++){
        const at=32*y+16,wx=32*x+16,index=y*50+x;
        if(hollow.g.terrain[index]==='cave_floor'&&hollow.g.terrain[index-50]==='cave_void'
          &&!hollow.g.blocked(wx,at,10)){boundary={x:wx,y:at};break;}
      }
      check(boundary,'Hollowdeep has a clear position by a solid wall');
      Object.assign(hollow.p,{x:boundary.x,y:boundary.y+6});
      const wallY=boundary.y-32;
      check(hollow.g.blocked(boundary.x,wallY,7),'Hollowdeep wall blocks at original tile');
      images.hollowdeep=fillFrame(canvas,r,hollow.g,boundary.x+10,boundary.y+24,1.65);
      check(state===hollow.g.terrain.join(','),'Drawing does not mutate generated terrain');
      const wallInspector=surface(768,512),wallPen=wallInspector.getContext('2d');
      const sx=Math.floor(boundary.x/32)-6,sy=Math.floor(boundary.y/32)-4;
      wallPen.scale(2,2);wallPen.translate(-sx*32,-sy*32);
      drawRealmGround(wallPen,hollow.g,{sx,sy,ex:sx+11,ey:sy+7});
      r.animator.draw(wallPen,hollow.p,12,43);
      images.hollowdeepWall=wallInspector.toDataURL();

      const caveSlice=makeGame('caverns');
      const slice=installCavernRoomSlice(caveSlice.g,assets,r);
      Object.assign(caveSlice.p,slice.spawn);
      images.cavernSlice=fillFrame(canvas,r,caveSlice.g,490,790,1.25);
      check(!caveSlice.g.blocked(caveSlice.p.x,caveSlice.p.y,10),'Authored cavern slice keeps a clear arrival');
      check(slice.tunnel.every(q=>!caveSlice.g.blocked(q.x,q.y,10)),'Authored cavern passage remains traversable');

      const well=makeGame('forest'),s=generateWellTunnels(42,{authored:false});
      const portal={id:'cavern-wall-review-well',oldWell:true,x:well.p.x,y:well.p.y,well:s};
      well.g.portals.push(portal);
      check(enterOldWell(well.g,well.p,portal),'Enter regular Old Well through actual portal logic');
      const wellImage=surface(1000,680),wellPen=wellImage.getContext('2d');
      drawOldWellRoom(wellPen,well.g,well.p,r.animator,{width:1000,height:680,top:24,bottom:24,zoom:1.65});
      images.oldWell=wellImage.toDataURL();
      check(!wellTunnelBlocked(s,well.p.roomX,well.p.roomY),'Old Well arrival clearance');
      const wall=s.tiles.findIndex((value,i)=>!value&&s.tiles[i+s.width]);
      check(wall>=0&&wellTunnelBlocked(s,(wall%s.width)*16+8,Math.floor(wall/s.width)*16+8),'Old Well wall retains collision');

      const wild=makeGame('forest');
      check(enterWildLands(wild.g).ok,'Enter the normal Wild Lands');
      check(wildLandsTravel(wild.g,'caverns').ok,'Travel to the cavern gate');
      const party=wild.g.players[0],t=wild.g.trainTest;
      check(wildLandsInteract(wild.g,party)&&t.design.activeRoom==='caverns','Cross the actual Wild Lands cavern gate');
      let wallSpot;
      for(let y=5280;y<5632&&!wallSpot;y+=32)for(let x=7680;x<8272;x+=32){
        if(nativeWildTile(t,x+16,y+16)==='cave_void'&&nativeWildTile(t,x+16,y+48)==='cave_floor'){
          wallSpot={x,y};break;
        }
      }
      check(wallSpot&&wildLandsBlocked(t.design,wallSpot.x+16,wallSpot.y+16,t),'Wild Lands collision uses the painted cave boundary');
      const wildImage=surface(1000,680),wildPen=wildImage.getContext('2d');
      const left=wallSpot.x-256,top=wallSpot.y-160;
      for(let y=top;y<top+384;y+=32)for(let x=left;x<left+544;x+=32)drawNativeWildTile(wildPen,t,x,y,left,top,.56);
      images.wildLandsWall=wildImage.toDataURL();
      if(rock){
        const stamp=surface(54,54).getContext('2d',{willReadFrequently:true});
        for(const style of ['limestone','well']){
          const size=style==='well'?16:32;
          for(let mask=1;mask<16;mask++){
            stamp.clearRect(0,0,54,54);
            rock.drawCaveWallCell(stamp,11,11,size,mask,42,mask,5,style);
            const data=stamp.getImageData(0,0,54,54).data;
            for(let y=0;y<54;y++)for(let x=0;x<54;x++){
              const alpha=data[(y*54+x)*4+3];
              if(alpha&&(x<11||y<11||x>=11+size||y>=11+size))throw Error('Wall paint leaves solid tile '+style+' '+mask);
            }
          }
        }
        check(true,'Both materials and all 15 exposed edge combinations leave walkable pixels clear');
        const cache=rock.caveWallCacheStats();
        check(cache.surfaces>0&&cache.surfaces<=cache.limit,'Cave wall cache remains bounded');
      }
      if(floorArt){
        const stamp=surface(54,54).getContext('2d',{willReadFrequently:true});
        for(const [style,size] of [['limestone',32],['well',16]])for(let mask=0;mask<16;mask++){
          stamp.clearRect(0,0,54,54);
          floorArt.drawCaveFloorCell(stamp,11,11,size,42,mask-8,5,{mask,hallway:(mask&5)===5},style);
          const data=stamp.getImageData(0,0,54,54).data;
          for(let y=0;y<54;y++)for(let x=0;x<54;x++){
            const alpha=data[(y*54+x)*4+3],inside=x>=11&&y>=11&&x<11+size&&y<11+size;
            if(alpha!==(inside?255:0))throw Error('Cave floor loses its tile footprint '+style+' '+mask);
          }
        }
        check(true,'Floor texture and edge shade stay in the original dry tile for both sizes and all masks');
        const whole=surface(384,256).getContext('2d',{willReadFrequently:true});
        const single=surface(384,256).getContext('2d',{willReadFrequently:true});
        for(const pen of [whole,single])pen.translate(-sx*32,-sy*32);
        drawRealmGround(whole,hollow.g,{sx,sy,ex:sx+11,ey:sy+7});
        for(let ty=sy;ty<sy+8;ty++)for(let tx=sx;tx<sx+12;tx++){
          single.save();single.beginPath();single.rect(tx*32,ty*32,32,32);single.clip();
          drawRealmGround(single,hollow.g,{sx:tx,sy:ty,ex:tx,ey:ty});single.restore();
        }
        const areaA=whole.getImageData(0,0,384,256).data,areaB=single.getImageData(0,0,384,256).data;
        for(let ty=0;ty<8;ty++)for(let tx=0;tx<12;tx++){
          if(hollow.g.terrain[(sy+ty)*50+sx+tx]!=='cave_floor')continue;
          for(let y=ty*32;y<(ty+1)*32;y++)for(let x=tx*32;x<(tx+1)*32;x++){
            const i=(y*384+x)*4;
            if(areaA[i]!==areaB[i]||areaA[i+1]!==areaB[i+1]||areaA[i+2]!==areaB[i+2])throw Error('Single-tile cave floor differs from scenery batch');
          }
        }
        check(true,'Hollowdeep dry-floor pixels match between batched and single-tile draws');
        const cache=floorArt.caveFloorCacheStats();
        check(cache.surfaces>0&&cache.surfaces<=cache.limit,'Cave floor rasters remain in the bounded cache');
      }
      return {checks,images};
    })()`);
    for (const [name, url] of Object.entries(result.images)) {
      fs.writeFileSync(path.join(output, name + '.png'), Buffer.from(url.split(',')[1], 'base64'));
    }
    const report = {passed: result.checks.length, checks: result.checks, muted: window.webContents.isAudioMuted(), errors};
    fs.writeFileSync(path.join(output, 'report.json'), JSON.stringify(report, null, 2));
    console.log(JSON.stringify(report));
    clearTimeout(deadline);
    app.exit(errors.length ? 1 : 0);
  } catch (error) {
    console.error(error);
    app.exit(1);
  }
});
