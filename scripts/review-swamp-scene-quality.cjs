const {app,BrowserWindow}=require('electron');
const fs=require('node:fs'),path=require('node:path');
const {PNG}=require('pngjs'),{crc32}=require('pngjs/lib/crc');
const root=path.resolve(__dirname,'..'),out=path.join(root,'test-output/swamp-scene-review');
fs.mkdirSync(out,{recursive:true});app.setPath('userData',fs.mkdtempSync(path.join(out,'profile-')));app.disableHardwareAcceleration();
function chunk(type,data){const tag=Buffer.from(type),length=Buffer.alloc(4),crc=Buffer.alloc(4);length.writeUInt32BE(data.length);crc.writeInt32BE(crc32(Buffer.concat([tag,data])));return Buffer.concat([length,tag,data,crc]);}
function animatedPng(frames){
  const head=frames[0].subarray(0,8),pieces=[head];let sequence=0;
  for(const [index,png]of frames.entries()){
    let offset=8,idats=[];
    while(offset<png.length){const length=png.readUInt32BE(offset),type=png.toString('ascii',offset+4,offset+8),data=png.subarray(offset+8,offset+8+length);offset+=length+12;
      if(type==='IHDR'&&index===0){pieces.push(chunk(type,data));const ctl=Buffer.alloc(8);ctl.writeUInt32BE(frames.length,0);pieces.push(chunk('acTL',ctl));}
      if(type==='IDAT')idats.push(data);
    }
    const image=PNG.sync.read(png),ctl=Buffer.alloc(26);ctl.writeUInt32BE(sequence++);ctl.writeUInt32BE(image.width,4);ctl.writeUInt32BE(image.height,8);ctl.writeUInt16BE(1,20);ctl.writeUInt16BE(5,22);
    pieces.push(chunk('fcTL',ctl));
    for(const data of idats){if(index===0)pieces.push(chunk('IDAT',data));else{const seq=Buffer.alloc(4);seq.writeUInt32BE(sequence++);pieces.push(chunk('fdAT',Buffer.concat([seq,data])));}}
  }
  pieces.push(chunk('IEND',Buffer.alloc(0)));return Buffer.concat(pieces);
}
app.whenReady().then(async()=>{
  const win=new BrowserWindow({show:false,webPreferences:{backgroundThrottling:false}});win.webContents.setAudioMuted(true);
  try{
    await win.loadFile(path.join(root,'index.html'));await win.webContents.executeJavaScript('window.wildboundBoot.ready');
    const result=await win.webContents.executeJavaScript(`(async()=>{
      const {createSwampSceneStudy,SWAMP_SCENE_CONTRACT}=await import('./src/swamp-scene-study.mjs');
      const {drawPlayer,playerMotion}=await import('./src/player-motion.mjs');
      const {drawRealmLife}=await import('./src/realm-life.mjs');
      const study=createSwampSceneStudy(),canvas=document.createElement('canvas');canvas.width=640;canvas.height=400;const c=canvas.getContext('2d');
      const actor=(pen,x,y,t)=>{pen.save();pen.translate(x,y);pen.scale(.75,.75);drawPlayer(pen,{hp:100,faceX:0,faceY:1,equipment:{}},t,playerMotion);pen.restore();};
      const wildlife={generatedEnvironment:'swamp',phase:'play',time:1,bloom:3,sky:{elapsed:100},realmState:{env:'swamp',animals:[{kind:'marsh_firefly',id:'pixel-check',x:30,y:30,phase:0}]}};
      const check=document.createElement('canvas');check.width=check.height=64;const cc=check.getContext('2d');
      drawRealmLife(cc,wildlife,'air');if(cc.getImageData(0,0,64,64).data.some(Boolean))throw Error('Daytime firefly rendered');
      wildlife.sky.elapsed=320;drawRealmLife(cc,wildlife,'air');if(!cc.getImageData(0,0,64,64).data.some(Boolean))throw Error('Nighttime firefly missing');
      const render=(t,light=true)=>study.draw(c,{time:t,dynamicLighting:light,drawPlayer:actor});
      render(0);const a=c.getImageData(0,0,640,400).data;
      const images={},big=document.createElement('canvas');big.width=1280;big.height=800;const b=big.getContext('2d');b.imageSmoothingEnabled=false;
      const times=[];
      // Measure only warmed drawing. No image export or readback in this loop.
      let reads=0;const proto=CanvasRenderingContext2D.prototype,old=proto.getImageData;
      proto.getImageData=function(...args){reads++;return old.apply(this,args);};
      for(let i=0;i<120;i++){const t=performance.now();render(i/30);times.push(performance.now()-t);}
      proto.getImageData=old;
      const last=c.getImageData(0,0,640,400).data;let changed=0;for(let i=0;i<a.length;i+=4)if(a[i]!==last[i]||a[i+1]!==last[i+1]||a[i+2]!==last[i+2])changed++;
      if(!changed)throw Error('Scene animation frozen');if(reads)throw Error('Lighting introduced runtime canvas readbacks');
      for(let i=0;i<16;i++){render(i*.2);images['phase-'+i]=canvas.toDataURL();}
      render(1);images.native=canvas.toDataURL();b.drawImage(canvas,0,0,1280,800);images['swamp-scene-draft']=big.toDataURL();
      render(1,false);b.drawImage(canvas,0,0,1280,800);images['without-local-light']=big.toDataURL();
      study.draw(c,{time:1,drawPlayer:actor,night:true});b.drawImage(canvas,0,0,1280,800);images['night-swamp-scene']=big.toDataURL();
      const pair=document.createElement('canvas');pair.width=1280;pair.height=428;const pen=pair.getContext('2d');pen.fillStyle='#142d2a';pen.fillRect(0,0,1280,428);pen.imageSmoothingEnabled=false;
      render(1);pen.drawImage(canvas,0,28);study.draw(c,{time:1,drawPlayer:actor,night:true});pen.drawImage(canvas,640,28);
      pen.fillStyle='#e1d9a7';pen.font='14px monospace';pen.fillText('DAY — new wetland plants; no fireflies',14,19);pen.fillText('NIGHT — tiny emissive fireflies along the banks',654,19);images['day-night-swamp']=pair.toDataURL();
      const cacheBefore={...study.stats},unlitTimes=[];for(let i=0;i<120;i++){const t=performance.now();render(i/30,false);unlitTimes.push(performance.now()-t);}
      if(study.stats.groundBuilds!==cacheBefore.groundBuilds||study.stats.treeBuilds!==cacheBefore.treeBuilds||study.stats.waterBuilds!==cacheBefore.waterBuilds)throw Error('Static layers rebuilt during animation');
      times.splice(0,20);times.sort((a,b)=>a-b);unlitTimes.splice(0,20);unlitTimes.sort((a,b)=>a-b);
      return {images,report:{contract:SWAMP_SCENE_CONTRACT,stats:study.stats,fireflyDayNightPixels:'passed',animatedChangedPixels:changed,runtimeReadbacks:reads,
        warmMedianMs:times[50],warmP95Ms:times[95],unlitMedianMs:unlitTimes[50],unlitP95Ms:unlitTimes[95],lightingCacheBytes:study.lighting.bytes,scope:'Opt-in review scene only. No production imports, map changes, save edits or package changes. Software Electron scene draw timings, not game FPS.'}};
    })()`);
    for(const [name,url]of Object.entries(result.images))fs.writeFileSync(path.join(out,name+'.png'),Buffer.from(url.split(',')[1],'base64'));
    fs.writeFileSync(path.join(out,'swamp-scene-motion.png'),animatedPng(Array.from({length:16},(_,i)=>Buffer.from(result.images['phase-'+i].split(',')[1],'base64'))));
    fs.writeFileSync(path.join(out,'report.json'),JSON.stringify(result.report,null,2));console.log(JSON.stringify(result.report));win.destroy();app.exit(0);
  }catch(e){console.error(e);win.destroy();app.exit(1);}
});
