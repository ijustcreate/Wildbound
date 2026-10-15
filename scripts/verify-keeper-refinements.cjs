const {app,BrowserWindow}=require('electron'),fs=require('node:fs'),path=require('node:path');
const root=path.resolve(__dirname,'..'),out=path.join(root,'test-output','keeper-refinements');
fs.mkdirSync(out,{recursive:true});app.disableHardwareAcceleration();app.setPath('userData',fs.mkdtempSync(path.join(out,'profile-')));
app.whenReady().then(async()=>{
 const w=new BrowserWindow({show:false,width:1100,height:900}),errors=[];w.webContents.on('console-message',e=>{if(e.level==='error')errors.push(e.message);});
 try{
 await w.loadFile(path.join(root,'index.html'));const result=await w.webContents.executeJavaScript(`(async()=>{
  await window.wildboundBoot.ready;window.requestAnimationFrame=()=>0;
  const [{drawPlayer,playerMotion,directionVector},{Animator},{Assets},art,{getNpcQuestConfig}]=await Promise.all([import('./src/player-motion.mjs'),import('./src/animation.mjs'),import('./src/assets.mjs'),import('./src/keeper-gear-art.mjs'),import('./src/npc-quest-data.mjs')]);
  const assets=new Assets();await assets.load();const animator=new Animator(assets),cfg=getNpcQuestConfig(),original=JSON.stringify(playerMotion);
  const sheet=document.createElement('canvas');sheet.width=1200;sheet.height=850;const c=sheet.getContext('2d');c.imageSmoothingEnabled=false;c.fillStyle='#20302e';c.fillRect(0,0,1200,850);c.fillStyle='#eee2bc';c.font='18px sans-serif';c.fillText('The Keeper · two antlers and Amulet of Open Doors',20,28);
  const atlas=document.createElement('canvas');atlas.width=384;atlas.height=96;const a=atlas.getContext('2d');
  for(let d=0;d<8;d++){a.save();a.translate(d*48,0);art.keeperHeadgear(a,'keeper_crown',{x:24,y:26},d);a.restore();a.save();a.translate(d*48,48);art.keeperBand(a,'keeper_band',{x:24,y:26},d);a.restore();}
  for(const [i,id]of ['keeper_crown','keeper_band'].entries()){c.save();c.translate(40+i*170,65);c.scale(4,4);art.paintKeeperItem(c,id);c.restore();}
  let poses=0;
  for(const [row,action]of ['idle','run','slash','draw','sleep','death'].entries())for(let d=0;d<8;d++){
   const [faceX,faceY]=directionVector(d),actor={sprite:'player',x:d*145+74,y:row*104+270,faceX,faceY,equipment:cfg.equipment,appearance:cfg.appearance,animationAction:action,playerFrame:2,hp:100};
   animator.draw(c,actor,0,72);poses++;
   // Native gameplay-scale sample beside the enlarged assembled figure.
   animator.draw(c,{...actor,x:actor.x+47,y:actor.y},0,28);
  }
  if(JSON.stringify(playerMotion)!==original)throw Error('Asset rendering mutated authored rig');
  return {poses,pictures:{assembled:sheet.toDataURL(),attachments:atlas.toDataURL()},authoredRigUnchanged:true};
 })()`);
 for(const [name,url]of Object.entries(result.pictures))fs.writeFileSync(path.join(out,name+'.png'),Buffer.from(url.split(',')[1],'base64'));delete result.pictures;
 const part=(id,joint,row)=>({id,joint,views:Array.from({length:8},(_,direction)=>({direction,file:'attachments.png',rect:[direction*48,row*48,48,48],pivot:[24,26],size:[48,48],offset:[0,0]}))});
 fs.writeFileSync(path.join(out,'manifest.json'),JSON.stringify({version:1,subject:'player',pixelDensity:1,parts:[part('keeper_crown','head',0),part('keeper_amulet','chest',1)]},null,2));
 if(errors.length)throw Error(errors.join('\n'));result.errors=errors;fs.writeFileSync(path.join(out,'report.json'),JSON.stringify(result,null,2));console.log(JSON.stringify(result));app.exit(0);
 }catch(e){console.error(e);app.exit(1);}
});
