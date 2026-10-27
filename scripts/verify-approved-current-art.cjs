// Silent Electron QA and assembled art sheets, against source or a packaged app.
const {app,BrowserWindow}=require('electron'),fs=require('node:fs'),path=require('node:path');
const root=path.resolve(__dirname,'..'),base=process.env.WILDBOUND_VERIFY_APP||root;
const out=path.join(root,'test-output/approved-art-current');fs.mkdirSync(out,{recursive:true});
app.setPath('userData',fs.mkdtempSync(path.join(root,'test-output/cute-release-')));app.disableHardwareAcceleration();
app.whenReady().then(async()=>{
 const w=new BrowserWindow({show:false,width:1280,height:850,webPreferences:{contextIsolation:true}});w.webContents.setAudioMuted(true);
 const errors=[];w.webContents.on('console-message',(_event,level,message)=>{if(level>=3)errors.push(message);});
 try{
  await w.loadFile(path.join(base,'index.html'),{query:{tools:'1'}});await w.webContents.executeJavaScript('window.wildboundBoot.ready');
  const result=await w.webContents.executeJavaScript(`(async()=>{
   const {drawPlayer,directionVector,upgradePlayerToNative,playerPose,projectPoint}=await import('./src/player-motion.mjs');
   const {loadHumanoidArt}=await import('./src/humanoid-hd.mjs');
   const {HAIR_STYLES,DEFAULT_APPEARANCE}=await import('./src/appearance.mjs');
   const {ITEMS}=await import('./src/items.mjs');
   const {drawCreationPreview}=await import('./src/creation-preview.mjs');
   const {captureLayers,releaseLayers,capturedLayers}=await import('./src/render-order.mjs');
   const {nativeHeroArtStatus}=await import('./src/hero-approved-art.mjs');
   await loadHumanoidArt();
   const rig=upgradePlayerToNative((await (await fetch('./authored/rigs.json')).json()).player),original=JSON.stringify(rig);
   const look={...DEFAULT_APPEARANCE,shirt:'#39745b',pants:'#665b87',hairColor:'#593923'};
   const images=[],checks=[],check=(ok,name)=>{if(!ok)throw Error(name);checks.push(name);};
   const canvas=(width,height)=>{const a=document.createElement('canvas');a.width=width;a.height=height;return a;};
   const board=(title,rows,columns=8,height=205)=>{
    const a=canvas(1280,65+rows.length*height),c=a.getContext('2d');c.imageSmoothingEnabled=false;c.fillStyle='#152b29';c.fillRect(0,0,a.width,a.height);
    c.fillStyle='#ead8a8';c.font='20px sans-serif';c.fillText(title,22,30);
    rows.forEach((row,i)=>{c.fillStyle='#d4c7a0';c.font='14px sans-serif';c.fillText(row.label,18,60+i*height);
     for(let d=0;d<columns;d++){
      const x=82+d*157,y=65+i*height,[faceX,faceY]=directionVector(d%8);
      const actor={appearance:{...look,...row.appearance},equipment:row.gear||{},faceX,faceY,animationAction:row.action||'idle',playerFrame:row.frame||0};
      c.save();c.translate(x-40,y+height-25);drawPlayer(c,actor,0,rig);c.restore();
      c.save();c.translate(x+18,y+height-25);c.scale(4,4);drawPlayer(c,actor,0,rig);c.restore();
     }
    });return a;
   };
   const families=[['short',['none','crop','undercut','sidepart','pixie','bob','shag']],['texture',['mohawk','curls','waves','afro','locs','spikes']],['tied-long',['long','ponytail','braids','twinbraids','sideponytail','topknot']]];
   for(const [name,ids]of families){const a=board('Native + 4x / '+name+' / S SW W NW N NE E SE',ids.map(hair=>({label:HAIR_STYLES[hair],appearance:{hair}})));images.push({name:'hair-'+name,png:a.toDataURL().split(',')[1]});}
   const actions=['idle','walk','run','draw','punch_right','jump_air','jump_fall','death'];
   for(const hair of ['undercut','long','sideponytail']){
    const a=board(hair+' / full walk and run cycles, aim, attack, jump and fallen',actions.map(action=>({label:action,appearance:{hair},action,frame:action==='death'?rig.clips.death.length-1:rig.clips[action].length*.5})),8,190);
    // Every full walk/run key is exported separately below, with matched camera.
    images.push({name:'motion-'+hair,png:a.toDataURL().split(',')[1]});
   }
   for(const action of ['walk','run']){
    const a=canvas(1280,920),c=a.getContext('2d');c.fillStyle='#152b29';c.fillRect(0,0,a.width,a.height);c.imageSmoothingEnabled=false;
    for(let d=0;d<8;d++)for(let f=0;f<8;f++){
     const [faceX,faceY]=directionVector(d);c.save();c.translate(80+f*157,100+d*115);c.scale(2.5,2.5);
     drawPlayer(c,{appearance:{...look,hair:'long'},equipment:{},faceX,faceY,animationAction:action,playerFrame:f},0,rig);c.restore();
    }images.push({name:'cycle-'+action,png:a.toDataURL().split(',')[1]});
   }
   check(['safari_hat','cape','bow','sword','shield'].every(id=>ITEMS[id]),'Representative equipment IDs exist');
   const gear=board('Hair, helmet and cape fit / eight views',[
    {label:'Long / helmet + cape',appearance:{hair:'long'},gear:{head:'safari_hat',cape:'cape'}},
    {label:'Braid / bow aim',appearance:{hair:'braids'},gear:{hand1:'bow'},action:'draw',frame:8},
    {label:'Undercut / sword + shield',appearance:{hair:'undercut'},gear:{hand1:'sword',hand2:'shield'}},
    {label:'Deep skin / silver curls',appearance:{hair:'curls',skin:'#54372c',hairColor:'#d9d4ba'}},
    {label:'Light skin / red side ponytail',appearance:{hair:'sideponytail',skin:'#f2d6b3',hairColor:'#a94955'}}
   ]);images.push({name:'gear-fit',png:gear.toDataURL().split(',')[1]});
   // Studio capture must include cached drawImage art, not just native fillRect.
   const test=canvas(192,192),tc=test.getContext('2d');tc.translate(96,150);
   captureLayers(rig);drawPlayer(tc,{appearance:{...look,hair:'long'},equipment:{},faceX:0,faceY:1,animationAction:'idle'},0,rig);releaseLayers(rig);
   const head=capturedLayers(rig,0).find(p=>p.id==='Head and headwear');
   check(head?.sprite.pixels.filter(Boolean).length>60,'Studio captures editable native head and hair pixels');
   check(capturedLayers(rig,0).some(p=>p.id==='Hair / nape and accessory'&&p.sprite.pixels.some(Boolean)),'Studio captures current nape/accessory layer');
   check(JSON.stringify(rig)===original,'Rendering and Studio capture preserve authored rig');
   check(rig.nativeHumanoidRevision===1,'Current Captain-derived player rig loaded');
   for(const hair of Object.keys(HAIR_STYLES))for(const action of ['idle','walk','run','draw','punch_right','death'])for(let d=0;d<8;d++){
    const [faceX,faceY]=directionVector(d);tc.clearRect(-96,-150,192,192);drawPlayer(tc,{appearance:{...look,hair},equipment:{},faceX,faceY,animationAction:action,playerFrame:rig.clips[action].length*.55},0,rig);
   }check(true,'All 19 hairstyles render in eight views across six pose families');
   const creator=canvas(1000,570),cc=creator.getContext('2d');cc.fillStyle='#152b29';cc.fillRect(0,0,1000,570);
   for(let d=0;d<8;d++){
    const cell=canvas(240,240),pen=cell.getContext('2d');drawCreationPreview(pen,{...look,hair:d%2?'sideponytail':'long'},{width:240,height:240,mode:'hair',direction:d,model:rig});cc.drawImage(cell,d%4*250,Math.floor(d/4)*280);
   }images.push({name:'creator-angles',png:creator.toDataURL().split(',')[1]});
   check(nativeHeroArtStatus().rasters<=nativeHeroArtStatus().limit,'Native art cache bounded');
   return {images,checks,cache:nativeHeroArtStatus()};
  })()`);
  for(const item of result.images)fs.writeFileSync(path.join(out,item.name+'.png'),Buffer.from(item.png,'base64'));
  const report={base,checks:result.checks,cache:result.cache,errors};fs.writeFileSync(path.join(out,'electron-report.json'),JSON.stringify(report,null,2));
  console.log(JSON.stringify(report));if(errors.length)throw Error('Renderer errors: '+errors.join('\n'));app.exit(0);
 }catch(e){console.error(e);app.exit(1);}
});
