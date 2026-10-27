const {app,BrowserWindow}=require('electron'),fs=require('node:fs'),path=require('node:path');
const root=path.resolve(__dirname,'..'),base=process.env.WILDBOUND_VERIFY_APP||root,out=path.join(root,'test-output/forest-understory-review');
fs.mkdirSync(out,{recursive:true});app.setPath('userData',fs.mkdtempSync(path.join(out,'profile-')));
app.whenReady().then(async()=>{
 const w=new BrowserWindow({show:false,width:1280,height:850,webPreferences:{backgroundThrottling:false}});w.webContents.setAudioMuted(true);const errors=[];
 w.webContents.on('console-message',e=>{if(e.level==='error')errors.push(e.message);});
 try{
  await w.loadFile(path.join(base,'index.html'));await w.webContents.executeJavaScript('window.wildboundBoot.ready');
  const result=await w.webContents.executeJavaScript(`(async()=>{
   const raf=requestAnimationFrame;window.requestAnimationFrame=()=>0;await new Promise(raf);
   const {FOREST_PROP_ASSETS,drawForestAsset}=await import('./src/forest-props.mjs'),{Game}=await import('./src/core.mjs'),{Assets}=await import('./src/assets.mjs'),{Renderer}=await import('./src/render.mjs');
   const {GrassFieldRenderer}=await import('./src/grass-field.mjs'),{vegetationWindStrength}=await import('./src/vegetation-motion.mjs'),{drawJungleFern}=await import('./src/fern-art.mjs');
   const {meadowAllowed}=await import('./src/pixel-meadow.mjs');
   const checks=[],assert=(v,m)=>{if(!v)throw Error(m);checks.push(m);},images={},assetImages={};
   const atlas=document.createElement('canvas');atlas.width=1100;atlas.height=640;const c=atlas.getContext('2d');c.fillStyle='#bfc9be';c.fillRect(0,0,1100,640);
   let n=0;for(const [id,def]of Object.entries(FOREST_PROP_ASSETS)){
    const a=document.createElement('canvas');a.width=a.height=64;drawForestAsset(a.getContext('2d'),{x:32,y:55,rootY:55,size:64,forestAsset:id},0,{});
    assert(a.getContext('2d').getImageData(0,0,64,64).data.some((v,i)=>i%4===3&&v>0),'Visible named sprite '+id);assetImages[id]=a.toDataURL();
    const x=n%5*220,y=Math.floor(n/5)*160;c.imageSmoothingEnabled=false;c.drawImage(a,x+45,y+4,128,128);c.fillStyle='#243d32';c.font='12px sans-serif';c.fillText(def.name,x+8,y+142);n++;
   }images['forest-props-contact-sheet']=atlas.toDataURL();
   const group=document.createElement('canvas');group.width=720;group.height=240;const f=group.getContext('2d');f.fillStyle='#697c45';f.fillRect(0,0,720,240);f.imageSmoothingEnabled=false;
   for(let i=0;i<7;i++){f.save();f.translate(40+i*96,160+(i%2)*20);f.scale(2,2);drawJungleFern(f,{x:0,y:0,seed:i*137},0);f.restore();}images['fern-group']=group.toDataURL();
   const assets=new Assets();await assets.load();const game=new Game(()=>.5,{deferWorld:true});game.seed=42;game.environment='forest';game.mapMode='boundless';const p=game.addPlayer('keyboard','Woodland QA');p.inventory.push({type:'lantern',qty:1});game.start();game.openingBoard=false;game.time=20;game.sky={elapsed:340};game.bloom=3;game.weather=null;game.spriteLibrary=assets.library;
   const surface=document.createElement('canvas');surface.style.cssText='width:1200px;height:800px';document.body.append(surface);const r=new Renderer(surface,assets);r.setDynamicShadows(true);
   for(const [label,x,y,lift]of [['table-light-left',725,800,0],['table-light-above',800,745,0],['table-light-below',800,850,0],['table-light-raised',725,800,35]]){
    Object.assign(p,{x,y,groundHeight:lift,jumpHeight:0});game.time+=.1;r.camera={x:800,y:800,zoom:2.1};r.draw(game,0);images[label]=surface.toDataURL();
    const source=r.animator.lighting?.sources?.find(s=>s.owner==='actor:'+p.id);assert(source&&source.height>16,'Carried light above tabletop '+label);
   }
   game.sky.elapsed=100;Object.assign(p,{x:1060,y:1110,groundHeight:0});r.camera={x:1060,y:1110,zoom:1.6};r.draw(game,0);images['forest-context']=surface.toDataURL();
   const understory=game.scenery.filter(a=>a.kind==='forest_understory'&&meadowAllowed(game,a.x,a.rootY,8));assert(understory.length>0,'Named understory is integrated on live grass outside carved Boundless entrances');
   const large=game.scenery.filter(a=>['tree','forest_ruin'].includes(a.kind));
   const spot=understory.reduce((best,a)=>{const clearance=Math.min(...large.map(t=>Math.hypot(t.x-a.x,(t.rootY??t.y)-a.y)));return !best||clearance>best.clearance?{a,clearance}:best;},null).a;
   Object.assign(p,{x:spot.x+28,y:spot.y+10,groundHeight:0});r.camera={x:spot.x,y:spot.y,zoom:1.8};r.draw(game,0);images['forest-understory-context']=surface.toDataURL();
   const g=new Game(()=>.5,{deferWorld:true});g.seed=42;g.phase='play';g.generatedEnvironment=g.environment='forest';g.bloom=3;g.time=0;g.terrain=Array(2500).fill('grass');g.forestLandscape={routeField:new Float32Array(10000).fill(200)};g.scenery=[{id:'cut',kind:'tall_grass',x:450,y:468,rootY:500,size:80,tuftSeed:17}];
   const actor=g.addPlayer('keyboard','Trail QA');Object.assign(actor,{x:400,y:500,moving:true});const field=new GrassFieldRenderer(),s=document.createElement('canvas');s.width=1000;s.height=500;const pen=s.getContext('2d'),camera={x:480,y:500,zoom:1};
   const draw=()=>{pen.setTransform(4,0,0,4,-1420,-1750);pen.fillStyle='#6f8548';pen.fillRect(355,437,250,126);field.draw(pen,g,camera,250,125);pen.setTransform(1,0,0,1,0,0);};
   draw();images['grass-uncut']=s.toDataURL();const count=field.instances;g.scenery[0].cut=true;g.time=.1;draw();images['grass-cut-low-layer']=s.toDataURL();assert(field.instances===count,'Cut preserves low grass geometry');
   for(let i=0;i<30;i++){g.time=.2+i*.05;actor.x=400+i*5;draw();}actor.moving=false;actor.x=700;g.time=1.8;draw();images['grass-parted-trail']=s.toDataURL();assert(field.wake.points.length>10,'Moving hero leaves a recovering wake');
   const pressure=()=>field.wake.data.reduce((n,v,i)=>n+(i%4===0?v:0),0),fresh=pressure();g.time=3.2;draw();assert(pressure()>0&&pressure()<fresh,'Trail slowly closes after departure');g.time=6.1;draw();images['grass-recovered']=s.toDataURL();assert(pressure()===0,'Trail recovers without permanent scars');
   g.weather={type:'thunderstorm',duration:45,life:40,intensity:1};g.time=6.2;draw();images['grass-storm']=s.toDataURL();assert(vegetationWindStrength(g)>3,'Storm amplifies shared vegetation breeze');assert(field.gl.getError()===0,'Grass wake shader has no WebGL errors');
   return {checks,images,assetImages,manifest:Object.fromEntries(Object.entries(FOREST_PROP_ASSETS).map(([id,v])=>[id,{...v,file:id+'.png',width:64,height:64,pivot:[32,55]}]))};
  })()`);
  for(const [name,data]of Object.entries(result.images))fs.writeFileSync(path.join(out,name+'.png'),Buffer.from(data.split(',')[1],'base64'));
  const target=process.env.WILDBOUND_EXPORT_FOREST_ASSETS?path.join(root,'assets/forest-understory'):path.join(out,'named-assets');fs.mkdirSync(target,{recursive:true});
  for(const [id,data]of Object.entries(result.assetImages))fs.writeFileSync(path.join(target,id+'.png'),Buffer.from(data.split(',')[1],'base64'));
  fs.writeFileSync(path.join(target,'manifest.json'),JSON.stringify({nativeModule:'src/forest-props.mjs',assets:result.manifest},null,2));delete result.images;delete result.assetImages;result.errors=errors;
  fs.writeFileSync(path.join(out,'report.json'),JSON.stringify(result,null,2));console.log(JSON.stringify({checks:result.checks,errors}));app.exit(errors.length?1:0);
 }catch(e){console.error(e);app.exit(1);}
});
