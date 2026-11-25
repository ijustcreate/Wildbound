const fs=require('node:fs'),path=require('node:path');
const root=path.resolve(__dirname,'..');
const base=path.resolve(process.env.WILDBOUND_VERIFY_APP||root);
if(!process.versions.electron){
 const {spawnSync}=require('node:child_process');
 const env={...process.env};delete env.ELECTRON_RUN_AS_NODE;
 const executable=process.platform==='win32'?'electron.exe':'electron';
 const result=spawnSync(path.join(root,'node_modules','electron','dist',executable),[__filename,'--mute-audio'],{
  cwd:root,env,encoding:'utf8',timeout:65000,windowsHide:true,
 });
 process.stdout.write(result.stdout||'');process.stderr.write(result.stderr||'');
 if(result.error)console.error(result.error);
 process.exit(result.status??1);
}
const {app,BrowserWindow}=require('electron');
app.disableHardwareAcceleration();
const output=path.join(root,'test-output','minimap-directions',base===root?'source':'packaged');
fs.mkdirSync(output,{recursive:true});
app.setPath('userData',fs.mkdtempSync(path.join(require('node:os').tmpdir(),'minimap-profile-')));
app.whenReady().then(async()=>{
 const win=new BrowserWindow({show:false,width:900,height:700,webPreferences:{backgroundThrottling:false}});
 win.webContents.setAudioMuted(true);
 const errors=[];
 win.webContents.on('console-message',event=>{if(event.level==='error')errors.push(event.message);});
 try{
  await win.loadFile(path.join(base,'index.html'));
  const {checks,images}=await win.webContents.executeJavaScript(`(${verify})()`);
  for(const [name,data] of Object.entries(images))fs.writeFileSync(path.join(output,name+'.png'),Buffer.from(data.split(',')[1],'base64'));
  if(errors.length)throw Error(errors.join('\n'));
  console.log(JSON.stringify({checks,images:Object.keys(images),errors,muted:win.webContents.isAudioMuted()}));app.exit(0);
 }catch(e){console.error(e);app.exit(1);}
});

async function verify(){
 await window.wildboundBoot.ready;
 const [{Game},{Renderer},{drawTrainTestMap},{drawCastleMap},{CASTLE_INTERIOR_SIZE},{CASTLE_INTERIOR_ORIGIN}]=await Promise.all([
  import('./src/core.mjs'),import('./src/render.mjs'),import('./src/train-world-art.mjs'),import('./src/wild-castle-scene.mjs'),
  import('./src/wild-castle-interior.mjs'),import('./src/wild-castle.mjs'),
 ]);
 const g=new Game(()=>.5),player=g.addPlayer('keyboard'),partyMember=g.addPlayer('pad-0');
 g.environment='ice';g.start();
 Object.assign(player,{x:480,y:900,hp:50,color:'#70efbf'});
 Object.assign(partyMember,{x:900,y:900,hp:50,color:'#f2957c',faceX:0,faceY:1});
 g.enemies=[];g.loot=[{x:player.x,y:player.y,type:'arrow'}];g.portals=[{x:player.x,y:player.y,owner:player.id}];
 g.explored=new Set(Array.from({length:2500},(_,i)=>i));
 const width=140,height=160,density=8,checks=[],images={};
 const canvas=document.createElement('canvas');canvas.width=width*density;canvas.height=height*density;
 const ctx=canvas.getContext('2d',{willReadFrequently:true});ctx.scale(density,density);
 function clear(){ctx.fillStyle='#172923';ctx.fillRect(0,0,width,height);}
 function expect(condition,description){if(!condition)throw Error(description);checks.push(description);}
 function at(x,y,[r,g,b]){
  const pixel=ctx.getImageData(Math.floor(x*density),Math.floor(y*density),1,1).data;
  return pixel[0]===r&&pixel[1]===g&&pixel[2]===b;
 }
 const mint=[112,239,191],coral=[242,149,124];
 const verifyHeading=(label,x,y,faceX,faceY,color=mint)=>{
  const length=Math.hypot(faceX,faceY),dx=3.6*faceX/length,dy=3.6*faceY/length;
  expect(at(x,y,color),label+' has a colored body');
  expect(at(x+dx,y+dy,color)&&!at(x-dx,y-dy,color),label+' points forward with a rounded tail');
 };
 const mapRenderer={age:1,camera:{x:player.x,y:player.y}};
 const boundedX=width-65-14+player.x/1600*65,boundedY=height-65-50+player.y/1600*65;
 for(const [label,faceX,faceY] of [['east',1,0],['southeast',1,1],['south',0,1],['west',-1,0],['north',0,-1]]){
  Object.assign(player,{faceX,faceY});clear();Renderer.prototype.minimap.call(mapRenderer,ctx,g,width,height);
  verifyHeading('Forest '+label,boundedX,boundedY,faceX,faceY);
 }
 verifyHeading('Second player',width-65-14+partyMember.x/1600*65,boundedY,0,1,coral);
 images.forest=canvas.toDataURL();
 g.mapMode='boundless';g.explored=new Set();clear();
 Renderer.prototype.minimap.call(mapRenderer,ctx,g,width,height);
 const unit=65/21;
 verifyHeading('Boundless north',width-65-14+10*unit,height-65-50+(10+player.y/32-Math.floor(player.y/32))*unit,0,-1);
 images.boundless=canvas.toDataURL();
 clear();
 const train={ctx};
 const route={design:{width:1200,height:1200,river:{x:700,width:90},cars:[]},route:{points:[{x:100,y:100},{x:1100,y:1100}]}};
 drawTrainTestMap(train,{players:g.players,trainTest:route,phase:'play'},width,height);
 const mw=width*.2;
 verifyHeading('Railway north',width-mw-10+player.x*mw/1200,height-mw-50+player.y*mw/1200,0,-1);
 images.railway=canvas.toDataURL();
 clear();
 const center={...player,x:CASTLE_INTERIOR_ORIGIN.x+CASTLE_INTERIOR_SIZE.width*.5,y:CASTLE_INTERIOR_ORIGIN.y+CASTLE_INTERIOR_SIZE.height*.5,faceX:-1,faceY:0};
 const castleHeight=Math.ceil(CASTLE_INTERIOR_SIZE.height*98/CASTLE_INTERIOR_SIZE.width);
 drawCastleMap(ctx,{},'1',[center],width,height);
 verifyHeading('Castle west',width-98-12+49,height-castleHeight-46+CASTLE_INTERIOR_SIZE.height*49/CASTLE_INTERIOR_SIZE.width,-1,0);
 images.castle=canvas.toDataURL();
 return {checks,images};
}
