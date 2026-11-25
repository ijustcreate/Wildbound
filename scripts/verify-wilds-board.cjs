const fs=require('node:fs');
const os=require('node:os');
const path=require('node:path');

const root=path.resolve(__dirname,'..');
const base=path.resolve(process.env.WILDBOUND_VERIFY_APP||root);
const baseline=process.argv.includes('--baseline');
if(!process.versions.electron){
 const env={...process.env};
 delete env.ELECTRON_RUN_AS_NODE;
 const electron=path.join(root,'node_modules','electron','dist',process.platform==='win32'?'electron.exe':'electron');
 const child=require('node:child_process').spawnSync(electron,[__filename,...process.argv.slice(2),'--mute-audio'],{cwd:root,env,encoding:'utf8',timeout:160000,windowsHide:true});
 if(child.stdout)process.stdout.write(child.stdout);
 if(child.stderr)process.stderr.write(child.stderr);
 if(child.error)console.error(child.error);
 process.exit(child.status??1);
}

const {app,BrowserWindow}=require('electron');
const output=path.join(root,'test-output','wilds-board',baseline?'baseline':base===root?'source':'packaged');
fs.mkdirSync(output,{recursive:true});
app.setPath('userData',fs.mkdtempSync(path.join(os.tmpdir(),'wildbound-homestead-board-')));
app.commandLine.appendSwitch('mute-audio');
const deadline=setTimeout(()=>{console.error('Homestead board verification timed out.');app.exit(1);},150000);

app.whenReady().then(async()=>{
 const win=new BrowserWindow({show:false,width:1130,height:780,webPreferences:{backgroundThrottling:false}});
 win.webContents.setAudioMuted(true);
 const errors=[];
 win.webContents.on('console-message',event=>{if(event.level==='error')errors.push(event.message);});
 try{
  await win.loadFile(path.join(base,'index.html'),{query:{tools:'1'}});
  const result=await win.webContents.executeJavaScript(`(${verify})(${baseline})`);
  const report={base,baseline,checks:result.checks,measurements:result.measurements,errors,muted:win.webContents.isAudioMuted()};
  for(const [name,data]of Object.entries(result.images))fs.writeFileSync(path.join(output,`${name}.png`),Buffer.from(data.split(',')[1],'base64'));
  fs.writeFileSync(path.join(output,'report.json'),JSON.stringify(report,null,2));
  console.log(JSON.stringify(report));
  app.exit(errors.length||!report.muted?1:0);
 }catch(error){console.error(error.stack,errors);app.exit(1);}
 finally{clearTimeout(deadline);}
});

async function verify(baseline){
 await wildboundBoot.ready;
 const checks=[],images={},measurements={};
 const expect=(value,statement)=>{if(!value)throw Error(statement);checks.push(statement);};
 const tools=wildboundPolishTest;
 const {assets}=tools;
 const {Game}=await import('./src/core.mjs');
 const {Renderer}=await import('./src/render.mjs');
 const {boardPoint}=await import('./src/board.mjs');
 const {enterWildLands}=await import('./src/wild-lands.mjs');
 const {wildHomesteadBoardTable}=await import('./src/wild-homestead-layout.mjs');
 const {wildLandsSurfaceAt}=await import('./src/wild-lands-world.mjs');
 const {trainPrompt}=await import('./src/train-test.mjs');
 window.Worker=undefined;

 // Keep the real app frame, input mapper, renderer and board DOM, while driving
 // their timestamps explicitly so an unfocused test window does not throttle them.
 const raf=window.requestAnimationFrame.bind(window);
 let appFrame,now;
 window.requestAnimationFrame=callback=>{if(callback.name==='frame')appFrame=callback;return 0;};
 await new Promise(resolve=>raf(time=>{now=time;resolve();}));
 if(!appFrame)throw Error('Could not capture the native app frame.');

 const g=new Game(()=>.5,{deferWorld:true});
 const first=g.addPlayer('keyboard','Keyboard explorer'),second=g.addPlayer('pad:0','Xbox explorer');
 g.spriteLibrary=assets.library;
 tools.game=g;tools.show('play');
 g.persist=g.onSound=()=>{};
 if(tools.paused)tools.resume();
 tools.renderer=new Renderer(document.getElementById('game-canvas'),assets);
 tools.renderer.setDynamicShadows(false);
 expect(enterWildLands(g,{persistent:true,homeStart:true}).ok,'The native Wild Lands Homestead expedition opens');
 const t=g.trainTest;
 t.preparing=false;
 const table=wildHomesteadBoardTable(t.design);
 Object.assign(first,{x:table.x+32,y:table.y+56});
 Object.assign(second,{x:table.x+56,y:table.y+56,controllerFamily:'xbox'});

 const activeButtons=new Set(),pad={index:0,id:'Xbox 360 Controller (STANDARD GAMEPAD Vendor: 045e Product: 028e)',mapping:'standard',connected:true,axes:[0,0,0,0]};
 Object.defineProperty(navigator,'getGamepads',{configurable:true,value:()=>[{...pad,timestamp:now,buttons:Array.from({length:17},(_,i)=>({pressed:activeButtons.has(i),touched:activeButtons.has(i),value:activeButtons.has(i)?1:0}))}]});
 const panel=document.getElementById('board-panel'),close=document.getElementById('close-board');
 const caption=document.getElementById('board-caption');
 const cue=document.getElementById('turn-caption');
 const visible=()=>!panel.classList.contains('hidden');
 const openButton=()=>!close.disabled&&getComputedStyle(close).display!=='none';
 const frame=()=>{now+=42;appFrame(now);};
 const key=(code,pressed)=>document.dispatchEvent(new KeyboardEvent(pressed?'keydown':'keyup',{code,key:code==='Enter'?'Enter':code.slice(-1).toLowerCase(),bubbles:true,cancelable:true}));
 const pressKey=code=>{key(code,true);frame();key(code,false);frame();};
 const pressPad=index=>{activeButtons.add(index);frame();activeButtons.delete(index);frame();};
 const tick=(frames=1)=>{for(let i=0;i<frames;i++)g.update(.05,{});};
 const until=(ready,max=120)=>{for(let i=0;!ready()&&i<max;i++)tick();if(!ready())throw Error('The board did not settle within the simulated interval.');frame();};
 const dice=(...faces)=>{const samples=faces.map(face=>(face-.5)/6);g.random=()=>samples.shift()??.49;};
 const saveImage=name=>{images[name]=document.getElementById('board-closeup').toDataURL();};
 const drawsPawnAt=(space,open)=>{
  const expected=boardPoint(space),ctx=document.getElementById('board-closeup').getContext('2d');
  const fillText=ctx.fillText;
  let painted=false;
  ctx.fillText=function(text,x,y,...args){
   if(text==='1'&&Math.abs(x-expected.x)<.001&&Math.abs(y-expected.y-4)<.001)painted=true;
   return fillText.call(this,text,x,y,...args);
  };
  try{open();}finally{ctx.fillText=fillText;}
  return painted;
 };

 frame();
 expect(trainPrompt(g,first).includes('PLAY WILDBOUND'),'The physical Homestead table offers its native interaction');
 g.eventDuration=1;
 dice(1,2);
 pressKey('KeyE');
 const board=t.homesteadBoard;
 expect(board?.roll?.total===3&&visible(),'Keyboard E rolls at the physical table and opens the real board panel');
 until(()=>!board.roll);
 expect(!visible(),'The introductory result closes after its normal reveal');
 tick(28);

 const pawn=board.pawns.find(p=>p.id===first.id);
 Object.assign(pawn,{progress:26,boardProgress:26});
 Object.assign(board,{locked:true,turnOrder:[first.id,second.id],turn:0,rollCooldown:0,repeatTurnPlayerId:null});
 g.eventDuration=20;
 dice(4,5);
 pressKey('KeyE');
 expect(board.roll?.total===9&&!board.roll.resolved&&close.disabled,'The 4+5 roll starts at trail 26 without allowing a premature Close');
 until(()=>board.roll?.resolved);
 expect(visible()&&pawn.progress===35&&/TRAIL 35.*9 rolled/.test(caption.textContent),'The real board reproduces TRAIL 35 — 9 rolled');
 saveImage('trail-35');
 const settledAt=board.roll.elapsed;

 if(baseline){
  expect(close.disabled&&!openButton(),'The previous desktop hides and disables Close over the settled result');
  pressKey('Enter');
  pressKey('KeyF');
  tick(80);frame();
  expect(visible()&&board.roll?.resolved&&board.roll.elapsed>settledAt+3.8,'The previous result persists with no dismiss route even as simulation time continues');
  measurements.secondsVisible=board.roll.elapsed;
  return {checks,measurements,images};
 }

 expect(openButton(),'The settled result enables and displays Close');
 for(let i=0;i<4;i++)frame();
 expect(cue.textContent==='Enter to continue','The keyboard reveal shows its native continue cue');
 close.click();frame();
 expect(!visible()&&!board.roll&&pawn.progress===35,'Close dismisses the reveal and commits the landed pawn only once');
 measurements.secondsBeforeClose=settledAt;

 expect(drawsPawnAt(35,()=>pressKey('KeyB'))&&visible()&&openButton(),'Keyboard B reopens the Homestead board with its pawn at trail 35');
 expect(caption.textContent==='Interact at the Homestead table to roll.','Board inspection points back to the physical table');
 saveImage('keyboard-reopen');
 pressKey('KeyB');
 expect(!visible(),'Keyboard B closes the inspection panel again');
 expect(drawsPawnAt(35,()=>pressPad(14))&&visible()&&openButton(),'Xbox D-pad Left opens the same Homestead inspection board');
 pressPad(14);
 expect(!visible(),'Xbox D-pad Left closes the inspection panel');

 tick(28);
 expect(trainPrompt(g,second).includes('ROLL DICE'),'The second explorer can roll from the adjacent side of the table');
 dice(1,2);
 pressPad(3);
 expect(board.roll?.playerId===second.id&&board.roll.total===3&&visible(),'Xbox Y rolls for the second explorer after the first dismisses');
 until(()=>board.roll?.resolved);
 const other=board.pawns.find(p=>p.id===second.id);
 expect(other.progress===3&&openButton(),'The Xbox explorer’s pawn lands independently');
 for(let i=0;i<4;i++)frame();
 expect(cue.textContent==='A to continue','The Xbox reveal shows its native continue cue');
 pressPad(0);
 expect(!board.roll&&!visible(),'Xbox A dismisses the second explorer’s settled result');

 tick(28);
 dice(1,2);
 pressKey('KeyE');
 expect(board.roll?.playerId===first.id&&board.roll.startProgress===35,'Keyboard E can roll again from the retained trail space');
 until(()=>board.roll?.resolved);
 pressKey('Enter');
 expect(!board.roll&&!visible()&&pawn.progress===38,'Enter dismisses the next settled result without changing its progress');

 tick(28);
 g.eventDuration=1;
 const firstPosition={x:first.x,y:first.y},secondPosition={x:second.x,y:second.y};
 dice(2,3);
 pressPad(3);
 expect(board.roll?.total===5&&board.roll.playerId===second.id,'Xbox Y can start a subsequent five-point portal roll');
 until(()=>board.portal);
 expect(!visible()&&other.progress===8,'The five-point reveal settles before opening the portal');
 until(()=>!board.roll&&!board.portal);
 expect(Math.hypot(second.x-secondPosition.x,second.y-secondPosition.y)>200&&wildLandsSurfaceAt(t.design,second.x,second.y)==='grass','The portal takes the roller to dry ground and finishes on its own');
 expect(first.x===firstPosition.x&&first.y===firstPosition.y,'The other explorer stays at the Homestead table');
 return {checks,measurements,images};
}
