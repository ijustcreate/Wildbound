const {app,BrowserWindow}=require('electron'),fs=require('node:fs'),path=require('node:path');
const root=path.resolve(__dirname,'..'),base=process.env.WILDBOUND_VERIFY_APP||root,out=path.join(root,'test-output','world-lighting');
fs.mkdirSync(out,{recursive:true});app.setPath('userData',fs.mkdtempSync(path.join(out,'profile-')));app.disableHardwareAcceleration();
app.whenReady().then(async()=>{
 const win=new BrowserWindow({show:false,width:1200,height:900,webPreferences:{backgroundThrottling:false}});win.webContents.setAudioMuted(true);
 const errors=[];win.webContents.on('console-message',(_e,level,message)=>{if(level===3)errors.push(message);});
 await win.loadFile(path.join(base,'index.html'),{query:{tools:'1'}});await win.webContents.executeJavaScript('window.wildboundBoot.ready');
 const result=await win.webContents.executeJavaScript(`(async()=>{
 const {Game}=await import('./src/core.mjs'),{Assets}=await import('./src/assets.mjs'),{Renderer}=await import('./src/render.mjs');
 const {WorldLightRenderer,worldLightField}=await import('./src/world-lighting.mjs'),{drawProp}=await import('./src/environment.mjs'),{drawNightLight}=await import('./src/night-cycle.mjs');
 const assets=new Assets();await assets.load();const images=[],report=[];
 // A controlled surface proves source-facing tint and a one-sided inner rim
 // without changing a single silhouette alpha pixel.
 const prop={id:'block',kind:'rock',x:70,y:90,rootY:90,size:80},light={x:0,y:70,height:30,radius:240,intensity:1,color:'#ffc76f'};
 const raw=document.createElement('canvas');raw.width=raw.height=140;const rc=raw.getContext('2d');
 const paint=c=>{c.fillStyle='#334b3b';c.fillRect(40,30,60,60);};paint(rc);
 const lit=document.createElement('canvas');lit.width=lit.height=140;new WorldLightRenderer().drawProp(lit.getContext('2d'),prop,paint,{sources:[light],field:worldLightField({scenery:[prop]},[light]),time:1});
 const a=rc.getImageData(0,0,140,140).data,b=lit.getContext('2d').getImageData(0,0,140,140).data;
 let left=0,right=0,alphaChanges=0;for(let y=35;y<85;y++)for(let x=40;x<100;x++){const i=(y*140+x)*4;if(a[i+3]!==b[i+3])alphaChanges++;if(x<43)left+=b[i]-a[i];if(x>=97)right+=b[i]-a[i];}
 if(alphaChanges||left<=right+200)throw Error('Surface/rim direction or alpha preservation failed '+JSON.stringify({left,right,alphaChanges}));
 report.push({directionalRim:{left,right,alphaChanges}});
 // Comparable real prop artwork, no guide lines or special replacement art.
 const scene=document.createElement('canvas');scene.width=960;scene.height=680;const c=scene.getContext('2d');
 const trees=[{id:'left-tree',kind:'tree',x:270,y:250,rootY:420,size:145,procedural:true,treeType:'pine'},{id:'right-tree',kind:'tree',x:650,y:250,rootY:420,size:145,procedural:true,treeType:'oak'},
 {id:'rock',kind:'rock',x:530,y:430,rootY:430,size:80,procedural:true},{id:'bush',kind:'bush',x:350,y:460,rootY:460,size:65,procedural:true}];
 const source={x:460,y:350,height:30,radius:320,intensity:1,color:'#ffc76f'},game={time:1,phase:'play',generatedEnvironment:'forest',sky:{elapsed:330},players:[],scenery:trees};
 const frame={time:1,sources:[source],field:worldLightField(game,[source])},lights=new WorldLightRenderer();
 c.fillStyle='#354c38';c.fillRect(0,0,960,680);lights.drawGround(c,frame);
 for(const p of trees)lights.drawProp(c,p,ctx=>drawProp(ctx,p,0,game,{dynamicShadows:true}),frame);
 drawNightLight(c,game,{x:480,y:340,zoom:1},960,680,null,{occluded:true});images.push({name:'point-light-and-rims',png:scene.toDataURL().split(',')[1]});
 for(const environment of ['forest','desert','ice','temple','house','beach','graveyard','swamp','caverns','shadow']){
  const game=new Game(()=>.2);game.environment=environment;const p=game.addPlayer('keyboard');game.start();game.openingBoard=false;game.bloom=4;game.sky.elapsed=330;game.time=1;
  Object.assign(p,{x:800,y:1100,equipment:{hand1:'lantern'},inventory:[]});game.enemies=[];game.questNpcs=[];game.villagers=[];
  game.scenery=[{kind:environment==='swamp'?'mangrove':environment==='shadow'?'wither_tree':environment==='caverns'?'stalagmite':environment==='ice'?'snow_tree':environment==='beach'?'palm':'tree',id:'tree-a',x:900,y:1100,rootY:1120,size:115,procedural:true},
   {kind:environment==='ice'?'ice_rock':'rock',id:'rock-a',x:720,y:1110,rootY:1110,size:70,procedural:true},{kind:'bush',id:'bush-a',x:850,y:1180,rootY:1180,size:50,procedural:true}];
  const canvas=document.createElement('canvas');Object.assign(canvas.style,{width:'1100px',height:'800px',position:'fixed',left:'0',top:'0'});document.body.append(canvas);
  const renderer=new Renderer(canvas,assets);renderer.dynamicShadows=true;Object.assign(renderer.camera,{x:800,y:1100,zoom:1.4});const times=[];
  for(let i=0;i<6;i++){game.time+=1/30;const begin=performance.now();renderer.draw(game,0);times.push(performance.now()-begin);}
  const count=renderer.animator.lighting.field.volumes.length;if(!count)throw Error(environment+' has no height-aware field');
  report.push({environment,volumes:count,frameMs:times.map(n=>Math.round(n*10)/10),lightCacheBytes:renderer.worldLights.bytes});
  images.push({name:environment,png:canvas.toDataURL().split(',')[1]});canvas.remove();
  if(environment==='forest'){
   document.body.append(canvas);for(let i=0;i<24;i++){const angle=i*2.4,r=150+i%4*30;game.scenery.push({id:'dense-'+i,kind:i%4===0?'bush':'tree',x:800+Math.cos(angle)*r,y:1100+Math.sin(angle)*r,rootY:1100+Math.sin(angle)*r,size:90,procedural:true});}
   const moving=[],parts=[],worldLights=renderer.worldLights;let costs;
   for(const method of ['drawGround','drawProp','drawStructure']){const original=worldLights[method].bind(worldLights);worldLights[method]=(...args)=>{const begin=performance.now(),result=original(...args);costs[method]=(costs[method]||0)+performance.now()-begin;return result;};}
   for(let i=0;i<6;i++){costs={};game.time+=1/30;p.x+=2;const begin=performance.now();renderer.draw(game,0);moving.push(performance.now()-begin);parts.push(costs);}
   renderer.worldLights={drawGround(){},drawProp(c,p,paint){return paint(c);},drawStructure(c,p,paint){return paint(c);}};
   const baseline=[];for(let i=0;i<3;i++){game.time+=1/30;p.x+=2;const begin=performance.now();renderer.draw(game,0);baseline.push(performance.now()-begin);}
   report.push({denseMovingLantern:{props:game.scenery.length,frameMs:moving.map(n=>Math.round(n*10)/10),parts,withoutPointPassMs:baseline}});canvas.remove();
  }
 }
 return {report,images};})()`);
 for(const item of result.images)fs.writeFileSync(path.join(out,item.name+'.png'),Buffer.from(item.png,'base64'));delete result.images;
 result.errors=errors;fs.writeFileSync(path.join(out,'report.json'),JSON.stringify(result,null,2));console.log(JSON.stringify(result));app.exit(errors.length?1:0);
}).catch(e=>{console.error(e);app.exit(1);});
