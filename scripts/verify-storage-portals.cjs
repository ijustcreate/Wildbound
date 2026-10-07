const {app,BrowserWindow}=require('electron'),fs=require('node:fs'),path=require('node:path');
const root=path.resolve(__dirname,'..'),base=process.env.WILDBOUND_VERIFY_APP||root,out=path.join(root,'test-output','storage-portals');
fs.mkdirSync(out,{recursive:true});app.setPath('userData',fs.mkdtempSync(path.join(out,'profile-')));app.disableHardwareAcceleration();
const timer=setTimeout(()=>app.exit(1),100000);
app.whenReady().then(async()=>{
 const w=new BrowserWindow({show:false,width:1000,height:720,useContentSize:true,webPreferences:{offscreen:true}}),errors=[];
 w.webContents.on('console-message',(_e,l,m)=>{if(typeof l==='object'){m=l.message;l=l.level;}if(l===3||l==='error')errors.push(m);});
 const run=s=>w.webContents.executeJavaScript('(async()=>{'+s+'})()');
 try{
  await w.loadFile(path.join(base,'index.html'),{query:{tools:'1'}});await run('await window.wildboundBoot.ready;window.portalRAF=requestAnimationFrame.bind(window);window.requestAnimationFrame=()=>0;await new Promise(window.portalRAF);');
  const report=await run(`
   const [{Game},{drawPortal,portalVisualSample},{PlayableLobby,LobbyState},{LobbyPractice},{Renderer}]=await Promise.all([import('./src/core.mjs'),import('./src/portal-art.mjs'),import('./src/playable-lobby.mjs'),import('./src/lobby-practice.mjs'),import('./src/render.mjs')]);
   const checks=[],check=(v,m)=>{if(!v)throw Error(m);checks.push(m);};
   const g=new Game(()=>.42),p=g.addPlayer('keyboard'),q=g.addPlayer('pad:0');g.start();g.openingBoard=false;g.scenery=[];g.terrain.fill('grass');p.x=p.y=400;q.x=q.y=600;
   const tick=input=>g.update(.05,input||{});tick({keyboard:{portal:true}});const d=g.portals[0];check(!!d&&!p.room,'Actual input summons outside');tick();tick({keyboard:{portal:true}});check(!g.portals.length,'Actual input closes empty portal');tick();tick({keyboard:{portal:true}});const door=g.portals[0];tick();q.x=door.x;q.y=door.y;tick();check(q.room===door.id,'Guest enters by touching portal');tick({keyboard:{portal:true}});check(door.closing===10,'Outside toggle grants ten seconds');tick();tick({keyboard:{portal:true}});check(door.closing<10,'Repeated toggle never extends grace');const hp=q.hp;for(let i=0;i<205;i++)tick();check(!q.room&&!g.portals.length&&q.hp===hp-q.maxHp*.5,'Countdown uses same forced exit and damage');
   const lobby=Object.create(PlayableLobby.prototype),lg=new Game();const lp=lg.addPlayer('keyboard');Object.assign(lobby,{getGame:()=>lg,state:new LobbyState(),practice:new LobbyPractice(),sync(){},draw(){},area:{querySelector:()=>({textContent:''})}});lobby.state.sync(lg.players);lp.profileId='qa';Object.assign(lobby.state.members.get(lp.id),{spawned:true,panel:null,x:300,y:350});lobby.update(.05,{keyboard:{portal:true}});check(lg.portals[0]?.lobby,'Lobby summon works');lobby.update(.05,{});lobby.update(.05,{keyboard:{portal:true}});check(!lg.portals.length,'Lobby outside toggle closes');
   for(const full of [false,true]){g.phase='play';g.openingBoard=false;p.progress=48;p.x=800;p.y=850;p.inventory=full?Array.from({length:24},()=>({type:'sword',qty:1})):[];p.previousInput={};g.loot=[{id:1000,x:805,y:850,type:'sword',qty:1,manualPickup:true}];let attempts=0;g.collect=()=>{attempts++;return false;};for(let i=0;i<55&&g.phase==='play';i++)tick({keyboard:{interact:true}});check(g.phase==='sealing'&&attempts===0,'Finish interaction ignores loot with '+(full?'full':'empty')+' backpack');}
   const c=document.createElement('canvas');c.width=1000;c.height=720;c.style='position:fixed;inset:0;z-index:999999';document.body.append(c);const pen=c.getContext('2d');pen.fillStyle='#15262b';pen.fillRect(0,0,1000,720);pen.imageSmoothingEnabled=false;pen.scale(4,4);
   ['#aa65ff','#22bb99','#ff9065'].forEach((color,i)=>{drawPortal(pen,{x:40+i*84,y:85,color,closing:null},.3+i*.5);drawPortal(pen,{x:40+i*84,y:164,color,closing:3.4},1.1+i*.5);});
   check(portalVisualSample(door,.2).particles.length===28,'Analytic particles bounded at 28');check(JSON.stringify(portalVisualSample(door,.2).spiral)!==JSON.stringify(portalVisualSample(door,.8).spiral),'Swirl animates');
   const pixels=pen.getImageData(60,80,880,590).data;check(pixels.some((v,i)=>i%4!==3&&v>180),'Native pixel effect visibly paints highlights');
   const probe=Object.create(Renderer.prototype);probe.ctx=pen;probe.camera={x:800,y:800,zoom:1};probe.showLootDetails=true;g.phase='play';p.progress=48;q.hp=0;g.nearbyLoot=()=>{throw Error('Loot prompt stole finish focus');};probe.lootPrompts(g,1000,720);check(true,'Finish prompt does not scan nearby loot');
   return {checks,png:c.toDataURL('image/png')};
  `);
  fs.writeFileSync(path.join(out,'portal-sheet.png'),Buffer.from(report.png.split(',')[1],'base64'));delete report.png;
  if(errors.length)throw Error(errors.join('\n'));fs.writeFileSync(path.join(out,'report.json'),JSON.stringify({...report,errors,base},null,2));console.log(JSON.stringify({...report,errors}));clearTimeout(timer);app.exit(0);
 }catch(e){console.error(e);clearTimeout(timer);app.exit(1);}
});
