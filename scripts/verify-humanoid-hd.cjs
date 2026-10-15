const {app,BrowserWindow}=require('electron'),fs=require('node:fs'),path=require('node:path');
const root=path.resolve(__dirname,'..'),base=process.env.WILDBOUND_VERIFY_APP||root,out=path.join(root,'test-output');
fs.mkdirSync(out,{recursive:true});app.disableHardwareAcceleration();app.setPath('userData',fs.mkdtempSync(path.join(out,'humanoid-hd-profile-')));
app.whenReady().then(async()=>{
 const win=new BrowserWindow({show:false,width:1280,height:900,webPreferences:{offscreen:true}}),errors=[];win.webContents.setAudioMuted(true);
 win.webContents.on('console-message',(_event,level,message)=>{if(level===3&&!message.includes('Autofill'))errors.push(message);});
 try{
  await win.loadFile(path.join(base,'index.html'));
  await win.webContents.executeJavaScript('window.wildboundBoot.ready');
  const result=await win.webContents.executeJavaScript(`(async()=>{
   const {drawPlayer,playerMotion,directionVector,projectPoint,playerPose}=await import('./src/player-motion.mjs');
   const {HAIR_STYLES,FACE_STYLES,DEFAULT_APPEARANCE}=await import('./src/appearance.mjs');
   const {humanoidArtStatus,loadHumanoidArt,drawDetailedHair,detailRaster}=await import('./src/humanoid-hd.mjs');
   const {drawHumanHead}=await import('./src/human-head.mjs');
   const {ITEMS}=await import('./src/items.mjs');const {detailedItemCanvas}=await import('./src/item-art.mjs');
   const {captureLayers,releaseLayers,capturedLayers}=await import('./src/render-order.mjs');
   const {Animator}=await import('./src/animation.mjs');
   const {rigSubject}=await import('./src/rig-subjects.mjs');
   if(!await loadHumanoidArt())throw Error('Generated artwork failed to load');
   const model=playerMotion,original=JSON.stringify(model),canvas=document.createElement('canvas');canvas.width=canvas.height=256;
   const c=canvas.getContext('2d',{willReadFrequently:true});
   const render=(actor,legacy=false)=>{c.resetTransform();c.clearRect(0,0,256,256);c.save();c.translate(128,220);c.scale(4,4);c.__legacyHumanoid=legacy;drawPlayer(c,actor,0,model);c.__legacyHumanoid=false;c.restore();return c.getImageData(0,0,256,256).data;};
   const signature=bytes=>{let n=2166136261;for(let i=0;i<bytes.length;i+=4)n=Math.imul(n^bytes[i]^bytes[i+1]^bytes[i+2]^bytes[i+3],16777619);return n>>>0;};
   let rendered=0;const hairHashes=new Set(),faceHashes=new Set();
   for(const hair of Object.keys(HAIR_STYLES))for(let d=0;d<8;d++){
    const [faceX,faceY]=directionVector(d),actor={faceX,faceY,equipment:{},appearance:{...DEFAULT_APPEARANCE,hair},animationAction:'idle',playerFrame:0};
    const pixels=render(actor);if(!pixels.some((v,i)=>i%4===3&&v))throw Error('Blank hair '+hair+'/'+d);
    if(d===0)hairHashes.add(signature(pixels));rendered++;
   }
   if(hairHashes.size!==19)throw Error('Hairstyles collapsed into duplicate visuals');
   for(const face of Object.keys(FACE_STYLES))for(let d=0;d<8;d++){
    const [faceX,faceY]=directionVector(d),pixels=render({faceX,faceY,equipment:{},appearance:{...DEFAULT_APPEARANCE,hair:'none',face},animationAction:'idle',playerFrame:0});
    if(d===0)faceHashes.add(signature(pixels));rendered++;
   }
   if(faceHashes.size!==8)throw Error('Face variants collapsed into duplicate visuals');
   for(const action of ['idle','walk','run','slash','draw','mine','sleep','death'])for(const build of ['standard','broad','slender'])for(let d=0;d<8;d++){
    const [faceX,faceY]=directionVector(d);render({faceX,faceY,equipment:{head:'moon_circlet',chest:'hunter_coat',feet:'ranger_boots',hand1:action==='draw'?'bow':'iron_sword'},appearance:{...DEFAULT_APPEARANCE,hair:'long',build},animationAction:action,playerFrame:2});rendered++;
   }
   const armor=Object.entries(ITEMS).filter(([id,def])=>['head','chest','shoulders','pants','gloves','feet','cape'].includes(def.slot));
   for(const [id,def]of armor){
    const icon=detailedItemCanvas(id);if(icon.width!==96)throw Error('Low resolution icon '+id);
    for(let d=0;d<8;d++){const [faceX,faceY]=directionVector(d);render({faceX,faceY,equipment:{[def.slot]:id},appearance:{...DEFAULT_APPEARANCE,hair:'long'},animationAction:'idle',playerFrame:0});rendered++;}
   }
   const actor={faceX:0,faceY:1,equipment:{},appearance:{...DEFAULT_APPEARANCE,hair:'long'},animationAction:'idle',playerFrame:0};
   if(signature(render(actor))===signature(render(actor,true)))throw Error('Detailed renderer not active');
   const p=Object.fromEntries(Object.entries(playerPose(actor,0)).map(([n,q])=>[n,projectPoint(q,0)]));
   const faceOnly=(points,visible)=>{c.resetTransform();c.clearRect(0,0,256,256);c.save();c.translate(128,200);c.scale(6,6);drawHumanHead(c,points,0,DEFAULT_APPEARANCE.skin,DEFAULT_APPEARANCE,visible,true);c.restore();return signature(c.getImageData(0,0,256,256).data);};
   const baseFace=faceOnly(p,()=>true),moved=structuredClone(p);moved.eyeL.x+=2;
   if(faceOnly(moved,()=>true)===baseFace||faceOnly(p,n=>n!=='eyeL')===baseFace)throw Error('Facial joint/visibility ignored');
   const colors=canvas=>{const bytes=canvas.getContext('2d').getImageData(0,0,canvas.width,canvas.height).data,set=new Set();for(let i=0;i<bytes.length;i+=4)if(bytes[i+3]===255)set.add(bytes[i]+','+bytes[i+1]+','+bytes[i+2]);return set;};
   const flat=document.createElement('canvas');flat.width=flat.height=4;const flatPen=flat.getContext('2d');flatPen.fillStyle='#996633';flatPen.fillRect(0,0,4,4);flatPen.fillStyle='#332211';flatPen.fillRect(0,0,1,4);
   if(colors(detailRaster(flat)).size!==2)throw Error('Material enlargement invented texture colors');
   const hairSheet=document.createElement('canvas');hairSheet.width=hairSheet.height=128;const hp=hairSheet.getContext('2d');hp.translate(64,80);hp.scale(4,4);drawDetailedHair(hp,{x:0,y:0},{hair:'crop',hairColor:'#593923'},0);
   if(colors(hairSheet).size>4)throw Error('Crop hair exceeded four flat shades');
   captureLayers(model);render(actor);releaseLayers(model);
   const head=capturedLayers(model,0).find(p=>p.id==='Head and headwear');
   if(!head||head.sprite.pixels.filter(Boolean).length<70||head.sprite.palette.length<15)throw Error('Studio cannot capture generated head/hair');
   const custom=structuredClone(model);custom.boneSprites={'Head and headwear':{0:{x:-3,y:-3,width:6,height:6,palette:['transparent','#ff00ff'],pixels:Array(36).fill(1)}}};
   c.resetTransform();c.clearRect(0,0,256,256);c.save();c.translate(128,220);c.scale(4,4);drawPlayer(c,actor,0,custom);c.restore();
   const marker=c.getImageData(0,0,256,256).data;if(!marker.some((v,i)=>i%4===0&&v===255&&marker[i+1]===0&&marker[i+2]===255))throw Error('Custom painted head lost');
   if(JSON.stringify(model)!==original)throw Error('Rendering mutated authored rig');
   const animator=new Animator({});c.resetTransform();
   animator.draw(c,{...actor,sprite:'player',x:120,y:170,animationAction:undefined,playerFrame:undefined},0,48);
   if([...animator.playerFrames.values()][0]?.width!==384)throw Error('World idle cache discards detail');
   animator.draw(c,{...actor,sprite:'player',x:120,y:170,animationAction:'run',playerFrame:3},0,48);
   if(animator.humanoidSurface.width!==512)throw Error('Moving world raster discards detail');
   for(const subject of ['zombie','succubus','imp','banshee_queen','necromancer']){const s=rigSubject(subject);if(s){c.save();c.translate(100,120);s.draw(c,{faceX:0,faceY:1,animationAction:'idle',playerFrame:0,equipment:{},hp:100},0,s.data);c.restore();}}
   const sheet=document.createElement('canvas');sheet.width=1440;sheet.height=920;const pen=sheet.getContext('2d');pen.imageSmoothingEnabled=false;pen.fillStyle='#182b28';pen.fillRect(0,0,1440,920);pen.fillStyle='#f2ddb4';pen.font='24px system-ui';pen.fillText('Wildbound · existing rig / revised asset fit',26,36);
   const looks=[{label:'Elf / layered hair',hair:'long',face:'elf',skin:'#d9ab76',hairColor:'#272c35',shirt:'#657e87',pants:'#58626e',gear:{feet:'ranger_boots',gloves:'cloth_wraps'}},{label:'Ponytail / scout',hair:'ponytail',face:'freckles',skin:'#e7c199',hairColor:'#593923',shirt:'#78765a',pants:'#395848',gear:{chest:'hunter_coat',feet:'ranger_boots'}},{label:'Plate / fitted equipment',hair:'bob',face:'classic',skin:'#b97850',hairColor:'#332b29',shirt:'#547567',pants:'#555b69',gear:{head:'moon_circlet',chest:'sun_plate',shoulders:'moon_shoulders',gloves:'iron_gauntlets',pants:'ash_greaves',feet:'moon_steps'}}];
   for(let row=0;row<looks.length;row++){
    const look=looks[row];pen.fillStyle='#ead5ac';pen.font='15px system-ui';pen.fillText(look.label,26,72+row*276);
    for(let d=0;d<8;d++){
     const x=90+d*178,y=300+row*276;pen.fillStyle='#234038';pen.fillRect(x-75,y-211,150,220);
     const [faceX,faceY]=directionVector(d);pen.save();pen.translate(x,y);pen.scale(4.8,4.8);drawPlayer(pen,{faceX,faceY,equipment:look.gear,appearance:{...DEFAULT_APPEARANCE,...look},animationAction:'idle',playerFrame:0},0,model);pen.restore();
     pen.fillStyle='#91ab9a';pen.font='12px system-ui';pen.fillText(['Front','Front left','Left','Rear left','Back','Rear right','Right','Front right'][d],x-35,y+24);
    }
   }
   const cycles={};
   for(const action of ['walk','run']){
    const grid=document.createElement('canvas');grid.width=1024;grid.height=1440;const g=grid.getContext('2d');g.imageSmoothingEnabled=false;
    g.fillStyle='#182b28';g.fillRect(0,0,grid.width,grid.height);
    for(let d=0;d<8;d++)for(let frame=0;frame<8;frame++){
      const [faceX,faceY]=directionVector(d),x=64+frame*128,y=162+d*180;
      g.fillStyle='#294238';g.fillRect(x-48,y-150,96,158);g.save();g.translate(x,y);g.scale(3.5,3.5);
      drawPlayer(g,{faceX,faceY,animationAction:action,playerFrame:frame,equipment:{},appearance:{...DEFAULT_APPEARANCE,hair:'crop',shirt:'#bb8c35',pants:'#655039',hairColor:'#593923'}},0,model);g.restore();
      g.fillStyle='#d1c394';g.font='11px sans-serif';g.fillText(action+' '+['S','SW','W','NW','N','NE','E','SE'][d]+' / '+frame,x-40,y+19);rendered++;
    }
    cycles[action]=grid.toDataURL();
   }
   return {report:{rendered,hair:hairHashes.size,faces:faceHashes.size,armor:armor.length,rigUnchanged:true,facialJointAndVisibility:true,studioCapture:true,customPaint:true,worldDensity:true,flatMaterialColors:true,fourShadeCrop:true,postureRevision:model.postureRevision,art:humanoidArtStatus()},sheet:sheet.toDataURL(),cycles};
  })()`);
  fs.writeFileSync(path.join(out,'humanoid-hd-review.png'),Buffer.from(result.sheet.split(',')[1],'base64'));
  for(const [action,png]of Object.entries(result.cycles))fs.writeFileSync(path.join(out,'humanoid-'+action+'-cycle.png'),Buffer.from(png.split(',')[1],'base64'));
  fs.writeFileSync(path.join(out,'humanoid-hd-report.json'),JSON.stringify({...result.report,rendererErrors:errors},null,2));
  if(errors.length)throw Error(errors.join('\n'));console.log(JSON.stringify(result.report,null,2));app.exit(0);
 }catch(e){console.error(e.stack);app.exit(1);}
});
