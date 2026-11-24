const {app,BrowserWindow}=require('electron');
const fs=require('node:fs'),os=require('node:os'),path=require('node:path');
const root=path.resolve(__dirname,'..'),base=process.env.WILDBOUND_VERIFY_APP||root;
const output=path.join(root,'test-output','mage-garden',process.env.WILDBOUND_GARDEN_STAGE||(base===root?'source':'packaged'));
fs.mkdirSync(output,{recursive:true});
app.setPath('userData',fs.mkdtempSync(path.join(os.tmpdir(),'wildbound-garden-')));
app.commandLine.appendSwitch('mute-audio');
const deadline=setTimeout(()=>app.exit(1),120000);

app.whenReady().then(async()=>{
 const win=new BrowserWindow({show:false,width:1200,height:850,webPreferences:{backgroundThrottling:false}});
 win.webContents.setAudioMuted(true);
 const errors=[];
 win.webContents.on('console-message',event=>{if(event.level==='error')errors.push(event.message);});
 try{
  await win.loadFile(path.join(base,'index.html'),{query:{tools:'1'}});
  await win.webContents.executeJavaScript('wildboundBoot.ready');
  const result=await win.webContents.executeJavaScript(`(async()=>{
   window.requestAnimationFrame=()=>0;window.Worker=undefined;
   const {Game}=await import('./src/core.mjs'),{Renderer}=await import('./src/render.mjs');
   const {enterWildLands}=await import('./src/wild-lands.mjs');
   const {alleyGate,alleyBlocked,alleyPrompt}=await import('./src/diagon-alley.mjs');
   const {insideMageGarden,mageGardenFootstep}=await import('./src/diagon-mage-garden.mjs');
   const {GARDEN_BENCHES,GARDEN_TREES,GARDEN_POOL,GARDEN_PATHS,gardenBenchSeatPoint,gardenPathAt}=await import('./src/diagon-garden-layout.mjs');
   const {activeGardenBench}=await import('./src/diagon-garden-benches.mjs');
   const {gardenCatsFor}=await import('./src/diagon-garden-cats.mjs');
   const {saveSession,restoreSession}=await import('./src/session.mjs');
   const {drawGardenPool}=await import('./src/diagon-garden-pool.mjs');
   const {alleyStreetCacheStats}=await import('./src/diagon-alley-street-art.mjs');
   const {alleyGardenPropArtStats}=await import('./src/diagon-garden-props.mjs');
   const game=new Game(()=>.5),hero=game.addPlayer('keyboard','Garden tester');
   game.start();game.openingBoard=false;
   const assets=wildboundPolishTest.assets;game.spriteLibrary=assets.library;game.persist=()=>{};game.onSound=()=>{};
   const checks=[],pictures={},verify=(value,label)=>{if(!value)throw new Error(label);checks.push(label);};
   const walk=(x,y,frames)=>{for(let i=0;i<frames;i++)game.update(.05,{keyboard:{x,y}});};
   const interact=()=>{game.update(.05,{keyboard:{}});game.update(.05,{keyboard:{interact:true}});};
   verify(enterWildLands(game,{persistent:true}).ok,'Starts the normal Wilds world');
   game.trainTest.preparing=false;const gate=alleyGate(game);
   Object.assign(hero,{x:gate.x,y:gate.y+55});hero.equipment.hand1='starter_wand';interact();walk(0,0,16);interact();
   verify(game.trainTest.design.activeRoom==='diagon','Enter Diagon Alley through its real gate');
   Object.assign(hero,{x:7855,y:4020});
   for(let i=0;i<88&&hero.x>=7515;i++)walk(-1,0,1);
   verify(hero.x<7515&&insideMageGarden(hero.x,hero.y),'Walk from the avenue into the garden via the western lane ('+hero.x+', '+hero.y+')');
   verify(!hero.ui,'The garden route has no forced interaction');
   verify(!alleyBlocked(game,7473,4037)&&alleyBlocked(game,7401,4070)&&alleyBlocked(game,GARDEN_TREES[0].x,GARDEN_TREES[0].y),
    'The path is traversable with solid pool and tree trunks');
   verify(mageGardenFootstep(7580,4020)==='stone'&&mageGardenFootstep(7245,4047)==='grass',
    'Paved lane and garden lawn report different footstep materials');
   verify(GARDEN_BENCHES.every(seat=>[-seat.w,0,seat.w].every(dx=>[-8,0,8].every(dy=>!gardenPathAt(seat.x+dx,seat.y+dy)))),
    'Every bench footprint clears the paving');
   verify(GARDEN_PATHS.every(({points})=>points.every(([x,y],i)=>!i||Array.from({length:9},(_,j)=>j/8).every(t=>{
    const [px,py]=points[i-1];return !alleyBlocked(game,px+(x-px)*t,py+(y-py)*t);
   }))), 'Every paved loop and spur keeps a clear continuous centerline');
   const {x:poolX,y:poolY}=GARDEN_POOL,waterCanvas=document.createElement('canvas');
   waterCanvas.width=136;waterCanvas.height=80;
   const pen=waterCanvas.getContext('2d'),waterPixels=(time,donors=[])=>{
    pen.resetTransform();pen.clearRect(0,0,136,80);pen.translate(68-poolX,40-poolY);
    drawGardenPool(pen,time,donors,game);return pen.getImageData(0,0,136,80).data;
   };
   const calm=waterPixels(.15),later=waterPixels(.93);
   let edgeChanged=0,centerChanged=0;
   for(let y=0;y<80;y++)for(let x=0;x<136;x++){
    const i=(y*136+x)*4;
    if([0,1,2,3].every(k=>calm[i+k]===later[i+k]))continue;
    if(((x-68)/58)**2+((y-40)/35)**2<.59)centerChanged++;
    else edgeChanged++;
   }
   verify(edgeChanged>10&&centerChanged===0,'Wave crests animate only near the pool rim');
   const reflected=waterPixels(1.55,[{x:poolX,y:poolY-42,paint:context=>{
    context.fillStyle='#d5bcb1';context.fillRect(poolX-12,poolY-117,24,75);
   }}]);
   const empty=waterPixels(1.55,[]);
   // Advance the sampling frame while holding the wave-free pool-center pixel.
   const cleared=waterPixels(1.60,[]),mid=(40*136+68)*4;
   verify(reflected[mid]!==cleared[mid]&&empty[mid]===reflected[mid],'The pool reflects actual donor pixels and reuses its current raster within a frame');
   const canvas=document.createElement('canvas');canvas.style.cssText='width:1180px;height:830px';document.body.append(canvas);
   const renderer=new Renderer(canvas,assets);renderer.dynamicShadows=false;
   const catActors=new Map(),draw=renderer.animator.draw.bind(renderer.animator);
   let playerPose,visitingCatPose;
   renderer.animator.draw=(ctx,actor,...args)=>{
    if(actor.id?.startsWith?.('diagon-garden-cat-'))catActors.set(actor.id,[actor.catCoat,actor.x,actor.y]);
    if(actor.id===hero.id)playerPose=actor.animationAction;
    if(actor.gardenVisit)visitingCatPose=actor.idle;
    draw(ctx,actor,...args);
   };
   const capture=name=>{renderer.trainScene=null;renderer.draw(game,.016);pictures[name]=canvas.toDataURL();};
   Object.assign(hero,{x:7482,y:4046,jumpHeight:0});game.trainTest.noticeUntil=0;capture('garden');
   verify(Math.abs(renderer.camera.zoom-1.35)<.01,'Garden uses standard Alley player zoom');
   const before=new Map(catActors);catActors.clear();
   verify(before.size===4&&new Set([...before.values()].map(cat=>cat[0])).size===4,'Four native cats with distinct coats render in the garden');
   walk(0,0,61);capture('garden-later');
   verify([...catActors].some(([id,[coat,x,y]])=>Math.hypot(x-before.get(id)[1],y-before.get(id)[2])>20),
    'The cats follow independent walking paths');
   verify(pictures.garden!==pictures['garden-later'],'The animated garden visibly updates');
   Object.assign(hero,{x:7301,y:3902});capture('garden-north');
   Object.assign(hero,{x:7284,y:4204});capture('garden-south');
   Object.assign(hero,{x:7475,y:4020});
   for(let i=0;i<88&&hero.x<=7782;i++)walk(1,0,1);
   verify(hero.x>7782,'Walk back to the avenue through the same lane ('+hero.x+', '+hero.y+')');
   const caches={street:alleyStreetCacheStats(),props:alleyGardenPropArtStats()};
   verify(caches.street.streetRasters>0&&caches.street.streetPixels<=652*168*caches.street.streetRasters,
    'The street reuses compact lanes and curb strips');
   verify(caches.props.recipeCount===18&&caches.props.animatedCount>=10&&caches.props.rasterPixels<160000,
    'Garden and street props share one bounded atlas of native pixel recipe frames');
   for(const bench of GARDEN_BENCHES){
    const point=gardenBenchSeatPoint(bench,-1);
    Object.assign(hero,{x:point.x,y:point.y+12});
    verify(alleyPrompt(game,hero)==='SIT ON BENCH'&&!alleyBlocked(game,point.x,point.y,7),
     'Front approach and clear seat at '+bench.id);
    interact();
    verify(activeGardenBench(game,hero)===bench&&alleyPrompt(game,hero)==='STAND'&&!hero.moving,
     'Interact seats the player at '+bench.id);
    walk(0,1,2);
    verify(!activeGardenBench(game,hero)&&hero.y>point.y&&!alleyBlocked(game,hero.x,hero.y,7),
     'Movement stands up and exits the seat at '+bench.id);
   }
   const bench=GARDEN_BENCHES[0],point=gardenBenchSeatPoint(bench,1);
   Object.assign(hero,{x:point.x,y:bench.y-20});
   verify(alleyPrompt(game,hero)!=='SIT ON BENCH','The seat cannot be reached through its backrest');
   Object.assign(hero,{...point,y:point.y+5});
   interact();walk(0,0,3);
   verify(hero.gardenBench?.seat===1&&hero.x===point.x&&hero.y===point.y,'The player stays seated without input');
   const restored=restoreSession(JSON.parse(JSON.stringify(saveSession(game))));
   verify(activeGardenBench(restored,restored.players[0])===bench,'Saving and restoring retains a valid garden seat');
   const nearbyVisitor=()=>gardenCatsFor(game).find(cat=>cat.gardenVisit&&cat.idle==='sit');
   verify(!nearbyVisitor(),'Cats continue their usual routes when the player first sits');
   for(let i=0;i<520&&!nearbyVisitor();i++)walk(0,0,1);
   const guest=nearbyVisitor();
   verify(guest&&guest.x>hero.x&&Math.hypot(guest.x-hero.x,guest.y-hero.y)<38,
    'A garden cat walks over and sits beside the occupied end of the bench');
   renderer.cameraOverride={x:bench.x+5,y:bench.y,zoom:2.35};
   capture('bench-and-cat');
   verify(playerPose==='train_sit'&&visitingCatPose==='sit','The native player and cat rigs render their sitting poses');
   interact();walk(0,0,2);
   verify(!hero.gardenBench&&!alleyBlocked(game,hero.x,hero.y,7),'Interact stands up onto the clear lawn');
   verify(!nearbyVisitor(),'The visiting cat leaves after the player stands');
   interact();
   game.update(.05,{keyboard:{}});
   game.update(.05,{keyboard:{jump:true}});
   verify(!hero.gardenBench&&!(hero.jumpHeight>0),'Jump input stands up before jumping');
   game.locked=false;
   const partner=game.addPlayer('pad:0','Bench partner'),third=game.addPlayer('pad:1','Third explorer');
   game.locked=true;
   Object.assign(hero,{...point,y:point.y+5});
   Object.assign(partner,{...point,y:point.y+5});
   Object.assign(third,{...point,y:point.y+5});
   interact();
   game.update(.05,{'pad:0':{interact:true},'pad:1':{interact:true}});
   verify(hero.gardenBench?.seat===1&&partner.gardenBench?.seat===-1&&!third.gardenBench,
    'Local co-op can share a bench without using an occupied seat '+JSON.stringify(game.players.map(p=>[p.name,p.x,p.y,p.gardenBench,alleyPrompt(game,p)])));
   return {checks,pictures,caches};
  })()`);
  for(const [name,png] of Object.entries(result.pictures))fs.writeFileSync(path.join(output,name+'.png'),Buffer.from(png.split(',')[1],'base64'));
  const report={checks:result.checks,caches:result.caches,errors,muted:win.webContents.isAudioMuted()};
  fs.writeFileSync(path.join(output,'report.json'),JSON.stringify(report,null,2));
  console.log(JSON.stringify({passed:report.checks.length,errors,muted:report.muted}));
  clearTimeout(deadline);app.exit(errors.length||!report.muted?1:0);
 }catch(error){console.error(error.stack,errors);clearTimeout(deadline);app.exit(1);}
});
