const {app,BrowserWindow}=require('electron'),fs=require('node:fs'),path=require('node:path');
const root=path.resolve(__dirname,'..'),base=process.env.WILDBOUND_VERIFY_APP||root,out=path.join(root,'test-output');
fs.mkdirSync(out,{recursive:true});app.disableHardwareAcceleration();app.setPath('userData',fs.mkdtempSync(path.join(out,'ghost-profile-')));
app.whenReady().then(async()=>{
 const win=new BrowserWindow({show:false,width:1280,height:850,webPreferences:{offscreen:true}}),errors=[];win.webContents.setAudioMuted(true);
 win.webContents.on('console-message',e=>{if(e.level==='error')errors.push(e.message);});
 try{
  const files=['src/ghost-art.mjs','src/ghost-motion.mjs','src/ghost-ai.mjs','src/ghost-fear.mjs','src/core.mjs','src/definitions.mjs','src/items.mjs','src/item-art.mjs','src/player-motion.mjs','src/wearable-art.mjs','src/cape-motion.mjs','src/navigation.mjs','src/rig-subjects.mjs','src/project-rigs.mjs','src/graveyard-world.mjs','src/graveyard-events.mjs','src/graveyard-ecology.mjs','src/wild-fauna.mjs','src/living-ecosystem.mjs','src/mausoleum-crypt.mjs','src/enemy-damage.mjs','authored/rigs.json'];
  if(base!==root)for(const file of files)if(!fs.readFileSync(path.join(root,file)).equals(fs.readFileSync(path.join(base,file))))throw Error('Package mismatch: '+file);
  await win.loadFile(path.join(base,'index.html'));await win.webContents.executeJavaScript('window.wildboundBoot.ready');
  const result=await win.webContents.executeJavaScript(`(async()=>{
   const {drawGhost,ghostMotion}=await import('./src/ghost-motion.mjs'),{drawPlayer,playerMotion,directionVector}=await import('./src/player-motion.mjs');
   const {GHOST_EQUIPMENT,GHOST_DROPS}=await import('./src/items.mjs'),{DEFAULT_APPEARANCE}=await import('./src/appearance.mjs');
   const {captureLayers,releaseLayers,capturedLayers}=await import('./src/render-order.mjs');
   const {detailedItemCanvas}=await import('./src/item-art.mjs');
   const {Game}=await import('./src/core.mjs'),{HeroUI}=await import('./src/hero-ui.mjs'),{Animator}=await import('./src/animation.mjs');
   const assert=(a,m)=>{if(!a)throw Error(m);},before=JSON.stringify([playerMotion,ghostMotion]);
   const sheet=document.createElement('canvas');sheet.width=1600;sheet.height=920;const c=sheet.getContext('2d');c.imageSmoothingEnabled=false;c.fillStyle='#142923';c.fillRect(0,0,1600,920);
   const rows=[['Ghost / idle',drawGhost,ghostMotion,{animationAction:'idle',playerFrame:0}],['Ghost / claw attack',drawGhost,ghostMotion,{animationAction:'claw',playerFrame:5}],['Player wearing the spectral outfit',drawPlayer,playerMotion,{animationAction:'walk',playerFrame:3,equipment:GHOST_EQUIPMENT,appearance:{...DEFAULT_APPEARANCE,skin:'#467c70',hair:'none'}}]];
   let frames=0;
   for(const [row,[label,draw,m,a]]of rows.entries()){
    c.fillStyle='#e4ecd0';c.font='20px sans-serif';c.fillText(label,18,row*280+26);
    for(let d=0;d<8;d++){
     const [faceX,faceY]=directionVector(d);c.save();c.translate(100+d*200,row*280+210);c.scale(4,4);draw(c,{...a,hp:100,faceX,faceY,moving:row>0,id:1},.4,m);c.restore();
     c.save();c.translate(100+d*200,row*280+269);draw(c,{...a,hp:100,faceX,faceY,moving:row>0,id:1},.4,m);c.restore();
    }
   }
   for(const [i,id]of GHOST_DROPS.entries()){const icon=detailedItemCanvas(id);c.drawImage(icon,20+i*110,850,72,72);}
   const scratch=document.createElement('canvas');scratch.width=scratch.height=256;const pen=scratch.getContext('2d');
   for(const action of ['idle','walk','claw','hurt','death'])for(let d=0;d<8;d++)for(let f=0;f<ghostMotion.clips[action].length;f++){
    const [faceX,faceY]=directionVector(d);pen.clearRect(0,0,256,256);pen.save();pen.translate(128,190);pen.scale(3,3);drawGhost(pen,{hp:action==='death'?0:100,faceX,faceY,animationAction:action,playerFrame:f,moving:action==='walk'},f/12);pen.restore();frames++;
   }
   for(let d=0;d<8;d++){
    const [faceX,faceY]=directionVector(d);captureLayers(ghostMotion);drawGhost(pen,{hp:100,faceX,faceY,animationAction:'idle',playerFrame:0},0);releaseLayers(ghostMotion);
    const layers=capturedLayers(ghostMotion,d),mist=layers.find(p=>p.id==='Spectral mist');assert(mist?.sprite?.pixels.some(Boolean),'Mist is not editable in Studio');
    assert(!layers.filter(p=>p.id==='Leg L'||p.id==='Leg R').some(p=>p.sprite?.pixels.some(Boolean)),'Solid legs leaked through spectral wraps');
   }
   assert(JSON.stringify([playerMotion,ghostMotion])===before,'Rendering mutated rigs');
   const g=new Game(()=>.4),p=g.addPlayer('keyboard');g.environment='graveyard';g.start();g.openingBoard=false;g.spawnEvent(76);const animator=new Animator();
   assert(g.enemies.filter(e=>e.kind==='ghost').length===3,'Actual cemetery ghost event failed');
   for(const e of g.enemies){pen.clearRect(0,0,256,256);animator.draw(pen,{...e,x:128,y:190},.4,47);assert(pen.getImageData(0,0,256,256).data.some(Boolean),'Runtime ghost renderer produced no pixels');}
   p.equipment={...GHOST_EQUIPMENT};p.appearance={...DEFAULT_APPEARANCE,skin:'#467c70',hair:'none'};p.ui={panel:'gear',index:0};
   const panel=document.createElement('div');panel.style.cssText='position:fixed;inset:0;z-index:99999;background:#172e27';document.body.append(panel);const ui=new HeroUI(panel);ui.draw(g,{animator:new Animator()});ui.draw(g,{animator:new Animator()});assert(panel.querySelector('.paper-doll'),'Spectral inventory preview absent');
   return {sheet:sheet.toDataURL(),frames,views:8,runtimeEvent:true,sharedHumanoidRig:true,solidLegsHidden:true,studioCapture:true,rigsUnchanged:true};
  })()`);
  fs.writeFileSync(path.join(out,'ghost-eight-directions.png'),Buffer.from(result.sheet.split(',')[1],'base64'));
  await new Promise(resolve=>setTimeout(resolve,500));
  fs.writeFileSync(path.join(out,'ghost-inventory.png'),(await win.webContents.capturePage()).toPNG());
  const report={...result,sheet:undefined,packaged:base!==root,byteMatchedFiles:base!==root?files.length:0,rendererErrors:errors};fs.writeFileSync(path.join(out,'ghost-report.json'),JSON.stringify(report,null,2));if(errors.length)throw Error(errors.join('\n'));console.log(JSON.stringify(report));app.exit(0);
 }catch(e){console.error(e.stack);app.exit(1);}
});
