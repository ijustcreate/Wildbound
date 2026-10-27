const {app,BrowserWindow}=require('electron'),fs=require('node:fs'),path=require('node:path');
const root=path.resolve(__dirname,'..'),base=process.env.WILDBOUND_VERIFY_APP||root,out=path.join(root,'test-output','lobby-menu-tv');
fs.mkdirSync(out,{recursive:true});app.setPath('userData',fs.mkdtempSync(path.join(out,'profile-')));app.disableHardwareAcceleration();
app.whenReady().then(async()=>{
 const win=new BrowserWindow({show:false,width:1280,height:850,webPreferences:{backgroundThrottling:false}});win.webContents.setAudioMuted(true);
 await win.loadFile(path.join(base,'index.html'),{query:{tools:'1'}});await win.webContents.executeJavaScript('window.wildboundBoot.ready');
 const result=await win.webContents.executeJavaScript(`(async()=>{
  const {PlayableLobby}=await import('./src/playable-lobby.mjs');
  const {drawLobbyTelevision}=await import('./src/lobby-tv.mjs');
  const q=window.previewCharacterSelect(),l=q.lobby,p=q.first;l.update=()=>{};
  q.game.players=[p];p.device='pad:0';p.profileId=q.hero.id;l.sync();l.close(p);
  const s=l.state.members.get(p.id);Object.assign(s,{spawned:true,panel:null,x:750,y:450,panelInputRelease:false});
  const tick=input=>PlayableLobby.prototype.update.call(l,1/60,{[p.device]:input});tick({});
  const a=l.practice.players.find(a=>a.id===p.id),checks=[];
  l.open(p,'environment');
  const choose=label=>{
   const panel=l.nodes.get(p.id),b=[...panel.querySelectorAll('button')].find(b=>b.textContent.includes(label));
   if(!b)throw Error('Missing choice '+label);s.focus=[...panel.querySelectorAll('button')].indexOf(b);
   const before=a.jumpHeight||0;l.navigate(p,{accept:true});tick({jump:true,tvA:true});
   if(s.panel!=='environment'||!l.nodes.get(p.id))throw Error(label+' closed map menu');
   if((a.jumpHeight||0)!==before)throw Error(label+' leaked into jump');
   tick({});checks.push(label);
  };
  choose('Wildbound mode');choose('Forest');choose('Boundless:');choose('Desert');
  const menu=l.nodes.get(p.id);if(!menu.textContent.includes('✓ Desert'))throw Error('Selected map not refreshed');
  const pad={index:0,axes:[0,0],buttons:Array.from({length:16},(_,i)=>({pressed:i===1}))};
  l.controller(pad,Array(16).fill(false));tick({close:true,jump:true,tvA:true});
  if(s.panel!==null||(a.jumpHeight||0)!==0)throw Error('Right face close leaked into jump');
  tick({});l.open(p,'environment');
  [...l.nodes.get(p.id).querySelectorAll('button')].find(b=>b.textContent==='Close').click();
  if(s.panel!==null)throw Error('Close button did not close');tick({});
  const scales=[],screens=[],pen=new Proxy({fillRect(){},save(){},restore(){},translate(){},scale(x,y){scales.push([x,y]);}},{set(o,k,v){o[k]=v;return true;}});
  drawLobbyTelevision(pen,{started:true,draw(_c,_x,_y,w,h){screens.push([w,h]);}},{x:785,y:175});
  if(scales.some(([x,y])=>x!==y)||screens[0][0]/screens[0][1]!==16/9)throw Error('TV is distorted');
  for(const [x,y,height]of [[785,165,0],[723,234,0],[723,234,20]]){
   Object.assign(s,{x,y,panel:null,jumpHeight:height,groundHeight:0,panelInputRelease:false});
   Object.assign(a,{x,y,jumpHeight:height,groundHeight:0,jumpVelocity:0,jumpHeld:false});
   tick({jump:true,tvA:true});
   if(l.television.players.has(p.id)||Math.hypot(a.x-x,a.y-y)>4)throw Error('Jump joined/snapped TV');
   tick({});
  }
  Object.assign(s,{x:785,y:165,jumpHeight:0,groundHeight:0});Object.assign(a,{x:785,y:165,jumpHeight:0,groundHeight:0});
  l.open(p,'television');if(l.television.players.has(p.id))throw Error('Behind-TV interact joined');
  Object.assign(s,{x:723,y:234,jumpHeight:0,groundHeight:0});Object.assign(a,{x:723,y:234,jumpHeight:0,groundHeight:0});
  l.open(p,'television');if(!l.television.players.has(p.id))throw Error('Front-controller interact failed');
  l.television.leave(p.id,s);l.draw();
  return {checks,rightFaceCloses:true,closeButtonCloses:true,noJumpLeak:true,tvUniformScale:scales[0],screen:screens[0],noTvJumpSnap:true,frontOnlyInteract:true,png:l.canvas.toDataURL().split(',')[1]};
 })()`);
 fs.writeFileSync(path.join(out,'lobby.png'),Buffer.from(result.png,'base64'));delete result.png;
 fs.writeFileSync(path.join(out,'report.json'),JSON.stringify(result,null,2));console.log(JSON.stringify(result));app.exit(0);
}).catch(e=>{console.error(e);app.exit(1);});
