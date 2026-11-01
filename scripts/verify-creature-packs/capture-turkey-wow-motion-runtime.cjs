const { app, BrowserWindow } = require('electron');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');

const root = path.resolve(__dirname, '../..');
const output = path.join(root, 'test-output/turkey-wow-motion-runtime');
fs.mkdirSync(output, { recursive: true });
app.disableHardwareAcceleration();
app.commandLine.appendSwitch('mute-audio');
app.setPath('userData', fs.mkdtempSync(path.join(os.tmpdir(), 'wildbound-turkey-motion-draft-')));

app.whenReady().then(async () => {
  const win = new BrowserWindow({ show: false, width: 1760, height: 1500, webPreferences: { offscreen: true, backgroundThrottling: false } });
  win.webContents.setAudioMuted(true);
  const errors = [];
  win.webContents.on('console-message', (_event, level, message) => { if (level >= 3) errors.push(message); });
  try {
    await win.loadFile(path.join(root, 'index.html'), { query: { tools: '1' } });
    await win.webContents.executeJavaScript(`Promise.race([window.wildboundBoot.ready,new Promise((_,reject)=>setTimeout(()=>reject(Error('boot timeout')),30000))])`);
    const rendered = await win.webContents.executeJavaScript(`(async()=>{
      const {CREATURE_PACK}=await import('./src/creature-packs/wildlife.mjs');
      const {poseAt}=await import('./src/player-motion.mjs');
      const subject=CREATURE_PACK.subjects.turkey,model=subject.defaults();
      const dirs=['S','SW','W','NW','N','NE','E','SE'];
      const phases=[0,.25,.5,.75];
      const rows=[
        {label:'PREVIOUS IDLE ACTION / INTEGRATED DONOR STAND',before:'peck',after:'idle'},
        {label:'NATIVE STRUT / SELECTED SLOW-WALK FALLBACK',before:'strut',after:'strut'},
        {label:'NATIVE STRUT / DONOR WALK CANDIDATE (UNROUTED)',before:'strut',after:'wowhead-walk'},
        {label:'NATIVE FLAP-RUN PRESERVED / RUNTIME',before:'flap-run',after:'flap-run'},
        {label:'NATIVE FLAP-ATTACK PRESERVED / RUNTIME',before:'flap-attack',after:'flap-attack'},
        {label:'NATIVE DEATH PRESERVED / RUNTIME',before:'death',after:'death'},
      ];
      const canvas=document.createElement('canvas');canvas.width=1760;canvas.height=1740;
      const c=canvas.getContext('2d');c.imageSmoothingEnabled=false;c.fillStyle='#10271f';c.fillRect(0,0,canvas.width,canvas.height);
      c.fillStyle='#f1e4c8';c.font='bold 20px system-ui';c.fillText('TURKEY · WOWHEAD STAND/WALK RUNTIME INTEGRATION · UNAPPROVED',16,29);
      c.fillStyle='#b4c8ba';c.font='13px system-ui';c.fillText('Native pixel art and rig · muted Electron renderer · 8 facings × four clip phases · non-locomotion actions stay native',16,50);
      for(let panel=0;panel<2;panel++){
        const x0=panel*880;
        c.fillStyle='#dfcfaa';c.font='bold 15px system-ui';c.fillText(panel===0?'NATIVE / PREVIOUS FALLBACK ACTIONS':'INTEGRATED RUNTIME ACTIONS',x0+12,78);
        for(let d=0;d<8;d++){c.fillStyle='#bacbbd';c.font='bold 10px system-ui';c.textAlign='center';c.fillText(dirs[d],x0+130+d*91,99);}
        rows.forEach((row,r)=>{
          const top=111+r*266;
          c.textAlign='left';c.fillStyle='#d9cba9';c.font='bold 11px system-ui';c.fillText(row.label,x0+12,top+15);
          phases.forEach((phase,p)=>{
            const y=top+24+p*56;
            c.fillStyle='#91b49f';c.font='9px system-ui';c.fillText(Math.round(phase*100)+'%',x0+13,y+29);
            for(let d=0;d<8;d++){
              const action=panel===0?row.before:row.after,clip=model.clips[action];
              const frame=Math.round(phase*Math.max(0,clip.length-1));
              const actor={id:'turkey-draft-'+panel+'-'+r+'-'+p+'-'+d,kind:'turkey',sprite:'turkey',x:0,y:0,
                faceX:Math.sin(d*Math.PI/4),faceY:-Math.cos(d*Math.PI/4),state:action,animationAction:action,
                playerFrame:frame,moving:!['idle','death','peck'].includes(action),step:frame*11,equipment:{}};
              c.save();c.translate(x0+130+d*91,y+36);c.scale(1.28,1.28);subject.draw(c,actor,0,model);c.restore();
            }
          });
          c.strokeStyle='#254438';c.beginPath();c.moveTo(x0+8,top+252);c.lineTo(x0+870,top+252);c.stroke();
        });
      }
      const preview=document.createElement('canvas');preview.width=1460;preview.height=950;
      const m=preview.getContext('2d');m.imageSmoothingEnabled=false;m.fillStyle='#10271f';m.fillRect(0,0,preview.width,preview.height);
      m.fillStyle='#f1e4c8';m.font='bold 19px system-ui';m.fillText('TURKEY · INTEGRATED RUNTIME CLIP MID-CYCLE · UNAPPROVED',16,28);
      m.fillStyle='#b4c8ba';m.font='12px system-ui';m.fillText('Current editable game rig · eight facings · donor Stand and native actions; donor Walk shown as an unrouted candidate.',16,50);
      for(let r=0;r<6;r++){
        const action=rows[r].after,clip=model.clips[action],frame=Math.round(.5*Math.max(0,clip.length-1));
        m.fillStyle='#d9cba9';m.font='bold 11px system-ui';m.fillText(rows[r].label,14,92+r*140);
        for(let d=0;d<8;d++){
          m.fillStyle='#aabdae';m.textAlign='center';m.font='10px system-ui';m.fillText(dirs[d],104+d*165,76+r*140);
          const actor={id:'turkey-runtime-'+action+'-'+d,kind:'turkey',sprite:'turkey',x:0,y:0,faceX:Math.sin(d*Math.PI/4),faceY:-Math.cos(d*Math.PI/4),state:action,animationAction:action,playerFrame:frame,moving:!['idle','death'].includes(action),step:frame*14,equipment:{}};
          m.save();m.translate(104+d*165,126+r*140);m.scale(1.65,1.65);subject.draw(m,actor,0,model);m.restore();
        }
      }
      const donorWalkMinFootZ=Math.min(...Array.from({length:model.clips['wowhead-walk'].length},(_,frame)=>{const pose=poseAt(model,'wowhead-walk',frame);return Math.min(pose.footL[2],pose.footR[2]);}));
      return {comparison:canvas.toDataURL('image/png').split(',')[1],preview:preview.toDataURL('image/png').split(',')[1],donorWalkMinFootZ,lengths:Object.fromEntries(['idle','strut','wowhead-walk','peck','flap-run','flap-attack','hurt','death'].map(name=>[name,model.clips[name]?.length||0]))};
    })()`);
    if (errors.length) throw Error(errors.join('\n'));
    fs.writeFileSync(path.join(output, 'before-after-eight-facings.png'), Buffer.from(rendered.comparison, 'base64'));
    fs.writeFileSync(path.join(output, 'runtime-eight-facings.png'), Buffer.from(rendered.preview, 'base64'));
    fs.writeFileSync(path.join(output, 'capture.json'), JSON.stringify({sourceNpc:62648,fileDataId:126278,renderer:'muted Electron; integrated WildlifePack subject.draw; subject default copy',audioMuted:true,facings:8,phases:[0,.25,.5,.75],donorWalkMinFootZ:rendered.donorWalkMinFootZ,clips:rendered.lengths,errors}, null, 2));
    console.log(JSON.stringify({output,renderer:'muted Electron',audioMuted:true,facings:8,phases:[0,.25,.5,.75],errors:0,clips:rendered.lengths}, null, 2));
  } catch (error) { console.error(error.stack || error); process.exitCode = 1; }
  finally { win.destroy(); app.quit(); }
});
