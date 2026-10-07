const {app,BrowserWindow}=require('electron'),fs=require('node:fs'),path=require('node:path');
const root=path.resolve(__dirname,'..'),label=process.env.WILDBOUND_VERIFY_LABEL||'source';
app.disableHardwareAcceleration();app.setPath('userData',path.join(root,'test-output/insects-desert-magic-profile-'+label));
app.whenReady().then(async()=>{
 const w=new BrowserWindow({show:false,width:1280,height:820,useContentSize:true,webPreferences:{offscreen:true}});
 const run=async source=>{const r=await w.webContents.executeJavaScript('(async()=>{try{return await ('+source+');}catch(e){return {verificationError:e.stack};}})()');if(r?.verificationError)throw Error(r.verificationError);return r;};
 const image=(name,png)=>fs.writeFileSync(path.join(root,'test-output/'+name+'-'+label+'.png'),Buffer.from(png.split(',')[1],'base64'));
 try{
  await w.loadFile(path.join(process.env.WILDBOUND_VERIFY_APP||root,'index.html'),{query:{tools:'1'}});await run('window.wildboundBoot.ready');
  console.log(await run(`(()=>{window.insectRAF=requestAnimationFrame.bind(window);window.requestAnimationFrame=()=>0;return 'Booted real Electron game with shared authored rigs';})()`));
  const result=await run(`(async()=>{
   const {Game,EVENTS}=await import('./src/core.mjs'),{Assets}=await import('./src/assets.mjs'),{Animator}=await import('./src/animation.mjs'),{Renderer}=await import('./src/render.mjs'),{generateWorld}=await import('./src/world.mjs');
   const {rigSubject}=await import('./src/rig-subjects.mjs'),{beastMotions,replaceBeastMotion}=await import('./src/beast-motion.mjs'),{drawMagicBolt,visitMagicTrail,MAGIC_TRAIL_LIMIT}=await import('./src/magic-bolt-render.mjs'),{ITEMS}=await import('./src/items.mjs'),{drawBoard}=await import('./src/board.mjs'),{befriendCreature,tickFriendlyCreature}=await import('./src/friendly-creatures.mjs'),{tickBeeHive,tickBee}=await import('./src/bee-swarm.mjs');
   const assets=new Assets();await assets.load();const animator=new Animator(assets),make=(width,height)=>{const canvas=document.createElement('canvas');canvas.width=width;canvas.height=height;const c=canvas.getContext('2d');c.imageSmoothingEnabled=false;c.fillStyle='#1d302c';c.fillRect(0,0,width,height);return [canvas,c];};
   if(beastMotions.beetle.artGeneration!==2)throw Error('Shipped authored rig still overrides new beetle');
   const [sheet,c]=make(1040,790);c.fillStyle='#e8d3a1';c.font='bold 22px system-ui';c.fillText('JADE SCARAB · EIGHT DIRECTIONS / ARTICULATED MOTION',20,30);
   let poses=0;for(const [row,action]of ['idle','walk','windup','attack','hurt','snared','death'].entries())for(let d=0;d<8;d++){
    const x=65+d*130,y=118+row*96;animator.draw(c,{kind:'beetle',faceX:-Math.sin(d*Math.PI/4),faceY:Math.cos(d*Math.PI/4),x,y,hp:action==='death'?0:55,animationAction:action,playerFrame:action==='death'?9:action==='walk'?8:3},1,115);c.fillStyle='#cbd7c4';c.font='12px system-ui';c.fillText(action+' · '+d,x-32,y+24);poses++;
   }
   const [walk,walkC]=make(1040,270);walkC.fillStyle='#e8d3a1';walkC.font='bold 20px system-ui';walkC.fillText('SIX-LEG TRIPOD GAIT · WALK / RUN',20,26);
   for(let row=0;row<2;row++)for(let f=0;f<8;f++)animator.draw(walkC,{kind:'beetle',x:65+f*130,y:125+row*112,hp:55,faceX:1,faceY:.45,animationAction:row?'run':'walk',playerFrame:f*1.5},0,120);
   const probe=document.createElement('canvas');probe.width=probe.height=160;const pc=probe.getContext('2d'),g=new Game(()=>.42),p=g.addPlayer('pad:0');Object.assign(g,{phase:'play',openingBoard:false,scenery:[],house:null,forestLandscape:null});g.terrain.fill('grass');Object.assign(p,{x:300,y:300});
   const pet={id:700,kind:'beetle',x:490,y:300,hp:55,maxHp:55,speed:90,damage:10,state:'charge',playerFrame:0};g.enemies=[pet];befriendCreature(pet,p.id);const friendFrames=new Set();
   for(let i=0;i<16;i++){tickFriendlyCreature(g,pet,.05);pc.clearRect(0,0,160,160);animator.draw(pc,{...pet,x:80,y:110},i*.05,105);friendFrames.add(probe.toDataURL());}if(friendFrames.size<6)throw Error('Beetle friendship gait still frozen');
   animator.beetleFrames.clear();for(let i=0;i<260;i++)animator.draw(pc,{kind:'beetle',x:80,y:80,hp:55,speed:90,moving:true,faceX:-Math.sin(i*Math.PI/4),faceY:Math.cos(i*Math.PI/4),step:i*.23},i*.07,65);if(animator.beetleFrames.size>128)throw Error('Unbounded pose cache');
   const original=structuredClone(beastMotions.beetle),painted=structuredClone(original);painted.palette.body='#e27866';replaceBeastMotion('beetle',painted);pc.clearRect(0,0,160,160);animator.draw(pc,{kind:'beetle',x:80,y:80,hp:55,faceX:0,faceY:1},0,65);if(animator.beetleFrames.size!==1)throw Error('Edited rig does not invalidate runtime cache');replaceBeastMotion('beetle',original);
   const [spells,sc]=make(1040,640);sc.fillStyle='#e8d3a1';sc.font='bold 22px system-ui';sc.fillText('PIXEL MAGIC · SATURATED CORES / SQUARE-PARTICLE TRAILS',20,30);
   for(const [row,type]of ['starter_wand','wand','fire_wand','ice_wand','necromancer_wand','friendship_wand'].entries()){
    const def=ITEMS[type];sc.fillStyle=def.artColor||def.color;sc.font='15px system-ui';sc.fillText(def.name,20,72+row*94);
    for(let n=0;n<2;n++){sc.save();sc.translate(n?800:80,87+row*94);sc.scale(n?2:3,n?2:3);drawMagicBolt(sc,{x:n?75:200,y:16,vx:260,vy:0,color:def.artColor||def.color,age:.5,size:n?14:6,visualSeed:row*47,friendship:def.friendship,fire:def.spellType==='fire',ice:def.spellType==='ice'});sc.restore();}
    let count=0;visitMagicTrail({x:100,y:100,vx:260,vy:0,age:100,visualSeed:row},()=>count++);if(count>MAGIC_TRAIL_LIMIT||count<25)throw Error('Missing/unbounded pixel trail');
   }
   const [bees,bc]=make(1040,360);bc.fillStyle='#e8d3a1';bc.font='bold 22px system-ui';bc.fillText('BEE SWARM · STRIPES / FOUR WING POSES / WOVEN HIVE',20,30);
   for(let d=0;d<8;d++)animator.draw(bc,{kind:'bee',id:0,x:65+d*130,y:144,hp:27,faceX:-Math.sin(d*Math.PI/4),faceY:Math.cos(d*Math.PI/4)},d/24,140);
   for(let f=0;f<4;f++)animator.draw(bc,{kind:'bee',id:0,x:65+f*130,y:285,hp:27,faceX:1,faceY:.3},f/24,130);
   animator.draw(bc,{kind:'bee_hive',x:740,y:318,hp:160},0,130);animator.draw(bc,{kind:'bee_hive',x:935,y:318,hp:0},0,130);
   g.enemies=[];Object.assign(p,{x:800,y:900,hp:999,maxHp:999});g.spawnEvent(EVENTS.findIndex(e=>e.name==='A thousand little wings'));const hive=g.enemies.find(e=>e.kind==='bee_hive');if(!hive)throw Error('No hive');for(let i=0;i<300;i++)tickBeeHive(g,hive,.2);if(g.enemies.filter(e=>e.kind==='bee'&&e.hp>0).length!==8)throw Error('Hive cap');hive.hp=0;g.enemies.find(e=>e.kind==='bee').hp=0;const before=g.enemies.length;for(let i=0;i<80;i++)tickBeeHive(g,hive,.2);if(g.enemies.length!==before)throw Error('Dead hive respawns');
   const boardImage=new Image();boardImage.src=new URL('./assets/board-desert-v1.png',location.href).href;await boardImage.decode();const [board,boardC]=make(980,690);boardC.translate(490,345);boardC.scale(3.45,3.45);drawBoard(boardC,{generatedEnvironment:'desert',players:[],roll:null,event:null},0);
   const world=document.createElement('canvas');world.style.cssText='position:fixed;inset:0;width:1280px;height:820px;z-index:99999';document.body.append(world);const renderer=new Renderer(world,assets);renderer.pixelScale=1;
   const desert=new Game(()=>.42);desert.environment=desert.generatedEnvironment='desert';Object.assign(desert,generateWorld(771,'desert'));desert.seed=771;desert.phase='play';desert.openingBoard=false;desert.night={...desert.night,phase:'day'};desert.bloom=3;const hero=desert.addPlayer('keyboard');Object.assign(hero,{x:810,y:930,hp:200,maxHp:200});desert.explored=new Set(Array.from({length:2500},(_,i)=>i));
   desert.spawnEvent(EVENTS.findIndex(e=>e.kind==='bee'));desert.reveal=null;const dh=desert.enemies.find(e=>e.kind==='bee_hive');Object.assign(dh,{x:680,y:900});for(const [i,e]of desert.enemies.filter(e=>e.kind==='bee').entries())Object.assign(e,{x:600+i*60,y:940-(i%2)*80});desert.enemies.push({kind:'beetle',id:999,x:900,y:1020,hp:55,maxHp:55,speed:90,moving:true,step:4,faceX:-1,faceY:0});
   renderer.camera={x:800,y:800,zoom:.62};desert.time=1;renderer.draw(desert,0);const timings=[];for(let i=0;i<18;i++){desert.time+=.033;const start=performance.now();renderer.draw(desert,0);timings.push(performance.now()-start);}
   if(renderer.groundChunks.size>100)throw Error('Unbounded desert cache');const chunkCount=renderer.groundChunks.size;desert.time=3;renderer.draw(desert,0);if(renderer.groundChunks.size!==chunkCount)throw Error('Desert terrain rebakes every frame');
   window.insectQA={renderer,desert,world,assets,Animator,animator};
   return {sheet:sheet.toDataURL(),walk:walk.toDataURL(),spells:spells.toDataURL(),bees:bees.toDataURL(),board:board.toDataURL(),world:world.toDataURL(),report:{poses,friendFrames:friendFrames.size,beetleCacheMax:128,trailMax:MAGIC_TRAIL_LIMIT,beeCap:8,desertChunks:chunkCount,drawMedianMs:timings.toSorted((a,b)=>a-b)[Math.floor(timings.length/2)]}};
  })()`);
  for(const name of ['sheet','walk','spells','bees','board','world'])image('insects-desert-magic-'+name,result[name]);console.log(JSON.stringify(result.report,null,2));
  fs.writeFileSync(path.join(root,'test-output/insects-desert-magic-'+label+'.json'),JSON.stringify(result.report,null,2));app.exit(0);
 }catch(e){console.error(e);app.exit(1);}
});
