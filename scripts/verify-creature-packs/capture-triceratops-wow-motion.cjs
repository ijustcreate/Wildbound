const { app, BrowserWindow } = require('electron');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');

const root = path.resolve(__dirname, '../..');
const output = path.join(root, 'test-output/jammer-wow-motion-runtime');
fs.mkdirSync(output, { recursive: true });
app.disableHardwareAcceleration();
app.commandLine.appendSwitch('mute-audio');
app.setPath('userData', fs.mkdtempSync(path.join(os.tmpdir(), 'wildbound-jammer-motion-')));

app.whenReady().then(async () => {
  const win = new BrowserWindow({ show: false, width: 1500, height: 1250, webPreferences: { offscreen: true, backgroundThrottling: false } });
  win.webContents.setAudioMuted(true);
  const errors = [];
  win.webContents.on('console-message', (_event, level, message) => { if (level >= 3) errors.push(message); });
  try {
    await win.loadFile(path.join(root, 'index.html'), { query: { tools: '1' } });
    await win.webContents.executeJavaScript(`Promise.race([window.wildboundBoot.ready,new Promise((_,reject)=>setTimeout(()=>reject(Error('boot timeout')),30000))])`);
    const image = await win.webContents.executeJavaScript(`(async()=>{
      const {CREATURE_PACK}=await import('./src/creature-packs/wildlife.mjs');
      const subject=CREATURE_PACK.subjects.triceratops,model=subject.defaults(),dirs=['S','SW','W','NW','N','NE','E','SE'];
      const rows=[['wowhead-idle',.5],['wowhead-walk',.25],['wowhead-walk',.5],['wowhead-walk',.75],['wowhead-run',.5],['wowhead-attack',.5]];
      const canvas=document.createElement('canvas');canvas.width=1500;canvas.height=1010;const c=canvas.getContext('2d');c.imageSmoothingEnabled=false;c.fillStyle='#10271f';c.fillRect(0,0,canvas.width,canvas.height);
      c.fillStyle='#f1e4c8';c.font='bold 20px system-ui';c.fillText('JAMMER · WOWHEAD MOTION · UNAPPROVED',16,28);
      c.fillStyle='#b4c8ba';c.font='13px system-ui';c.fillText('Native Wildbound pixel rig · muted Electron renderer · 8 facings · Stand / Walk / Run / AttackUnarmed',16,50);
      for(let d=0;d<8;d++){c.fillStyle='#bacbbd';c.font='bold 11px system-ui';c.textAlign='center';c.fillText(dirs[d],140+d*172,78)}
      rows.forEach(([action,phase],r)=>{
        const top=90+r*150,clip=model.clips[action],frame=Math.round(phase*(clip.length-1));
        c.textAlign='left';c.fillStyle='#d9cba9';c.font='bold 12px system-ui';c.fillText(action+' · '+Math.round(phase*100)+'%',14,top+17);
        for(let d=0;d<8;d++){const actor={id:'jammer-'+r+'-'+d,kind:'triceratops',sprite:'triceratops',x:0,y:0,faceX:Math.sin(d*Math.PI/4),faceY:-Math.cos(d*Math.PI/4),state:action,animationAction:action,playerFrame:frame,moving:action.includes('walk')||action.includes('run'),step:frame*7,equipment:{}};c.save();c.translate(140+d*172,top+89);c.scale(1.6,1.6);subject.draw(c,actor,frame,model);c.restore()}
        c.strokeStyle='#254438';c.beginPath();c.moveTo(8,top+145);c.lineTo(1490,top+145);c.stroke();
      });
      return canvas.toDataURL('image/png').split(',')[1];
    })()`);
    if (errors.length) throw Error(errors.join('\n'));
    const target = path.join(output, 'eight-facings.png');
    fs.writeFileSync(target, Buffer.from(image, 'base64'));
    console.log(JSON.stringify({ output: target, renderer: 'muted Electron subject.draw', audioMuted: true, errors: 0 }));
  } catch (error) { console.error(error.stack || error); process.exitCode = 1; }
  finally { win.destroy(); app.quit(); }
});
