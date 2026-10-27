const {app,BrowserWindow}=require('electron'),fs=require('node:fs'),path=require('node:path');
const root=path.resolve(__dirname,'..'),base=process.env.WILDBOUND_VERIFY_APP||root,out=path.join(root,'test-output/lobby-scaling');
fs.mkdirSync(out,{recursive:true});app.setPath('userData',fs.mkdtempSync(path.join(out,'profile-')));
app.whenReady().then(async()=>{
 const w=new BrowserWindow({show:false,width:980,height:800,useContentSize:true,webPreferences:{backgroundThrottling:false,offscreen:true}});w.webContents.setAudioMuted(true);
 const checks=[],errors=[];w.webContents.on('console-message',e=>{if(e.level==='error')errors.push(e.message);});
 const js=s=>w.webContents.executeJavaScript(s),assert=(value,label)=>{if(!value)throw Error(label);checks.push(label);};
 const frame=()=>js('new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(()=>resolve(true))))');
 const capture=async name=>{await frame();fs.writeFileSync(path.join(out,name+'.png'),(await w.webContents.capturePage()).toPNG());};
 async function resize(width,height,zoom=1){w.webContents.setZoomFactor(zoom);w.setContentSize(width,height);await frame();await js('c.playableLobby.positionPanels();void 0');}
 try{
  await w.loadURL('about:blank');w.webContents.debugger.attach('1.3');await w.webContents.debugger.sendCommand('Debugger.enable');
  await w.webContents.debugger.sendCommand('Debugger.setBreakpointByUrl',{urlRegex:'src/debug-tools\\.mjs$',lineNumber:3,condition:'(window.scalingCtx=ctx,false)'});
  await w.loadFile(path.join(base,'index.html'),{query:{tools:'1'}});await js('window.wildboundBoot.ready');
  for(let i=0;i<300;i++){if(await js(`!!window.scalingCtx&&document.getElementById('loading').classList.contains('done')`))break;await new Promise(r=>setTimeout(r,30));}
  await js('window.c=window.scalingCtx;void 0');
  for(const [width,height]of [[980,800],[620,800],[1440,800],[800,450],[360,560],[1600,480],[900,680],[910,680]]){
   await resize(width,height);
   const title=await js(`(()=>{const scene=document.querySelector('.landing-scene').getBoundingClientRect(),image=document.querySelector('.landing-scene>img').getBoundingClientRect(),prompt=document.querySelector('.landing-join').getBoundingClientRect(),room=document.querySelector('.lobby-world').getBoundingClientRect();return {full:scene.left>=room.left-.1&&scene.right<=room.right+.1&&scene.top>=room.top-.1&&scene.bottom<=room.bottom+.1,ratio:image.width/image.height,join:prompt.top>=scene.top&&prompt.bottom<=scene.bottom+.1,players:c.game.players.length};})()`);
   assert(title.full&&title.join&&Math.abs(title.ratio-1672/941)<.005&&title.players===0,'Complete title art and prompt fit '+width+'x'+height);
   await js(`window.dispatchEvent(new Event('resize'));document.querySelector('.landing-scene').dispatchEvent(new PointerEvent('pointermove',{bubbles:true,movementX:4,movementY:0}))`);
   assert(await js('c.game.players.length===0'),'Resize does not accidentally join '+width+'x'+height);
   if([620,1440,1600].includes(width))await capture('title-'+width+'x'+height);
  }
  await js(`window.dispatchEvent(new KeyboardEvent('keydown',{key:'k',code:'KeyK',bubbles:true,cancelable:true}))`);await frame();
  assert(await js(`c.game.players.length===1&&c.playableLobby.state.members.get(c.game.players[0].id).panel==='choose'`),'Explicit input still opens explorer selection');
  for(const zoom of [1,.8,1.25])for(const [width,height]of [[1440,800],[620,800],[1180,650],[760,480],[980,800],[640,420]]){
   await resize(width,height,zoom);
   const card=await js(`(()=>{const room=document.querySelector('.lobby-world').getBoundingClientRect(),p=document.querySelector('.character-select'),r=p.getBoundingClientRect();return {cx:Math.abs(r.left+r.width/2-room.left-room.width/2),cy:Math.abs(r.top+r.height/2-room.top-room.height/2),inside:r.left>=room.left-.1&&r.right<=room.right+.1&&r.top>=room.top-.1&&r.bottom<=room.bottom+.1,transition:getComputedStyle(p).transitionDuration,scale:Number(getComputedStyle(p).zoom)};})()`);
   assert(card.inside&&card.cx<1.1&&card.cy<1.1,'Card tracks resize immediately '+width+'x'+height+' zoom '+zoom+' '+JSON.stringify(card));
   assert(card.scale>=.8&&card.scale<=1,'Card text scale stays readable '+width+'x'+height+' zoom '+zoom);
   if(zoom===1&&[620,1440,640].includes(width))await capture('choose-'+width+'x'+height);
  }
  await resize(1280,850);await js(`c.game.addPlayer('pad:0');c.playableLobby.sync();void 0`);await new Promise(r=>setTimeout(r,1100));
  for(const [width,height]of [[1280,850],[640,420],[980,800],[760,480]]){
   await resize(width,height);
   const pair=await js(`(()=>{const room=document.querySelector('.lobby-world').getBoundingClientRect(),cards=[...document.querySelectorAll('.character-select')].map(n=>{const r=n.getBoundingClientRect();return {x:r.x,y:r.y,right:r.right,bottom:r.bottom};});return {count:cards.length,inside:cards.every(r=>r.x>=room.x-.1&&r.right<=room.right+.1&&r.y>=room.y-.1&&r.bottom<=room.bottom+.1),apart:cards[0].right<=cards[1].x||cards[1].right<=cards[0].x};})()`);
   assert(pair.count===2&&pair.inside&&pair.apart,'Both explorer panels fit immediately '+width+'x'+height);
   await js(`for(const p of c.game.players){const s=c.playableLobby.state.members.get(p.id);s.focus=c.playableLobby.nodes.get(p.id).querySelectorAll('button').length-1;c.playableLobby.highlight(p);}void 0`);
   const visible=await js(`Array.from(c.playableLobby.nodes.values()).every(panel=>{const p=panel.getBoundingClientRect(),b=panel.querySelector('button:last-of-type').getBoundingClientRect();return b.top>=p.top&&b.bottom<=p.bottom;})`);
   assert(visible,'Focused final action stays visible '+width+'x'+height);
   if(width===640)await capture('two-panels-640x420');
  }
  await js(`for(let i=1;i<5;i++)c.game.addPlayer('pad:'+i);c.playableLobby.sync();void 0`);await new Promise(r=>setTimeout(r,1100));
  await resize(960,540);
  await js(`for(const p of c.game.players){const s=c.playableLobby.state.members.get(p.id);s.focus=c.playableLobby.nodes.get(p.id).querySelectorAll('button').length-1;c.playableLobby.highlight(p);}void 0`);
  assert(await js(`c.game.players.length===6&&Array.from(c.playableLobby.nodes.values()).every(panel=>{const r=panel.getBoundingClientRect(),b=panel.querySelector('button:last-of-type').getBoundingClientRect();return b.top>=r.top&&b.bottom<=r.bottom;})`),'Six-player compact panels reveal the focused action');
  assert(errors.length===0,'Zero renderer errors');
  fs.writeFileSync(path.join(out,'report.json'),JSON.stringify({checks,errors,base},null,2));console.log(JSON.stringify({passed:checks.length,errors,base}));app.exit(0);
 }catch(error){console.error(error);console.error(JSON.stringify({passed:checks.length,last:checks.at(-1),errors}));app.exit(1);}
});
