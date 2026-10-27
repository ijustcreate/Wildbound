const {app,BrowserWindow}=require('electron'),fs=require('node:fs'),path=require('node:path');
const root=path.resolve(__dirname,'..'),base=process.env.WILDBOUND_VERIFY_APP||root,out=path.join(root,'test-output','headwear-capes');
fs.mkdirSync(out,{recursive:true});app.setPath('userData',fs.mkdtempSync(path.join(out,'glasses-profile-')));app.disableHardwareAcceleration();
app.whenReady().then(async()=>{
 const w=new BrowserWindow({show:false});w.webContents.setAudioMuted(true);await w.loadFile(path.join(base,'index.html'));await w.webContents.executeJavaScript('window.wildboundBoot.ready');
 const result=await w.webContents.executeJavaScript(`(async()=>{
  const {appearanceControls,DEFAULT_APPEARANCE}=await import('./src/appearance.mjs');
  const {drawPlayer,playerMotion,directionVector}=await import('./src/player-motion.mjs');
  const {ITEMS}=await import('./src/items.mjs');
  const {captureLayers,releaseLayers,capturedLayers}=await import('./src/render-order.mjs');
  const look={...DEFAULT_APPEARANCE},root=document.createElement('div');let changes=0;
  appearanceControls(root,look,()=>changes++,{compact:true});const select=root.querySelector('[aria-label="Face details"]');
  if(![...select.options].some(o=>o.value==='glasses'))throw Error('Glasses missing from creation');
  select.value='glasses';select.dispatchEvent(new Event('change'));if(look.face!=='glasses'||changes!==1)throw Error('Selection did not update appearance');
  const hats=['hat','leather_hood','moon_helm','reaper_hood','ghost_hood'];const canvas=document.createElement('canvas');canvas.width=1120;canvas.height=1000;const c=canvas.getContext('2d');c.imageSmoothingEnabled=false;c.fillStyle='#172e2b';c.fillRect(0,0,1120,1000);c.fillStyle='#e8d8af';c.font='bold 20px sans-serif';c.fillText('HEADWEAR + GLASSES / EQUIPMENT OVERLAY CHECK',20,30);
  let captures=0;
  for(let row=0;row<hats.length;row++){const id=hats[row],y=70+row*185;c.fillStyle='#d0c29f';c.font='14px sans-serif';c.fillText(ITEMS[id].name+' / glasses above equipment',20,y);
   for(let d=0;d<8;d++){const [faceX,faceY]=directionVector(d);const actor={hp:100,faceX,faceY,appearance:look,equipment:{head:id},animationAction:'run',playerFrame:2};
    c.save();c.translate(65+d*138,y+145);c.scale(3,3);drawPlayer(c,actor,0,playerMotion);c.restore();
   }
  }
  const pen=document.createElement('canvas').getContext('2d');pen.canvas.width=pen.canvas.height=256;pen.translate(100,140);
  for(const id of Object.keys(ITEMS).filter(id=>ITEMS[id].slot==='head'))for(let d=0;d<8;d++){
   const [faceX,faceY]=directionVector(d);captureLayers(playerMotion);drawPlayer(pen,{hp:100,faceX,faceY,appearance:look,equipment:{head:id}},0,playerMotion);releaseLayers(playerMotion);
   const head=capturedLayers(playerMotion,d).find(l=>l.id==='Head and headwear');if(!head?.sprite.pixels.some(Boolean))throw Error('Missing editable head '+id+' '+d);captures++;
  }
  return {png:canvas.toDataURL().split(',')[1],report:{faceOption:look.face,headgear:23,directions:8,editableCaptures:captures}};
 })()`);
 fs.writeFileSync(path.join(out,'glasses-over-headwear.png'),Buffer.from(result.png,'base64'));fs.writeFileSync(path.join(out,'glasses-report.json'),JSON.stringify(result.report,null,2));console.log(JSON.stringify(result.report));app.exit(0);
}).catch(e=>{console.error(e);app.exit(1);});
