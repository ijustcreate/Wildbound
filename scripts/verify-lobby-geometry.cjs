const {app,BrowserWindow}=require('electron'),fs=require('node:fs'),path=require('node:path');
const root=path.resolve(__dirname,'..'),base=process.env.WILDBOUND_VERIFY_APP||root,out=path.join(root,'test-output','lobby-geometry');
fs.mkdirSync(out,{recursive:true});app.setPath('userData',fs.mkdtempSync(path.join(out,'profile-')));app.disableHardwareAcceleration();
app.whenReady().then(async()=>{
 const win=new BrowserWindow({show:false,width:1280,height:850,webPreferences:{backgroundThrottling:false}});win.webContents.setAudioMuted(true);
 await win.loadFile(path.join(base,'index.html'),{query:{tools:'1'}});await win.webContents.executeJavaScript('window.wildboundBoot.ready');
 const result=await win.webContents.executeJavaScript(`(async()=>{
  const {LOBBY_FLOOR,LOBBY_TV}=await import('./src/lobby-geometry.mjs');
  const q=window.previewCharacterSelect(),l=q.lobby,p=q.first;l.update=()=>{};
  q.game.players=[p];p.profileId=q.hero.id;l.sync();l.close(p);
  const s=l.state.members.get(p.id);Object.assign(s,{spawned:true,panel:null,x:785,y:210});
  const tick=input=>l.practice.stepPractice(1/120,[p],l.state.members,{[p.device]:input});tick({});
  const a=l.practice.players[0],edges=[];
  for(const [x,y,dx,dy]of [[30,400,-60,0],[1010,400,60,0],[600,80,0,-60],[600,606,0,60]]){
   Object.assign(a,{x,y,jumpHeight:0,groundHeight:0});l.practice.moveActor(a,dx,dy);
   if(a.x<LOBBY_FLOOR.left+8||a.x>LOBBY_FLOOR.right-8||a.y<LOBBY_FLOOR.top+8||a.y>LOBBY_FLOOR.bottom-8)throw Error('Feet left the floor');
   edges.push({x:a.x,y:a.y});
  }
  Object.assign(s,{x:785,y:210});Object.assign(a,{x:785,y:210,jumpHeight:0,groundHeight:0,jumpVelocity:0,jumpHeld:false,jumpGroundVX:0,jumpGroundVY:0});
  const sheet=document.createElement('canvas');sheet.width=1440;sheet.height=780;const c=sheet.getContext('2d');c.fillStyle='#162b25';c.fillRect(0,0,1440,780);
  let previous=a.y,maxStep=0,peak=0,crossed=false;
  for(let i=0;i<120;i++){
   tick({y:-1,jump:i<65});maxStep=Math.max(maxStep,Math.abs(a.y-previous));previous=a.y;peak=Math.max(peak,a.jumpHeight||0);
   if(a.y<LOBBY_TV.y-8)crossed=true;
   if(i%15===0){
    l.draw();const v=l.view,cv=l.canvas;
    const px=cv.width/2+(785-v.x)*v.zoom*cv.width/cv.clientWidth;
    const py=cv.height/2+(155-v.y)*v.zoom*cv.height/cv.clientHeight;
    const zoom=v.zoom*cv.width/cv.clientWidth;
    const x=(i/15%4)*360,y=Math.floor(i/60)*390;
    c.drawImage(cv,px-120*zoom,py-200*zoom,240*zoom,270*zoom,x+20,y,320,360);
    c.fillStyle='#f1e3b4';c.font='14px system-ui';c.fillText((i/120).toFixed(2)+'s · height '+(a.jumpHeight||a.groundHeight||0).toFixed(1),x+10,y+380);
   }
  }
  if(!crossed||maxStep>3||peak<LOBBY_TV.height)throw Error('TV jump crossed by a position snap or failed to clear cabinet');
  l.draw();return {edges,tv:LOBBY_TV,peak,maxStep,crossed,film:sheet.toDataURL().split(',')[1],lobby:l.canvas.toDataURL().split(',')[1]};
 })()`);
 for(const key of ['film','lobby']){fs.writeFileSync(path.join(out,key+'.png'),Buffer.from(result[key],'base64'));delete result[key];}
 fs.writeFileSync(path.join(out,'report.json'),JSON.stringify(result,null,2));console.log(JSON.stringify(result));app.exit(0);
}).catch(e=>{console.error(e);app.exit(1);});
