const {app,BrowserWindow}=require('electron'),fs=require('node:fs'),path=require('node:path');
const root=path.resolve(__dirname,'..'),base=process.env.WILDBOUND_VERIFY_APP||root,out=path.join(root,'test-output','lobby-footprints');
fs.mkdirSync(out,{recursive:true});app.setPath('userData',fs.mkdtempSync(path.join(out,'profile-')));app.disableHardwareAcceleration();
app.whenReady().then(async()=>{
 const win=new BrowserWindow({show:false,width:1280,height:850,webPreferences:{backgroundThrottling:false}});win.webContents.setAudioMuted(true);win.showInactive();
 await win.loadFile(path.join(base,'index.html'),{query:{tools:'1'}});await win.webContents.executeJavaScript('window.wildboundBoot.ready');
 const result=await win.webContents.executeJavaScript(`(()=>{
  const q=window.previewCharacterSelect(),l=q.lobby,p=q.first,s=l.state.members.get(p.id);
  q.game.players=[p];p.profileId=q.hero.id;l.sync();
  s.panel=null;s.spawned=true;s.x=400;s.y=430;
  for(let i=0;i<14;i++)l.practice.stepPractice(.05,q.game.players,l.state.members,{[p.device]:{x:1}});
  if(!l.practice.footprints.length)throw Error('Lobby did not generate footprints');
  const tracks=l.practice.footprints,ctx=l.canvas.getContext('2d');l.draw();
  const withTracks=ctx.getImageData(0,0,l.canvas.width,l.canvas.height).data;
  l.practice.footprints=[];l.draw();const without=ctx.getImageData(0,0,l.canvas.width,l.canvas.height).data;
  let changed=0;for(let i=0;i<withTracks.length;i+=4)if(withTracks[i]!==without[i]||withTracks[i+1]!==without[i+1]||withTracks[i+2]!==without[i+2])changed++;
  if(changed<5)throw Error('Lobby footprints generated but not visible');
  l.practice.footprints=tracks;l.draw();
  window.lobbyFloorQA=q;
  return {footprints:tracks.length,changedPixels:changed,png:l.canvas.toDataURL().split(',')[1]};
 })()`);
 fs.writeFileSync(path.join(out,'lobby.png'),Buffer.from(result.png,'base64'));delete result.png;
 result.totem=[];
 for(const [width,height]of [[1280,850],[800,600],[420,640]]){
  win.setContentSize(width,height);
  await new Promise(resolve=>setTimeout(resolve,100));
  const layout=await win.webContents.executeJavaScript(`(()=>{
   const q=window.lobbyFloorQA,l=q.lobby;
   for(const p of q.game.players)l.close(p);
   l.open(q.first,'difficulty');l.draw();l.positionPanels();
   const panel=l.nodes.get(q.first.id),b=panel.getBoundingClientRect(),bounds=l.panels.getBoundingClientRect(),c=l.canvas.getBoundingClientRect(),v=l.view;
   const x=c.left+c.width/2+(955-v.x)*v.zoom,y=c.top+c.height/2+(165-v.y)*v.zoom;
   if(b.left<bounds.left-1||b.right>bounds.right+1||b.top<bounds.top-1||b.bottom>bounds.bottom+1)throw Error('Totem popup is outside viewport');
   if(b.right<x-14||b.left>x+14)throw Error('Totem popup is not next to totem');
   return {width:innerWidth,height:innerHeight,totem:{x,y},panel:{x:b.x,y:b.y,width:b.width,height:b.height}};
  })()`);
  result.totem.push(layout);
  await new Promise(resolve=>setTimeout(resolve,150));
  fs.writeFileSync(path.join(out,'totem-'+width+'.png'),(await win.webContents.capturePage()).toPNG());
 }
 fs.writeFileSync(path.join(out,'report.json'),JSON.stringify(result,null,2));console.log(JSON.stringify(result));app.exit(0);
}).catch(e=>{console.error(e);app.exit(1);});
