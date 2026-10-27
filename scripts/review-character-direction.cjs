const {app,BrowserWindow}=require('electron');
const fs=require('node:fs'),path=require('node:path');
const root=path.resolve(__dirname,'..'),base=process.env.WILDBOUND_VERIFY_APP||root,out=path.join(root,'test-output','character-direction');
fs.mkdirSync(out,{recursive:true});app.setPath('userData',fs.mkdtempSync(path.join(out,'profile-')));app.disableHardwareAcceleration();
app.whenReady().then(async()=>{
 const win=new BrowserWindow({show:false});win.webContents.setAudioMuted(true);
 await win.loadFile(path.join(base,'index.html'));await win.webContents.executeJavaScript('window.wildboundBoot.ready');
 const result=await win.webContents.executeJavaScript(`(async()=>{
  const {drawPlayer,playerMotion,directionVector}=await import('./src/player-motion.mjs');
  const {HAIR_STYLES,appearanceControls,DEFAULT_APPEARANCE}=await import('./src/appearance.mjs');
  const {FACIAL_HAIR_STYLES}=await import('./src/hair-design.mjs');
  const {skeletonMotions,drawSkeleton}=await import('./src/skeleton-motion.mjs');
  const {Animator}=await import('./src/animation.mjs');
  const {drawArrowTrail,drawFlyingArrow,arrowVisualAngle}=await import('./src/embedded-arrow.mjs');
  const {captureLayers,releaseLayers,capturedLayers}=await import('./src/render-order.mjs');
  const rows=[...Object.keys(HAIR_STYLES).map(hair=>({label:'Hair / '+HAIR_STYLES[hair],appearance:{...DEFAULT_APPEARANCE,hair}})),...Object.keys(FACIAL_HAIR_STYLES).filter(s=>s!=='none').map(facialHair=>({label:'Facial hair / '+FACIAL_HAIR_STYLES[facialHair],appearance:{...DEFAULT_APPEARANCE,hair:'sidepart',face:'freckles',facialHair}})),...Object.keys(skeletonMotions).filter(s=>s!=='krampus').map(kind=>({label:kind,kind}))];
  const sheets=[];
  for(let start=0;start<rows.length;start+=6){
   const batch=rows.slice(start,start+6),canvas=document.createElement('canvas');canvas.width=1120;canvas.height=batch.length*180+55;const c=canvas.getContext('2d');c.imageSmoothingEnabled=false;c.fillStyle='#172e2b';c.fillRect(0,0,canvas.width,canvas.height);
   c.fillStyle='#e9d9af';c.font='bold 20px sans-serif';c.fillText('WILDBOUND / NATIVE HAIR + BONE REVIEW',20,30);
   batch.forEach((row,i)=>{const y=68+i*180;c.fillStyle='#cbbf9c';c.font='14px sans-serif';c.fillText(row.label,20,y);
    for(let d=0;d<8;d++){const [faceX,faceY]=directionVector(d),actor={hp:100,faceX,faceY,inventory:[],equipment:{},...row};c.save();c.translate(68+d*138,y+143);c.scale(3.5,3.5);if(row.kind)drawSkeleton(c,actor,.12,skeletonMotions[row.kind]);else drawPlayer(c,actor,.12,playerMotion);c.restore();
     c.save();c.translate(110+d*138,y+145);if(row.kind)drawSkeleton(c,actor,.12,skeletonMotions[row.kind]);else drawPlayer(c,actor,.12,playerMotion);c.restore();
    }
   });sheets.push(canvas.toDataURL().split(',')[1]);
  }
  const ui=document.createElement('div'),look={...DEFAULT_APPEARANCE};appearanceControls(ui,look,()=>{});
  if(!ui.textContent.includes('Hair construction')||!ui.textContent.includes('Facial hair'))throw Error('Construction controls missing');
  const beard=ui.querySelectorAll('select');if(![...beard].some(s=>[...s.options].some(o=>o.value==='moustache')))throw Error('Facial hair menu missing');
  const canvas=document.createElement('canvas');canvas.width=960;canvas.height=360;const c=canvas.getContext('2d');c.fillStyle='#24302f';c.fillRect(0,0,960,360);c.imageSmoothingEnabled=false;
  const animator=new Animator(),scenarios=[{label:'Day / unlit colors',ambient:1,sources:[]},{label:'Night / cool ambient',ambient:0,sources:[]},{label:'Torch / warm from left',ambient:0,sources:[{x:135,y:240,radius:260,intensity:1,color:'#ffb05d'}]},{label:'Magic / cool from right',ambient:0,sources:[{x:850,y:180,radius:230,intensity:1,color:'#84dfff'}]}];
  scenarios.forEach((scene,i)=>{c.fillStyle='#ebd9b0';c.font='14px sans-serif';c.fillText(scene.label,i*240+12,24);c.save();c.translate(i*240,0);animator.lighting={...scene,sources:scene.sources.map(s=>({...s,x:s.x-i*240}))};animator.draw(c,{kind:'player',x:120,y:245,hp:100,faceX:0,faceY:1,appearance:{...DEFAULT_APPEARANCE,shirt:'#3e756c',pants:'#38455e',hairColor:'#613c32'},equipment:{hand1:'sword'},inventory:[]},.12,144);c.restore();});
  const arrow={x:860,y:318,z:10,vx:300,vy:-80,vz:0,flightTrail:Array.from({length:16},(_,i)=>({x:750+i*7,y:340-i*2,time:1-.15+i*.01}))};drawArrowTrail(c,arrow,1);c.save();c.translate(arrow.x,arrow.y-arrow.z);c.rotate(arrowVisualAngle(arrow));drawFlyingArrow(c,arrow,1);c.restore();
  captureLayers(playerMotion);const pen=document.createElement('canvas').getContext('2d');pen.canvas.width=pen.canvas.height=256;pen.translate(100,100);drawPlayer(pen,{faceX:0,faceY:1,hp:100,appearance:{...DEFAULT_APPEARANCE,hair:'long'},equipment:{}},0);releaseLayers(playerMotion);if(!capturedLayers(playerMotion,0).some(layer=>layer.id==='Hair / nape and accessory'&&layer.sprite.pixels.some(Boolean)))throw Error('Hair part is not editable');
  return {sheets,lighting:canvas.toDataURL().split(',')[1],report:{styles:Object.keys(HAIR_STYLES).length,facialHair:Object.keys(FACIAL_HAIR_STYLES).length,views:8,skeletons:Object.fromEntries(Object.entries(skeletonMotions).map(([id,m])=>[id,m.nativeSkeletonRevision||0])),constructionControls:true,editableHair:true}};
 })()`);
 result.sheets.forEach((data,i)=>fs.writeFileSync(path.join(out,'sheet-'+i+'.png'),Buffer.from(data,'base64')));fs.writeFileSync(path.join(out,'lighting.png'),Buffer.from(result.lighting,'base64'));fs.writeFileSync(path.join(out,'report.json'),JSON.stringify(result.report,null,2));console.log(JSON.stringify(result.report));app.exit(0);
}).catch(e=>{console.error(e);app.exit(1);});
