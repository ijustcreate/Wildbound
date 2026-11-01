const { app, BrowserWindow } = require('electron');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');

const root = path.resolve(__dirname, '../..');
const output = path.join(root, 'test-output/llama-wow-motion-transfer');
fs.mkdirSync(output, { recursive: true });
app.disableHardwareAcceleration();
app.commandLine.appendSwitch('mute-audio');
app.setPath('userData', fs.mkdtempSync(path.join(os.tmpdir(), 'wildbound-llama-motion-')));

app.whenReady().then(async () => {
  const win = new BrowserWindow({ show: false, width: 1200, height: 900, webPreferences: { offscreen: true, backgroundThrottling: false } });
  win.webContents.setAudioMuted(true);
  const errors = [];
  win.webContents.on('console-message', (_event, level, message) => { if (level >= 3) errors.push(message); });
  try {
    await win.loadFile(path.join(root, 'index.html'), { query: { tools: '1' } });
    await win.webContents.executeJavaScript(`Promise.race([window.wildboundBoot.ready,new Promise((_,reject)=>setTimeout(()=>reject(Error('boot timeout')),30000))])`);
    const result = await win.webContents.executeJavaScript(`(async()=>{
      const {CREATURE_PACK}=await import('./src/creature-packs/wildlife.mjs');
      const subject=CREATURE_PACK.subjects.llama,model=subject.defaults();
      const dirs=['S','SW','W','NW','N','NE','E','SE'],phases=[0,.25,.5,.75],clips=[['idle','STAND · DOTTIE ID 0'],['walk','WALK · DOTTIE ID 4'],['run','RUN · DOTTIE ID 5']];
      const sheets={};
      for(const [action,label] of clips){
        const canvas=document.createElement('canvas');canvas.width=1280;canvas.height=600;
        const c=canvas.getContext('2d');c.imageSmoothingEnabled=false;c.fillStyle='#10271f';c.fillRect(0,0,canvas.width,canvas.height);
        c.fillStyle='#f1e4c8';c.font='bold 18px system-ui';c.fillText('LLAMA · '+label+' · UNAPPROVED MOTION REVIEW',16,26);
        c.fillStyle='#b4c8ba';c.font='12px system-ui';c.fillText('Current Wildbound llama pixels and editable rig · muted Electron capture · four clip phases × all eight facings',16,47);
        for(let d=0;d<8;d++){c.fillStyle='#d9cba9';c.font='bold 12px system-ui';c.textAlign='center';c.fillText(dirs[d],115+d*145,68);}
        const clip=model.clips[action];
        for(let p=0;p<4;p++){
          const y=92+p*122,frame=Math.round(phases[p]*Math.max(0,clip.length-1));
          c.textAlign='left';c.fillStyle='#9bc9aa';c.font='bold 10px system-ui';c.fillText(Math.round(phases[p]*100)+'%',12,y+45);
          for(let d=0;d<8;d++){
            const actor={id:'llama-'+action+'-'+p+'-'+d,kind:'llama',sprite:'llama',x:0,y:0,faceX:Math.sin(d*Math.PI/4),faceY:-Math.cos(d*Math.PI/4),state:action,animationAction:action,playerFrame:frame,moving:action!=='idle',step:frame*14,equipment:{}};
            c.save();c.translate(115+d*145,y+88);c.scale(1.8,1.8);subject.draw(c,actor,0,model);c.restore();
          }
          c.strokeStyle='#254438';c.beginPath();c.moveTo(95,y+119);c.lineTo(1272,y+119);c.stroke();
        }
        sheets[action]=canvas.toDataURL('image/png').split(',')[1];
      }
      return {sheets,lengths:Object.fromEntries(clips.map(([action])=>[action,model.clips[action].length]))};
    })()`);
    if (errors.length) throw Error(errors.join('\n'));
    for (const [action, bytes] of Object.entries(result.sheets)) fs.writeFileSync(path.join(output, `${action}-eight-facings.png`), Buffer.from(bytes, 'base64'));
    fs.writeFileSync(path.join(output, 'capture.json'), JSON.stringify({ sourceNpc: 151788, fileDataId: 2734738, renderer: 'muted Electron; wildlife pack subject.draw', audioMuted: true, facings: ['S','SW','W','NW','N','NE','E','SE'], phases: [0,.25,.5,.75], clipLengths: result.lengths, errors }, null, 2));
    console.log(JSON.stringify({ output, renderer: 'muted Electron', audioMuted: true, facings: 8, phases: 4, errors: errors.length }, null, 2));
  } catch (error) { console.error(error.stack || error); process.exitCode = 1; }
  finally { win.destroy(); app.quit(); }
});
