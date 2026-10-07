const {app,BrowserWindow}=require('electron'),path=require('node:path'),fs=require('node:fs');
const root=path.resolve(__dirname,'..'),base=process.env.WILDBOUND_VERIFY_APP||root;
app.disableHardwareAcceleration();app.setPath('userData',path.join(root,'test-output/wildlife-storage-profile'));
app.whenReady().then(async()=>{
 const w=new BrowserWindow({show:false,width:1280,height:820,useContentSize:true,webPreferences:{offscreen:true}});
 const errors=[];w.webContents.on('console-message',e=>{if(e.level==='error'&&/Error|Exception/.test(e.message))errors.push(e.message);});
 const run=s=>w.webContents.executeJavaScript('(async()=>{'+s+'})()');
 try{
  await w.loadFile(path.join(base,'index.html'),{query:{tools:'1'}});await run('await window.wildboundBoot.ready;window.storageRAF=requestAnimationFrame.bind(window);window.requestAnimationFrame=()=>0;');
  const result=await run(`
   const {Assets}=await import('./src/assets.mjs'),{Animator}=await import('./src/animation.mjs'),{HeroUI}=await import('./src/hero-ui.mjs'),{Game}=await import('./src/core.mjs'),{ROOM_STATIONS}=await import('./src/shops.mjs'),{tickStorageRoom}=await import('./src/storage-room.mjs');
   const assets=new Assets();await assets.load();const animator=new Animator(assets),pictures={},kinds=['carnivorous_flower','orchid','tsetse','rhino','crocodile','lion'];let samples=0;
   const sheet=document.createElement('canvas');sheet.width=1280;sheet.height=1050;const c=sheet.getContext('2d');c.fillStyle='#142e26';c.fillRect(0,0,sheet.width,sheet.height);
   for(let row=0;row<kinds.length;row++)for(let d=0;d<8;d++){
    const kind=kinds[row],a={kind:kind==='orchid'?'carnivorous_flower':kind,plantVariant:kind==='orchid'?'orchid':undefined,id:70,x:80+d*160,y:120+row*165,hp:100,maxHp:100,faceX:-Math.sin(d*Math.PI/4),faceY:Math.cos(d*Math.PI/4),animationAction:'idle'};animator.draw(c,a,0,75);c.fillStyle='#eddbaf';c.font='11px system-ui';c.fillText(kind+' · '+d,d*160+8,row*165+156);samples++;
   }
   pictures.sheet=sheet.toDataURL();const motion=document.createElement('canvas');motion.width=motion.height=200;const mc=motion.getContext('2d');
   for(const kind of kinds){const frames=new Set();for(let frame=0;frame<12;frame++){mc.clearRect(0,0,200,200);animator.draw(mc,{kind:kind==='orchid'?'carnivorous_flower':kind,plantVariant:kind==='orchid'?'orchid':undefined,id:3,x:100,y:135,hp:100,maxHp:100,faceX:1,faceY:.4,moving:true,animationAction:kind==='carnivorous_flower'||kind==='orchid'?'grab':'walk',playerFrame:frame,step:frame},frame*.1,90);frames.add(motion.toDataURL());samples++;}if(frames.size<3)throw Error(kind+' animation frozen');}
   const g=new Game(()=>.42),p=g.addPlayer('keyboard');g.phase='play';g.time=4;g.portals=[{id:1,owner:p.id,closing:null,color:p.color}];Object.assign(p,{room:1,roomX:90,roomY:183,name:'ROOM QA'});const canvas=document.createElement('canvas');canvas.width=320;canvas.height=240;const host=document.createElement('div'),ui=new HeroUI(host),draw=()=>ui.room(canvas,g,p,g.portals[0],{animator});
   draw();pictures.broken=canvas.toDataURL();g.openShop(p,'robot');if(p.ui?.shop==='robot')throw Error('Broken robot shop accessible');p.ui=null;
   Object.assign(p,{roomX:ROOM_STATIONS.robot.x,roomY:ROOM_STATIONS.robot.y+20});for(let i=0;i<12;i++)tickStorageRoom(g,p,{interact:true},.1,false);draw();pictures.repair=canvas.toDataURL();if(p.robotRepaired)throw Error('Repair finished too early');for(let i=0;i<13;i++)tickStorageRoom(g,p,{interact:true},.1,false);if(!p.robotRepaired)throw Error('Hold did not fix robot');p.roomX=90;p.roomY=183;draw();pictures.online=canvas.toDataURL();if(pictures.online===pictures.broken)throw Error('Repaired visual unchanged');
   g.time=4.1;draw();pictures.dust=canvas.toDataURL();if(pictures.online===pictures.dust)throw Error('Room light/dust frozen');p.ui={storage:0};draw();pictures.open=canvas.toDataURL();if(pictures.open===pictures.dust)throw Error('Open chest lid not drawn');
   return {samples,pictures,checks:'Six wildlife styles / eight facings and distinct motion frames; actual room canvas with broken, repairing, online robot, animated light/dust and chest lid'};
  `);
  fs.mkdirSync(path.join(root,'test-output'),{recursive:true});for(const [name,data] of Object.entries(result.pictures))fs.writeFileSync(path.join(root,'test-output/wildlife-storage-'+name+'.png'),Buffer.from(data.split(',')[1],'base64'));delete result.pictures;result.rendererErrors=errors;console.log(result);if(errors.length)throw Error(errors.join('; '));app.exit(0);
 }catch(e){console.error(e);app.exit(1);}
});
