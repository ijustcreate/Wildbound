const { app, BrowserWindow } = require('electron');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const root = path.resolve(__dirname, '../..');
const out = path.join(root, 'test-output/creature-art-review');
fs.mkdirSync(out, { recursive: true });
const files = {
  oldSnail: 'softshell-before-after-reference.png',
  oldFox: 'fox-crab-before-zoom.png',
  oldCrab: 'crab-before-zoom.png',
  snailFront: '../modelviewer-references/softshell-front-stand.png',
  snailSide: '../modelviewer-references/softshell-side-stand.png',
  snailRear: '../modelviewer-references/softshell-rear-stand.png',
  foxFront: '../modelviewer-references/171702-copperfur-kit-front-idle.png',
  foxSide: '../modelviewer-references/171702-copperfur-kit-side-idle.png',
  foxRear: '../modelviewer-references/171702-copperfur-kit-rear-idle.png',
  crabFront: '../modelviewer-references/143204-freshwater-pincher-front-idle.png',
  crabSide: '../modelviewer-references/143204-freshwater-pincher-side-idle.png',
  crabRear: '../modelviewer-references/143204-freshwater-pincher-rear-idle.png',
};
const assets = Object.fromEntries(Object.entries(files).map(([k, f]) => [k,
  fs.readFileSync(path.join(out, f.startsWith('../') ? f : f)).toString('base64')]));
app.disableHardwareAcceleration(); app.commandLine.appendSwitch('mute-audio');
app.setPath('userData', fs.mkdtempSync(path.join(os.tmpdir(), 'wildlife-review-')));
app.whenReady().then(async () => {
  const window = new BrowserWindow({ show: false, width: 1440, height: 1000,
    webPreferences: { offscreen: true, backgroundThrottling: false } });
  window.webContents.setAudioMuted(true);
  const errors = [];
  window.webContents.on('console-message', (_e, level, message) => { if (level >= 3) errors.push(message); });
  try {
    await window.loadFile(path.join(root, 'index.html'), { query: { tools: '1' } });
    await window.webContents.executeJavaScript(`Promise.race([window.wildboundBoot.ready,new Promise((_,r)=>setTimeout(()=>r(Error('boot timeout')),30000))])`);
    const png = await window.webContents.executeJavaScript(`(async()=>{
      const {CREATURE_PACK}=await import('./src/creature-packs/wildlife.mjs');
      const inputs=${JSON.stringify(assets)};
      const load=async key=>{const i=new Image();i.src='data:image/png;base64,'+inputs[key];await new Promise((r,j)=>{i.onload=r;i.onerror=j});return i};
      const imgs=Object.fromEntries(await Promise.all(Object.keys(inputs).map(async k=>[k,await load(k)])));
      const animals=[
        {kind:'snail',label:'AMETHYST SOFTSHELL',before:imgs.oldSnail,oldCrop:(f)=>[28+f*74,52,74,77],refs:['snailFront','snailSide','snailRear']},
        {kind:'fox_kit',label:'COPPERFUR FOX KIT',before:imgs.oldFox,oldCrop:(f)=>[f*224,15,224,225],refs:['foxFront','foxSide','foxRear']},
        {kind:'crab',label:'FRESHWATER PINCHER',before:imgs.oldCrab,oldCrop:(f)=>[f*336,94,336,270],refs:['crabFront','crabSide','crabRear']},
      ];
      const labels=Array.from({length:8},(_,i)=>'view '+i),cell=112,rowH=360;
      const canvas=document.createElement('canvas');canvas.width=2240;canvas.height=90+rowH*3;
      const c=canvas.getContext('2d');c.imageSmoothingEnabled=false;c.fillStyle='#102d24';c.fillRect(0,0,canvas.width,canvas.height);
      c.fillStyle='#f1e3c0';c.font='bold 20px system-ui';c.fillText('Wildlife art sample · BEFORE / AFTER / SOURCE · unapproved study',18,30);
      c.font='11px system-ui';c.fillStyle='#a7c4b0';c.fillText('Electron runtime subject.draw · muted capture · native Wildbound scale and eight facings',18,51);
      for(let a=0;a<animals.length;a++){
        const item=animals[a],subject=CREATURE_PACK.subjects[item.kind],model=subject.defaults(),y=70+a*rowH;
        c.fillStyle=a%2?'#14362c':'#163a2f';c.fillRect(0,y,canvas.width,rowH-5);
        c.fillStyle='#f3e5c3';c.font='bold 14px system-ui';c.fillText(item.label,12,y+20);
        c.fillStyle='#e2c996';c.font='10px system-ui';c.fillText('BEFORE',12,y+48);c.fillText('AFTER',12,y+168);
        for(let f=0;f<8;f++){
          const x=32+f*cell; c.textAlign='center';c.font='9px system-ui';c.fillStyle='#a9d3b7';c.fillText(labels[f],x+cell/2,y+42);
          const [sx,sy,sw,sh]=item.oldCrop(f);
          c.drawImage(item.before,sx,sy,sw,sh,x+5,y+53,cell-10,98);
          c.save();c.translate(x+cell/2,y+258);c.scale(2.3,2.3);
          subject.draw(c,{id:'review-'+item.kind+'-'+f,kind:item.kind,sprite:item.kind,x:0,y:0,faceX:Math.sin(f*Math.PI/4),faceY:-Math.cos(f*Math.PI/4),state:'idle',animationAction:'idle',playerFrame:0,moving:false,hp:100,maxHp:100,equipment:{}},0,model);
          c.restore();
          c.textAlign='center';c.font='9px system-ui';c.fillStyle='#a9d3b7';c.fillText(labels[f],x+cell/2,y+317);
        }
        c.textAlign='left';c.fillStyle='#e2c996';c.font='10px system-ui';c.fillText('SOURCE REFERENCE',950,y+45);
        for(let i=0;i<3;i++){
          const x=950+i*420,ref=imgs[item.refs[i]];
          c.fillStyle='#d8c99f';c.font='9px system-ui';c.fillText(['FRONT','SIDE','REAR'][i],x,y+60);
          c.drawImage(ref,x,y+66,400,200);
        }
      }
      return canvas.toDataURL('image/png').split(',')[1];
    })()`);
    if(errors.length) throw Error(errors.join('\n'));
    const dest=path.join(out,'wildlife-focused-before-after-reference.png');
    fs.writeFileSync(dest,Buffer.from(png,'base64'));
    console.log(JSON.stringify({dest,renderer:'muted Electron · actual wildlife subject.draw',errors:errors.length}));
  } catch (e) { console.error(e.stack||e); process.exitCode=1; }
  finally { window.destroy(); app.quit(); }
});
