const { app, BrowserWindow } = require('electron');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { pathToFileURL } = require('node:url');

const root = path.resolve(__dirname, '../..');
const out = path.join(root, 'test-output/creature-art-review');
const beforePath = path.join(root, 'src/creature-packs/.eldritch-tentacle-before.mjs');
const pairs = [
  { kind: 'arcane_eye', label: 'Corrupted Eye · floating eyeball', ref: '68819-arcane-eye', crop: [300, 0, 260, 220] },
  { kind: 'eye_tentacle', label: 'Corrupted Eye Tentacle · rooted subordinate', ref: '161992-corrupted-tentacle', crop: [280, 0, 280, 500] },
];
const sourceViews = ['front', 'side', 'rear', 'opposite-side'];
const referenceData = Object.fromEntries(pairs.map(pair => [pair.kind, sourceViews.map(view =>
  fs.readFileSync(path.join(root, `test-output/modelviewer-references/${pair.ref}-${view}-idle.png`)).toString('base64'))]));

if (!fs.existsSync(beforePath)) throw new Error("Missing matched before snapshot: " + beforePath);

app.disableHardwareAcceleration();
app.commandLine.appendSwitch('mute-audio');
app.setPath('userData', fs.mkdtempSync(path.join(os.tmpdir(), 'wildbound-eldritch-eye-review-')));
app.whenReady().then(async () => {
  const win = new BrowserWindow({ show: false, width: 1280, height: 800, webPreferences: { offscreen: true, backgroundThrottling: false } });
  win.webContents.setAudioMuted(true);
  const errors = [];
  win.webContents.on('console-message', (_event, level, message) => { console.log(`[renderer:${level}] ${message}`); if (level >= 3) errors.push(message); });
  try {
    await win.loadFile(path.join(root, 'index.html'), { query: { tools: '1' } });
    await win.webContents.executeJavaScript(`Promise.race([window.wildboundBoot.ready,new Promise((_,reject)=>setTimeout(()=>reject(Error('boot timeout')),30000))])`);
    const encoded = await win.webContents.executeJavaScript(`(async()=>{
      const {CREATURE_PACK:BEFORE_PACK}=await import(${JSON.stringify(pathToFileURL(beforePath).href)});
      const {CREATURE_PACK}=await import('./src/creature-packs/eldritch.mjs');
      const pairs=${JSON.stringify(pairs)}, refs=${JSON.stringify(referenceData)};
      const dirs=['S','SW','W','NW','N','NE','E','SE'];
      const draw=(ctx,subject,model,kind,facing,scale)=>{const a=facing*Math.PI/4;ctx.save();ctx.scale(scale,scale);subject.draw(ctx,{id:'eye-review-'+kind+'-'+facing,kind,x:0,y:0,faceX:-Math.sin(a),faceY:Math.cos(a),state:'idle',animationAction:'idle',moving:false},0,model);ctx.restore()};
      const cards=[];
      for(const pair of pairs){
        const old=BEFORE_PACK.subjects[pair.kind], next=CREATURE_PACK.subjects[pair.kind], oldModel=old.defaults(), nextModel=next.defaults();
        const canvas=document.createElement('canvas');canvas.width=1340;canvas.height=820;const c=canvas.getContext('2d');c.imageSmoothingEnabled=false;c.fillStyle='#10271f';c.fillRect(0,0,canvas.width,canvas.height);
        c.fillStyle='#e8d8ad';c.font='bold 19px system-ui';c.fillText(pair.label+' · draft',18,27);c.fillStyle='#a9c3b5';c.font='11px system-ui';c.fillText('Same runtime renderer, pose, facing and native density; linked model-viewer idle turns at right.',18,46);
        const rows=[{title:'BEFORE · NATIVE',y:155,ty:82,dy:105,scale:1,subject:old,model:oldModel},{title:'AFTER · NATIVE',y:275,ty:197,dy:220,scale:1,subject:next,model:nextModel},{title:'BEFORE · 2×',y:465,ty:326,dy:350,scale:2,subject:old,model:oldModel},{title:'AFTER · 2×',y:705,ty:566,dy:590,scale:2,subject:next,model:nextModel}];
        for(const row of rows){c.fillStyle='#cbb991';c.font='bold 10px system-ui';c.fillText(row.title,12,row.ty);for(let f=0;f<8;f++){const x=48+f*91;c.fillStyle='#98d4b7';c.font='9px system-ui';c.textAlign='center';c.fillText(dirs[f],x,row.dy);c.save();c.translate(x,row.y);draw(c,row.subject,row.model,pair.kind,f,row.scale);c.restore()}c.textAlign='left'}
        c.fillStyle='#e8d8ad';c.font='bold 11px system-ui';c.fillText('SOURCE MODELVIEWER · IDLE',790,67);
        for(let i=0;i<4;i++){const x=790+(i%2)*265,y=82+Math.floor(i/2)*218;c.fillStyle='#cbb991';c.font='10px system-ui';c.fillText(pair.ref.toUpperCase()+' · '+['FRONT','SIDE','REAR','OPPOSITE-SIDE'][i],x,y+10);const image=new Image();image.src='data:image/png;base64,'+refs[pair.kind][i];await new Promise((resolve,reject)=>{image.onload=resolve;image.onerror=reject});const[sx,sy,sw,sh]=pair.crop,fit=Math.min(230/sw,185/sh),w=sw*fit,h=sh*fit;c.drawImage(image,sx,sy,sw,sh,x+(230-w)/2,y+17+(185-h)/2,w,h)}
        cards.push({kind:pair.kind,png:canvas.toDataURL('image/png').split(',')[1]});
      }
      const subjects=pairs.map(pair=>[pair.kind,CREATURE_PACK.subjects[pair.kind]]),cw=112,ch=120,left=260,top=92,sheet=document.createElement('canvas');sheet.width=left+cw*8;sheet.height=top+subjects.length*ch;const s=sheet.getContext('2d');s.imageSmoothingEnabled=false;s.fillStyle='#10271f';s.fillRect(0,0,sheet.width,sheet.height);s.fillStyle='#e8d8ad';s.font='bold 22px system-ui';s.fillText('Arcane Eye + rooted subordinate · eight views · native scale',12,30);const labels=['S','SW','W','NW','N','NE','E','SE'];s.font='12px system-ui';s.fillStyle='#9ed6b8';s.textAlign='center';labels.forEach((label,f)=>s.fillText(label,left+f*cw+cw/2,65));
      for(let row=0;row<subjects.length;row++){const[k,subject]=subjects[row],y=top+row*ch,model=subject.defaults();s.fillStyle=row%2?'#17372e':'#153329';s.fillRect(0,y,sheet.width,ch);s.fillStyle='#f2e4c4';s.font='12px system-ui';s.textAlign='left';s.fillText(subject.name,12,y+18);for(let f=0;f<8;f++){const a=f*Math.PI/4;s.save();s.translate(left+f*cw+cw/2,y+75);subject.draw(s,{id:'eldritch-final-'+k+'-'+f,kind:k,x:0,y:0,faceX:-Math.sin(a),faceY:Math.cos(a),state:'idle',animationAction:'idle',moving:false},0,model);s.restore()}}
      return {cards,sheet:sheet.toDataURL('image/png').split(',')[1]};
    })()`);
    if (errors.length) throw new Error(errors.join('\n'));
    for (const card of encoded.cards) fs.writeFileSync(path.join(out, `${card.kind}-before-after-source.png`), Buffer.from(card.png, 'base64'));
    const sheet=Buffer.from(encoded.sheet,'base64');
    const focusedSheet=path.join(out,'arcane-eye-tentacle-eight-view.png');
    fs.writeFileSync(focusedSheet,sheet);
    console.log(JSON.stringify({cards:encoded.cards.map(x=>path.join(out,`${x.kind}-before-after-source.png`)),sheet:focusedSheet,renderer:'Wildbound runtime subject.draw',audioMuted:true,errors:errors.length}));
  } catch (error) { console.error(error.stack || error); process.exitCode=1; }
  finally { win.destroy(); app.quit(); }
});
