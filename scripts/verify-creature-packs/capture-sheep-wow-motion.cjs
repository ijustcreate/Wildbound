const { app, BrowserWindow } = require('electron');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');

const root = path.resolve(__dirname, '../..');
const output = path.join(root, 'test-output/sheep-wow-motion-transfer');
fs.mkdirSync(output, { recursive: true });
app.disableHardwareAcceleration();
app.commandLine.appendSwitch('mute-audio');
app.setPath('userData', fs.mkdtempSync(path.join(os.tmpdir(), 'wildbound-sheep-motion-')));

app.whenReady().then(async () => {
  const win = new BrowserWindow({ show:false, width:1600, height:1000, webPreferences:{offscreen:true,backgroundThrottling:false} });
  win.webContents.setAudioMuted(true);
  const errors=[];
  win.webContents.on('console-message',(_event,level,message)=>{if(level>=3)errors.push(message);});
  try {
    await win.loadFile(path.join(root,'index.html'),{query:{tools:'1'}});
    await win.webContents.executeJavaScript(`Promise.race([window.wildboundBoot.ready,new Promise((_,reject)=>setTimeout(()=>reject(Error('boot timeout')),30000))])`);
    const data=await win.webContents.executeJavaScript(`(async()=>{
      const {CREATURE_PACK}=await import('./src/creature-packs/wildlife.mjs');
      const subject=CREATURE_PACK.subjects.sheep,after=subject.defaults(),before=subject.defaults();
      // The pre-transfer routing used native graze for a walking sheep and
      // native bound for a running sheep. Preserve those exact clip objects.
      const directions=['S','SW','W','NW','N','NE','E','SE'];
      const phases=[0,.25,.5,.75];
      const render=(model,mode)=>{
        const canvas=document.createElement('canvas');canvas.width=936;canvas.height=868;
        const c=canvas.getContext('2d');c.imageSmoothingEnabled=false;c.fillStyle='#10271f';c.fillRect(0,0,canvas.width,canvas.height);
        c.fillStyle='#f1e4c8';c.font='bold 16px system-ui';c.fillText(mode==='before'?'BEFORE · NATIVE GAME CLIPS':'AFTER · WOWHEAD STAND / WALK / RUN',12,23);
        c.fillStyle='#afc4b7';c.font='10px system-ui';c.fillText('Same current editable pixels · same scale · Electron renderer muted · 8 facings × 4 clip phases',12,41);
        for(let d=0;d<8;d++){c.fillStyle='#d9cba9';c.font='bold 11px system-ui';c.textAlign='center';c.fillText(directions[d],105+d*103,61);}
        const clips=mode==='before'?[['idle','IDLE'],['graze','WALK → GRAZE'],['bound','RUN → BOUND']]:[['freeze','STAND'],['walk','WALK'],['run','RUN']];
        for(let actionIndex=0;actionIndex<clips.length;actionIndex++){
          const [action,label]=clips[actionIndex],clip=model.clips[action];
          for(let p=0;p<4;p++){
            const y=82+(actionIndex*4+p)*64,frame=Math.round(phases[p]*Math.max(0,clip.length-1));
            c.textAlign='left';c.fillStyle='#9bc9aa';c.font='bold 9px system-ui';c.fillText(label+' · '+Math.round(phases[p]*100)+'%',8,y+28);
            c.textAlign='center';
            for(let d=0;d<8;d++){
              const a={id:'sheep-'+mode+'-'+action+'-'+p+'-'+d,kind:'sheep',sprite:'sheep',x:0,y:0,
                faceX:Math.sin(d*Math.PI/4),faceY:-Math.cos(d*Math.PI/4),state:action,animationAction:action,
                playerFrame:frame,moving:action!=='idle'&&action!=='freeze',step:frame*14,equipment:{}};
              c.save();c.translate(105+d*103,y+41);c.scale(1.15,1.15);subject.draw(c,a,0,model);c.restore();
            }
            c.strokeStyle='#254438';c.beginPath();c.moveTo(92,y+62);c.lineTo(925,y+62);c.stroke();
          }
        }
        return canvas.toDataURL('image/png').split(',')[1];
      };
      const beforeBoard=render(before,'before'),afterBoard=render(after,'after');
      const motion=document.createElement('canvas');motion.width=1280;motion.height=560;
      const m=motion.getContext('2d');m.imageSmoothingEnabled=false;m.fillStyle='#10271f';m.fillRect(0,0,motion.width,motion.height);
      m.fillStyle='#f1e4c8';m.font='bold 18px system-ui';m.fillText('MUTED ELECTRON · SHEEP DONOR CLIPS · EIGHT FACINGS · UNAPPROVED DRAFT',16,28);
      m.fillStyle='#b4c8ba';m.font='12px system-ui';m.fillText('Columns S / SW / W / NW / N / NE / E / SE · each row samples 0 / 25 / 50 / 75% of the actual converted clip.',16,48);
      for(let r=0;r<3;r++){
        const action=['freeze','walk','run'][r],clip=after.clips[action],frame=Math.round(.5*Math.max(0,clip.length-1));
        m.fillStyle='#d9cba9';m.font='bold 12px system-ui';m.fillText(['STAND · SOURCE ID 0','WALK · SOURCE ID 4','RUN · SOURCE ID 5'][r],16,90+r*150);
        for(let d=0;d<8;d++){
          m.fillStyle='#aabdae';m.textAlign='center';m.font='11px system-ui';m.fillText(directions[d],100+d*145,80+r*150);
          const a={id:'sheep-motion-'+action+'-'+d,kind:'sheep',sprite:'sheep',x:0,y:0,faceX:Math.sin(d*Math.PI/4),faceY:-Math.cos(d*Math.PI/4),state:action,animationAction:action,playerFrame:frame,moving:action!=='freeze',step:frame*14,equipment:{}};
          m.save();m.translate(100+d*145,160+r*150);m.scale(1.65,1.65);subject.draw(m,a,0,after);m.restore();
        }
      }
      return {beforeBoard,afterBoard,motion,source:{npc:61170,fileDataId:1377131},muted:true,errors:[]};
    })()`);
    if(errors.length) throw Error(errors.join('\n'));
    fs.writeFileSync(path.join(output,'before-native-eight-directions.png'),Buffer.from(data.beforeBoard,'base64'));
    fs.writeFileSync(path.join(output,'after-wowhead-eight-directions.png'),Buffer.from(data.afterBoard,'base64'));
    const motion=await win.webContents.executeJavaScript(`(async()=>{
      const {CREATURE_PACK}=await import('./src/creature-packs/wildlife.mjs');const s=CREATURE_PACK.subjects.sheep,m=s.defaults();
      const canvas=document.createElement('canvas');canvas.width=1280;canvas.height=560;const c=canvas.getContext('2d');c.imageSmoothingEnabled=false;c.fillStyle='#10271f';c.fillRect(0,0,1280,560);
      c.fillStyle='#f1e4c8';c.font='bold 18px system-ui';c.fillText('MUTED ELECTRON · SHEEP DONOR CLIPS · EIGHT FACINGS · UNAPPROVED DRAFT',16,28);
      c.fillStyle='#b4c8ba';c.font='12px system-ui';c.fillText('Columns S / SW / W / NW / N / NE / E / SE · mid-cycle pose · current editable Sheep art.',16,48);
      const dirs=['S','SW','W','NW','N','NE','E','SE'];for(let r=0;r<3;r++){const action=['freeze','walk','run'][r],clip=m.clips[action],frame=Math.round(.5*Math.max(0,clip.length-1));c.fillStyle='#d9cba9';c.font='bold 12px system-ui';c.fillText(['STAND · SOURCE ID 0','WALK · SOURCE ID 4','RUN · SOURCE ID 5'][r],16,90+r*150);for(let d=0;d<8;d++){c.fillStyle='#aabdae';c.textAlign='center';c.font='11px system-ui';c.fillText(dirs[d],100+d*145,80+r*150);const a={id:'sheep-preview-'+action+'-'+d,kind:'sheep',sprite:'sheep',x:0,y:0,faceX:Math.sin(d*Math.PI/4),faceY:-Math.cos(d*Math.PI/4),state:action,animationAction:action,playerFrame:frame,moving:action!=='freeze',step:frame*14,equipment:{}};c.save();c.translate(100+d*145,160+r*150);c.scale(1.65,1.65);s.draw(c,a,0,m);c.restore();}}return canvas.toDataURL('image/png').split(',')[1];})()`);
    fs.writeFileSync(path.join(output,'muted-electron-motion-preview.png'),Buffer.from(motion,'base64'));
    fs.writeFileSync(path.join(output,'capture.json'),JSON.stringify({sourceNpc:61170,fileDataId:1377131,renderer:'muted Electron; wildlife pack subject.draw',audioMuted:true,facings:8,phases:[0,.25,.5,.75],sourceClips:['Stand','Walk','Run'],sourceReferences:'test-output/modelviewer-references/61170-sheep-stand-{front,side,rear,opposite}.png',errors},null,2));
    console.log(JSON.stringify({output,renderer:'muted Electron',audioMuted:true,facings:8,phases:[0,.25,.5,.75],errors:0}));
  } catch(error) { console.error(error.stack||error);process.exitCode=1; }
  finally { win.destroy();app.quit(); }
});
