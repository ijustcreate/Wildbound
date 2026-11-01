const { app, BrowserWindow } = require('electron');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');

const root = path.resolve(__dirname, '../..');
const out = path.join(root, 'test-output/wildlife-batch2-review');
const stage = process.env.WILDLIFE_BATCH2_STAGE || 'before';
const targets = [
  { kind: 'squirrel', label: 'Squirrel · bushy climbing tail' },
  { kind: 'sheep', label: 'Sheep · dense wool coat' },
  { kind: 'turkey', label: 'Turkey · broad fan and red wattle' },
];
const directions = ['S', 'SW', 'W', 'NW', 'N', 'NE', 'E', 'SE'];
fs.mkdirSync(out, { recursive: true });
app.disableHardwareAcceleration();
app.commandLine.appendSwitch('mute-audio');
app.setPath('userData', fs.mkdtempSync(path.join(os.tmpdir(), 'wildbound-wildlife-batch2-')));

app.whenReady().then(async () => {
  const win = new BrowserWindow({ show: false, width: 1440, height: 960,
    webPreferences: { offscreen: true, backgroundThrottling: false } });
  win.webContents.setAudioMuted(true);
  const errors = [];
  win.webContents.on('console-message', (_event, level, message) => { if (level >= 3) errors.push(message); });
  try {
    await win.loadFile(path.join(root, 'index.html'), { query: { tools: '1' } });
    await win.webContents.executeJavaScript(`Promise.race([window.wildboundBoot.ready,new Promise((_,reject)=>setTimeout(()=>reject(Error('boot timeout')),30000))])`);
    const before = stage === 'after' ? JSON.parse(fs.readFileSync(path.join(out, 'before.json'), 'utf8')) : null;
    const payload = await win.webContents.executeJavaScript(`(async()=>{
      const {CREATURE_PACK}=await import('./src/creature-packs/wildlife.mjs');
      const targets=${JSON.stringify(targets)},directions=${JSON.stringify(directions)};
      const result=[];
      for(const target of targets){
        const subject=CREATURE_PACK.subjects[target.kind],model=subject.defaults();
        const canvas=document.createElement('canvas');canvas.width=1120;canvas.height=250;
        const c=canvas.getContext('2d');c.imageSmoothingEnabled=false;c.fillStyle='#10271f';c.fillRect(0,0,canvas.width,canvas.height);
        c.fillStyle='#f2e4c4';c.font='bold 16px system-ui';c.fillText(target.label+' · '+${JSON.stringify(stage==='before'?'BEFORE':'AFTER')}+' · runtime art · '+directions.length+' views',12,20);
        c.fillStyle='#cbb991';c.font='bold 10px system-ui';c.fillText('NATIVE GAME SCALE',12,53);c.fillText('NEAREST-NEIGHBOR 2.3×',12,170);
        for(let f=0;f<8;f++){
          const a=f*Math.PI/4,actor={id:'batch2-'+target.kind+'-'+f,kind:target.kind,sprite:target.kind,x:0,y:0,faceX:Math.sin(a),faceY:-Math.cos(a),state:'idle',animationAction:'idle',playerFrame:0,moving:false,hp:100,maxHp:100,equipment:{}};
          const x=95+f*128;c.fillStyle='#a9d3b7';c.font='10px system-ui';c.textAlign='center';c.fillText(directions[f],x,46);
          c.save();c.translate(x,116);subject.draw(c,actor,0,model);c.restore();
          c.save();c.translate(x,229);c.scale(2.3,2.3);subject.draw(c,actor,0,model);c.restore();
        }
        c.textAlign='left';result.push({kind:target.kind,png:canvas.toDataURL('image/png').split(',')[1]});
      }
      return result;
    })()`);
    if (errors.length) throw new Error(errors.join('\n'));
    for (const item of payload) fs.writeFileSync(path.join(out, `${item.kind}-${stage}.png`), Buffer.from(item.png, 'base64'));
    if (stage === 'before') fs.writeFileSync(path.join(out, 'before.json'), JSON.stringify(payload, null, 2));
    else {
      const card = await win.webContents.executeJavaScript(`(async()=>{
        const before=${JSON.stringify(before)};
        const after=${JSON.stringify(payload)};
        const targets=${JSON.stringify(targets)};
        const canvas=document.createElement('canvas');canvas.width=2280;canvas.height=910;
        const c=canvas.getContext('2d');c.imageSmoothingEnabled=false;c.fillStyle='#10271f';c.fillRect(0,0,canvas.width,canvas.height);
        c.fillStyle='#f2e4c4';c.font='bold 21px system-ui';c.fillText('WILDLIFE ART STUDY · BEFORE / AFTER · UNAPPROVED',18,28);
        c.fillStyle='#a9c3b5';c.font='12px system-ui';c.fillText('Same runtime renderer, pose, directions and scale. Left is the preserved baseline; right is the draft.',18,50);
        for(let i=0;i<targets.length;i++){
          const top=68+i*278;c.fillStyle=i%2?'#17372e':'#153329';c.fillRect(12,top,2256,270);
          c.fillStyle='#f2e4c4';c.font='bold 16px system-ui';c.fillText(targets[i].label,20,top+20);
          for(const [side,items,x0] of [['BEFORE',before,16],['AFTER',after,1156]]){
            const image=new Image();image.src='data:image/png;base64,'+items[i].png;await new Promise((r,j)=>{image.onload=r;image.onerror=j});
            c.fillStyle='#e2c996';c.font='bold 10px system-ui';c.fillText(side,x0,top+40);c.drawImage(image,x0,top+45,1120,220);
          }
        }
        return canvas.toDataURL('image/png').split(',')[1];
      })()`);
      fs.writeFileSync(path.join(out, 'before-after.png'), Buffer.from(card, 'base64'));
    }
    console.log(JSON.stringify({ stage, output: out, renderer: 'muted Electron WildlifePack subject.draw', directions: 8, errors: 0 }));
  } catch (error) { console.error(error.stack || error); process.exitCode = 1; }
  finally { win.destroy(); app.quit(); }
});
