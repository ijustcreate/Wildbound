const { app, BrowserWindow } = require('electron');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');

const root = path.resolve(__dirname, '../..');
const output = path.join(root, 'test-output/wow-motion-audit');
fs.mkdirSync(output, { recursive: true });
app.disableHardwareAcceleration();
app.commandLine.appendSwitch('mute-audio');
app.setPath('userData', fs.mkdtempSync(path.join(os.tmpdir(), 'wildbound-blinky-motion-')));

app.whenReady().then(async () => {
  const window = new BrowserWindow({ show: false, width: 1360, height: 1650, webPreferences: { offscreen: true, backgroundThrottling: false } });
  window.webContents.setAudioMuted(true);
  const errors = [];
  window.webContents.on('console-message', (_event, level, message) => { if (level >= 3) errors.push(message); });
  try {
    await window.loadFile(path.join(root, 'index.html'), { query: { tools: '1' } });
    await window.webContents.executeJavaScript(`Promise.race([window.wildboundBoot.ready,new Promise((_,reject)=>setTimeout(()=>reject(Error('boot timeout')),30000))])`);
    const result = await window.webContents.executeJavaScript(`(async()=>{
      const { CREATURE_PACK } = await import('./src/creature-packs/eldritch.mjs');
      const subject=CREATURE_PACK.subjects.butterfly_dragon,model=subject.defaults(),dirs=['S','SW','W','NW','N','NE','E','SE'];
      const phases=[0,.25,.5,.75],actions=[['idle',phases],['walk',phases],['run',phases],['breath',phases],['fly',phases]];
      const width=1360,height=1510,cellW=140,cellH=70,canvas=document.createElement('canvas');canvas.width=width;canvas.height=height;
      const c=canvas.getContext('2d');c.imageSmoothingEnabled=false;c.fillStyle='#10271f';c.fillRect(0,0,width,height);
      c.fillStyle='#e8d8ad';c.font='bold 20px system-ui';c.fillText('BLINKY / BUTTERFLY DRAGON · WOWHEAD NPC 179589 · FILEDATAID 4080510',16,28);
      c.fillStyle='#a9c3b5';c.font='12px system-ui';c.fillText('Donor Stand / Walk / Run / AttackUnarmed; native Wildbound fly retained because source ID 135 aliases back to Run · muted Electron renderer',16,47);
      for(let d=0;d<8;d++){c.fillStyle='#d6c89f';c.font='bold 12px system-ui';c.textAlign='center';c.fillText(dirs[d],210+d*cellW,67);}
      for(let a=0;a<actions.length;a++) for(let p=0;p<actions[a][1].length;p++){
        const [action,values]=actions[a],phase=values[p],row=a*values.length+p,y=84+row*cellH;
        c.textAlign='left';c.fillStyle='#94c9a8';c.font='bold 11px system-ui';c.fillText(action.toUpperCase()+' · '+Math.round(phase*100)+'%',16,y+36);
        for(let d=0;d<8;d++){
          const angle=d*Math.PI/4,x=210+d*cellW+cellW/2;
          c.save();c.translate(x,y+25);c.scale(.72,.72);
          subject.draw(c,{id:'blinky-wow-motion-'+action+'-'+d+'-'+p,kind:'butterfly_dragon',x:0,y:0,faceX:-Math.sin(angle),faceY:Math.cos(angle),state:action==='breath'?'windup':action==='idle'?'idle':'hunt',animationAction:action,playerFrame:Math.floor(phase*Math.max(0,model.clips[action].length-1)),moving:action==='walk'||action==='run'},0,model);
          c.restore();
        }
        c.strokeStyle='#23463a';c.beginPath();c.moveTo(12,y+cellH-2);c.lineTo(width-12,y+cellH-2);c.stroke();
      }
      return canvas.toDataURL('image/png').split(',')[1];
    })()`);
    if (errors.length) throw Error(errors.join('\n'));
    const imagePath = path.join(output, 'blinky-wowhead-motion-eight-directions.png');
    fs.writeFileSync(imagePath, Buffer.from(result, 'base64'));
    console.log(JSON.stringify({ image: imagePath, renderer: 'muted Electron, CREATURE_PACK.subject.draw', audioMuted: true, sourceClips: ['Stand', 'Walk', 'Run', 'AttackUnarmed'], nativeClip: 'fly', facings: 8, rendererErrors: errors.length }));
  } catch (error) { console.error(error.stack || error); process.exitCode = 1; }
  finally { window.destroy(); app.quit(); }
});
