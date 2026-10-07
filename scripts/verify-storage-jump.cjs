const {app,BrowserWindow}=require('electron'),fs=require('node:fs'),path=require('node:path');
const root=path.resolve(__dirname,'..'),base=process.env.WILDBOUND_VERIFY_APP||root,out=path.join(root,'test-output','storage-jump');
fs.mkdirSync(out,{recursive:true});app.disableHardwareAcceleration();app.setPath('userData',fs.mkdtempSync(path.join(out,'profile-')));
const deadline=setTimeout(()=>app.exit(1),85000);
app.whenReady().then(async()=>{
 const w=new BrowserWindow({show:false,width:1000,height:720,useContentSize:true,webPreferences:{offscreen:true}}),errors=[];
 w.webContents.on('console-message',event=>{if(event.level==='error')errors.push(event.message);});
 const run=s=>w.webContents.executeJavaScript('(async()=>{'+s+'})()');
 try{
  await w.loadFile(path.join(base,'index.html'),{query:{tools:'1'}});
  await run('await window.wildboundBoot.ready;const raf=requestAnimationFrame.bind(window);window.requestAnimationFrame=()=>0;await new Promise(raf);');
  const report=await run(`
   const [{Game},{Assets},{Animator},{HeroUI},{storageVisualActor},{PlayableLobby,LobbyState},{LobbyPractice}]=await Promise.all([import('./src/core.mjs'),import('./src/assets.mjs'),import('./src/animation.mjs'),import('./src/hero-ui.mjs'),import('./src/storage-room.mjs'),import('./src/playable-lobby.mjs'),import('./src/lobby-practice.mjs')]);
   const checks=[],check=(v,m)=>{if(!v)throw Error(m);checks.push(m);};
   const g=new Game(()=>.5),p=g.addPlayer('keyboard'),q=g.addPlayer('pad:0');g.start();g.openingBoard=false;g.scenery=[];g.terrain.fill('grass');p.x=p.y=400;q.x=q.y=600;
   g.portal(p);const d=g.portals[0];p.x=d.x;p.y=d.y;g.enterRoom(p,d);const tick=input=>g.update(.05,input||{}),outside=[p.x,p.y];
   tick({'pad:0':{jump:true}});check(!p.roomJumpHeight,'Other player jump never controls storage occupant');
   tick({keyboard:{jump:true,x:1}});check(p.roomJumpHeight>0&&p.roomJumpVelocity===107&&p.roomMoving,'Actual expedition input starts jump and room movement');
   check((p.jumpHeight||0)===0&&p.x===outside[0]&&p.y===outside[1],'Room height does not change world height or coordinates');
   for(let n=0;n<4;n++)tick({keyboard:{jump:true}});const airborne=storageVisualActor(p);check(airborne.jumpHeight>15,'Storage jump has a visible airborne arc');
   const assets=new Assets();await assets.load();const animator=new Animator(assets),canvas=document.createElement('canvas');canvas.width=320;canvas.height=240;const c=canvas.getContext('2d');
   const bounds=actor=>{c.clearRect(0,0,320,240);animator.draw(c,actor,1,43);const pixels=c.getImageData(0,0,320,240).data;let top=240,bottom=0,count=0;for(let y=0;y<240;y++)for(let x=0;x<320;x++)if(pixels[(y*320+x)*4+3]){top=Math.min(top,y);bottom=Math.max(bottom,y);count++;}return {top,bottom,count,png:canvas.toDataURL()};};
   const ground=bounds({...airborne,jumpHeight:0,jumpVelocity:0,landTime:0}),air=bounds(airborne);
   check(air.count>200&&ground.count>200&&air.top<ground.top-10&&air.bottom<ground.bottom-10,'Real humanoid Animator visibly lifts the jump pose above floor');
   const host=document.createElement('div'),ui=new HeroUI(host);ui.room(canvas,g,p,d,{animator});const room=canvas.toDataURL();
   check(canvas.dataset.roomFit==='true'&&canvas.getContext('2d').getImageData(0,0,320,240).data.some((v,i)=>i%4!==3&&v>150),'Full storage scene renders jumping occupant with stationary floor');
   for(let n=0;n<25;n++)tick({keyboard:{jump:true}});check(p.roomJumpHeight===0,'Landing works without automatically repeating held jump');tick();tick({keyboard:{jump:true}});check(p.roomJumpHeight>0,'Release and press starts another jump');g.leaveRoom(p);check(p.roomJumpHeight===0&&!p.roomJumpHeld,'Leaving storage resets jump');
   const lg=new Game(),lp=lg.addPlayer('keyboard'),lobby=Object.create(PlayableLobby.prototype);Object.assign(lobby,{getGame:()=>lg,state:new LobbyState(),practice:new LobbyPractice(),sync(){},draw(){},area:{querySelector:()=>({textContent:''})}});lobby.state.sync(lg.players);lp.profileId='qa-jump';const s=lobby.state.members.get(lp.id);Object.assign(s,{spawned:true,panel:null,x:300,y:350});const lt=input=>lobby.update(.05,input||{});lt({keyboard:{portal:true}});const ld=lg.portals[0];lt();Object.assign(s,{x:ld.x,y:ld.y});lt();lt({keyboard:{jump:true}});check(lp.roomJumpHeight>0&&lg.time===0,'Actual lobby storage jumps while expedition clock is stopped');
   return {checks,pictures:{ground:ground.png,airborne:air.png,room}};
  `);
  for(const [name,png]of Object.entries(report.pictures))fs.writeFileSync(path.join(out,name+'.png'),Buffer.from(png.split(',')[1],'base64'));delete report.pictures;
  if(errors.length)throw Error(errors.join('\n'));fs.writeFileSync(path.join(out,'report.json'),JSON.stringify({...report,errors,base},null,2));console.log(JSON.stringify({...report,errors}));clearTimeout(deadline);app.exit(0);
 }catch(e){console.error(e);clearTimeout(deadline);app.exit(1);}
});
