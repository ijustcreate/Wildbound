const { app, BrowserWindow } = require('electron');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');

const root = path.resolve(__dirname, '../..');
const output = path.join(root, 'test-output/creature-art-review/eldritch-silhouette-pass');
const stage = process.argv[2] || 'before';
if (!['before', 'after'].includes(stage)) throw new Error('Use before or after');
const specs = [
  { kind:'evil_hand', title:'Clinging Remains / skeletal hand', ref:'179179-clinging-remains' },
  { kind:'tree_ent', title:'Blossoming Ancient / Tree Ent', ref:'71488-blossoming-ancient' },
  { kind:'spore', title:'Brilliant Spore', ref:'86719-brilliant-spore' },
];
const views=['S','SW','W','NW','N','NE','E','SE'];
fs.mkdirSync(output,{recursive:true});
app.disableHardwareAcceleration();
app.commandLine.appendSwitch('mute-audio');
app.setPath('userData',fs.mkdtempSync(path.join(os.tmpdir(),'wildbound-eldritch-silhouette-pass-')));
app.whenReady().then(async()=>{
  const window=new BrowserWindow({show:false,width:1280,height:900,webPreferences:{offscreen:true,backgroundThrottling:false}});
  window.webContents.setAudioMuted(true);
  const errors=[];
  window.webContents.on('console-message',(_event,level,message)=>{if(level>=3)errors.push(message)});
  try{
    await window.loadFile(path.join(root,'index.html'),{query:{tools:'1'}});
    await window.webContents.executeJavaScript(`Promise.race([window.wildboundBoot.ready,new Promise((_,reject)=>setTimeout(()=>reject(Error('boot timeout')),30000))])`);
    const refs=Object.fromEntries(specs.map(spec=>[spec.kind,Object.fromEntries(['front','side','rear','opposite-side'].map(view=>[view,fs.readFileSync(path.join(root,`test-output/modelviewer-references/${spec.ref}-${view}-idle.png`)).toString('base64')]))]));
    const before=stage==='after'?Object.fromEntries(specs.map(spec=>[spec.kind,fs.readFileSync(path.join(output,`${spec.kind}-before.png`)).toString('base64')])):{};
    const payload=await window.webContents.executeJavaScript(`(async()=>{
      const {CREATURE_PACK}=await import('./src/creature-packs/eldritch.mjs');
      const specs=${JSON.stringify(specs)},views=${JSON.stringify(views)},stage=${JSON.stringify(stage)};
      const images={};
      for(const spec of specs){
        const subject=CREATURE_PACK.subjects[spec.kind],model=subject.defaults();
        const canvas=document.createElement('canvas');canvas.width=920;canvas.height=340;const c=canvas.getContext('2d');c.imageSmoothingEnabled=false;c.fillStyle='#10271f';c.fillRect(0,0,920,340);c.fillStyle='#e8d8ad';c.font='bold 18px system-ui';c.fillText(spec.title+' · '+stage.toUpperCase()+' · editable runtime pixel art',12,24);c.fillStyle='#9ed6b8';c.font='12px system-ui';c.textAlign='center';
        for(let f=0;f<8;f++){const a=f*Math.PI/4,x=112+f*96;c.fillText(views[f],x,53);c.save();c.translate(x,105);subject.draw(c,{id:'eldritch-silhouette-'+stage+'-'+spec.kind+'-'+f,kind:spec.kind,x:0,y:0,faceX:-Math.sin(a),faceY:Math.cos(a),state:'idle',animationAction:'idle',moving:false},0,model);c.restore();c.fillText(views[f],x,195);c.save();c.translate(x,255);c.scale(2.3,2.3);subject.draw(c,{id:'eldritch-silhouette-zoom-'+stage+'-'+spec.kind+'-'+f,kind:spec.kind,x:0,y:0,faceX:-Math.sin(a),faceY:Math.cos(a),state:'idle',animationAction:'idle',moving:false},0,model);c.restore();}
        images[spec.kind]=canvas.toDataURL('image/png').split(',')[1];
      }
      if(stage==='before')return {images,cards:{}};
      const old=${JSON.stringify(before)},refs=${JSON.stringify(refs)},cards={};
      for(const spec of specs){
        const card=document.createElement('canvas');card.width=1540;card.height=660;const cc=card.getContext('2d');cc.imageSmoothingEnabled=false;cc.fillStyle='#10271f';cc.fillRect(0,0,1540,660);cc.fillStyle='#e8d8ad';cc.font='bold 20px system-ui';cc.fillText(spec.title+' · REFERENCE-BACKED ART PASS · DRAFT',16,27);cc.fillStyle='#a9c3b5';cc.font='12px system-ui';cc.fillText('Matched idle pose, eight facings and native pixel density; lower row is 2.3× nearest-neighbor only.',16,46);
        const beforeImage=new Image(),afterImage=new Image();beforeImage.src='data:image/png;base64,'+old[spec.kind];afterImage.src='data:image/png;base64,'+images[spec.kind];await Promise.all([beforeImage,afterImage].map(image=>new Promise((resolve,reject)=>{image.onload=resolve;image.onerror=reject})));
        cc.fillStyle='#cbb991';cc.font='bold 12px system-ui';cc.fillText('BEFORE · NATIVE AND 2.3×',12,64);cc.drawImage(beforeImage,0,70,880,325);cc.fillText('AFTER · NATIVE AND 2.3×',12,417);cc.drawImage(afterImage,0,423,880,325);
        cc.fillStyle='#e8d8ad';cc.font='bold 12px system-ui';cc.fillText('SOURCE MODELVIEWER · STAND · FOUR VIEW TURNAROUND',916,66);
        const names=['front','side','rear','opposite-side'];for(let i=0;i<4;i++){const view=names[i],image=new Image();image.src='data:image/png;base64,'+refs[spec.kind][view];await new Promise((resolve,reject)=>{image.onload=resolve;image.onerror=reject});const x=916+(i%2)*306,y=78+Math.floor(i/2)*265,scale=Math.min(290/image.width,225/image.height),w=image.width*scale,h=image.height*scale;cc.fillStyle='#cbb991';cc.font='bold 10px system-ui';cc.fillText(view.toUpperCase(),x,y);cc.fillStyle='#081815';cc.fillRect(x,y+12,290,225);cc.drawImage(image,x+(290-w)/2,y+12+(225-h)/2,w,h);}
        cards[spec.kind]=card.toDataURL('image/png').split(',')[1];
      }
      return {images,cards};
    })()`);
    if(errors.length)throw Error(errors.join('\n'));
    for(const spec of specs){
      fs.writeFileSync(path.join(output,`${spec.kind}-${stage}.png`),Buffer.from(payload.images[spec.kind],'base64'));
      if(stage==='after')fs.writeFileSync(path.join(output,`${spec.kind}-reference-before-after.png`),Buffer.from(payload.cards[spec.kind],'base64'));
    }
    console.log(JSON.stringify({stage,output,subjects:specs.map(x=>x.kind),renderer:'muted Electron; CREATURE_PACK subject.draw',references:stage==='after'?specs.map(s=>s.ref+' Stand, four archived views'):[],audioMuted:true,rendererErrors:errors.length}));
  }catch(error){console.error(error.stack||error);process.exitCode=1}
  finally{window.destroy();app.quit()}
});
