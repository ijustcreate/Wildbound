const { app, BrowserWindow } = require('electron');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');

const root = path.resolve(__dirname, '../..');
const output = path.join(root, 'test-output/creature-art-review');
const stage = process.argv[2] || 'before';
if (!['before', 'after'].includes(stage)) throw new Error('Use before or after');
const specs = [
  { kind: 'butterfly_dragon', title: 'Blinky / butterfly dragon', reference: '179589-blinky', crop: [210, 18, 410, 485] },
  { kind: 'evil_hand', title: 'Clinging Remains / crawling hand', reference: '179179-clinging-remains', crop: [275, 45, 310, 440] },
];
const directions = ['S', 'SW', 'W', 'NW', 'N', 'NE', 'E', 'SE'];
const refs = Object.fromEntries(specs.map(spec => [spec.kind,
  ['front', 'side', 'rear', 'opposite-side'].map(view => fs.readFileSync(
    path.join(root, `test-output/modelviewer-references/${spec.reference}-${view}-idle.png`),
  ).toString('base64')),
]));
const before = stage === 'after' ? Object.fromEntries(specs.map(spec => [spec.kind,
  fs.readFileSync(path.join(output, `eldritch-batch2-before-${spec.kind}.png`)).toString('base64'),
])) : {};

app.disableHardwareAcceleration();
app.commandLine.appendSwitch('mute-audio');
app.setPath('userData', fs.mkdtempSync(path.join(os.tmpdir(), 'wildbound-eldritch-batch2-')));
app.whenReady().then(async () => {
  const window = new BrowserWindow({ show: false, width: 1600, height: 1000, webPreferences: { offscreen: true, backgroundThrottling: false } });
  window.webContents.setAudioMuted(true);
  const errors = [];
  window.webContents.on('console-message', (_event, level, message) => { if (level >= 3) errors.push(message); });
  try {
    await window.loadFile(path.join(root, 'index.html'), { query: { tools: '1' } });
    await window.webContents.executeJavaScript(`Promise.race([window.wildboundBoot.ready,new Promise((_,reject)=>setTimeout(()=>reject(Error('boot timeout')),30000))])`);
    const result = await window.webContents.executeJavaScript(`(async()=>{
      const { CREATURE_PACK } = await import('./src/creature-packs/eldritch.mjs');
      const specs=${JSON.stringify(specs)},dirs=${JSON.stringify(directions)},refs=${JSON.stringify(refs)},before=${JSON.stringify(before)},stage=${JSON.stringify(stage)};
      const draw=(ctx,subject,model,kind,facing,scale)=>{const angle=facing*Math.PI/4;ctx.save();ctx.scale(scale,scale);subject.draw(ctx,{id:'batch2-'+stage+'-'+kind+'-'+facing,kind,sprite:kind,x:0,y:0,faceX:-Math.sin(angle),faceY:Math.cos(angle),state:'idle',animationAction:'idle',moving:false},0,model);ctx.restore()};
      const renders={};
      for(const spec of specs){
        const subject=CREATURE_PACK.subjects[spec.kind],model=subject.defaults();
        const canvas=document.createElement('canvas');canvas.width=920;canvas.height=340;const c=canvas.getContext('2d');c.imageSmoothingEnabled=false;c.fillStyle='#10271f';c.fillRect(0,0,canvas.width,canvas.height);c.fillStyle='#e8d8ad';c.font='bold 18px system-ui';c.fillText(spec.title+' · '+stage.toUpperCase()+' · 8 directions',12,24);c.fillStyle='#9ed6b8';c.font='12px system-ui';
        for(let f=0;f<8;f++){const x=112+f*96;c.textAlign='center';c.fillText(dirs[f],x,55);c.save();c.translate(x,105);draw(c,subject,model,spec.kind,f,1);c.restore();c.fillText(dirs[f],x,195);c.save();c.translate(x,255);draw(c,subject,model,spec.kind,f,2.3);c.restore();}
        renders[spec.kind]=canvas.toDataURL('image/png').split(',')[1];
      }
      if(stage==='before')return{renders};
      const cards={};
      for(const spec of specs){
        const canvas=document.createElement('canvas');canvas.width=1550;canvas.height=780;const c=canvas.getContext('2d');c.imageSmoothingEnabled=false;c.fillStyle='#10271f';c.fillRect(0,0,canvas.width,canvas.height);c.fillStyle='#e8d8ad';c.font='bold 20px system-ui';c.fillText(spec.title+' · native Wildbound pixel draft',16,28);c.fillStyle='#a9c3b5';c.font='12px system-ui';c.fillText('Matched eight facings · idle · native scale and 2.3× nearest-neighbor · draft, not approved',16,48);
        const old=new Image(),fresh=new Image();old.src='data:image/png;base64,'+before[spec.kind];fresh.src='data:image/png;base64,'+renders[spec.kind];await Promise.all([old,fresh].map(image=>new Promise((resolve,reject)=>{image.onload=resolve;image.onerror=reject})));
        c.fillStyle='#cbb991';c.font='bold 12px system-ui';c.textAlign='left';
        for(const [label,img,y,sy,sh] of [['BEFORE · NATIVE',old,82,35,85],['AFTER · NATIVE',fresh,212,35,85],['BEFORE · 2.3×',old,354,125,145],['AFTER · 2.3×',fresh,565,130,190]]){
          c.fillText(label,14,y-8);
          c.drawImage(img,0,sy,920,sh,0,y,920,sh);
        }
        c.fillStyle='#e8d8ad';c.font='bold 12px system-ui';c.textAlign='left';c.fillText('SOURCE MODELVIEWER · IDLE',965,72);
        for(let i=0;i<4;i++){const col=i%2,row=Math.floor(i/2),x=965+col*280,y=90+row*220;c.fillStyle='#cbb991';c.font='10px system-ui';c.fillText(spec.reference.toUpperCase()+' · '+['FRONT','SIDE','REAR','OPPOSITE-SIDE'][i],x,y+10);const image=new Image();image.src='data:image/png;base64,'+refs[spec.kind][i];await new Promise((resolve,reject)=>{image.onload=resolve;image.onerror=reject});const[sx,sy,sw,sh]=spec.crop,fit=Math.min(245/sw,180/sh),w=sw*fit,h=sh*fit;c.drawImage(image,sx,sy,sw,sh,x+(245-w)/2,y+17+(180-h)/2,w,h);}
        cards[spec.kind]=canvas.toDataURL('image/png').split(',')[1];
      }
      return{renders,cards};
    })()`);
    if(errors.length) throw new Error(errors.join('\n'));
    fs.mkdirSync(output,{recursive:true});
    for(const spec of specs){
      fs.writeFileSync(path.join(output,`eldritch-batch2-${stage}-${spec.kind}.png`),Buffer.from(result.renders[spec.kind],'base64'));
      if(stage==='after')fs.writeFileSync(path.join(output,`eldritch-batch2-${spec.kind}-reference-before-after.png`),Buffer.from(result.cards[spec.kind],'base64'));
    }
    console.log(JSON.stringify({stage,subjects:specs.map(x=>x.kind),output,audioMuted:true,rendererErrors:errors.length}));
  }catch(error){console.error(error.stack||error);process.exitCode=1;}
  finally{window.destroy();app.quit();}
});
