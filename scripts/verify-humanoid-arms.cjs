const {app,BrowserWindow}=require('electron'),fs=require('node:fs'),path=require('node:path');
const root=path.resolve(__dirname,'..'),base=process.env.WILDBOUND_VERIFY_APP||root,out=path.join(root,'test-output');
fs.mkdirSync(out,{recursive:true});app.disableHardwareAcceleration();app.setPath('userData',fs.mkdtempSync(path.join(out,'humanoid-arms-profile-')));
app.whenReady().then(async()=>{
 const win=new BrowserWindow({show:false,width:1280,height:900,webPreferences:{offscreen:true}}),errors=[];
 win.webContents.on('console-message',event=>{if(event.level==='error')errors.push(event.message);});
 try{
  if(base!==root)for(const file of ['src/humanoid-hd.mjs','src/player-motion.mjs','src/render-order.mjs','src/keeper-gear-art.mjs','authored/rigs.json']){
   if(!fs.readFileSync(path.join(base,file)).equals(fs.readFileSync(path.join(root,file))))throw Error('Packaged source mismatch: '+file);
  }
  await win.loadFile(path.join(base,'index.html'));await win.webContents.executeJavaScript('window.wildboundBoot.ready');
  const result=await win.webContents.executeJavaScript(`(async()=>{
   const {drawPlayer,playerMotion,directionVector,playerPose,projectPoint}=await import('./src/player-motion.mjs');
   const {DEFAULT_APPEARANCE}=await import('./src/appearance.mjs');
   const {loadHumanoidArt,detailedChain}=await import('./src/humanoid-hd.mjs');
   const {renderLayers,captureLayers,releaseLayers,capturedLayers}=await import('./src/render-order.mjs');
   if(!await loadHumanoidArt())throw Error('Humanoid art unavailable');
   const model=playerMotion,before=JSON.stringify(model),canvas=document.createElement('canvas');canvas.width=canvas.height=384;
   const c=canvas.getContext('2d',{willReadFrequently:true});let poses=0,depthChecks=0,maskChecks=0;
   const actor=(action,d,frame=0,gear={},build='standard')=>{const [faceX,faceY]=directionVector(d);return {faceX,faceY,equipment:gear,appearance:{...DEFAULT_APPEARANCE,build},animationAction:action,playerFrame:frame,hp:100};};
   const render=(a,m=model)=>{c.resetTransform();c.clearRect(0,0,384,384);c.save();c.translate(192,300);c.scale(5,5);drawPlayer(c,a,0,m);c.restore();poses++;return c.getImageData(0,0,384,384).data;};
   const assert=(condition,message)=>{if(!condition)throw Error(message);};
   for(const action of ['idle','walk','run'])for(let d=0;d<8;d++)for(let frame=0;frame<model.clips[action].length;frame++){
    const a=actor(action,d,frame),p=Object.fromEntries(Object.entries(playerPose(a,0,model)).map(([n,q])=>[n,projectPoint(q,d)]));render(a);
    const order=renderLayers(model,d),body=order.indexOf('Body and pelvis');
    for(const side of ['L','R']){
     const upper=order.indexOf('Upper arm '+side);assert(upper>=0,'Missing upper arm');
     if(Math.abs(p['shoulder'+side].depth-p.chest.depth)>.8){
      assert((upper>body)===(p['shoulder'+side].depth>p.chest.depth),'Swing reordered sleeve: '+[action,d,frame,side]);depthChecks++;
     }
    }
   }
   // The split is a partition of one complete skin silhouette, with no elbow
   // hole or doubled outline. Check both bent and straight animated chains.
   for(const action of ['idle','run','punch','draw','death'])for(let d=0;d<8;d++)for(const side of ['L','R']){
    const p=Object.fromEntries(Object.entries(playerPose(actor(action,d,2),0,model)).map(([n,q])=>[n,projectPoint(q,d)]));
    const points=[p['shoulder'+side],p['elbow'+side],p['hand'+side]],widths=[3.5,3.2,3];
    const chain=parts=>{c.resetTransform();c.clearRect(0,0,384,384);c.save();c.translate(192,300);c.scale(5,5);c.__humanoidDetail=true;for(const part of parts)detailedChain(c,points,widths,DEFAULT_APPEARANCE.skin,12,'round',part);c.__humanoidDetail=false;c.restore();return c.getImageData(0,0,384,384).data;};
    const full=chain([null]),split=chain([[0],[1]]);assert(full.every((v,i)=>v===split[i]),'Elbow partition changed coverage '+[action,d,side]);maskChecks++;
   }
   const loadouts=[{}, {chest:'hunter_coat',gloves:'cloth_wraps',hand1:'iron_sword'}, {chest:'sun_plate',shoulders:'moon_shoulders',gloves:'iron_gauntlets',hand2:'moon_shield'}, {hand1:'bow',back:'starter_quiver'}, {cape:'ranger_cape',hand1:'starter_wand'}, {shoulders:'succubus_wings',head:'keeper_crown'}];
   for(const gear of loadouts)for(const build of ['standard','broad','slender'])for(const action of ['idle','run','draw','block','slash','death'])for(let d=0;d<8;d++){
    const a=actor(action,d,2,gear,build);a.appearance.hair='long';const pixels=render(a);assert(pixels.some((v,i)=>i%4===3&&v),'Blank equipped pose');
    const order=renderLayers(model,d);for(const [side,slot]of [['R','hand1'],['L','hand2']])if(action!=='death'&&gear[slot]&&gear[slot]!=='bow')assert(order.indexOf('Held item '+side)===order.indexOf('Forearm '+side)+1,'Item lost its grip '+JSON.stringify({gear,build,action,d,side,order}));
   }
   for(const action of Object.keys(model.clips))for(let d=0;d<8;d++)for(const frame of [0,(model.clips[action].length-1)/2,model.clips[action].length-1])render(actor(action,d,frame));
   for(let d=0;d<8;d++){
    const custom=structuredClone(model);custom.boneSprites={['Arm R']:{[d]:{x:-2,y:-2,width:4,height:4,palette:['transparent','#ff00ff'],pixels:Array(16).fill(1)}}};
    const original=JSON.stringify(custom),pixels=render(actor('idle',d),custom);
    assert(!renderLayers(custom,d).includes('Upper arm R'),'Split painted whole arm');
    if(d===0)assert(pixels.some((v,i)=>i%4===0&&v===255&&pixels[i+1]===0&&pixels[i+2]===255),'Lost custom arm pixels');
    assert(JSON.stringify(custom)===original,'Mutated custom model');
    custom.renderOrder={[d]:['Arm L','Arm R','Body and pelvis']};delete custom.boneSprites;render(actor('idle',d),custom);
    assert(!renderLayers(custom,d).some(id=>id.startsWith('Upper arm')),'Changed authored whole-arm ordering');
   }
   captureLayers(model);render(actor('idle',6));releaseLayers(model);
   const layers=capturedLayers(model,6);for(const name of ['Upper arm R','Forearm R'])assert(layers.find(q=>q.id===name)?.sprite.pixels.some(Boolean),'Studio cannot paint '+name);
   const edited=structuredClone(model);edited.boneSprites={'Forearm R':{6:layers.find(q=>q.id==='Forearm R').sprite}};
   render(actor('idle',6),edited);assert(renderLayers(edited,6).includes('Upper arm R'),'Painting the new forearm removed its sleeve');
   assert(JSON.stringify(model)===before,'Renderer mutated authored rig');
   const sheet=document.createElement('canvas');sheet.width=1600;sheet.height=1420;const g=sheet.getContext('2d');g.imageSmoothingEnabled=false;g.fillStyle='#182b28';g.fillRect(0,0,sheet.width,sheet.height);
   g.fillStyle='#eddbad';g.font='23px sans-serif';g.fillText('Wildbound / revised arms and overlap',24,32);
   const rows=[['Idle · base', 'idle',0,{}],['Run · forward swing','run',2,{}],['Run · backward swing','run',6,{}],['Aim · coat and bow','draw',8,{chest:'hunter_coat',hand1:'bow',back:'starter_quiver'}],['Keeper crown / robes','idle',0,{head:'keeper_crown',chest:'keeper_robes',pants:'keeper_sash',shoulders:'succubus_wings'}]];
   rows.forEach(([label,action,frame,gear],row)=>{
    g.fillStyle='#eddbad';g.font='16px sans-serif';g.fillText(label,24,66+row*264);
    for(let d=0;d<8;d++){
     const x=100+d*200,y=278+row*264;g.fillStyle='#213a33';g.fillRect(x-82,y-201,164,209);
     g.save();g.translate(x,y);g.scale(4.5,4.5);drawPlayer(g,actor(action,d,frame,gear),0,model);g.restore();
     g.fillStyle='#acbbab';g.font='12px sans-serif';g.fillText(['S','SW','W','NW','N','NE','E','SE'][d],x-8,y+23);
    }
   });
   const close=document.createElement('canvas');close.width=1040;close.height=550;const q=close.getContext('2d');q.imageSmoothingEnabled=false;q.fillStyle='#182b28';q.fillRect(0,0,1040,550);q.fillStyle='#eddbad';q.font='22px sans-serif';q.fillText('Profile / arms fitted to the same rig',24,34);
   for(const [i,[action,frame]]of [['idle',0],['run',0],['run',2],['run',6]].entries()){
    q.save();q.translate(130+i*260,460);q.scale(9,9);drawPlayer(q,actor(action,6,frame),0,model);q.restore();q.fillStyle='#eddbad';q.font='16px sans-serif';q.fillText(action+' / '+frame,95+i*260,520);
   }
   const equipped=document.createElement('canvas');equipped.width=1200;equipped.height=690;const ec=equipped.getContext('2d');ec.imageSmoothingEnabled=false;ec.fillStyle='#182b28';ec.fillRect(0,0,1200,690);ec.fillStyle='#eddbad';ec.font='22px sans-serif';ec.fillText('Equipped / same animated rig',24,32);
   const gear={head:'keeper_crown',chest:'keeper_robes',pants:'keeper_sash',shoulders:'succubus_wings',neck:'keeper_band',hand1:'keeper_blade'};
   for(const [i,d]of [0,1,2,4,6,7].entries())for(const [row,action]of ['idle','run'].entries()){
    const x=100+i*200,y=310+row*320;ec.save();ec.translate(x,y);ec.scale(5,5);drawPlayer(ec,actor(action,d,2,gear),0,model);ec.restore();
    ec.fillStyle='#acbbab';ec.font='14px sans-serif';ec.fillText(action+' / '+['S','SW','W','NW','N','NE','E','SE'][d],x-30,y+32);
    ec.save();ec.translate(x-66,y+8);ec.scale(1,1);drawPlayer(ec,actor(action,d,2,gear),0,model);ec.restore();
   }
   const atlas=document.createElement('canvas');atlas.width=1600;atlas.height=320;const ac=atlas.getContext('2d');ac.imageSmoothingEnabled=false;
   const views=Array.from({length:8},(_,d)=>{
    const a=actor('idle',d),pelvis=projectPoint(playerPose(a,0,model).pelvis,d);
    ac.save();ac.translate(100+d*200,260);ac.scale(5,5);drawPlayer(ac,a,0,model);ac.restore();
    return {direction:d,file:'humanoid-arms-atlas.png',rect:[d*200,0,200,320],pivot:[100+pelvis.x*5,260+pelvis.y*5],size:[40,64],offset:[0,0]};
   });
   const manifest={version:1,subject:'player',pixelDensity:5,purpose:'Assembled renderer QA only; not a replacement for articulated parts',parts:[{id:'assembled-idle-review',joint:'pelvis',views}]};
   return {report:{poses,depthChecks,maskChecks,customWholeArms:true,customOrder:true,studioCapture:true,rigUnchanged:true},sheet:sheet.toDataURL(),close:close.toDataURL(),equipped:equipped.toDataURL(),atlas:atlas.toDataURL(),manifest};
  })()`);
  for(const [key,name]of [['sheet','humanoid-arms-eight-directions'],['close','humanoid-arms-profile'],['equipped','humanoid-arms-equipped'],['atlas','humanoid-arms-atlas']])fs.writeFileSync(path.join(out,name+'.png'),Buffer.from(result[key].split(',')[1],'base64'));
  fs.writeFileSync(path.join(out,'humanoid-arms-manifest.json'),JSON.stringify(result.manifest,null,2));
  fs.writeFileSync(path.join(out,'humanoid-arms-report.json'),JSON.stringify({...result.report,packaged:base!==root,byteMatchedFiles:base!==root?5:0,rendererErrors:errors},null,2));
  if(errors.length)throw Error(errors.join('\n'));console.log(JSON.stringify(result.report));app.exit(0);
 }catch(error){console.error(error.stack);app.exit(1);}
});

